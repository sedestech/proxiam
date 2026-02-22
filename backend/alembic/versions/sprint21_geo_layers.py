"""Add geo_layers table — Sprint 21.

Revision ID: sprint21_geo_layers
Revises: 294069174dfa
Create Date: 2026-02-22
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "sprint21_geo_layers"
down_revision = "294069174dfa"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "geo_layers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("layer_type", sa.String(20), nullable=False),
        sa.Column("source_url", sa.String(500)),
        sa.Column("geojson_data", JSONB),
        sa.Column("feature_count", sa.Integer, default=0),
        sa.Column("style", JSONB),
        sa.Column("visible", sa.Integer, default=1),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_geo_layers_user_id", "geo_layers", ["user_id"])


def downgrade():
    op.drop_index("ix_geo_layers_user_id")
    op.drop_table("geo_layers")
