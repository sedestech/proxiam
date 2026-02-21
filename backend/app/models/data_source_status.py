"""Data source health tracking — Sprint 19."""
from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class DataSourceStatus(Base):
    __tablename__ = "data_source_statuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_name = Column(String(50), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    category = Column(String(30), nullable=False)  # geospatial, financial, knowledge, veille
    record_count = Column(Integer, default=0)
    last_updated = Column(DateTime(timezone=True))
    update_frequency_days = Column(Integer, default=90)
    quality_score = Column(Integer, default=0)  # 0-100
    status = Column(String(20), default="ok")  # ok, stale, error, loading
    notes = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
