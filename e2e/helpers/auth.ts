import { expect, type APIRequestContext } from "@playwright/test";

export const API_BASE_URL = "http://localhost:8080";
export const UI_ORIGIN = "http://localhost:4173";

export interface TestIdentity {
  email: string;
  password: string;
}

// Seeded by milestonepilot-api (db/migration/e2e) — contract in its docs/E2E.md
export const PLATFORM_ADMIN: TestIdentity = {
  email: "admin@e2e.test",
  password: "E2eAdminPassw0rd!",
};

export const TENANT_ADMIN: TestIdentity = {
  email: "user@e2e.test",
  password: "E2eUserPassw0rd!",
};

// Fixed UUID from the backend seed migration
export const E2E_TENANT = {
  name: "E2E Tenant",
  uuid: "e2e00000-0000-4000-8000-000000000002",
};

/** Logs in via the API and returns the access token — for API-level test arrangement. */
export async function apiLogin(request: APIRequestContext, identity: TestIdentity): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { username: identity.email, password: identity.password },
  });
  expect(response.ok(), `expect API login as ${identity.email} to succeed (got HTTP ${response.status()})`).toBeTruthy();
  const { accessToken } = (await response.json()) as { accessToken: string };
  return accessToken;
}
