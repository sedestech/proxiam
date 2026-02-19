import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  FolderKanban,
  Workflow,
  AlertTriangle,
  Database,
  TrendingUp,
  Activity,
} from "lucide-react";
import api from "../lib/api";

interface Stats {
  phases: number;
  blocs: number;
  livrables: number;
  normes: number;
  risques: number;
  sources_veille: number;
  outils: number;
  competences: number;
  projets: number;
  postes_sources: number;
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="card group flex items-center gap-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();

  const { data: stats } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await api.get("/api/stats");
      return res.data;
    },
  });

  const totalKnowledge = stats
    ? stats.phases +
      stats.livrables +
      stats.normes +
      stats.risques +
      stats.sources_veille +
      stats.outils +
      stats.competences
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          OS Energie Renouvelable — Matrice 6D
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={FolderKanban}
          label={t("dashboard.totalProjects")}
          value={stats?.projets ?? 0}
          color="#6366f1"
        />
        <KpiCard
          icon={Workflow}
          label={t("dashboard.activePhases")}
          value={stats?.phases ?? 0}
          color="#3b82f6"
        />
        <KpiCard
          icon={AlertTriangle}
          label={t("dashboard.criticalRisks")}
          value={stats?.risques ?? 0}
          color="#ef4444"
        />
        <KpiCard
          icon={Database}
          label={t("dashboard.knowledgeItems")}
          value={totalKnowledge.toLocaleString()}
          color="#10b981"
        />
      </div>

      {/* 6D Matrix Overview */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Matrice 6D */}
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <TrendingUp className="h-5 w-5 text-primary-500" />
            Couverture Matrice 6D
          </h2>
          <div className="space-y-3">
            {[
              { label: "Phases", count: stats?.phases ?? 0, color: "#3b82f6" },
              { label: "Livrables", count: stats?.livrables ?? 0, color: "#f59e0b" },
              { label: "Normes", count: stats?.normes ?? 0, color: "#10b981" },
              { label: "Risques", count: stats?.risques ?? 0, color: "#ef4444" },
              { label: "Sources", count: stats?.sources_veille ?? 0, color: "#8b5cf6" },
              { label: "Outils", count: stats?.outils ?? 0, color: "#f97316" },
              { label: "Compétences", count: stats?.competences ?? 0, color: "#ec4899" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 text-sm text-slate-600">{label}</span>
                <span className="font-mono text-sm font-medium text-slate-900">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Activity className="h-5 w-5 text-primary-500" />
            {t("dashboard.recentActivity")}
          </h2>
          <div className="flex h-40 items-center justify-center text-sm text-slate-400">
            {stats && totalKnowledge > 0
              ? "Activité en cours..."
              : "Aucune donnée — Lancer le seed pour peupler la base"}
          </div>
        </div>
      </div>

      {/* Infrastructure */}
      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Infrastructure Géospatiale
        </h2>
        <div className="flex items-center gap-6 text-sm text-slate-600">
          <div>
            <span className="font-mono text-lg font-bold text-slate-900">
              {stats?.postes_sources ?? 0}
            </span>{" "}
            postes sources
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="font-mono text-lg font-bold text-slate-900">
              {stats?.projets ?? 0}
            </span>{" "}
            projets géolocalisés
          </div>
        </div>
      </div>
    </div>
  );
}
