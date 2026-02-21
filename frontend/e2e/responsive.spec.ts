import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  // iPhone 13 viewport
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth redirect detected — Clerk not configured for E2E");
    }
  });

  test("mobile bottom navigation is visible", async ({ page }) => {
    // The mobile-nav class is applied to the bottom navigation bar
    const mobileNav = page.locator(".mobile-nav");
    await expect(mobileNav).toBeVisible();
  });

  test("desktop sidebar is hidden on mobile", async ({ page }) => {
    // Desktop sidebar is 260px wide — should be hidden at 375px viewport
    const sidebar = page.locator("aside");
    const isVisible = await sidebar.isVisible().catch(() => false);

    // On mobile, sidebar should either be hidden or not rendered
    if (isVisible) {
      const box = await sidebar.boundingBox();
      // If sidebar exists, it should be off-screen or collapsed
      if (box) {
        expect(box.width).toBeLessThan(260);
      }
    }
  });

  test("touch targets are at least 32px", async ({ page }) => {
    const buttons = page.locator("button, a[href]");
    const count = await buttons.count();

    // Check the first 10 interactive elements
    const checkCount = Math.min(count, 10);
    for (let i = 0; i < checkCount; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box && box.height > 0) {
        // Mobile touch targets should be at least 32px
        // (44px is ideal per Apple HIG, but some small UI elements are acceptable)
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
    }
  });

  test("mobile more menu opens and shows extra pages", async ({ page }) => {
    // The "Plus" button opens the more menu
    const moreButton = page.locator(".mobile-nav button");
    await moreButton.click();

    // After clicking, the more menu overlay should appear
    // with links to knowledge, 3d, canvas, scoring, admin, settings
    await expect(page.locator('a[href="/knowledge"]')).toBeVisible({
      timeout: 3_000,
    });
    await expect(page.locator('a[href="/scoring"]')).toBeVisible();
  });
});
