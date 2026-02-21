/**
 * Unit tests for Sprint 13 enrichment UI logic.
 *
 * Tests:
 * - ghiColor: irradiation color coding
 * - ghiBg: irradiation background color
 * - constraint badge logic
 * - enrichment data parsing
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Enrichment.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions extracted from ProjectDetail ───

function ghiColor(ghi: number | null): string {
  if (ghi === null) return "text-slate-400";
  if (ghi >= 1400) return "text-emerald-600";
  if (ghi >= 1200) return "text-amber-600";
  return "text-red-500";
}

function ghiBg(ghi: number | null): string {
  if (ghi === null) return "bg-slate-50";
  if (ghi >= 1400) return "bg-emerald-50";
  if (ghi >= 1200) return "bg-amber-50";
  return "bg-red-50";
}

interface ConstraintSummary {
  total_constraints: number;
  in_zone: number;
  nearby: number;
}

function constraintSeverity(summary: ConstraintSummary): "danger" | "warning" | "safe" {
  if (summary.in_zone > 0) return "danger";
  if (summary.nearby > 0) return "warning";
  return "safe";
}

function formatDistance(distance_m: number): string {
  if (distance_m < 1000) return `${distance_m} m`;
  return `${(distance_m / 1000).toFixed(1)} km`;
}

interface EnrichmentData {
  enriched: boolean;
  pvgis?: {
    ghi_kwh_m2_an: number | null;
    productible_kwh_kwc_an: number | null;
    temperature_moyenne: number | null;
    source: string;
  };
  constraints?: {
    summary: ConstraintSummary;
  };
}

function isEnriched(data: EnrichmentData | null | undefined): boolean {
  return data?.enriched === true;
}

// ─── Tests ───

describe("ghiColor", () => {
  it("returns slate for null", () => {
    expect(ghiColor(null)).toBe("text-slate-400");
  });

  it("returns green for high GHI (>= 1400)", () => {
    expect(ghiColor(1500)).toBe("text-emerald-600");
    expect(ghiColor(1400)).toBe("text-emerald-600");
    expect(ghiColor(1700)).toBe("text-emerald-600");
  });

  it("returns amber for medium GHI (1200-1399)", () => {
    expect(ghiColor(1200)).toBe("text-amber-600");
    expect(ghiColor(1300)).toBe("text-amber-600");
    expect(ghiColor(1399)).toBe("text-amber-600");
  });

  it("returns red for low GHI (< 1200)", () => {
    expect(ghiColor(1100)).toBe("text-red-500");
    expect(ghiColor(900)).toBe("text-red-500");
  });
});

describe("ghiBg", () => {
  it("returns slate-50 for null", () => {
    expect(ghiBg(null)).toBe("bg-slate-50");
  });

  it("returns emerald-50 for high GHI", () => {
    expect(ghiBg(1500)).toBe("bg-emerald-50");
  });

  it("returns amber-50 for medium GHI", () => {
    expect(ghiBg(1300)).toBe("bg-amber-50");
  });

  it("returns red-50 for low GHI", () => {
    expect(ghiBg(1000)).toBe("bg-red-50");
  });
});

describe("constraintSeverity", () => {
  it("returns safe when no constraints", () => {
    expect(constraintSeverity({ total_constraints: 0, in_zone: 0, nearby: 0 })).toBe("safe");
  });

  it("returns warning when nearby but not in zone", () => {
    expect(constraintSeverity({ total_constraints: 2, in_zone: 0, nearby: 2 })).toBe("warning");
  });

  it("returns danger when in zone", () => {
    expect(constraintSeverity({ total_constraints: 1, in_zone: 1, nearby: 0 })).toBe("danger");
  });

  it("returns danger when both in zone and nearby", () => {
    expect(constraintSeverity({ total_constraints: 3, in_zone: 1, nearby: 2 })).toBe("danger");
  });
});

describe("formatDistance", () => {
  it("formats meters under 1000", () => {
    expect(formatDistance(500)).toBe("500 m");
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(999)).toBe("999 m");
  });

  it("formats kilometers for >= 1000", () => {
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(5500)).toBe("5.5 km");
    expect(formatDistance(12345)).toBe("12.3 km");
  });
});

describe("isEnriched", () => {
  it("returns false for null", () => {
    expect(isEnriched(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isEnriched(undefined)).toBe(false);
  });

  it("returns false when enriched is false", () => {
    expect(isEnriched({ enriched: false })).toBe(false);
  });

  it("returns true when enriched is true", () => {
    expect(isEnriched({ enriched: true })).toBe(true);
  });

  it("returns true with full enrichment data", () => {
    expect(
      isEnriched({
        enriched: true,
        pvgis: {
          ghi_kwh_m2_an: 1600,
          productible_kwh_kwc_an: 1350,
          temperature_moyenne: 14.5,
          source: "pvgis_api",
        },
        constraints: {
          summary: { total_constraints: 2, in_zone: 0, nearby: 2 },
        },
      })
    ).toBe(true);
  });
});

describe("enrichment data structure", () => {
  it("parses a complete enrichment response", () => {
    const response: EnrichmentData = {
      enriched: true,
      pvgis: {
        ghi_kwh_m2_an: 1650,
        productible_kwh_kwc_an: 1380,
        temperature_moyenne: 15.2,
        source: "pvgis_api",
      },
      constraints: {
        summary: { total_constraints: 1, in_zone: 0, nearby: 1 },
      },
    };

    expect(response.enriched).toBe(true);
    expect(response.pvgis!.ghi_kwh_m2_an).toBe(1650);
    expect(response.pvgis!.source).toBe("pvgis_api");
    expect(response.constraints!.summary.in_zone).toBe(0);
  });

  it("handles enrichment with fallback source", () => {
    const response: EnrichmentData = {
      enriched: true,
      pvgis: {
        ghi_kwh_m2_an: 1500,
        productible_kwh_kwc_an: 1250,
        temperature_moyenne: 13.0,
        source: "fallback_latitude",
      },
    };

    expect(response.pvgis!.source).toBe("fallback_latitude");
    expect(ghiColor(response.pvgis!.ghi_kwh_m2_an)).toBe("text-emerald-600");
  });
});
