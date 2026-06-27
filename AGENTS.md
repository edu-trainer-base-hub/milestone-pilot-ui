# Repository Guidelines

## Project Structure & Module Organization

This is a React 19 + TypeScript + Vite frontend. Application code lives in `src/`, with route pages under `src/pages`, shared UI under `src/components`, app state in `src/contexts`, reusable hooks in `src/hooks`, and API clients in `src/services`. Feature-focused code is grouped in `src/features/*` (for example, `profiles` and `tenants`) with local `components`, `hooks`, `model`, `services`, and `tests`. Static assets live in `src/assets`, translations in `src/locales`, and public files in `public`.

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

## Commit & Pull Request Guidelines

Match the current commit style, for example `feat: GH-30 - Add User Manager API` or `ci: GH-31 - Update pipeline`. Use the format `<type>: GH-<issue> - <short imperative summary>`. PRs should include purpose, linked GitHub issue, test evidence, screenshots for UI changes, and API examples when a contract changes.

## Convention Discovery

Capture user-requested coding conventions or convention changes that appear during implementation or review chats. If a requested convention is missing from this file, suggest adding it as a repository standard. Only add or modify conventions in `AGENTS.md` after explicit user approval, and keep each entry short, actionable, and non-duplicative.

## Configuration Tips

The app reads its deploy base path from `VITE_UI_BASE_ENV_PATH`. Keep secrets out of the repo and prefer Vite environment variables for runtime configuration.
