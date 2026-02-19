import { Brain, Search, Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Knowledge() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("nav.knowledge")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Matrice 6D — Phases, Normes, Risques, Outils, Sources, Competences
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            {t("common.filter")}
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600">
            <Search className="h-4 w-4" />
            Meilisearch
          </button>
        </div>
      </div>

      {/* Knowledge Graph placeholder — React Flow in Sprint 1 */}
      <div className="flex h-[500px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-100/50">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-lg font-medium text-slate-500">
            Knowledge Graph 6D
          </p>
          <p className="mt-1 text-sm text-slate-400">
            React Flow — Noeuds interconnectes — Sprint 1
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Phases", "Livrables", "Normes", "Risques", "Sources", "Outils", "Competences"].map(
              (type, i) => (
                <span
                  key={type}
                  className="rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{
                    backgroundColor: [
                      "#3b82f6", "#f59e0b", "#10b981", "#ef4444",
                      "#8b5cf6", "#f97316", "#ec4899",
                    ][i],
                  }}
                >
                  {type}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
