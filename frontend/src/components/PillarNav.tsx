import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Network, Box } from "lucide-react";

// ─── Types ───

interface PillarDef {
  path: string;
  labelKey: string;
  icon: React.ElementType;
}

// ─── Constants ───

const PILLARS: PillarDef[] = [
  { path: "/map", labelKey: "pillar.map", icon: MapPin },
  { path: "/knowledge", labelKey: "pillar.knowledge", icon: Network },
  { path: "/3d", labelKey: "pillar.viewer3d", icon: Box },
];

const PILLAR_PATHS = new Set(PILLARS.map((p) => p.path));

// ─── Helpers ───

function buildTargetUrl(targetPath: string, currentSearch: string): string {
  const currentParams = new URLSearchParams(currentSearch);
  const fromPillar = currentParams.get("from") || "";
  const targetParams = new URLSearchParams();

  // Carry forward entity context if present
  const entity = currentParams.get("entity");
  const id = currentParams.get("id");
  if (entity) targetParams.set("entity", entity);
  if (id) targetParams.set("id", id);

  // Set the origin pillar
  const currentPillar = fromPillar || "unknown";
  targetParams.set("from", currentPillar);

  const qs = targetParams.toString();
  return qs ? `${targetPath}?${qs}` : targetPath;
}

function getCurrentPillarName(pathname: string): string {
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/knowledge")) return "knowledge";
  if (pathname.startsWith("/3d")) return "3d";
  return "";
}

// ─── Component ───

export default function PillarNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  // Only render on pillar pages
  if (!PILLAR_PATHS.has(currentPath)) return null;

  const currentPillarName = getCurrentPillarName(currentPath);
  const otherPillars = PILLARS.filter((p) => p.path !== currentPath);

  function handleNavigate(targetPath: string): void {
    const params = new URLSearchParams(location.search);
    params.set("from", currentPillarName);
    const qs = params.toString();
    navigate(qs ? `${targetPath}?${qs}` : targetPath);
  }

  return (
    <nav
      className="fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm md:bottom-6"
      aria-label={t("pillar.viewOnMap")}
    >
      {otherPillars.map((pillar) => {
        const Icon = pillar.icon;
        return (
          <button
            key={pillar.path}
            onClick={() => handleNavigate(pillar.path)}
            className="flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
            title={t(pillar.labelKey)}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t(pillar.labelKey)}</span>
          </button>
        );
      })}
    </nav>
  );
}

// Export helpers for testing
export { buildTargetUrl, getCurrentPillarName, PILLAR_PATHS };
