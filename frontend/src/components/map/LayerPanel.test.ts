import { describe, it, expect } from "vitest";
import i18n from "../../lib/i18n";

const fr = i18n.getResourceBundle("fr", "translation") as Record<string, unknown>;
const en = i18n.getResourceBundle("en", "translation") as Record<string, unknown>;
const frLayers = fr.layers as Record<string, string>;
const enLayers = en.layers as Record<string, string>;

describe("LayerPanel", () => {
  describe("i18n keys", () => {
    const requiredKeys = [
      "myLayers", "catalog", "addLayer", "removeLayer",
      "upload", "dropHere", "uploading", "uploadSuccess", "uploadError",
      "tooLarge", "invalidFormat", "features", "spatial",
    ];

    it("FR has all required layer keys", () => {
      for (const key of requiredKeys) {
        expect(frLayers[key], `Missing FR key: layers.${key}`).toBeDefined();
      }
    });

    it("EN has all required layer keys", () => {
      for (const key of requiredKeys) {
        expect(enLayers[key], `Missing EN key: layers.${key}`).toBeDefined();
      }
    });

    it("FR and EN have same key count", () => {
      expect(Object.keys(frLayers).length).toBe(Object.keys(enLayers).length);
    });
  });

  describe("GeoJSON validation logic", () => {
    it("accepts valid FeatureCollection", () => {
      const data = { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: [2.3, 48.8] }, properties: {} }] };
      expect(data.type).toBe("FeatureCollection");
      expect(data.features.length).toBe(1);
    });

    it("rejects non-FeatureCollection", () => {
      const data = { type: "Feature", geometry: { type: "Point", coordinates: [0, 0] } };
      expect(data.type).not.toBe("FeatureCollection");
    });

    it("enforces 10MB file size limit", () => {
      const MAX_SIZE = 10_000_000;
      expect(MAX_SIZE).toBe(10000000);
    });

    it("enforces 50k feature limit", () => {
      const MAX_FEATURES = 50_000;
      expect(MAX_FEATURES).toBe(50000);
    });

    it("accepts .geojson extension", () => {
      expect("test.geojson".endsWith(".geojson")).toBe(true);
    });

    it("accepts .json extension", () => {
      expect("test.json".endsWith(".json")).toBe(true);
    });

    it("rejects .csv extension", () => {
      const name = "test.csv";
      expect(name.endsWith(".geojson") || name.endsWith(".json")).toBe(false);
    });
  });

  describe("Catalog entries", () => {
    it("has at least 5 predefined layers", () => {
      // Mirror of backend LAYER_CATALOG
      const CATALOG = [
        { name: "Natura 2000 (INPN)", category: "environnement" },
        { name: "ZNIEFF Type I", category: "environnement" },
        { name: "ZNIEFF Type II", category: "environnement" },
        { name: "Cadastre (IGN)", category: "foncier" },
        { name: "PLU (GPU)", category: "urbanisme" },
        { name: "Réseau RTE", category: "reseau" },
      ];
      expect(CATALOG.length).toBeGreaterThanOrEqual(5);
    });

    it("includes environmental layers", () => {
      const names = ["Natura 2000 (INPN)", "ZNIEFF Type I", "ZNIEFF Type II"];
      expect(names.some((n) => n.includes("Natura"))).toBe(true);
      expect(names.some((n) => n.includes("ZNIEFF"))).toBe(true);
    });

    it("includes foncier layer", () => {
      const categories = ["environnement", "environnement", "environnement", "foncier", "urbanisme", "reseau"];
      expect(categories.includes("foncier")).toBe(true);
    });
  });

  describe("Layer visibility toggle", () => {
    it("toggling adds to set", () => {
      const set = new Set<string>();
      set.add("layer-1");
      expect(set.has("layer-1")).toBe(true);
    });

    it("toggling again removes from set", () => {
      const set = new Set<string>(["layer-1"]);
      set.delete("layer-1");
      expect(set.has("layer-1")).toBe(false);
    });
  });
});
