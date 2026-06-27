"""
Notification service — in-app + email.

generate_notifications_for_products : called at startup and by the daily scheduler.
daily_notification_job              : scheduler entry point (wraps above with its own session).
seed_demo_notification              : one-time dev-mode maintenance demo.
create_product_notification         : single-product system notification.
"""

import logging
import uuid
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.database.db import SessionLocal
from app.models.db_models import Notification, Product
from app.services.audit_service import AuditAction, log_action

logger = logging.getLogger(__name__)

_DEMO_MARKER = "DEMO-MAINTENANCE-SEED-v1"


# ---------------------------------------------------------------------------
# Core: generate in-app notifications (called at startup + daily scheduler)
# ---------------------------------------------------------------------------
def generate_notifications_for_products(db: Session) -> None:
    """Create in-app notifications for warranty / maintenance events.

    Also sends email reminders when SMTP is configured.
    Deduplicates: skips products that already have an unread notification of that type.
    """
    from app.services.email_service import send_maintenance_reminder, send_warranty_reminder
    from app.core.config import settings

    today = date.today()
    products = db.query(Product).all()
    email_to = getattr(settings, "default_admin_email", "") or ""

    for product in products:
        model_name = product.model.model_name if product.model else "Unknown Model"

        # ---- Warranty expiry within 30 days ----
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
                    if email_to:
                        sent = send_warranty_reminder(
                            to_email=email_to,
                            product_name=model_name,
                            product_id=product.product_id,
                            model=model_name,
                            location=product.location,
                            expiry_date=str(product.warranty_expiry),
                            days_remaining=days_until_expiry,
                        )
                        log_action(AuditAction.WARRANTY_REMINDER_SENT,
                                   entity_type="PRODUCT",
                                   entity_id=product.product_id,
                                   new={"email_sent": sent, "days_remaining": days_until_expiry})

        # ---- Maintenance due within 7 days or overdue ----
        if product.next_maintenance:
            days_until_maint = (product.next_maintenance - today).days
            is_due = days_until_maint <= 7
            is_overdue = today > product.next_maintenance

            if is_due or is_overdue:
                existing = db.query(Notification).filter(
                    Notification.product_id == product.product_id,
                    Notification.type == "maintenance",
                    Notification.read == False,
                ).first()
                if not existing:
                    msg = ("Maintenance is overdue"
                           if is_overdue
                           else f"Maintenance due in {days_until_maint} days")
                    db.add(Notification(
                        id=str(uuid.uuid4()),
                        type="maintenance",
                        message=msg,
                        product_id=product.product_id,
                        read=False,
                        timestamp=today,
                    ))
                    if email_to:
                        priority = "High" if is_overdue else "Medium"
                        action = ("Schedule maintenance immediately — overdue!"
                                  if is_overdue
                                  else "Schedule maintenance within the next 7 days.")
                        sent = send_maintenance_reminder(
                            to_email=email_to,
                            product_name=model_name,
                            product_id=product.product_id,
                            model=model_name,
                            location=product.location,
                            due_date=str(product.next_maintenance),
                            priority=priority,
                            recommended_action=action,
                        )
                        log_action(AuditAction.MAINTENANCE_REMINDER_SENT,
                                   entity_type="PRODUCT",
                                   entity_id=product.product_id,
                                   new={"email_sent": sent, "days": days_until_maint})

    db.commit()


# ---------------------------------------------------------------------------
# Scheduler entry point — owns its own DB session
# ---------------------------------------------------------------------------
def daily_notification_job() -> None:
    """Background job called by APScheduler every 24 hours."""
    logger.info("Daily notification job started")
    db = SessionLocal()
    try:
        generate_notifications_for_products(db)
        logger.info("Daily notification job complete")
    except Exception as exc:
        logger.error("Daily notification job failed: %s", exc)
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Dev-mode one-shot demo seed
# ---------------------------------------------------------------------------
def seed_demo_notification(demo_email: str) -> bool:
    """
    Send one demo maintenance reminder email + create matching in-app notification.
    Idempotent: skips if the demo notification already exists in the DB.
    Returns True if the demo was seeded this run, False if already done.
    """
    from app.services.email_service import send_maintenance_reminder

    db = SessionLocal()
    try:
        # Idempotency check — look for the sentinel notification
        already = db.query(Notification).filter(
            Notification.message.contains(_DEMO_MARKER)
        ).first()
        if already:
            logger.info("Demo notification already exists — skipping seed")
            return False

        today = date.today()
        notif_id = str(uuid.uuid4())

        db.add(Notification(
            id=notif_id,
            type="maintenance",
            message=f"[{_DEMO_MARKER}] Maintenance Due — Transformer KP-203 — Pune Plant — High Priority",
            product_id=None,
            read=False,
            timestamp=today,
        ))
        db.commit()

        sent = send_maintenance_reminder(
            to_email=demo_email,
            product_name="Transformer KP-203",
            product_id="KPL-TRF-KP-203",
            model="Transformer KP-203",
            location="Pune Plant",
            due_date=str(today),
            priority="High",
            recommended_action="Schedule preventive maintenance immediately.",
            is_demo=True,
        )

        log_action(AuditAction.DEMO_EMAIL_SENT,
                   entity_type="DEMO",
                   entity_id=notif_id,
                   new={"to": demo_email, "email_sent": sent,
                        "notification_id": notif_id})

        logger.info("Demo seed complete — email_sent=%s notification_id=%s", sent, notif_id)
        return True

    except Exception as exc:
        logger.error("Demo seed failed: %s", exc)
        db.rollback()
        return False
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Simple helper used by admin/CSV import routers
# ---------------------------------------------------------------------------
def create_product_notification(db: Session, product_id: str,
                                message: str = "New asset added") -> None:
    db.add(Notification(
        id=str(uuid.uuid4()),
        type="system",
        message=message,
        product_id=product_id,
        read=False,
        timestamp=date.today(),
    ))
    db.commit()
