"""Create audit_logs table for enterprise audit trail.

Revision ID: 004
Revises: 003
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id",              sa.String(),               primary_key=True),
        sa.Column("user_id",         sa.String(),               nullable=True),
        sa.Column("user_email",      sa.String(),               nullable=True),
        sa.Column("action",          sa.String(),               nullable=False),
        sa.Column("entity_type",     sa.String(),               nullable=True),
        sa.Column("entity_id",       sa.String(),               nullable=True),
        sa.Column("previous_values", sa.Text(),                 nullable=True),
        sa.Column("new_values",      sa.Text(),                 nullable=True),
        sa.Column("timestamp",       sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address",      sa.String(),               nullable=True),
    )
    op.create_index("ix_audit_logs_action",      "audit_logs", ["action"])
    op.create_index("ix_audit_logs_user_email",  "audit_logs", ["user_email"])
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_timestamp",   "audit_logs", ["timestamp"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_timestamp",   table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_user_email",  table_name="audit_logs")
    op.drop_index("ix_audit_logs_action",      table_name="audit_logs")
    op.drop_table("audit_logs")
