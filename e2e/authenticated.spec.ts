import { test, expect } from "./fixtures";
import { PLATFORM_ADMIN, TENANT_ADMIN } from "./helpers/auth";

// Proves the programmatic-auth fixture: tests start already logged in and
// land directly on protected routes, never touching the login screen.

test.describe("platform admin session", () => {
  test.use({ identity: PLATFORM_ADMIN });

  test("lands on the tenants page and sees the seeded tenant", async ({ page }) => {
    await page.goto("/platform/tenants");

    await expect(page.getByText("E2E Tenant").first()).toBeVisible();
  });
});

test.describe("tenant admin session", () => {
  test.use({ identity: TENANT_ADMIN });

  test("lands on the workspaces page", async ({ page }) => {
    await page.goto("/settings/workspaces");

    await expect(page.getByText("Your workspaces")).toBeVisible();
  });
});
