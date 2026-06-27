"""
Audit logging service.

Uses its own DB session so that logging failures never affect the caller's transaction.
All public functions are try/except wrapped — they will never raise.
"""

import json
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from app.database.db import SessionLocal
from app.models.audit_log import AuditAction, AuditLog  # noqa: F401 — re-export AuditAction

logger = logging.getLogger(__name__)


def log_action(
    action: str,
    *,
    user=None,                          # User ORM object (optional)
    user_email: str | None = None,      # fallback when user object is not available
    entity_type: str | None = None,
    entity_id: str | None = None,
    previous: dict[str, Any] | None = None,
    new: dict[str, Any] | None = None,
    ip: str | None = None,
) -> None:
    """Write one audit record in a separate DB session.

    Guaranteed not to raise — failures are logged at WARNING level only.
    """
    try:
        db = SessionLocal()
        try:
            entry = AuditLog(
                id=str(uuid4()),
                user_id=user.id if user else None,
                user_email=(user.email if user else None) or user_email,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                previous_values=json.dumps(previous, default=str) if previous else None,
                new_values=json.dumps(new, default=str) if new else None,
                timestamp=datetime.now(timezone.utc),
                ip_address=ip,
            )
            db.add(entry)
            db.commit()
        finally:
            db.close()
    except Exception as exc:
        logger.warning("Audit log write failed (action=%s): %s", action, exc)
