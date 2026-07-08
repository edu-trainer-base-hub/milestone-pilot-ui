import fs from "node:fs";
import path from "node:path";
import { test as setup, expect, type APIRequestContext } from "@playwright/test";
import { API_BASE_URL, UI_ORIGIN, PLATFORM_ADMIN, TENANT_ADMIN, type TestIdentity } from "./helpers/auth";

// Logs in via the API (no UI) and saves a storageState file per identity.
// Tests opt in with: test.use({ storageState: PLATFORM_ADMIN.storageStatePath })
//
// The app needs BOTH pieces to restore a session (see AuthContext):
//   - the refresh-token cookie from the login response (the app calls
//     /auth/refresh on startup) — captured in the request context's cookie jar
//   - a "token" localStorage entry, whose presence triggers that refresh
async function saveStorageState(request: APIRequestContext, identity: TestIdentity): Promise<void> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username: identity.email, password: identity.password },
  });
  // Note: this message is also shown as the step label in the UI/report
  expect(response.ok(), `expect successful login for ${identity.email} (got HTTP ${response.status()})`).toBeTruthy();
  const { accessToken } = (await response.json()) as { accessToken: string };

  const state = await request.storageState();
  state.origins.push({
    origin: UI_ORIGIN,
    localStorage: [{ name: "token", value: accessToken }],
  });

  fs.mkdirSync(path.dirname(identity.storageStatePath), { recursive: true });
  fs.writeFileSync(identity.storageStatePath, JSON.stringify(state, null, 2));
}

// Separate setup tests: each gets its own request context, so the two
// identities' refresh-token cookies never overwrite each other.
setup("authenticate as platform admin", async ({ request }) => {
  await saveStorageState(request, PLATFORM_ADMIN);
});

setup("authenticate as tenant admin", async ({ request }) => {
  await saveStorageState(request, TENANT_ADMIN);
});
