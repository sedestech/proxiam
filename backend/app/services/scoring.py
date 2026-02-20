"""Site scoring engine — Sprint 3.

Evaluates a project site on 6 criteria (0-100 each) and computes a
weighted global score (0-100). Uses PostGIS for proximity calculations.

Criteria:
  1. proximite_reseau  — distance to nearest poste source (PostGIS)
  2. urbanisme         — urban planning compatibility (zone-based)
  3. environnement     — environmental sensitivity
  4. irradiation       — solar/wind resource potential (filiere-dependent)
  5. accessibilite     — site accessibility (road network proximity)
  6. risques           — aggregated risk score from linked project risks

Weights are configurable per filiere.
"""
from typing import Optional, Dict, Any

import logging
import math

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

# ─── Weights per filiere ─────────────────────────────────────────

WEIGHTS: Dict[str, Dict[str, float]] = {
    "solaire_sol": {
        "proximite_reseau": 0.25,
        "urbanisme": 0.15,
        "environnement": 0.15,
        "irradiation": 0.25,
        "accessibilite": 0.10,
        "risques": 0.10,
    },
    "eolien_onshore": {
        "proximite_reseau": 0.20,
        "urbanisme": 0.20,
        "environnement": 0.20,
        "irradiation": 0.15,
        "accessibilite": 0.10,
        "risques": 0.15,
    },
    "bess": {
        "proximite_reseau": 0.30,
        "urbanisme": 0.15,
        "environnement": 0.10,
        "irradiation": 0.05,
        "accessibilite": 0.15,
        "risques": 0.25,
    },
}

DEFAULT_WEIGHTS: Dict[str, float] = {
    "proximite_reseau": 0.25,
    "urbanisme": 0.15,
    "environnement": 0.15,
    "irradiation": 0.20,
    "accessibilite": 0.10,
    "risques": 0.15,
}

# ─── Scoring functions ───────────────────────────────────────────


async def _score_proximite_reseau(
    db: AsyncSession, lon: float, lat: float
) -> int:
    """Score based on distance to nearest poste source.

    0 km  → 100
    5 km  → 80
    20 km → 50
    50 km → 20
    >80 km → 5
    """
    query = text("""
        SELECT ST_Distance(
            geom::geography,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
        ) as distance_m
        FROM postes_sources
        ORDER BY geom <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
        LIMIT 1
    """)
    result = await db.execute(query, {"lon": lon, "lat": lat})
    row = result.mappings().first()

    if not row:
        return 0

    distance_km = row["distance_m"] / 1000.0

    if distance_km <= 1:
        return 100
    elif distance_km <= 5:
        return int(100 - (distance_km - 1) * 5)  # 100→80
    elif distance_km <= 20:
        return int(80 - (distance_km - 5) * 2)   # 80→50
    elif distance_km <= 50:
        return int(50 - (distance_km - 20) * 1)  # 50→20
    elif distance_km <= 80:
        return int(20 - (distance_km - 50) * 0.5)  # 20→5
    else:
        return 5


def _score_urbanisme(
    departement: Optional[str],
    commune: Optional[str],
    surface_ha: Optional[float],
) -> int:
    """Score based on urban planning compatibility.

    Simulated using departement and surface characteristics.
    In production, this would query PLU/RNU data via IGN API.
    """
    score = 60  # Base score

    # Larger sites score slightly lower (harder to get permits)
    if surface_ha is not None:
        if surface_ha < 5:
            score += 15
        elif surface_ha < 20:
            score += 10
        elif surface_ha < 50:
            score += 5
        else:
            score -= 5

    # Simulate regional favorability (southern departments are more
    # favorable for solar)
    if departement:
        dept_num = int(departement) if departement.isdigit() else 0
        if dept_num in range(1, 20):  # Northern departments
            score += 5
        elif dept_num in range(30, 50):  # Southern departments
            score += 15
        elif dept_num in range(60, 80):  # Central departments
            score += 10
        else:
            score += 8

    return max(0, min(100, score))


def _score_environnement(
    departement: Optional[str],
    filiere: Optional[str],
) -> int:
    """Score based on environmental sensitivity.

    Simulated. In production, uses DREAL/Natura 2000/ZNIEFF APIs.
    Lower score = more environmental constraints.
    """
    score = 70  # Base (most sites are moderately constrained)

    # Wind projects have higher environmental impact
    if filiere == "eolien_onshore":
        score -= 10

    # BESS has lower environmental impact
    if filiere == "bess":
        score += 10

    # Simulate some departement-level variation
    if departement:
        dept_num = int(departement) if departement.isdigit() else 0
        # Mountain/coastal departments: more constraints
        if dept_num in (4, 5, 6, 64, 65, 66, 73, 74):
            score -= 15
        # Agricultural plains: fewer constraints
        elif dept_num in (28, 36, 37, 41, 45, 51, 52):
            score += 10

    return max(0, min(100, score))


def _score_irradiation(
    lat: Optional[float],
    filiere: Optional[str],
) -> int:
    """Score based on solar irradiation or wind resource.

    Uses latitude as proxy. In production, uses PVGIS (solar) or
    Global Wind Atlas data.

    Solar: southern France gets more irradiation.
    Wind: northern/coastal France has more wind resource.
    """
    if lat is None:
        return 50

    if filiere == "eolien_onshore":
        # Wind: northern France and coastal areas are better
        # Latitude 48-51 (northern) → high score
        if lat >= 48:
            return min(100, int(60 + (lat - 48) * 10))
        elif lat >= 45:
            return int(50 + (lat - 45) * 3.3)
        else:
            return int(40 + (lat - 41) * 2.5)

    if filiere == "bess":
        # BESS: irradiation is less relevant
        return 70

    # Solar: southern France is better (lat 42-43 = best)
    if lat <= 43:
        return 95
    elif lat <= 45:
        return int(95 - (lat - 43) * 7.5)  # 95→80
    elif lat <= 47:
        return int(80 - (lat - 45) * 7.5)  # 80→65
    elif lat <= 49:
        return int(65 - (lat - 47) * 7.5)  # 65→50
    else:
        return max(35, int(50 - (lat - 49) * 5))  # 50→35


def _score_accessibilite(
    surface_ha: Optional[float],
    puissance_mwc: Optional[float],
) -> int:
    """Score based on site accessibility.

    Simulated using site size and capacity as proxy.
    In production, uses IGN route 500 / OpenStreetMap road network.
    """
    score = 65  # Base

    # Smaller sites are generally more accessible
    if surface_ha is not None:
        if surface_ha < 5:
            score += 15
        elif surface_ha < 20:
            score += 10
        elif surface_ha < 50:
            score += 5
        elif surface_ha > 100:
            score -= 10

    # High capacity implies good infrastructure
    if puissance_mwc is not None:
        if puissance_mwc > 50:
            score += 5
        elif puissance_mwc > 10:
            score += 3

    return max(0, min(100, score))


async def _score_risques(
    db: AsyncSession,
    projet_id: str,
) -> int:
    """Score based on project's linked risks.

    100 = no risks, 0 = many severe risks.
    Checks projet_risques junction table and computes inverse severity.
    """
    query = text("""
        SELECT COALESCE(AVG(r.severite), 0) as avg_severite,
               COUNT(pr.risque_id) as risk_count
        FROM projet_risques pr
        JOIN risques r ON r.id = pr.risque_id
        WHERE pr.projet_id = :projet_id
    """)
    result = await db.execute(query, {"projet_id": projet_id})
    row = result.mappings().first()

    if not row or row["risk_count"] == 0:
        return 75  # No risks linked = moderate score (unknown)

    avg_sev = float(row["avg_severite"])
    count = int(row["risk_count"])

    # Severity is 1-5, normalize to 0-100 (inverted: high severity = low score)
    severity_score = max(0, 100 - (avg_sev * 20))

    # Penalize for many risks (capped at 10)
    count_penalty = min(count, 10) * 2

    return max(0, min(100, int(severity_score - count_penalty)))


# ─── Public API ──────────────────────────────────────────────────


async def calculate_score(
    db: AsyncSession,
    projet_id: str,
    lon: Optional[float] = None,
    lat: Optional[float] = None,
    filiere: Optional[str] = None,
    departement: Optional[str] = None,
    commune: Optional[str] = None,
    surface_ha: Optional[float] = None,
    puissance_mwc: Optional[float] = None,
) -> Dict[str, Any]:
    """Calculate the 6-criteria score for a project.

    Args:
        db: Database session.
        projet_id: Project UUID.
        lon, lat: Project coordinates (from geom).
        filiere: Project type (solaire_sol, eolien_onshore, bess).
        departement: Department code.
        commune: Commune name.
        surface_ha: Site surface in hectares.
        puissance_mwc: Installed capacity in MWc.

    Returns:
        Dict with score (0-100), details per criterion, weights used,
        and metadata.
    """
    details: Dict[str, int] = {}

    # 1. Proximite reseau (needs coordinates + PostGIS)
    if lon is not None and lat is not None:
        details["proximite_reseau"] = await _score_proximite_reseau(db, lon, lat)
    else:
        details["proximite_reseau"] = 0

    # 2. Urbanisme
    details["urbanisme"] = _score_urbanisme(departement, commune, surface_ha)

    # 3. Environnement
    details["environnement"] = _score_environnement(departement, filiere)

    # 4. Irradiation / resource
    details["irradiation"] = _score_irradiation(lat, filiere)

    # 5. Accessibilite
    details["accessibilite"] = _score_accessibilite(surface_ha, puissance_mwc)

    # 6. Risques
    details["risques"] = await _score_risques(db, projet_id)

    # Weighted global score
    weights = WEIGHTS.get(filiere or "", DEFAULT_WEIGHTS)
    global_score = sum(
        details[criterion] * weight
        for criterion, weight in weights.items()
    )
    global_score = max(0, min(100, round(global_score)))

    return {
        "projet_id": projet_id,
        "score": global_score,
        "details": details,
        "weights": weights,
        "filiere": filiere,
    }
