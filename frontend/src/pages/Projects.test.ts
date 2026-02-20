/**
 * Unit tests for Projects page pure functions — Sprint 4.
 *
 * Tests:
 * - scoreColor: color selection for project scores
 * - statutBadge class mapping
 * - cleanBlocTitle: removes emojis and "BLOC N:" prefix
 * - Phase workflow logic
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Projects.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions from Projects/ProjectDetail ───

function scoreColor(score: number | null): string {
  if (score === null) return "#94a3b8";
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function cleanBlocTitle(titre: string): string {
  return titre
    .replace(/^[^\w]+ /, "")
    .replace(/^BLOC \d+ : /, "")
    .replace(/ \(\d+-\d+\)$/, "");
}

interface PhaseBloc {
  code: string;
  titre: string;
  statut: string;
  completion_pct: number;
}

function computeOverallPct(phases: PhaseBloc[]): number {
  if (phases.length === 0) return 0;
  return Math.round(
    phases.reduce((sum, p) => sum + p.completion_pct, 0) / phases.length
  );
}

function countCompleted(phases: PhaseBloc[]): number {
  return phases.filter((p) => p.statut === "termine").length;
}

const STATUT_CLASSES: Record<string, string> = {
  prospection: "bg-blue-50 text-blue-700",
  ingenierie: "bg-violet-50 text-violet-700",
  autorisation: "bg-amber-50 text-amber-700",
  construction: "bg-emerald-50 text-emerald-700",
  exploitation: "bg-teal-50 text-teal-700",
};

// ─── Tests ───

describe("scoreColor (with null)", () => {
  it("returns slate for null", () => {
    expect(scoreColor(null)).toBe("#94a3b8");
  });

  it("returns green for >= 80", () => {
    expect(scoreColor(85)).toBe("#10b981");
  });

  it("returns amber for 60-79", () => {
    expect(scoreColor(72)).toBe("#f59e0b");
  });

  it("returns orange for 40-59", () => {
    expect(scoreColor(45)).toBe("#f97316");
  });

  it("returns red for < 40", () => {
    expect(scoreColor(25)).toBe("#ef4444");
  });
});

describe("cleanBlocTitle", () => {
  it("removes emoji prefix", () => {
    expect(cleanBlocTitle("🔍 BLOC 1 : PROSPECTION & FAISABILITE")).toBe(
      "PROSPECTION & FAISABILITE"
    );
  });

  it("removes BLOC N: prefix", () => {
    expect(cleanBlocTitle("BLOC 3 : GENIE CIVIL")).toBe("GENIE CIVIL");
  });

  it("removes trailing (NNN-NNN)", () => {
    expect(
      cleanBlocTitle("🚀 BLOC 7 : MISE EN SERVICE & COMMISSIONING (851-925)")
    ).toBe("MISE EN SERVICE & COMMISSIONING");
  });

  it("handles plain titles", () => {
    expect(cleanBlocTitle("Bloc 5")).toBe("Bloc 5");
  });
});

describe("computeOverallPct", () => {
  it("returns 0 for empty array", () => {
    expect(computeOverallPct([])).toBe(0);
  });

  it("computes average correctly", () => {
    const phases: PhaseBloc[] = [
      { code: "B1", titre: "B1", statut: "termine", completion_pct: 100 },
      { code: "B2", titre: "B2", statut: "en_cours", completion_pct: 50 },
      { code: "B3", titre: "B3", statut: "a_faire", completion_pct: 0 },
    ];
    expect(computeOverallPct(phases)).toBe(50);
  });

  it("returns 100 when all complete", () => {
    const phases: PhaseBloc[] = [
      { code: "B1", titre: "B1", statut: "termine", completion_pct: 100 },
      { code: "B2", titre: "B2", statut: "termine", completion_pct: 100 },
    ];
    expect(computeOverallPct(phases)).toBe(100);
  });
});

describe("countCompleted", () => {
  it("counts termine phases", () => {
    const phases: PhaseBloc[] = [
      { code: "B1", titre: "B1", statut: "termine", completion_pct: 100 },
      { code: "B2", titre: "B2", statut: "en_cours", completion_pct: 50 },
      { code: "B3", titre: "B3", statut: "termine", completion_pct: 100 },
      { code: "B4", titre: "B4", statut: "a_faire", completion_pct: 0 },
    ];
    expect(countCompleted(phases)).toBe(2);
  });

  it("returns 0 when none completed", () => {
    const phases: PhaseBloc[] = [
      { code: "B1", titre: "B1", statut: "en_cours", completion_pct: 50 },
      { code: "B2", titre: "B2", statut: "a_faire", completion_pct: 0 },
    ];
    expect(countCompleted(phases)).toBe(0);
  });
});

describe("statut classes", () => {
  it("has classes for all statuts", () => {
    expect(STATUT_CLASSES).toHaveProperty("prospection");
    expect(STATUT_CLASSES).toHaveProperty("ingenierie");
    expect(STATUT_CLASSES).toHaveProperty("autorisation");
    expect(STATUT_CLASSES).toHaveProperty("construction");
    expect(STATUT_CLASSES).toHaveProperty("exploitation");
  });

  it("each class string contains bg- and text-", () => {
    Object.values(STATUT_CLASSES).forEach((cls) => {
      expect(cls).toMatch(/bg-/);
      expect(cls).toMatch(/text-/);
    });
  });
});
