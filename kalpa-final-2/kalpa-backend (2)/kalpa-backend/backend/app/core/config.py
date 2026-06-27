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


settings = Settings()
