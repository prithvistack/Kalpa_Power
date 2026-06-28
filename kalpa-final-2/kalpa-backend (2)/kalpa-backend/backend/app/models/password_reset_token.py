from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import Column, DateTime, String

from app.database.db import Base


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id           = Column(String, primary_key=True, default=lambda: str(uuid4()))
    user_id      = Column(String, nullable=False, index=True)
    user_email   = Column(String, nullable=False)
    hashed_token = Column(String, nullable=False, unique=True, index=True)
    expires_at   = Column(DateTime(timezone=True), nullable=False)
    used_at      = Column(DateTime(timezone=True), nullable=True)   # set when consumed
    created_at   = Column(DateTime(timezone=True), nullable=False,
                          default=lambda: datetime.now(timezone.utc))
