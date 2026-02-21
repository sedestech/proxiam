/**
 * Unit tests for Sprint 15 financial UI logic.
 *
 * Tests:
 * - EUR formatting
 * - Profitability badge
 * - LCOE display
 * - Revenue breakdown
 * - TRI classification
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Financial.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions extracted from financial display ───

function formatEur(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M EUR`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} k EUR`;
  return `${Math.round(value)} EUR`;
}

function formatEurShort(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${Math.round(value)}`;
}

function profitabilityBadge(
  rentable: boolean
): { text: string; color: string } {
  if (rentable) {
    return { text: "RENTABLE", color: "bg-emerald-100 text-emerald-700" };
  }
  return { text: "NON RENTABLE", color: "bg-red-100 text-red-700" };
}

function triColor(tri_pct: number): string {
  if (tri_pct >= 10) return "text-emerald-600";
  if (tri_pct >= 6) return "text-emerald-500";
  if (tri_pct >= 3) return "text-amber-500";
  return "text-red-500";
}

function lcoeLabel(lcoe: number, filiere: string): string {
  if (filiere === "bess") return "N/A (BESS)";
  if (lcoe === 0) return "—";
  return `${lcoe} EUR/MWh`;
}

function paybackLabel(years: number | null): string {
  if (years === null) return "Non calculable";
  if (years <= 10) return `${years} ans (bon)`;
  if (years <= 15) return `${years} ans (moyen)`;
  return `${years} ans (long)`;
}

function capexPerKwc(total_eur: number, puissance_mwc: number): number {
  if (puissance_mwc <= 0) return 0;
  return Math.round(total_eur / (puissance_mwc * 1000));
}

function cashflowPositive(
  revenu_annuel: number,
  opex_annuel: number
): boolean {
  return revenu_annuel > opex_annuel;
}

// ─── Tests ───

describe("formatEur", () => {
  it("formats millions", () => {
    expect(formatEur(8_500_000)).toBe("8.5 M EUR");
  });

  it("formats thousands", () => {
    expect(formatEur(150_000)).toBe("150 k EUR");
  });

  it("formats small amounts", () => {
    expect(formatEur(750)).toBe("750 EUR");
  });

  it("formats zero", () => {
    expect(formatEur(0)).toBe("0 EUR");
  });
});

describe("formatEurShort", () => {
  it("formats millions short", () => {
    expect(formatEurShort(10_000_000)).toBe("10.0M");
  });

  it("formats thousands short", () => {
    expect(formatEurShort(500_000)).toBe("500k");
  });
});

describe("profitabilityBadge", () => {
  it("returns green for profitable", () => {
    const badge = profitabilityBadge(true);
    expect(badge.text).toBe("RENTABLE");
    expect(badge.color).toContain("emerald");
  });

  it("returns red for not profitable", () => {
    const badge = profitabilityBadge(false);
    expect(badge.text).toBe("NON RENTABLE");
    expect(badge.color).toContain("red");
  });
});

describe("triColor", () => {
  it("returns emerald-600 for high TRI", () => {
    expect(triColor(12)).toBe("text-emerald-600");
  });

  it("returns emerald-500 for above WACC", () => {
    expect(triColor(7)).toBe("text-emerald-500");
  });

  it("returns amber for marginal TRI", () => {
    expect(triColor(4)).toBe("text-amber-500");
  });

  it("returns red for very low TRI", () => {
    expect(triColor(1)).toBe("text-red-500");
  });
});

describe("lcoeLabel", () => {
  it("returns N/A for BESS", () => {
    expect(lcoeLabel(0, "bess")).toBe("N/A (BESS)");
  });

  it("returns formatted value for solar", () => {
    expect(lcoeLabel(45.2, "solaire_sol")).toBe("45.2 EUR/MWh");
  });

  it("returns dash for zero non-BESS", () => {
    expect(lcoeLabel(0, "solaire_sol")).toBe("—");
  });
});

describe("paybackLabel", () => {
  it("labels short payback as good", () => {
    expect(paybackLabel(8)).toContain("bon");
  });

  it("labels medium payback", () => {
    expect(paybackLabel(12)).toContain("moyen");
  });

  it("labels long payback", () => {
    expect(paybackLabel(20)).toContain("long");
  });

  it("handles null", () => {
    expect(paybackLabel(null)).toBe("Non calculable");
  });
});

describe("capexPerKwc", () => {
  it("calculates correct unit cost", () => {
    // 8.5M EUR for 10 MWc = 850 EUR/kWc
    expect(capexPerKwc(8_500_000, 10)).toBe(850);
  });

  it("handles zero puissance", () => {
    expect(capexPerKwc(8_500_000, 0)).toBe(0);
  });
});

describe("cashflowPositive", () => {
  it("returns true when revenue exceeds OPEX", () => {
    expect(cashflowPositive(1_200_000, 200_000)).toBe(true);
  });

  it("returns false when OPEX exceeds revenue", () => {
    expect(cashflowPositive(100_000, 200_000)).toBe(false);
  });
});

describe("financial data structure", () => {
  it("parses a complete financial response", () => {
    const response = {
      projet_id: "abc-123",
      filiere: "solaire_sol",
      puissance_mwc: 10,
      enriched: true,
      capex: {
        installation_eur: { min: 6_500_000, median: 7_500_000, max: 9_500_000 },
        raccordement_eur: 1_000_000,
        total_eur: 8_500_000,
        eur_par_kwc: 850,
        tendance: "baisse (-5%/an)",
        source: "CRE AO 2024 + ADEME",
      },
      opex: {
        annuel_eur: 127_500,
        pct_capex: 1.5,
        lifetime_total_eur: 3_825_000,
      },
      revenus: {
        annuel_eur: 674_520,
        production_mwh_an: 12_264,
        prix_moyen_mwh: 55,
        mecanisme: "tarif CRE AO (scenario de base)",
        detail: {
          cre_ao: 674_520,
          ppa: 613_200,
          marche: 797_160,
        },
      },
      lcoe_eur_mwh: 49.5,
      tri: {
        tri_pct: 4.8,
        payback_years: 15.5,
        rentable: false,
        cashflow_annuel_eur: 547_020,
      },
      lifetime_years: 30,
      assumptions: {
        discount_rate_pct: 6,
        productible_source: "pvgis",
        distance_poste_km: 3.5,
        bess_heures_stockage: null,
      },
      disclaimer: "Estimation indicative...",
    };

    expect(response.capex.total_eur).toBe(8_500_000);
    expect(formatEur(response.capex.total_eur)).toBe("8.5 M EUR");
    expect(response.tri.rentable).toBe(false);
    expect(profitabilityBadge(response.tri.rentable).text).toBe("NON RENTABLE");
    expect(triColor(response.tri.tri_pct)).toBe("text-amber-500");
    expect(lcoeLabel(response.lcoe_eur_mwh, response.filiere)).toBe(
      "49.5 EUR/MWh"
    );
    expect(cashflowPositive(response.revenus.annuel_eur, response.opex.annuel_eur)).toBe(true);
    expect(response.assumptions.discount_rate_pct).toBe(6);
    expect(response.lifetime_years).toBe(30);
  });

  it("handles BESS financial data", () => {
    const response = {
      filiere: "bess",
      lcoe_eur_mwh: 0,
      tri: { tri_pct: 8.5, rentable: true, payback_years: 7.2, cashflow_annuel_eur: 500_000 },
      lifetime_years: 15,
    };

    expect(lcoeLabel(response.lcoe_eur_mwh, response.filiere)).toBe("N/A (BESS)");
    expect(response.tri.rentable).toBe(true);
    expect(profitabilityBadge(response.tri.rentable).color).toContain("emerald");
    expect(paybackLabel(response.tri.payback_years)).toContain("bon");
  });
});
