import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  Workflow,
  FileText,
  AlertTriangle,
  Package,
  Wrench,
  Radar,
  Users,
  X,
  Loader2,
} from "lucide-react";
import api from "../lib/api";

interface SearchResult {
  id: number;
  code: string;
  titre: string;
  description?: string;
  type: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  facets: { type: Record<string, number> };
}

const TYPE_META: Record<string, { icon: typeof Workflow; color: string; label_fr: string; label_en: string }> = {
  phase: { icon: Workflow, color: "#3b82f6", label_fr: "Phase", label_en: "Phase" },
  norme: { icon: FileText, color: "#10b981", label_fr: "Norme", label_en: "Standard" },
  risque: { icon: AlertTriangle, color: "#ef4444", label_fr: "Risque", label_en: "Risk" },
  livrable: { icon: Package, color: "#f59e0b", label_fr: "Livrable", label_en: "Deliverable" },
  outil: { icon: Wrench, color: "#f97316", label_fr: "Outil", label_en: "Tool" },
  source: { icon: Radar, color: "#8b5cf6", label_fr: "Source", label_en: "Source" },
  competence: { icon: Users, color: "#ec4899", label_fr: "Compétence", label_en: "Skill" },
};

const ALL_TYPES = Object.keys(TYPE_META);

export default function SearchResults() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEn = i18n.language === "en";

  const queryParam = searchParams.get("q") || "";
  const typesParam = searchParams.get("types") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [facets, setFacets] = useState<Record<string, number>>({});
  const [activeTypes, setActiveTypes] = useState<string[]>(
    typesParam ? typesParam.split(",") : []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(pageParam);
  const perPage = 20;

  // Sync query input from URL on param change
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setActiveTypes(searchParams.get("types") ? searchParams.get("types")!.split(",") : []);
    setPage(parseInt(searchParams.get("page") || "1", 10));
  }, [searchParams]);

  // Search when URL params change
  useEffect(() => {
    if (!queryParam || queryParam.length < 2) {
      setResults([]);
      setTotal(0);
      setFacets({});
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    (async () => {
      try {
        const params: Record<string, string | number> = {
          q: queryParam,
          limit: perPage,
        };
        if (typesParam) params.types = typesParam;

        const res = await api.get<SearchResponse>("/api/search", {
          params,
          signal: controller.signal,
        });
        setResults(res.data.results);
        setTotal(res.data.total);
        setFacets(res.data.facets?.type || {});
      } catch {
        // ignore abort errors
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [queryParam, typesParam, pageParam]);

  function submitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (query.length < 2) return;
    const params: Record<string, string> = { q: query };
    if (activeTypes.length > 0) params.types = activeTypes.join(",");
    setSearchParams(params);
  }

  function toggleType(type: string) {
    const newTypes = activeTypes.includes(type)
      ? activeTypes.filter((t) => t !== type)
      : [...activeTypes, type];
    setActiveTypes(newTypes);
    const params: Record<string, string> = { q: queryParam };
    if (newTypes.length > 0) params.types = newTypes.join(",");
    setSearchParams(params);
  }

  function clearFilters() {
    setActiveTypes([]);
    setSearchParams({ q: queryParam });
  }

  // Facet counts: use global facets for all types
  const facetCounts = ALL_TYPES.map((type) => ({
    type,
    count: facets[type] || 0,
    meta: TYPE_META[type],
  }));

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Search form */}
      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.search")}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-300 focus:ring-2 focus:ring-primary-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
        <button
          type="submit"
          className="btn-primary h-10 px-5 text-sm"
        >
          {isEn ? "Search" : "Rechercher"}
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Facets sidebar */}
        <div className="card lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isEn ? "Filter by type" : "Filtrer par type"}
            </h3>
            {activeTypes.length > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-3 w-3" />
                {isEn ? "Clear" : "Effacer"}
              </button>
            )}
          </div>
          <div className="space-y-1">
            {facetCounts.map(({ type, count, meta }) => {
              const Icon = meta.icon;
              const isActive = activeTypes.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400"
                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  <div
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                  </div>
                  <span className="flex-1">{isEn ? meta.label_en : meta.label_fr}</span>
                  <span className="font-mono text-xs text-slate-400">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-3">
          {/* Results header */}
          {queryParam && (
            <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isEn ? "Searching..." : "Recherche..."}
                  </span>
                ) : (
                  <>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{total}</span>{" "}
                    {isEn ? "results for" : "résultats pour"}{" "}
                    <span className="font-medium text-slate-700 dark:text-slate-200">"{queryParam}"</span>
                  </>
                )}
              </span>
              {activeTypes.length > 0 && (
                <span className="text-xs">
                  {isEn ? "Filtered:" : "Filtrés :"}{" "}
                  {activeTypes.map((t) => (isEn ? TYPE_META[t]?.label_en : TYPE_META[t]?.label_fr) || t).join(", ")}
                </span>
              )}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && queryParam && results.length === 0 && (
            <div className="card flex flex-col items-center py-12 text-center">
              <Search className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isEn ? "No results found" : "Aucun résultat trouvé"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {isEn
                  ? "Try a different query or remove filters"
                  : "Essayez une autre requête ou supprimez les filtres"}
              </p>
            </div>
          )}

          {/* No query state */}
          {!queryParam && (
            <div className="card flex flex-col items-center py-12 text-center">
              <Search className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isEn
                  ? "Search across the entire 6D knowledge base"
                  : "Recherchez dans toute la base de connaissances 6D"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {isEn ? "5,167 documents across 7 indexes" : "5 167 documents dans 7 index"}
              </p>
            </div>
          )}

          {/* Result cards */}
          {results.map((result) => {
            const meta = TYPE_META[result.type] || TYPE_META.phase;
            const Icon = meta.icon;
            return (
              <Link
                key={`${result.type}-${result.id}`}
                to={`/knowledge?highlight=${result.type}&code=${result.code}`}
                className="card group flex items-start gap-3 transition-colors hover:border-primary-200 dark:hover:border-primary-500/30"
              >
                <div
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${meta.color}15` }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-medium text-slate-900 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                      {result.titre}
                    </h3>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                    >
                      {isEn ? meta.label_en : meta.label_fr}
                    </span>
                  </div>
                  {result.code && (
                    <p className="mt-0.5 font-mono text-xs text-slate-400 dark:text-slate-500">
                      {result.code}
                    </p>
                  )}
                  {result.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {result.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    const params: Record<string, string> = { q: queryParam, page: String(p) };
                    if (activeTypes.length > 0) params.types = activeTypes.join(",");
                    setSearchParams(params);
                  }}
                  className={`h-8 w-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-primary-500 text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
