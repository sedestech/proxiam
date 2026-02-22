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
  Target,
  Zap,
  CreditCard,
} from "lucide-react";

// Conditional Clerk import — works in dev mode without Clerk
let UserButtonComponent: React.ComponentType<{ afterSignOutUrl?: string; appearance?: Record<string, unknown> }> | null = null;
let useUserHook: (() => { user: { publicMetadata?: Record<string, unknown> } | null | undefined; isSignedIn: boolean }) | null = null;

try {
  // Vite will resolve this at build time. If @clerk/clerk-react is not installed, the catch handles it.
  const clerk = await import("@clerk/clerk-react");
  UserButtonComponent = clerk.UserButton;
  useUserHook = clerk.useUser;
} catch {
  // Clerk not available — dev mode without auth
}

const navItems = [
  { to: "/", icon: LayoutDashboard, labelKey: "nav.dashboard" },
  { to: "/map", icon: MapPin, labelKey: "nav.map" },
  { to: "/knowledge", icon: Brain, labelKey: "nav.knowledge" },
  { to: "/3d", icon: Box, labelKey: "nav.viewer3d" },
  { to: "/canvas", icon: Workflow, labelKey: "nav.canvas" },
  { to: "/projects", icon: FolderKanban, labelKey: "nav.projects" },
  { to: "/scoring", icon: Target, labelKey: "nav.scoring" },
  { to: "/veille", icon: Radar, labelKey: "nav.veille" },
  { to: "/billing", icon: CreditCard, labelKey: "nav.billing" },
  { to: "/settings", icon: Settings, labelKey: "nav.settings" },
];

const adminItem = { to: "/admin", icon: Shield, labelKey: "nav.admin" };

export default function Sidebar() {
  const { t } = useTranslation();

  // Check if user is admin
  let isAdmin = true; // Default: show admin in dev mode
  if (useUserHook) {
    try {
      const { user } = useUserHook();
      const tier = user?.publicMetadata?.tier as string | undefined;
      isAdmin = tier === "admin" || tier === undefined; // Show if admin or no metadata set
    } catch {
      isAdmin = true;
    }
  }

  const items = isAdmin ? [...navItems.slice(0, 8), adminItem, ...navItems.slice(8)] : navItems;

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-700">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Proxiam
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            OS Energie
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {items.map(({ to, icon: Icon, labelKey }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              }`
            }
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + Status bar */}
      <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>v2.3.0 — Sprint 22</span>
          </div>
          {UserButtonComponent && (
            <UserButtonComponent
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7",
                },
              }}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
