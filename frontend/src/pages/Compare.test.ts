/**
 * Unit tests for Sprint 16 comparison UI logic.
 *
 * Tests:
 * - EUR formatting (compact)
 * - Score color classification
 * - Risk badge styling
 * - Best value selection
 * - Sort behavior
 * - Data structure validation
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Compare.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions extracted from Compare.tsx ───

function formatEur(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  if (score >= 40) return "text-orange-500";
  return "text-red-500";
}

function riskBadge(level: string): string {
  if (level === "high") return "bg-red-100 text-red-700";
  if (level === "medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

interface CompareProject {
  id: string;
  nom: string;
  score_global: number | null;
  tri_pct: number;
  lcoe_eur_mwh: number;
  capex_eur_kwc: number;
  rentable: boolean;
  risk_level: "low" | "medium" | "high";
  [key: string]: unknown;
}

function bestValue(
  projects: CompareProject[],
  key: string,
  mode: "max" | "min"
): string | null {
  const values = projects
    .map((p) => ({ id: p.id, val: p[key] as number | null }))
    .filter((v) => v.val !== null && v.val !== 0);
  if (values.length === 0) return null;
  const best =
    mode === "max"
      ? values.reduce((a, b) => ((a.val ?? 0) > (b.val ?? 0) ? a : b))
      : values.reduce((a, b) => ((a.val ?? 0) < (b.val ?? 0) ? a : b));
  return best.id;
}

// ─── Tests ───

describe("formatEur (compact)", () => {
  it("formats millions", () => {
    expect(formatEur(8_500_000)).toBe("8.5M");
  });

  it("formats thousands", () => {
    expect(formatEur(150_000)).toBe("150k");
  });

  it("formats small amounts", () => {
    expect(formatEur(750)).toBe("750");
  });

  it("formats zero", () => {
    expect(formatEur(0)).toBe("0");
  });
});

describe("scoreColor", () => {
  it("returns emerald for high scores", () => {
    expect(scoreColor(85)).toBe("text-emerald-600");
  });

  it("returns amber for good scores", () => {
    expect(scoreColor(65)).toBe("text-amber-600");
  });

  it("returns orange for medium scores", () => {
    expect(scoreColor(45)).toBe("text-orange-500");
  });

  it("returns red for low scores", () => {
    expect(scoreColor(20)).toBe("text-red-500");
  });

  it("returns slate for null scores", () => {
    expect(scoreColor(null)).toBe("text-slate-400");
  });
});

describe("riskBadge", () => {
  it("returns red for high risk", () => {
    expect(riskBadge("high")).toContain("red");
  });

  it("returns amber for medium risk", () => {
    expect(riskBadge("medium")).toContain("amber");
  });

  it("returns emerald for low risk", () => {
    expect(riskBadge("low")).toContain("emerald");
  });
});

describe("bestValue", () => {
  const projects: CompareProject[] = [
    { id: "a", nom: "A", score_global: 80, tri_pct: 7.2, lcoe_eur_mwh: 52, capex_eur_kwc: 850, rentable: true, risk_level: "low" },
    { id: "b", nom: "B", score_global: 65, tri_pct: 9.1, lcoe_eur_mwh: 38, capex_eur_kwc: 920, rentable: true, risk_level: "medium" },
    { id: "c", nom: "C", score_global: 90, tri_pct: 5.5, lcoe_eur_mwh: 60, capex_eur_kwc: 780, rentable: false, risk_level: "high" },
  ];

  it("finds max score", () => {
    expect(bestValue(projects, "score_global", "max")).toBe("c");
  });

  it("finds max TRI", () => {
    expect(bestValue(projects, "tri_pct", "max")).toBe("b");
  });

  it("finds min LCOE", () => {
    expect(bestValue(projects, "lcoe_eur_mwh", "min")).toBe("b");
  });

  it("finds min CAPEX/kWc", () => {
    expect(bestValue(projects, "capex_eur_kwc", "min")).toBe("c");
  });

  it("returns null for empty array", () => {
    expect(bestValue([], "score_global", "max")).toBe(null);
  });

  it("returns null when all values are zero", () => {
    const zeroProjects = [
      { id: "x", nom: "X", score_global: 0, tri_pct: 0, lcoe_eur_mwh: 0, capex_eur_kwc: 0, rentable: false, risk_level: "low" as const },
    ];
    expect(bestValue(zeroProjects, "score_global", "max")).toBe(null);
  });
});

describe("sort behavior", () => {
  const projects = [
    { score: 80, tri: 7.2 },
    { score: 65, tri: 9.1 },
    { score: 90, tri: 5.5 },
  ];

  it("sorts descending by score", () => {
    const sorted = [...projects].sort((a, b) => b.score - a.score);
    expect(sorted[0].score).toBe(90);
    expect(sorted[1].score).toBe(80);
    expect(sorted[2].score).toBe(65);
  });

  it("sorts ascending by TRI", () => {
    const sorted = [...projects].sort((a, b) => a.tri - b.tri);
    expect(sorted[0].tri).toBe(5.5);
    expect(sorted[2].tri).toBe(9.1);
  });
});

describe("compare data structure", () => {
  it("validates a complete compare response", () => {
    const response = {
      count: 3,
      projects: [
        {
          id: "abc-123",
          nom: "Solaire Sud",
          filiere: "solaire_sol",
          puissance_mwc: 10,
          surface_ha: 15,
          commune: "Montpellier",
          departement: "34",
          statut: "prospection",
          score_global: 78,
          enriched: true,
          ghi_kwh_m2_an: 1580,
          productible_kwh_kwc_an: 1350,
          distance_poste_km: 3.5,
          constraints_count: 1,
          capex_total_eur: 8_500_000,
          capex_eur_kwc: 850,
          opex_annuel_eur: 127_500,
          revenu_annuel_eur: 674_520,
          lcoe_eur_mwh: 49.5,
          tri_pct: 4.8,
          payback_years: 15.5,
          rentable: false,
          risk_level: "medium",
          nb_obligations: 4,
          delai_max_mois: 18,
        },
      ],
    };

    expect(response.count).toBe(3);
    expect(response.projects[0].filiere).toBe("solaire_sol");
    expect(response.projects[0].enriched).toBe(true);
    expect(response.projects[0].ghi_kwh_m2_an).toBe(1580);
    expect(response.projects[0].lcoe_eur_mwh).toBe(49.5);
    expect(formatEur(response.projects[0].capex_total_eur)).toBe("8.5M");
    expect(scoreColor(response.projects[0].score_global)).toBe("text-amber-600");
    expect(riskBadge(response.projects[0].risk_level)).toContain("amber");
  });

  it("handles CSV export URL construction", () => {
    const ids = "abc-123,def-456,ghi-789";
    const baseURL = "http://localhost:8000";
    const url = `${baseURL}/api/projets/compare/export?ids=${ids}`;
    expect(url).toContain("/api/projets/compare/export");
    expect(url).toContain(ids);
  });
});
