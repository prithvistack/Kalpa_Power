from sqlalchemy import Column, String, Integer, Float, Boolean, Date, ForeignKey, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database.db import Base
import enum

class ProductModel(Base):
    __tablename__ = "product_models"

    model_id = Column(String, primary_key=True)
    model_name = Column(String, nullable=False)
    product_type = Column(String, nullable=False)
    rated_power_kw = Column(Float)
    efficiency_pct = Column(Float)
    voltage_v = Column(Float)
    current_a = Column(Float)
    weight_kg = Column(Float)
    cooling_type = Column(String)
    ip_rating = Column(String)

    products = relationship("Product", back_populates="model")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(String, primary_key=True)
    qr_code = Column(String, unique=True, nullable=False)
    serial_number = Column(String, unique=True, nullable=False)
    location = Column(String, nullable=False, index=True)
    site = Column(String, nullable=False)
    manufacture_year = Column(Integer, nullable=False, index=True)
    installation_date = Column(Date, nullable=True)
    status = Column(String, nullable=False, default="operational", index=True)
    warranty_expiry = Column(Date, nullable=True, index=True)
    model_id = Column(String, ForeignKey("product_models.model_id"), nullable=False, index=True)
    last_maintenance = Column(Date, nullable=True)
    next_maintenance = Column(Date, nullable=True, index=True)
    notes = Column(Text, nullable=True)

    model = relationship("ProductModel", back_populates="products")
    events = relationship("ProductEvent", back_populates="product", order_by="ProductEvent.event_date.desc()")


class ProductEvent(Base):
    __tablename__ = "product_events"

    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey("products.product_id"), nullable=False, index=True)
    event_type = Column(String, nullable=False, index=True)
    event_date = Column(Date, nullable=False, index=True)
    description = Column(Text)
    parts_replaced = Column(String, nullable=True)
    performed_by = Column(String)
    cost_inr = Column(Float, nullable=True)

    product = relationship("Product", back_populates="events")


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey("products.product_id"), index=True)
    scan_type = Column(String)
    scan_value = Column(String)
    scanned_at = Column(String)  # ISO 8601 datetime string — kept as VARCHAR


class NotificationType(str, enum.Enum):
    WARRANTY = "warranty"
    MAINTENANCE = "maintenance"
    SYSTEM = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    product_id = Column(String, ForeignKey("products.product_id"), nullable=True, index=True)
    read = Column(Boolean, default=False, index=True)
    timestamp = Column(Date, nullable=False)

    product = relationship("Product", foreign_keys=[product_id])
