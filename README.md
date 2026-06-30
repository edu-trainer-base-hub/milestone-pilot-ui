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

## Formatting

Format a specific file:

```bash
npm run format -- <file-path>
```

Examples:

```bash
npm run format -- README.md
npm run format -- package.json
npm run format -- .\src\features\tenants\components\TenantDialog.tsx
```

Format the entire project:

```bash
npm run format:all
```

## Documentation

- [Troubleshooting](./docs/TROUBLESHOOTING.md)
