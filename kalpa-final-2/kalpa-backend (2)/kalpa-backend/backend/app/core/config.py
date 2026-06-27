import os
import sys
from dataclasses import dataclass
from pathlib import Path

_WEAK_SECRETS = {
    "supersecret", "secret", "changeme", "change-me", "password",
    "your-secret-here", "jwt_secret", "generate-a-strong-random-secret",
}


def _load_env_file() -> None:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    if not env_path.exists():
        return

    for raw_line in env_path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


_load_env_file()


def _require_jwt_secret() -> str:
    secret = os.getenv("JWT_SECRET", "")
    if not secret or secret.lower() in _WEAK_SECRETS or len(secret) < 32:
        print(
            "\n[FATAL] JWT_SECRET is missing, too short (min 32 chars), or still set to "
            "the default value. Set a strong random secret in your .env file.\n"
            "Generate one with:  python -c \"import secrets; print(secrets.token_hex(32))\"\n",
            file=sys.stderr,
        )
        sys.exit(1)
    return secret


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./kalpa.db")
    jwt_secret: str = _require_jwt_secret()
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    token_expire_minutes: int = int(os.getenv("TOKEN_EXPIRE_MINUTES", "60"))
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
    allowed_origins: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000",
    )
    # Default admin seeding — only used when no admin account exists
    default_admin_email: str = os.getenv("DEFAULT_ADMIN_EMAIL", "")
    default_admin_password: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "")
    default_admin_name: str = os.getenv("DEFAULT_ADMIN_NAME", "System Administrator")

    # Environment — controls dev-only features (demo email, /dev/* endpoints)
    app_env: str = os.getenv("APP_ENV", "development")

    # Gmail SMTP — all read from .env, never hardcoded
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from: str = os.getenv("SMTP_FROM", "")

    # MFA settings
    otp_expire_minutes: int = int(os.getenv("OTP_EXPIRE_MINUTES", "5"))
    otp_max_attempts: int = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))

    @property
    def smtp_enabled(self) -> bool:
        return bool(self.smtp_username and self.smtp_password)

    @property
    def is_development(self) -> bool:
        return self.app_env.lower() in ("development", "dev", "local")


settings = Settings()
