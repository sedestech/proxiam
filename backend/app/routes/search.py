from fastapi import APIRouter, Query

router = APIRouter()


@router.get("/search")
async def search_global(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, le=100),
):
    """Global search across all 6D matrix entities via Meilisearch.

    Sprint 1 implementation with Meilisearch integration.
    Returns placeholder for now.
    """
    return {
        "query": q,
        "results": [],
        "total": 0,
        "message": "Meilisearch integration — Sprint 1",
    }
