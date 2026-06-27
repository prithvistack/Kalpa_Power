import logging

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limiter import limiter
from app.core.security import hash_password
from app.database.db import SessionLocal, get_db
from app.models.user import User
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.csv_import import router as csv_import_router
from app.routers.notifications import router as notifications_router
from app.routers.products import router as products_router
from app.routers.scans import router as scans_router
from app.services.notification_service import (
    daily_notification_job,
    generate_notifications_for_products,
    seed_demo_notification,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# Schema is managed by Alembic — run `alembic upgrade head` before deploying.

app = FastAPI(
    title="Kalpa Power Ltd — Product Intelligence API",
    description="Asset lifecycle tracking and product intelligence system",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# API versioning
# v1 routes appear in /docs; legacy unversioned routes are kept for the frontend.
# ---------------------------------------------------------------------------
_V1 = "/v1"
_ALL_ROUTERS = [
    auth_router,
    products_router,
    notifications_router,
    admin_router,
    scans_router,
    csv_import_router,
]

for _r in _ALL_ROUTERS:
    app.include_router(_r, prefix=_V1)

for _r in _ALL_ROUTERS:
    app.include_router(_r, include_in_schema=False)  # backward-compat legacy paths

# Dev-only router — registered only in development mode
if settings.is_development:
    from app.routers.dev import router as dev_router
    app.include_router(dev_router)
    logger.info("Dev endpoints enabled at /dev/* (APP_ENV=%s)", settings.app_env)

# ---------------------------------------------------------------------------
# Startup: admin seeding
# ---------------------------------------------------------------------------
def _seed_admin() -> None:
    email = settings.default_admin_email.strip().lower()
    password = settings.default_admin_password.strip()
    if not email or not password:
        return
    db = SessionLocal()
    try:
        if db.query(User).filter(User.role == "admin").first():
            return
        if db.query(User).filter(User.email == email).first():
            return
        db.add(User(email=email, password_hash=hash_password(password), role="admin"))
        db.commit()
        logger.info("Default admin account created: %s", email)
    except Exception as exc:
        logger.warning("Admin seeding failed: %s", exc)
        db.rollback()
    finally:
        db.close()


_seed_admin()

# ---------------------------------------------------------------------------
# Startup: in-app notifications
# ---------------------------------------------------------------------------
try:
    _db = SessionLocal()
    generate_notifications_for_products(_db)
    _db.close()
    logger.info("Startup notifications generated")
except Exception as _exc:
    logger.warning("Notification generation skipped: %s", _exc)

# ---------------------------------------------------------------------------
# Startup: dev demo seed (once-only, development mode only)
# ---------------------------------------------------------------------------
if settings.is_development:
    try:
        seeded = seed_demo_notification(demo_email="prithvikhedekar9092@gmail.com")
        if seeded:
            logger.info("Dev demo: maintenance reminder seeded and email queued")
        else:
            logger.info("Dev demo: already seeded previously — skipped")
    except Exception as _exc:
        logger.warning("Dev demo seed failed: %s", _exc)

# ---------------------------------------------------------------------------
# Background scheduler — daily notification job
# ---------------------------------------------------------------------------
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    _scheduler = BackgroundScheduler(timezone="UTC")
    _scheduler.add_job(daily_notification_job, "interval", hours=24,
                       id="daily_notifications", replace_existing=True)
    _scheduler.start()
    logger.info("Background scheduler started — daily notifications every 24 h")
except Exception as _exc:
    logger.warning("Scheduler startup failed: %s", _exc)

# ---------------------------------------------------------------------------
# Core endpoints
# ---------------------------------------------------------------------------

@app.get("/", tags=["root"])
def root():
    return {"status": "ok", "message": "Kalpa Power API running", "version": "v1"}


@app.get("/health", tags=["health"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:
        logger.error("Health check — DB unreachable: %s", exc)
        db_status = "error"
    return {
        "status": "ok",
        "database": db_status,
        "smtp": "configured" if settings.smtp_enabled else "not configured",
        "mfa": "enabled" if settings.smtp_enabled else "disabled (configure SMTP to enable)",
        "env": settings.app_env,
    }
