from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class Livrable(Base):
    __tablename__ = "livrables"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # "L-001"
    phase_id = Column(Integer, ForeignKey("phases.id"))
    titre = Column(Text, nullable=False)
    description = Column(Text)
    type = Column(String(50))  # 'rapport','plan','certificat','contrat'
    template_url = Column(Text)
    obligatoire = Column(Boolean, default=False)
    metadata_ = Column("metadata", JSONB, default={})
