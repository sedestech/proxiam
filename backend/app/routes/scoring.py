"""Scoring API routes — Sprint 3 + Sprint 12 (batch scoring).

Endpoints:
  POST /api/projets/{id}/score   — calculate + persist score
  GET  /api/projets/{id}/score   — retrieve last calculated score
  POST /api/projets/batch-score  — score multiple projects (max 20)
  GET  /api/scoring/weights      — return weight configuration per filiere
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_user
from app.database import get_db
from app.models import Projet
from app.models.user import User
from app.services.scoring import calculate_score as compute_score, WEIGHTS, DEFAULT_WEIGHTS
from app.services.tier_limits import check_feature_access, check_quota_or_raise, log_usage
from app.routes.notifications import create_notification

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Shared helper (DRY) ───


async def _extract_coords(db: AsyncSession, projet) -> tuple[Optional[float], Optional[float]]:
    """Extract lon/lat from a project's PostGIS geometry."""
    if projet.geom is None:
        return None, None
    coord_result = await db.execute(
        text("SELECT ST_X(geom) as lon, ST_Y(geom) as lat FROM projets WHERE id = :id"),
        {"id": str(projet.id)},
    )
    coord_row = coord_result.mappings().first()
    if not coord_row:
        return None, None
    return float(coord_row["lon"]), float(coord_row["lat"])


async def _score_and_persist(db: AsyncSession, projet, lon, lat) -> dict:
    """Run scoring engine on a project and persist the result."""
    score_result = await compute_score(
        db=db,
        projet_id=str(projet.id),
        lon=lon,
        lat=lat,
        filiere=projet.filiere,
        departement=projet.departement,
        commune=projet.commune,
        surface_ha=float(projet.surface_ha) if projet.surface_ha else None,
        puissance_mwc=float(projet.puissance_mwc) if projet.puissance_mwc else None,
    )
    await db.execute(
        text("UPDATE projets SET score_global = :score WHERE id = :id"),
        {"score": score_result["score"], "id": str(projet.id)},
    )
    return score_result


# ─── Single score ───


@router.post("/projets/{projet_id}/score")
async def calculate_score(
    projet_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Calculate project score (0-100) based on 6 criteria.

    Reads the project from DB, extracts coordinates (geom), filiere,
    departement, surface_ha, puissance_mwc, then runs the scoring engine.
    Persists the global score on the project row.
    """
    await check_quota_or_raise(db, user, "score")

    result = await db.execute(
        select(Projet).where(Projet.id == projet_id)
    )
    projet = result.scalar_one_or_none()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    lon, lat = await _extract_coords(db, projet)
    score_result = await _score_and_persist(db, projet, lon, lat)
    await db.commit()

    await log_usage(db, user, "score")

    await create_notification(
        db, type="score_calculated",
        title=f"Score calcule : {score_result['score']}/100",
        message=f"Projet {projet.nom}",
        entity_type="projet", entity_id=str(projet_id),
    )

    return score_result


@router.get("/projets/{projet_id}/score")
async def get_score(
    projet_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
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


# ─── Batch score ───


class BatchScoreRequest(BaseModel):
    """Request body for batch scoring. Max 20 project IDs."""
    projet_ids: list[str] = Field(..., min_length=1, max_length=20)

    @field_validator("projet_ids")
    @classmethod
    def validate_no_duplicates(cls, v: list[str]) -> list[str]:
        if len(v) != len(set(v)):
            raise ValueError("Duplicate projet_ids not allowed")
        return v


@router.post("/projets/batch-score")
async def batch_score(
    body: BatchScoreRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Score multiple projects in one call (max 20). Returns per-project results.

    Security: Input validated via Pydantic (max 20 items, no duplicates).
    Each project is scored independently — one failure doesn't block others.
    Requires Pro tier or above.
    """
    await check_feature_access(user, "batch")

    results = []
    for pid in body.projet_ids:
        try:
            result = await db.execute(select(Projet).where(Projet.id == pid))
            projet = result.scalar_one_or_none()
            if not projet:
                results.append({"projet_id": pid, "score": None, "error": "not found"})
                continue

            lon, lat = await _extract_coords(db, projet)
            score_result = await _score_and_persist(db, projet, lon, lat)
            results.append({"projet_id": pid, "nom": projet.nom, "score": score_result["score"]})
        except Exception as exc:
            logger.warning("Batch scoring failed for project %s: %s", pid, exc)
            results.append({"projet_id": pid, "score": None, "error": "scoring_failed"})

    await db.commit()
    scored = [r for r in results if r.get("score") is not None]
    if scored:
        summary = ", ".join(f"{r['nom']}={r['score']}" for r in scored[:5])
        await create_notification(
            db, type="batch_scored",
            title=f"Batch scoring : {len(scored)} projets scores",
            message=f"Scores : {summary}",
        )
    return {"scored": len(scored), "results": results}


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
