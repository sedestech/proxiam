import { FolderKanban, Plus, Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Projects() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t("nav.projects")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Portefeuille de projets ENR
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            {t("common.export")}
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {t("common.import")}
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600">
            <Plus className="h-4 w-4" />
            {t("common.create")}
          </button>
        </div>
      </div>

      {/* Empty state */}
      <div className="flex h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-100/50">
        <div className="text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-lg font-medium text-slate-500">
            Aucun projet
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Carte + Tableau — Scoring, risques, progression — Sprint 4
          </p>
        </div>
      </div>
    </div>
  );
}
