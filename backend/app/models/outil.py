from sqlalchemy import Column, Integer, String, Text, Numeric
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class Outil(Base):
    __tablename__ = "outils"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # "T-001"
    nom = Column(Text, nullable=False)
    editeur = Column(String(100))
    licence = Column(String(50))  # 'open_source','freemium','enterprise'
    cout_annuel_eur = Column(Numeric)
    url = Column(Text)
    description = Column(Text)
    metadata_ = Column("metadata", JSONB, default={})
