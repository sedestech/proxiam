from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db

router = APIRouter()


@router.post("/projets/{projet_id}/score")
async def calculate_score(projet_id: str, db: AsyncSession = Depends(get_db)):
    """Calculate project score (0-100) based on 6 criteria.

    Sprint 3 implementation. Returns placeholder for now.
    """
    return {
        "projet_id": projet_id,
        "score": 0,
        "details": {
            "proximite_reseau": 0,
            "urbanisme": 0,
            "environnement": 0,
            "irradiation": 0,
            "accessibilite": 0,
            "risques": 0,
        },
        "message": "Scoring engine — Sprint 3",
    }
