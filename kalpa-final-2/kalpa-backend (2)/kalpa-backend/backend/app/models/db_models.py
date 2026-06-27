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
    location = Column(String, nullable=False)
    site = Column(String, nullable=False)
    manufacture_year = Column(Integer, nullable=False)
    installation_date = Column(String)
    status = Column(String, nullable=False, default="operational")
    warranty_expiry = Column(String)
    model_id = Column(String, ForeignKey("product_models.model_id"), nullable=False)
    last_maintenance = Column(String, nullable=True)
    next_maintenance = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    model = relationship("ProductModel", back_populates="products")
    events = relationship("ProductEvent", back_populates="product", order_by="ProductEvent.event_date.desc()")


class ProductEvent(Base):
    __tablename__ = "product_events"

    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey("products.product_id"), nullable=False)
    event_type = Column(String, nullable=False)
    event_date = Column(String, nullable=False)
    description = Column(Text)
    parts_replaced = Column(String, nullable=True)
    performed_by = Column(String)
    cost_inr = Column(Float, nullable=True)

    product = relationship("Product", back_populates="events")


class ScanLog(Base):
    __tablename__ = "scan_logs"

    id = Column(String, primary_key=True)
    product_id = Column(String, ForeignKey("products.product_id"))
    scan_type = Column(String)
    scan_value = Column(String)
    scanned_at = Column(String)


class NotificationType(str, enum.Enum):
    WARRANTY = "warranty"
    MAINTENANCE = "maintenance"
    SYSTEM = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True)
    type = Column(String, nullable=False)  # warranty, maintenance, system
    message = Column(String, nullable=False)
    product_id = Column(String, ForeignKey("products.product_id"), nullable=True)
    read = Column(Boolean, default=False)
    timestamp = Column(String, nullable=False)

    product = relationship("Product", foreign_keys=[product_id])
