"""Add database indexes for search performance.

Index strategy:
  products       — columns used in WHERE filters, FK joins, and QR/serial lookups
  product_events — FK join + event_type/event_date used in recently_repaired EXISTS query
  notifications  — read flag (unread count query) + product_id FK
  scan_logs      — product_id FK

Note: qr_code and serial_number already have implicit indexes via UNIQUE constraints.
      Users.email already has index=True in the ORM model.

Revision ID: 003
Revises: 002
Create Date: 2026-06-27
"""
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

_INDEXES = [
    # (index_name, table, columns)
    ("ix_products_location",        "products",       ["location"]),
    ("ix_products_status",          "products",       ["status"]),
    ("ix_products_model_id",        "products",       ["model_id"]),
    ("ix_products_warranty_expiry", "products",       ["warranty_expiry"]),
    ("ix_products_next_maintenance","products",       ["next_maintenance"]),
    ("ix_products_manufacture_year","products",       ["manufacture_year"]),
    ("ix_product_events_product_id","product_events", ["product_id"]),
    ("ix_product_events_event_type","product_events", ["event_type"]),
    ("ix_product_events_event_date","product_events", ["event_date"]),
    ("ix_notifications_read",       "notifications",  ["read"]),
    ("ix_notifications_product_id", "notifications",  ["product_id"]),
    ("ix_scan_logs_product_id",     "scan_logs",      ["product_id"]),
]


def upgrade() -> None:
    for name, table, cols in _INDEXES:
        op.create_index(name, table, cols, if_not_exists=True)


def downgrade() -> None:
    for name, table, cols in reversed(_INDEXES):
        op.drop_index(name, table_name=table, if_exists=True)
