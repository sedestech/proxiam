import { describe, it, expect } from "vitest";

// Test the pure helper functions from the Map component logic.
// (The actual Map component requires MapLibre GL which needs WebGL/canvas — tested via Playwright.)

// ─── normalizeGestionnaire logic ───

function normalizeGestionnaire(value: string | null): string {
  if (!value) return "Autre";
  const upper = value.toUpperCase().trim();
  if (upper === "RTE") return "RTE";
  if (upper === "ENEDIS") return "Enedis";
  if (upper.includes("ELD") || upper.includes("LOCAL")) return "ELD";
  return "Autre";
}

describe("normalizeGestionnaire", () => {
  it("normalizes RTE values", () => {
    expect(normalizeGestionnaire("RTE")).toBe("RTE");
    expect(normalizeGestionnaire("rte")).toBe("RTE");
    expect(normalizeGestionnaire("  RTE  ")).toBe("RTE");
  });

  it("normalizes Enedis values", () => {
    expect(normalizeGestionnaire("Enedis")).toBe("Enedis");
    expect(normalizeGestionnaire("ENEDIS")).toBe("Enedis");
    expect(normalizeGestionnaire("enedis")).toBe("Enedis");
  });

  it("normalizes ELD values", () => {
    expect(normalizeGestionnaire("ELD")).toBe("ELD");
    expect(normalizeGestionnaire("ELD Normandie")).toBe("ELD");
    expect(normalizeGestionnaire("Local Distribution")).toBe("ELD");
  });

  it("returns Autre for null/unknown", () => {
    expect(normalizeGestionnaire(null)).toBe("Autre");
    expect(normalizeGestionnaire("")).toBe("Autre");
    expect(normalizeGestionnaire("SomeUnknown")).toBe("Autre");
  });
});

// ─── filterGeoJSON logic ───

interface Feature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: { nom: string; gestionnaire: string };
}

interface FeatureCollection {
  type: "FeatureCollection";
  features: Feature[];
}

function filterGeoJSON(
  geojson: FeatureCollection,
  visibleGestionnaires: Set<string>,
  searchQuery: string,
): FeatureCollection {
  const q = searchQuery.toLowerCase().trim();
  const filtered = geojson.features.filter((f) => {
    const g = normalizeGestionnaire(f.properties.gestionnaire);
    if (!visibleGestionnaires.has(g)) return false;
    if (q && !f.properties.nom?.toLowerCase().includes(q)) return false;
    return true;
  });
  return { type: "FeatureCollection", features: filtered };
}

const SAMPLE_DATA: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", geometry: { type: "Point", coordinates: [2.35, 48.85] }, properties: { nom: "Poste Paris RTE", gestionnaire: "RTE" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [3.06, 50.63] }, properties: { nom: "Poste Lille Enedis", gestionnaire: "Enedis" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [1.44, 43.60] }, properties: { nom: "ELD Toulouse", gestionnaire: "ELD" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [5.37, 43.30] }, properties: { nom: "Poste Marseille Enedis", gestionnaire: "Enedis" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [7.27, 43.71] }, properties: { nom: "Transformateur Nice", gestionnaire: "RTE" } },
  ],
};

describe("filterGeoJSON", () => {
  it("returns all features when all gestionnaires visible and no search", () => {
    const result = filterGeoJSON(SAMPLE_DATA, new Set(["RTE", "Enedis", "ELD", "Autre"]), "");
    expect(result.features).toHaveLength(5);
    expect(result.type).toBe("FeatureCollection");
  });

  it("filters by gestionnaire", () => {
    const result = filterGeoJSON(SAMPLE_DATA, new Set(["RTE"]), "");
    expect(result.features).toHaveLength(2);
    expect(result.features.every(f => f.properties.gestionnaire === "RTE")).toBe(true);
  });

  it("filters by multiple gestionnaires", () => {
    const result = filterGeoJSON(SAMPLE_DATA, new Set(["Enedis", "ELD"]), "");
    expect(result.features).toHaveLength(3);
  });

  it("filters by search query", () => {
    const result = filterGeoJSON(SAMPLE_DATA, new Set(["RTE", "Enedis", "ELD", "Autre"]), "Poste");
    expect(result.features).toHaveLength(3); // "Poste Paris RTE", "Poste Lille Enedis", "Poste Marseille Enedis"
  });

  it("combines gestionnaire and search filters", () => {
    const result = filterGeoJSON(SAMPLE_DATA, new Set(["Enedis"]), "Poste");
    expect(result.features).toHaveLength(2); // "Poste Lille Enedis", "Poste Marseille Enedis"
  });

  it("search is case-insensitive", () => {
    const result = filterGeoJSON(SAMPLE_DATA, new Set(["RTE", "Enedis", "ELD", "Autre"]), "TRANSFORMATEUR");
    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties.nom).toBe("Transformateur Nice");
  });

  it("returns empty for no matching gestionnaire", () => {
    const result = filterGeoJSON(SAMPLE_DATA, new Set([]), "");
    expect(result.features).toHaveLength(0);
  });

  it("returns empty for no matching search", () => {
    const result = filterGeoJSON(SAMPLE_DATA, new Set(["RTE", "Enedis", "ELD", "Autre"]), "nonexistent");
    expect(result.features).toHaveLength(0);
  });
});
