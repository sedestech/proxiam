"""Environmental constraints service — Sprint 13.

Queries PostGIS tables (natura2000, znieff) to detect spatial
intersections with project locations. Returns a list of constraints
(zone name, type, distance) for a given point.
"""
import logging
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# Search radius for nearby constraints (meters)
SEARCH_RADIUS_M = 10_000  # 10 km


async def get_constraints(
    db: AsyncSession,
    lon: float,
    lat: float,
    radius_m: int = SEARCH_RADIUS_M,
) -> dict:
    """Get environmental constraints near a point.

    Returns:
        dict with:
            natura2000: list of intersecting/nearby Natura 2000 zones
            znieff: list of intersecting/nearby ZNIEFF zones
            summary: {total_constraints, in_zone, nearby}
    """
    point_wkt = f"ST_SetSRID(ST_MakePoint({lon}, {lat}), 4326)"

    natura2000 = await _query_zones(
        db, "natura2000", point_wkt, lon, lat, radius_m,
        code_col="site_code", type_col="type_zone",
    )
    znieff = await _query_zones(
        db, "znieff", point_wkt, lon, lat, radius_m,
        code_col="code_mnhn", type_col="type_zone",
    )

    in_zone = sum(1 for z in natura2000 + znieff if z["intersects"])
    nearby = sum(1 for z in natura2000 + znieff if not z["intersects"])

    return {
        "natura2000": natura2000,
        "znieff": znieff,
        "summary": {
            "total_constraints": len(natura2000) + len(znieff),
            "in_zone": in_zone,
            "nearby": nearby,
        },
    }


async def _query_zones(
    db: AsyncSession,
    table: str,
    point_wkt: str,
    lon: float,
    lat: float,
    radius_m: int,
    code_col: str = "site_code",
    type_col: str = "type_zone",
) -> list[dict]:
    """Query a spatial table for zones intersecting or near a point."""
    # Check if table exists (graceful degradation if not yet seeded)
    check_query = text("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_name = :table_name
        ) as exists
    """)
    result = await db.execute(check_query, {"table_name": table})
    row = result.mappings().first()
    if not row or not row["exists"]:
        logger.debug("Table %s does not exist, skipping constraint check", table)
        return []

    query = text(f"""
        SELECT
            {code_col} as code,
            nom,
            {type_col} as type_zone,
            surface_ha,
            ST_Intersects(
                geom,
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
            ) as intersects,
            ROUND(
                ST_Distance(
                    geom::geography,
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
                )::numeric
            ) as distance_m
        FROM {table}
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
            :radius
        )
        ORDER BY distance_m ASC
        LIMIT 10
    """)

    try:
        result = await db.execute(query, {"lon": lon, "lat": lat, "radius": radius_m})
        rows = result.mappings().all()
    except Exception as exc:
        logger.warning("Constraint query failed on %s: %s", table, exc)
        return []

    return [
        {
            "code": row["code"],
            "nom": row["nom"],
            "type_zone": row["type_zone"],
            "surface_ha": float(row["surface_ha"]) if row["surface_ha"] else None,
            "intersects": bool(row["intersects"]),
            "distance_m": int(row["distance_m"]),
        }
        for row in rows
    ]


async def get_nearest_postes(
    db: AsyncSession,
    lon: float,
    lat: float,
    limit: int = 3,
) -> list[dict]:
    """Get N nearest electrical substations with distance and capacity."""
    query = text("""
        SELECT
            id,
            nom,
            gestionnaire,
            tension_kv,
            puissance_mw,
            capacite_disponible_mw,
            ROUND(
                ST_Distance(
                    geom::geography,
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
                )::numeric
            ) as distance_m
        FROM postes_sources
        ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
        LIMIT :limit
    """)
    result = await db.execute(query, {"lon": lon, "lat": lat, "limit": limit})
    rows = result.mappings().all()

    return [
        {
            "id": row["id"],
            "nom": row["nom"],
            "gestionnaire": row["gestionnaire"],
            "tension_kv": float(row["tension_kv"]) if row["tension_kv"] else None,
            "puissance_mw": float(row["puissance_mw"]) if row["puissance_mw"] else None,
            "capacite_disponible_mw": (
                float(row["capacite_disponible_mw"])
                if row["capacite_disponible_mw"] else None
            ),
            "distance_m": int(row["distance_m"]),
            "distance_km": round(int(row["distance_m"]) / 1000, 1),
        }
        for row in rows
    ]
