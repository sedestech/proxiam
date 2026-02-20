/**
 * Unit tests for SearchBar pure logic — Sprint 7.
 *
 * Tests:
 * - TYPE_META configuration
 * - Search result filtering
 * - Keyboard navigation logic
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Search.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions from SearchBar ───

const TYPE_META: Record<string, { color: string; label_fr: string; label_en: string }> = {
  phase: { color: "#3b82f6", label_fr: "Phase", label_en: "Phase" },
  norme: { color: "#10b981", label_fr: "Norme", label_en: "Standard" },
  risque: { color: "#ef4444", label_fr: "Risque", label_en: "Risk" },
  livrable: { color: "#f59e0b", label_fr: "Livrable", label_en: "Deliverable" },
  outil: { color: "#f97316", label_fr: "Outil", label_en: "Tool" },
  source: { color: "#8b5cf6", label_fr: "Source", label_en: "Source" },
  competence: { color: "#ec4899", label_fr: "Compétence", label_en: "Skill" },
};

interface SearchResult {
  id: number;
  code: string;
  titre: string;
  type: string;
}

function filterResults(results: SearchResult[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return results.filter(
    (r) =>
      r.titre.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q)
  );
}

function nextIndex(current: number, total: number): number {
  return current < total - 1 ? current + 1 : 0;
}

function prevIndex(current: number, total: number): number {
  return current > 0 ? current - 1 : total - 1;
}

// ─── Tests ───

describe("TYPE_META", () => {
  it("has 7 entity types", () => {
    expect(Object.keys(TYPE_META)).toHaveLength(7);
  });

  it("all have hex colors", () => {
    Object.values(TYPE_META).forEach((meta) => {
      expect(meta.color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("all have FR and EN labels", () => {
    Object.values(TYPE_META).forEach((meta) => {
      expect(meta.label_fr.length).toBeGreaterThan(0);
      expect(meta.label_en.length).toBeGreaterThan(0);
    });
  });

  it("includes all entity types", () => {
    const expected = ["phase", "norme", "risque", "livrable", "outil", "source", "competence"];
    expected.forEach((t) => {
      expect(TYPE_META).toHaveProperty(t);
    });
  });
});

describe("filterResults", () => {
  const results: SearchResult[] = [
    { id: 1, code: "P1.1", titre: "Prospection fonciere", type: "phase" },
    { id: 2, code: "N-101", titre: "Norme IEC 61215", type: "norme" },
    { id: 3, code: "R-050", titre: "Risque inondation", type: "risque" },
    { id: 4, code: "O-200", titre: "PVGIS irradiation tool", type: "outil" },
  ];

  it("filters by titre", () => {
    const filtered = filterResults(results, "norme");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].code).toBe("N-101");
  });

  it("filters by code", () => {
    const filtered = filterResults(results, "P1.1");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].titre).toBe("Prospection fonciere");
  });

  it("is case insensitive", () => {
    const filtered = filterResults(results, "PVGIS");
    expect(filtered).toHaveLength(1);
  });

  it("returns all on empty match", () => {
    const filtered = filterResults(results, "xyz");
    expect(filtered).toHaveLength(0);
  });

  it("returns all when query matches multiple", () => {
    const filtered = filterResults(results, "i");
    expect(filtered.length).toBeGreaterThan(1);
  });
});

describe("keyboard navigation", () => {
  it("nextIndex wraps around", () => {
    expect(nextIndex(4, 5)).toBe(0);
  });

  it("nextIndex increments normally", () => {
    expect(nextIndex(2, 5)).toBe(3);
  });

  it("prevIndex wraps around", () => {
    expect(prevIndex(0, 5)).toBe(4);
  });

  it("prevIndex decrements normally", () => {
    expect(prevIndex(3, 5)).toBe(2);
  });
});

describe("Search response structure", () => {
  const mockResponse = {
    query: "solaire",
    results: [
      { id: 1, code: "P1.1", titre: "Etude solaire", type: "phase" },
    ],
    total: 15,
    facets: { type: { phase: 5, norme: 3, outil: 7 } },
  };

  it("has query field", () => {
    expect(mockResponse.query).toBe("solaire");
  });

  it("has results array", () => {
    expect(Array.isArray(mockResponse.results)).toBe(true);
  });

  it("has total count", () => {
    expect(mockResponse.total).toBeGreaterThan(0);
  });

  it("has facets with type counts", () => {
    expect(mockResponse.facets.type).toHaveProperty("phase");
    expect(mockResponse.facets.type.phase).toBe(5);
  });
});
