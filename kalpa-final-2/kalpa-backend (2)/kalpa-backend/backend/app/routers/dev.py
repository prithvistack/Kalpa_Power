"""
Development-only endpoints.

These routes are registered ONLY when APP_ENV=development.
They are completely absent in production — not hidden, not disabled, not present.
"""

from datetime import date

from fastapi import APIRouter, HTTPException

from app.services.email_service import send_maintenance_reminder
from app.services import email_templates as tmpl
from app.services.audit_service import AuditAction, log_action

router = APIRouter(prefix="/dev", tags=["dev"])

_DEMO_EMAIL = "prithvikhedekar9092@gmail.com"


@router.post("/send-test-email", summary="Resend demo maintenance reminder (dev only)")
def send_test_email():
    """Immediately sends the demo maintenance reminder to the configured demo address.

    Uses the same email service and template as the seeded notification.
    Purpose: verify Gmail SMTP configuration and template rendering.
    """
    today = str(date.today())
    sent = send_maintenance_reminder(
        to_email=_DEMO_EMAIL,
        product_name="Transformer KP-203",
        product_id="KPL-TRF-KP-203",
        model="Transformer KP-203",
        location="Pune Plant",
        due_date=today,
        priority="High",
        recommended_action="Schedule preventive maintenance immediately.",
        is_demo=True,
    )

    if not sent:
        raise HTTPException(
            status_code=503,
            detail="Email failed to send. Check SMTP configuration in .env "
                   "(SMTP_USERNAME / SMTP_PASSWORD / SMTP_FROM must all be set).",
        )

    log_action(AuditAction.DEMO_EMAIL_SENT,
               entity_type="DEMO",
               new={"to": _DEMO_EMAIL, "trigger": "manual /dev/send-test-email"})

    return {
        "status": "sent",
        "to": _DEMO_EMAIL,
        "subject": f"[Kalpa] Maintenance Reminder — Transformer KP-203",
        "note": "Check your inbox at the address above.",
    }
