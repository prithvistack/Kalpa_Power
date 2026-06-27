from datetime import date
from sqlalchemy.orm import Session
from app.models.db_models import Notification, Product
import uuid


def generate_notifications_for_products(db: Session) -> None:
    today = date.today()
    products = db.query(Product).all()

    for product in products:
        # Warranty expiry within 30 days
        if product.warranty_expiry:
            days_until_expiry = (product.warranty_expiry - today).days
            if 0 < days_until_expiry <= 30:
                existing = db.query(Notification).filter(
                    Notification.product_id == product.product_id,
                    Notification.type == "warranty",
                    Notification.read == False,
                ).first()
                if not existing:
                    db.add(Notification(
                        id=str(uuid.uuid4()),
                        type="warranty",
                        message=f"Warranty expires in {days_until_expiry} days",
                        product_id=product.product_id,
                        read=False,
                        timestamp=today,
                    ))

        # Maintenance overdue
        if product.next_maintenance and today > product.next_maintenance:
            existing = db.query(Notification).filter(
                Notification.product_id == product.product_id,
                Notification.type == "maintenance",
                Notification.read == False,
            ).first()
            if not existing:
                db.add(Notification(
                    id=str(uuid.uuid4()),
                    type="maintenance",
                    message="Maintenance is overdue",
                    product_id=product.product_id,
                    read=False,
                    timestamp=today,
                ))

    db.commit()


def create_product_notification(db: Session, product_id: str, message: str = "New asset added") -> None:
    db.add(Notification(
        id=str(uuid.uuid4()),
        type="system",
        message=message,
        product_id=product_id,
        read=False,
        timestamp=date.today(),
    ))
    db.commit()
