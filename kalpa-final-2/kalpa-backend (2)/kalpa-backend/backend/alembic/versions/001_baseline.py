"""Baseline — documents the initial schema as created by SQLAlchemy create_all.

Tables were created by the ORM before Alembic was introduced; this revision
records that starting point without making any database changes.

Revision ID: 001
Revises:
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tables already exist — this migration is stamped, not run.
    pass


def downgrade() -> None:
    pass
