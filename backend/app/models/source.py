from sqlalchemy import Column, Integer, String, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class SourceVeille(Base):
    __tablename__ = "sources_veille"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # "V-001"
    nom = Column(Text, nullable=False)
    type = Column(String(50))  # 'api','rss','scraping','base_donnees'
    url = Column(Text)
    frequence = Column(String(20))  # 'temps_reel','quotidien','hebdo'
    gratuit = Column(Boolean, default=True)
    metadata_ = Column("metadata", JSONB, default={})
