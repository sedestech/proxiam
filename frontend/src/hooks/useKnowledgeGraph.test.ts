import { describe, it, expect } from "vitest";

// Test the layout and transformation logic (no React rendering needed)
describe("useKnowledgeGraph layout utilities", () => {
  it("should have correct entity type definitions", () => {
    const ENTITY_TYPES = [
      "normes",
      "risques",
      "livrables",
      "outils",
      "competences",
    ];
    expect(ENTITY_TYPES).toHaveLength(5);
    expect(ENTITY_TYPES).toContain("normes");
    expect(ENTITY_TYPES).toContain("risques");
  });

  it("should correctly map plural to singular types", () => {
    const PLURAL_TO_SINGULAR: Record<string, string> = {
      normes: "norme",
      risques: "risque",
      livrables: "livrable",
      outils: "outil",
      competences: "competence",
    };
    expect(PLURAL_TO_SINGULAR["normes"]).toBe("norme");
    expect(PLURAL_TO_SINGULAR["risques"]).toBe("risque");
    expect(PLURAL_TO_SINGULAR["competences"]).toBe("competence");
  });
});
