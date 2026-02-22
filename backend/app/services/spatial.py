"""Spatial analysis service using PostGIS — Sprint 21."""

import json

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def buffer_analysis(db: AsyncSession, lon: float, lat: float, radius_km: float) -> dict:
    """Analyze what's within a radius around a point."""
    result = await db.execute(
        text("""
            WITH point AS (
                SELECT ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography AS geog
            )
            SELECT
                (SELECT COUNT(*) FROM postes_sources
                 WHERE ST_DWithin(geom::geography, point.geog, :radius_m)) AS postes_count,
                (SELECT COUNT(*) FROM natura2000
                 WHERE ST_DWithin(geom::geography, point.geog, :radius_m)) AS natura2000_count,
                (SELECT MIN(ST_Distance(geom::geography, point.geog))
                 FROM postes_sources) AS nearest_poste_m,
                (SELECT nom FROM postes_sources
                 ORDER BY geom::geography <-> point.geog LIMIT 1) AS nearest_poste_name
            FROM point
        """),
        {"lon": lon, "lat": lat, "radius_m": radius_km * 1000},
    )
    row = result.fetchone()
    return {
        "center": {"lon": lon, "lat": lat},
        "radius_km": radius_km,
        "postes_in_radius": row[0] if row else 0,
        "natura2000_in_radius": row[1] if row else 0,
        "nearest_poste_m": round(row[2], 1) if row and row[2] else None,
        "nearest_poste_name": row[3] if row else None,
    }


async def intersection_analysis(db: AsyncSession, geojson: dict) -> dict:
    """Check what a GeoJSON geometry intersects with."""
    geojson_str = json.dumps(geojson)
    result = await db.execute(
        text("""
            WITH input_geom AS (
                SELECT ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326) AS geom
            )
            SELECT
                (SELECT COUNT(*) FROM natura2000
                 WHERE ST_Intersects(natura2000.geom, input_geom.geom)) AS n2k_count,
                (SELECT COALESCE(array_agg(nom), '{}') FROM natura2000
                 WHERE ST_Intersects(natura2000.geom, input_geom.geom)) AS n2k_names,
                (SELECT COUNT(*) FROM postes_sources
                 WHERE ST_DWithin(postes_sources.geom::geography,
                                  input_geom.geom::geography, 10000)) AS postes_10km,
                ST_Area(input_geom.geom::geography) / 10000 AS area_ha
            FROM input_geom
        """),
        {"geojson": geojson_str},
    )
    row = result.fetchone()
    return {
        "natura2000_intersections": row[0] if row else 0,
        "natura2000_names": list(row[1]) if row and row[1] else [],
        "postes_within_10km": row[2] if row else 0,
        "area_ha": round(row[3], 2) if row and row[3] else 0,
    }


def _grid_proximity_label(dist_m: float | None) -> str:
    if dist_m is None:
        return "unknown"
    if dist_m < 2000:
        return "excellent"
    if dist_m < 5000:
        return "good"
    if dist_m < 10000:
        return "moderate"
    return "poor"


def _env_risk_label(count: int) -> str:
    if count > 3:
        return "high"
    if count > 0:
        return "moderate"
    return "low"


async def geographic_score(db: AsyncSession, lon: float, lat: float) -> dict:
    """Compute a geographic suitability score for a location."""
    buf = await buffer_analysis(db, lon, lat, radius_km=10)

    score = 50  # baseline

    # Grid proximity
    if buf["nearest_poste_m"] is not None:
        dist_km = buf["nearest_poste_m"] / 1000
        if dist_km < 2:
            score += 25
        elif dist_km < 5:
            score += 15
        elif dist_km < 10:
            score += 5
        else:
            score -= 10

    # Natura2000 risk
    n2k = buf["natura2000_in_radius"]
    if n2k > 0:
        score -= 15
    if n2k > 3:
        score -= 10

    # Grid density
    if buf["postes_in_radius"] > 5:
        score += 10
    elif buf["postes_in_radius"] > 2:
        score += 5

    score = max(0, min(100, score))

    return {
        "geographic_score": score,
        "factors": {
            "grid_proximity": _grid_proximity_label(buf["nearest_poste_m"]),
            "environmental_risk": _env_risk_label(n2k),
            "grid_density": "dense" if buf["postes_in_radius"] > 5 else "moderate" if buf["postes_in_radius"] > 2 else "sparse",
        },
        "details": buf,
    }
