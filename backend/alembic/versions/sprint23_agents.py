"""Add agent_runs and ml_predictions tables — Sprint 23.

Revision ID: sprint23_agents
Revises: sprint22_billing
Create Date: 2026-02-22
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "sprint23_agents"
down_revision = "sprint22_billing"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "agent_runs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("agent_name", sa.String(50), nullable=False),
        sa.Column("status", sa.String(20), server_default="completed"),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("actions_taken", sa.Integer, server_default="0"),
        sa.Column("details", sa.dialects.postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_agent_runs_agent_name", "agent_runs", ["agent_name"])

    op.create_table(
        "ml_predictions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", UUID(as_uuid=True), nullable=False),
        sa.Column("prediction_type", sa.String(30)),
        sa.Column("probability", sa.Float),
        sa.Column("confidence", sa.String(20)),
        sa.Column("factors", sa.dialects.postgresql.JSONB),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_ml_predictions_project_id", "ml_predictions", ["project_id"])


def downgrade():
    op.drop_index("ix_ml_predictions_project_id")
    op.drop_table("ml_predictions")
    op.drop_index("ix_agent_runs_agent_name")
    op.drop_table("agent_runs")
