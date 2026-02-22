"""Add billing tables (subscriptions, api_keys, project_shares) — Sprint 22.

Revision ID: sprint22_billing
Revises: sprint21_geo_layers
Create Date: 2026-02-22
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "sprint22_billing"
down_revision = "sprint21_geo_layers"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "subscriptions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("stripe_customer_id", sa.String(100), unique=True),
        sa.Column("stripe_subscription_id", sa.String(100), unique=True),
        sa.Column("plan", sa.String(20), nullable=False, server_default="free"),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("current_period_start", sa.DateTime(timezone=True)),
        sa.Column("current_period_end", sa.DateTime(timezone=True)),
        sa.Column("cancel_at_period_end", sa.Boolean, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])

    op.create_table(
        "api_keys",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("key_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("key_prefix", sa.String(12), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("scopes", sa.Text, server_default="read"),
        sa.Column("rate_limit", sa.Integer, server_default="100"),
        sa.Column("last_used", sa.DateTime(timezone=True)),
        sa.Column("active", sa.Boolean, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_api_keys_user_id", "api_keys", ["user_id"])

    op.create_table(
        "project_shares",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("shared_with_id", UUID(as_uuid=True), nullable=False),
        sa.Column("permission", sa.String(20), server_default="read"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_project_shares_project_id", "project_shares", ["project_id"])


def downgrade():
    op.drop_index("ix_project_shares_project_id")
    op.drop_table("project_shares")
    op.drop_index("ix_api_keys_user_id")
    op.drop_table("api_keys")
    op.drop_index("ix_subscriptions_user_id")
    op.drop_table("subscriptions")
