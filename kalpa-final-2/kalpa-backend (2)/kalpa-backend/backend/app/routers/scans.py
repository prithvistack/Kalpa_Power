from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.database.db import get_db
from app.models.db_models import Product
from app.models.user import User
from app.schemas.scan import ScanRequest, ScanResponse
from app.services.scan_service import write_scan_log

router = APIRouter(tags=["scans"])


@router.post("/scan", response_model=ScanResponse)
def log_scan(
    payload: ScanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(
        or_(Product.product_id == payload.product_id, Product.qr_code == payload.product_id)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    log = write_scan_log(
        db=db,
        product=product,
        scan_type=payload.scan_type,
        scan_value=payload.scan_value,
    )
    return ScanResponse(id=log.id, product_id=product.product_id, scanned_at=log.scanned_at)
