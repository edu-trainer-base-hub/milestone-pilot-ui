# milestone-pilot-ui

Frontend UI for **MilestonePilot** — a construction lifecycle management platform for tracking projects from proposal through onsite execution to completion.

## Tech Stack

- React
- TypeScript
- Vite
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
| `npm run test`       | Run tests with Vitest                    |
| `npm run coverage`   | Run tests and generate a coverage report |
| `npm run lint`       | Run ESLint checks                        |
| `npm run format`     | Format specific files with Prettier      |
| `npm run format:all` | Format the entire project with Prettier  |

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
