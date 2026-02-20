import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Node, Edge } from "reactflow";
import { MarkerType } from "reactflow";
import api from "../lib/api";
import type { GraphResponse, GraphNode } from "../lib/types";
import { ENTITY_COLORS, PHASE_COLORS } from "../lib/types";

// ─── Layout configuration ───
// Uses a manual hierarchical grid layout: blocs at top, phases in middle, entities at bottom.
// No external dagre dependency required.

const BLOC_Y = 0;
const PHASE_Y = 180;
const ENTITY_Y = 400;

const NODE_X_SPACING = 240;
const PHASE_X_SPACING = 200;
const ENTITY_X_SPACING = 220;

/**
 * Resolve the edge color based on the target node type.
 */
function edgeColor(edgeType: string): string {
  const typeMap: Record<string, string> = {
    contains: ENTITY_COLORS.phase,
    phase_norme: ENTITY_COLORS.norme,
    phase_risque: ENTITY_COLORS.risque,
    phase_livrable: ENTITY_COLORS.livrable,
    phase_outil: ENTITY_COLORS.outil,
    phase_competence: ENTITY_COLORS.competence,
  };
  return typeMap[edgeType] || "#475569";
}

/**
 * Map from plural API entity_types param names to singular node type values
 * used in the API response. The API accepts "normes" but returns nodes with type "norme".
 */
const PLURAL_TO_SINGULAR: Record<string, string> = {
  normes: "norme",
  risques: "risque",
  livrables: "livrable",
  outils: "outil",
  competences: "competence",
};

/**
 * Compute layout positions for nodes. Groups entities by type below their
 * connected phase nodes, using a simple column-based approach.
 */
function layoutNodes(
  apiNodes: GraphNode[],
  visibleTypes: Set<string>,
): Node[] {
  // Convert plural visible types to singular for matching against API node types
  const singularVisible = new Set(
    Array.from(visibleTypes).map((t) => PLURAL_TO_SINGULAR[t] || t),
  );

  // Separate nodes by layer
  const blocNodes = apiNodes.filter((n) => n.type === "bloc");
  const phaseNodes = apiNodes.filter((n) => n.type === "phase");
  const entityNodes = apiNodes.filter(
    (n) => n.type !== "bloc" && n.type !== "phase" && singularVisible.has(n.type),
  );

  const result: Node[] = [];

  // ─── Layer 1: Blocs centered at top ───
  const blocStartX = -(blocNodes.length * NODE_X_SPACING) / 2;
  blocNodes.forEach((node, i) => {
    result.push({
      id: node.id,
      type: "bloc",
      position: { x: blocStartX + i * NODE_X_SPACING, y: BLOC_Y },
      data: node.data,
    });
  });

  // ─── Layer 2: Phases spread below blocs ───
  const phaseStartX = -(phaseNodes.length * PHASE_X_SPACING) / 2;
  phaseNodes.forEach((node, i) => {
    // Determine the color based on bloc_code -> phase mapping
    const blocCode = node.data.bloc_code || "";
    const phaseColor = PHASE_COLORS[blocCode] || ENTITY_COLORS.phase;

    result.push({
      id: node.id,
      type: "phase",
      position: { x: phaseStartX + i * PHASE_X_SPACING, y: PHASE_Y },
      data: { ...node.data, _color: phaseColor },
    });
  });

  // ─── Layer 3: Entities grouped by type in rows ───
  // Group entities by type, then lay them out in horizontal rows
  const entityGroups = new Map<string, GraphNode[]>();
  entityNodes.forEach((node) => {
    const list = entityGroups.get(node.type) || [];
    list.push(node);
    entityGroups.set(node.type, list);
  });

  let rowOffset = 0;
  const typeOrder = ["norme", "risque", "livrable", "outil", "competence"];
  const ROW_HEIGHT = 100;

  typeOrder.forEach((entityType) => {
    const group = entityGroups.get(entityType);
    if (!group || group.length === 0) return;

    const startX = -(group.length * ENTITY_X_SPACING) / 2;
    group.forEach((node, i) => {
      result.push({
        id: node.id,
        type: entityType,
        position: {
          x: startX + i * ENTITY_X_SPACING,
          y: ENTITY_Y + rowOffset,
        },
        data: node.data,
      });
    });
    rowOffset += ROW_HEIGHT;
  });

  return result;
}

/**
 * Transform API edges into React Flow edges with styling.
 */
function layoutEdges(
  apiEdges: { id: string; source: string; target: string; type: string; data?: Record<string, unknown> }[],
  visibleNodeIds: Set<string>,
): Edge[] {
  return apiEdges
    .filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
    .map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "default",
      animated: e.type === "contains",
      style: {
        stroke: edgeColor(e.type),
        strokeWidth: e.type === "contains" ? 2 : 1.2,
        opacity: 0.6,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor(e.type),
        width: 16,
        height: 16,
      },
      data: e.data,
    }));
}

// ─── Hook ───

interface UseKnowledgeGraphOptions {
  bloc: string | null;
  entityTypes: string[];
  limit?: number;
}

export function useKnowledgeGraph({
  bloc,
  entityTypes,
  limit = 50,
}: UseKnowledgeGraphOptions) {
  // Build query params
  const entityTypesParam = entityTypes.length > 0 ? entityTypes.join(",") : undefined;

  const queryKey = ["knowledge-graph", bloc, entityTypesParam, limit];

  const {
    data: response,
    isLoading,
    isError,
    error,
  } = useQuery<GraphResponse>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string | number> = { limit };
      if (bloc) params.bloc = bloc;
      if (entityTypesParam) params.entity_types = entityTypesParam;
      const res = await api.get("/knowledge/graph", { params });
      return res.data;
    },
    enabled: !!bloc, // Only fetch when a bloc is selected
  });

  // Transform into React Flow nodes/edges, memoized on response + visible types
  const visibleTypes = useMemo(() => new Set(entityTypes), [entityTypes]);

  const { nodes, edges } = useMemo(() => {
    if (!response || !response.nodes) {
      return { nodes: [], edges: [] };
    }

    const rfNodes = layoutNodes(response.nodes, visibleTypes);
    const visibleNodeIds = new Set(rfNodes.map((n) => n.id));
    const rfEdges = layoutEdges(response.edges, visibleNodeIds);

    return { nodes: rfNodes, edges: rfEdges };
  }, [response, visibleTypes]);

  return {
    nodes,
    edges,
    stats: response?.stats || { total_nodes: 0, total_edges: 0 },
    isLoading,
    isError,
    error,
  };
}
