"""add cascade delete for alerts

Revision ID: da45a474b601
Revises: 0d6439d2e79f
Create Date: 2026-04-27 02:40:36.391336

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = 'da45a474b601'
down_revision: Union[str, Sequence[str], None] = '0d6439d2e79f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "alerts_file_id_fkey",
        "alerts",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "alerts_file_id_fkey",
        "alerts",
        "files",
        ["file_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(op.f('ix_files_created_at'), 'files', ['created_at'], unique=False)
    op.create_index(op.f('ix_alerts_file_id'), 'alerts', ['file_id'], unique=False)


def downgrade() -> None:
    op.drop_constraint(
        "alerts_file_id_fkey",
        "alerts",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "alerts_file_id_fkey",
        "alerts",
        "files",
        ["file_id"],
        ["id"],
    )
    op.drop_index(op.f('ix_alerts_file_id'), table_name='alerts')
    op.drop_index(op.f('ix_files_created_at'), table_name='files')
