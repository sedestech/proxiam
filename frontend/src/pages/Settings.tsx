import { useState } from "react";
import { Globe, Moon, Download, Upload, Key, CheckCircle, XCircle, Database, RefreshCw, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../stores/appStore";
import api from "../lib/api";

interface AIStatus {
  available: boolean;
  mode: string;
  message: string;
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, setTheme } = useAppStore();
  const [reindexing, setReindexing] = useState(false);
  const [reindexMsg, setReindexMsg] = useState("");

  const { data: aiStatus } = useQuery<AIStatus>({
    queryKey: ["ai-status"],
    queryFn: async () => {
      const res = await api.get("/api/ai/status");
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  const { data: dbStats } = useQuery<Record<string, number>>({
    queryKey: ["db-stats-settings"],
    queryFn: async () => {
      const res = await api.get("/api/stats");
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {t("nav.settings")}
      </h1>

      {/* Language */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("settings.language")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.languageDesc")}</p>
          </div>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 sm:min-h-0"
          >
            <option value="fr">Francais</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* Theme */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("settings.theme")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("settings.themeDesc")}</p>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 sm:min-h-0"
          >
            <option value="light">{t("settings.light")}</option>
            <option value="dark">{t("settings.dark")}</option>
            <option value="system">{t("settings.system")}</option>
          </select>
        </div>
      </div>

      {/* AI Status */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("settings.aiTitle")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {aiStatus?.message || t("settings.aiChecking")}
            </p>
          </div>
          {aiStatus && (
            <div className="flex items-center gap-2">
              {aiStatus.available ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-500" />
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                aiStatus.available
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
              }`}>
                {aiStatus.mode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Database stats */}
      <div className="card">
        <div className="flex items-center gap-3 mb-3">
          <Database className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900 dark:text-white">{t("settings.database")}</h3>
        </div>
        {dbStats && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(dbStats).map(([key, count]) => (
              <div key={key} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-700">
                <p className="text-lg font-bold text-slate-900 dark:text-white">{count}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{key}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search reindex */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">{t("settings.search")}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {reindexMsg || t("settings.searchDesc")}
            </p>
          </div>
          <button
            disabled={reindexing}
            onClick={async () => {
              setReindexing(true);
              setReindexMsg(t("settings.reindexing"));
              try {
                const res = await api.post("/api/search/reindex");
                setReindexMsg(`${t("settings.reindexed")} : ${res.data.indexed || 0} ${t("settings.reindexDocs")}`);
              } catch {
                setReindexMsg(t("settings.reindexError"));
              } finally {
                setReindexing(false);
              }
            }}
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:min-h-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reindexing ? "animate-spin" : ""}`} />
            {t("settings.reindex")}
          </button>
        </div>
      </div>

      {/* Import/Export */}
      <div className="card space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Download className="h-5 w-5 text-slate-400" />
          {t("settings.importExport")}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/projects")}
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:min-h-0"
          >
            <Upload className="h-4 w-4" />
            {t("settings.importCsv")}
          </button>
          <a
            href={`${api.defaults.baseURL || ""}/api/projets/export/csv`}
            download
            className="flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:min-h-0"
          >
            <Download className="h-4 w-4" />
            {t("settings.exportCsv")}
          </a>
        </div>
      </div>
    </div>
  );
}
