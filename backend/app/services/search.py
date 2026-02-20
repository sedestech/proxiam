"""Meilisearch search service for the 6D matrix entities.

Provides async indexing and search across all entity types:
phases, normes, risques, livrables, outils, sources, competences.
"""
from typing import Optional, List

import logging

from meilisearch_python_sdk import AsyncClient
from meilisearch_python_sdk.errors import MeilisearchApiError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models import (
    Phase, Bloc, Norme, Risque, Livrable,
    SourceVeille, Outil, Competence,
)

logger = logging.getLogger(__name__)

# Index names — one per entity type
INDEXES = [
    "phases",
    "normes",
    "risques",
    "livrables",
    "outils",
    "sources",
    "competences",
]

# Searchable and filterable attributes per index
INDEX_SETTINGS = {
    "phases": {
        "searchableAttributes": ["titre", "description", "code"],
        "filterableAttributes": ["type", "phase_code", "bloc_code"],
        "sortableAttributes": ["code"],
    },
    "normes": {
        "searchableAttributes": ["titre", "description", "code"],
        "filterableAttributes": ["type"],
        "sortableAttributes": ["code"],
    },
    "risques": {
        "searchableAttributes": ["titre", "description", "code"],
        "filterableAttributes": ["type"],
        "sortableAttributes": ["code"],
    },
    "livrables": {
        "searchableAttributes": ["titre", "description", "code"],
        "filterableAttributes": ["type"],
        "sortableAttributes": ["code"],
    },
    "outils": {
        "searchableAttributes": ["titre", "description", "code"],
        "filterableAttributes": ["type"],
        "sortableAttributes": ["code"],
    },
    "sources": {
        "searchableAttributes": ["titre", "description", "code"],
        "filterableAttributes": ["type"],
        "sortableAttributes": ["code"],
    },
    "competences": {
        "searchableAttributes": ["titre", "description", "code"],
        "filterableAttributes": ["type"],
        "sortableAttributes": ["code"],
    },
}


def _get_client() -> AsyncClient:
    """Create a new async Meilisearch client."""
    return AsyncClient(settings.meili_host, settings.meili_master_key)


async def _ensure_indexes(client: AsyncClient) -> None:
    """Create indexes if they don't exist and configure settings."""
    for index_name in INDEXES:
        try:
            await client.create_index(uid=index_name, primary_key="id")
        except MeilisearchApiError as exc:
            # index_already_exists is fine
            if "index_already_exists" not in str(exc):
                raise
        # Apply settings
        index = client.index(index_name)
        idx_settings = INDEX_SETTINGS.get(index_name, {})
        if idx_settings.get("searchableAttributes"):
            await index.update_searchable_attributes(idx_settings["searchableAttributes"])
        if idx_settings.get("filterableAttributes"):
            await index.update_filterable_attributes(idx_settings["filterableAttributes"])
        if idx_settings.get("sortableAttributes"):
            await index.update_sortable_attributes(idx_settings["sortableAttributes"])


# ─── Entity → Document converters ───────────────────────────────


def _phase_to_doc(phase: Phase, bloc_code: Optional[str] = None) -> dict:
    return {
        "id": phase.id,
        "code": phase.code,
        "titre": phase.titre,
        "description": phase.description or "",
        "type": "phase",
        "bloc_code": bloc_code or "",
        "phase_code": phase.code,
    }


def _norme_to_doc(norme: Norme) -> dict:
    return {
        "id": norme.id,
        "code": norme.code,
        "titre": norme.titre,
        "description": norme.description or "",
        "type": "norme",
    }


def _risque_to_doc(risque: Risque) -> dict:
    return {
        "id": risque.id,
        "code": risque.code,
        "titre": risque.titre,
        "description": risque.description or "",
        "type": "risque",
    }


def _livrable_to_doc(livrable: Livrable) -> dict:
    return {
        "id": livrable.id,
        "code": livrable.code,
        "titre": livrable.titre,
        "description": livrable.description or "",
        "type": "livrable",
    }


def _outil_to_doc(outil: Outil) -> dict:
    return {
        "id": outil.id,
        "code": outil.code,
        "titre": outil.nom,
        "description": outil.description or "",
        "type": "outil",
    }


def _source_to_doc(source: SourceVeille) -> dict:
    return {
        "id": source.id,
        "code": source.code,
        "titre": source.nom,
        "description": "",
        "type": "source",
    }


def _competence_to_doc(comp: Competence) -> dict:
    return {
        "id": comp.id,
        "code": comp.code,
        "titre": comp.nom,
        "description": "",
        "type": "competence",
    }


# ─── Public API ──────────────────────────────────────────────────


async def index_all_entities(session: AsyncSession) -> dict[str, int]:
    """Index all 6D matrix entities from PostgreSQL into Meilisearch.

    Returns a dict with counts per entity type indexed.
    """
    async with _get_client() as client:
        await _ensure_indexes(client)
        counts: dict[str, int] = {}

        # Phases — need bloc code via join
        result = await session.execute(
            select(Phase, Bloc.code).outerjoin(Bloc, Phase.bloc_id == Bloc.id)
        )
        rows = result.all()
        docs = [_phase_to_doc(phase, bloc_code) for phase, bloc_code in rows]
        if docs:
            index = client.index("phases")
            await index.add_documents(docs)
        counts["phases"] = len(docs)

        # Normes
        result = await session.execute(select(Norme))
        normes = result.scalars().all()
        docs = [_norme_to_doc(n) for n in normes]
        if docs:
            index = client.index("normes")
            await index.add_documents(docs)
        counts["normes"] = len(docs)

        # Risques
        result = await session.execute(select(Risque))
        risques = result.scalars().all()
        docs = [_risque_to_doc(r) for r in risques]
        if docs:
            index = client.index("risques")
            await index.add_documents(docs)
        counts["risques"] = len(docs)

        # Livrables
        result = await session.execute(select(Livrable))
        livrables = result.scalars().all()
        docs = [_livrable_to_doc(l) for l in livrables]
        if docs:
            index = client.index("livrables")
            await index.add_documents(docs)
        counts["livrables"] = len(docs)

        # Outils
        result = await session.execute(select(Outil))
        outils = result.scalars().all()
        docs = [_outil_to_doc(o) for o in outils]
        if docs:
            index = client.index("outils")
            await index.add_documents(docs)
        counts["outils"] = len(docs)

        # Sources
        result = await session.execute(select(SourceVeille))
        sources = result.scalars().all()
        docs = [_source_to_doc(s) for s in sources]
        if docs:
            index = client.index("sources")
            await index.add_documents(docs)
        counts["sources"] = len(docs)

        # Competences
        result = await session.execute(select(Competence))
        comps = result.scalars().all()
        docs = [_competence_to_doc(c) for c in comps]
        if docs:
            index = client.index("competences")
            await index.add_documents(docs)
        counts["competences"] = len(docs)

    return counts


async def search(
    query: str,
    entity_types: Optional[List[str]] = None,
    limit: int = 20,
) -> dict:
    """Search across Meilisearch indexes.

    Args:
        query: The search string.
        entity_types: Optional list of index names to search (e.g. ["normes", "risques"]).
                      If None, searches all indexes.
        limit: Maximum results per index.

    Returns:
        {
            "query": str,
            "results": [{"id", "code", "titre", "description", "type", ...}, ...],
            "total": int,
            "facets": {"type": {"norme": 5, "risque": 3, ...}}
        }
    """
    indexes_to_search = entity_types if entity_types else INDEXES

    # Validate requested indexes
    indexes_to_search = [idx for idx in indexes_to_search if idx in INDEXES]

    if not indexes_to_search:
        return {"query": query, "results": [], "total": 0, "facets": {"type": {}}}

    all_results = []
    facets: dict[str, int] = {}

    async with _get_client() as client:
        for index_name in indexes_to_search:
            try:
                index = client.index(index_name)
                result = await index.search(query, limit=limit)
                hits = result.hits or []
                all_results.extend(hits)
                if hits:
                    # Use the entity type from the index name (singular for display)
                    entity_type = index_name.rstrip("s") if index_name != "sources" else "source"
                    facets[entity_type] = len(hits)
            except MeilisearchApiError as exc:
                logger.warning("Meilisearch search error on index %s: %s", index_name, exc)

    # Sort by relevance (Meilisearch already returns sorted per-index,
    # but we interleave results in index order which is acceptable)
    return {
        "query": query,
        "results": all_results[:limit],
        "total": len(all_results),
        "facets": {"type": facets},
    }
