import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const API_BASE_URL = "http://localhost:8080";
export const UI_ORIGIN = "http://localhost:4173";

export interface TestIdentity {
  email: string;
  password: string;
  /** Playwright storageState file produced by auth.setup.ts */
  storageStatePath: string;
}

// Seeded by milestonepilot-api (db/migration/e2e) — contract in its docs/E2E.md
export const PLATFORM_ADMIN: TestIdentity = {
  email: "admin@e2e.test",
  password: "E2eAdminPassw0rd!",
  storageStatePath: join(here, "..", ".auth", "platform-admin.json"),
};

export const TENANT_ADMIN: TestIdentity = {
  email: "user@e2e.test",
  password: "E2eUserPassw0rd!",
  storageStatePath: join(here, "..", ".auth", "tenant-admin.json"),
};
