import argparse
import csv
import json
import os
import sys
import uuid

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.db import SessionLocal, engine
from app.models.db_models import Base, Product, ProductEvent, ProductModel

Base.metadata.create_all(bind=engine)

PRODUCT_FIELDS = ["product_id", "qr_code", "type", "model", "location", "site", "manufacture_year", "installation_date", "status", "warranty_expiry"]
MODEL_FIELDS = ["model", "type", "power_rating", "voltage", "efficiency", "extra_specs"]
EVENT_FIELDS = ["product_id", "event_type", "date", "description", "technician", "cost"]


def model_id(name: str) -> str:
    return "MDL-" + "".join(ch if ch.isalnum() else "-" for ch in name.upper()).strip("-")[:40]


def read_csv(path: str, required: list[str]) -> tuple[list[dict], list[dict]]:
    good, bad = [], []
    if not os.path.exists(path):
        return good, [{"file": path, "error": "missing file"}]
    with open(path, newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        missing = [field for field in required if field not in (reader.fieldnames or [])]
        if missing:
            return good, [{"file": path, "error": f"missing headers: {', '.join(missing)}"}]
        for line_number, row in enumerate(reader, start=2):
            empty = [field for field in required if not (row.get(field) or "").strip()]
            if empty:
                bad.append({"file": path, "line": line_number, "error": f"missing values: {', '.join(empty)}"})
            else:
                good.append(row)
    return good, bad


def as_float(value: str | None, default: float = 0) -> float:
    if value in (None, ""):
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def run(data_dir: str, idempotent: bool = True) -> None:
    db = SessionLocal()
    summary = {"models": 0, "products": 0, "events": 0, "skipped": 0, "bad_rows": []}
    try:
        models, bad = read_csv(os.path.join(data_dir, "product_models.csv"), MODEL_FIELDS)
        summary["bad_rows"].extend(bad)
        for row in models:
            mid = model_id(row["model"])
            if idempotent and db.query(ProductModel).filter(ProductModel.model_id == mid).first():
                summary["skipped"] += 1
                continue
            extra = {}
            if row.get("extra_specs"):
                try:
                    extra = json.loads(row["extra_specs"])
                except json.JSONDecodeError:
                    extra = {}
            db.merge(ProductModel(
                model_id=mid,
                model_name=row["model"],
                product_type=row["type"],
                rated_power_kw=as_float(row.get("power_rating")),
                voltage_v=as_float(row.get("voltage")),
                efficiency_pct=as_float(row.get("efficiency")),
                current_a=as_float(extra.get("current_a")),
                weight_kg=as_float(extra.get("weight_kg")),
                cooling_type=str(extra.get("cooling_type", "N/A")),
                ip_rating=str(extra.get("ip_rating", "N/A")),
            ))
            summary["models"] += 1
        db.flush()

        products, bad = read_csv(os.path.join(data_dir, "products.csv"), PRODUCT_FIELDS)
        summary["bad_rows"].extend(bad)
        for row in products:
            if idempotent and db.query(Product).filter(Product.product_id == row["product_id"]).first():
                summary["skipped"] += 1
                continue
            mid = model_id(row["model"])
            if not db.query(ProductModel).filter(ProductModel.model_id == mid).first():
                db.add(ProductModel(model_id=mid, model_name=row["model"], product_type=row["type"]))
                db.flush()
            db.add(Product(
                product_id=row["product_id"],
                qr_code=row["qr_code"],
                serial_number=f"SN-{row['product_id']}",
                location=row["location"],
                site=row["site"],
                manufacture_year=int(row["manufacture_year"]),
                installation_date=row["installation_date"],
                status=row["status"],
                warranty_expiry=row["warranty_expiry"],
                model_id=mid,
            ))
            summary["products"] += 1
        db.flush()

        events, bad = read_csv(os.path.join(data_dir, "product_events.csv"), EVENT_FIELDS)
        summary["bad_rows"].extend(bad)
        for row in events:
            if not db.query(Product).filter(Product.product_id == row["product_id"]).first():
                summary["bad_rows"].append({"product_id": row["product_id"], "error": "unknown product"})
                continue
            db.add(ProductEvent(
                id=str(uuid.uuid4()),
                product_id=row["product_id"],
                event_type=row["event_type"],
                event_date=row["date"],
                description=row["description"],
                performed_by=row["technician"],
                cost_inr=as_float(row.get("cost"), None),
            ))
            summary["events"] += 1

        db.commit()
        print(json.dumps(summary, indent=2))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="data")
    parser.add_argument("--no-idempotent", action="store_true")
    args = parser.parse_args()
    run(args.data_dir, idempotent=not args.no_idempotent)
