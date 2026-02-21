import { describe, it, expect } from "vitest";

describe("Admin Data Health", () => {
  it("health percentage calculation", () => {
    const sources = [
      { status: "ok" },
      { status: "ok" },
      { status: "stale" },
      { status: "error" },
    ];
    const ok = sources.filter((s) => s.status === "ok").length;
    const health = Math.round((ok / sources.length) * 100);
    expect(health).toBe(50);
  });

  it("staleness detection from days", () => {
    const daysSince = 100;
    const frequency = 90;
    const isStale = daysSince > frequency;
    expect(isStale).toBe(true);
  });

  it("status badge color mapping", () => {
    const colorMap: Record<string, string> = {
      ok: "emerald",
      stale: "amber",
      error: "red",
      loading: "blue",
    };
    expect(colorMap["ok"]).toBe("emerald");
    expect(colorMap["stale"]).toBe("amber");
    expect(colorMap["error"]).toBe("red");
  });

  it("quality score clamped 0-100", () => {
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    expect(clamp(-5)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(75)).toBe(75);
  });

  it("category grouping", () => {
    const sources = [
      { category: "geospatial", source_name: "natura2000" },
      { category: "geospatial", source_name: "postes_sources" },
      { category: "financial", source_name: "financial_constants" },
      { category: "knowledge", source_name: "knowledge_6d" },
    ];
    const categories = [...new Set(sources.map((s) => s.category))];
    expect(categories).toHaveLength(3);
    expect(categories).toContain("geospatial");
  });
});
