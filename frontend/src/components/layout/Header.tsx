import { useTranslation } from "react-i18next";
import { Search, Bell, Globe } from "lucide-react";

export default function Header() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t("common.search")}
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-primary-300 focus:bg-white focus:ring-1 focus:ring-primary-200"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          title="Toggle language"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="uppercase">{i18n.language}</span>
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </button>
      </div>
    </header>
  );
}
