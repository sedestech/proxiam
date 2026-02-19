import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  MapPin,
  Brain,
  FolderKanban,
  Settings,
} from "lucide-react";

const mobileItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/map", icon: MapPin, labelKey: "nav.map" },
  { to: "/knowledge", icon: Brain, labelKey: "nav.knowledge" },
  { to: "/projects", icon: FolderKanban, labelKey: "nav.projects" },
  { to: "/settings", icon: Settings, labelKey: "nav.settings" },
];

export default function MobileNav() {
  const { t } = useTranslation();

  return (
    <nav className="mobile-nav safe-area-inset-bottom">
      {mobileItems.map(({ to, icon: Icon, labelKey }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium transition-colors ${
              isActive
                ? "text-primary-600"
                : "text-slate-400"
            }`
          }
        >
          <Icon className="h-5 w-5" />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
