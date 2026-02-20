from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Phase, Bloc, Livrable, Norme, Risque, SourceVeille, Outil, Competence

router = APIRouter()


# ─── Phases ───

@router.get("/phases")
async def list_phases(
    bloc: Optional[str] = Query(None, description="Filter by bloc code (e.g. B1)"),
    filiere: Optional[str] = Query(None, description="Filter by filière (solaire, eolien, bess, h2)"),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Phase)
    if bloc:
        query = query.join(Bloc).where(Bloc.code == bloc.upper())
    if filiere:
        query = query.where(Phase.filiere.any(filiere))
    query = query.order_by(Phase.ordre).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/phases/{phase_id}")
async def get_phase(phase_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Phase).where(Phase.id == phase_id))
    return result.scalar_one_or_none()


@router.get("/phases/{phase_id}/normes")
async def phase_normes(phase_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.relations import PhaseNorme
    query = (
        select(Norme)
        .join(PhaseNorme, PhaseNorme.norme_id == Norme.id)
        .where(PhaseNorme.phase_id == phase_id)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/phases/{phase_id}/risques")
async def phase_risques(phase_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.relations import PhaseRisque
    query = (
        select(Risque)
        .join(PhaseRisque, PhaseRisque.risque_id == Risque.id)
        .where(PhaseRisque.phase_id == phase_id)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/phases/{phase_id}/livrables")
async def phase_livrables(phase_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.relations import PhaseLivrable
    query = (
        select(Livrable)
        .join(PhaseLivrable, PhaseLivrable.livrable_id == Livrable.id)
        .where(PhaseLivrable.phase_id == phase_id)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/phases/{phase_id}/outils")
async def phase_outils(phase_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.relations import PhaseOutil
    query = (
        select(Outil)
        .join(PhaseOutil, PhaseOutil.outil_id == Outil.id)
        .where(PhaseOutil.phase_id == phase_id)
    )
    result = await db.execute(query)
    return result.scalars().all()


# ─── Blocs ───

@router.get("/blocs")
async def list_blocs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Bloc).order_by(Bloc.code))
    return result.scalars().all()


# ─── Normes ───

@router.get("/normes")
async def list_normes(
    phase: Optional[str] = Query(None, description="Filter by phase code (e.g. P0)"),
    organisme: Optional[str] = None,
    perimetre: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Norme)
    if phase:
        from app.models.relations import PhaseNorme
        query = query.join(PhaseNorme).join(Phase).where(Phase.code == phase.upper())
    if organisme:
        query = query.where(Norme.organisme == organisme)
    if perimetre:
        query = query.where(Norme.perimetre == perimetre)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/normes/{norme_id}")
async def get_norme(norme_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Norme).where(Norme.id == norme_id))
    return result.scalar_one_or_none()


# ─── Risques ───

@router.get("/risques")
async def list_risques(
    categorie: Optional[str] = None,
    severite_min: Optional[int] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Risque)
    if categorie:
        query = query.where(Risque.categorie == categorie)
    if severite_min:
        query = query.where(Risque.severite >= severite_min)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/risques/{risque_id}")
async def get_risque(risque_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Risque).where(Risque.id == risque_id))
    return result.scalar_one_or_none()


@router.get("/risques/{risque_id}/outils")
async def risque_outils(risque_id: int, db: AsyncSession = Depends(get_db)):
    from app.models.relations import RisqueOutil
    query = (
        select(Outil)
        .join(RisqueOutil, RisqueOutil.outil_id == Outil.id)
        .where(RisqueOutil.risque_id == risque_id)
    )
    result = await db.execute(query)
    return result.scalars().all()


# ─── Outils ───

@router.get("/outils")
async def list_outils(
    licence: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Outil)
    if licence:
        query = query.where(Outil.licence == licence)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/outils/{outil_id}")
async def get_outil(outil_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Outil).where(Outil.id == outil_id))
    return result.scalar_one_or_none()


# ─── Sources de veille ───

@router.get("/sources")
async def list_sources(
    type: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(SourceVeille)
    if type:
        query = query.where(SourceVeille.type == type)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


# ─── Compétences ───

@router.get("/competences")
async def list_competences(
    pole: Optional[str] = None,
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Competence)
    if pole:
        query = query.where(Competence.pole == pole)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
