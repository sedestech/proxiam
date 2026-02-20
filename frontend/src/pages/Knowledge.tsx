import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactFlow, {
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Node,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  X,
  Scale,
  AlertTriangle,
  FileCheck,
  Wrench,
  GraduationCap,
  Loader2,
  AlertCircle,
  ChevronRight,
  Boxes,
  Workflow,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";

import { BlocNode, EntityNode } from "../components/graph";
import { useKnowledgeGraph } from "../hooks/useKnowledgeGraph";
import { ENTITY_COLORS, BLOC_INFO, type GraphNode } from "../lib/types";

// ─── Constants ───

const ALL_ENTITY_TYPES = [
  "normes",
  "risques",
  "livrables",
  "outils",
  "competences",
] as const;

const ENTITY_TYPE_META: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  normes: { icon: Scale, color: ENTITY_COLORS.norme },
  risques: { icon: AlertTriangle, color: ENTITY_COLORS.risque },
  livrables: { icon: FileCheck, color: ENTITY_COLORS.livrable },
  outils: { icon: Wrench, color: ENTITY_COLORS.outil },
  competences: { icon: GraduationCap, color: ENTITY_COLORS.competence },
};

const BLOC_CODES = ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"];

// Register custom node types for React Flow (must be stable reference)
const nodeTypes = {
  bloc: BlocNode,
  phase: EntityNode,
  norme: EntityNode,
  risque: EntityNode,
  livrable: EntityNode,
  outil: EntityNode,
  competence: EntityNode,
};

// ─── Detail Panel ───

function DetailPanel({
  node,
  onClose,
  t,
}: {
  node: GraphNode | null;
  onClose: () => void;
  t: (key: string) => string;
}) {
  if (!node) return null;

  const color = ENTITY_COLORS[node.type] || "#64748b";
  const TypeIcon =
    node.type === "bloc"
      ? Boxes
      : node.type === "phase"
        ? Workflow
        : ENTITY_TYPE_META[`${node.type}s`]?.icon || Brain;

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute right-0 top-0 z-20 h-full w-80 border-l border-slate-700 bg-slate-800/95 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <TypeIcon className="h-4 w-4" style={{ color }} />
          </div>
          <span className="text-sm font-semibold text-slate-200">
            {t("knowledge.detail")}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4 overflow-y-auto p-4" style={{ maxHeight: "calc(100% - 52px)" }}>
        {/* Type badge + code */}
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: color }}
          >
            {node.type}
          </span>
          {node.data.code && (
            <span className="rounded bg-slate-700 px-2 py-0.5 font-mono text-xs text-slate-300">
              {node.data.code}
            </span>
          )}
        </div>

        {/* Label / Title */}
        <div>
          <p className="text-sm font-semibold text-slate-100">{node.data.label}</p>
        </div>

        {/* Type-specific metadata */}
        <div className="space-y-2.5">
          {node.type === "risque" && node.data.severite !== undefined && (
            <DetailRow label={t("knowledge.severity")} value={`${node.data.severite}/5`} />
          )}
          {node.type === "risque" && node.data.categorie && (
            <DetailRow label={t("knowledge.category")} value={String(node.data.categorie)} />
          )}
          {node.type === "norme" && node.data.organisme && (
            <DetailRow label={t("knowledge.organism")} value={String(node.data.organisme)} />
          )}
          {node.type === "norme" && node.data.perimetre && (
            <DetailRow label={t("knowledge.scope")} value={String(node.data.perimetre)} />
          )}
          {node.type === "outil" && node.data.licence && (
            <DetailRow label={t("knowledge.licence")} value={String(node.data.licence)} />
          )}
          {node.type === "outil" && node.data.editeur && (
            <DetailRow label={t("knowledge.publisher")} value={String(node.data.editeur)} />
          )}
          {node.type === "competence" && node.data.pole && (
            <DetailRow label={t("knowledge.pole")} value={String(node.data.pole)} />
          )}
          {node.type === "competence" && node.data.niveau_requis !== undefined && (
            <DetailRow
              label={t("knowledge.requiredLevel")}
              value={`${node.data.niveau_requis}/5`}
            />
          )}
          {node.type === "livrable" && node.data.obligatoire !== undefined && (
            <DetailRow
              label={t("knowledge.type")}
              value={node.data.obligatoire ? t("knowledge.mandatory") : t("knowledge.optional")}
            />
          )}
          {node.type === "livrable" && node.data.type_livrable && (
            <DetailRow label="Format" value={String(node.data.type_livrable)} />
          )}
          {node.type === "bloc" && node.data.count !== undefined && (
            <DetailRow label="Phases" value={String(node.data.count)} />
          )}
          {node.type === "phase" && node.data.bloc_code && (
            <DetailRow label="Bloc" value={String(node.data.bloc_code)} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-700/40 px-3 py-2">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-medium text-slate-200">{value}</span>
    </div>
  );
}

// ─── Mobile List View ───

function MobileListView({
  selectedBloc,
  onSelectBloc,
  t,
}: {
  selectedBloc: string | null;
  onSelectBloc: (bloc: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4 animate-fade-in md:hidden">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          {t("knowledge.mobileTitle")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {t("knowledge.mobileSubtitle")}
        </p>
      </div>

      <div className="space-y-2">
        {BLOC_CODES.map((code) => {
          const info = BLOC_INFO[code];
          const isActive = selectedBloc === code;
          return (
            <button
              key={code}
              onClick={() => onSelectBloc(code)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? "border-primary-300 bg-primary-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${ENTITY_COLORS.bloc}15` }}
              >
                <Boxes className="h-4.5 w-4.5" style={{ color: ENTITY_COLORS.bloc }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{info.label}</p>
                <p className="truncate text-xs text-slate-500">{info.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          );
        })}
      </div>

      {/* Entity type legend */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t("knowledge.entityTypes")}
        </p>
        <div className="flex flex-wrap gap-2">
          {ALL_ENTITY_TYPES.map((type) => {
            const meta = ENTITY_TYPE_META[type];
            const Icon = meta.icon;
            return (
              <span
                key={type}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: meta.color }}
              >
                <Icon className="h-3 w-3" />
                {t(`knowledge.${type}`)}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Knowledge Page ───

export default function Knowledge() {
  const { t } = useTranslation();

  // State: selected bloc, visible entity types, detail panel
  const [selectedBloc, setSelectedBloc] = useState<string | null>(null);
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    new Set(ALL_ENTITY_TYPES),
  );
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Fetch graph data
  const { nodes: graphNodes, edges: graphEdges, stats, isLoading, isError } =
    useKnowledgeGraph({
      bloc: selectedBloc,
      entityTypes: Array.from(visibleTypes),
      limit: 50,
    });

  // React Flow state (synced from hook data)
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync React Flow state when graph data changes
  useEffect(() => {
    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [graphNodes, graphEdges, setNodes, setEdges]);

  // Toggle entity type visibility
  const toggleType = useCallback((type: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Handle node click -> show detail panel
  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      // Find the original API node data from the React Flow node
      const graphNode: GraphNode = {
        id: node.id,
        type: node.type || "unknown",
        data: node.data,
      };
      setSelectedNode(graphNode);
    },
    [],
  );

  const closeDetail = useCallback(() => setSelectedNode(null), []);

  // MiniMap node color
  const minimapNodeColor = useCallback((node: Node) => {
    return ENTITY_COLORS[node.type || ""] || "#475569";
  }, []);

  return (
    <>
      {/* Mobile: simplified list view */}
      <MobileListView
        selectedBloc={selectedBloc}
        onSelectBloc={setSelectedBloc}
        t={t}
      />

      {/* Desktop: full graph canvas */}
      <div className="hidden h-full md:flex md:flex-col animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t("knowledge.title")}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {t("knowledge.subtitle")}
            </p>
          </div>

          {/* Stats badges */}
          {selectedBloc && stats.total_nodes > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-slate-500" />
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {stats.total_nodes}
                </span>
                <span className="text-xs text-slate-500">{t("knowledge.nodes")}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5">
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {stats.total_edges}
                </span>
                <span className="text-xs text-slate-500">{t("knowledge.edges")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main content area with sidebar */}
        <div className="relative flex flex-1 overflow-hidden rounded-xl border border-slate-200">
          {/* Left sidebar: bloc selector + type toggles */}
          <div className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
            {/* Bloc selector */}
            <div className="border-b border-slate-100 p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("knowledge.selectBloc")}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {BLOC_CODES.map((code) => {
                  const isActive = selectedBloc === code;
                  return (
                    <button
                      key={code}
                      onClick={() =>
                        setSelectedBloc(isActive ? null : code)
                      }
                      className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-primary-500 text-white shadow-sm"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Entity type toggles */}
            <div className="flex-1 overflow-y-auto p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t("knowledge.entityTypes")}
              </p>
              <div className="space-y-1">
                {ALL_ENTITY_TYPES.map((type) => {
                  const meta = ENTITY_TYPE_META[type];
                  const Icon = meta.icon;
                  const isVisible = visibleTypes.has(type);

                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-all ${
                        isVisible
                          ? "bg-slate-50 text-slate-700"
                          : "text-slate-400 opacity-60"
                      }`}
                    >
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded"
                        style={{
                          backgroundColor: isVisible
                            ? `${meta.color}20`
                            : "transparent",
                        }}
                      >
                        <Icon
                          className="h-3 w-3"
                          style={{
                            color: isVisible ? meta.color : "#94a3b8",
                          }}
                        />
                      </div>
                      <span className="flex-1">{t(`knowledge.${type}`)}</span>
                      {isVisible ? (
                        <Eye className="h-3 w-3 text-slate-400" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-slate-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bloc info (when selected) */}
            {selectedBloc && BLOC_INFO[selectedBloc] && (
              <div className="border-t border-slate-100 p-3">
                <div
                  className="rounded-lg px-3 py-2"
                  style={{ backgroundColor: `${ENTITY_COLORS.bloc}08` }}
                >
                  <p className="text-xs font-semibold text-slate-700">
                    {BLOC_INFO[selectedBloc].label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {BLOC_INFO[selectedBloc].description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Graph canvas */}
          <div className="relative flex-1 bg-slate-900">
            {/* Empty state: no bloc selected */}
            {!selectedBloc && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Brain className="mx-auto h-12 w-12 text-slate-600" />
                  <p className="mt-3 text-sm font-medium text-slate-400">
                    {t("knowledge.noSelection")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("knowledge.clickNode")}
                  </p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {selectedBloc && isLoading && (
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
                  <span className="text-sm text-slate-400">
                    {t("common.loading")}
                  </span>
                </div>
              </div>
            )}

            {/* Error state */}
            {selectedBloc && isError && (
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2.5 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">Erreur de chargement du graphe</span>
                </div>
              </div>
            )}

            {/* React Flow canvas */}
            {selectedBloc && !isLoading && !isError && nodes.length > 0 && (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.2}
                maxZoom={2}
                defaultEdgeOptions={{
                  type: "default",
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={1}
                  color="#334155"
                />
                <Controls
                  className="!bg-slate-800 !border-slate-700 !shadow-lg [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700"
                  showInteractive={false}
                />
                <MiniMap
                  nodeColor={minimapNodeColor}
                  nodeStrokeWidth={2}
                  maskColor="rgba(15, 23, 42, 0.7)"
                  className="!bg-slate-800 !border-slate-700"
                  pannable
                  zoomable
                />
              </ReactFlow>
            )}

            {/* Empty result state (bloc selected but no data) */}
            {selectedBloc && !isLoading && !isError && nodes.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Brain className="mx-auto h-10 w-10 text-slate-600" />
                  <p className="mt-2 text-sm text-slate-400">
                    {t("common.noData")}
                  </p>
                </div>
              </div>
            )}

            {/* Detail panel overlay */}
            <AnimatePresence>
              {selectedNode && (
                <DetailPanel
                  node={selectedNode}
                  onClose={closeDetail}
                  t={t}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
