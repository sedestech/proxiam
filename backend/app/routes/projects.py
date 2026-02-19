from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Projet

router = APIRouter()


@router.get("/projets")
async def list_projets(
    filiere: str | None = None,
    statut: str | None = None,
    region: str | None = None,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(Projet)
    if filiere:
        query = query.where(Projet.filiere == filiere)
    if statut:
        query = query.where(Projet.statut == statut)
    if region:
        query = query.where(Projet.region == region)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/projets/{projet_id}")
async def get_projet(projet_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Projet).where(Projet.id == projet_id))
    return result.scalar_one_or_none()
