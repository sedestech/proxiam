"""AI analysis routes — Sprint 5 + Sprint 14 (expert consultant).

Endpoints:
  POST /api/projets/{id}/analyze   — AI-powered project analysis (expert mode)
  GET  /api/ai/status              — Check AI service availability
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings
from app.models import Projet
from app.services.ai import analyze_project
from app.services.scoring import calculate_score as compute_score
from app.services.regulatory import analyze_regulatory

router = APIRouter()


@router.get("/ai/status")
async def ai_status():
    """Check if the AI service is available (API key configured)."""
    has_key = bool(settings.anthropic_api_key)
    return {
        "available": has_key,
        "mode": "claude" if has_key else "template",
        "message": (
            "Claude API connecte"
            if has_key
            else "Mode template — configurez ANTHROPIC_API_KEY pour activer Claude"
        ),
    }


@router.post("/projets/{projet_id}/analyze")
async def analyze_projet(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Run AI analysis on a project.

    Fetches project data, computes score if needed, gets phase progression,
    then calls the AI service for analysis and recommendations.
    """
    # Fetch project
    query = text("""
        SELECT id, nom, filiere, puissance_mwc, surface_ha,
               commune, departement, region, statut, score_global,
               ST_X(geom) as lon, ST_Y(geom) as lat
        FROM projets
        WHERE id = :id
    """)
    result = await db.execute(query, {"id": projet_id})
    row = result.mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    project_data = {
        "id": str(row["id"]),
        "nom": row["nom"],
        "filiere": row["filiere"],
        "puissance_mwc": float(row["puissance_mwc"]) if row["puissance_mwc"] else None,
        "surface_ha": float(row["surface_ha"]) if row["surface_ha"] else None,
        "commune": row["commune"],
        "departement": row["departement"],
        "region": row["region"],
        "statut": row["statut"],
        "lon": float(row["lon"]) if row["lon"] else None,
        "lat": float(row["lat"]) if row["lat"] else None,
    }

    # Compute score
    score_data = None
    try:
        score_data = await compute_score(
            db=db,
            projet_id=str(row["id"]),
            lon=project_data["lon"],
            lat=project_data["lat"],
            filiere=row["filiere"],
            departement=row["departement"],
            commune=row["commune"],
            surface_ha=project_data["surface_ha"],
            puissance_mwc=project_data["puissance_mwc"],
        )
    except Exception:
        pass

    # Get phase progression
    phases_query = text("""
        SELECT b.code, b.titre,
               COALESCE(MAX(pp.completion_pct), 0) as completion_pct,
               CASE
                   WHEN MAX(pp.completion_pct) >= 100 THEN 'termine'
                   WHEN MAX(pp.completion_pct) > 0 THEN 'en_cours'
                   ELSE 'a_faire'
               END as statut
        FROM blocs b
        LEFT JOIN phases p ON p.bloc_id = b.id
        LEFT JOIN projet_phases pp ON pp.phase_id = p.id AND pp.projet_id = :projet_id
        GROUP BY b.id, b.code, b.titre
        ORDER BY b.code
    """)
    phases_result = await db.execute(phases_query, {"projet_id": projet_id})
    phases_data = [dict(r) for r in phases_result.mappings().all()]

    # Sprint 14: Load enrichment + regulatory data for expert context
    enrichment_data = None
    regulatory_data = None
    proj_result = await db.execute(select(Projet).where(Projet.id == projet_id))
    projet = proj_result.scalar_one_or_none()
    if projet:
        metadata = projet.metadata_ or {}
        enrichment_data = metadata.get("enrichment")

        regulatory_data = analyze_regulatory(
            filiere=row["filiere"] or "solaire_sol",
            puissance_mwc=float(row["puissance_mwc"]) if row["puissance_mwc"] else 1.0,
            surface_ha=float(row["surface_ha"]) if row["surface_ha"] else None,
            enrichment_data=enrichment_data,
        )

    # Run AI analysis (expert consultant mode)
    analysis = await analyze_project(
        project_data, score_data, phases_data,
        enrichment_data, regulatory_data,
    )

    return {
        "projet_id": projet_id,
        "projet_nom": row["nom"],
        "analysis": analysis,
    }
