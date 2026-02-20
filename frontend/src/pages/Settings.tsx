import { Globe, Moon, Download, Upload, Key, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "../stores/appStore";
import api from "../lib/api";

interface AIStatus {
  available: boolean;
  mode: string;
  message: string;
}

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useAppStore();

  const { data: aiStatus } = useQuery<AIStatus>({
    queryKey: ["ai-status"],
    queryFn: async () => {
      const res = await api.get("/api/ai/status");
      return res.data;
    },
    staleTime: 60 * 1000,
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
            <h3 className="font-semibold text-slate-900 dark:text-white">Langue / Language</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Interface language</p>
          </div>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
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
            <h3 className="font-semibold text-slate-900 dark:text-white">Theme</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Light / Dark mode</p>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* AI Status */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white">Claude IA</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {aiStatus?.message || "Verification..."}
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

      {/* Import/Export */}
      <div className="card space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <Download className="h-5 w-5 text-slate-400" />
          Import / Export en masse
        </h3>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            <Upload className="h-4 w-4" />
            Importer CSV/JSON
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
            <Download className="h-4 w-4" />
            Exporter tout
          </button>
        </div>
      </div>
    </div>
  );
}
