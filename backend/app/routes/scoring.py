"""Scoring API routes — Sprint 3.

Endpoints:
  POST /api/projets/{id}/score  — calculate + persist score
  GET  /api/projets/{id}/score  — retrieve last calculated score
  GET  /api/scoring/weights     — return weight configuration per filiere
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Projet
from app.services.scoring import calculate_score as compute_score, WEIGHTS, DEFAULT_WEIGHTS

router = APIRouter()


@router.post("/projets/{projet_id}/score")
async def calculate_score(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Calculate project score (0-100) based on 6 criteria.

    Reads the project from DB, extracts coordinates (geom), filiere,
    departement, surface_ha, puissance_mwc, then runs the scoring engine.
    Persists the global score on the project row.
    """
    # Fetch project
    result = await db.execute(
        select(Projet).where(Projet.id == projet_id)
    )
    projet = result.scalar_one_or_none()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    # Extract coordinates from geom
    lon, lat = None, None
    if projet.geom is not None:
        coord_result = await db.execute(
            text("SELECT ST_X(geom) as lon, ST_Y(geom) as lat FROM projets WHERE id = :id"),
            {"id": str(projet_id)},
        )
        coord_row = coord_result.mappings().first()
        if coord_row:
            lon = float(coord_row["lon"])
            lat = float(coord_row["lat"])

    # Run scoring engine
    score_result = await compute_score(
        db=db,
        projet_id=str(projet_id),
        lon=lon,
        lat=lat,
        filiere=projet.filiere,
        departement=projet.departement,
        commune=projet.commune,
        surface_ha=float(projet.surface_ha) if projet.surface_ha else None,
        puissance_mwc=float(projet.puissance_mwc) if projet.puissance_mwc else None,
    )

    # Persist global score
    await db.execute(
        text("UPDATE projets SET score_global = :score WHERE id = :id"),
        {"score": score_result["score"], "id": str(projet_id)},
    )
    await db.commit()

    return score_result


@router.get("/projets/{projet_id}/score")
async def get_score(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve the last calculated score for a project.

    If no score has been calculated yet, returns score: null with a hint.
    """
    result = await db.execute(
        select(Projet).where(Projet.id == projet_id)
    )
    projet = result.scalar_one_or_none()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    if projet.score_global is None:
        return {
            "projet_id": str(projet_id),
            "score": None,
            "message": "Score non calcule. Utilisez POST pour calculer.",
        }

    return {
        "projet_id": str(projet_id),
        "score": projet.score_global,
    }


@router.get("/scoring/weights")
async def get_weights():
    """Return the scoring weight configuration per filiere."""
    return {
        "filieres": WEIGHTS,
        "default": DEFAULT_WEIGHTS,
        "criteria": [
            "proximite_reseau",
            "urbanisme",
            "environnement",
            "irradiation",
            "accessibilite",
            "risques",
        ],
    }
