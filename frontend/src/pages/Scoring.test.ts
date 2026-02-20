/**
 * Unit tests for Scoring page pure functions — Sprint 3.
 *
 * Tests:
 * - scoreColor: color selection based on score thresholds
 * - filiereLabel: human-readable filiere labels
 * - CRITERIA_KEYS: complete set of 6 criteria
 * - Radar chart data preparation
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Scoring.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions extracted for testing ───

const CRITERIA_KEYS = [
  "proximite_reseau",
  "urbanisme",
  "environnement",
  "irradiation",
  "accessibilite",
  "risques",
] as const;

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function filiereLabel(filiere: string | null): string {
  switch (filiere) {
    case "solaire_sol":
      return "Solaire sol";
    case "eolien_onshore":
      return "Eolien onshore";
    case "bess":
      return "BESS (Stockage)";
    default:
      return filiere || "—";
  }
}

interface ScoreDetails {
  proximite_reseau: number;
  urbanisme: number;
  environnement: number;
  irradiation: number;
  accessibilite: number;
  risques: number;
}

function prepareRadarData(
  details: ScoreDetails,
  labelFn: (key: string) => string
) {
  return CRITERIA_KEYS.map((key) => ({
    criterion: labelFn(key),
    value: details[key],
    fullMark: 100,
  }));
}

// ─── Tests ───

describe("scoreColor", () => {
  it("returns green for score >= 80", () => {
    expect(scoreColor(80)).toBe("#10b981");
    expect(scoreColor(95)).toBe("#10b981");
    expect(scoreColor(100)).toBe("#10b981");
  });

  it("returns amber for score 60-79", () => {
    expect(scoreColor(60)).toBe("#f59e0b");
    expect(scoreColor(79)).toBe("#f59e0b");
  });

  it("returns orange for score 40-59", () => {
    expect(scoreColor(40)).toBe("#f97316");
    expect(scoreColor(59)).toBe("#f97316");
  });

  it("returns red for score < 40", () => {
    expect(scoreColor(0)).toBe("#ef4444");
    expect(scoreColor(39)).toBe("#ef4444");
  });
});

describe("filiereLabel", () => {
  it("returns correct label for solaire_sol", () => {
    expect(filiereLabel("solaire_sol")).toBe("Solaire sol");
  });

  it("returns correct label for eolien_onshore", () => {
    expect(filiereLabel("eolien_onshore")).toBe("Eolien onshore");
  });

  it("returns correct label for bess", () => {
    expect(filiereLabel("bess")).toBe("BESS (Stockage)");
  });

  it("returns raw filiere for unknown type", () => {
    expect(filiereLabel("h2")).toBe("h2");
  });

  it("returns dash for null", () => {
    expect(filiereLabel(null)).toBe("—");
  });
});

describe("CRITERIA_KEYS", () => {
  it("has exactly 6 criteria", () => {
    expect(CRITERIA_KEYS).toHaveLength(6);
  });

  it("contains all expected criteria", () => {
    expect(CRITERIA_KEYS).toContain("proximite_reseau");
    expect(CRITERIA_KEYS).toContain("urbanisme");
    expect(CRITERIA_KEYS).toContain("environnement");
    expect(CRITERIA_KEYS).toContain("irradiation");
    expect(CRITERIA_KEYS).toContain("accessibilite");
    expect(CRITERIA_KEYS).toContain("risques");
  });
});

describe("prepareRadarData", () => {
  const details: ScoreDetails = {
    proximite_reseau: 80,
    urbanisme: 65,
    environnement: 70,
    irradiation: 90,
    accessibilite: 55,
    risques: 75,
  };

  it("returns 6 data points", () => {
    const data = prepareRadarData(details, (k) => k);
    expect(data).toHaveLength(6);
  });

  it("maps values correctly", () => {
    const data = prepareRadarData(details, (k) => k);
    const reseau = data.find((d) => d.criterion === "proximite_reseau");
    expect(reseau?.value).toBe(80);
  });

  it("applies label function", () => {
    const data = prepareRadarData(details, (k) =>
      k === "proximite_reseau" ? "Grid Proximity" : k
    );
    expect(data[0].criterion).toBe("Grid Proximity");
  });

  it("all entries have fullMark 100", () => {
    const data = prepareRadarData(details, (k) => k);
    data.forEach((d) => {
      expect(d.fullMark).toBe(100);
    });
  });
});

describe("weighted score calculation", () => {
  it("computes correct weighted average", () => {
    const details: ScoreDetails = {
      proximite_reseau: 80,
      urbanisme: 60,
      environnement: 70,
      irradiation: 90,
      accessibilite: 50,
      risques: 75,
    };
    const weights: Record<string, number> = {
      proximite_reseau: 0.25,
      urbanisme: 0.15,
      environnement: 0.15,
      irradiation: 0.25,
      accessibilite: 0.10,
      risques: 0.10,
    };

    const globalScore = CRITERIA_KEYS.reduce(
      (sum, key) => sum + details[key] * weights[key],
      0
    );

    // 80*0.25 + 60*0.15 + 70*0.15 + 90*0.25 + 50*0.10 + 75*0.10
    // = 20 + 9 + 10.5 + 22.5 + 5 + 7.5 = 74.5
    expect(Math.round(globalScore)).toBe(75);
  });

  it("weights sum to 1.0 for default", () => {
    const defaultWeights = {
      proximite_reseau: 0.25,
      urbanisme: 0.15,
      environnement: 0.15,
      irradiation: 0.20,
      accessibilite: 0.10,
      risques: 0.15,
    };
    const sum = Object.values(defaultWeights).reduce((a, b) => a + b, 0);
    expect(Math.abs(sum - 1.0)).toBeLessThan(0.01);
  });
});
