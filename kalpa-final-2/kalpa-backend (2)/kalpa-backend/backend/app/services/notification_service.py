from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.db_models import Notification, Product
import uuid


def generate_notifications_for_products(db: Session):
    """
    Generate notifications based on product conditions:
    - Warranty expiry (<30 days)
    - Maintenance overdue
    """
    today = datetime.now()
    
    # Get all products
    products = db.query(Product).all()
    
    for product in products:
        # Check warranty expiry
        if product.warranty_expiry:
            try:
                warranty_date = datetime.strptime(product.warranty_expiry, "%Y-%m-%d")
                days_until_expiry = (warranty_date - today).days
                
                if 0 < days_until_expiry <= 30:
                    # Check if warranty notification already exists
                    existing = db.query(Notification).filter(
                        Notification.product_id == product.product_id,
                        Notification.type == "warranty",
                        Notification.read == False
                    ).first()
                    
                    if not existing:
                        notification = Notification(
                            id=str(uuid.uuid4()),
                            type="warranty",
                            message=f"Warranty expires in {days_until_expiry} days",
                            product_id=product.product_id,
                            read=False,
                            timestamp=today.strftime("%Y-%m-%d")
                        )
                        db.add(notification)
            except (ValueError, TypeError):
                pass
        
        # Check maintenance overdue
        if product.next_maintenance:
            try:
                next_maintenance_date = datetime.strptime(product.next_maintenance, "%Y-%m-%d")
                
                if today > next_maintenance_date:
                    # Check if maintenance notification already exists
                    existing = db.query(Notification).filter(
                        Notification.product_id == product.product_id,
                        Notification.type == "maintenance",
                        Notification.read == False
                    ).first()
                    
                    if not existing:
                        notification = Notification(
                            id=str(uuid.uuid4()),
                            type="maintenance",
                            message="Maintenance is overdue",
                            product_id=product.product_id,
                            read=False,
                            timestamp=today.strftime("%Y-%m-%d")
                        )
                        db.add(notification)
            except (ValueError, TypeError):
                pass
    
    db.commit()


def create_product_notification(db: Session, product_id: str, message: str = "New asset added"):
    """
    Create a notification when a new product is added
    """
    today = datetime.now()
    notification = Notification(
        id=str(uuid.uuid4()),
        type="system",
        message=message,
        product_id=product_id,
        read=False,
        timestamp=today.strftime("%Y-%m-%d")
    )
    db.add(notification)
    db.commit()
