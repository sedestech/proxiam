/**
 * Unit tests for Sprint 14 regulatory UI logic.
 *
 * Tests:
 * - Risk level badge color
 * - Obligation regime classification
 * - Timeline ordering
 * - Delay estimation
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Regulatory.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions extracted from regulatory analysis ───

interface RegulatoryObligation {
  obligation: string;
  label: string;
  regime?: string;
  delai_mois: number;
  tips: string[];
}

type RiskLevel = "low" | "medium" | "high";

function riskColor(level: RiskLevel): string {
  if (level === "high") return "text-red-500";
  if (level === "medium") return "text-amber-500";
  return "text-emerald-500";
}

function riskBg(level: RiskLevel): string {
  if (level === "high") return "bg-red-50";
  if (level === "medium") return "bg-amber-50";
  return "bg-emerald-50";
}

function riskBadge(level: RiskLevel): string {
  if (level === "high") return "bg-red-100 text-red-700";
  if (level === "medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function regimeDot(regime: string | undefined): string {
  if (regime === "autorisation") return "bg-red-500";
  if (regime === "enregistrement") return "bg-amber-500";
  return "bg-emerald-500";
}

function totalDelay(obligations: RegulatoryObligation[]): number {
  return Math.max(...obligations.map((o) => o.delai_mois), 0);
}

function hasTips(obligations: RegulatoryObligation[]): boolean {
  return obligations.some((o) => o.tips.length > 0);
}

function sortTimeline(
  phases: { phase: string; duree_mois: string; ordre: number }[]
): { phase: string; duree_mois: string; ordre: number }[] {
  return [...phases].sort((a, b) => a.ordre - b.ordre);
}

// ─── Tests ───

describe("riskColor", () => {
  it("returns red for high risk", () => {
    expect(riskColor("high")).toBe("text-red-500");
  });

  it("returns amber for medium risk", () => {
    expect(riskColor("medium")).toBe("text-amber-500");
  });

  it("returns emerald for low risk", () => {
    expect(riskColor("low")).toBe("text-emerald-500");
  });
});

describe("riskBg", () => {
  it("returns red-50 for high", () => {
    expect(riskBg("high")).toBe("bg-red-50");
  });

  it("returns emerald-50 for low", () => {
    expect(riskBg("low")).toBe("bg-emerald-50");
  });
});

describe("riskBadge", () => {
  it("returns red badge for high risk", () => {
    expect(riskBadge("high")).toContain("red");
  });

  it("returns amber badge for medium risk", () => {
    expect(riskBadge("medium")).toContain("amber");
  });

  it("returns emerald badge for low risk", () => {
    expect(riskBadge("low")).toContain("emerald");
  });
});

describe("regimeDot", () => {
  it("returns red for autorisation", () => {
    expect(regimeDot("autorisation")).toBe("bg-red-500");
  });

  it("returns amber for enregistrement", () => {
    expect(regimeDot("enregistrement")).toBe("bg-amber-500");
  });

  it("returns emerald for declaration", () => {
    expect(regimeDot("declaration")).toBe("bg-emerald-500");
  });

  it("returns emerald for undefined", () => {
    expect(regimeDot(undefined)).toBe("bg-emerald-500");
  });
});

describe("totalDelay", () => {
  it("returns max delay from obligations", () => {
    const obligations: RegulatoryObligation[] = [
      { obligation: "icpe", label: "ICPE", delai_mois: 3, tips: [] },
      { obligation: "eie", label: "EIE", delai_mois: 12, tips: [] },
      { obligation: "pc", label: "PC", delai_mois: 4, tips: [] },
    ];
    expect(totalDelay(obligations)).toBe(12);
  });

  it("returns 0 for empty obligations", () => {
    expect(totalDelay([])).toBe(0);
  });

  it("handles single obligation", () => {
    const obligations: RegulatoryObligation[] = [
      { obligation: "raccordement", label: "PTF", delai_mois: 18, tips: [] },
    ];
    expect(totalDelay(obligations)).toBe(18);
  });
});

describe("hasTips", () => {
  it("returns true when tips exist", () => {
    const obligations: RegulatoryObligation[] = [
      { obligation: "icpe", label: "ICPE", delai_mois: 3, tips: ["Tip 1"] },
    ];
    expect(hasTips(obligations)).toBe(true);
  });

  it("returns false when no tips", () => {
    const obligations: RegulatoryObligation[] = [
      { obligation: "icpe", label: "ICPE", delai_mois: 3, tips: [] },
    ];
    expect(hasTips(obligations)).toBe(false);
  });
});

describe("sortTimeline", () => {
  it("sorts phases by ordre", () => {
    const phases = [
      { phase: "Construction", duree_mois: "6-12", ordre: 9 },
      { phase: "Prospection", duree_mois: "2-6", ordre: 1 },
      { phase: "EIE", duree_mois: "6-12", ordre: 2 },
    ];
    const sorted = sortTimeline(phases);
    expect(sorted[0].ordre).toBe(1);
    expect(sorted[1].ordre).toBe(2);
    expect(sorted[2].ordre).toBe(9);
  });

  it("preserves already sorted timeline", () => {
    const phases = [
      { phase: "A", duree_mois: "1", ordre: 1 },
      { phase: "B", duree_mois: "2", ordre: 2 },
    ];
    const sorted = sortTimeline(phases);
    expect(sorted[0].phase).toBe("A");
    expect(sorted[1].phase).toBe("B");
  });
});

describe("regulatory data structure", () => {
  it("parses a complete regulatory response", () => {
    const response = {
      projet_id: "abc-123",
      filiere: "solaire_sol",
      puissance_mwc: 30,
      risk_level: "medium" as RiskLevel,
      zone_sensible: false,
      nb_obligations: 4,
      estimated_delai_max_mois: 18,
      obligations: [
        {
          obligation: "icpe",
          label: "Declaration ICPE",
          regime: "declaration",
          delai_mois: 3,
          tips: ["Astuce : deposez en meme temps"],
        },
        {
          obligation: "raccordement",
          label: "Raccordement PTF",
          delai_mois: 18,
          tips: [],
        },
      ],
      timeline: [
        { phase: "Prospection", duree_mois: "2-6", ordre: 1 },
        { phase: "Construction", duree_mois: "6-12", ordre: 9 },
      ],
      expert_tips: ["Calendrier ideal : ..."],
    };

    expect(response.risk_level).toBe("medium");
    expect(response.nb_obligations).toBe(4);
    expect(response.obligations.length).toBe(2);
    expect(response.obligations[0].regime).toBe("declaration");
    expect(hasTips(response.obligations)).toBe(true);
    expect(totalDelay(response.obligations)).toBe(18);
    expect(riskColor(response.risk_level)).toBe("text-amber-500");
  });

  it("handles high risk with zone sensible", () => {
    const response = {
      risk_level: "high" as RiskLevel,
      zone_sensible: true,
      nb_obligations: 5,
      obligations: [
        {
          obligation: "ae",
          label: "Autorisation environnementale",
          regime: "autorisation",
          delai_mois: 18,
          tips: [],
        },
      ],
    };

    expect(response.zone_sensible).toBe(true);
    expect(riskBadge(response.risk_level)).toContain("red");
    expect(regimeDot(response.obligations[0].regime)).toBe("bg-red-500");
  });
});
