import { Workflow } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PHASE_COLORS } from "../lib/types";

const phases = [
  { code: "P0", label: "Prospection" },
  { code: "P1", label: "Ingenierie" },
  { code: "P2", label: "Autorisations" },
  { code: "P3", label: "Finance" },
  { code: "P4", label: "Construction" },
  { code: "P5", label: "Commissioning" },
  { code: "P6", label: "Exploitation" },
  { code: "P7", label: "Demantelement" },
];

export default function Canvas() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("nav.canvas")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Workflow P0 → P7 — Inspiré Nexus-Flow
        </p>
      </div>

      {/* Phase columns preview */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {phases.map(({ code, label }) => (
          <div
            key={code}
            className="flex min-w-[140px] flex-col rounded-xl border border-slate-200 bg-white"
          >
            <div
              className="rounded-t-xl px-3 py-2 text-center text-xs font-bold text-white"
              style={{ backgroundColor: PHASE_COLORS[code] }}
            >
              {code}
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-4">
              <p className="text-xs font-medium text-slate-600">{label}</p>
              <div className="mt-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-24 rounded bg-slate-100"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Canvas placeholder */}
      <div className="flex h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-100/50">
        <div className="text-center">
          <Workflow className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-lg font-medium text-slate-500">
            Editeur Canvas Workflow
          </p>
          <p className="mt-1 text-sm text-slate-400">
            SVG + D3 — Steps draggable, connections typees — Sprint 1+
          </p>
        </div>
      </div>
    </div>
  );
}
