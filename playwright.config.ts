import { defineConfig, devices } from "@playwright/test";

// E2E tests run against the production build (vite preview), talking to the
// real backend started with its e2e profile — see milestonepilot-api/docs/E2E.md
// for the environment contract (ports, seed data, Mailpit).
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Fail the CI build if test.only is accidentally committed
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    // Pin the browser language so i18n renders English labels deterministically
    locale: "en-US",
    trace: "on-first-retry",
  },
  projects: [
    // Programmatic API login per identity; writes e2e/.auth/*.json storage states
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_BE_REST_BASE_URL: "http://localhost:8080",
    },
  },
});
