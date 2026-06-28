"""Create password_reset_tokens table — Phase 3.7 Secure Password Recovery.

Revision ID: 006
Revises: 005
Create Date: 2026-06-28
"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "password_reset_tokens",
        sa.Column("id",           sa.String(),                primary_key=True),
        sa.Column("user_id",      sa.String(),                nullable=False),
        sa.Column("user_email",   sa.String(),                nullable=False),
        sa.Column("hashed_token", sa.String(),                nullable=False),
        sa.Column("expires_at",   sa.DateTime(timezone=True), nullable=False),
        sa.Column("used_at",      sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at",   sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_prt_user_id",      "password_reset_tokens", ["user_id"])
    op.create_index("ix_prt_hashed_token", "password_reset_tokens", ["hashed_token"], unique=True)
    op.create_index("ix_prt_expires_at",   "password_reset_tokens", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_prt_expires_at",   table_name="password_reset_tokens")
    op.drop_index("ix_prt_hashed_token", table_name="password_reset_tokens")
    op.drop_index("ix_prt_user_id",      table_name="password_reset_tokens")
    op.drop_table("password_reset_tokens")
