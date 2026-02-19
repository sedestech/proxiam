from sqlalchemy import Column, Integer, String, Text, Date
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class Norme(Base):
    __tablename__ = "normes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # "S-001"
    titre = Column(Text, nullable=False)
    reference_legale = Column(Text)  # "Code urbanisme art. L.151-11"
    organisme = Column(String(100))  # "AFNOR","IEC","ISO"
    perimetre = Column(String(50))  # 'national','regional','europeen'
    date_revision = Column(Date)
    url = Column(Text)
    metadata_ = Column("metadata", JSONB, default={})
