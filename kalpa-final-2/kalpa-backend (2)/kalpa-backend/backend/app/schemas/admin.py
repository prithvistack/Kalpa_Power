from pydantic import BaseModel, Field
from typing import Optional


class ProductCreateRequest(BaseModel):
    product_id: str
    qr_code: str
    type: str
    model: str
    location: str
    site: str
    manufacture_year: int
    installation_date: str
    status: str = "operational"
    warranty_expiry: str
    serial_number: Optional[str] = None
    power_rating: Optional[float] = None
    voltage: Optional[float] = None
    efficiency: Optional[float] = None
    extra_specs: Optional[str] = None


class ProductEventCreateRequest(BaseModel):
    product_id: str
    event_type: str
    date: str
    description: str
    technician: str
    cost: Optional[float] = None
    parts_replaced: Optional[str] = None


class GenerateQrRequest(BaseModel):
    qr_code: str = Field(examples=["KPL-QR-GEN-0001"])
    base_url: str = "https://kalpa.app/product"


class GenerateQrResponse(BaseModel):
    url: str
    qr_code: str
    png_base64: str
