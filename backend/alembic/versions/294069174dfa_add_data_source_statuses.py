"""add_data_source_statuses

Revision ID: 294069174dfa
Revises: c1620ced36e0
Create Date: 2026-02-21 19:30:35.543159
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '294069174dfa'
down_revision: Union[str, None] = 'c1620ced36e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('data_source_statuses',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('source_name', sa.String(length=50), nullable=False),
    sa.Column('display_name', sa.String(length=100), nullable=False),
    sa.Column('category', sa.String(length=30), nullable=False),
    sa.Column('record_count', sa.Integer(), nullable=True),
    sa.Column('last_updated', sa.DateTime(timezone=True), nullable=True),
    sa.Column('update_frequency_days', sa.Integer(), nullable=True),
    sa.Column('quality_score', sa.Integer(), nullable=True),
    sa.Column('status', sa.String(length=20), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_data_source_statuses_source_name'), 'data_source_statuses', ['source_name'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_data_source_statuses_source_name'), table_name='data_source_statuses')
    op.drop_table('data_source_statuses')
