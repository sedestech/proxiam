"""Custom geographic layers uploaded by users — Sprint 21."""

from uuid import uuid4

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.database import Base


class GeoLayer(Base):
    __tablename__ = "geo_layers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    layer_type = Column(String(20), nullable=False)  # geojson | wms | wfs
    source_url = Column(String(500))
    geojson_data = Column(JSONB)
    feature_count = Column(Integer, default=0)
    style = Column(JSONB)
    visible = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
