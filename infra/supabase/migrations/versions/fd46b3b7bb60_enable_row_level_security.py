"""enable row level security

Revision ID: fd46b3b7bb60
Revises: c56f7cc4a473
Create Date: 2026-09-13
"""

from typing import Sequence, Union

from alembic import op


revision: str = "fd46b3b7bb60"
down_revision: Union[str, None] = "c56f7cc4a473"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = [
    "workspaces",
    "companies",
    "analysis_runs",
    "analysis_results",
]


def upgrade() -> None:
    for table in TABLES:
        op.execute(
            f'ALTER TABLE public."{table}" ENABLE ROW LEVEL SECURITY'
        )


def downgrade() -> None:
    for table in TABLES:
        op.execute(
            f'ALTER TABLE public."{table}" DISABLE ROW LEVEL SECURITY'
        )
