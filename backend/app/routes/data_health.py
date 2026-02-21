"""Data Health dashboard API — Sprint 19."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import require_admin
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()

# Default sources to track (seeded on first call if missing)
DEFAULT_SOURCES = [
    ("postes_sources", "Postes sources (Enedis/RTE)", "geospatial", "postes_sources", 90),
    ("natura2000", "Natura 2000 (INPN)", "geospatial", "natura2000", 180),
    ("znieff", "ZNIEFF (INPN)", "geospatial", "znieff", 180),
    ("knowledge_6d", "Matrice 6D (SolarBrainOS)", "knowledge", None, 365),
    ("financial_constants", "Constantes financières", "financial", None, 180),
    ("scraped_contents", "Veille active (scraping)", "veille", "scraped_contents", 7),
    ("projets", "Projets utilisateurs", "projects", "projets", 0),
]


async def _ensure_defaults(db: AsyncSession):
    """Insert default source entries if they don't exist."""
    for src_name, display, cat, table, freq in DEFAULT_SOURCES:
        existing = await db.execute(
            text("SELECT 1 FROM data_source_statuses WHERE source_name = :n"),
            {"n": src_name},
        )
        if existing.scalar() is None:
            count = 0
            if table:
                try:
                    row = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))  # noqa: S608
                    count = row.scalar() or 0
                except Exception:
                    count = 0
            await db.execute(
                text("""
                    INSERT INTO data_source_statuses
                        (source_name, display_name, category, record_count, update_frequency_days, status)
                    VALUES (:n, :d, :c, :count, :freq, 'ok')
                """),
                {"n": src_name, "d": display, "c": cat, "count": count, "freq": freq},
            )
    await db.commit()


@router.get("/admin/data-health")
async def get_data_health(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Data Health dashboard — freshness, quality, record counts."""
    await _ensure_defaults(db)

    # Refresh record counts from actual tables
    for src_name, _, _, table, _ in DEFAULT_SOURCES:
        if table:
            try:
                row = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))  # noqa: S608
                count = row.scalar() or 0
                await db.execute(
                    text("UPDATE data_source_statuses SET record_count = :c WHERE source_name = :n"),
                    {"c": count, "n": src_name},
                )
            except Exception:
                pass

    # Special: financial constants version
    try:
        from app.services.financial import get_financial_version

        info = get_financial_version()
        await db.execute(
            text("""
                UPDATE data_source_statuses
                SET notes = :notes, status = 'ok'
                WHERE source_name = 'financial_constants'
            """),
            {"notes": f"Version {info['version']} ({info['date']})"},
        )
    except Exception:
        pass

    await db.commit()

    # Fetch all sources
    result = await db.execute(text("""
        SELECT source_name, display_name, category, record_count,
               last_updated, update_frequency_days, quality_score, status, notes
        FROM data_source_statuses
        ORDER BY category, source_name
    """))
    rows = result.mappings().all()

    now = datetime.now(timezone.utc)
    sources = []
    for r in rows:
        last = r["last_updated"]
        days_since = (now - last).days if last else None
        freq = r["update_frequency_days"] or 0
        is_stale = (days_since is not None and freq > 0 and days_since > freq)

        computed_status = "stale" if is_stale else (r["status"] or "ok")

        sources.append({
            "source_name": r["source_name"],
            "display_name": r["display_name"],
            "category": r["category"],
            "record_count": r["record_count"] or 0,
            "last_updated": last.isoformat() if last else None,
            "update_frequency_days": freq,
            "quality_score": r["quality_score"] or 0,
            "status": computed_status,
            "days_since_update": days_since,
            "is_stale": is_stale,
            "notes": r["notes"],
        })

    ok = sum(1 for s in sources if s["status"] == "ok")
    stale = sum(1 for s in sources if s["status"] == "stale")
    error = sum(1 for s in sources if s["status"] == "error")
    total = len(sources)
    health = int(ok / total * 100) if total else 0

    return {
        "sources": sources,
        "summary": {
            "total_sources": total,
            "ok": ok,
            "stale": stale,
            "error": error,
            "overall_health": health,
        },
    }
