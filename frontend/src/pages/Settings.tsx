import { Settings as SettingsIcon, Globe, Moon, Download, Upload, Key } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t, i18n } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {t("nav.settings")}
      </h1>

      {/* Language */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-slate-400" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Langue / Language</h3>
            <p className="text-sm text-slate-500">Interface language</p>
          </div>
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
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
            <h3 className="font-semibold text-slate-900">Theme</h3>
            <p className="text-sm text-slate-500">Light / Dark mode</p>
          </div>
          <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Import/Export */}
      <div className="card space-y-3">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <Download className="h-5 w-5 text-slate-400" />
          Import / Export en masse
        </h3>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            Importer CSV/JSON
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Exporter tout
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Key className="h-5 w-5 text-slate-400" />
          <div>
            <h3 className="font-semibold text-slate-900">Cles API</h3>
            <p className="text-sm text-slate-500">
              Anthropic, OpenAI — Configuration backend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
