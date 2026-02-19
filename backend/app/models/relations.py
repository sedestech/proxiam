from sqlalchemy import Column, Integer, String, ForeignKey

from app.database import Base


class PhaseLivrable(Base):
    __tablename__ = "phase_livrables"
    phase_id = Column(Integer, ForeignKey("phases.id"), primary_key=True)
    livrable_id = Column(Integer, ForeignKey("livrables.id"), primary_key=True)
    obligatoire = Column(String(10))


class PhaseNorme(Base):
    __tablename__ = "phase_normes"
    phase_id = Column(Integer, ForeignKey("phases.id"), primary_key=True)
    norme_id = Column(Integer, ForeignKey("normes.id"), primary_key=True)
    criticite = Column(String(20))


class PhaseRisque(Base):
    __tablename__ = "phase_risques"
    phase_id = Column(Integer, ForeignKey("phases.id"), primary_key=True)
    risque_id = Column(Integer, ForeignKey("risques.id"), primary_key=True)
    phase_impact = Column(String(50))


class PhaseOutil(Base):
    __tablename__ = "phase_outils"
    phase_id = Column(Integer, ForeignKey("phases.id"), primary_key=True)
    outil_id = Column(Integer, ForeignKey("outils.id"), primary_key=True)
    usage = Column(String(100))


class PhaseCompetence(Base):
    __tablename__ = "phase_competences"
    phase_id = Column(Integer, ForeignKey("phases.id"), primary_key=True)
    competence_id = Column(Integer, ForeignKey("competences.id"), primary_key=True)
    niveau_requis = Column(Integer)


class RisqueNorme(Base):
    __tablename__ = "risque_normes"
    risque_id = Column(Integer, ForeignKey("risques.id"), primary_key=True)
    norme_id = Column(Integer, ForeignKey("normes.id"), primary_key=True)
    relation = Column(String(50))  # 'impose_par','mitigue_par'


class RisqueOutil(Base):
    __tablename__ = "risque_outils"
    risque_id = Column(Integer, ForeignKey("risques.id"), primary_key=True)
    outil_id = Column(Integer, ForeignKey("outils.id"), primary_key=True)
    relation = Column(String(50))  # 'detecte_par','mitigue_par'


class NormeLivrable(Base):
    __tablename__ = "norme_livrables"
    norme_id = Column(Integer, ForeignKey("normes.id"), primary_key=True)
    livrable_id = Column(Integer, ForeignKey("livrables.id"), primary_key=True)
    relation = Column(String(50))  # 'exige','valide'


class OutilCompetence(Base):
    __tablename__ = "outil_competences"
    outil_id = Column(Integer, ForeignKey("outils.id"), primary_key=True)
    competence_id = Column(Integer, ForeignKey("competences.id"), primary_key=True)
