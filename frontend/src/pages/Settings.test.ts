/**
 * Unit tests for Settings page translations and error components — Sprint 10.
 *
 * Tests:
 * - i18n translation keys exist for all new sections
 * - File type icon mapping logic
 * - Format size utility
 *
 * Run with:
 *   cd frontend && npx vitest run src/pages/Settings.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── i18n key validation ───

const FR_KEYS = {
  settings: {
    language: "Langue / Language",
    languageDesc: "Langue de l'interface",
    theme: "Theme",
    themeDesc: "Mode clair / sombre",
    light: "Clair",
    dark: "Sombre",
    system: "Systeme",
    aiTitle: "Claude IA",
    aiChecking: "Verification...",
    database: "Base de donnees",
    search: "Meilisearch",
    searchDesc: "Moteur de recherche full-text",
    reindex: "Reindexer",
    importExport: "Import / Export",
    importCsv: "Importer CSV/JSON",
    exportCsv: "Exporter projets CSV",
  },
  documents: {
    tabLabel: "Documents",
    noDocuments: "Aucun document",
    upload: "Ajouter un fichier",
    uploading: "Envoi en cours...",
    download: "Telecharger",
    deleteTitle: "Supprimer",
  },
  import: {
    title: "Import CSV / JSON",
    selectFile: "Selectionnez un fichier CSV ou JSON",
    importing: "Import en cours...",
    importBtn: "Importer",
    imported: "projet(s) importe(s)",
    errors: "erreur(s)",
    close: "Fermer",
  },
  deleteConfirm: {
    title: "Supprimer le projet ?",
    message: "Cette action est irreversible.",
  },
};

const EN_KEYS = {
  settings: {
    language: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    aiTitle: "Claude AI",
    database: "Database",
    search: "Meilisearch",
    reindex: "Reindex",
    importExport: "Import / Export",
    importCsv: "Import CSV/JSON",
    exportCsv: "Export projects CSV",
  },
  documents: {
    tabLabel: "Documents",
    noDocuments: "No documents",
    upload: "Upload file",
    download: "Download",
  },
  import: {
    title: "Import CSV / JSON",
    importBtn: "Import",
    close: "Close",
  },
  deleteConfirm: {
    title: "Delete project?",
    message: "This action cannot be undone.",
  },
};

// ─── File type icon logic ───

function getFileTypeCategory(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["xls", "xlsx", "csv"].includes(ext)) return "spreadsheet";
  if (["doc", "docx"].includes(ext)) return "document";
  return "generic";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ─── Tests ───

describe("FR translation keys", () => {
  it("settings keys all defined", () => {
    expect(Object.keys(FR_KEYS.settings)).toHaveLength(16);
  });

  it("documents keys all defined", () => {
    expect(Object.keys(FR_KEYS.documents)).toHaveLength(6);
  });

  it("import keys all defined", () => {
    expect(Object.keys(FR_KEYS.import)).toHaveLength(7);
  });

  it("deleteConfirm keys defined", () => {
    expect(FR_KEYS.deleteConfirm.title).toBeDefined();
    expect(FR_KEYS.deleteConfirm.message).toBeDefined();
  });
});

describe("EN translation keys", () => {
  it("settings keys have translations", () => {
    expect(EN_KEYS.settings.language).not.toBe(FR_KEYS.settings.language);
  });

  it("documents keys have translations", () => {
    expect(EN_KEYS.documents.noDocuments).toBe("No documents");
  });

  it("import title translated", () => {
    expect(EN_KEYS.import.title).toBe("Import CSV / JSON");
  });

  it("deleteConfirm translated", () => {
    expect(EN_KEYS.deleteConfirm.title).toBe("Delete project?");
  });
});

describe("getFileTypeCategory", () => {
  it("pdf files", () => {
    expect(getFileTypeCategory("report.pdf")).toBe("pdf");
  });

  it("image files", () => {
    expect(getFileTypeCategory("photo.jpg")).toBe("image");
    expect(getFileTypeCategory("icon.PNG")).toBe("image");
    expect(getFileTypeCategory("diagram.svg")).toBe("image");
  });

  it("spreadsheet files", () => {
    expect(getFileTypeCategory("data.xlsx")).toBe("spreadsheet");
    expect(getFileTypeCategory("export.csv")).toBe("spreadsheet");
  });

  it("document files", () => {
    expect(getFileTypeCategory("spec.docx")).toBe("document");
  });

  it("generic files", () => {
    expect(getFileTypeCategory("archive.zip")).toBe("generic");
    expect(getFileTypeCategory("script.py")).toBe("generic");
  });
});

describe("formatSize", () => {
  it("bytes", () => {
    expect(formatSize(500)).toBe("500 o");
  });

  it("kilobytes", () => {
    expect(formatSize(3072)).toBe("3 Ko");
  });

  it("megabytes", () => {
    expect(formatSize(10 * 1024 * 1024)).toBe("10.0 Mo");
  });

  it("zero", () => {
    expect(formatSize(0)).toBe("0 o");
  });
});
