"""User model — Sprint 17 (multi-tenant SaaS)."""
import uuid

from sqlalchemy import Boolean, Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, nullable=False)
    nom = Column(String)
    tier = Column(String(20), default="free")  # free | pro | admin
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    active = Column(Boolean, default=True)

    # Relationships
    projets = relationship("Projet", back_populates="user", lazy="selectin")
    usage_logs = relationship("UsageLog", back_populates="user", lazy="selectin")
