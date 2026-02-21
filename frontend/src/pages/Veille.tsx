import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Eye,
  Plus,
  Clock,
  Brain,
  Tag,
} from "lucide-react";
import api from "../lib/api";
import QueryError from "../components/QueryError";

// ─── Types ───

interface Source {
  id: number;
  code: string;
  nom: string;
  type: string | null;
  url: string | null;
  frequence: string | null;
  gratuit: boolean;
}

interface ScrapedItem {
  id: string;
  url: string;
  title: string | null;
  ai_summary: string | null;
  ai_tags: { tags?: string[]; impact?: string; domains?: string[] } | null;
  status: string;
  first_seen: string | null;
  last_changed: string | null;
  source_nom: string | null;
  source_type: string | null;
}

// ─── Config ───

const TYPE_CONFIG: Record<string, { icon: typeof Globe; color: string }> = {
  api: { icon: Globe, color: "#3b82f6" },
  rss: { icon: Rss, color: "#f59e0b" },
  scraping: { icon: Code, color: "#8b5cf6" },
  base_donnees: { icon: Database, color: "#10b981" },
};

const IMPACT_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

type Tab = "content" | "sources";

export default function Veille() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("content");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [freeFilter, setFreeFilter] = useState("");

  // ─── Content data ───
  const { data: contentData, isLoading: contentLoading } = useQuery<{
    total: number;
    items: ScrapedItem[];
  }>({
    queryKey: ["veille-content"],
    queryFn: async () => (await api.get("/api/veille/latest?limit=50")).data,
    staleTime: 60 * 1000,
    retry: false,
  });

  // ─── Sources data ───
  const { data: sources, isLoading: sourcesLoading, isError, refetch } = useQuery<Source[]>({
    queryKey: ["sources"],
    queryFn: async () => (await api.get("/api/sources?limit=500")).data,
    staleTime: 5 * 60 * 1000,
  });

  // ─── Watch mutation ───
  const watchMutation = useMutation({
    mutationFn: async (body: { watch_type: string; watch_value: string }) => {
      return (await api.post("/api/watches", body)).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watches"] }),
  });

  // Source filtering
  const typeCounts = useMemo(() => {
    if (!sources) return {};
    const counts: Record<string, number> = {};
    sources.forEach((s) => {
      const t = s.type || "autre";
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [sources]);

  const filtered = useMemo(() => {
    if (!sources) return [];
    return sources.filter((s) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!s.nom.toLowerCase().includes(q) && !s.code.toLowerCase().includes(q) && !(s.url || "").toLowerCase().includes(q)) return false;
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t("veille.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("veille.subtitle")}</p>
      </div>

      {/* Tabs — full width on mobile */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-700/50">
        <button
          onClick={() => setTab("content")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
            tab === "content" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"
          }`}
        >
          <Brain className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("veille.scrapedContent")} ({contentData?.total ?? 0})</span>
        </button>
        <button
          onClick={() => setTab("sources")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
            tab === "sources" ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"
          }`}
        >
          <Radar className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("veille.sourcesTab")} ({sources?.length ?? 0})</span>
        </button>
      </div>

      {/* ─── Content Tab ─── */}
      {tab === "content" && (
        <div className="space-y-3">
          {contentLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">{t("common.loading")}</div>
          ) : contentData?.items && contentData.items.length > 0 ? (
            contentData.items.map((item) => (
              <div key={item.id} className="card space-y-2 py-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                    item.status === "analyzed" ? "bg-emerald-400" :
                    item.status === "new" ? "bg-blue-400" : "bg-red-400"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {item.title || item.url}
                      </h3>
                      {item.ai_tags?.impact && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${IMPACT_COLORS[item.ai_tags.impact] || IMPACT_COLORS.low}`}>
                          {item.ai_tags.impact}
                        </span>
                      )}
                    </div>
                    {item.ai_summary && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.ai_summary}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {item.source_nom && (
                        <span className="text-[10px] text-slate-400">{item.source_nom}</span>
                      )}
                      {item.ai_tags?.tags?.map((tag) => (
                        <span key={tag} className="rounded-full bg-indigo-50 px-1.5 py-0 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                          {tag}
                        </span>
                      ))}
                      {item.last_changed && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {new Date(item.last_changed).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => watchMutation.mutate({ watch_type: "keyword", watch_value: item.title || "" })}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600"
                      title={t("veille.watchThis")}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <Brain className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">{t("veille.noScrapedContent")}</p>
              <p className="text-xs text-slate-400">{t("veille.scrapeHint")}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Sources Tab ─── */}
      {tab === "sources" && (
        <>
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
                  className={`card flex items-center gap-3 text-left transition-all ${isActive ? "ring-2 ring-primary-500 ring-offset-1" : ""}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${cfg.color}15` }}>
                    <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{count}</p>
                    <p className="text-xs text-slate-500">{t(`veille.${type}`)}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Search + Filters — stack on mobile */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3">
            <div className="relative flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder={t("veille.searchPlaceholder")} value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 min-h-[44px]" />
            </div>
            <div className="flex gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 min-h-[44px] sm:flex-initial">
                <option value="">{t("veille.allTypes")}</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>{t(`veille.${type}`)} ({typeCounts[type] || 0})</option>
                ))}
              </select>
              <select value={freeFilter} onChange={(e) => setFreeFilter(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 min-h-[44px] sm:flex-initial">
                <option value="">{t("veille.gratuit")} / {t("veille.payant")}</option>
                <option value="gratuit">{t("veille.gratuit")}</option>
                <option value="payant">{t("veille.payant")}</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Filter className="h-4 w-4" />
            <span>{filtered.length} {t("veille.sourceCount")}</span>
          </div>

          {/* Sources list */}
          {sourcesLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">{t("common.loading")}</div>
          ) : isError ? (
            <QueryError onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50">
              <Radar className="h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">{t("veille.noResults")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((source) => {
                const cfg = TYPE_CONFIG[source.type || ""] || { icon: Globe, color: "#94a3b8" };
                const Icon = cfg.icon;
                return (
                  <div key={source.id} className="card flex flex-col gap-2 p-3 hover:border-slate-300 transition-colors sm:flex-row sm:items-center sm:gap-3 sm:p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${cfg.color}15` }}>
                        <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400 shrink-0">{source.code}</span>
                          <h3 className="truncate text-sm font-medium text-slate-900 dark:text-white">{source.nom}</h3>
                        </div>
                      </div>
                      {source.gratuit ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 sm:hidden" /> : <XCircle className="h-4 w-4 shrink-0 text-amber-500 sm:hidden" />}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pl-12 sm:pl-0">
                      {source.gratuit ? <CheckCircle className="hidden h-4 w-4 text-emerald-500 sm:block" /> : <XCircle className="hidden h-4 w-4 text-amber-500 sm:block" />}
                      <button
                        onClick={() => watchMutation.mutate({ watch_type: "source", watch_value: String(source.id) })}
                        className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600 dark:text-slate-300"
                        title={t("veille.watchSource")}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer"
                          className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600 dark:text-slate-300">
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{t("veille.visitSite")}</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
