from datetime import datetime
from typing import Union

from pydantic import BaseModel, Field, field_validator


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if "@" not in cleaned or "." not in cleaned.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return cleaned


class PromoteRequest(BaseModel):
    email: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if "@" not in cleaned or "." not in cleaned.rsplit("@", 1)[-1]:
            raise ValueError("Enter a valid email address")
        return cleaned


class VerifyOTPRequest(BaseModel):
    mfa_session_token: str
    otp: str = Field(min_length=6, max_length=6)


class GoogleLoginRequest(BaseModel):
    credential: str


class UserOut(BaseModel):
    id: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut


class MFARequiredResponse(BaseModel):
    """Returned by POST /auth/login when MFA is active.

    The client must immediately call POST /auth/verify-otp with
    mfa_session_token + the 6-digit OTP sent to the user's email.
    """
    mfa_required: bool = True
    mfa_session_token: str
    message: str = "OTP sent to your registered email address"


# Union type used as the login response model
LoginResponse = Union[TokenResponse, MFARequiredResponse]
