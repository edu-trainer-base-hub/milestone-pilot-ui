import { test, expect } from "./fixtures";
import { API_BASE_URL, TENANT_ADMIN, E2E_TENANT, apiLogin } from "./helpers/auth";
import { uniqueTestEmail } from "./helpers/mailpit";

// Tenant user management through the UI as the tenant admin of "E2E Tenant".
// (The platform admin cannot see this page — tenant-scoped authorities only.)

test.use({ identity: TENANT_ADMIN });

test("tenant admin adds a user to the tenant", async ({ page }) => {
  const email = uniqueTestEmail("tenant-user");

  await page.goto("/tenant/users");
  await page.getByRole("button", { name: "Add User" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email", { exact: true }).fill(email);
  await dialog.getByLabel("First Name").fill("E2E");
  await dialog.getByLabel("Last Name").fill("AddedViaUi");
  await dialog.getByLabel("Role").click();
  await page.getByRole("option", { name: "TENANT USER" }).click();
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("cell", { name: email })).toBeVisible();
});

test("tenant admin changes a user's role", async ({ page, request }) => {
  // Arrange via API: a fresh tenant user this test owns entirely
  const token = await apiLogin(request, TENANT_ADMIN);
  const email = uniqueTestEmail("tenant-user-edit");
  const created = await request.post(`${API_BASE_URL}/api/v1/tenants/${E2E_TENANT.uuid}/users`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { email, firstName: "E2E", lastName: "ToPromote", role: "ROLE_TENANT_USER" },
  });
  expect(created.ok(), `expect tenant user creation to succeed (got HTTP ${created.status()})`).toBeTruthy();

  await page.goto("/tenant/users");
  const row = page.getByRole("row").filter({ hasText: email });
  await expect(row).toContainText("TENANT USER");
  await row.getByRole("button", { name: "Edit" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Role").click();
  await page.getByRole("option", { name: "TENANT MANAGER" }).click();
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(row).toContainText("TENANT MANAGER");
});
