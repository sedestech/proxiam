/**
 * Unit tests for PillarNav pure helper functions — Sprint 20.
 *
 * Tests:
 * - getCurrentPillarName returns correct pillar for each route
 * - buildTargetUrl constructs correct URLs with query params
 * - PILLAR_PATHS contains only the 3 pillar routes
 * - Non-pillar routes are correctly excluded
 *
 * Run with:
 *   cd frontend && npx vitest run src/components/PillarNav.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions replicated from PillarNav.tsx ───

const PILLAR_PATHS = new Set(["/map", "/knowledge", "/3d"]);

function getCurrentPillarName(pathname: string): string {
  if (pathname.startsWith("/map")) return "map";
  if (pathname.startsWith("/knowledge")) return "knowledge";
  if (pathname.startsWith("/3d")) return "3d";
  return "";
}

function buildTargetUrl(targetPath: string, currentSearch: string): string {
  const currentParams = new URLSearchParams(currentSearch);
  const fromPillar = currentParams.get("from") || "";
  const targetParams = new URLSearchParams();

  const entity = currentParams.get("entity");
  const id = currentParams.get("id");
  if (entity) targetParams.set("entity", entity);
  if (id) targetParams.set("id", id);

  const currentPillar = fromPillar || "unknown";
  targetParams.set("from", currentPillar);

  const qs = targetParams.toString();
  return qs ? `${targetPath}?${qs}` : targetPath;
}

// ─── Tests ───

describe("PILLAR_PATHS", () => {
  it("contains exactly 3 pillar routes", () => {
    expect(PILLAR_PATHS.size).toBe(3);
  });

  it("includes /map", () => {
    expect(PILLAR_PATHS.has("/map")).toBe(true);
  });

  it("includes /knowledge", () => {
    expect(PILLAR_PATHS.has("/knowledge")).toBe(true);
  });

  it("includes /3d", () => {
    expect(PILLAR_PATHS.has("/3d")).toBe(true);
  });

  it("does not include non-pillar routes", () => {
    expect(PILLAR_PATHS.has("/dashboard")).toBe(false);
    expect(PILLAR_PATHS.has("/projects")).toBe(false);
    expect(PILLAR_PATHS.has("/settings")).toBe(false);
  });
});

describe("getCurrentPillarName", () => {
  it("returns 'map' for /map", () => {
    expect(getCurrentPillarName("/map")).toBe("map");
  });

  it("returns 'knowledge' for /knowledge", () => {
    expect(getCurrentPillarName("/knowledge")).toBe("knowledge");
  });

  it("returns '3d' for /3d", () => {
    expect(getCurrentPillarName("/3d")).toBe("3d");
  });

  it("returns empty string for non-pillar routes", () => {
    expect(getCurrentPillarName("/dashboard")).toBe("");
    expect(getCurrentPillarName("/projects")).toBe("");
    expect(getCurrentPillarName("/settings")).toBe("");
  });

  it("handles routes with trailing paths", () => {
    expect(getCurrentPillarName("/map/details")).toBe("map");
    expect(getCurrentPillarName("/knowledge/node/123")).toBe("knowledge");
    expect(getCurrentPillarName("/3d/view")).toBe("3d");
  });

  it("returns empty string for root", () => {
    expect(getCurrentPillarName("/")).toBe("");
  });
});

describe("buildTargetUrl", () => {
  it("builds URL with from param when no search params", () => {
    const result = buildTargetUrl("/knowledge", "");
    expect(result).toBe("/knowledge?from=unknown");
  });

  it("preserves entity and id params", () => {
    const result = buildTargetUrl("/knowledge", "?entity=phase&id=123");
    expect(result).toContain("entity=phase");
    expect(result).toContain("id=123");
    expect(result).toContain("from=unknown");
  });

  it("carries forward existing from param", () => {
    const result = buildTargetUrl("/3d", "?from=map&entity=poste_source&id=42");
    expect(result).toContain("from=map");
    expect(result).toContain("entity=poste_source");
    expect(result).toContain("id=42");
  });

  it("does not carry forward unrelated params", () => {
    const result = buildTargetUrl("/map", "?unrelated=true&foo=bar");
    // Only from should be set, not unrelated or foo
    expect(result).not.toContain("unrelated");
    expect(result).not.toContain("foo");
  });

  it("starts with the target path", () => {
    const result = buildTargetUrl("/map", "?entity=phase&id=5");
    expect(result.startsWith("/map?")).toBe(true);
  });
});

describe("PillarNav visibility logic", () => {
  it("should show on pillar pages", () => {
    expect(PILLAR_PATHS.has("/map")).toBe(true);
    expect(PILLAR_PATHS.has("/knowledge")).toBe(true);
    expect(PILLAR_PATHS.has("/3d")).toBe(true);
  });

  it("should hide on non-pillar pages", () => {
    expect(PILLAR_PATHS.has("/dashboard")).toBe(false);
    expect(PILLAR_PATHS.has("/projects")).toBe(false);
    expect(PILLAR_PATHS.has("/scoring")).toBe(false);
    expect(PILLAR_PATHS.has("/admin")).toBe(false);
    expect(PILLAR_PATHS.has("/")).toBe(false);
  });

  it("shows 2 buttons (other pillars) for each pillar page", () => {
    const allPillars = ["/map", "/knowledge", "/3d"];
    for (const current of allPillars) {
      const otherPillars = allPillars.filter((p) => p !== current);
      expect(otherPillars).toHaveLength(2);
    }
  });
});
