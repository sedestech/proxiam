/**
 * Unit tests for AI Analysis tab pure functions — Sprint 5.
 *
 * Tests:
 * - Analysis response structure validation
 * - Score insight interpretation
 * - Source mode badge logic
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/AIAnalysis.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Types from ProjectDetail AI tab ───

interface AIInsight {
  criterion: string;
  value: number;
  insight: string;
}

interface AIAnalysis {
  summary: string;
  strengths: string[];
  risks: string[];
  next_steps: string[];
  score_insights: AIInsight[];
  phase_summary: string;
  source: "claude" | "template";
}

// ─── Pure functions ───

function scoreColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function isAnalysisComplete(analysis: AIAnalysis): boolean {
  return (
    analysis.summary.length > 0 &&
    analysis.strengths.length > 0 &&
    analysis.risks.length > 0 &&
    analysis.next_steps.length > 0
  );
}

function sourceLabel(source: "claude" | "template"): string {
  return source === "claude" ? "Claude AI" : "Template";
}

// ─── Test data ───

const TEMPLATE_ANALYSIS: AIAnalysis = {
  summary: "Ce projet a un potentiel correct avec quelques points d'attention.",
  strengths: [
    "Filiere mature avec des couts en baisse",
    "Irradiation favorable",
    "Cadre reglementaire bien etabli",
  ],
  risks: [
    "Saturation potentielle des postes sources",
    "Concurrence fonciere avec l'agriculture",
    "Delais d'instruction des autorisations",
  ],
  next_steps: [
    "Verifier la capacite du poste source",
    "Lancer l'etude d'impact environnemental",
    "Consulter le PLU/PLUi",
    "Preparer le dossier ICPE",
  ],
  score_insights: [
    {
      criterion: "proximite_reseau",
      value: 85,
      insight: "Excellente proximite au reseau electrique",
    },
    {
      criterion: "urbanisme",
      value: 60,
      insight: "Compatibilite urbanistique a verifier",
    },
    {
      criterion: "environnement",
      value: 45,
      insight: "Sensibilite environnementale moderee",
    },
  ],
  phase_summary: "1/8 blocs termines, 3 en cours",
  source: "template",
};

const EMPTY_ANALYSIS: AIAnalysis = {
  summary: "",
  strengths: [],
  risks: [],
  next_steps: [],
  score_insights: [],
  phase_summary: "",
  source: "template",
};

// ─── Tests ───

describe("AIAnalysis structure", () => {
  it("template analysis has all required fields", () => {
    expect(TEMPLATE_ANALYSIS).toHaveProperty("summary");
    expect(TEMPLATE_ANALYSIS).toHaveProperty("strengths");
    expect(TEMPLATE_ANALYSIS).toHaveProperty("risks");
    expect(TEMPLATE_ANALYSIS).toHaveProperty("next_steps");
    expect(TEMPLATE_ANALYSIS).toHaveProperty("score_insights");
    expect(TEMPLATE_ANALYSIS).toHaveProperty("phase_summary");
    expect(TEMPLATE_ANALYSIS).toHaveProperty("source");
  });

  it("strengths is a non-empty array", () => {
    expect(TEMPLATE_ANALYSIS.strengths).toBeInstanceOf(Array);
    expect(TEMPLATE_ANALYSIS.strengths.length).toBeGreaterThan(0);
  });

  it("risks is a non-empty array", () => {
    expect(TEMPLATE_ANALYSIS.risks).toBeInstanceOf(Array);
    expect(TEMPLATE_ANALYSIS.risks.length).toBeGreaterThan(0);
  });

  it("next_steps is a non-empty array", () => {
    expect(TEMPLATE_ANALYSIS.next_steps).toBeInstanceOf(Array);
    expect(TEMPLATE_ANALYSIS.next_steps.length).toBeGreaterThan(0);
  });

  it("source is either claude or template", () => {
    expect(["claude", "template"]).toContain(TEMPLATE_ANALYSIS.source);
  });
});

describe("scoreColor for insights", () => {
  it("returns green for >= 80", () => {
    expect(scoreColor(80)).toBe("#10b981");
    expect(scoreColor(100)).toBe("#10b981");
  });

  it("returns amber for 60-79", () => {
    expect(scoreColor(60)).toBe("#f59e0b");
    expect(scoreColor(79)).toBe("#f59e0b");
  });

  it("returns orange for 40-59", () => {
    expect(scoreColor(40)).toBe("#f97316");
    expect(scoreColor(59)).toBe("#f97316");
  });

  it("returns red for < 40", () => {
    expect(scoreColor(0)).toBe("#ef4444");
    expect(scoreColor(39)).toBe("#ef4444");
  });
});

describe("isAnalysisComplete", () => {
  it("returns true for complete analysis", () => {
    expect(isAnalysisComplete(TEMPLATE_ANALYSIS)).toBe(true);
  });

  it("returns false for empty analysis", () => {
    expect(isAnalysisComplete(EMPTY_ANALYSIS)).toBe(false);
  });

  it("returns false with empty summary", () => {
    expect(
      isAnalysisComplete({ ...TEMPLATE_ANALYSIS, summary: "" })
    ).toBe(false);
  });

  it("returns false with empty strengths", () => {
    expect(
      isAnalysisComplete({ ...TEMPLATE_ANALYSIS, strengths: [] })
    ).toBe(false);
  });
});

describe("sourceLabel", () => {
  it("returns Claude AI for claude source", () => {
    expect(sourceLabel("claude")).toBe("Claude AI");
  });

  it("returns Template for template source", () => {
    expect(sourceLabel("template")).toBe("Template");
  });
});

describe("score_insights", () => {
  it("each insight has criterion, value, insight", () => {
    TEMPLATE_ANALYSIS.score_insights.forEach((insight) => {
      expect(insight).toHaveProperty("criterion");
      expect(insight).toHaveProperty("value");
      expect(insight).toHaveProperty("insight");
      expect(typeof insight.criterion).toBe("string");
      expect(typeof insight.value).toBe("number");
      expect(typeof insight.insight).toBe("string");
    });
  });

  it("values are in 0-100 range", () => {
    TEMPLATE_ANALYSIS.score_insights.forEach((insight) => {
      expect(insight.value).toBeGreaterThanOrEqual(0);
      expect(insight.value).toBeLessThanOrEqual(100);
    });
  });

  it("assigns correct colors based on value", () => {
    // 85 -> green, 60 -> amber, 45 -> orange
    const colors = TEMPLATE_ANALYSIS.score_insights.map((i) =>
      scoreColor(i.value)
    );
    expect(colors[0]).toBe("#10b981"); // 85
    expect(colors[1]).toBe("#f59e0b"); // 60
    expect(colors[2]).toBe("#f97316"); // 45
  });
});

describe("phase_summary", () => {
  it("has bloc completion info", () => {
    expect(TEMPLATE_ANALYSIS.phase_summary).toContain("blocs termines");
  });

  it("can be empty string", () => {
    expect(EMPTY_ANALYSIS.phase_summary).toBe("");
  });
});
