import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Boxes } from "lucide-react";
import { ENTITY_COLORS } from "../../lib/types";

interface BlocNodeData {
  label: string;
  code: string;
  count?: number;
}

function BlocNode({ data, selected }: NodeProps<BlocNodeData>) {
  const color = ENTITY_COLORS.bloc;

  return (
    <div
      className={`
        group relative min-w-[180px] rounded-xl border-2 bg-slate-800/90 px-4 py-3
        shadow-lg backdrop-blur-sm transition-all duration-200
        ${selected ? "ring-2 ring-white/40 scale-105" : "hover:scale-[1.02]"}
      `}
      style={{ borderColor: color }}
    >
      {/* Header with icon */}
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}25` }}
        >
          <Boxes className="h-4 w-4" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {data.code}
          </div>
          <div className="truncate text-sm font-semibold text-slate-100">
            {data.label.replace(`${data.code} - `, "")}
          </div>
        </div>
      </div>

      {/* Phase count badge */}
      {data.count !== undefined && data.count > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <div
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: ENTITY_COLORS.phase }}
          />
          <span className="text-xs text-slate-400">
            {data.count} phases
          </span>
        </div>
      )}

      {/* Source handle (bottom) — edges go from bloc to phases */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !border-2 !border-slate-700 !bg-indigo-400"
      />
    </div>
  );
}

export default memo(BlocNode);
