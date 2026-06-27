"""Convert all date-string columns to proper SQL DATE columns.

Columns migrated:
  products              : installation_date, warranty_expiry, last_maintenance, next_maintenance
  product_events        : event_date
  notifications         : timestamp

All existing values are 'YYYY-MM-DD' strings — confirmed safe for direct cast.
NULL-safe USING clause handles future nullable rows.

Revision ID: 002
Revises: 001
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None

# Columns that move from VARCHAR to DATE
# (table, column, nullable)
_DATE_COLUMNS = [
    ("products",       "installation_date", True),
    ("products",       "warranty_expiry",   True),
    ("products",       "last_maintenance",  True),
    ("products",       "next_maintenance",  True),
    ("product_events", "event_date",        False),
    ("notifications",  "timestamp",         False),
]


def upgrade() -> None:
    for table, col, nullable in _DATE_COLUMNS:
        op.execute(
            f"ALTER TABLE {table} "
            f"ALTER COLUMN {col} TYPE DATE "
            f"USING CASE WHEN {col} IS NULL OR {col} = '' "
            f"           THEN NULL "
            f"           ELSE {col}::DATE "
            f"      END"
        )


def downgrade() -> None:
    # Revert DATE back to VARCHAR (data is preserved as ISO strings)
    for table, col, nullable in reversed(_DATE_COLUMNS):
        op.execute(
            f"ALTER TABLE {table} "
            f"ALTER COLUMN {col} TYPE VARCHAR "
            f"USING {col}::TEXT"
        )
