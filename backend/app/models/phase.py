from sqlalchemy import Column, Integer, String, Text, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base


class Bloc(Base):
    __tablename__ = "blocs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(5), unique=True, nullable=False)  # "B1"..."B8"
    titre = Column(Text, nullable=False)
    description = Column(Text)
    phase_debut = Column(Integer)
    phase_fin = Column(Integer)

    phases = relationship("Phase", back_populates="bloc")


class Phase(Base):
    __tablename__ = "phases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # "P0", "P0.1.3"
    bloc_id = Column(Integer, ForeignKey("blocs.id"))
    titre = Column(Text, nullable=False)
    description = Column(Text)
    ordre = Column(Integer)
    duree_jours_min = Column(Integer)
    duree_jours_max = Column(Integer)
    filiere = Column(ARRAY(String))  # {'solaire','eolien','bess','h2'}
    predecesseurs = Column(ARRAY(Integer))
    metadata_ = Column("metadata", JSONB, default={})

    bloc = relationship("Bloc", back_populates="phases")
