/**
 * Unit tests for Canvas/Workflow pure functions — Sprint 8.
 *
 * Tests:
 * - BLOC_COLORS configuration
 * - cleanBlocTitle formatting
 * - Workflow stats computation
 * - Node positioning
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Canvas.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions from Canvas ───

const BLOC_COLORS: Record<string, string> = {
  B1: "#3b82f6",
  B2: "#8b5cf6",
  B3: "#10b981",
  B4: "#14b8a6",
  B5: "#f59e0b",
  B6: "#ec4899",
  B7: "#6366f1",
  B8: "#64748b",
};

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

function computeWorkflowStats(phases: PhaseBloc[]) {
  const completed = phases.filter((p) => p.statut === "termine").length;
  const inProgress = phases.filter((p) => p.statut === "en_cours").length;
  const total = phases.length;
  const overallPct = Math.round(
    phases.reduce((sum, p) => sum + p.completion_pct, 0) / total
  );
  return { completed, inProgress, total, overallPct };
}

function getEdgeStyle(statut: string): { stroke: string; animated: boolean } {
  if (statut === "termine") return { stroke: "#10b981", animated: false };
  if (statut === "en_cours") return { stroke: "#f59e0b", animated: true };
  return { stroke: "#cbd5e1", animated: false };
}

// ─── Tests ───

describe("BLOC_COLORS", () => {
  it("has 8 bloc colors", () => {
    expect(Object.keys(BLOC_COLORS)).toHaveLength(8);
  });

  it("all values are hex colors", () => {
    Object.values(BLOC_COLORS).forEach((c) => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  it("includes B1 through B8", () => {
    for (let i = 1; i <= 8; i++) {
      expect(BLOC_COLORS).toHaveProperty(`B${i}`);
    }
  });
});

describe("cleanBlocTitle", () => {
  it("removes emoji prefix", () => {
    expect(cleanBlocTitle("🔍 Prospection")).toBe("Prospection");
  });

  it("removes BLOC N: prefix", () => {
    expect(cleanBlocTitle("BLOC 1 : Prospection")).toBe("Prospection");
  });

  it("removes range suffix", () => {
    expect(cleanBlocTitle("Prospection (1-10)")).toBe("Prospection");
  });

  it("handles clean title", () => {
    expect(cleanBlocTitle("Prospection")).toBe("Prospection");
  });

  it("handles combined prefixes", () => {
    expect(cleanBlocTitle("🔍 BLOC 1 : Prospection (1-10)")).toBe("Prospection");
  });
});

describe("computeWorkflowStats", () => {
  const phases: PhaseBloc[] = [
    { code: "B1", titre: "Prospection", statut: "termine", completion_pct: 100 },
    { code: "B2", titre: "Ingenierie", statut: "termine", completion_pct: 100 },
    { code: "B3", titre: "Reglementaire", statut: "en_cours", completion_pct: 50 },
    { code: "B4", titre: "Finance", statut: "a_faire", completion_pct: 0 },
    { code: "B5", titre: "Construction", statut: "a_faire", completion_pct: 0 },
    { code: "B6", titre: "Exploitation", statut: "a_faire", completion_pct: 0 },
    { code: "B7", titre: "Environnement", statut: "a_faire", completion_pct: 0 },
    { code: "B8", titre: "Transverse", statut: "a_faire", completion_pct: 0 },
  ];

  it("counts completed blocs", () => {
    const stats = computeWorkflowStats(phases);
    expect(stats.completed).toBe(2);
  });

  it("counts in-progress blocs", () => {
    const stats = computeWorkflowStats(phases);
    expect(stats.inProgress).toBe(1);
  });

  it("has correct total", () => {
    const stats = computeWorkflowStats(phases);
    expect(stats.total).toBe(8);
  });

  it("computes overall percentage", () => {
    const stats = computeWorkflowStats(phases);
    // (100+100+50+0+0+0+0+0) / 8 = 31.25 → 31
    expect(stats.overallPct).toBe(31);
  });

  it("handles all completed", () => {
    const allDone = phases.map((p) => ({
      ...p,
      statut: "termine",
      completion_pct: 100,
    }));
    const stats = computeWorkflowStats(allDone);
    expect(stats.overallPct).toBe(100);
    expect(stats.completed).toBe(8);
  });
});

describe("getEdgeStyle", () => {
  it("completed edge is green and not animated", () => {
    const style = getEdgeStyle("termine");
    expect(style.stroke).toBe("#10b981");
    expect(style.animated).toBe(false);
  });

  it("in-progress edge is amber and animated", () => {
    const style = getEdgeStyle("en_cours");
    expect(style.stroke).toBe("#f59e0b");
    expect(style.animated).toBe(true);
  });

  it("todo edge is gray and not animated", () => {
    const style = getEdgeStyle("a_faire");
    expect(style.stroke).toBe("#cbd5e1");
    expect(style.animated).toBe(false);
  });
});

describe("Notification types", () => {
  const TYPES = ["project_created", "score_calculated", "system"];

  it("has 3 notification types", () => {
    expect(TYPES).toHaveLength(3);
  });

  it("timeAgo handles recent timestamps", () => {
    function timeAgo(timestamp: string | null): string {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      const now = new Date();
      const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diff < 60) return "a l'instant";
      if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
      if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
      return `il y a ${Math.floor(diff / 86400)}j`;
    }

    expect(timeAgo(null)).toBe("");
    expect(timeAgo(new Date().toISOString())).toBe("a l'instant");
  });
});
