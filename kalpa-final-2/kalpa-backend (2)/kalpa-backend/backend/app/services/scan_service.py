from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.db_models import Product, ScanLog


def write_scan_log(
    db: Session,
    product: Product,
    scan_type: str = "qr",
    scan_value: str | None = None,
) -> ScanLog:
    log = ScanLog(
        id=str(uuid4()),
        product_id=product.product_id,
        scan_type=scan_type,
        scan_value=scan_value or product.qr_code,
        scanned_at=datetime.now(timezone.utc).isoformat(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
