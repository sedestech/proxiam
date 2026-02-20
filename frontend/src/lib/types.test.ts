import { describe, it, expect } from "vitest";
import { ENTITY_COLORS, BLOC_INFO, PHASE_COLORS } from "./types";

describe("types constants", () => {
  it("ENTITY_COLORS has all required types", () => {
    const requiredTypes = [
      "bloc",
      "phase",
      "norme",
      "risque",
      "livrable",
      "outil",
      "competence",
    ];
    for (const type of requiredTypes) {
      expect(ENTITY_COLORS[type]).toBeDefined();
      expect(typeof ENTITY_COLORS[type]).toBe("string");
      expect(ENTITY_COLORS[type]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("BLOC_INFO has entries for B1-B8", () => {
    for (let i = 1; i <= 8; i++) {
      const code = `B${i}`;
      expect(BLOC_INFO[code]).toBeDefined();
      expect(BLOC_INFO[code].label).toBeTruthy();
      expect(BLOC_INFO[code].description).toBeTruthy();
    }
  });

  it("PHASE_COLORS has entries for P0-P7", () => {
    for (let i = 0; i <= 7; i++) {
      const code = `P${i}`;
      expect(PHASE_COLORS[code]).toBeDefined();
    }
  });
});
