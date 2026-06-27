from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, DateTime, Integer, String

from app.database.db import Base


class OTPToken(Base):
    __tablename__ = "otp_tokens"

    id                = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id           = Column(String, nullable=False, index=True)
    user_email        = Column(String, nullable=False)
    otp_hash          = Column(String, nullable=False)          # SHA-256 of the 6-digit OTP
    mfa_session_token = Column(String, nullable=False, unique=True, index=True)
    expires_at        = Column(DateTime(timezone=True), nullable=False)
    attempts          = Column(Integer, nullable=False, default=0)
    created_at        = Column(DateTime(timezone=True), nullable=False,
                               default=lambda: datetime.now(timezone.utc))
