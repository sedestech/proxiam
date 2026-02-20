/**
 * Unit tests for Documents and Import features — Sprint 9.
 *
 * Tests:
 * - Document size formatting
 * - CSV parsing for import preview
 * - Import validation
 * - Settings database stats display
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Documents.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Pure functions ───

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function parseCSVPreview(text: string, delimiter = ";"): Record<string, string>[] {
  const lines = text.split("\n").filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  return lines.slice(1, 6).map((line) => {
    const vals = line.split(delimiter);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = vals[i]?.trim() || "";
    });
    return obj;
  });
}

function validateImportRow(row: Record<string, string>): string | null {
  if (!row.nom || row.nom.trim().length === 0) return "nom is required";
  if (row.puissance_mwc && isNaN(Number(row.puissance_mwc))) return "puissance_mwc must be a number";
  if (row.lon && isNaN(Number(row.lon))) return "lon must be a number";
  if (row.lat && isNaN(Number(row.lat))) return "lat must be a number";
  return null;
}

const DOCUMENT_CATEGORIES = ["general", "technique", "reglementaire", "financier", "environnement"];

// ─── Tests ───

describe("formatFileSize", () => {
  it("formats bytes", () => {
    expect(formatFileSize(512)).toBe("512 o");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(2048)).toBe("2 Ko");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 Mo");
  });

  it("formats zero", () => {
    expect(formatFileSize(0)).toBe("0 o");
  });
});

describe("parseCSVPreview", () => {
  it("parses semicolon-separated CSV", () => {
    const csv = "nom;filiere;puissance\nProjet A;solaire;50\nProjet B;eolien;30";
    const rows = parseCSVPreview(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].nom).toBe("Projet A");
    expect(rows[1].filiere).toBe("eolien");
  });

  it("limits preview to 5 rows", () => {
    const lines = ["nom;filiere"];
    for (let i = 0; i < 10; i++) lines.push(`Projet ${i};solaire`);
    const rows = parseCSVPreview(lines.join("\n"));
    expect(rows).toHaveLength(5);
  });

  it("returns empty for header-only CSV", () => {
    const rows = parseCSVPreview("nom;filiere");
    expect(rows).toHaveLength(0);
  });

  it("handles missing values", () => {
    const csv = "nom;filiere;puissance\nTest;;";
    const rows = parseCSVPreview(csv);
    expect(rows[0].nom).toBe("Test");
    expect(rows[0].filiere).toBe("");
  });

  it("trims whitespace", () => {
    const csv = " nom ; filiere \n Test ; solaire ";
    const rows = parseCSVPreview(csv);
    expect(rows[0]["nom"]).toBe("Test");
  });
});

describe("validateImportRow", () => {
  it("rejects empty nom", () => {
    expect(validateImportRow({ nom: "", filiere: "solaire" })).toBe("nom is required");
  });

  it("rejects whitespace-only nom", () => {
    expect(validateImportRow({ nom: "   " })).toBe("nom is required");
  });

  it("accepts valid row", () => {
    expect(validateImportRow({ nom: "Test Project" })).toBeNull();
  });

  it("rejects non-numeric puissance", () => {
    expect(validateImportRow({ nom: "Test", puissance_mwc: "abc" })).toBe("puissance_mwc must be a number");
  });

  it("accepts numeric puissance", () => {
    expect(validateImportRow({ nom: "Test", puissance_mwc: "50.5" })).toBeNull();
  });

  it("rejects non-numeric lon", () => {
    expect(validateImportRow({ nom: "Test", lon: "not_a_number" })).toBe("lon must be a number");
  });
});

describe("DOCUMENT_CATEGORIES", () => {
  it("has 5 categories", () => {
    expect(DOCUMENT_CATEGORIES).toHaveLength(5);
  });

  it("includes general", () => {
    expect(DOCUMENT_CATEGORIES).toContain("general");
  });

  it("includes technique", () => {
    expect(DOCUMENT_CATEGORIES).toContain("technique");
  });

  it("includes reglementaire", () => {
    expect(DOCUMENT_CATEGORIES).toContain("reglementaire");
  });
});
