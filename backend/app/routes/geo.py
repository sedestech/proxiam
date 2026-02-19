from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import PosteSource

router = APIRouter()


@router.get("/postes-sources")
async def list_postes(
    gestionnaire: str | None = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    query = select(PosteSource)
    if gestionnaire:
        query = query.where(PosteSource.gestionnaire == gestionnaire)
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/postes-sources/bbox")
async def postes_in_bbox(
    west: float = Query(...),
    south: float = Query(...),
    east: float = Query(...),
    north: float = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Return postes sources within a bounding box."""
    query = text("""
        SELECT id, nom, gestionnaire, tension_kv, puissance_mw,
               capacite_disponible_mw,
               ST_X(geom) as lon, ST_Y(geom) as lat
        FROM postes_sources
        WHERE geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
        LIMIT 500
    """)
    result = await db.execute(
        query, {"west": west, "south": south, "east": east, "north": north}
    )
    rows = result.mappings().all()
    return [dict(r) for r in rows]


@router.get("/postes-sources/nearest")
async def nearest_poste(
    lon: float = Query(...),
    lat: float = Query(...),
    limit: int = Query(5, le=20),
    db: AsyncSession = Depends(get_db),
):
    """Find nearest postes sources to a point."""
    query = text("""
        SELECT id, nom, gestionnaire, tension_kv, puissance_mw,
               capacite_disponible_mw,
               ST_X(geom) as lon, ST_Y(geom) as lat,
               ST_Distance(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography) as distance_m
        FROM postes_sources
        ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
        LIMIT :limit
    """)
    result = await db.execute(query, {"lon": lon, "lat": lat, "limit": limit})
    rows = result.mappings().all()
    return [dict(r) for r in rows]
