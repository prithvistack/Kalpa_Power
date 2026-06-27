"""Create otp_tokens table for Email MFA.

Revision ID: 005
Revises: 004
Create Date: 2026-06-27
"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "otp_tokens",
        sa.Column("id",                 sa.String(),                primary_key=True),
        sa.Column("user_id",            sa.String(),                nullable=False),
        sa.Column("user_email",         sa.String(),                nullable=False),
        sa.Column("otp_hash",           sa.String(),                nullable=False),
        sa.Column("mfa_session_token",  sa.String(),                nullable=False),
        sa.Column("expires_at",         sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts",           sa.Integer(),               nullable=False, server_default="0"),
        sa.Column("created_at",         sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_otp_tokens_mfa_session_token", "otp_tokens", ["mfa_session_token"], unique=True)
    op.create_index("ix_otp_tokens_user_id",           "otp_tokens", ["user_id"])
    op.create_index("ix_otp_tokens_expires_at",        "otp_tokens", ["expires_at"])


def downgrade() -> None:
    op.drop_index("ix_otp_tokens_expires_at",        table_name="otp_tokens")
    op.drop_index("ix_otp_tokens_user_id",           table_name="otp_tokens")
    op.drop_index("ix_otp_tokens_mfa_session_token", table_name="otp_tokens")
    op.drop_table("otp_tokens")
