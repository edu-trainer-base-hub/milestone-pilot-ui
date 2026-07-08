import { test, expect, type APIRequestContext } from "@playwright/test";
import { API_BASE_URL, PLATFORM_ADMIN, TENANT_ADMIN, E2E_TENANT, apiLogin } from "./helpers/auth";
import { getVerificationCode, uniqueTestEmail } from "./helpers/mailpit";

// Workspace switching needs a user who belongs to BOTH the platform context
// and a tenant — neither seeded identity does. The test arranges its own:
//   1. tenant admin adds the user to "E2E Tenant"        (tenant workspace)
//   2. platform admin grants the same identity a role    (platform workspace)
//   3. the user sets a password via the emailed code     (all API)
// Then the UI journey: sign in -> switch workspace -> verify it stuck.

const PASSWORD = "Sw1tcher!e2e";

async function arrangeUserWithTwoWorkspaces(request: APIRequestContext): Promise<string> {
  const email = uniqueTestEmail("switcher");

  const tenantToken = await apiLogin(request, TENANT_ADMIN);
  const membership = await request.post(`${API_BASE_URL}/api/v1/tenants/${E2E_TENANT.uuid}/users`, {
    headers: { Authorization: `Bearer ${tenantToken}` },
    data: { email, firstName: "E2E", lastName: "Switcher", role: "ROLE_TENANT_USER" },
  });
  expect(membership.ok(), `expect tenant membership creation to succeed (got HTTP ${membership.status()})`).toBeTruthy();

  const adminToken = await apiLogin(request, PLATFORM_ADMIN);
  const platformRole = await request.post(`${API_BASE_URL}/api/v1/platform/users`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    data: { email, firstName: "E2E", lastName: "Switcher", role: "ROLE_PLATFORM_MANAGER" },
  });
  expect(platformRole.ok(), `expect platform role grant to succeed (got HTTP ${platformRole.status()})`).toBeTruthy();

  const sendCode = await request.post(`${API_BASE_URL}/auth/email/verification/send`, {
    data: { email, verificationCodeType: "PASSWORD_RESET_EMAIL_VERIFICATION_CODE_WEB" },
  });
  expect(sendCode.ok(), `expect verification send to succeed (got HTTP ${sendCode.status()})`).toBeTruthy();
  const code = await getVerificationCode(email);

  const reset = await request.post(`${API_BASE_URL}/auth/password/reset`, {
    data: { email, emailVerificationCode: code, password: PASSWORD, confirmPassword: PASSWORD },
  });
  expect(reset.ok(), `expect password reset to succeed (got HTTP ${reset.status()})`).toBeTruthy();

  return email;
}

test("user with two workspaces switches between them", async ({ page, request }) => {
  const email = await arrangeUserWithTwoWorkspaces(request);

  await page.goto("/login");
  await page.getByLabel("Email or Username").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Вітаємо у Milestone Pilot!")).toBeVisible();

  await page.goto("/settings/workspaces");

  // Two workspaces: one active (its switch button is disabled), one switchable.
  // Buttons are labeled "Switch <workspace name>" — find the enabled one.
  const switchButton = page.getByRole("button", { name: /^Switch /, disabled: false });
  await expect(switchButton).toBeVisible();
  const targetName = (await switchButton.getAttribute("aria-label"))!.replace(/^Switch /, "");

  await switchButton.click();

  await expect(page.getByText("Workspace switched successfully.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/); // switching navigates home

  // The switch persisted: the target workspace's row now shows Active
  await page.goto("/settings/workspaces");
  const targetRow = page.getByRole("row").filter({ hasText: targetName });
  await expect(targetRow).toContainText("Active");
});
