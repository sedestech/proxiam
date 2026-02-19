from geoalchemy2 import Geometry
from sqlalchemy import Column, Integer, String, Text, Numeric, Date
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class PosteSource(Base):
    __tablename__ = "postes_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nom = Column(Text, nullable=False)
    gestionnaire = Column(String(50))  # 'RTE','Enedis','ELD'
    tension_kv = Column(Numeric)
    puissance_mw = Column(Numeric)
    capacite_disponible_mw = Column(Numeric)
    geom = Column(Geometry("POINT", srid=4326))
    source_donnees = Column(String(50))
    date_maj = Column(Date)
    metadata_ = Column("metadata", JSONB, default={})
