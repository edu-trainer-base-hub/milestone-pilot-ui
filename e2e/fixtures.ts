import { test as base, expect } from "@playwright/test";
import { API_BASE_URL, UI_ORIGIN, type TestIdentity } from "./helpers/auth";

// Programmatic authentication, one fresh session PER TEST.
//
// Why not a shared storageState file: the backend rotates refresh tokens
// (each /auth/refresh revokes the used token). The app calls /auth/refresh on
// every boot, so the first test booting from a shared file revokes its cookie
// for every later test. A fresh API login per test (~100ms) avoids that.
//
// Usage in a spec:
//   import { test, expect } from "./fixtures";
//   test.use({ identity: PLATFORM_ADMIN });

interface AuthOptions {
  identity: TestIdentity | null;
}

export const test = base.extend<AuthOptions>({
  identity: [null, { option: true }],

  storageState: async ({ request, identity }, use) => {
    if (!identity) {
      await use(undefined);
      return;
    }

    const response = await request.post(`${API_BASE_URL}/auth/login`, {
      data: { username: identity.email, password: identity.password },
    });
    expect(response.ok(), `expect login as ${identity.email} to succeed (got HTTP ${response.status()})`).toBeTruthy();
    const { accessToken } = (await response.json()) as { accessToken: string };

    // The app needs BOTH: the refresh-token cookie (it calls /auth/refresh on
    // startup) and a "token" localStorage entry that triggers that refresh
    const state = await request.storageState();
    state.origins.push({
      origin: UI_ORIGIN,
      localStorage: [{ name: "token", value: accessToken }],
    });
    await use(state);
  },
});

export { expect };
