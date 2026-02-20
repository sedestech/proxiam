import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  Workflow,
  FileText,
  AlertTriangle,
  Package,
  Wrench,
  Radar,
  Users,
} from "lucide-react";
import api from "../../lib/api";

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

export default function SearchBar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setTotal(0);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get<SearchResponse>("/api/search", {
          params: { q: query, limit: 8 },
        });
        setResults(res.data.results);
        setTotal(res.data.total);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch {
        setResults([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function navigateToResult(result: SearchResult) {
    setIsOpen(false);
    setQuery("");
    // Navigate to knowledge graph with the entity type
    navigate(`/knowledge?highlight=${result.type}&code=${result.code}`);
  }

  function clear() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  const isEn = i18n.language === "en";

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={t("common.search")}
        className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:ring-1 focus:ring-primary-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:bg-slate-700"
      />
      {query && (
        <button
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Results dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
          {isLoading && (
            <div className="px-4 py-3 text-center text-sm text-slate-400">
              {t("common.loading")}
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="px-4 py-3 text-center text-sm text-slate-400">
              {t("common.noData")}
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <>
              <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {total} {isEn ? "results" : "résultats"}
              </div>
              {results.map((result, i) => {
                const meta = TYPE_META[result.type] || TYPE_META.phase;
                const Icon = meta.icon;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => navigateToResult(result)}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors ${
                      i === selectedIndex
                        ? "bg-primary-50 dark:bg-primary-500/10"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${meta.color}15` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {result.titre}
                        </span>
                        <span
                          className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${meta.color}15`,
                            color: meta.color,
                          }}
                        >
                          {isEn ? meta.label_en : meta.label_fr}
                        </span>
                      </div>
                      {result.code && (
                        <p className="truncate text-xs font-mono text-slate-400 dark:text-slate-500">
                          {result.code}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
              {total > results.length && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-center gap-1 border-t border-slate-100 px-3 py-2.5 text-xs font-medium text-primary-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  {isEn ? `See all ${total} results` : `Voir les ${total} résultats`}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
