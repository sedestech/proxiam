import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpDown,
  Sun,
  Wind,
  Battery,
  Zap,
  Download,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import api from "../lib/api";

interface CompareProject {
  id: string;
  nom: string;
  filiere: string;
  puissance_mwc: number;
  surface_ha: number | null;
  commune: string | null;
  departement: string | null;
  statut: string;
  score_global: number | null;
  enriched: boolean;
  ghi_kwh_m2_an: number | null;
  productible_kwh_kwc_an: number | null;
  distance_poste_km: number | null;
  constraints_count: number;
  capex_total_eur: number;
  capex_eur_kwc: number;
  opex_annuel_eur: number;
  revenu_annuel_eur: number;
  lcoe_eur_mwh: number;
  tri_pct: number;
  payback_years: number | null;
  rentable: boolean;
  risk_level: "low" | "medium" | "high";
  nb_obligations: number;
  delai_max_mois: number;
}

type SortKey = keyof CompareProject;

function filiereIcon(filiere: string) {
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
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function riskBadge(level: string) {
  if (level === "high") return "bg-red-100 text-red-700";
  if (level === "medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function formatEur(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

function bestValue(
  projects: CompareProject[],
  key: SortKey,
  mode: "max" | "min"
): string | null {
  const values = projects
    .map((p) => ({ id: p.id, val: p[key] as number | null }))
    .filter((v) => v.val !== null && v.val !== 0);
  if (values.length === 0) return null;
  const best =
    mode === "max"
      ? values.reduce((a, b) => ((a.val ?? 0) > (b.val ?? 0) ? a : b))
      : values.reduce((a, b) => ((a.val ?? 0) < (b.val ?? 0) ? a : b));
  return best.id;
}

export default function Compare() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const ids = searchParams.get("ids") || "";
  const [sortKey, setSortKey] = useState<SortKey>("score_global");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading, error } = useQuery<{
    count: number;
    projects: CompareProject[];
  }>({
    queryKey: ["compare", ids],
    queryFn: async () => {
      const res = await api.get(`/api/projets/compare?ids=${ids}`);
      return res.data;
    },
    enabled: ids.length > 0,
  });

  const sorted = useMemo(() => {
    if (!data?.projects) return [];
    return [...data.projects].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc"
          ? av.localeCompare(bv)
          : bv.localeCompare(av);
      }
      const na = Number(av);
      const nb = Number(bv);
      return sortDir === "asc" ? na - nb : nb - na;
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleExportCsv = async () => {
    const link = document.createElement("a");
    link.href = `${api.defaults.baseURL}/api/projets/compare/export?ids=${ids}`;
    link.download = "proxiam-comparaison.csv";
    link.click();
  };

  if (!ids) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        {t("compare.noSelection")}
      </div>
    );
  }

  // Compute best values for highlighting
  const bestScore = data ? bestValue(data.projects, "score_global", "max") : null;
  const bestTri = data ? bestValue(data.projects, "tri_pct", "max") : null;
  const bestLcoe = data ? bestValue(data.projects, "lcoe_eur_mwh", "min") : null;
  const bestCapex = data ? bestValue(data.projects, "capex_eur_kwc", "min") : null;

  const columns: {
    key: SortKey;
    label: string;
    group: string;
    format: (p: CompareProject) => React.ReactNode;
  }[] = [
    {
      key: "nom",
      label: t("compare.project"),
      group: "info",
      format: (p) => (
        <div className="flex items-center gap-2">
          {filiereIcon(p.filiere)}
          <Link
            to={`/projects/${p.id}`}
            className="font-medium text-slate-800 hover:text-indigo-600 dark:text-slate-200"
          >
            {p.nom}
          </Link>
        </div>
      ),
    },
    {
      key: "puissance_mwc",
      label: "MWc",
      group: "info",
      format: (p) => (
        <span className="font-mono">{p.puissance_mwc}</span>
      ),
    },
    {
      key: "score_global",
      label: t("compare.score"),
      group: "info",
      format: (p) => (
        <span
          className={`font-mono font-bold ${scoreColor(p.score_global)} ${
            p.id === bestScore ? "underline decoration-2" : ""
          }`}
        >
          {p.score_global ?? "—"}
        </span>
      ),
    },
    {
      key: "productible_kwh_kwc_an",
      label: t("compare.productible"),
      group: "site",
      format: (p) => (
        <span className="font-mono text-sm">
          {p.productible_kwh_kwc_an ?? "—"}
        </span>
      ),
    },
    {
      key: "ghi_kwh_m2_an",
      label: "GHI",
      group: "site",
      format: (p) => (
        <span className="font-mono text-sm">
          {p.ghi_kwh_m2_an ?? "—"}
        </span>
      ),
    },
    {
      key: "distance_poste_km",
      label: t("compare.distPoste"),
      group: "site",
      format: (p) => (
        <span className="font-mono text-sm">
          {p.distance_poste_km ? `${p.distance_poste_km} km` : "—"}
        </span>
      ),
    },
    {
      key: "constraints_count",
      label: t("compare.constraints"),
      group: "site",
      format: (p) => (
        <span
          className={`font-mono text-sm ${
            p.constraints_count > 0 ? "text-red-500" : "text-emerald-500"
          }`}
        >
          {p.constraints_count}
        </span>
      ),
    },
    {
      key: "capex_total_eur",
      label: "CAPEX",
      group: "finance",
      format: (p) => (
        <span className="font-mono text-sm">
          {formatEur(p.capex_total_eur)}
        </span>
      ),
    },
    {
      key: "capex_eur_kwc",
      label: "EUR/kWc",
      group: "finance",
      format: (p) => (
        <span
          className={`font-mono text-sm ${
            p.id === bestCapex ? "font-bold text-emerald-600" : ""
          }`}
        >
          {p.capex_eur_kwc}
        </span>
      ),
    },
    {
      key: "lcoe_eur_mwh",
      label: "LCOE",
      group: "finance",
      format: (p) => (
        <span
          className={`font-mono text-sm ${
            p.id === bestLcoe ? "font-bold text-emerald-600" : ""
          }`}
        >
          {p.lcoe_eur_mwh || "—"}
        </span>
      ),
    },
    {
      key: "tri_pct",
      label: "TRI %",
      group: "finance",
      format: (p) => (
        <span
          className={`font-mono text-sm font-bold ${
            p.id === bestTri ? "text-emerald-600" : p.rentable ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {p.tri_pct}%
        </span>
      ),
    },
    {
      key: "rentable",
      label: t("compare.profitable"),
      group: "finance",
      format: (p) =>
        p.rentable ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <X className="h-4 w-4 text-red-400" />
        ),
    },
    {
      key: "risk_level",
      label: t("compare.riskLevel"),
      group: "regulatory",
      format: (p) => (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${riskBadge(
            p.risk_level
          )}`}
        >
          {t(`regulatory.risk_${p.risk_level}`)}
        </span>
      ),
    },
    {
      key: "nb_obligations",
      label: t("compare.obligations"),
      group: "regulatory",
      format: (p) => <span className="font-mono text-sm">{p.nb_obligations}</span>,
    },
    {
      key: "delai_max_mois",
      label: t("compare.delay"),
      group: "regulatory",
      format: (p) => (
        <span className="font-mono text-sm">{p.delai_max_mois} {t("regulatory.months")}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("compare.title")}
            </h1>
            <p className="text-sm text-slate-500">
              {data?.count ?? 0} {t("compare.projectsCompared")}
            </p>
          </div>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <Download className="h-4 w-4" />
          {t("compare.exportCsv")}
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="card flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {t("compare.loading")}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {t("compare.error")}
        </div>
      )}

      {/* Table */}
      {data && data.projects.length > 0 && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="cursor-pointer whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (
                        <ArrowUpDown className="h-3 w-3 text-indigo-500" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {sorted.map((p, i) => (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                    i === 0 && sortKey === "score_global" && sortDir === "desc"
                      ? "bg-indigo-50/50 dark:bg-indigo-500/5"
                      : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-3 py-2.5">
                      {col.format(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary cards */}
      {data && data.projects.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Best score */}
          {bestScore && (
            <div className="card border-l-4 border-l-indigo-500">
              <p className="text-xs text-slate-400">{t("compare.bestScore")}</p>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                {data.projects.find((p) => p.id === bestScore)?.nom}
              </p>
              <p className="font-mono text-lg font-bold text-indigo-600">
                {data.projects.find((p) => p.id === bestScore)?.score_global}/100
              </p>
            </div>
          )}
          {/* Best TRI */}
          {bestTri && (
            <div className="card border-l-4 border-l-emerald-500">
              <p className="text-xs text-slate-400">{t("compare.bestTri")}</p>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                {data.projects.find((p) => p.id === bestTri)?.nom}
              </p>
              <p className="font-mono text-lg font-bold text-emerald-600">
                <TrendingUp className="mr-1 inline h-4 w-4" />
                {data.projects.find((p) => p.id === bestTri)?.tri_pct}%
              </p>
            </div>
          )}
          {/* Best LCOE */}
          {bestLcoe && (
            <div className="card border-l-4 border-l-teal-500">
              <p className="text-xs text-slate-400">{t("compare.bestLcoe")}</p>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                {data.projects.find((p) => p.id === bestLcoe)?.nom}
              </p>
              <p className="font-mono text-lg font-bold text-teal-600">
                {data.projects.find((p) => p.id === bestLcoe)?.lcoe_eur_mwh} EUR/MWh
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
