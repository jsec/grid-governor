"""create identity tables

Revision ID: 7fa62325c785
Revises:
Create Date: 2026-08-23 18:13:04.320936

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "7fa62325c785"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "auth_user",
        sa.Column("id", sa.BigInteger, sa.Identity(always=True), primary_key=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column("email", sa.Text, nullable=False, unique=True),
        sa.Column("email_verified", sa.Boolean, server_default=sa.text("false"), nullable=False),
        sa.Column("password_hash", sa.Text),
        sa.Column("image", sa.Text),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true"), nullable=False),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_table(
        "account",
        sa.Column("account_id", sa.BigInteger, sa.Identity(always=True), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger,
            sa.ForeignKey("auth_user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("provider", sa.Text, nullable=False),
        sa.Column("provider_account_id", sa.Text, nullable=False),
        sa.Column("access_token", sa.Text),
        sa.Column("refresh_token", sa.Text),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True)),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.UniqueConstraint("provider", "provider_account_id"),
        sa.UniqueConstraint("user_id", "provider"),
    )
    op.create_index("account_user_id_idx", "account", ["user_id"])

    op.create_table(
        "session",
        sa.Column("session_id", sa.BigInteger, sa.Identity(always=True), primary_key=True),
        sa.Column(
            "user_id",
            sa.BigInteger,
            sa.ForeignKey("auth_user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token", sa.Text, nullable=False, unique=True),
        # FK to organization is added by the domain migration that creates that table.
        sa.Column("acting_as_org_id", sa.BigInteger),
        sa.Column("ip", postgresql.INET),
        sa.Column("user_agent", sa.Text),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
    )
    op.create_index("session_user_id_idx", "session", ["user_id"])

    op.create_table(
        "verification",
        sa.Column("verification_id", sa.BigInteger, sa.Identity(always=True), primary_key=True),
        sa.Column("user_id", sa.BigInteger, sa.ForeignKey("auth_user.id", ondelete="CASCADE")),
        sa.Column("purpose", sa.Text, nullable=False),
        sa.Column("token_hash", sa.Text, nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("consumed_at", sa.TIMESTAMP(timezone=True)),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("verification")
    op.drop_table("session")
    op.drop_table("account")
    op.drop_table("auth_user")
