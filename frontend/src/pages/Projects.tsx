import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FolderKanban,
  Sun,
  Wind,
  Battery,
  Zap,
  MapPin,
  ChevronRight,
  Filter,
  BarChart3,
  Download,
  Plus,
} from "lucide-react";
import api from "../lib/api";
import ProjectForm from "../components/ProjectForm";

interface Projet {
  id: string;
  nom: string;
  filiere: string | null;
  puissance_mwc: number | null;
  surface_ha: number | null;
  commune: string | null;
  departement: string | null;
  region: string | null;
  statut: string;
  score_global: number | null;
  lon: number | null;
  lat: number | null;
}

interface PortfolioStats {
  total: number;
  by_statut: Record<string, number>;
  avg_score: number;
  total_mwc: number;
  nb_filieres: number;
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

function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function statutBadge(statut: string) {
  const styles: Record<string, string> = {
    prospection: "bg-blue-50 text-blue-700",
    ingenierie: "bg-violet-50 text-violet-700",
    autorisation: "bg-amber-50 text-amber-700",
    construction: "bg-emerald-50 text-emerald-700",
    exploitation: "bg-teal-50 text-teal-700",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[statut] || "bg-slate-50 text-slate-700"
      }`}
    >
      {statut}
    </span>
  );
}

export default function Projects() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filterFiliere, setFilterFiliere] = useState<string>("");
  const [filterStatut, setFilterStatut] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  const { data: projets, isLoading } = useQuery<Projet[]>({
    queryKey: ["projets", filterFiliere, filterStatut],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterFiliere) params.filiere = filterFiliere;
      if (filterStatut) params.statut = filterStatut;
      const res = await api.get("/api/projets", { params });
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: stats } = useQuery<PortfolioStats>({
    queryKey: ["projets-stats"],
    queryFn: async () => {
      const res = await api.get("/api/projets/stats/summary");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("nav.projects")}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("projects.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`${api.defaults.baseURL || ""}/api/projets/export/csv`}
            download
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Download className="h-4 w-4" />
            CSV
          </a>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
          >
            <Plus className="h-4 w-4" />
            {t("common.create")}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="card flex items-center gap-3 py-3">
            <FolderKanban className="h-5 w-5 text-primary-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">{t("projects.total")}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 py-3">
            <Zap className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">
                {stats.total_mwc}
              </p>
              <p className="text-xs text-slate-500">MWc {t("projects.totalCapacity")}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 py-3">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">
                {stats.avg_score}
              </p>
              <p className="text-xs text-slate-500">{t("projects.avgScore")}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 py-3">
            <Filter className="h-5 w-5 text-violet-500" />
            <div>
              <p className="text-xl font-bold text-slate-900">
                {stats.nb_filieres}
              </p>
              <p className="text-xs text-slate-500">{t("projects.filieres")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filterFiliere}
          onChange={(e) => setFilterFiliere(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
        >
          <option value="">{t("projects.allFilieres")}</option>
          <option value="solaire_sol">Solaire sol</option>
          <option value="eolien_onshore">Eolien onshore</option>
          <option value="bess">BESS</option>
        </select>
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
        >
          <option value="">{t("projects.allStatuts")}</option>
          <option value="prospection">Prospection</option>
          <option value="ingenierie">Ingenierie</option>
          <option value="autorisation">Autorisation</option>
          <option value="construction">Construction</option>
          <option value="exploitation">Exploitation</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          {t("common.loading")}
        </div>
      )}

      {/* Projects table */}
      {projets && projets.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t("projects.project")}
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 sm:table-cell">
                  {t("projects.location")}
                </th>
                <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500 md:table-cell">
                  MWc
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t("common.score")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-slate-500">
                  {t("common.status")}
                </th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projets.map((p) => (
                <tr
                  key={p.id}
                  className="group hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/projects/${p.id}`}
                      className="flex items-center gap-3"
                    >
                      {filiereIcon(p.filiere)}
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-primary-600">
                          {p.nom}
                        </p>
                        <p className="text-xs text-slate-400 sm:hidden">
                          {p.commune}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {p.commune}
                      {p.departement && (
                        <span className="text-slate-400">
                          ({p.departement})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">
                    <span className="font-mono text-sm text-slate-700">
                      {p.puissance_mwc ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.score_global !== null ? (
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: scoreColor(p.score_global) }}
                      >
                        {p.score_global}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {statutBadge(p.statut)}
                  </td>
                  <td className="px-2 py-3">
                    <Link to={`/projects/${p.id}`}>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {projets && projets.length === 0 && (
        <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-100/50">
          <p className="text-sm text-slate-400">{t("common.noData")}</p>
        </div>
      )}

      {/* New project form */}
      {showForm && (
        <ProjectForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ["projets"] });
            queryClient.invalidateQueries({ queryKey: ["projets-stats"] });
          }}
        />
      )}
    </div>
  );
}
