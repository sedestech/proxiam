"""Enrichment, Regulatory & Financial API routes — Sprint 13-15.

Endpoints:
  POST /api/projets/{id}/enrich       — enrich a single project
  POST /api/projets/batch-enrich      — enrich multiple projects (max 20)
  GET  /api/projets/{id}/enrichment   — retrieve enrichment data
  GET  /api/projets/{id}/regulatory   — regulatory analysis with expert tips
  GET  /api/projets/{id}/financial    — financial estimation (CAPEX/OPEX/LCOE/TRI)
  POST /api/projets/{id}/report       — generate PDF feasibility report
"""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Projet
from app.services.pvgis import get_pvgis_data
from app.services.constraints import get_constraints, get_nearest_postes
from app.services.regulatory import analyze_regulatory
from app.services.financial import estimate_financial
from app.routes.notifications import create_notification

logger = logging.getLogger(__name__)

router = APIRouter()


async def _extract_coords(db: AsyncSession, projet) -> tuple:
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


async def _enrich_project(db: AsyncSession, projet) -> dict:
    """Enrich a single project with PVGIS data, constraints, and nearest postes."""
    lon, lat = await _extract_coords(db, projet)

    if lon is None or lat is None:
        raise HTTPException(
            status_code=400,
            detail="Projet sans coordonnees — enrichissement impossible",
        )

    # Fetch data in sequence (PVGIS is external, constraints are local)
    pvgis_data = await get_pvgis_data(lat, lon)
    constraints = await get_constraints(db, lon, lat)
    nearest_postes = await get_nearest_postes(db, lon, lat, limit=3)

    enrichment = {
        "pvgis": pvgis_data,
        "constraints": constraints,
        "nearest_postes": nearest_postes,
        "enriched_at": datetime.now(timezone.utc).isoformat(),
    }

    # Store in metadata JSONB
    current_metadata = projet.metadata_ or {}
    current_metadata["enrichment"] = enrichment
    await db.execute(
        text("UPDATE projets SET metadata = :meta WHERE id = :id"),
        {"meta": __import__("json").dumps(current_metadata), "id": str(projet.id)},
    )

    return {
        "projet_id": str(projet.id),
        "projet_nom": projet.nom,
        **enrichment,
    }


# ─── Single enrich ───


@router.post("/projets/{projet_id}/enrich")
async def enrich_project(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Enrich a project with PVGIS solar data, environmental constraints,
    and nearest electrical substations.

    Requires the project to have coordinates (geom).
    Data is stored in the project's metadata JSONB field.
    """
    result = await db.execute(select(Projet).where(Projet.id == projet_id))
    projet = result.scalar_one_or_none()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    enrichment = await _enrich_project(db, projet)
    await db.commit()

    await create_notification(
        db, type="project_enriched",
        title=f"Projet enrichi : {projet.nom}",
        message=f"PVGIS + contraintes + postes proches",
        entity_type="projet", entity_id=str(projet_id),
    )

    return enrichment


# ─── Batch enrich ───


class BatchEnrichRequest(BaseModel):
    """Request body for batch enrichment. Max 20 project IDs."""
    projet_ids: list[str] = Field(..., min_length=1, max_length=20)

    @field_validator("projet_ids")
    @classmethod
    def validate_no_duplicates(cls, v: list[str]) -> list[str]:
        if len(v) != len(set(v)):
            raise ValueError("Duplicate projet_ids not allowed")
        return v


@router.post("/projets/batch-enrich")
async def batch_enrich(body: BatchEnrichRequest, db: AsyncSession = Depends(get_db)):
    """Enrich multiple projects in one call (max 20).

    Each project is enriched independently — one failure doesn't block others.
    """
    results = []
    for pid in body.projet_ids:
        try:
            result = await db.execute(select(Projet).where(Projet.id == pid))
            projet = result.scalar_one_or_none()
            if not projet:
                results.append({"projet_id": pid, "status": "error", "error": "not found"})
                continue

            enrichment = await _enrich_project(db, projet)
            results.append({
                "projet_id": pid,
                "nom": projet.nom,
                "status": "enriched",
                "ghi": enrichment.get("pvgis", {}).get("ghi_kwh_m2_an"),
                "productible": enrichment.get("pvgis", {}).get("productible_kwh_kwc_an"),
                "constraints_count": enrichment.get("constraints", {}).get("summary", {}).get("total_constraints", 0),
                "nearest_poste_km": (
                    enrichment["nearest_postes"][0]["distance_km"]
                    if enrichment.get("nearest_postes") else None
                ),
            })
        except Exception as exc:
            logger.warning("Batch enrichment failed for project %s: %s", pid, exc)
            results.append({"projet_id": pid, "status": "error", "error": str(exc)})

    await db.commit()

    enriched = [r for r in results if r.get("status") == "enriched"]
    if enriched:
        summary = ", ".join(f"{r['nom']}" for r in enriched[:5])
        await create_notification(
            db, type="batch_enriched",
            title=f"Batch enrichissement : {len(enriched)} projets",
            message=f"Projets : {summary}",
        )

    return {"enriched": len(enriched), "results": results}


# ─── Get enrichment data ───


@router.get("/projets/{projet_id}/enrichment")
async def get_enrichment(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve stored enrichment data for a project."""
    result = await db.execute(select(Projet).where(Projet.id == projet_id))
    projet = result.scalar_one_or_none()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    metadata = projet.metadata_ or {}
    enrichment = metadata.get("enrichment")

    if not enrichment:
        return {
            "projet_id": str(projet_id),
            "enriched": False,
            "message": "Projet non enrichi. Utilisez POST /enrich.",
        }

    return {
        "projet_id": str(projet_id),
        "enriched": True,
        **enrichment,
    }


# ─── Regulatory analysis ───


@router.get("/projets/{projet_id}/regulatory")
async def get_regulatory(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Analyse réglementaire complète d'un projet.

    Retourne les obligations applicables (ICPE, EIE, PC, AE, raccordement),
    la timeline estimée, les conseils experts terrain, et le niveau de risque
    réglementaire. Utilise les données d'enrichissement si disponibles.
    """
    result = await db.execute(select(Projet).where(Projet.id == projet_id))
    projet = result.scalar_one_or_none()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    # Load enrichment data if available
    metadata = projet.metadata_ or {}
    enrichment_data = metadata.get("enrichment")

    filiere = projet.filiere or "solaire_sol"
    puissance = float(projet.puissance_mwc) if projet.puissance_mwc else 1.0
    surface = float(projet.surface_ha) if projet.surface_ha else None

    analysis = analyze_regulatory(
        filiere=filiere,
        puissance_mwc=puissance,
        surface_ha=surface,
        enrichment_data=enrichment_data,
    )

    return {
        "projet_id": str(projet.id),
        "projet_nom": projet.nom,
        "filiere": filiere,
        "puissance_mwc": puissance,
        "surface_ha": surface,
        "enriched": enrichment_data is not None,
        **analysis,
    }


# ─── Financial estimation ───


@router.get("/projets/{projet_id}/financial")
async def get_financial(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Estimation financiere rapide d'un projet ENR.

    Retourne CAPEX, OPEX, revenus, LCOE (EUR/MWh), TRI (%), payback period.
    Utilise les donnees d'enrichissement (PVGIS productible, distance poste)
    si disponibles, sinon benchmarks marche France 2024-2026.
    """
    result = await db.execute(select(Projet).where(Projet.id == projet_id))
    projet = result.scalar_one_or_none()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    metadata = projet.metadata_ or {}
    enrichment_data = metadata.get("enrichment")

    filiere = projet.filiere or "solaire_sol"
    puissance = float(projet.puissance_mwc) if projet.puissance_mwc else 1.0
    surface = float(projet.surface_ha) if projet.surface_ha else None

    financial = estimate_financial(
        filiere=filiere,
        puissance_mwc=puissance,
        surface_ha=surface,
        enrichment_data=enrichment_data,
    )

    return {
        "projet_id": str(projet.id),
        "projet_nom": projet.nom,
        "filiere": filiere,
        "puissance_mwc": puissance,
        "surface_ha": surface,
        "enriched": enrichment_data is not None,
        **financial,
    }


# ─── PDF Report ───


@router.post("/projets/{projet_id}/report")
async def generate_report(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Generate a PDF feasibility report for a project.

    Combines enrichment + regulatory + financial data into a single
    exportable PDF report. Returns the PDF as binary response.
    """
    result = await db.execute(select(Projet).where(Projet.id == projet_id))
    projet = result.scalar_one_or_none()
    if not projet:
        raise HTTPException(status_code=404, detail="Projet non trouve")

    metadata = projet.metadata_ or {}
    enrichment_data = metadata.get("enrichment")

    filiere = projet.filiere or "solaire_sol"
    puissance = float(projet.puissance_mwc) if projet.puissance_mwc else 1.0
    surface = float(projet.surface_ha) if projet.surface_ha else None

    # Gather all analysis data
    regulatory = analyze_regulatory(
        filiere=filiere, puissance_mwc=puissance,
        surface_ha=surface, enrichment_data=enrichment_data,
    )
    financial = estimate_financial(
        filiere=filiere, puissance_mwc=puissance,
        surface_ha=surface, enrichment_data=enrichment_data,
    )

    # Build project info dict
    coord_result = await db.execute(
        text("SELECT ST_X(geom) as lon, ST_Y(geom) as lat FROM projets WHERE id = :id"),
        {"id": str(projet.id)},
    )
    coord_row = coord_result.mappings().first()

    project_info = {
        "id": str(projet.id),
        "nom": projet.nom,
        "filiere": filiere,
        "puissance_mwc": puissance,
        "surface_ha": surface,
        "commune": projet.commune,
        "departement": projet.departement,
        "region": projet.region,
        "lat": float(coord_row["lat"]) if coord_row and coord_row["lat"] else None,
        "lon": float(coord_row["lon"]) if coord_row and coord_row["lon"] else None,
    }

    from app.services.report import generate_pdf_report
    pdf_bytes = generate_pdf_report(
        project_info=project_info,
        enrichment_data=enrichment_data,
        regulatory_data=regulatory,
        financial_data=financial,
    )

    filename = f"proxiam_rapport_{projet.nom.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"

    await create_notification(
        db, type="report_generated",
        title=f"Rapport genere : {projet.nom}",
        message="Rapport de faisabilite PDF telecharge",
        entity_type="projet", entity_id=str(projet.id),
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
