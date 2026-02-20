from typing import Optional
import logging

from fastapi import APIRouter, Query

from app.services.search import search as meili_search

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/search")
async def search_global(
    q: str = Query(..., min_length=2, description="Search query"),
    types: Optional[str] = Query(
        None,
        description="Comma-separated entity types to search (e.g. normes,risques). "
        "Valid: phases,normes,risques,livrables,outils,sources,competences. "
        "If omitted, searches all.",
    ),
    limit: int = Query(20, le=100),
):
    """Global search across all 6D matrix entities via Meilisearch.

    Returns results from Meilisearch with faceted type counts.
    """
    entity_types = None
    if types:
        entity_types = [t.strip() for t in types.split(",") if t.strip()]

    try:
        result = await meili_search(query=q, entity_types=entity_types, limit=limit)
    except Exception as exc:
        logger.error("Meilisearch search failed: %s", exc)
        return {
            "query": q,
            "results": [],
            "total": 0,
            "facets": {"type": {}},
            "error": "Search service unavailable",
        }

    return result
