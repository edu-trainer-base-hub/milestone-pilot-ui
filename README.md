# milestone-pilot-ui

Frontend UI for **MilestonePilot** — a construction lifecycle management platform for tracking projects from proposal through onsite execution to completion.

## Tech Stack

- React
- TypeScript
- Vite
- Vitest (unit tests)
- Playwright (end-to-end tests)
- ESLint
- Prettier

## Prerequisites

- Node.js (latest LTS recommended)
- npm (comes with Node.js)

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

By default, the application runs at:

```text
http://localhost:5173
```

If Vite starts on a different port, check [Troubleshooting](./docs/TROUBLESHOOTING.md).

## Available Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `npm run dev`        | Start the local development server       |
| `npm run build`      | Build the application for production     |
| `npm run preview`    | Preview the production build locally     |
| `npm run test`       | Run unit tests with Vitest               |
| `npm run coverage`   | Run tests and generate a coverage report |
| `npm run e2e`        | Run end-to-end tests with Playwright     |
| `npm run e2e:ui`     | Run E2E tests in interactive UI mode     |
| `npm run e2e:report` | Open the HTML report of the last E2E run |
| `npm run lint`       | Run ESLint checks                        |
| `npm run format`     | Format specific files with Prettier      |
| `npm run format:all` | Format the entire project with Prettier  |

## End-to-End Tests

E2E tests live in `e2e/` and run with Playwright against the **production
build** of this app talking to the **real backend** — nothing is mocked.
The test code is TypeScript, but a failing API, database, or email flow
fails the test.

New to E2E testing, or to this suite? Start with the walkthrough in
[`docs/E2E-GUIDE.md`](./docs/E2E-GUIDE.md) — what these tests are, how to run and
read them, why every test logs in for itself, and how to match backend log lines
to the test that caused them.

### Prerequisites

The backend (`milestonepilot-api`) must be running with its `e2e` profile:

```bash
# in the milestonepilot-api repo:
docker compose -f docker-compose.e2e.yml up -d     # PostgreSQL + Mailpit
SPRING_PROFILES_ACTIVE=e2e ./gradlew bootRun       # or IntelliJ, profile: e2e
```

The environment contract — ports, seeded users and passwords, how tests fetch
emailed verification codes from Mailpit — is documented in
`milestonepilot-api/docs/E2E.md`. That file is the source of truth; if you
change something the suite depends on, update it in the same PR.

### Running

```bash
npm run e2e        # headless run (builds the app first, ~1 min total)
npm run e2e:ui     # interactive mode: watch tests run, time-travel per step
```

First time only: `npx playwright install chromium` downloads the browser.

Note for the edit-run loop: tests run against a frozen production build. After
changing application code, close any running Playwright UI window so the next
run rebuilds — otherwise you test stale code.

### Writing tests — the three rules

1. **Authenticate via fixture, not the login form.**
   `import { test, expect } from "./fixtures"` and
   `test.use({ identity: PLATFORM_ADMIN })` — each test gets its own fresh
   session (the backend's refresh tokens are single-use, so sessions cannot
   be shared between tests). Exactly one test (`login.spec.ts`) covers the
   real login form.
2. **Never rely on a clean database.** Create uniquely-named data
   (`uniqueTestEmail()`), assert only on what you created or on the seeded
   fixed-UUID entities. This is what makes parallel workers safe.
3. **No sleeps.** Auto-waiting assertions only. A test that needs
   `waitForTimeout` to pass is wrong.

Keep the suite small: critical user journeys belong here; everything else
belongs in Vitest component tests or backend integration tests.

## Package Structure

The frontend uses a feature-first package structure under `src/`.

- `src/features/<feature-name>/` holds business-domain code.
- `src/components/`, `src/hooks/`, `src/contexts/`, `src/lib/`, and `src/services/` hold shared app-wide code.
- `src/pages/` should contain only non-feature top-level pages or app-shell level routes.

Each feature package should follow the same predictable layout used in the current codebase:

```text
src/features/<feature-name>/
  api/         feature-specific request functions
  components/  feature-only UI building blocks
  model/       types, helpers, and access-policy logic
  pages/       routed feature screens
```

Current examples:

- `src/features/platform-users`
- `src/features/tenant-management`
- `src/features/tenant-users`
- `src/features/workspaces`

Rules to follow:

- Add code to a feature package when it belongs to one business domain.
- Move code to shared `src/*` packages only when it is reused by multiple features.
- Keep tests next to the code they cover with `*.test.ts` or `*.test.tsx`.
- Avoid creating compatibility shim packages or duplicate feature entry points during refactors.
- Prefer extending the standard `api` / `components` / `model` / `pages` layout before introducing new subfolders.

## Formatting

Format a specific file:

```bash
npm run format -- <file-path>
```

Examples:

```bash
npm run format -- README.md
npm run format -- package.json
npm run format -- ./src/features/tenant-management/components/TenantDialog.tsx
```

Format the entire project:

```bash
npm run format:all
```

## Documentation

- [Troubleshooting](./docs/TROUBLESHOOTING.md)
