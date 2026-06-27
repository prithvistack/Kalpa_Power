"""Alembic environment — wires the app's models and DATABASE_URL into migrations."""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
from alembic import context

# ---------------------------------------------------------------------------
# Make sure the backend/ directory is on sys.path so all app imports resolve
# ---------------------------------------------------------------------------
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(HERE)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ---------------------------------------------------------------------------
# Import every model module so SQLAlchemy registers them with Base.metadata.
# Also loads .env on import (via app.core.config).
# ---------------------------------------------------------------------------
from app.core.config import settings
from app.database.db import Base
import app.models.db_models   # noqa: F401
import app.models.user        # noqa: F401

# ---------------------------------------------------------------------------
# Alembic config object
# ---------------------------------------------------------------------------
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

DATABASE_URL = settings.database_url


def run_migrations_offline() -> None:
    """Emit SQL without a live DB connection."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations against a live DB connection.

    We create the engine directly from settings.database_url instead of going
    through alembic.ini + configparser because configparser treats % as a special
    interpolation character, which breaks percent-encoded passwords (%40 etc.).
    """
    engine = create_engine(DATABASE_URL, poolclass=NullPool)
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
