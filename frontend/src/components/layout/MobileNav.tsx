import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  MapPin,
  FolderKanban,
  Radar,
  MoreHorizontal,
  Brain,
  Box,
  Workflow,
  Settings,
  Target,
  Shield,
  X,
} from "lucide-react";

const mainItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/map", icon: MapPin, labelKey: "nav.map" },
  { to: "/projects", icon: FolderKanban, labelKey: "nav.projects" },
  { to: "/veille", icon: Radar, labelKey: "nav.veille" },
];

const moreItems = [
  { to: "/knowledge", icon: Brain, labelKey: "nav.knowledge" },
  { to: "/3d", icon: Box, labelKey: "nav.viewer3d" },
  { to: "/canvas", icon: Workflow, labelKey: "nav.canvas" },
  { to: "/scoring", icon: Target, labelKey: "nav.scoring" },
  { to: "/predictions", icon: Brain, labelKey: "nav.predictions" },
  { to: "/admin", icon: Shield, labelKey: "nav.admin" },
  { to: "/settings", icon: Settings, labelKey: "nav.settings" },
];

export default function MobileNav() {
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setShowMore(false)}>
          <div
            className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+56px)] left-2 right-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-medium text-slate-500">{t("nav.morePages", "Plus")}</span>
              <button onClick={() => setShowMore(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {moreItems.map(({ to, icon: Icon, labelKey }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-[11px] font-medium transition-colors ${
                      isActive
                        ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
                        : "text-slate-500 hover:bg-slate-50 dark:text-slate-400"
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{t(labelKey)}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="mobile-nav safe-area-inset-bottom">
        {mainItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors min-w-[56px] ${
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
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors min-w-[56px] ${
            showMore ? "text-primary-600" : "text-slate-400"
          }`}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>{t("nav.more", "Plus")}</span>
        </button>
      </nav>
    </>
  );
}
