
import logging
import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.limiter import limiter
from app.database.db import SessionLocal, get_db
from app.models.user import User
from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.notifications import router as notifications_router
from app.routers.products import router as products_router
from app.routers.scans import router as scans_router
from app.services.notification_service import generate_notifications_for_products

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# Schema is managed by Alembic — run `alembic upgrade head` before deploying.
# Initialize app
app = FastAPI(
    title="Kalpa Power Ltd — Product Intelligence API",
    description="Asset lifecycle tracking and product intelligence system",
    version="1.0.0",
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — only allow configured origins
_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(products_router)
app.include_router(auth_router)
app.include_router(scans_router)
app.include_router(admin_router)
app.include_router(notifications_router)

# Auto-seed database
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "kalpa.db")

if not os.path.exists(DB_PATH) or os.path.getsize(DB_PATH) < 1000:
    try:
        from ..seed.seed import seed
        seed()
        logger.info("Database seeded successfully")
    except Exception as e:
        logger.warning("Seeding skipped: %s", e)

# Generate notifications on startup
try:
    db = SessionLocal()
    generate_notifications_for_products(db)
    db.close()
    logger.info("Startup notifications generated")
except Exception as e:
    logger.warning("Notification generation skipped: %s", e)


@app.get("/")
def root():
    return {"status": "ok", "message": "Kalpa Power API running"}


@app.get("/health", tags=["health"])
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as exc:
        logger.error("Health check — DB unreachable: %s", exc)
        db_status = "error"
    return {"status": "ok", "database": db_status}
