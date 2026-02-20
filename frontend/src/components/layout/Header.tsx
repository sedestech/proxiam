import { Globe, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../stores/appStore";
import SearchBar from "./SearchBar";
import NotificationDropdown from "./NotificationDropdown";

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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-800 md:px-6">
      {/* Search */}
      <SearchBar />

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Theme toggle */}
        <button
          onClick={cycleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          title={`Theme: ${theme}`}
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </button>

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          title="Toggle language"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="uppercase">{i18n.language}</span>
        </button>

        {/* Notifications */}
        <NotificationDropdown />
      </div>
    </header>
  );
}
