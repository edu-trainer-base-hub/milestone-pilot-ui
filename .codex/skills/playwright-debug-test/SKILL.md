---
name: playwright-debug-test
description: Use when Playwright end-to-end tests in this repository fail, flake, or behave unexpectedly. Provides a systematic debugging workflow, the catalog of known root causes in this specific stack (single-use refresh tokens, tenant-zone database, Mailpit races, stale preview server), and rules for deciding whether the test, the product, or the environment is broken.
---

# Debugging Failing Playwright Tests

E2E failures here have three possible culprits: the test, the product
(frontend or backend), or the environment. Do not touch test code until you
know which one it is.

## Workflow

1. **Reproduce in isolation:**
   `npx playwright test <file> -g "<test title>"`.
   If it passes alone but fails in the full run, suspect parallel-safety
   (shared data, purged mailbox, non-unique emails).
2. **Read the failure evidence before theorizing:** the error message, the
   failure snapshot (page state at the moment of failure), and the trace
   (`npm run e2e:report`, or `npx playwright show-trace <trace.zip>`).
   The snapshot often reveals the real story — e.g. the browser sitting on
   the login page when the test expected a data table.
3. **Time-travel interactively when the snapshot is not enough:**
   `npm run e2e:ui`, run the failing test, step through each action.
   Close this window before any headless verification run (see stale-server
   pitfall below).
4. **Correlate with backend logs.** The Spring Boot console shows every
   request. A 4xx/5xx there at the failure timestamp usually identifies the
   layer at fault. Zero requests arriving means the failure is in front of
   the API (build, routing, auth token).
5. **Fix the root cause, rerun the single test, then the full suite, then
   `--repeat-each=3`** on the affected spec to prove parallel-safety.

## Known root causes in this stack (check these first)

| Symptom | Root cause | Fix |
|---|---|---|
| Test lands on the login page mid-journey | Session reuse: backend refresh tokens are **single-use**, so any shared/replayed session dies on second use | Use the `identity` fixture (`test.use({ identity: ... })`); never share storageState between tests |
| HTTP 500 creating/managing users inside a tenant | Tenant-zone datasource exists **only for the seeded "E2E Tenant"** — test-created tenants have none | Perform tenant-zone operations only against the seeded tenant (UUID `e2e00000-0000-4000-8000-000000000002`) |
| Verification code never arrives / wrong code extracted | Parallel test purged the mailbox, or the polled email is the account-setup mail whose code div is empty | Use `uniqueTestEmail()` recipients and `getVerificationCode` (which skips code-less mail); never `purgeMailbox()` in parallel tests |
| A form field is mysteriously empty in the snapshot while others are filled | React identity instability: a fresh array/object per render cascades into a dialog-reset effect that wipes input (precedent: `roleOptions` in `TenantUsersPage.tsx`, fixed with `useMemo`) | This is a **product bug** — fix the component, not the test |
| Tests pass but changed app code seems not to run | Stale vite preview server: an open Playwright UI window holds the old build and `reuseExistingServer` picks it up | Close every Playwright UI window, rerun `npm run e2e` so it rebuilds |
| `ECONNREFUSED` on port 8080 | Backend not running | Start it with the `e2e` profile (see the e2e-environment skill) |
| "Port 8080 was already in use" when starting backend | Orphaned JVM from a previous run | Find and stop the process listening on 8080, then restart |
| 401 on every API call | Backend running without the `e2e` profile, or DB volume was reset while the backend kept stale state | Restart backend with `SPRING_PROFILES_ACTIVE=e2e` |
| HTTP 429 | Should not happen — e2e profile raises rate limits to 100 000/min | Environment is running the wrong profile |

## Deciding what is actually broken

- **Test bug** (bad selector, unsafe data assumption, ordering assumption):
  fix the test.
- **Product bug** (the app misbehaves for a real user too): fix or report the
  product code — do **not** paper over it in the test. The suite exists to
  catch exactly this.
- **Environment problem** (backend down, stale build, exhausted DB): fix the
  environment and note it; no code change.

## Forbidden "fixes"

Never make a red test green by:

- adding `waitForTimeout` or any sleep,
- waiting for `networkidle` (deprecated pattern),
- adding retries around a genuinely flaky step,
- broadening an assertion until it can't fail,
- reordering tests so one hides another's side effect.

Each of these converts a visible failure into a latent one. If a test is
correct but the product is broken and can't be fixed now, mark it
`test.fixme()` with a comment stating the observed vs. expected behavior,
and file an issue.
