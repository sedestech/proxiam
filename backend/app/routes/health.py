from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Check API and database health."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    return {"status": "ok", "database": db_status, "version": "0.1.0"}


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
