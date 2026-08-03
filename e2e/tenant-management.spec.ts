import { test, expect } from "./fixtures";
import { API_BASE_URL, PLATFORM_ADMIN, apiLogin } from "./helpers/auth";
import { uniqueTestEmail } from "./helpers/mailpit";

// Tenant CRUD through the UI as the platform admin.
// (No delete journey: tenants are deactivated via status, never deleted.)

test.use({ identity: PLATFORM_ADMIN });

test("platform admin creates a tenant through the dialog", async ({ page }) => {
  const name = `E2E Created ${Date.now()}`;

  await page.goto("/platform/tenants");
  await page.getByRole("button", { name: "Create Tenant" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill(name);
  await dialog.getByLabel("Admin's Email").fill(uniqueTestEmail("tenant-owner"));
  await dialog.getByLabel("Address").fill("1 E2E Street, Test City");
  // Timezone and Locale keep their sensible defaults
  await dialog.getByRole("button", { name: "Save" }).click();

  await expect(page.getByRole("cell", { name })).toBeVisible();
});

test("platform admin edits a tenant's name and status", async ({ page, request }) => {
  // Arrange via API: a fresh tenant this test owns entirely
  const token = await apiLogin(request, PLATFORM_ADMIN);
  const name = `E2E ToEdit ${Date.now()}`;
  const created = await request.post(`${API_BASE_URL}/api/v1/platform/tenants`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name,
      email: uniqueTestEmail("tenant-owner"),
      address: "1 E2E Street, Test City",
      timezone: "UTC",
      locale: "en",
    },
  });
  expect(created.ok(), `expect tenant creation to succeed (got HTTP ${created.status()})`).toBeTruthy();

  await page.goto("/platform/tenants");
  const row = page.getByRole("row").filter({ hasText: name });
  await row.getByRole("button", { name: "Edit" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill(`${name} Updated`);
  await dialog.getByLabel("Status").click();
  await page.getByRole("option", { name: "Suspended" }).click();
  await dialog.getByRole("button", { name: "Save" }).click();

  const updatedRow = page.getByRole("row").filter({ hasText: `${name} Updated` });
  await expect(updatedRow).toContainText("SUSPENDED");
});
