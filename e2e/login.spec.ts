import { test, expect } from "@playwright/test";
import { PLATFORM_ADMIN } from "./helpers/auth";

// The ONE test that exercises the real login UI end-to-end.
// All other tests authenticate programmatically via the identity fixture
// (e2e/fixtures.ts) — one fresh API login per test, never a shared session.
test("user can sign in through the login form", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email or Username").fill(PLATFORM_ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(PLATFORM_ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Successful login navigates to "/" which greets the user
  await expect(page.getByText("Вітаємо у Milestone Pilot!")).toBeVisible();
});
