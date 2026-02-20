import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  Workflow,
  Scale,
  AlertTriangle,
  FileCheck,
  Wrench,
  GraduationCap,
} from "lucide-react";
import { ENTITY_COLORS } from "../../lib/types";

interface EntityNodeData {
  label: string;
  code: string;
  bloc_code?: string;
  severite?: number;
  categorie?: string;
  organisme?: string;
  perimetre?: string;
  type_livrable?: string;
  obligatoire?: boolean;
  licence?: string;
  editeur?: string;
  pole?: string;
  niveau_requis?: number;
  [key: string]: unknown;
}

// Map entity type to icon component
const TYPE_ICONS: Record<string, React.ElementType> = {
  phase: Workflow,
  norme: Scale,
  risque: AlertTriangle,
  livrable: FileCheck,
  outil: Wrench,
  competence: GraduationCap,
};

// Map entity type to a readable label
const TYPE_LABELS: Record<string, string> = {
  phase: "Phase",
  norme: "Norme",
  risque: "Risque",
  livrable: "Livrable",
  outil: "Outil",
  competence: "Competence",
};

function EntityNode({ data, type, selected }: NodeProps<EntityNodeData>) {
  const nodeType = type || "phase";
  const color = ENTITY_COLORS[nodeType] || "#64748b";
  const Icon = TYPE_ICONS[nodeType] || Workflow;
  const typeLabel = TYPE_LABELS[nodeType] || nodeType;

  // Extract the title portion from label (remove "CODE - " prefix)
  const title = data.label.includes(" - ")
    ? data.label.substring(data.label.indexOf(" - ") + 3)
    : data.label;

  // Determine if this is a phase node (needs both source and target handles)
  const isPhase = nodeType === "phase";

  // Severity indicator for risques
  const severityColor =
    nodeType === "risque" && data.severite
      ? data.severite >= 4
        ? "#dc2626"
        : data.severite >= 3
          ? "#ef4444"
          : data.severite >= 2
            ? "#f59e0b"
            : "#22c55e"
      : null;

  return (
    <div
      className={`
        group relative max-w-[200px] rounded-lg border bg-slate-800/80 px-3 py-2
        shadow-md backdrop-blur-sm transition-all duration-200
        ${selected ? "ring-2 ring-white/30 scale-105" : "hover:scale-[1.02]"}
      `}
      style={{ borderColor: `${color}60` }}
    >
      {/* Target handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-slate-700"
        style={{ backgroundColor: color }}
      />

      {/* Content */}
      <div className="flex items-start gap-2">
        {/* Icon */}
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color }} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Type label + code */}
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] font-bold uppercase tracking-wider"
              style={{ color }}
            >
              {typeLabel}
            </span>
            {data.code && (
              <span className="rounded bg-slate-700/60 px-1 py-px text-[9px] font-mono text-slate-400">
                {data.code}
              </span>
            )}
          </div>

          {/* Title */}
          <div className="mt-0.5 line-clamp-2 text-xs font-medium leading-tight text-slate-200">
            {title}
          </div>

          {/* Extra metadata for specific types */}
          {severityColor && (
            <div className="mt-1 flex items-center gap-1">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: severityColor }}
              />
              <span className="text-[10px] text-slate-400">
                Sev. {data.severite}/5
              </span>
            </div>
          )}

          {nodeType === "norme" && data.organisme && (
            <div className="mt-1 truncate text-[10px] text-slate-400">
              {data.organisme}
            </div>
          )}

          {nodeType === "outil" && data.editeur && (
            <div className="mt-1 truncate text-[10px] text-slate-400">
              {data.editeur}
            </div>
          )}

          {nodeType === "competence" && data.pole && (
            <div className="mt-1 truncate text-[10px] text-slate-400">
              {data.pole}
            </div>
          )}

          {nodeType === "livrable" && data.obligatoire !== undefined && (
            <div className="mt-1 flex items-center gap-1">
              <div
                className={`h-1.5 w-1.5 rounded-full ${data.obligatoire ? "bg-red-400" : "bg-slate-500"}`}
              />
              <span className="text-[10px] text-slate-400">
                {data.obligatoire ? "Obligatoire" : "Optionnel"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Source handle (bottom) — only for phase nodes that connect to entities */}
      {isPhase && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2 !w-2 !border-2 !border-slate-700"
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}

export default memo(EntityNode);
