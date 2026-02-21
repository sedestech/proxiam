"""ScrapedContent model — Sprint 18 (veille active).

Stores scraped content from monitored sources with SHA256 change detection.
Only re-analyzed by AI when content actually changes.
"""
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.database import Base


class ScrapedContent(Base):
    __tablename__ = "scraped_contents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(Integer, ForeignKey("sources_veille.id"), nullable=True, index=True)
    url = Column(String, nullable=False)
    title = Column(String)
    content_text = Column(Text)
    content_hash = Column(String(64))  # SHA256
    ai_summary = Column(Text)
    ai_tags = Column(JSONB)  # e.g. ["solaire", "reglementation", "MRAe"]
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_checked = Column(DateTime(timezone=True))
    last_changed = Column(DateTime(timezone=True))
    status = Column(String(20), default="new")  # new | analyzed | error
