from typing import Optional
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import PosteSource

router = APIRouter()


def _build_feature(row: dict) -> dict:
    """Build a GeoJSON Feature from a row containing geojson + property columns."""
    geometry = json.loads(row["geojson"])
    properties = {
        "id": row["id"],
        "nom": row["nom"],
        "gestionnaire": row["gestionnaire"],
        "tension_kv": float(row["tension_kv"]) if row["tension_kv"] is not None else None,
        "puissance_mw": float(row["puissance_mw"]) if row["puissance_mw"] is not None else None,
        "capacite_disponible_mw": (
            float(row["capacite_disponible_mw"])
            if row["capacite_disponible_mw"] is not None
            else None
        ),
    }
    return {"type": "Feature", "geometry": geometry, "properties": properties}


def _build_feature_collection(rows) -> dict:
    """Build a GeoJSON FeatureCollection from database rows."""
    features = [_build_feature(dict(r)) for r in rows]
    return {"type": "FeatureCollection", "features": features}


@router.get("/postes-sources")
async def list_postes(
    gestionnaire: Optional[str] = None,
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


@router.get("/postes-sources/geojson")
async def postes_geojson(
    gestionnaire: Optional[str] = None,
    tension_min: Optional[float] = None,
    capacite_min: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    """Return ALL postes sources as a GeoJSON FeatureCollection for MapLibre GL.

    Uses PostGIS ST_AsGeoJSON() for server-side geometry serialization (faster
    than Python-side conversion).

    Filters:
        gestionnaire: Filter by grid operator (e.g. 'RTE', 'Enedis', 'ELD').
        tension_min:  Minimum tension in kV.
        capacite_min: Minimum available capacity in MW.
    """
    # Build query dynamically with optional filters
    conditions: list[str] = ["geom IS NOT NULL"]
    params: dict = {}

    if gestionnaire:
        conditions.append("gestionnaire = :gestionnaire")
        params["gestionnaire"] = gestionnaire

    if tension_min is not None:
        conditions.append("tension_kv >= :tension_min")
        params["tension_min"] = tension_min

    if capacite_min is not None:
        conditions.append("capacite_disponible_mw >= :capacite_min")
        params["capacite_min"] = capacite_min

    where_clause = " AND ".join(conditions)

    query = text(f"""
        SELECT id, nom, gestionnaire, tension_kv, puissance_mw,
               capacite_disponible_mw,
               ST_AsGeoJSON(geom) as geojson
        FROM postes_sources
        WHERE {where_clause}
    """)
    result = await db.execute(query, params)
    rows = result.mappings().all()

    feature_collection = _build_feature_collection(rows)

    return JSONResponse(
        content=feature_collection,
        media_type="application/geo+json",
    )


@router.get("/postes-sources/bbox")
async def postes_in_bbox(
    west: float = Query(...),
    south: float = Query(...),
    east: float = Query(...),
    north: float = Query(...),
    format: Optional[str] = Query(None, description="Response format: 'geojson' for GeoJSON FeatureCollection, omit for JSON list"),
    db: AsyncSession = Depends(get_db),
):
    """Return postes sources within a bounding box.

    By default returns a flat JSON list. Pass `format=geojson` to get a GeoJSON
    FeatureCollection suitable for direct use in MapLibre GL.
    """
    if format == "geojson":
        query = text("""
            SELECT id, nom, gestionnaire, tension_kv, puissance_mw,
                   capacite_disponible_mw,
                   ST_AsGeoJSON(geom) as geojson
            FROM postes_sources
            WHERE geom && ST_MakeEnvelope(:west, :south, :east, :north, 4326)
            LIMIT 500
        """)
        result = await db.execute(
            query, {"west": west, "south": south, "east": east, "north": north}
        )
        rows = result.mappings().all()

        feature_collection = _build_feature_collection(rows)

        return JSONResponse(
            content=feature_collection,
            media_type="application/geo+json",
        )

    # Default: flat JSON list (original behavior)
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


# ── Spatial analysis endpoints (Sprint 21) ──


@router.get("/spatial/buffer")
async def spatial_buffer(
    lon: float = Query(...),
    lat: float = Query(...),
    radius_km: float = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Buffer analysis around a point."""
    from app.services.spatial import buffer_analysis

    return await buffer_analysis(db, lon, lat, radius_km)


@router.get("/spatial/score")
async def spatial_score(
    lon: float = Query(...),
    lat: float = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Geographic suitability score for a location."""
    from app.services.spatial import geographic_score

    return await geographic_score(db, lon, lat)


@router.post("/spatial/intersect")
async def spatial_intersect(
    body: dict,
    db: AsyncSession = Depends(get_db),
):
    """Check intersections of a GeoJSON geometry."""
    geojson = body.get("geometry")
    if not geojson:
        raise HTTPException(400, "Missing 'geometry' in body")
    from app.services.spatial import intersection_analysis

    return await intersection_analysis(db, geojson)
