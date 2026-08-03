---
name: playwright-write-test
description: Use when adding or extending Playwright end-to-end tests in this repository — new user journeys, new spec files, or new assertions in existing specs. Covers how to analyze the backend REST API (no OpenAPI exists), the repository's fixture-based auth, unique-data conventions, and the verification workflow.
---

# Writing Playwright E2E Tests

E2E tests live in `e2e/` and run against the **production build** of this app
talking to the **real backend** (`milestonepilot-api`, sibling repo) — nothing
is mocked. A failing API, database, or email flow fails the test.

## Read these before writing anything

1. `milestonepilot-api/docs/E2E.md` — the environment contract (ports, seeded
   users, Mailpit, token behavior). It is the source of truth; never guess a
   value that is documented there.
2. `e2e/fixtures.ts` and `e2e/helpers/` — the existing building blocks.
3. One existing spec close to your journey (e.g. `e2e/tenant-users.spec.ts`)
   — copy its style, not a style from the internet.

## Analyzing the backend API

There is **no OpenAPI/Swagger**. Read the source in the sibling repo
`../milestonepilot-api/src/main/java/com/milestonepilot/`:

- Endpoints: `@RestController` classes under `<module>/controller/`
  (modules: `access`, `tenantmanagement`, plus root `controller/`).
  `AuthController` owns login/refresh/password-reset flows.
- Request/response shapes: follow the DTO types referenced by the controller
  method signatures.
- Required role: check `@PreAuthorize` / security annotations on the method
  or class — this tells you which test identity to use.
- Error responses: `GlobalExceptionHandler` defines the error body shape.
- Email-sending behavior: search for the service the controller calls; codes
  render as `<div class="confirmation-code">…</div>` in the HTML body.

When a journey's API behavior surprises you, verify with a direct request
against the running e2e backend before writing UI assertions around it.

## The three rules (non-negotiable)

1. **Authenticate via fixture, never the login form.**
   `import { test, expect } from "./fixtures"` and
   `test.use({ identity: PLATFORM_ADMIN })` (or `TENANT_ADMIN`). The backend's
   refresh tokens are **single-use** — sessions cannot be shared between
   tests, so shared `storageState` files are forbidden. Exactly one test
   (`login.spec.ts`) covers the real login form.
2. **Never rely on a clean database.** Create uniquely-named data with
   `uniqueTestEmail()`; assert only on data you created or on the seeded
   fixed-UUID entities. Tests must survive `--repeat-each=3` with parallel
   workers.
3. **No sleeps.** Auto-waiting assertions (`expect(locator).toBeVisible()`
   etc.) only. A test that needs `waitForTimeout` is wrong.

## Building blocks

- `e2e/fixtures.ts` — `test` with the `identity` option (per-test fresh API
  login written into `localStorage.token`).
- `e2e/helpers/auth.ts` — `PLATFORM_ADMIN`, `TENANT_ADMIN`, `E2E_TENANT`
  (fixed UUID), `apiLogin(request, identity)` for API-level arrangement.
- `e2e/helpers/mailpit.ts` — `getVerificationCode(recipient)` (skips
  code-less emails), `waitForMessage`, `uniqueTestEmail(prefix)`. Never call
  `purgeMailbox()` in a parallel-safe test.

Pattern: **arrange via API, act and assert via UI.** Get a token with
`apiLogin`, create prerequisite entities with `request.post(...)`, then drive
the browser only through the journey under test.

## Domain constraints

- **No self-registration exists, by design.** Users are created by admins;
  the emailed-code journey is modeled via password reset / account setup.
- **Tenant-zone operations only work against the seeded "E2E Tenant"**
  (UUID `e2e00000-0000-4000-8000-000000000002`). Tenants created by tests
  have no per-tenant datasource — creating users inside them returns 500.
- UI-created entities inherit the browser timezone; API-created ones get
  UTC. Pin `timezoneId` in the config before asserting on timezones.

## Selector conventions

Prefer, in order: `getByRole` → `getByLabel` → `getByText`. Card titles
render as `<div>`, not headings — `getByRole("heading")` misses them. Some
UI strings are Ukrainian (e.g. the post-login greeting); copy them exactly
from the source component, don't transliterate.

## Verification workflow

1. `npm run e2e` — builds first, runs headless. Close any Playwright UI
   window beforehand, otherwise the run reuses its **stale preview server**
   and tests old code.
2. Prove parallel-safety of new/changed specs:
   `npx playwright test <file> --repeat-each=3`.
3. Keep the suite small: only critical user journeys belong here. Component
   behavior belongs in Vitest; API edge cases belong in backend tests.
