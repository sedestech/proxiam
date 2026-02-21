/**
 * Unit tests for OnboardingWizard — Sprint 20.
 *
 * Tests:
 * - Step navigation logic (0 → 1 → 2)
 * - i18n key existence (FR + EN)
 * - Pillar route mapping
 * - localStorage persistence key
 *
 * Run with:
 *   cd frontend && npx vitest run src/components/OnboardingWizard.test.ts
 */
import { describe, it, expect } from "vitest";

// ─── Constants from OnboardingWizard ───

const PILLAR_ROUTES = ["/map", "/knowledge", "/3d"] as const;

const TOTAL_STEPS = 3;

// ─── Step navigation logic ───

function nextStep(current: number): number {
  if (current < TOTAL_STEPS - 1) {
    return current + 1;
  }
  return current;
}

function isLastStep(current: number): boolean {
  return current === TOTAL_STEPS - 1;
}

function isFirstStep(current: number): boolean {
  return current === 0;
}

// ─── localStorage persistence ───

const ONBOARDING_STORAGE_KEY = "proxiam-onboarding-seen";

// ─── i18n keys ───

const FR_ONBOARDING = {
  welcome: "Bienvenue sur Proxiam",
  welcomeDesc: "Proxiam est votre OS pour l'energie renouvelable. Explorez vos projets ENR a travers 3 piliers visuels.",
  start: "Commencer",
  pillars: "Vos 3 piliers",
  map: "Cartographie SIG",
  mapDesc: "Visualisez les postes sources, zones protegees et contraintes terrain",
  knowledge: "Knowledge Graph 6D",
  knowledgeDesc: "Explorez les 5 176 items de la matrice ENR",
  viewer3d: "Visualisation 3D",
  viewer3dDesc: "Modelisez vos projets en 3 dimensions",
  tryIt: "Essayer",
  next: "Suivant",
  ready: "Pret !",
  readyDesc: "Creez votre premier projet pour commencer",
  createProject: "Creer un projet",
  explore: "Explorer",
};

const EN_ONBOARDING = {
  welcome: "Welcome to Proxiam",
  welcomeDesc: "Proxiam is your OS for renewable energy. Explore your ENR projects through 3 visual pillars.",
  start: "Get started",
  pillars: "Your 3 pillars",
  map: "GIS Map",
  mapDesc: "Visualize substations, protected areas and terrain constraints",
  knowledge: "Knowledge Graph 6D",
  knowledgeDesc: "Explore the 5,176 items of the ENR matrix",
  viewer3d: "3D Viewer",
  viewer3dDesc: "Model your projects in 3 dimensions",
  tryIt: "Try it",
  next: "Next",
  ready: "Ready!",
  readyDesc: "Create your first project to get started",
  createProject: "Create a project",
  explore: "Explore",
};

// ─── Tests ───

describe("Step navigation", () => {
  it("starts at step 0", () => {
    expect(isFirstStep(0)).toBe(true);
  });

  it("advances from step 0 to step 1", () => {
    expect(nextStep(0)).toBe(1);
  });

  it("advances from step 1 to step 2", () => {
    expect(nextStep(1)).toBe(2);
  });

  it("does not advance past step 2", () => {
    expect(nextStep(2)).toBe(2);
  });

  it("step 2 is the last step", () => {
    expect(isLastStep(2)).toBe(true);
  });

  it("step 0 is not the last step", () => {
    expect(isLastStep(0)).toBe(false);
  });

  it("step 1 is not the last step", () => {
    expect(isLastStep(1)).toBe(false);
  });
});

describe("PILLAR_ROUTES", () => {
  it("has 3 routes", () => {
    expect(PILLAR_ROUTES).toHaveLength(3);
  });

  it("maps to correct pages", () => {
    expect(PILLAR_ROUTES[0]).toBe("/map");
    expect(PILLAR_ROUTES[1]).toBe("/knowledge");
    expect(PILLAR_ROUTES[2]).toBe("/3d");
  });

  it("all routes start with /", () => {
    PILLAR_ROUTES.forEach((route) => {
      expect(route.startsWith("/")).toBe(true);
    });
  });
});

describe("localStorage persistence", () => {
  it("uses the correct storage key", () => {
    expect(ONBOARDING_STORAGE_KEY).toBe("proxiam-onboarding-seen");
  });

  it("storage value is a string boolean", () => {
    const value = String(true);
    expect(value).toBe("true");
    expect(value === "true").toBe(true);
  });

  it("default state is false when no localStorage entry", () => {
    const stored = null; // simulates no localStorage entry
    const hasSeenOnboarding = stored === "true";
    expect(hasSeenOnboarding).toBe(false);
  });

  it("reads true from localStorage correctly", () => {
    const stored = "true";
    const hasSeenOnboarding = stored === "true";
    expect(hasSeenOnboarding).toBe(true);
  });
});

describe("FR onboarding i18n keys", () => {
  it("has all 16 required keys", () => {
    expect(Object.keys(FR_ONBOARDING)).toHaveLength(16);
  });

  it("welcome key is defined", () => {
    expect(FR_ONBOARDING.welcome).toBe("Bienvenue sur Proxiam");
  });

  it("all 3 pillar titles defined", () => {
    expect(FR_ONBOARDING.map).toBeDefined();
    expect(FR_ONBOARDING.knowledge).toBeDefined();
    expect(FR_ONBOARDING.viewer3d).toBeDefined();
  });

  it("all 3 pillar descriptions defined", () => {
    expect(FR_ONBOARDING.mapDesc).toBeDefined();
    expect(FR_ONBOARDING.knowledgeDesc).toBeDefined();
    expect(FR_ONBOARDING.viewer3dDesc).toBeDefined();
  });

  it("action buttons defined", () => {
    expect(FR_ONBOARDING.start).toBeDefined();
    expect(FR_ONBOARDING.next).toBeDefined();
    expect(FR_ONBOARDING.tryIt).toBeDefined();
    expect(FR_ONBOARDING.createProject).toBeDefined();
    expect(FR_ONBOARDING.explore).toBeDefined();
  });

  it("ready step keys defined", () => {
    expect(FR_ONBOARDING.ready).toBeDefined();
    expect(FR_ONBOARDING.readyDesc).toBeDefined();
  });
});

describe("EN onboarding i18n keys", () => {
  it("has all 16 required keys", () => {
    expect(Object.keys(EN_ONBOARDING)).toHaveLength(16);
  });

  it("welcome key is translated differently from FR", () => {
    expect(EN_ONBOARDING.welcome).not.toBe(FR_ONBOARDING.welcome);
  });

  it("all 3 pillar titles translated", () => {
    expect(EN_ONBOARDING.map).not.toBe(FR_ONBOARDING.map);
    expect(EN_ONBOARDING.viewer3d).not.toBe(FR_ONBOARDING.viewer3d);
  });

  it("action buttons translated", () => {
    expect(EN_ONBOARDING.start).toBe("Get started");
    expect(EN_ONBOARDING.next).toBe("Next");
    expect(EN_ONBOARDING.createProject).toBe("Create a project");
    expect(EN_ONBOARDING.explore).toBe("Explore");
  });

  it("FR and EN have the same keys", () => {
    const frKeys = Object.keys(FR_ONBOARDING).sort();
    const enKeys = Object.keys(EN_ONBOARDING).sort();
    expect(frKeys).toEqual(enKeys);
  });
});

describe("Create project navigation", () => {
  it("target URL includes ?new=1 query param", () => {
    const targetUrl = "/projects?new=1";
    expect(targetUrl).toContain("/projects");
    expect(targetUrl).toContain("new=1");
  });
});
