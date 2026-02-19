import { Box } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Viewer3D() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("nav.viewer3d")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Terrain 3D, actifs ENR, simulation ombrage
        </p>
      </div>

      {/* 3D viewer placeholder — React Three Fiber + Deck.gl in Sprint 3+ */}
      <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="text-center">
          <Box className="mx-auto h-16 w-16 text-slate-300" />
          <p className="mt-4 text-lg font-medium text-slate-500">
            Visualisation 3D
          </p>
          <p className="mt-1 text-sm text-slate-400">
            React Three Fiber + Deck.gl — Digital Twin progressif
          </p>
          <div className="mx-auto mt-4 max-w-xs space-y-1 text-xs text-slate-400">
            <p>Terrain MNT (Modele Numerique de Terrain)</p>
            <p>Panneaux solaires / Eoliennes en 3D</p>
            <p>Simulation d'ombrage</p>
            <p>Vue immersive parc ENR</p>
          </div>
        </div>
      </div>
    </div>
  );
}
