/**
 * Unit tests for SearchBar + SearchResults pure logic — Sprint 7 + 11.
 *
 * Tests:
 * - TYPE_META configuration
 * - Search result filtering
 * - Keyboard navigation logic
 * - Facet toggle logic
 * - Project name search & sort
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

// ─── Sprint 11: Facet toggle logic ───

function toggleType(activeTypes: string[], type: string): string[] {
  return activeTypes.includes(type)
    ? activeTypes.filter((t) => t !== type)
    : [...activeTypes, type];
}

describe("facet toggle", () => {
  it("adds a type when not active", () => {
    expect(toggleType([], "phase")).toEqual(["phase"]);
  });

  it("removes a type when already active", () => {
    expect(toggleType(["phase", "norme"], "phase")).toEqual(["norme"]);
  });

  it("can add multiple types", () => {
    const result = toggleType(toggleType([], "phase"), "norme");
    expect(result).toEqual(["phase", "norme"]);
  });

  it("empty after removing last type", () => {
    expect(toggleType(["phase"], "phase")).toEqual([]);
  });
});

// ─── Sprint 11: Project filter + sort logic ───

interface Projet {
  id: string;
  nom: string;
  commune: string | null;
  departement: string | null;
  score_global: number | null;
  puissance_mwc: number | null;
}

function filterProjets(projets: Projet[], query: string): Projet[] {
  if (!query) return projets;
  const q = query.toLowerCase();
  return projets.filter(
    (p) =>
      p.nom.toLowerCase().includes(q) ||
      p.commune?.toLowerCase().includes(q) ||
      p.departement?.toLowerCase().includes(q)
  );
}

function sortProjets(projets: Projet[], sortBy: string): Projet[] {
  return [...projets].sort((a, b) => {
    if (sortBy === "score") return (b.score_global ?? -1) - (a.score_global ?? -1);
    if (sortBy === "mwc") return (b.puissance_mwc ?? 0) - (a.puissance_mwc ?? 0);
    return a.nom.localeCompare(b.nom);
  });
}

describe("project name filter", () => {
  const projets: Projet[] = [
    { id: "1", nom: "Solaire Provence", commune: "Aix", departement: "13", score_global: 80, puissance_mwc: 10 },
    { id: "2", nom: "Eolien Bretagne", commune: "Brest", departement: "29", score_global: 65, puissance_mwc: 30 },
    { id: "3", nom: "BESS Normandie", commune: "Rouen", departement: "76", score_global: null, puissance_mwc: 50 },
  ];

  it("filters by nom", () => {
    expect(filterProjets(projets, "solaire")).toHaveLength(1);
  });

  it("filters by commune", () => {
    expect(filterProjets(projets, "brest")).toHaveLength(1);
  });

  it("filters by departement", () => {
    expect(filterProjets(projets, "76")).toHaveLength(1);
  });

  it("returns all on empty query", () => {
    expect(filterProjets(projets, "")).toHaveLength(3);
  });

  it("is case insensitive", () => {
    expect(filterProjets(projets, "BESS")).toHaveLength(1);
  });
});

describe("project sort", () => {
  const projets: Projet[] = [
    { id: "1", nom: "Bravo", commune: null, departement: null, score_global: 60, puissance_mwc: 10 },
    { id: "2", nom: "Alpha", commune: null, departement: null, score_global: 90, puissance_mwc: 50 },
    { id: "3", nom: "Charlie", commune: null, departement: null, score_global: null, puissance_mwc: 30 },
  ];

  it("sorts by nom alphabetically", () => {
    const sorted = sortProjets(projets, "nom");
    expect(sorted.map((p) => p.nom)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("sorts by score descending", () => {
    const sorted = sortProjets(projets, "score");
    expect(sorted.map((p) => p.nom)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("sorts by MWc descending", () => {
    const sorted = sortProjets(projets, "mwc");
    expect(sorted.map((p) => p.nom)).toEqual(["Alpha", "Charlie", "Bravo"]);
  });

  it("null scores sort to end", () => {
    const sorted = sortProjets(projets, "score");
    expect(sorted[sorted.length - 1].score_global).toBeNull();
  });
});
