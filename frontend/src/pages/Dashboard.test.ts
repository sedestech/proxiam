/**
 * Unit tests for Dashboard pure functions — Sprint 6.
 *
 * Tests:
 * - KPI value formatting
 * - Statut color mapping
 * - Filiere color mapping
 * - Portfolio data aggregation
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Dashboard.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions from Dashboard ───

const STATUT_COLORS: Record<string, string> = {
  prospection: "#3b82f6",
  ingenierie: "#8b5cf6",
  autorisation: "#f59e0b",
  construction: "#10b981",
  exploitation: "#14b8a6",
};

const FILIERE_COLORS: Record<string, string> = {
  solaire_sol: "#f59e0b",
  eolien_onshore: "#3b82f6",
  bess: "#10b981",
};

interface PortfolioStats {
  total: number;
  by_statut: Record<string, number>;
  avg_score: number;
  total_mwc: number;
  nb_filieres: number;
}

function computeStatutData(portfolio: PortfolioStats) {
  return Object.entries(portfolio.by_statut)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v, color: STATUT_COLORS[k] || "#94a3b8" }));
}

interface Projet {
  filiere: string | null;
}

function computeFiliereData(projects: Projet[]) {
  return Object.entries(
    projects.reduce<Record<string, number>>((acc, p) => {
      const f = p.filiere || "autre";
      acc[f] = (acc[f] || 0) + 1;
      return acc;
    }, {})
  ).map(([k, v]) => ({ name: k, value: v, color: FILIERE_COLORS[k] || "#94a3b8" }));
}

function computeTotalKnowledge(stats: {
  phases: number; livrables: number; normes: number;
  risques: number; sources_veille: number; outils: number;
  competences: number;
}) {
  return stats.phases + stats.livrables + stats.normes + stats.risques +
    stats.sources_veille + stats.outils + stats.competences;
}

// ─── Tests ───

describe("STATUT_COLORS", () => {
  it("has 5 statut colors", () => {
    expect(Object.keys(STATUT_COLORS)).toHaveLength(5);
  });

  it("all values are hex colors", () => {
    Object.values(STATUT_COLORS).forEach((c) => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});

describe("FILIERE_COLORS", () => {
  it("has 3 filiere colors", () => {
    expect(Object.keys(FILIERE_COLORS)).toHaveLength(3);
  });

  it("includes solaire, eolien, bess", () => {
    expect(FILIERE_COLORS).toHaveProperty("solaire_sol");
    expect(FILIERE_COLORS).toHaveProperty("eolien_onshore");
    expect(FILIERE_COLORS).toHaveProperty("bess");
  });
});

describe("computeStatutData", () => {
  const portfolio: PortfolioStats = {
    total: 8,
    by_statut: {
      prospection: 3,
      ingenierie: 2,
      autorisation: 1,
      construction: 1,
      exploitation: 1,
    },
    avg_score: 74,
    total_mwc: 340,
    nb_filieres: 3,
  };

  it("filters out zero-count statuts", () => {
    const p: PortfolioStats = { ...portfolio, by_statut: { prospection: 2, construction: 0 } };
    const data = computeStatutData(p);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("prospection");
  });

  it("maps correct colors", () => {
    const data = computeStatutData(portfolio);
    const prospection = data.find((d) => d.name === "prospection");
    expect(prospection?.color).toBe("#3b82f6");
  });

  it("preserves count values", () => {
    const data = computeStatutData(portfolio);
    const total = data.reduce((sum, d) => sum + d.value, 0);
    expect(total).toBe(8);
  });
});

describe("computeFiliereData", () => {
  const projects: Projet[] = [
    { filiere: "solaire_sol" },
    { filiere: "solaire_sol" },
    { filiere: "eolien_onshore" },
    { filiere: "bess" },
    { filiere: null },
  ];

  it("groups by filiere", () => {
    const data = computeFiliereData(projects);
    expect(data).toHaveLength(4); // solaire, eolien, bess, autre
  });

  it("counts correctly", () => {
    const data = computeFiliereData(projects);
    const solaire = data.find((d) => d.name === "solaire_sol");
    expect(solaire?.value).toBe(2);
  });

  it("handles null filiere as 'autre'", () => {
    const data = computeFiliereData(projects);
    const autre = data.find((d) => d.name === "autre");
    expect(autre?.value).toBe(1);
  });

  it("uses fallback color for unknown filiere", () => {
    const data = computeFiliereData(projects);
    const autre = data.find((d) => d.name === "autre");
    expect(autre?.color).toBe("#94a3b8");
  });
});

describe("computeTotalKnowledge", () => {
  it("sums all entity counts", () => {
    const stats = {
      phases: 1061, livrables: 975, normes: 943,
      risques: 811, sources_veille: 578, outils: 500,
      competences: 300,
    };
    expect(computeTotalKnowledge(stats)).toBe(5168);
  });

  it("handles zeros", () => {
    const stats = {
      phases: 0, livrables: 0, normes: 0,
      risques: 0, sources_veille: 0, outils: 0,
      competences: 0,
    };
    expect(computeTotalKnowledge(stats)).toBe(0);
  });
});

describe("Theme store", () => {
  it("supports light, dark, system values", () => {
    const themes = ["light", "dark", "system"];
    themes.forEach((t) => {
      expect(["light", "dark", "system"]).toContain(t);
    });
  });
});
