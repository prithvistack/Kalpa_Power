from pydantic import BaseModel
from typing import Optional


class ScanRequest(BaseModel):
    product_id: str
    scan_type: str = "qr"
    scan_value: Optional[str] = None


class ScanResponse(BaseModel):
    id: str
    product_id: str
    scanned_at: str
    status: str = "logged"
