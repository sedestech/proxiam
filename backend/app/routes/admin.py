"""Admin API routes — Sprint 17.

User management, usage/cost monitoring, platform stats.
Requires admin tier authentication.
"""
import logging
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.config import settings
from app.database import get_db
from app.models.usage_log import UsageLog
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Health (kept public for monitoring) ───


@router.get("/admin/health")
async def admin_health(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Detailed health check for admin dashboard.

    Checks: PostgreSQL, Redis, Meilisearch, AI service.
    """
    services = {}

    # PostgreSQL
    try:
        t0 = time.monotonic()
        result = await db.execute(text("SELECT version()"))
        pg_version = result.scalar()
        latency = round((time.monotonic() - t0) * 1000)

        result2 = await db.execute(text("""
            SELECT pg_database_size(current_database()) as db_size,
                   (SELECT COUNT(*) FROM projets) as projets,
                   (SELECT COUNT(*) FROM postes_sources) as postes,
                   (SELECT COUNT(*) FROM phases) as phases
        """))
        row = result2.mappings().first()
        services["postgresql"] = {
            "status": "ok",
            "latency_ms": latency,
            "version": pg_version[:30] if pg_version else None,
            "db_size_mb": round(row["db_size"] / 1024 / 1024, 1),
            "counts": {
                "projets": row["projets"],
                "postes_sources": row["postes"],
                "phases": row["phases"],
            },
        }
    except Exception as e:
        logger.error("PostgreSQL health check failed: %s", e)
        services["postgresql"] = {"status": "error", "error": "Connection failed"}

    # Redis
    try:
        import redis.asyncio as aioredis
        redis_url = f"redis://{settings.redis_host}:{settings.redis_port}"
        t0 = time.monotonic()
        r = aioredis.from_url(redis_url, decode_responses=True)
        await r.ping()
        latency = round((time.monotonic() - t0) * 1000)
        info = await r.info("memory")
        await r.aclose()
        services["redis"] = {
            "status": "ok",
            "latency_ms": latency,
            "used_memory_mb": round(info.get("used_memory", 0) / 1024 / 1024, 1),
        }
    except Exception as e:
        logger.error("Redis health check failed: %s", e)
        services["redis"] = {"status": "error", "error": "Connection failed"}

    # Meilisearch
    try:
        import httpx
        meili_url = settings.meili_host
        t0 = time.monotonic()
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{meili_url}/health")
            latency = round((time.monotonic() - t0) * 1000)
            if resp.status_code == 200:
                headers = {}
                if settings.meili_master_key:
                    headers["Authorization"] = f"Bearer {settings.meili_master_key}"
                stats_resp = await client.get(f"{meili_url}/stats", headers=headers)
                ms_stats = stats_resp.json() if stats_resp.status_code == 200 else {}
                services["meilisearch"] = {
                    "status": "ok",
                    "latency_ms": latency,
                    "indexes": len(ms_stats.get("indexes", {})),
                    "db_size_mb": round(ms_stats.get("databaseSize", 0) / 1024 / 1024, 1),
                }
            else:
                services["meilisearch"] = {"status": "error", "error": "Connection failed"}
    except Exception as e:
        logger.error("Meilisearch health check failed: %s", e)
        services["meilisearch"] = {"status": "error", "error": "Connection failed"}

    # AI (Claude API)
    has_key = bool(settings.anthropic_api_key)
    services["ai"] = {
        "status": "ok" if has_key else "degraded",
        "mode": "claude" if has_key else "template",
        "message": "Claude API active" if has_key else "Template mode (no API key)",
    }

    all_ok = all(s.get("status") == "ok" for s in services.values())
    return {
        "status": "ok" if all_ok else "degraded",
        "services": services,
    }


# ─── User Management (admin only) ───


@router.get("/admin/users")
async def list_users(
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List all registered users with their tier and stats."""
    query = text("""
        SELECT u.id, u.clerk_id, u.email, u.nom, u.tier, u.active,
               u.created_at, u.last_login,
               COUNT(DISTINCT p.id) as nb_projets,
               COUNT(DISTINCT ul.id) as nb_actions
        FROM users u
        LEFT JOIN projets p ON p.user_id = u.id
        LEFT JOIN usage_logs ul ON ul.user_id = u.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
        LIMIT :limit OFFSET :offset
    """)
    result = await db.execute(query, {"limit": limit, "offset": offset})
    rows = result.mappings().all()

    total_q = await db.execute(text("SELECT COUNT(*) FROM users"))
    total = total_q.scalar() or 0

    return {
        "total": total,
        "users": [
            {
                "id": str(r["id"]),
                "clerk_id": r["clerk_id"],
                "email": r["email"],
                "nom": r["nom"],
                "tier": r["tier"],
                "active": r["active"],
                "created_at": r["created_at"].isoformat() if r["created_at"] else None,
                "last_login": r["last_login"].isoformat() if r["last_login"] else None,
                "nb_projets": r["nb_projets"],
                "nb_actions": r["nb_actions"],
            }
            for r in rows
        ],
    }


class UserPatch(BaseModel):
    tier: Optional[str] = None  # free | pro | admin
    active: Optional[bool] = None


@router.patch("/admin/users/{user_id}")
async def update_user(
    user_id: str,
    body: UserPatch,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Modify a user's tier or active status."""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.tier is not None:
        if body.tier not in ("free", "pro", "admin"):
            raise HTTPException(status_code=400, detail="Invalid tier. Must be free, pro, or admin.")
        user.tier = body.tier
    if body.active is not None:
        user.active = body.active

    await db.commit()
    await db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "tier": user.tier,
        "active": user.active,
    }


# ─── Usage / Cost Monitoring ───


@router.get("/admin/usage")
async def global_usage(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Global usage stats for the platform."""
    query = text("""
        SELECT
            action,
            COUNT(*) as count,
            COALESCE(SUM(tokens_in), 0) as total_tokens_in,
            COALESCE(SUM(tokens_out), 0) as total_tokens_out,
            COALESCE(SUM(cost_eur), 0) as total_cost_eur
        FROM usage_logs
        WHERE created_at >= NOW() - (:days * INTERVAL '1 day')
        GROUP BY action
        ORDER BY count DESC
    """)
    result = await db.execute(query, {"days": days})
    by_action = [
        {
            "action": r["action"],
            "count": r["count"],
            "tokens_in": r["total_tokens_in"],
            "tokens_out": r["total_tokens_out"],
            "cost_eur": round(float(r["total_cost_eur"]), 4),
        }
        for r in result.mappings().all()
    ]

    # Daily breakdown
    daily_query = text("""
        SELECT
            DATE(created_at) as day,
            COUNT(*) as count,
            COALESCE(SUM(cost_eur), 0) as cost_eur
        FROM usage_logs
        WHERE created_at >= NOW() - (:days * INTERVAL '1 day')
        GROUP BY DATE(created_at)
        ORDER BY day DESC
    """)
    daily_result = await db.execute(daily_query, {"days": days})
    daily = [
        {
            "day": str(r["day"]),
            "count": r["count"],
            "cost_eur": round(float(r["cost_eur"]), 4),
        }
        for r in daily_result.mappings().all()
    ]

    return {
        "period_days": days,
        "by_action": by_action,
        "daily": daily,
    }


@router.get("/admin/usage/{user_id}")
async def user_usage(
    user_id: str,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Usage stats for a specific user."""
    # Verify user exists
    user_check = await db.execute(select(User).where(User.id == user_id))
    target_user = user_check.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    query = text("""
        SELECT
            action,
            COUNT(*) as count,
            COALESCE(SUM(tokens_in), 0) as total_tokens_in,
            COALESCE(SUM(tokens_out), 0) as total_tokens_out,
            COALESCE(SUM(cost_eur), 0) as total_cost_eur
        FROM usage_logs
        WHERE user_id = :user_id
          AND created_at >= NOW() - (:days * INTERVAL '1 day')
        GROUP BY action
        ORDER BY count DESC
    """)
    result = await db.execute(query, {"user_id": user_id, "days": days})

    return {
        "user_id": user_id,
        "email": target_user.email,
        "tier": target_user.tier,
        "period_days": days,
        "by_action": [
            {
                "action": r["action"],
                "count": r["count"],
                "tokens_in": r["total_tokens_in"],
                "tokens_out": r["total_tokens_out"],
                "cost_eur": round(float(r["total_cost_eur"]), 4),
            }
            for r in result.mappings().all()
        ],
    }


# ─── Platform Stats ───


@router.get("/admin/stats")
async def platform_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Platform-wide statistics."""
    query = text("""
        SELECT
            (SELECT COUNT(*) FROM users) as nb_users,
            (SELECT COUNT(*) FROM users WHERE active = true) as nb_active_users,
            (SELECT COUNT(*) FROM users WHERE tier = 'free') as nb_free,
            (SELECT COUNT(*) FROM users WHERE tier = 'pro') as nb_pro,
            (SELECT COUNT(*) FROM users WHERE tier = 'admin') as nb_admin,
            (SELECT COUNT(*) FROM projets) as nb_projets,
            (SELECT COUNT(*) FROM usage_logs) as nb_actions,
            (SELECT COALESCE(SUM(cost_eur), 0) FROM usage_logs) as total_cost_eur,
            (SELECT COUNT(*) FROM usage_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as actions_24h
    """)
    result = await db.execute(query)
    row = result.mappings().first()

    return {
        "users": {
            "total": row["nb_users"],
            "active": row["nb_active_users"],
            "by_tier": {
                "free": row["nb_free"],
                "pro": row["nb_pro"],
                "admin": row["nb_admin"],
            },
        },
        "projets": row["nb_projets"],
        "usage": {
            "total_actions": row["nb_actions"],
            "actions_24h": row["actions_24h"],
            "total_cost_eur": round(float(row["total_cost_eur"]), 2),
        },
    }


# ─── Knowledge Graph Refresh ───


@router.post("/admin/knowledge/refresh")
async def refresh_knowledge_graph(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
    dry: bool = Query(False, description="Parse only, no DB write"),
):
    """Re-import the 6D knowledge matrix from seed data."""
    try:
        from app.seed.import_data import run_import

        result = await run_import(dry_run=dry)

        # Update DataSourceStatus
        if not dry:
            await db.execute(
                text("""
                    INSERT INTO data_source_statuses
                        (source_name, display_name, category, record_count, last_updated, update_frequency_days, quality_score, status)
                    VALUES ('knowledge_6d', 'Matrice 6D (SolarBrainOS)', 'knowledge', :count, NOW(), 365, 95, 'ok')
                    ON CONFLICT (source_name) DO UPDATE SET
                        record_count = :count, last_updated = NOW(), status = 'ok'
                """),
                {"count": result.get("total", 0)},
            )
            await db.commit()

        return result
    except Exception as exc:
        logger.error("Knowledge refresh failed: %s", exc)
        return {"status": "error", "error": str(exc)}
