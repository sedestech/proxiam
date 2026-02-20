import time

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.config import settings

router = APIRouter()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Check API and database health."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    return {"status": "ok", "database": db_status, "version": "1.1.0"}


@router.get("/api/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    """Return counts for each entity in the 6D matrix."""
    tables = [
        "phases", "blocs", "livrables", "normes", "risques",
        "sources_veille", "outils", "competences", "projets", "postes_sources",
    ]
    counts = {}
    for table in tables:
        try:
            result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
            counts[table] = result.scalar()
        except Exception:
            counts[table] = 0
    return counts


@router.get("/api/admin/health")
async def admin_health(db: AsyncSession = Depends(get_db)):
    """Detailed health check for admin dashboard.

    Checks: PostgreSQL, Redis, Meilisearch, AI service.
    Returns status, latency, and data counts for each service.
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
        services["postgresql"] = {"status": "error", "error": str(e)}

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
        services["redis"] = {"status": "error", "error": str(e)[:100]}

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
                services["meilisearch"] = {"status": "error", "error": f"HTTP {resp.status_code}"}
    except Exception as e:
        services["meilisearch"] = {"status": "error", "error": str(e)[:100]}

    # AI (Claude API)
    has_key = bool(settings.anthropic_api_key)
    services["ai"] = {
        "status": "ok" if has_key else "degraded",
        "mode": "claude" if has_key else "template",
        "message": "Claude API active" if has_key else "Template mode (no API key)",
    }

    # Overall
    all_ok = all(s.get("status") == "ok" for s in services.values())
    return {
        "status": "ok" if all_ok else "degraded",
        "services": services,
    }
