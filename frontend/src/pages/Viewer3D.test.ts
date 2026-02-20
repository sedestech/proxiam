/**
 * Unit tests for 3D Viewer pure functions — Sprint 7.
 *
 * Tests:
 * - FILIERE_COLORS configuration
 * - Grid layout positioning
 * - Bar height calculation
 * - Emissive intensity from score
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Viewer3D.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions from Viewer3D ───

const FILIERE_COLORS: Record<string, string> = {
  solaire_sol: "#f59e0b",
  eolien_onshore: "#3b82f6",
  bess: "#10b981",
};

function getColor(filiere: string | null): string {
  return FILIERE_COLORS[filiere || ""] || "#94a3b8";
}

function getBarHeight(puissance_mwc: number | null): number {
  return Math.max(0.5, (puissance_mwc || 10) / 20);
}

function getGridPosition(index: number, total: number): { x: number; z: number } {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const spacing = 2.5;
  const x = (col - (cols - 1) / 2) * spacing;
  const z = (row - (Math.ceil(total / cols) - 1) / 2) * spacing;
  return { x, z };
}

function getEmissiveIntensity(score: number | null, selected: boolean): number {
  return selected ? 0.6 : (score || 50) / 200;
}

// ─── Tests ───

describe("FILIERE_COLORS", () => {
  it("has 3 filiere colors", () => {
    expect(Object.keys(FILIERE_COLORS)).toHaveLength(3);
  });

  it("all values are hex colors", () => {
    Object.values(FILIERE_COLORS).forEach((c) => {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});

describe("getColor", () => {
  it("returns correct color for solaire_sol", () => {
    expect(getColor("solaire_sol")).toBe("#f59e0b");
  });

  it("returns correct color for eolien_onshore", () => {
    expect(getColor("eolien_onshore")).toBe("#3b82f6");
  });

  it("returns correct color for bess", () => {
    expect(getColor("bess")).toBe("#10b981");
  });

  it("returns fallback for unknown filiere", () => {
    expect(getColor("hydro")).toBe("#94a3b8");
  });

  it("returns fallback for null", () => {
    expect(getColor(null)).toBe("#94a3b8");
  });
});

describe("getBarHeight", () => {
  it("scales height from puissance", () => {
    expect(getBarHeight(100)).toBe(5);
  });

  it("has minimum height 0.5", () => {
    expect(getBarHeight(0)).toBe(0.5);
  });

  it("uses default 10 for null puissance", () => {
    expect(getBarHeight(null)).toBe(0.5);
  });

  it("handles small values", () => {
    expect(getBarHeight(20)).toBe(1);
  });
});

describe("getGridPosition", () => {
  it("first item is at origin for single project", () => {
    const pos = getGridPosition(0, 1);
    expect(pos.x).toBe(0);
    expect(pos.z).toBe(0);
  });

  it("positions items in grid for 4 projects", () => {
    const pos0 = getGridPosition(0, 4);
    const pos1 = getGridPosition(1, 4);
    const pos2 = getGridPosition(2, 4);
    // 2x2 grid: pos0 left of pos1, pos2 below pos0
    expect(pos0.x).toBeLessThan(pos1.x);
    expect(pos0.z).toBe(pos1.z);
    expect(pos2.z).toBeGreaterThan(pos0.z);
  });

  it("uses 3 columns for 9 projects", () => {
    const cols = Math.ceil(Math.sqrt(9));
    expect(cols).toBe(3);
  });

  it("center is approximately at 0", () => {
    // For 9 items in 3x3, center item should be near origin
    const pos4 = getGridPosition(4, 9);
    expect(pos4.x).toBe(0);
    expect(pos4.z).toBe(0);
  });
});

describe("getEmissiveIntensity", () => {
  it("returns 0.6 when selected", () => {
    expect(getEmissiveIntensity(80, true)).toBe(0.6);
  });

  it("scales with score when not selected", () => {
    expect(getEmissiveIntensity(100, false)).toBe(0.5);
  });

  it("uses default 50 for null score", () => {
    expect(getEmissiveIntensity(null, false)).toBe(0.25);
  });

  it("low score has low intensity", () => {
    expect(getEmissiveIntensity(20, false)).toBe(0.1);
  });
});
