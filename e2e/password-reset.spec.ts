import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { API_BASE_URL, PLATFORM_ADMIN } from "./helpers/auth";
import { getVerificationCode, uniqueTestEmail } from "./helpers/mailpit";

// Full email-confirmation journey through the UI, scoped to the flows the
// product actually has (there is deliberately no self-registration):
// an admin creates the user via API (the real business flow), then the user
// sets their password on /password/reset using the emailed confirmation code.

const NEW_PASSWORD = "NewPassw0rd!e2e";

// Users are created by admins — mirror that via API for test arrangement
async function createPlatformUser(request: APIRequestContext, email: string): Promise<void> {
  const login = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username: PLATFORM_ADMIN.email, password: PLATFORM_ADMIN.password },
  });
  expect(login.ok(), `expect admin login to succeed (got HTTP ${login.status()})`).toBeTruthy();
  const { accessToken } = (await login.json()) as { accessToken: string };

  const created = await request.post(`${API_BASE_URL}/api/v1/platform/users`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { email, firstName: "E2E", lastName: "ResetJourney", role: "ROLE_PLATFORM_MANAGER" },
  });
  expect(created.ok(), `expect platform user creation to succeed (got HTTP ${created.status()})`).toBeTruthy();
}

async function requestResetCode(page: Page, email: string): Promise<void> {
  await page.goto("/password/reset");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send reset code" }).click();
}

async function fillCodeAndPasswords(page: Page, code: string): Promise<void> {
  await page.getByLabel("Confirmation Code").fill(code);
  await page.getByLabel("Password", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirm Password").fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Reset Password" }).click();
}

test("user sets a password via emailed confirmation code and can sign in", async ({ page, request }) => {
  const email = uniqueTestEmail("reset");
  await createPlatformUser(request, email);

  await requestResetCode(page, email);
  const code = await getVerificationCode(email);
  await fillCodeAndPasswords(page, code);

  // Success navigates to the login page
  await expect(page).toHaveURL(/\/login$/);

  // The new password is really in effect
  const loginCheck = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username: email, password: NEW_PASSWORD },
  });
  expect(loginCheck.ok(), `expect login with the new password to succeed (got HTTP ${loginCheck.status()})`).toBeTruthy();
});

test("wrong confirmation code shows an error and the password stays unset", async ({ page, request }) => {
  const email = uniqueTestEmail("reset-neg");
  await createPlatformUser(request, email);

  await requestResetCode(page, email);
  // Wait for the real code so a valid one exists — then deliberately use another
  const realCode = await getVerificationCode(email);
  const wrongCode = realCode === "000000" ? "111111" : "000000";
  await fillCodeAndPasswords(page, wrongCode);

  // Error alert appears and we stay on the reset page
  await expect(page.getByRole("alert").first()).toBeVisible();
  await expect(page).toHaveURL(/\/password\/reset/);

  // The password was NOT changed
  const loginCheck = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username: email, password: NEW_PASSWORD },
  });
  expect(loginCheck.status()).toBe(401);
});
