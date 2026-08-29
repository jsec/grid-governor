from collections.abc import Sequence

from alembic import op

"""extensions

Revision ID: d50308613af5
Revises: 7fa62325c785
Create Date: 2026-08-24 17:40:30.567495

"""


revision: str = "d50308613af5"
down_revision: str | Sequence[str] | None = "7fa62325c785"


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
