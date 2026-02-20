import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

// ─── GeoJSON Types ───

export interface PosteSourceProperties {
  id: number;
  nom: string;
  gestionnaire: string | null;
  tension_kv: number | null;
  puissance_mw: number | null;
  capacite_disponible_mw: number | null;
  source_donnees: string | null;
  date_maj: string | null;
}

export interface PosteSourceFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lon, lat]
  };
  properties: PosteSourceProperties;
}

export interface PosteSourceGeoJSON {
  type: "FeatureCollection";
  features: PosteSourceFeature[];
}

// ─── Hook Options ───

export interface UsePosteSourcesOptions {
  gestionnaire?: string;
  tension_min?: number;
  capacite_min?: number;
  enabled?: boolean;
}

// ─── Hook ───

/**
 * React Query hook to fetch postes sources as GeoJSON FeatureCollection.
 * Calls GET /postes-sources/geojson with optional filters.
 */
export function usePosteSources({
  gestionnaire,
  tension_min,
  capacite_min,
  enabled = true,
}: UsePosteSourcesOptions = {}) {
  const queryKey = ["postes-sources-geojson", gestionnaire, tension_min, capacite_min];

  return useQuery<PosteSourceGeoJSON>({
    queryKey,
    queryFn: async () => {
      const params: Record<string, string | number> = {};
      if (gestionnaire) params.gestionnaire = gestionnaire;
      if (tension_min !== undefined) params.tension_min = tension_min;
      if (capacite_min !== undefined) params.capacite_min = capacite_min;

      const res = await api.get("/postes-sources/geojson", { params });
      return res.data;
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes — geospatial data changes infrequently
  });
}
