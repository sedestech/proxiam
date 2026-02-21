import { Globe, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/appStore";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";
import AlertBell from "../AlertBell";

export default function Header() {
  const { i18n } = useTranslation();
  const { theme, setTheme } = useAppStore();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr");
  };

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800 sm:px-4 md:px-6">
      {/* Search */}
      <SearchBar />

      {/* Actions */}
      <div className="flex items-center gap-1 ml-2 sm:gap-2 sm:ml-4">
        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          title={`Theme: ${theme}`}
        >
          {theme === "dark" ? (
            <Moon className="h-4.5 w-4.5" />
          ) : (
            <Sun className="h-4.5 w-4.5" />
          )}
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex h-10 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 active:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 sm:gap-1.5 sm:px-2.5"
          title="Toggle language"
        >
          <Globe className="h-4 w-4" />
          <span className="uppercase">{i18n.language}</span>
        </button>

        {/* Veille Alerts */}
        <AlertBell />

        {/* Notifications — hide on very small screens to save space */}
        <div className="hidden xs:block sm:block">
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
}
