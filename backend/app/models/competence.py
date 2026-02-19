from sqlalchemy import Column, Integer, String, Text, ARRAY
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class Competence(Base):
    __tablename__ = "competences"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # "SK-001"
    nom = Column(Text, nullable=False)
    pole = Column(String(50))  # 'R&D','environnement','genie_civil'
    niveau_requis = Column(Integer)  # 1-5
    certifications = Column(ARRAY(String))
    metadata_ = Column("metadata", JSONB, default={})
