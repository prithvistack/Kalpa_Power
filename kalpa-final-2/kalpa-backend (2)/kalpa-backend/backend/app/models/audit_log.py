from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, DateTime, String, Text

from app.database.db import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id              = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id         = Column(String, nullable=True)
    user_email      = Column(String, nullable=True,  index=True)
    action          = Column(String, nullable=False,  index=True)
    entity_type     = Column(String, nullable=True,  index=True)
    entity_id       = Column(String, nullable=True)
    previous_values = Column(Text,   nullable=True)   # JSON string
    new_values      = Column(Text,   nullable=True)   # JSON string
    timestamp       = Column(DateTime(timezone=True), nullable=False,
                             default=lambda: datetime.now(timezone.utc), index=True)
    ip_address      = Column(String, nullable=True)


class AuditAction:
    # Authentication
    LOGIN            = "LOGIN"
    FAILED_LOGIN     = "FAILED_LOGIN"
    REGISTER         = "REGISTER"
    USER_PROMOTED    = "USER_PROMOTED"
    # MFA / OTP
    OTP_GENERATED    = "OTP_GENERATED"
    OTP_VERIFIED     = "OTP_VERIFIED"
    OTP_FAILED       = "OTP_FAILED"
    OTP_EXPIRED      = "OTP_EXPIRED"
    # Assets
    PRODUCT_CREATED  = "PRODUCT_CREATED"
    EVENT_CREATED    = "EVENT_CREATED"
    CSV_IMPORT       = "CSV_IMPORT"
    # Notifications / email
    MAINTENANCE_REMINDER_SENT = "MAINTENANCE_REMINDER_SENT"
    WARRANTY_REMINDER_SENT    = "WARRANTY_REMINDER_SENT"
    DEMO_EMAIL_SENT           = "DEMO_EMAIL_SENT"
