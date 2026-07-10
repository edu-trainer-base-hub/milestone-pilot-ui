---
name: e2e-environment
description: Use when starting, resetting, verifying, or troubleshooting the end-to-end test environment (Dockerized PostgreSQL + Mailpit + Spring Boot backend with the e2e profile) that the Playwright suite depends on. Also use when a test failure looks environmental rather than a code problem.
---

# E2E Environment

The Playwright suite needs the backend (`milestonepilot-api`, sibling repo)
running with its `e2e` Spring profile on top of Dockerized infrastructure.
Full contract: `milestonepilot-api/docs/E2E.md` — source of truth for
anything not listed here.

## Start

Run from the **`milestonepilot-api` repo root** (compose file lives there):

```bash
docker compose -f docker-compose.e2e.yml up -d   # PostgreSQL + Mailpit
SPRING_PROFILES_ACTIVE=e2e ./gradlew bootRun     # or IntelliJ, Active profiles: e2e
```

The container runtime on this team's machines is **Rancher Desktop** (it
provides the `docker` CLI). Do not install or start Docker Desktop.

## Ports

| Port  | What |
|-------|------|
| 8080  | Backend REST API |
| 55432 | PostgreSQL `milestonepilot_e2e` (55432 on purpose — 5432 may host a local Postgres) |
| 1025  | Mailpit SMTP (backend sends mail here) |
| 8025  | Mailpit web UI + REST API |

DB credentials: `milestonepilot` / `milestonepilot`.

## Readiness check

`GET /actuator/health` returns **401 to anonymous callers — that still means
the backend is up**. Treat any HTTP response as ready; only
connection-refused means it is still starting.

## Verify it works

```bash
curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@e2e.test","password":"E2eAdminPassw0rd!"}'
```

A JSON body with `accessToken` confirms DB, seed data, and auth are healthy.
Mailpit UI at <http://localhost:8025> shows every email the backend sent.

## Seeded data (fixed UUIDs, from `db/migration/e2e/V9000__seed_e2e_data.sql`)

| What | Value |
|------|-------|
| Platform admin | `admin@e2e.test` / `E2eAdminPassw0rd!` |
| Tenant admin | `user@e2e.test` / `E2eUserPassw0rd!` |
| Tenant | `E2E Tenant`, UUID `e2e00000-0000-4000-8000-000000000002` |

Only this seeded tenant has a tenant-zone datasource (schema `tenant_e2e`).
Tenants created by tests cannot host tenant-scoped data.

## Reset

```bash
docker compose -f docker-compose.e2e.yml down -v   # drops ALL data
```

Flyway re-migrates and re-seeds on the next backend start. Restart the
backend after a reset — a running backend holds stale pools and state.

## Troubleshooting

- **"Port 8080 was already in use"** — an orphaned backend JVM survived a
  previous session. Find the PID listening on 8080 and stop it
  (PowerShell: `Get-NetTCPConnection -LocalPort 8080 | Select OwningProcess`,
  then `Stop-Process -Id <pid>`).
- **`docker compose ... ps` says file not found** — you are not in the
  `milestonepilot-api` repo root; `docker-compose.e2e.yml` lives there.
- **"password authentication failed" on backend boot** — the backend reached
  a *different* Postgres. Check nothing else claims 55432 and the compose
  stack is up.
- **`docker exec -it ... psql` fails with "not a TTY"** in Git Bash/mintty —
  prefix the command with `winpty`.
- **Flyway checksum mismatch on boot** — someone edited an applied migration.
  Note: the tenant-zone migrator keeps its **own** `flyway_schema_history`
  inside schema `tenant_e2e`, not in `public`. For the disposable e2e DB the
  pragmatic fix is `down -v` and reboot; the team-level fix is a new additive
  migration, never editing applied ones.
- **Emails not arriving** — backend must run with the e2e profile (mail →
  localhost:1025); check the Mailpit UI before blaming test code.
