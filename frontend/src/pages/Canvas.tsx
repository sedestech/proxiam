import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Sun,
  Wind,
  Battery,
  Zap,
  Check,
  Clock,
  Circle,
  ChevronDown,
} from "lucide-react";
import api from "../lib/api";
import { BLOC_INFO } from "../lib/types";

interface Projet {
  id: string;
  nom: string;
  filiere: string | null;
  puissance_mwc: number | null;
  commune: string | null;
  statut: string;
  score_global: number | null;
}

interface PhaseBloc {
  code: string;
  titre: string;
  statut: string;
  completion_pct: number;
}

const BLOC_COLORS: Record<string, string> = {
  B1: "#3b82f6",
  B2: "#8b5cf6",
  B3: "#10b981",
  B4: "#14b8a6",
  B5: "#f59e0b",
  B6: "#ec4899",
  B7: "#6366f1",
  B8: "#64748b",
};

// ─── Custom Node ───

function BlocNode({ data }: NodeProps) {
  const statusIcon =
    data.statut === "termine" ? (
      <Check className="h-4 w-4 text-white" />
    ) : data.statut === "en_cours" ? (
      <Clock className="h-4 w-4 text-white" />
    ) : (
      <Circle className="h-3.5 w-3.5 text-white/60" />
    );

  const statusBg =
    data.statut === "termine"
      ? "bg-emerald-500"
      : data.statut === "en_cours"
        ? "bg-amber-500"
        : "bg-slate-400";

  return (
    <div
      className="rounded-xl border-2 bg-white shadow-md dark:bg-slate-800"
      style={{
        borderColor: data.color,
        minWidth: 200,
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-[10px] px-3 py-2"
        style={{ backgroundColor: `${data.color}15` }}
      >
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full ${statusBg}`}
        >
          {statusIcon}
        </div>
        <span className="text-xs font-bold" style={{ color: data.color }}>
          {data.code}
        </span>
        <span className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
          {data.shortTitle}
        </span>
      </div>

      {/* Progress */}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span>{data.statut}</span>
          <span className="font-mono font-bold">{data.completion}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${data.completion}%`,
              backgroundColor: data.color,
            }}
          />
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { bloc: BlocNode };

function cleanBlocTitle(titre: string): string {
  return titre
    .replace(/^[^\w]+ /, "")
    .replace(/^BLOC \d+ : /, "")
    .replace(/ \(\d+-\d+\)$/, "");
}

function filiereIcon(filiere: string | null) {
  switch (filiere) {
    case "solaire_sol":
      return <Sun className="h-4 w-4 text-amber-500" />;
    case "eolien_onshore":
      return <Wind className="h-4 w-4 text-blue-500" />;
    case "bess":
      return <Battery className="h-4 w-4 text-emerald-500" />;
    default:
      return <Zap className="h-4 w-4 text-slate-400" />;
  }
}

export default function Canvas() {
  const { t } = useTranslation();
  const [selectedProjet, setSelectedProjet] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: projets } = useQuery<Projet[]>({
    queryKey: ["projets-canvas"],
    queryFn: async () => {
      const res = await api.get("/api/projets?limit=50");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: phases } = useQuery<PhaseBloc[]>({
    queryKey: ["projet-phases-canvas", selectedProjet],
    queryFn: async () => {
      const res = await api.get(`/api/projets/${selectedProjet}/phases`);
      return res.data;
    },
    enabled: !!selectedProjet,
  });

  // Auto-select first project
  if (!selectedProjet && projets && projets.length > 0) {
    setSelectedProjet(projets[0].id);
  }

  const selectedProject = projets?.find((p) => p.id === selectedProjet);

  // Build React Flow nodes and edges from phases
  const { nodes, edges } = useMemo(() => {
    if (!phases || phases.length === 0) {
      // Default blocs when no project selected
      const defaultNodes: Node[] = Object.entries(BLOC_INFO).map(
        ([code, info], i) => ({
          id: code,
          type: "bloc",
          position: { x: i * 260, y: 80 + (i % 2 === 0 ? 0 : 60) },
          data: {
            code,
            shortTitle: info.label.replace(`${code} - `, ""),
            color: BLOC_COLORS[code] || "#94a3b8",
            statut: "a_faire",
            completion: 0,
          },
        })
      );
      const defaultEdges: Edge[] = Object.keys(BLOC_INFO)
        .slice(0, -1)
        .map((code, i) => {
          const codes = Object.keys(BLOC_INFO);
          return {
            id: `${code}-${codes[i + 1]}`,
            source: code,
            target: codes[i + 1],
            animated: false,
            style: { stroke: "#cbd5e1", strokeWidth: 2 },
          };
        });
      return { nodes: defaultNodes, edges: defaultEdges };
    }

    const flowNodes: Node[] = phases.map((bloc, i) => ({
      id: bloc.code,
      type: "bloc",
      position: { x: i * 260, y: 80 + (i % 2 === 0 ? 0 : 60) },
      data: {
        code: bloc.code,
        shortTitle: cleanBlocTitle(bloc.titre),
        color: BLOC_COLORS[bloc.code] || "#94a3b8",
        statut: bloc.statut,
        completion: bloc.completion_pct,
      },
    }));

    const flowEdges: Edge[] = phases.slice(0, -1).map((bloc, i) => ({
      id: `${bloc.code}-${phases[i + 1].code}`,
      source: bloc.code,
      target: phases[i + 1].code,
      animated: bloc.statut === "en_cours",
      style: {
        stroke:
          bloc.statut === "termine"
            ? "#10b981"
            : bloc.statut === "en_cours"
              ? "#f59e0b"
              : "#cbd5e1",
        strokeWidth: 2,
      },
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [phases]);

  // Compute workflow stats
  const completed = phases?.filter((p) => p.statut === "termine").length ?? 0;
  const inProgress = phases?.filter((p) => p.statut === "en_cours").length ?? 0;
  const total = phases?.length ?? 8;
  const overallPct = phases
    ? Math.round(
        phases.reduce((sum, p) => sum + p.completion_pct, 0) / total
      )
    : 0;

  return (
    <div className="flex h-full flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("nav.canvas")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pipeline B1 → B8 — Cycle de vie projet ENR
          </p>
        </div>

        {/* Project selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            {selectedProject && filiereIcon(selectedProject.filiere)}
            <span className="max-w-[180px] truncate">
              {selectedProject?.nom || "Selectionner un projet"}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {dropdownOpen && projets && (
            <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              {projets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProjet(p.id);
                    setDropdownOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    p.id === selectedProjet
                      ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  {filiereIcon(p.filiere)}
                  <span className="flex-1 truncate">{p.nom}</span>
                  {p.score_global !== null && (
                    <span className="text-xs font-mono text-slate-400">
                      {p.score_global}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {selectedProject && (
        <div className="mb-3 flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2">
            {filiereIcon(selectedProject.filiere)}
            <span className="font-medium text-slate-900 dark:text-white">
              {selectedProject.nom}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-500" />
              {completed}/{total} termines
            </span>
            <span>
              <Clock className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
              {inProgress} en cours
            </span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              {overallPct}%
            </span>
          </div>
          <div className="ml-auto flex-1 max-w-xs">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-primary-500 transition-all duration-500"
                style={{ width: `${overallPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          className="bg-slate-50 dark:bg-slate-900"
        >
          <Background gap={20} size={1} color="#e2e8f0" />
          <Controls
            showInteractive={false}
            className="!bg-white !border-slate-200 !shadow-sm dark:!bg-slate-800 dark:!border-slate-600"
          />
          <MiniMap
            nodeColor={(node) => node.data?.color || "#94a3b8"}
            maskColor="rgba(0,0,0,0.1)"
            className="!bg-white !border-slate-200 dark:!bg-slate-800 dark:!border-slate-600"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
