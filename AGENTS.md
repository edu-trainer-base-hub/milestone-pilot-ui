# Repository Guidelines

## Project Structure & Module Organization

This is a React 19 + TypeScript + Vite frontend. Application code lives in `src/`, with route pages under `src/pages`, shared UI under `src/components`, app state in `src/contexts`, reusable hooks in `src/hooks`, and API clients in `src/services`. Static assets live in `src/assets`, translations in `src/locales`, and public files in `public`.

Feature code should follow a feature-first package structure under `src/features/<feature-name>/`. Match the existing layout used by `platform-users`, `tenant-management`, `tenant-users`, and `workspaces`:

- `api/`: feature-specific request functions and API mappers
- `components/`: UI used only by that feature
- `model/`: feature types, helpers, and access-policy logic
- `pages/`: routed screens for that feature

Package structure rules:

- Put code in `src/features/<feature-name>/` when it primarily serves one business area.
- Put code in shared `src/components`, `src/hooks`, `src/contexts`, `src/lib`, or `src/services` only when it is reused across multiple features or is truly app-wide.
- Keep imports pointed at the owning feature package; do not add temporary cross-feature shim packages for renamed modules.
- Prefer adding a new file to an existing feature package over creating a new top-level `src/pages/*` file when the screen belongs to one feature domain.
- Keep feature internals flat and predictable; use the standard subfolders above before inventing new package names.
- Keep tests next to the code they verify, using `*.test.ts` or `*.test.tsx` in the same package.

## Build, Test, and Development Commands

- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server.
- `npm run build`: run TypeScript project builds, then create a production bundle.
- `npm run preview`: serve the production build locally.
- `npm run test`: run Vitest in watch mode.
- `npm run coverage`: run tests once with V8 coverage output.
- `npm run lint`: check ESLint rules across the repo.
- `npm run format`: apply Prettier formatting.

## Coding Style & Naming Conventions

Use TypeScript with 2-space indentation, semicolons, double quotes, trailing commas where valid in ES5, and a 120-character line width; these settings are enforced by `.prettierrc`. Prefer functional React components, modern React patterns, and current supported libraries over outdated packages or legacy APIs. Reuse existing shadcn/ui and Tailwind-based components whenever possible; if a needed component is missing, prefer asking the user to install or adopt the library version before building a custom one. Keep shared imports using the `@/` alias for `src`. Use `PascalCase` for components and page files, `camelCase` for hooks and utilities, and colocate feature-specific logic inside its feature folder. Favor small focused functions, clear naming, early returns, and minimal comments unless the logic is non-obvious.

## Testing Guidelines

Vitest runs in a `jsdom` environment with Testing Library setup from `src/setupTests.ts`. Keep tests near the code they cover using `*.test.ts` or `*.test.tsx`; examples already exist in `src/hooks`, `src/lib`, `src/pages`, and `src/features/*/tests`. Prefer the smallest useful test set: first one successful case with all enabled or non-nullable inputs, then one case with only required inputs, then one case per error path only when needed. Focus on production code first; expand coverage only when the user explicitly asks for broader test coverage or when tests are needed to prove correctness.

### End-to-End Tests (Playwright)

E2E tests live in `e2e/` and run with Playwright against the production build talking to the real backend (`milestonepilot-api`, sibling repo, `e2e` Spring profile) — nothing is mocked. The environment contract is `milestonepilot-api/docs/E2E.md`; the "how to run" summary is in `README.md`.

Non-negotiable rules when touching `e2e/`:

- Authenticate via the `identity` fixture from `e2e/fixtures.ts`, never through the login form and never with shared storage-state files (backend refresh tokens are single-use). Exactly one test (`login.spec.ts`) exercises the real login form.
- Create uniquely-named test data (`uniqueTestEmail()`), assert only on data the test created or on the seeded fixed-UUID entities, and never rely on a clean database — tests must pass with `--repeat-each=3` in parallel.
- No sleeps: auto-waiting assertions only; a test needing `waitForTimeout` is wrong.
- Keep the suite small: critical user journeys only. Component behavior belongs in Vitest; API edge cases belong in backend tests.

Detailed, task-specific guidance lives in versioned skills, identical for every assistant (Claude Code: `.claude/skills/`, Junie: `.junie/skills/`, Codex: `.codex/skills/`):

- `playwright-write-test` — writing new E2E journeys, including how to analyze the backend REST API from controller sources (there is no OpenAPI).
- `playwright-debug-test` — debugging failing/flaky E2E tests, with the catalog of known root causes in this stack.
- `e2e-environment` — starting, resetting, verifying, and troubleshooting the Dockerized e2e environment.

Claude Code additionally provides the `playwright-test-engineer` subagent (`.claude/agents/`) preloaded with these skills for delegated E2E work.

## Commit & Pull Request Guidelines

Match the current commit style, for example `feat: GH-30 - Add User Manager API` or `ci: GH-31 - Update pipeline`. Use the format `<type>: GH-<issue> - <short imperative summary>`. PRs should include purpose, linked GitHub issue, test evidence, screenshots for UI changes, and API examples when a contract changes.

## Convention Discovery

Capture user-requested coding conventions or convention changes that appear during implementation or review chats. If a requested convention is missing from this file, suggest adding it as a repository standard. Only add or modify conventions in `AGENTS.md` after explicit user approval, and keep each entry short, actionable, and non-duplicative.

- Create report-style Markdown documents in `temp/docs/`.
- Prefix report filenames with a date-time stamp in `YYYYMMDD-HHMM-...` format.

## Configuration Tips

The app reads its deploy base path from `VITE_UI_BASE_ENV_PATH`. Keep secrets out of the repo and prefer Vite environment variables for runtime configuration.
