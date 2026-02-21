"""Environmental constraint models — Sprint 13.

PostGIS tables for Natura 2000 and ZNIEFF zones.
Used by constraints service for spatial intersection queries.
"""
from geoalchemy2 import Geometry
from sqlalchemy import Column, Integer, String, Text, Numeric
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class Natura2000(Base):
    __tablename__ = "natura2000"

    id = Column(Integer, primary_key=True, autoincrement=True)
    site_code = Column(String(20), unique=True, nullable=False)
    nom = Column(Text, nullable=False)
    type_zone = Column(String(10))  # 'ZPS' or 'ZSC'
    surface_ha = Column(Numeric)
    region = Column(String(100))
    departement = Column(String(10))
    geom = Column(Geometry("MULTIPOLYGON", srid=4326))
    metadata_ = Column("metadata", JSONB, default={})


class Znieff(Base):
    __tablename__ = "znieff"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code_mnhn = Column(String(30), unique=True, nullable=False)
    nom = Column(Text, nullable=False)
    type_zone = Column(String(10))  # 'I' or 'II'
    surface_ha = Column(Numeric)
    region = Column(String(100))
    departement = Column(String(10))
    geom = Column(Geometry("MULTIPOLYGON", srid=4326))
    metadata_ = Column("metadata", JSONB, default={})
