"""
Bulk CSV import API.

POST /admin/import/csv  (admin-only)

Expected CSV columns:
  Required: product_id, qr_code, type, model, location, site, manufacture_year
  Optional: serial_number, installation_date, status, warranty_expiry,
            last_maintenance, next_maintenance, notes

Dates must be YYYY-MM-DD format or left blank.
"""

import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Any

from app.core.dependencies import require_role
from app.database.db import get_db
from app.models.db_models import Product, ProductModel
from app.models.user import User
from app.services.audit_service import AuditAction, log_action
from app.services.notification_service import create_product_notification

router = APIRouter(prefix="/admin", tags=["import"])

_REQUIRED = {"product_id", "qr_code", "type", "model", "location", "site", "manufacture_year"}
_VALID_STATUSES = {"operational", "faulty", "under_maintenance", "decommissioned"}


class ImportError(BaseModel):
    row: int
    field: str
    error: str


class ImportResult(BaseModel):
    total_rows: int
    imported: int
    skipped: int
    failed: int
    errors: list[ImportError]


def _model_id(model_name: str) -> str:
    return "MDL-" + "".join(ch if ch.isalnum() else "-" for ch in model_name.upper()).strip("-")[:40]


def _parse_date(value: str, field: str, row_num: int, errors: list) -> date | None:
    if not value or not value.strip():
        return None
    try:
        return date.fromisoformat(value.strip())
    except ValueError:
        errors.append(ImportError(row=row_num, field=field,
                                  error=f"Invalid date '{value}' — expected YYYY-MM-DD"))
        return None


def _validate_row(row: dict[str, str], row_num: int) -> list[ImportError]:
    errs: list[ImportError] = []
    for col in _REQUIRED:
        if not row.get(col, "").strip():
            errs.append(ImportError(row=row_num, field=col, error="Required field is missing"))
    if row.get("manufacture_year", "").strip():
        try:
            yr = int(row["manufacture_year"].strip())
            if not (1900 <= yr <= date.today().year + 1):
                errs.append(ImportError(row=row_num, field="manufacture_year",
                                        error=f"Year {yr} is out of range"))
        except ValueError:
            errs.append(ImportError(row=row_num, field="manufacture_year",
                                    error="Must be an integer year"))
    if row.get("status", "").strip() and row["status"].strip() not in _VALID_STATUSES:
        errs.append(ImportError(row=row_num, field="status",
                                error=f"Must be one of: {', '.join(sorted(_VALID_STATUSES))}"))
    return errs


@router.post("/import/csv", response_model=ImportResult, status_code=status.HTTP_200_OK)
async def import_csv(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    if not file.filename or not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")  # handles BOM from Excel
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(text))
    missing_cols = _REQUIRED - set(reader.fieldnames or [])
    if missing_cols:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns: {', '.join(sorted(missing_cols))}",
        )

    imported = 0
    skipped = 0
    all_errors: list[ImportError] = []
    rows = list(reader)

    for row_num, raw in enumerate(rows, start=2):  # row 1 = header
        # Validation
        row_errors = _validate_row(raw, row_num)
        if row_errors:
            all_errors.extend(row_errors)
            continue

        product_id  = raw["product_id"].strip()
        qr_code     = raw["qr_code"].strip()
        serial      = raw.get("serial_number", "").strip() or f"SN-{product_id}"
        ptype       = raw["type"].strip()
        model_name  = raw["model"].strip()
        location    = raw["location"].strip()
        site        = raw["site"].strip()
        mfg_year    = int(raw["manufacture_year"].strip())
        status_val  = raw.get("status", "operational").strip() or "operational"

        # Skip duplicates
        if db.query(Product).filter(
            (Product.product_id == product_id) | (Product.qr_code == qr_code)
        ).first():
            skipped += 1
            continue

        # Parse dates (collect errors but still try partial import)
        row_date_errors: list[ImportError] = []
        installation_date = _parse_date(raw.get("installation_date", ""), "installation_date", row_num, row_date_errors)
        warranty_expiry   = _parse_date(raw.get("warranty_expiry",   ""), "warranty_expiry",   row_num, row_date_errors)
        last_maintenance  = _parse_date(raw.get("last_maintenance",  ""), "last_maintenance",  row_num, row_date_errors)
        next_maintenance  = _parse_date(raw.get("next_maintenance",  ""), "next_maintenance",  row_num, row_date_errors)

        if row_date_errors:
            all_errors.extend(row_date_errors)
            continue

        # Create or reuse ProductModel
        mid = _model_id(model_name)
        model = db.query(ProductModel).filter(ProductModel.model_id == mid).first()
        if not model:
            model = ProductModel(
                model_id=mid,
                model_name=model_name,
                product_type=ptype,
                rated_power_kw=0,
                efficiency_pct=0,
                voltage_v=0,
                current_a=0,
                weight_kg=0,
                cooling_type="N/A",
                ip_rating="N/A",
            )
            db.add(model)
            db.flush()

        product = Product(
            product_id=product_id,
            qr_code=qr_code,
            serial_number=serial,
            location=location,
            site=site,
            manufacture_year=mfg_year,
            installation_date=installation_date,
            status=status_val,
            warranty_expiry=warranty_expiry,
            model_id=model.model_id,
            last_maintenance=last_maintenance,
            next_maintenance=next_maintenance,
            notes=raw.get("notes", "").strip() or None,
        )
        db.add(product)
        try:
            db.flush()
            imported += 1
        except Exception as exc:
            db.rollback()
            all_errors.append(ImportError(row=row_num, field="product_id",
                                          error=f"Database error: {exc}"))
            continue

    db.commit()

    # Notifications for imported products
    for row in rows[: imported + skipped]:
        pid = row.get("product_id", "").strip()
        if pid and not any(e.row <= imported + 1 for e in all_errors):
            try:
                create_product_notification(db, pid, f"Imported via CSV: {pid}")
            except Exception:
                pass

    result: dict[str, Any] = {
        "total_rows": len(rows),
        "imported": imported,
        "skipped": skipped,
        "failed": len(all_errors),
        "errors": all_errors,
    }

    log_action(
        AuditAction.CSV_IMPORT,
        user=current_user,
        entity_type="IMPORT",
        new={k: v for k, v in result.items() if k != "errors"},
        ip=request.client.host if request.client else None,
    )

    return ImportResult(**result)
