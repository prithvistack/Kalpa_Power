import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import require_role
from app.core.limiter import limiter
from app.core.security import create_access_token, hash_password, verify_password
from app.database.db import get_db
from app.models.otp_token import OTPToken
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    LoginRequest,
    MFARequiredResponse,
    MessageResponse,
    PromoteRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyOTPRequest,
)
from app.services.audit_service import AuditAction, log_action
from app.services.email_service import send_otp, send_password_reset, send_welcome

router = APIRouter(prefix="/auth", tags=["auth"])

ALLOWED_ROLES = {"viewer", "technician", "admin"}
_OTP_RATE  = "5/minute"
_AUTH_RATE = "5/minute"


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(subject=user.email, role=user.role),
        expires_in=settings.token_expire_minutes * 60,
        user=user,
    )


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _clean_expired_otps(db: Session) -> None:
    now = datetime.now(timezone.utc)
    db.query(OTPToken).filter(OTPToken.expires_at < now).delete(synchronize_session=False)
    db.commit()


def _clean_expired_reset_tokens(db: Session) -> None:
    now = datetime.now(timezone.utc)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.expires_at < now
    ).delete(synchronize_session=False)
    db.commit()


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(_AUTH_RATE)
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="Email is already registered")

    user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role="viewer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_action(AuditAction.REGISTER, user=user, entity_type="USER",
               entity_id=user.id, ip=_ip(request))

    # Welcome email (fire-and-forget — failure never blocks registration)
    send_welcome(user.email)

    return _token_response(user)


# ---------------------------------------------------------------------------
# POST /auth/login  — Step 1 of 2 when MFA is active
# ---------------------------------------------------------------------------
@router.post("/login", response_model=None)
@limiter.limit(_AUTH_RATE)
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        log_action(AuditAction.FAILED_LOGIN,
                   user_email=payload.email.lower(), ip=_ip(request))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password",
                            headers={"WWW-Authenticate": "Bearer"})

    # If SMTP is not configured → bypass MFA and issue JWT directly (backward compat)
    if not settings.smtp_enabled:
        log_action(AuditAction.LOGIN, user=user, entity_type="USER",
                   entity_id=user.id, ip=_ip(request))
        return _token_response(user)

    # Seeded admin bypasses MFA — issues JWT directly without OTP
    if user.email == settings.seeded_admin_email.strip().lower():
        log_action(AuditAction.LOGIN, user=user, entity_type="USER",
                   entity_id=user.id, ip=_ip(request))
        return _token_response(user)

    # Clean up stale OTPs for this user before generating a new one
    _clean_expired_otps(db)
    db.query(OTPToken).filter(OTPToken.user_id == user.id).delete(synchronize_session=False)
    db.commit()

    # Generate OTP
    otp = f"{secrets.randbelow(1_000_000):06d}"
    session_token = str(uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)

    db.add(OTPToken(
        id=str(uuid4()),
        user_id=user.id,
        user_email=user.email,
        otp_hash=_hash_otp(otp),
        mfa_session_token=session_token,
        expires_at=expires_at,
        attempts=0,
    ))
    db.commit()

    # Send OTP email
    sent = send_otp(user.email, user.email.split("@")[0], otp)

    log_action(AuditAction.OTP_GENERATED, user=user, entity_type="OTP",
               entity_id=session_token,
               new={"email_sent": sent, "expires_at": expires_at.isoformat()},
               ip=_ip(request))

    return MFARequiredResponse(mfa_session_token=session_token)


# ---------------------------------------------------------------------------
# POST /auth/verify-otp  — Step 2 of 2: exchange OTP for JWT
# ---------------------------------------------------------------------------
@router.post("/verify-otp", response_model=TokenResponse)
@limiter.limit(_OTP_RATE)
def verify_otp(request: Request, payload: VerifyOTPRequest, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    record = db.query(OTPToken).filter(
        OTPToken.mfa_session_token == payload.mfa_session_token
    ).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid or expired MFA session")

    # Expired
    if record.expires_at.replace(tzinfo=timezone.utc) < now:
        log_action(AuditAction.OTP_EXPIRED, user_email=record.user_email,
                   entity_type="OTP", entity_id=record.mfa_session_token,
                   ip=_ip(request))
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="OTP has expired. Please log in again.")

    # Too many attempts
    if record.attempts >= settings.otp_max_attempts:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail="Maximum OTP attempts exceeded. Please log in again.")

    # Verify OTP
    if _hash_otp(payload.otp) != record.otp_hash:
        record.attempts += 1
        db.commit()
        remaining = settings.otp_max_attempts - record.attempts
        log_action(AuditAction.OTP_FAILED, user_email=record.user_email,
                   entity_type="OTP", entity_id=record.mfa_session_token,
                   new={"attempts": record.attempts, "remaining": remaining},
                   ip=_ip(request))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f"Incorrect OTP. {remaining} attempt(s) remaining.")

    # Success — fetch user, delete OTP record, issue JWT
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    db.delete(record)
    db.commit()

    log_action(AuditAction.OTP_VERIFIED, user=user, entity_type="OTP",
               entity_id=payload.mfa_session_token, ip=_ip(request))
    log_action(AuditAction.LOGIN, user=user, entity_type="USER",
               entity_id=user.id, ip=_ip(request))

    return _token_response(user)


# ---------------------------------------------------------------------------
# POST /auth/promote
# ---------------------------------------------------------------------------
@router.post("/promote", status_code=status.HTTP_200_OK)
def promote_user(
    request: Request,
    payload: PromoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    role = payload.role.strip().lower()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Role must be one of: {', '.join(sorted(ALLOWED_ROLES))}")
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    old_role = user.role
    user.role = role
    db.commit()

    log_action(AuditAction.USER_PROMOTED, user=current_user, entity_type="USER",
               entity_id=user.id,
               previous={"role": old_role},
               new={"role": role, "email": user.email},
               ip=_ip(request))

    # Notify promoted user by email
    from app.services.email_service import send_admin_promotion
    send_admin_promotion(user.email, role, current_user.email)

    return {"status": "updated", "email": user.email, "role": user.role}


# ---------------------------------------------------------------------------
# POST /auth/google
# ---------------------------------------------------------------------------
@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    if not settings.google_client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Google sign-in is not configured")
    try:
        from google.auth.transport import requests
        from google.oauth2 import id_token
    except ImportError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                            detail="Google auth dependencies are not installed") from exc

    try:
        claims = id_token.verify_oauth2_token(
            payload.credential, requests.Request(), settings.google_client_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid Google credential") from exc

    email = (claims.get("email") or "").lower()
    if not email or not claims.get("email_verified"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Google account email is not verified")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email,
                    password_hash=hash_password(f"google:{claims.get('sub', email)}"),
                    role="viewer")
        db.add(user)
        db.commit()
        db.refresh(user)
        send_welcome(user.email)

    log_action(AuditAction.LOGIN, user=user, entity_type="USER", entity_id=user.id)
    return _token_response(user)


# ---------------------------------------------------------------------------
# POST /auth/forgot-password  — Request a password reset link
# ---------------------------------------------------------------------------
_SAFE_RESET_MSG = (
    "If an account exists for this email, a password reset link has been sent."
)

@router.post("/forgot-password", response_model=MessageResponse)
@limiter.limit(_AUTH_RATE)
def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    # Sweep expired tokens to keep the table clean
    _clean_expired_reset_tokens(db)

    user = db.query(User).filter(User.email == payload.email).first()

    # Anti-enumeration: always return the same response regardless of whether
    # the email exists in the database.
    if not user:
        return MessageResponse(message=_SAFE_RESET_MSG)

    # Invalidate any previous reset tokens for this user (one active token at a time)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id
    ).delete(synchronize_session=False)
    db.commit()

    # Generate 256-bit cryptographically secure token; store only its SHA-256 hash
    raw_token = secrets.token_hex(32)          # 64-char hex string, never logged
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.password_reset_expire_minutes
    )

    db.add(PasswordResetToken(
        id=str(uuid4()),
        user_id=user.id,
        user_email=user.email,
        hashed_token=_hash_reset_token(raw_token),
        expires_at=expires_at,
    ))
    db.commit()

    # Build the reset URL and send the email
    reset_url = f"{settings.app_base_url}/reset-password?token={raw_token}"
    sent = send_password_reset(user.email, reset_url)

    log_action(
        AuditAction.PASSWORD_RESET_REQUESTED,
        user=user,
        entity_type="USER",
        entity_id=user.id,
        new={"email_sent": sent, "expires_at": expires_at.isoformat()},
        ip=_ip(request),
    )

    return MessageResponse(message=_SAFE_RESET_MSG)


# ---------------------------------------------------------------------------
# POST /auth/reset-password  — Consume token and set a new password
# ---------------------------------------------------------------------------
@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit(_AUTH_RATE)
def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    hashed = _hash_reset_token(payload.token)

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.hashed_token == hashed
    ).first()

    # Token not found (invalid or already purged)
    if not record:
        log_action(
            AuditAction.PASSWORD_RESET_FAILED,
            ip=_ip(request),
            new={"reason": "invalid_token"},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link is invalid or has already been used.",
        )

    # Token already consumed
    if record.used_at is not None:
        log_action(
            AuditAction.PASSWORD_RESET_FAILED,
            user_email=record.user_email,
            ip=_ip(request),
            new={"reason": "token_already_used"},
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link has already been used. Please request a new one.",
        )

    # Token expired
    expires = record.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < now:
        log_action(
            AuditAction.PASSWORD_RESET_TOKEN_EXPIRED,
            user_email=record.user_email,
            ip=_ip(request),
            new={"expired_at": record.expires_at.isoformat()},
        )
        db.delete(record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset link has expired. Please request a new one.",
        )

    # Fetch the user
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        db.delete(record)
        db.commit()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Update the password and mark the token as used in a single transaction
    user.password_hash = hash_password(payload.new_password)
    record.used_at = now
    db.commit()

    log_action(
        AuditAction.PASSWORD_RESET_COMPLETED,
        user=user,
        entity_type="USER",
        entity_id=user.id,
        ip=_ip(request),
    )

    return MessageResponse(message="Your password has been updated successfully. You can now sign in.")
