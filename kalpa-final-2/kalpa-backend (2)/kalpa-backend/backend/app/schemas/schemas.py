from datetime import date
from pydantic import BaseModel
from typing import List, Optional


class ModelSpec(BaseModel):
    model_name: str
    product_type: str
    rated_power_kw: float
    efficiency_pct: float
    voltage_v: float
    current_a: float
    weight_kg: float
    cooling_type: str
    ip_rating: str

    class Config:
        from_attributes = True


class EventOut(BaseModel):
    id: str
    event_type: str
    event_date: date          # DATE column — was str
    description: Optional[str] = None
    parts_replaced: Optional[str] = None
    performed_by: Optional[str] = None
    cost_inr: Optional[float] = None

    class Config:
        from_attributes = True


class ProductDetailOut(BaseModel):
    product_id: str
    qr_code: str
    serial_number: str
    location: str
    site: str
    manufacture_year: int
    installation_date: Optional[date] = None   # DATE column — was Optional[str]
    status: str
    warranty_expiry: Optional[date] = None     # DATE column — was Optional[str]
    model: ModelSpec
    tags: List[str]
    last_maintenance: Optional[date] = None    # DATE column — was Optional[str]
    next_maintenance: Optional[date] = None    # DATE column — was Optional[str]
    notes: Optional[str] = None
    events: List[EventOut]

    class Config:
        from_attributes = True


class ProductSearchResult(BaseModel):
    product_id: str
    product_type: str
    location: str
    manufacture_year: int
    status: str
    tags: List[str]


class SearchResponse(BaseModel):
    results: List[ProductSearchResult]
    total: int


class SearchPayload(BaseModel):
    product_type: Optional[str] = None
    location: Optional[str] = None
    manufacture_year: Optional[int] = None
    maintenance_due: Optional[bool] = None
    recently_repaired: Optional[bool] = None
    limit: int = 50
    offset: int = 0


class FilterOptions(BaseModel):
    types: List[str]
    locations: List[str]
    years: List[int]


class IdentifyPayload(BaseModel):
    qr_code: Optional[str] = None
    product_id: Optional[str] = None
    search_text: Optional[str] = None


class NotificationOut(BaseModel):
    id: str
    type: str
    message: str
    product_id: Optional[str] = None
    read: bool
    timestamp: date            # DATE column — was str

    class Config:
        from_attributes = True


class NotificationListOut(BaseModel):
    notifications: List[NotificationOut]
    unread_count: int

    class Config:
        from_attributes = True
