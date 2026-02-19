import { MapPin, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Map() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col animate-fade-in">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {t("nav.map")}
        </h1>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            <Layers className="h-4 w-4" />
            Couches
          </button>
        </div>
      </div>

      {/* Map placeholder — MapLibre GL integration in Sprint 2 */}
      <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-100/50">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-lg font-medium text-slate-500">
            Cartographie SIG
          </p>
          <p className="mt-1 text-sm text-slate-400">
            MapLibre GL + PostGIS + MVT Tiles — Sprint 2
          </p>
          <p className="mt-3 text-xs text-slate-400">
            4 847 postes sources | Projets ENR | Contraintes environnementales
          </p>
        </div>
      </div>
    </div>
  );
}
