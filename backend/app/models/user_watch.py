"""UserWatch + Alert models — Sprint 18.

Users can watch sources, keywords, geographic zones, or filieres.
When scraped content matches a watch, an Alert is created.
"""
import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UserWatch(Base):
    __tablename__ = "user_watches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    watch_type = Column(String(30), nullable=False)  # source | keyword | zone_geo | filiere
    watch_value = Column(String, nullable=False)  # source ID, keyword, dept code, filiere name
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
    alerts = relationship("Alert", back_populates="watch", lazy="selectin")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    watch_id = Column(UUID(as_uuid=True), ForeignKey("user_watches.id"), nullable=True)
    scraped_content_id = Column(UUID(as_uuid=True), ForeignKey("scraped_contents.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User")
    watch = relationship("UserWatch", back_populates="alerts")
