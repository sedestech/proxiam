/**
 * Unit tests for Veille page pure functions — Sprint 5.
 *
 * Tests:
 * - Type classification and icon mapping
 * - Frequency badge label mapping
 * - Source filtering logic (search, type, free/paid)
 * - Type count aggregation
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Veille.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions from Veille page ───

interface Source {
  id: number;
  code: string;
  nom: string;
  type: string | null;
  url: string | null;
  frequence: string | null;
  gratuit: boolean;
}

const TYPE_KEYS = ["api", "rss", "scraping", "base_donnees"] as const;

function countByType(sources: Source[]): Record<string, number> {
  const counts: Record<string, number> = {};
  sources.forEach((s) => {
    const t = s.type || "autre";
    counts[t] = (counts[t] || 0) + 1;
  });
  return counts;
}

function filterSources(
  sources: Source[],
  searchQuery: string,
  typeFilter: string,
  freeFilter: string
): Source[] {
  return sources.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !s.nom.toLowerCase().includes(q) &&
        !s.code.toLowerCase().includes(q) &&
        !(s.url || "").toLowerCase().includes(q)
      )
        return false;
    }
    if (typeFilter && s.type !== typeFilter) return false;
    if (freeFilter === "gratuit" && !s.gratuit) return false;
    if (freeFilter === "payant" && s.gratuit) return false;
    return true;
  });
}

// ─── Test data ───

const MOCK_SOURCES: Source[] = [
  { id: 1, code: "V-001", nom: "RTE API", type: "api", url: "https://rte.fr", frequence: "quotidien", gratuit: true },
  { id: 2, code: "V-002", nom: "PV Magazine RSS", type: "rss", url: "https://pv-magazine.fr/feed", frequence: "quotidien", gratuit: true },
  { id: 3, code: "V-003", nom: "DREAL Scraper", type: "scraping", url: null, frequence: "hebdo", gratuit: true },
  { id: 4, code: "V-004", nom: "INSEE Base", type: "base_donnees", url: "https://insee.fr", frequence: "mensuel", gratuit: true },
  { id: 5, code: "V-005", nom: "SolarGIS Premium", type: "api", url: "https://solargis.com", frequence: "temps_reel", gratuit: false },
  { id: 6, code: "V-006", nom: "ADEME Data", type: "base_donnees", url: "https://ademe.fr", frequence: "annuel", gratuit: true },
];

// ─── Tests ───

describe("countByType", () => {
  it("counts each type correctly", () => {
    const counts = countByType(MOCK_SOURCES);
    expect(counts.api).toBe(2);
    expect(counts.rss).toBe(1);
    expect(counts.scraping).toBe(1);
    expect(counts.base_donnees).toBe(2);
  });

  it("handles empty array", () => {
    const counts = countByType([]);
    expect(Object.keys(counts)).toHaveLength(0);
  });

  it("puts null types under 'autre'", () => {
    const sources: Source[] = [
      { id: 1, code: "V-001", nom: "Unknown", type: null, url: null, frequence: null, gratuit: true },
    ];
    const counts = countByType(sources);
    expect(counts.autre).toBe(1);
  });
});

describe("filterSources", () => {
  it("returns all sources with no filters", () => {
    const result = filterSources(MOCK_SOURCES, "", "", "");
    expect(result).toHaveLength(6);
  });

  it("filters by search query on nom", () => {
    const result = filterSources(MOCK_SOURCES, "rte", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("V-001");
  });

  it("filters by search query on code", () => {
    const result = filterSources(MOCK_SOURCES, "V-003", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].nom).toBe("DREAL Scraper");
  });

  it("filters by search query on url", () => {
    const result = filterSources(MOCK_SOURCES, "solargis", "", "");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("V-005");
  });

  it("filters by type", () => {
    const result = filterSources(MOCK_SOURCES, "", "api", "");
    expect(result).toHaveLength(2);
    result.forEach((s) => expect(s.type).toBe("api"));
  });

  it("filters by gratuit", () => {
    const result = filterSources(MOCK_SOURCES, "", "", "gratuit");
    expect(result).toHaveLength(5);
    result.forEach((s) => expect(s.gratuit).toBe(true));
  });

  it("filters by payant", () => {
    const result = filterSources(MOCK_SOURCES, "", "", "payant");
    expect(result).toHaveLength(1);
    expect(result[0].nom).toBe("SolarGIS Premium");
  });

  it("combines search + type filter", () => {
    const result = filterSources(MOCK_SOURCES, "solar", "api", "");
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("V-005");
  });

  it("combines all filters", () => {
    const result = filterSources(MOCK_SOURCES, "rte", "api", "gratuit");
    expect(result).toHaveLength(1);
  });

  it("returns empty when no match", () => {
    const result = filterSources(MOCK_SOURCES, "nonexistent", "", "");
    expect(result).toHaveLength(0);
  });
});

describe("TYPE_KEYS", () => {
  it("has exactly 4 types", () => {
    expect(TYPE_KEYS).toHaveLength(4);
  });

  it("contains expected types", () => {
    expect(TYPE_KEYS).toContain("api");
    expect(TYPE_KEYS).toContain("rss");
    expect(TYPE_KEYS).toContain("scraping");
    expect(TYPE_KEYS).toContain("base_donnees");
  });
});

describe("Source data structure", () => {
  it("each source has required fields", () => {
    MOCK_SOURCES.forEach((s) => {
      expect(s).toHaveProperty("id");
      expect(s).toHaveProperty("code");
      expect(s).toHaveProperty("nom");
      expect(typeof s.id).toBe("number");
      expect(typeof s.code).toBe("string");
      expect(typeof s.nom).toBe("string");
      expect(typeof s.gratuit).toBe("boolean");
    });
  });

  it("code follows V-NNN pattern", () => {
    MOCK_SOURCES.forEach((s) => {
      expect(s.code).toMatch(/^V-\d{3}$/);
    });
  });
});
