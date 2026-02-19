import uuid

from geoalchemy2 import Geometry
from sqlalchemy import Column, Integer, String, Text, Numeric, ForeignKey, BigInteger, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func

from app.database import Base


class Projet(Base):
    __tablename__ = "projets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom = Column(Text, nullable=False)
    filiere = Column(String(50))  # 'solaire_sol','eolien_onshore','bess'
    puissance_mwc = Column(Numeric)
    surface_ha = Column(Numeric)
    geom = Column(Geometry("POINT", srid=4326))
    emprise = Column(Geometry("POLYGON", srid=4326))
    commune = Column(String(100))
    departement = Column(String(3))
    region = Column(String(50))
    statut = Column(String(50), default="prospection")
    phase_courante_id = Column(Integer, ForeignKey("phases.id"))
    score_global = Column(Integer)  # 0-100
    date_creation = Column(DateTime(timezone=True), server_default=func.now())
    metadata_ = Column("metadata", JSONB, default={})


class ProjetPhase(Base):
    __tablename__ = "projet_phases"

    projet_id = Column(UUID(as_uuid=True), ForeignKey("projets.id"), primary_key=True)
    phase_id = Column(Integer, ForeignKey("phases.id"), primary_key=True)
    statut = Column(String(20), default="a_faire")
    date_debut = Column(DateTime)
    date_fin = Column(DateTime)
    completion_pct = Column(Integer, default=0)
    notes = Column(Text)
    metadata_ = Column("metadata", JSONB, default={})


class ProjetRisque(Base):
    __tablename__ = "projet_risques"

    projet_id = Column(UUID(as_uuid=True), ForeignKey("projets.id"), primary_key=True)
    risque_id = Column(Integer, ForeignKey("risques.id"), primary_key=True)
    statut = Column(String(20), default="identifie")
    severite_reelle = Column(Integer)
    probabilite_reelle = Column(Integer)
    actions = Column(Text)
    responsable = Column(String(100))


class ProjetDocument(Base):
    __tablename__ = "projet_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    projet_id = Column(UUID(as_uuid=True), ForeignKey("projets.id"), nullable=False)
    livrable_id = Column(Integer, ForeignKey("livrables.id"))
    nom_fichier = Column(Text, nullable=False)
    chemin_minio = Column(Text)
    type_mime = Column(String(100))
    taille_octets = Column(BigInteger)
    hash_sha256 = Column(String(64))
    analyse_ia = Column(JSONB)
    date_upload = Column(DateTime(timezone=True), server_default=func.now())
