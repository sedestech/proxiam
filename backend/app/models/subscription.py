"""Stripe subscription + API key models — Sprint 22."""

from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    stripe_customer_id = Column(String(100), unique=True)
    stripe_subscription_id = Column(String(100), unique=True)
    plan = Column(String(20), nullable=False, default="free")  # free | pro | enterprise
    status = Column(String(20), default="active")  # active | canceled | past_due | trialing
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))
    cancel_at_period_end = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    key_hash = Column(String(64), unique=True, nullable=False)  # SHA256 of the key
    key_prefix = Column(String(12), nullable=False)  # First 8 chars for display
    name = Column(String(100), nullable=False)
    scopes = Column(Text, default="read")  # comma-separated: read,write,admin
    rate_limit = Column(Integer, default=100)  # requests per minute
    last_used = Column(DateTime(timezone=True))
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProjectShare(Base):
    __tablename__ = "project_shares"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    project_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    owner_id = Column(UUID(as_uuid=True), nullable=False)
    shared_with_id = Column(UUID(as_uuid=True), nullable=False)
    permission = Column(String(20), default="read")  # read | write | admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
