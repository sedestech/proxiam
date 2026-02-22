import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers, Eye, EyeOff, Trash2, Plus, ChevronRight, ChevronLeft } from "lucide-react";
import api from "../../lib/api";

interface LayerItem {
  id: string;
  name: string;
  description: string | null;
  layer_type: string;
  source_url: string | null;
  feature_count: number;
  style: Record<string, unknown> | null;
  visible: number;
  is_mine: boolean;
}

interface CatalogEntry {
  name: string;
  url: string;
  type: string;
  category: string;
}

interface LayerPanelProps {
  visibleLayers: Set<string>;
  onToggle: (layerId: string) => void;
}

export default function LayerPanel({ visibleLayers, onToggle }: LayerPanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: layers = [] } = useQuery<LayerItem[]>({
    queryKey: ["layers"],
    queryFn: () => api.get("/layers").then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: catalog = [] } = useQuery<CatalogEntry[]>({
    queryKey: ["layers-catalog"],
    queryFn: () => api.get("/layers/catalog").then((r) => r.data),
    staleTime: 300_000,
  });

  const addWms = useMutation({
    mutationFn: (entry: CatalogEntry) =>
      api.post(`/layers/wms?name=${encodeURIComponent(entry.name)}&url=${encodeURIComponent(entry.url)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["layers"] }),
  });

  const deleteLayer = useMutation({
    mutationFn: (id: string) => api.delete(`/layers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["layers"] }),
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-20 z-30 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800 min-h-[44px]"
        title={t("layers.myLayers")}
      >
        <Layers className="h-5 w-5 text-indigo-500" />
        <span className="hidden text-sm font-medium md:inline">{t("layers.myLayers")}</span>
        <ChevronLeft className="h-4 w-4 text-slate-400" />
      </button>
    );
  }

  const existingNames = new Set(layers.map((l) => l.name));

  return (
    <div className="fixed right-0 top-16 z-30 flex max-h-[calc(100vh-5rem)] w-80 flex-col rounded-l-xl bg-white/95 shadow-lg backdrop-blur-sm dark:bg-slate-800/95">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold">{t("layers.myLayers")}</h3>
        </div>
        <button onClick={() => setOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* User layers */}
        {layers.length > 0 && (
          <div className="border-b p-3">
            {layers.map((layer) => (
              <div key={layer.id} className="mb-2 flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-700">
                <button
                  onClick={() => onToggle(layer.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  {visibleLayers.has(layer.id) ? (
                    <Eye className="h-4 w-4 text-indigo-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{layer.name}</p>
                  <p className="text-xs text-slate-500">
                    {layer.layer_type} · {layer.feature_count} {t("layers.features")}
                  </p>
                </div>
                {layer.is_mine && (
                  <button
                    onClick={() => deleteLayer.mutate(layer.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Catalog */}
        <div className="p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-500">{t("layers.catalog")}</h4>
          {catalog.map((entry, idx) => (
            <div key={idx} className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-700">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{entry.name}</p>
                <p className="text-xs text-slate-500">{entry.category}</p>
              </div>
              <button
                onClick={() => addWms.mutate(entry)}
                disabled={existingNames.has(entry.name)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-indigo-500 hover:text-indigo-700 disabled:text-slate-300"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
