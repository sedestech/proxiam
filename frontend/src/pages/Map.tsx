import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Layers, Loader2, AlertCircle, Eye, EyeOff, MapPin, Search, Crosshair, X, SlidersHorizontal } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { usePosteSources } from "../hooks/usePosteSources";
import type { PosteSourceGeoJSON } from "../hooks/usePosteSources";
import api from "../lib/api";

// ─── Constants ───

const CARTO_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const FRANCE_CENTER: [number, number] = [2.5, 46.5];
const FRANCE_ZOOM = 5.5;

const GESTIONNAIRE_COLORS: Record<string, string> = {
  RTE: "#3b82f6",
  Enedis: "#10b981",
  ELD: "#f59e0b",
};
const DEFAULT_COLOR = "#6366f1";

const SOURCE_ID = "postes-sources";
const LAYER_ID = "postes-sources-circles";

const EMPTY_FC: PosteSourceGeoJSON = { type: "FeatureCollection", features: [] };

// ─── Helpers ───

function filterGeoJSON(
  geojson: PosteSourceGeoJSON,
  visibleGestionnaires: Set<string>,
  searchQuery: string,
): PosteSourceGeoJSON {
  const q = searchQuery.toLowerCase().trim();
  const filtered = geojson.features.filter((f) => {
    const g = normalizeGestionnaire(f.properties.gestionnaire);
    if (!visibleGestionnaires.has(g)) return false;
    if (q && !f.properties.nom?.toLowerCase().includes(q)) return false;
    return true;
  });
  return { type: "FeatureCollection", features: filtered };
}

interface NearestResult {
  id: number;
  nom: string;
  gestionnaire: string;
  tension_kv: number;
  puissance_mw: number;
  capacite_disponible_mw: number;
  lon: number;
  lat: number;
  distance_m: number;
}

function normalizeGestionnaire(value: string | null): string {
  if (!value) return "Autre";
  const upper = value.toUpperCase().trim();
  if (upper === "RTE") return "RTE";
  if (upper === "ENEDIS") return "Enedis";
  if (upper.includes("ELD") || upper.includes("LOCAL")) return "ELD";
  return "Autre";
}

// ─── Map initialization hook ───
// Uses a ref guard to prevent React StrictMode from creating/destroying the map twice.
// In StrictMode, the effect runs mount→cleanup→mount. Without a guard, the first map's
// style fetch is aborted during cleanup, and the second map may get a stale WebGL context.

function useMapLibre(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const initRef = useRef(false);
  const [ready, setReady] = useState(false);
  const sourceAddedRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: CARTO_STYLE,
      center: FRANCE_CENTER,
      zoom: FRANCE_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 150, unit: "metric" }),
      "bottom-left",
    );

    map.on("error", (e) => {
      console.error("[MapLibre]", e.error?.message || e.error || e);
    });

    map.on("load", () => {
      if (sourceAddedRef.current) return;
      sourceAddedRef.current = true;

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: EMPTY_FC as GeoJSON.GeoJSON,
      });

      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          "circle-color": [
            "match",
            ["coalesce", ["get", "gestionnaire"], ""],
            "RTE", GESTIONNAIRE_COLORS.RTE,
            "Enedis", GESTIONNAIRE_COLORS.Enedis,
            "ELD", GESTIONNAIRE_COLORS.ELD,
            DEFAULT_COLOR,
          ],
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            4, 2,
            7, 4,
            10, 7,
            13, 12,
          ],
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.85,
        },
      });

      // Click popup
      map.on("click", LAYER_ID, (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const props = feature.properties;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        const tensionDisplay = props.tension_kv != null ? `${props.tension_kv} kV` : "—";
        const puissanceDisplay = props.puissance_mw != null ? `${props.puissance_mw} MW` : "—";
        const capaciteDisplay = props.capacite_disponible_mw != null ? `${props.capacite_disponible_mw} MW` : "—";

        new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: "280px", offset: 12 })
          .setLngLat(coordinates)
          .setHTML(`
            <div style="font-family: Inter, sans-serif; min-width: 200px;">
              <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1e293b;">
                ${props.nom || "Poste source"}
              </div>
              <table style="font-size: 12px; color: #475569; border-spacing: 4px 2px;">
                <tr><td style="font-weight:500;padding-right:12px">Gestionnaire</td><td>${props.gestionnaire || "—"}</td></tr>
                <tr><td style="font-weight:500;padding-right:12px">Tension</td><td>${tensionDisplay}</td></tr>
                <tr><td style="font-weight:500;padding-right:12px">Puissance</td><td>${puissanceDisplay}</td></tr>
                <tr><td style="font-weight:500;padding-right:12px">Capacité</td><td>${capaciteDisplay}</td></tr>
              </table>
            </div>
          `)
          .addTo(map);
      });

      map.on("mouseenter", LAYER_ID, () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", LAYER_ID, () => { map.getCanvas().style.cursor = ""; });

      setReady(true);
    });

    mapRef.current = map;

    // Intentionally NOT returning a cleanup function.
    // The map persists across StrictMode's synthetic unmount cycle.
    // Real cleanup happens when the component truly unmounts (route change),
    // which removes the container from the DOM and GC cleans up the map.
  }, [containerRef]);

  return { mapRef, ready, sourceAddedRef };
}

// ─── Component ───

export default function Map() {
  const { t } = useTranslation();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { mapRef, ready, sourceAddedRef } = useMapLibre(mapContainerRef);

  const [layerVisible, setLayerVisible] = useState(true);
  const [visibleGestionnaires, setVisibleGestionnaires] = useState<Set<string>>(
    new Set(["RTE", "Enedis", "ELD", "Autre"]),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [nearestMode, setNearestMode] = useState(false);
  const [nearestResults, setNearestResults] = useState<NearestResult[]>([]);
  const [nearestLoading, setNearestLoading] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const nearestMarkerRef = useRef<maplibregl.Marker | null>(null);

  const { data: geojson, isLoading, isError } = usePosteSources();

  const filteredGeoJSON = useMemo(() => {
    if (!geojson) return null;
    return filterGeoJSON(geojson, visibleGestionnaires, searchQuery);
  }, [geojson, visibleGestionnaires, searchQuery]);

  const displayedCount = filteredGeoJSON?.features.length ?? 0;

  // Update source data when filtered data or map readiness changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceAddedRef.current) return;

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    source.setData((filteredGeoJSON ?? EMPTY_FC) as GeoJSON.GeoJSON);
  }, [filteredGeoJSON, ready, mapRef, sourceAddedRef]);

  // Toggle layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !sourceAddedRef.current) return;

    const layer = map.getLayer(LAYER_ID);
    if (layer) {
      map.setLayoutProperty(LAYER_ID, "visibility", layerVisible ? "visible" : "none");
    }
  }, [layerVisible, ready, mapRef, sourceAddedRef]);

  // Nearest poste click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    if (!nearestMode) {
      map.getCanvas().style.cursor = "";
      return;
    }

    map.getCanvas().style.cursor = "crosshair";

    const handleClick = async (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      setNearestLoading(true);
      try {
        const { data } = await api.get<NearestResult[]>("/postes-sources/nearest", {
          params: { lon: lng, lat, limit: 5 },
        });
        setNearestResults(data);

        // Place marker at click location
        if (nearestMarkerRef.current) nearestMarkerRef.current.remove();
        nearestMarkerRef.current = new maplibregl.Marker({ color: "#ef4444" })
          .setLngLat([lng, lat])
          .addTo(map);
      } catch {
        setNearestResults([]);
      } finally {
        setNearestLoading(false);
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [nearestMode, ready, mapRef]);

  const flyToPoste = useCallback((lon: number, lat: number) => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [lon, lat], zoom: 12, duration: 1500 });
  }, [mapRef]);

  const clearNearest = useCallback(() => {
    setNearestMode(false);
    setNearestResults([]);
    if (nearestMarkerRef.current) {
      nearestMarkerRef.current.remove();
      nearestMarkerRef.current = null;
    }
  }, []);

  const toggleGestionnaire = useCallback((gestionnaire: string) => {
    setVisibleGestionnaires((prev) => {
      const next = new Set(prev);
      if (next.has(gestionnaire)) {
        next.delete(gestionnaire);
      } else {
        next.add(gestionnaire);
      }
      return next;
    });
  }, []);

  return (
    <div className="flex h-full animate-fade-in">
      {/* ─── Left Sidebar Panel ─── */}
      <div className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-100 p-4">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            {t("map.title")}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">{t("map.subtitle")}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* ─── Search ─── */}
          <div className="mb-5">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("map.search")}
            </span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("map.searchPlaceholder")}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ─── Layer Toggle ─── */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t("map.layers")}
              </span>
            </div>
            <button
              onClick={() => setLayerVisible(!layerVisible)}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                layerVisible
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {layerVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <MapPin className="h-4 w-4" />
              {t("map.postesSources")}
            </button>
          </div>

          {/* ─── Gestionnaire Filters ─── */}
          <div className="mb-5">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("map.filterByGestionnaire")}
            </span>
            <div className="space-y-1.5">
              {(["RTE", "Enedis", "ELD", "Autre"] as const).map((g) => {
                const color = GESTIONNAIRE_COLORS[g] || DEFAULT_COLOR;
                const checked = visibleGestionnaires.has(g);
                const label = g === "Autre" ? t("map.other") : t(`map.${g.toLowerCase()}`);
                return (
                  <label
                    key={g}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleGestionnaire(g)}
                      className="h-3.5 w-3.5 rounded border-slate-300 accent-indigo-600"
                    />
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* ─── Nearest Poste ─── */}
          <div className="mb-5">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("map.nearestPoste")}
            </span>
            <button
              onClick={() => nearestMode ? clearNearest() : setNearestMode(true)}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                nearestMode
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Crosshair className="h-4 w-4" />
              {nearestMode ? t("map.nearestCancel") : t("map.nearestClick")}
            </button>

            {nearestLoading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t("map.loadingData")}
              </div>
            )}

            {nearestResults.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {nearestResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => flyToPoste(r.lon, r.lat)}
                    className="flex w-full flex-col rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2 text-left transition-colors hover:bg-indigo-50 hover:border-indigo-200"
                  >
                    <span className="text-xs font-medium text-slate-800 truncate">{r.nom}</span>
                    <span className="text-[10px] text-slate-500">
                      {r.gestionnaire} · {r.tension_kv} kV · {(r.distance_m / 1000).toFixed(1)} km
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Stats ─── */}
          <div>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("map.stats")}
            </span>
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{t("map.totalPostes")}</span>
                <span className="font-semibold text-slate-900">
                  {isLoading ? "..." : displayedCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Map Container ─── */}
      <div className="relative flex-1">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-md">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="text-sm font-medium text-slate-600">
                {t("map.loadingData")}
              </span>
            </div>
          </div>
        )}

        {isError && (
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 shadow-sm">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              {t("map.errorLoading")}
            </span>
          </div>
        )}

        {/* Mobile: stats badge */}
        <div className="absolute bottom-20 left-4 z-10 flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm md:hidden">
          <Layers className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-xs font-medium text-slate-600">
            {displayedCount.toLocaleString()} {t("map.postesSources").toLowerCase()}
          </span>
        </div>

        {/* Mobile: filter FAB */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="absolute bottom-20 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg active:bg-primary-600 md:hidden"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>

        {/* Mobile: filter bottom sheet */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl safe-area-inset-bottom dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{t("map.layers")}</h3>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("map.searchPlaceholder")}
                    className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  />
                </div>
              </div>

              {/* Layer toggle */}
              <button
                onClick={() => setLayerVisible(!layerVisible)}
                className={`mb-4 flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  layerVisible
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {layerVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <MapPin className="h-4 w-4" />
                {t("map.postesSources")}
              </button>

              {/* Gestionnaire filters */}
              <div className="mb-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t("map.filterByGestionnaire")}
                </span>
                <div className="space-y-1">
                  {(["RTE", "Enedis", "ELD", "Autre"] as const).map((g) => {
                    const color = GESTIONNAIRE_COLORS[g] || DEFAULT_COLOR;
                    const checked = visibleGestionnaires.has(g);
                    const label = g === "Autre" ? t("map.other") : t(`map.${g.toLowerCase()}`);
                    return (
                      <label
                        key={g}
                        className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleGestionnaire(g)}
                          className="h-5 w-5 rounded border-slate-300 accent-indigo-600"
                        />
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        {label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Nearest poste */}
              <button
                onClick={() => {
                  nearestMode ? clearNearest() : setNearestMode(true);
                  setMobileFiltersOpen(false);
                }}
                className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  nearestMode
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Crosshair className="h-4 w-4" />
                {nearestMode ? t("map.nearestCancel") : t("map.nearestClick")}
              </button>
            </div>
          </div>
        )}

        <div ref={mapContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
