"""Agent run and ML prediction models — Sprint 23."""

from uuid import uuid4

from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.database import Base


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    agent_name = Column(String(50), nullable=False, index=True)
    status = Column(String(20), default="completed")  # completed | failed | running
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    actions_taken = Column(Integer, default=0)
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MlPrediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    prediction_type = Column(String(30))  # success | benchmark
    probability = Column(Float)
    confidence = Column(String(20))
    factors = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
