import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  FolderKanban,
  Workflow,
  AlertTriangle,
  Database,
  TrendingUp,
  ArrowRight,
  Sun,
  Wind,
  Battery,
  Zap,
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

interface PortfolioStats {
  total: number;
  by_statut: Record<string, number>;
  avg_score: number;
  total_mwc: number;
  nb_filieres: number;
}

interface Projet {
  id: string;
  nom: string;
  filiere: string | null;
  puissance_mwc: number | null;
  commune: string | null;
  departement: string | null;
  statut: string;
  score_global: number | null;
}

const STATUT_COLORS: Record<string, string> = {
  prospection: "#3b82f6",
  ingenierie: "#8b5cf6",
  autorisation: "#f59e0b",
  construction: "#10b981",
  exploitation: "#14b8a6",
};

const FILIERE_COLORS: Record<string, string> = {
  solaire_sol: "#f59e0b",
  eolien_onshore: "#3b82f6",
  bess: "#10b981",
};

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
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function filiereIcon(filiere: string | null) {
  switch (filiere) {
    case "solaire_sol": return <Sun className="h-4 w-4 text-amber-500" />;
    case "eolien_onshore": return <Wind className="h-4 w-4 text-blue-500" />;
    case "bess": return <Battery className="h-4 w-4 text-emerald-500" />;
    default: return <Zap className="h-4 w-4 text-slate-400" />;
  }
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

  const { data: portfolio } = useQuery<PortfolioStats>({
    queryKey: ["portfolio-stats"],
    queryFn: async () => {
      const res = await api.get("/api/projets/stats/summary");
      return res.data;
    },
  });

  const { data: projects } = useQuery<Projet[]>({
    queryKey: ["projets-recent"],
    queryFn: async () => {
      const res = await api.get("/api/projets?limit=5");
      return res.data;
    },
  });

  const totalKnowledge = stats
    ? stats.phases + stats.livrables + stats.normes + stats.risques +
      stats.sources_veille + stats.outils + stats.competences
    : 0;

  // Statut chart data
  const statutData = portfolio
    ? Object.entries(portfolio.by_statut)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: k, value: v, color: STATUT_COLORS[k] || "#94a3b8" }))
    : [];

  // Filiere chart data (from projects)
  const filiereData = projects
    ? Object.entries(
        projects.reduce<Record<string, number>>((acc, p) => {
          const f = p.filiere || "autre";
          acc[f] = (acc[f] || 0) + 1;
          return acc;
        }, {})
      ).map(([k, v]) => ({ name: k, value: v, color: FILIERE_COLORS[k] || "#94a3b8" }))
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("dashboard.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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

      {/* Portfolio charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Statut donut */}
        <div className="card">
          <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("dashboard.portfolio")} — Statut
          </h2>
          {statutData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={statutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="transparent"
                  >
                    {statutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {statutData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-slate-600 dark:text-slate-300 capitalize">{entry.name}</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-[120px] items-center justify-center text-xs text-slate-400">
              Pas de projets
            </div>
          )}
        </div>

        {/* Filiere breakdown */}
        <div className="card">
          <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("dashboard.portfolio")} — Filieres
          </h2>
          {filiereData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={filiereData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={80}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#fff", border: "1px solid #e2e8f0",
                    borderRadius: "8px", fontSize: "12px",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {filiereData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[120px] items-center justify-center text-xs text-slate-400">
              Pas de projets
            </div>
          )}
        </div>

        {/* Score + MWc summary */}
        <div className="card flex flex-col justify-between">
          <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            {t("dashboard.portfolio")} — KPIs
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Score moyen</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {portfolio?.avg_score ?? "—"}/100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Puissance totale</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {portfolio?.total_mwc ? `${portfolio.total_mwc} MWc` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">Postes sources</span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {stats?.postes_sources?.toLocaleString() ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects + 6D Coverage */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent projects */}
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Projets recents
            </h2>
            <Link
              to="/projects"
              className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {projects?.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {filiereIcon(p.filiere)}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {p.nom}
                  </p>
                  <p className="text-xs text-slate-400">
                    {p.commune}{p.departement ? ` (${p.departement})` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {p.score_global !== null && (
                    <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                      {p.score_global}
                    </span>
                  )}
                  <p className="text-[10px] text-slate-400 capitalize">{p.statut}</p>
                </div>
              </Link>
            ))}
            {(!projects || projects.length === 0) && (
              <p className="py-6 text-center text-sm text-slate-400">Pas de projets</p>
            )}
          </div>
        </div>

        {/* 6D Matrix coverage */}
        <div className="card">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            <TrendingUp className="h-4 w-4 text-primary-500" />
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
              { label: "Competences", count: stats?.competences ?? 0, color: "#ec4899" },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="flex-1 text-sm text-slate-600 dark:text-slate-300">{label}</span>
                <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
