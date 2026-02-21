/**
 * Unit tests for batch scoring UI logic — Sprint 12.
 *
 * Tests:
 * - Selection state management (add/remove/toggle all/clear)
 * - Score range filter parsing from URL params
 * - Score range display formatting
 * - Batch request payload construction
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/BatchScoring.test.ts
 */

import { describe, it, expect } from "vitest";

// ─── Selection state helpers ───

function toggleSelection(selected: Set<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

function selectAll(ids: string[]): Set<string> {
  return new Set(ids);
}

function clearSelection(): Set<string> {
  return new Set();
}

// ─── Score range parsing ───

function parseScoreRange(params: URLSearchParams): { min: number | null; max: number | null } {
  const minStr = params.get("score_min");
  const maxStr = params.get("score_max");
  return {
    min: minStr !== null ? parseInt(minStr, 10) : null,
    max: maxStr !== null ? parseInt(maxStr, 10) : null,
  };
}

function formatScoreRange(min: number | null, max: number | null): string {
  if (min !== null && max !== null) return `${min}–${max}`;
  if (min !== null) return `≥ ${min}`;
  if (max !== null) return `≤ ${max}`;
  return "";
}

function parseBucketLabel(label: string): { min: number; max: number } | null {
  if (label === "unscored") return null;
  const parts = label.split("-").map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  return { min: parts[0], max: parts[1] };
}

// ─── Batch payload ───

function buildBatchPayload(selected: Set<string>): { projet_ids: string[] } {
  return { projet_ids: Array.from(selected) };
}

// ─── Tests ───

describe("Selection state management", () => {
  it("adds an item to empty selection", () => {
    const result = toggleSelection(new Set(), "abc");
    expect(result.has("abc")).toBe(true);
    expect(result.size).toBe(1);
  });

  it("removes an existing item", () => {
    const result = toggleSelection(new Set(["abc"]), "abc");
    expect(result.has("abc")).toBe(false);
    expect(result.size).toBe(0);
  });

  it("select all adds all IDs", () => {
    const ids = ["a", "b", "c"];
    const result = selectAll(ids);
    expect(result.size).toBe(3);
    ids.forEach((id) => expect(result.has(id)).toBe(true));
  });

  it("clear removes everything", () => {
    const result = clearSelection();
    expect(result.size).toBe(0);
  });

  it("toggle preserves other selections", () => {
    const initial = new Set(["a", "b", "c"]);
    const result = toggleSelection(initial, "b");
    expect(result.has("a")).toBe(true);
    expect(result.has("b")).toBe(false);
    expect(result.has("c")).toBe(true);
  });
});

describe("Score range parsing", () => {
  it("parses both min and max", () => {
    const params = new URLSearchParams("score_min=40&score_max=80");
    const { min, max } = parseScoreRange(params);
    expect(min).toBe(40);
    expect(max).toBe(80);
  });

  it("parses min only", () => {
    const params = new URLSearchParams("score_min=60");
    const { min, max } = parseScoreRange(params);
    expect(min).toBe(60);
    expect(max).toBeNull();
  });

  it("parses max only", () => {
    const params = new URLSearchParams("score_max=50");
    const { min, max } = parseScoreRange(params);
    expect(min).toBeNull();
    expect(max).toBe(50);
  });

  it("returns null for no params", () => {
    const params = new URLSearchParams("");
    const { min, max } = parseScoreRange(params);
    expect(min).toBeNull();
    expect(max).toBeNull();
  });
});

describe("Score range formatting", () => {
  it("formats range with both values", () => {
    expect(formatScoreRange(40, 80)).toBe("40–80");
  });

  it("formats min only", () => {
    expect(formatScoreRange(60, null)).toBe("≥ 60");
  });

  it("formats max only", () => {
    expect(formatScoreRange(null, 50)).toBe("≤ 50");
  });

  it("returns empty for no values", () => {
    expect(formatScoreRange(null, null)).toBe("");
  });
});

describe("Bucket label parsing", () => {
  it("parses valid bucket", () => {
    expect(parseBucketLabel("60-79")).toEqual({ min: 60, max: 79 });
  });

  it("parses 0-19 bucket", () => {
    expect(parseBucketLabel("0-19")).toEqual({ min: 0, max: 19 });
  });

  it("parses 80-100 bucket", () => {
    expect(parseBucketLabel("80-100")).toEqual({ min: 80, max: 100 });
  });

  it("returns null for unscored", () => {
    expect(parseBucketLabel("unscored")).toBeNull();
  });

  it("returns null for invalid format", () => {
    expect(parseBucketLabel("abc")).toBeNull();
  });
});

describe("Batch payload construction", () => {
  it("builds payload from selection", () => {
    const selected = new Set(["id1", "id2", "id3"]);
    const payload = buildBatchPayload(selected);
    expect(payload.projet_ids).toHaveLength(3);
    expect(payload.projet_ids).toContain("id1");
    expect(payload.projet_ids).toContain("id2");
  });

  it("builds empty payload from empty selection", () => {
    const payload = buildBatchPayload(new Set());
    expect(payload.projet_ids).toHaveLength(0);
  });

  it("deduplicates (Set guarantees uniqueness)", () => {
    const selected = new Set(["id1", "id1", "id2"]);
    const payload = buildBatchPayload(selected);
    expect(payload.projet_ids).toHaveLength(2);
  });
});
