import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  MapPin,
  Brain,
  Box,
  Workflow,
  FolderKanban,
  Settings,
  Shield,
  Radar,
  Zap,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/map", icon: MapPin, labelKey: "nav.map" },
  { to: "/knowledge", icon: Brain, labelKey: "nav.knowledge" },
  { to: "/3d", icon: Box, labelKey: "nav.viewer3d" },
  { to: "/canvas", icon: Workflow, labelKey: "nav.canvas" },
  { to: "/projects", icon: FolderKanban, labelKey: "nav.projects" },
  { to: "/veille", icon: Radar, labelKey: "nav.veille" },
  { to: "/admin", icon: Shield, labelKey: "nav.admin" },
  { to: "/settings", icon: Settings, labelKey: "nav.settings" },
];

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Proxiam
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
            OS Energie
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* Status bar */}
      <div className="border-t border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>v0.1.0 — Sprint 0</span>
        </div>
      </div>
    </aside>
  );
}
