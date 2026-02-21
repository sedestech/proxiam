import { test, expect } from "@playwright/test";

// These tests assume the dev server is running with a valid Clerk key
// or that auth has been bypassed for testing purposes.
// If auth redirects to /sign-in, the beforeEach hook will detect it.

test.describe("Navigation", () => {
  test("homepage loads with dashboard", async ({ page }) => {
    await page.goto("/");

    // If redirected to sign-in, skip (auth not configured for E2E)
    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth redirect detected — Clerk not configured for E2E");
      return;
    }

    await expect(page.locator("text=Dashboard")).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/");

    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth redirect detected — Clerk not configured for E2E");
      return;
    }

    // Navigate to Map
    await page.click('a[href="/map"]');
    await expect(page).toHaveURL(/\/map/);

    // Navigate to Knowledge
    await page.click('a[href="/knowledge"]');
    await expect(page).toHaveURL(/\/knowledge/);

    // Navigate to Projects
    await page.click('a[href="/projects"]');
    await expect(page).toHaveURL(/\/projects/);
  });

  test("lazy loading shows fallback then content", async ({ page }) => {
    await page.goto("/scoring");

    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth redirect detected — Clerk not configured for E2E");
      return;
    }

    // Should eventually load the scoring page
    await expect(page.locator("text=Scoring")).toBeVisible({ timeout: 10_000 });
  });

  test("can navigate back to dashboard from any page", async ({ page }) => {
    await page.goto("/projects");

    if (page.url().includes("sign-in")) {
      test.skip(true, "Auth redirect detected — Clerk not configured for E2E");
      return;
    }

    // Click dashboard link (first nav item, exact match for "/")
    await page.click('a[href="/"][end]', { timeout: 5_000 }).catch(async () => {
      // Fallback: look for the dashboard NavLink by text
      await page.click("text=Dashboard");
    });

    await expect(page).toHaveURL("/");
  });
});
