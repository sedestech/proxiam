"""Agent & ML prediction API routes — Sprint 23.

Endpoints for autonomous agent management and ML predictions.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin, require_user
from app.database import get_db
from app.models.agent_run import AgentRun, MlPrediction
from app.models.projet import Projet
from app.models.user import User
from app.services.agents import orchestrator
from app.services.ml_predictor import predictor, benchmark

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Agent Management ──


@router.get("/api/agents/status")
async def agents_status():
    """List all agents with their status and last run time."""
    return [
        {
            "name": entry["instance"].name,
            "enabled": entry["enabled"],
            "last_run": entry["last_run"].isoformat() if entry["last_run"] else None,
        }
        for entry in orchestrator.agents
    ]


@router.post("/api/agents/run")
async def run_all_agents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    """Trigger all agents manually (admin only)."""
    started_at = datetime.now(timezone.utc)

    results = await orchestrator.run_all(db)

    completed_at = datetime.now(timezone.utc)

    # Persist each agent run
    for result in results:
        run = AgentRun(
            agent_name=result["agent"],
            status="completed",
            started_at=started_at,
            completed_at=completed_at,
            actions_taken=result["actions_taken"],
            details=result["details"],
        )
        db.add(run)

    await db.commit()

    return {"runs": results, "total_agents": len(results)}


@router.post("/api/agents/{name}/run")
async def run_agent(
    name: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_admin),
):
    """Trigger a specific agent by name (admin only)."""
    started_at = datetime.now(timezone.utc)

    result = await orchestrator.run_one(name, db)
    if result is None:
        raise HTTPException(404, f"Agent '{name}' not found")

    completed_at = datetime.now(timezone.utc)

    # Persist the run
    run = AgentRun(
        agent_name=result["agent"],
        status="completed",
        started_at=started_at,
        completed_at=completed_at,
        actions_taken=result["actions_taken"],
        details=result["details"],
    )
    db.add(run)
    await db.commit()

    return result


# ── ML Predictions ──


@router.get("/api/predictions/{project_id}")
async def get_prediction(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Get ML success prediction for a project."""
    # Fetch project
    result = await db.execute(
        select(Projet).where(Projet.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Project not found")

    # Build feature dict from project data
    metadata = project.metadata_ or {}
    project_data = {
        "has_enrichment": bool(metadata.get("pvgis_enriched")),
        "has_score": project.score_global is not None,
        "score_value": project.score_global or 0,
        "distance_to_grid_km": metadata.get("distance_poste_km"),
        "has_regulatory": bool(metadata.get("regulatory_analysis")),
        "has_financial": bool(metadata.get("financial_analysis")),
        "irradiation_kwh": metadata.get("irradiation_kwh"),
    }

    prediction = predictor.predict_success(project_data)

    # Persist prediction
    ml_pred = MlPrediction(
        project_id=project_id,
        prediction_type="success",
        probability=prediction["probability"],
        confidence=prediction["confidence"],
        factors=prediction["factors"],
    )
    db.add(ml_pred)
    await db.commit()

    return {
        "project_id": project_id,
        "project_name": project.nom,
        **prediction,
    }


@router.get("/api/predictions/{project_id}/benchmark")
async def get_benchmark(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_user),
):
    """Get market benchmark for a project."""
    # Fetch project
    result = await db.execute(
        select(Projet).where(Projet.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Project not found")

    # Build comparison dict
    metadata = project.metadata_ or {}
    project_data = {
        "filiere": project.filiere or "solaire_sol",
        "lcoe_eur_mwh": metadata.get("lcoe_eur_mwh"),
        "capacity_factor_pct": metadata.get("capacity_factor_pct"),
        "capex_eur_kwc": metadata.get("capex_eur_kwc"),
        "irradiation_kwh": metadata.get("irradiation_kwh"),
    }

    bench = benchmark.benchmark_against_market(project_data)

    # Persist
    ml_pred = MlPrediction(
        project_id=project_id,
        prediction_type="benchmark",
        probability=bench["percentile"] / 100.0,
        confidence="high" if bench["comparisons"] else "low",
        factors=bench["comparisons"],
    )
    db.add(ml_pred)
    await db.commit()

    return {
        "project_id": project_id,
        "project_name": project.nom,
        **bench,
    }
