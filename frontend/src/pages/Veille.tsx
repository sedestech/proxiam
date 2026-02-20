import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Radar,
  Search,
  Globe,
  Rss,
  Database,
  Code,
  ExternalLink,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";
import api from "../lib/api";
import QueryError from "../components/QueryError";

interface Source {
  id: number;
  code: string;
  nom: string;
  type: string | null;
  url: string | null;
  frequence: string | null;
  gratuit: boolean;
}

const TYPE_CONFIG: Record<string, { icon: typeof Globe; color: string }> = {
  api: { icon: Globe, color: "#3b82f6" },
  rss: { icon: Rss, color: "#f59e0b" },
  scraping: { icon: Code, color: "#8b5cf6" },
  base_donnees: { icon: Database, color: "#10b981" },
};

function typeIcon(type: string | null) {
  const cfg = TYPE_CONFIG[type || ""] || { icon: Globe, color: "#94a3b8" };
  const Icon = cfg.icon;
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: `${cfg.color}15` }}
    >
      <Icon className="h-4 w-4" style={{ color: cfg.color }} />
    </div>
  );
}

function frequenceBadge(freq: string | null, t: (key: string) => string) {
  if (!freq) return null;
  const colors: Record<string, string> = {
    temps_reel: "bg-emerald-50 text-emerald-700",
    quotidien: "bg-blue-50 text-blue-700",
    hebdo: "bg-violet-50 text-violet-700",
    mensuel: "bg-amber-50 text-amber-700",
    annuel: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
        colors[freq] || "bg-slate-100 text-slate-500"
      }`}
    >
      {t(`veille.${freq}`)}
    </span>
  );
}

export default function Veille() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [freeFilter, setFreeFilter] = useState<string>("");

  const { data: sources, isLoading, isError, refetch } = useQuery<Source[]>({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await api.get("/api/sources?limit=500");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Type counts for badges
  const typeCounts = useMemo(() => {
    if (!sources) return {};
    const counts: Record<string, number> = {};
    sources.forEach((s) => {
      const t = s.type || "autre";
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [sources]);

  // Filter sources
  const filtered = useMemo(() => {
    if (!sources) return [];
    return sources.filter((s) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.nom.toLowerCase().includes(q) &&
          !s.code.toLowerCase().includes(q) &&
          !(s.url || "").toLowerCase().includes(q)
        )
          return false;
      }
      if (typeFilter && s.type !== typeFilter) return false;
      if (freeFilter === "gratuit" && !s.gratuit) return false;
      if (freeFilter === "payant" && s.gratuit) return false;
      return true;
    });
  }, [sources, searchQuery, typeFilter, freeFilter]);

  const typeOptions = ["api", "rss", "scraping", "base_donnees"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("veille.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("veille.subtitle")}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {typeOptions.map((type) => {
          const cfg = TYPE_CONFIG[type];
          const Icon = cfg.icon;
          const count = typeCounts[type] || 0;
          const isActive = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(isActive ? "" : type)}
              className={`card flex items-center gap-3 text-left transition-all ${
                isActive ? "ring-2 ring-primary-500 ring-offset-1" : ""
              }`}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${cfg.color}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: cfg.color }} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{count}</p>
                <p className="text-xs text-slate-500">{t(`veille.${type}`)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t("veille.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
        >
          <option value="">{t("veille.allTypes")}</option>
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {t(`veille.${type}`)} ({typeCounts[type] || 0})
            </option>
          ))}
        </select>
        <select
          value={freeFilter}
          onChange={(e) => setFreeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-primary-500 focus:outline-none"
        >
          <option value="">
            {t("veille.gratuit")} / {t("veille.payant")}
          </option>
          <option value="gratuit">{t("veille.gratuit")}</option>
          <option value="payant">{t("veille.payant")}</option>
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Filter className="h-4 w-4" />
        <span>
          {filtered.length} {t("veille.sourceCount")}
          {typeFilter || freeFilter || searchQuery ? " (filtre actif)" : ""}
        </span>
      </div>

      {/* Sources list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-sm text-slate-400">
          {t("common.loading")}
        </div>
      ) : isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
          <Radar className="h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            {t("veille.noResults")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((source) => (
            <div
              key={source.id}
              className="card flex items-center gap-3 py-3 hover:border-slate-300 transition-colors"
            >
              {typeIcon(source.type)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {source.code}
                  </span>
                  <h3 className="truncate text-sm font-medium text-slate-900">
                    {source.nom}
                  </h3>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  {source.type && (
                    <span className="text-xs text-slate-400">
                      {t(`veille.${source.type}`)}
                    </span>
                  )}
                  {frequenceBadge(source.frequence, t)}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {source.gratuit ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-amber-500" />
                )}
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t("veille.visitSite")}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
