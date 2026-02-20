from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    Bloc, Phase, Norme, Risque, Livrable, Outil, Competence,
    PhaseNorme, PhaseRisque, PhaseLivrable, PhaseOutil, PhaseCompetence,
)

router = APIRouter()

# Mapping from entity_type filter name to (junction model, fk column, entity model, node type prefix)
ENTITY_CONFIG = {
    "normes": (PhaseNorme, PhaseNorme.norme_id, Norme, "norme"),
    "risques": (PhaseRisque, PhaseRisque.risque_id, Risque, "risque"),
    "livrables": (PhaseLivrable, PhaseLivrable.livrable_id, Livrable, "livrable"),
    "outils": (PhaseOutil, PhaseOutil.outil_id, Outil, "outil"),
    "competences": (PhaseCompetence, PhaseCompetence.competence_id, Competence, "competence"),
}

# Edge type labels for each entity relation
EDGE_TYPES = {
    "normes": "phase_norme",
    "risques": "phase_risque",
    "livrables": "phase_livrable",
    "outils": "phase_outil",
    "competences": "phase_competence",
}


def _entity_label(entity, entity_type: str) -> str:
    """Build a display label from an entity, using code + titre or nom."""
    code = getattr(entity, "code", "")
    title = getattr(entity, "titre", None) or getattr(entity, "nom", "")
    return f"{code} - {title}" if code else title


def _entity_code(entity) -> str:
    """Get the code attribute from an entity."""
    return getattr(entity, "code", "")


@router.get("/knowledge/graph")
async def knowledge_graph(
    bloc: Optional[str] = Query(None, description="Filter by bloc code (e.g. B1)"),
    entity_types: Optional[str] = Query(
        None,
        description="Comma-separated entity types to include (e.g. normes,risques). "
                    "Defaults to all: normes,risques,livrables,outils,competences",
    ),
    limit: int = Query(200, ge=1, le=1000, description="Max nodes per entity type"),
    db: AsyncSession = Depends(get_db),
):
    """
    Return nodes and edges for the Knowledge Graph React Flow visualization.

    Builds a graph from blocs -> phases -> entities (normes, risques, livrables,
    outils, competences) using the junction tables.
    """
    # Parse requested entity types
    if entity_types:
        requested_types = [t.strip().lower() for t in entity_types.split(",") if t.strip()]
        # Validate types
        invalid = [t for t in requested_types if t not in ENTITY_CONFIG]
        if invalid:
            return {
                "error": f"Invalid entity_types: {invalid}. "
                         f"Valid types: {list(ENTITY_CONFIG.keys())}",
                "nodes": [],
                "edges": [],
                "stats": {"total_nodes": 0, "total_edges": 0},
            }
    else:
        requested_types = list(ENTITY_CONFIG.keys())

    nodes = []
    edges = []
    seen_node_ids = set()

    # ─── 1. Fetch blocs ───
    bloc_query = select(Bloc).order_by(Bloc.code)
    if bloc:
        bloc_query = bloc_query.where(Bloc.code == bloc.upper())
    bloc_result = await db.execute(bloc_query)
    blocs = bloc_result.scalars().all()

    if not blocs:
        return {
            "nodes": [],
            "edges": [],
            "stats": {"total_nodes": 0, "total_edges": 0},
        }

    # Collect bloc IDs for phase query
    bloc_ids = []
    for b in blocs:
        node_id = f"bloc-{b.id}"
        # Count phases per bloc
        count_query = select(func.count(Phase.id)).where(Phase.bloc_id == b.id)
        count_result = await db.execute(count_query)
        phase_count = count_result.scalar() or 0

        nodes.append({
            "id": node_id,
            "type": "bloc",
            "data": {
                "label": f"{b.code} - {b.titre}",
                "code": b.code,
                "count": phase_count,
            },
        })
        seen_node_ids.add(node_id)
        bloc_ids.append(b.id)

    # ─── 2. Fetch phases for these blocs ───
    phase_query = (
        select(Phase)
        .where(Phase.bloc_id.in_(bloc_ids))
        .order_by(Phase.ordre)
    )
    phase_result = await db.execute(phase_query)
    phases = phase_result.scalars().all()

    # Build phase nodes and bloc->phase edges
    phase_ids = []
    phase_bloc_map = {}  # phase_id -> bloc_id
    for p in phases:
        node_id = f"phase-{p.id}"
        bloc_node_id = f"bloc-{p.bloc_id}"

        # Find bloc code for this phase
        bloc_code = ""
        for b in blocs:
            if b.id == p.bloc_id:
                bloc_code = b.code
                break

        nodes.append({
            "id": node_id,
            "type": "phase",
            "data": {
                "label": f"{p.code} - {p.titre}",
                "code": p.code,
                "bloc_code": bloc_code,
            },
        })
        seen_node_ids.add(node_id)

        edges.append({
            "id": f"e-{bloc_node_id}-{node_id}",
            "source": bloc_node_id,
            "target": node_id,
            "type": "contains",
        })

        phase_ids.append(p.id)
        phase_bloc_map[p.id] = p.bloc_id

    if not phase_ids:
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": {"total_nodes": len(nodes), "total_edges": len(edges)},
        }

    # ─── 3. Fetch entities from junction tables ───
    for entity_type in requested_types:
        junction_model, fk_col, entity_model, node_prefix = ENTITY_CONFIG[entity_type]

        # Query junction table rows for our phases, joined with entity data
        junction_query = (
            select(junction_model, entity_model)
            .join(entity_model, fk_col == entity_model.id)
            .where(junction_model.phase_id.in_(phase_ids))
        )
        junction_result = await db.execute(junction_query)
        rows = junction_result.all()

        # Track unique entities to enforce the limit
        entity_count = 0
        entity_seen = set()

        for junction_row, entity in rows:
            entity_node_id = f"{node_prefix}-{entity.id}"
            phase_node_id = f"phase-{junction_row.phase_id}"

            # Add entity node if not yet added (deduplicate across phases)
            if entity_node_id not in seen_node_ids:
                if entity_count >= limit:
                    continue
                node_data = {
                    "label": _entity_label(entity, entity_type),
                    "code": _entity_code(entity),
                }
                # Add extra fields based on entity type
                if entity_type == "risques" and hasattr(entity, "severite"):
                    node_data["severite"] = entity.severite
                    node_data["categorie"] = entity.categorie
                elif entity_type == "normes" and hasattr(entity, "organisme"):
                    node_data["organisme"] = entity.organisme
                    node_data["perimetre"] = entity.perimetre
                elif entity_type == "livrables" and hasattr(entity, "type"):
                    node_data["type_livrable"] = entity.type
                    node_data["obligatoire"] = entity.obligatoire
                elif entity_type == "outils" and hasattr(entity, "licence"):
                    node_data["licence"] = entity.licence
                    node_data["editeur"] = entity.editeur
                elif entity_type == "competences" and hasattr(entity, "pole"):
                    node_data["pole"] = entity.pole
                    node_data["niveau_requis"] = entity.niveau_requis

                nodes.append({
                    "id": entity_node_id,
                    "type": node_prefix,
                    "data": node_data,
                })
                seen_node_ids.add(entity_node_id)
                entity_count += 1

            # Add edge only if the entity node exists (not filtered by limit)
            if entity_node_id in seen_node_ids:
                edge_id = f"e-{phase_node_id}-{entity_node_id}"
                # Avoid duplicate edges (same phase-entity pair)
                edge_key = (junction_row.phase_id, entity.id, entity_type)
                if edge_key not in entity_seen:
                    edge_data = {
                        "id": edge_id,
                        "source": phase_node_id,
                        "target": entity_node_id,
                        "type": EDGE_TYPES[entity_type],
                    }
                    # Add junction-specific metadata to edge
                    if entity_type == "normes" and hasattr(junction_row, "criticite"):
                        edge_data["data"] = {"criticite": junction_row.criticite}
                    elif entity_type == "risques" and hasattr(junction_row, "phase_impact"):
                        edge_data["data"] = {"phase_impact": junction_row.phase_impact}
                    elif entity_type == "livrables" and hasattr(junction_row, "obligatoire"):
                        edge_data["data"] = {"obligatoire": junction_row.obligatoire}
                    elif entity_type == "outils" and hasattr(junction_row, "usage"):
                        edge_data["data"] = {"usage": junction_row.usage}
                    elif entity_type == "competences" and hasattr(junction_row, "niveau_requis"):
                        edge_data["data"] = {"niveau_requis": junction_row.niveau_requis}

                    edges.append(edge_data)
                    entity_seen.add(edge_key)

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
        },
    }
