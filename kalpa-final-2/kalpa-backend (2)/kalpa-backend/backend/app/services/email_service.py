"""
Centralised email service for Kalpa Asset Intelligence.

All outbound email passes through send_email(). No module duplicates SMTP logic.
Returns True on success, False on any failure (never raises).
"""

from __future__ import annotations

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings
from app.services import email_templates as tmpl

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Core SMTP send — single entry point for all outbound email
# ---------------------------------------------------------------------------
def send_email(to: str, subject: str, html_body: str) -> bool:
    """Send one HTML email. Returns True on success, False on any failure."""
    if not settings.smtp_enabled:
        logger.warning("SMTP not configured — skipping email to %s (subject: %s)", to, subject)
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = settings.smtp_from or settings.smtp_username
        msg["To"]      = to
        msg.attach(MIMEText(html_body, "html", "utf-8"))

        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(msg)

        logger.info("Email sent to %s — %s", to, subject)
        return True

    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP auth failed — check SMTP_USERNAME / SMTP_PASSWORD in .env")
        return False
    except Exception as exc:
        logger.error("Email send failed (to=%s subject=%s): %s", to, subject, exc)
        return False


# ---------------------------------------------------------------------------
# Template-specific helpers — one function per email type
# ---------------------------------------------------------------------------

def send_otp(to_email: str, to_name: str, otp: str) -> bool:
    subject, html = tmpl.otp_email(to_name, otp, settings.otp_expire_minutes)
    return send_email(to_email, subject, html)


def send_welcome(to_email: str) -> bool:
    subject, html = tmpl.welcome_email(to_email)
    return send_email(to_email, subject, html)


def send_password_reset(to_email: str, reset_token: str) -> bool:
    subject, html = tmpl.password_reset_email(to_email, reset_token)
    return send_email(to_email, subject, html)


def send_maintenance_reminder(
    to_email: str,
    product_name: str,
    product_id: str,
    model: str,
    location: str,
    due_date: str,
    priority: str = "High",
    recommended_action: str = "Schedule preventive maintenance immediately.",
    is_demo: bool = False,
) -> bool:
    subject, html = tmpl.maintenance_reminder_email(
        product_name=product_name,
        product_id=product_id,
        model=model,
        location=location,
        due_date=due_date,
        priority=priority,
        recommended_action=recommended_action,
        is_demo=is_demo,
    )
    return send_email(to_email, subject, html)


def send_warranty_reminder(
    to_email: str,
    product_name: str,
    product_id: str,
    model: str,
    location: str,
    expiry_date: str,
    days_remaining: int,
) -> bool:
    subject, html = tmpl.warranty_reminder_email(
        product_name=product_name,
        product_id=product_id,
        model=model,
        location=location,
        expiry_date=expiry_date,
        days_remaining=days_remaining,
    )
    return send_email(to_email, subject, html)


def send_admin_promotion(to_email: str, new_role: str, promoted_by: str) -> bool:
    subject, html = tmpl.admin_promotion_email(to_email, new_role, promoted_by)
    return send_email(to_email, subject, html)
