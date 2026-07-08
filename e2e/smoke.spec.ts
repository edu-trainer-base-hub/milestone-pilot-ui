import { test, expect } from "@playwright/test";

// Proves the e2e wiring: production build served via vite preview,
// routing works, i18n renders the pinned en-US locale.
test("login page renders", async ({ page }) => {
  await page.goto("/login");

  // CardTitle renders a <div>, not a semantic heading — match by text
  await expect(page.getByText("Sign in to your account")).toBeVisible();
  await expect(page.getByLabel("Email or Username")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
});
