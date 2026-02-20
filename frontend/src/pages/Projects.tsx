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
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../lib/api";
import ProjectForm from "../components/ProjectForm";
import QueryError from "../components/QueryError";

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
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    errors: { row: number; error: string }[];
  } | null>(null);

  const { data: projets, isLoading, isError, refetch } = useQuery<Projet[]>({
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
          <button
            onClick={() => {
              setShowImport(true);
              setImportFile(null);
              setImportPreview([]);
              setImportResult(null);
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
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

      {/* Error */}
      {isError && (
        <QueryError onRetry={() => refetch()} />
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

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
              <FileUp className="h-5 w-5 text-primary-500" />
              {t("import.title")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              CSV (delimiteur point-virgule) ou JSON. Colonnes : nom, filiere, puissance_mwc, surface_ha, commune, departement, region, statut, lon, lat
            </p>

            {!importResult ? (
              <>
                {/* File picker */}
                <label className="mt-4 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-primary-400 dark:border-slate-600">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="mt-2 text-sm text-slate-500">
                    {importFile ? importFile.name : t("import.selectFile")}
                  </span>
                  <input
                    type="file"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setImportFile(f);
                      // Parse preview
                      const reader = new FileReader();
                      reader.onload = () => {
                        const text = reader.result as string;
                        if (f.name.endsWith(".json")) {
                          try {
                            const arr = JSON.parse(text);
                            setImportPreview(arr.slice(0, 5));
                          } catch { setImportPreview([]); }
                        } else {
                          const lines = text.split("\n").filter(Boolean);
                          if (lines.length < 2) return;
                          const headers = lines[0].split(";").map((h: string) => h.trim());
                          const rows = lines.slice(1, 6).map((line: string) => {
                            const vals = line.split(";");
                            const obj: Record<string, string> = {};
                            headers.forEach((h: string, i: number) => { obj[h] = vals[i]?.trim() || ""; });
                            return obj;
                          });
                          setImportPreview(rows);
                        }
                      };
                      reader.readAsText(f);
                    }}
                  />
                </label>

                {/* Preview table */}
                {importPreview.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-700">
                        <tr>
                          {Object.keys(importPreview[0]).map((h) => (
                            <th key={h} className="px-2 py-1.5 text-left font-medium text-slate-500">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, i) => (
                          <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                            {Object.values(row).map((v, j) => (
                              <td key={j} className="px-2 py-1 text-slate-600 dark:text-slate-300">
                                {String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowImport(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    disabled={!importFile || importing}
                    onClick={async () => {
                      if (!importFile) return;
                      setImporting(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", importFile);
                        const res = await api.post("/api/projets/import", formData, {
                          headers: { "Content-Type": "multipart/form-data" },
                        });
                        setImportResult(res.data);
                        queryClient.invalidateQueries({ queryKey: ["projets"] });
                        queryClient.invalidateQueries({ queryKey: ["projets-stats"] });
                      } catch {
                        setImportResult({ imported: 0, errors: [{ row: 0, error: t("import.serverError") }] });
                      } finally {
                        setImporting(false);
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
                  >
                    {importing ? t("import.importing") : t("import.importBtn")}
                  </button>
                </div>
              </>
            ) : (
              /* Result view */
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  {importResult.imported} {t("import.imported")}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      {importResult.errors.length} {t("import.errors")}
                    </div>
                    <ul className="mt-1 ml-7 list-disc text-xs">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{t("import.errorLine")} {err.row}: {err.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowImport(false)}
                    className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
                  >
                    {t("import.close")}
                  </button>
                </div>
              </div>
            )}
          </div>
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
