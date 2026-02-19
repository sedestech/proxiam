from sqlalchemy import Column, Integer, String, Text, Numeric
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class Risque(Base):
    __tablename__ = "risques"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # "R-001"
    titre = Column(Text, nullable=False)
    description = Column(Text)
    categorie = Column(String(50))  # 'foncier','reseau','environnement','financier'
    severite = Column(Integer)  # 1-5
    probabilite = Column(Integer)  # 1-100
    impact_financier_eur = Column(Numeric)
    impact_delai_jours = Column(Integer)
    mitigation = Column(Text)
    metadata_ = Column("metadata", JSONB, default={})
