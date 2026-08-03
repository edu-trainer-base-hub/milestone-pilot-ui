# Playwright E2E Testing — Step-by-Step Guide for Beginners

This guide explains what our end-to-end (E2E) tests are, how to run them, how to
read the results, and how to verify with your own eyes that everything works —
including matching backend log lines to individual tests.

It is the **narrative** companion to two shorter, more factual documents:

- `README.md` → the quickstart (commands, the three rules).
- `milestonepilot-api/docs/E2E.md` → the environment contract (ports, seeded
  users, tokens, Mailpit). **That file is the source of truth.** If this guide
  ever disagrees with it, the contract wins and this guide is the thing to fix.

---

## 1. What is an E2E test, in one paragraph

An E2E test is a robot that opens a real browser and pretends to be a user: it
types into the login form, clicks buttons, and checks that the right things
appear on screen. Although the test code lives in this frontend repo and is
written in TypeScript, **it tests the whole system**: the real React app calls
the real Spring Boot API, which reads the real PostgreSQL database and sends
real emails (caught by Mailpit). If any layer breaks, the test fails.

## 2. Where E2E fits — and where it doesn't

E2E is the most realistic kind of test we have, and also the slowest and the
most fragile. So it is deliberately **not** where most of our testing happens.
We have three layers, and the rule is: **prove a thing at the cheapest layer
that can actually prove it.**

| Layer | Tool | What's real | What's fake | Speed |
|-------|------|-------------|-------------|-------|
| Component | Vitest + Testing Library (`src/**/*.test.tsx`) | your React component | the browser (jsdom), the whole backend | ~10ms |
| Backend integration | JUnit in `milestonepilot-api` | the API and the database | no browser, no UI | ~1s |
| **End-to-end** | **Playwright (`e2e/`)** | **everything — browser, API, DB, email** | **nothing** | **~10s** |

The higher you go, the more realistic the test — and the further the failure
lands from its cause. When a browser test goes red, "the button didn't appear"
could mean the button, the React state, the network call, the API, or the
database. When a component test goes red, you already know where you are.

So the question to ask before writing an E2E test is **not** "does this touch
the backend?" but **"would a *user* notice if this broke?"** If yes, it's a
journey and it belongs here. If only a developer would notice, it's a contract,
and it belongs one layer down.

That's why this suite is small on purpose — 10–20 critical journeys, forever. A
large E2E suite gets slow, then flaky, then ignored, and an ignored test suite
is worse than none.

## 3. What we have in this repo

```
milestone-pilot-ui/
├── playwright.config.ts        the control center (see section 5)
├── e2e/                        all E2E tests live here
│   ├── fixtures.ts             the auth fixture — read this one first
│   ├── helpers/
│   │   ├── auth.ts             test users, the seeded tenant, apiLogin()
│   │   └── mailpit.ts          fetching emailed codes, unique test emails
│   ├── smoke.spec.ts           "does the login page render at all?"
│   ├── login.spec.ts           the ONE test that uses the real login form
│   ├── authenticated.spec.ts   proves the auth fixture works
│   ├── password-reset.spec.ts  the emailed-code journey (+ its negative case)
│   ├── verification-email.spec.ts  proves the email pipeline end to end
│   ├── tenant-management.spec.ts   create a tenant, edit it
│   ├── tenant-users.spec.ts        add a user to a tenant, change their role
│   └── workspace-switching.spec.ts switching between two workspaces
└── package.json                npm scripts: e2e, e2e:ui, e2e:report
```

Twelve tests across eight files. That's the whole suite, and it should stay
roughly that size.

## 4. The one idea that shapes everything: no shared sessions

This is the most important section in this guide. If you remember nothing else,
remember this.

**Almost no test logs in through the UI.** Logging in through the form is slow
(a page load, a network round-trip, a redirect) and it's the flakiest thing a
test can do. Instead, tests declare who they are:

```typescript
test.use({ identity: PLATFORM_ADMIN });
```

> **What is a fixture?** A fixture is reusable setup that Playwright runs
> *before* your test and cleans up *after* it — the `page` and `request` you
> already destructure in every test are built-in fixtures, which is why you never
> have to start or close a browser yourself. Ours is called `identity`: you name a
> user with `test.use({ identity: … })`, and the fixture logs that user in via the
> API and plants the token in the browser before your test's first line runs, so
> the test itself contains only the journey. It works **only** if the file imports
> `test` from `./fixtures` — importing from `@playwright/test` gives you the plain
> runner, which ignores `identity` silently and hands you a logged-out browser.

…and the fixture in `e2e/fixtures.ts` logs that user in **through the API**
before the browser even opens, drops the resulting token into `localStorage`,
and hands you a browser that is already signed in. Takes about 100ms.

Now, the subtle part. The obvious way to do this would be to log in **once**,
save the session to a file, and let every test reuse that file. That is what
Playwright's documentation suggests, it's what most projects do, and **it does
not work here.**

Why: our backend's refresh tokens are **single-use**. Every call to
`/auth/refresh` issues a new refresh token and *revokes the one you just used*.
And our React app calls `/auth/refresh` on every single boot. So a saved
session file works exactly once — the first test to start would consume it, and
every other test would boot with a dead token and get bounced to the login page.

Hence the rule: **every test gets its own fresh login.** No shared session
files, ever. It costs ~100ms per test and buys total independence.

> If you ever see a test mysteriously sitting on the login page in the middle of
> a journey, this is almost always why: something, somewhere, reused a session.

Exactly one test — `login.spec.ts` — uses the real login form, so the form
itself stays covered.

## 5. What `playwright.config.ts` does for you

You never start the frontend manually for tests. The config's `webServer` block
**builds the production bundle and serves it** on port 4173 automatically when
tests start. It also:

- pins the browser language to `en-US`, so i18n always renders English labels
  and text assertions are stable,
- records a **trace** (flight-recorder data) when a test fails and retries,
- points the app at the e2e backend via `VITE_BE_REST_BASE_URL`,
- runs everything in parallel (`fullyParallel`), which is only safe because of
  the no-shared-sessions rule above and the unique-data rule in section 10.

## 6. Prerequisites before every test session

The backend side must be running. Full details live in the `e2e-environment`
skill and in `milestonepilot-api/docs/E2E.md`; the short version:

```bash
# 1. inside the milestonepilot-api folder — PostgreSQL + Mailpit
docker compose -f docker-compose.e2e.yml up -d

# 2. the backend itself, with the e2e profile
SPRING_PROFILES_ACTIVE=e2e ./gradlew bootRun     # or IntelliJ, Active profiles: e2e
```

Quick self-check that the backend is up:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/actuator/health
```

**`401` means UP.** This app protects even its health endpoint, so *any* HTTP
status means the server answered. Only `Failed to connect` means it's down.
(This trips up everyone once, including CI scripts.)

## 7. The three ways to run tests

All commands run inside the `milestone-pilot-ui` folder.

### 7.1 Terminal run — the everyday command

```bash
npm run e2e
```

Builds the app (~40s the first time), runs everything, prints something like:

```
Running 12 tests using 4 workers
  12 passed (1.2m)
```

### 7.2 HTML report — "show me what happened"

```bash
npm run e2e:report
```

Opens a web page listing every test with status and duration. Click a test to
see its step-by-step timeline. On failures you also get screenshots and error
details.

### 7.3 UI mode — watch the robot work (best for learning)

```bash
npm run e2e:ui
```

Opens an interactive window: tests on the left, live browser preview on the
right. Press ▶ on any test and **watch it fill fields and click buttons**.
After a run, hover over each step in the timeline — the preview time-travels to
show the page at that exact moment. The **Network** tab shows every API call the
app made during that step.

Bonus variant — a real visible browser window at full speed:

```bash
npx playwright test --headed --workers=1
```

## 8. How to read results (and not be fooled)

- **Green ✓ / "Passed"** is the only status that matters.
- Step labels can mislead: an `expect(...)` step displays its custom message
  even when it **passes**. Our assertions carry messages like
  `expect login as admin@e2e.test to succeed` — seeing that text does not mean
  something failed. Check the test's overall status, not the step wording.
- A **red ✗ / "Failed"** test gives you three tools: the error message (expected
  vs. found), a page screenshot at the moment of death, and — on retry — a full
  trace you can step through.
- After a failed terminal run, `test-results/<test-name>/error-context.md` holds
  a text snapshot of what was actually on the page. Extremely useful, and often
  the fastest answer: it usually shows you the browser sitting somewhere you
  didn't expect.

## 9. Verifying with backend logs — the play-by-play

The most convincing verification: watch the backend's IntelliJ console while
tests run and match log lines to the tests that caused them.

Parallel workers interleave requests, so a full run's log is a shuffled deck. To
get a readable, deterministic sequence, run **one spec, one worker**:

```bash
npx playwright test e2e/authenticated.spec.ts --workers=1
```

Watch the backend console. For **each** of the two tests in that file you will
see the same three-beat pattern, and now you know exactly why each line is
there:

| Backend log line | Who caused it, and why |
|------------------|------------------------|
| `Login request received.` | The **fixture** (section 4), logging this test's identity in via the API before the browser opens. Not the login form. |
| `Refreshing token request received.` | The **React app booting**. It finds the token the fixture planted in `localStorage` and immediately refreshes it. This is the call that makes shared sessions impossible. |
| `Get current user profile request received. [userId='…']` | The app loading the signed-in user, now that it has a valid token. |

Then the page the test actually visits does its own work — `Get all tenants` for
the platform-admin test hitting `/platform/tenants`, and
`List auth workspaces request received.` for the tenant-admin test hitting
`/settings/workspaces`.

What this proves, with your own eyes:

- Each test **logs in exactly once, for itself** — one `Login request received.`
  per test, never a shared one.
- The refresh-on-boot is real. It's not a theory in a doc; it's a line in the
  log, and it is the reason for the whole fixture design.
- The user IDs in the log match the seeded users from
  `milestonepilot-api/docs/E2E.md`.

Now run the **full** suite (`npm run e2e`) with the console visible and watch the
same patterns arrive all jumbled together — that's parallelism, and it's exactly
why every test must own its data and its session.

One line you can ignore: a red `ERROR ... Authentication failed ... /actuator/health`
is just the "is the backend up?" probe from section 6 getting its expected 401.
It's the only red line in a healthy run.

## 10. Anatomy of a test

```typescript
import { test, expect } from "./fixtures";          // note: ./fixtures, NOT @playwright/test
import { PLATFORM_ADMIN } from "./helpers/auth";

// Start every test in this file already logged in as the platform admin
test.use({ identity: PLATFORM_ADMIN });

test("tenants page shows the seeded tenant", async ({ page }) => {
  await page.goto("/platform/tenants");                  // navigate (baseURL is prepended)
  await expect(page.getByText("E2E Tenant").first())     // find by visible text
    .toBeVisible();                                      // auto-retries until true or timeout
});
```

That import line matters: `./fixtures` is our extended `test` object, the one
that understands `identity`. Importing from `@playwright/test` gives you the
plain one, and `test.use({ identity })` silently does nothing.

For anything more involved, the pattern is **arrange via API, act and assert via
UI**: build your prerequisites with `apiLogin()` + `request.post(...)`, then
drive the browser *only* through the journey you're actually testing.
`workspace-switching.spec.ts` is the reference example — it constructs a user
with two workspaces via three API calls, then does exactly one thing in the
browser: switch, and check it stuck.

## 11. The rules we follow

1. **Selectors**: prefer `getByRole` / `getByLabel` / `getByText` — what a *user*
   sees. `data-testid` only when those are genuinely ambiguous. (Bonus: this
   doubles as an accessibility check.)
2. **Never** use `waitForTimeout` (sleep). `expect(...).toBeVisible()` auto-waits
   — that's the whole trick against flakiness. A test that needs a sleep is a
   test that's hiding a real problem.
3. **Unique data.** Anything a test creates gets a unique name via
   `uniqueTestEmail()` and a `.test` email domain. Tests must pass on a dirty
   database, in parallel, run three times in a row.
4. **Never weaken an assertion to make a red test green.** If the product is
   broken, the test is doing its job. Fix the product, or `test.fixme()` it with
   a comment saying what you observed — but don't paper over it.
5. New test file = new `*.spec.ts` in `e2e/`. Playwright picks it up
   automatically; Vitest is configured to ignore the folder.

## 12. Three things about this product that will surprise you

These aren't quirks of the tests — they're facts about the system, and each one
has cost somebody an afternoon.

- **There is no self-registration.** By design. Users are created by admins. So
  the "sign up and confirm your email" journey you might go looking for doesn't
  exist; the emailed-code flow is modeled through password reset / account setup
  (`password-reset.spec.ts`).
- **Only the seeded "E2E Tenant" is a fully working tenant.** Tenant-owned data
  lives in a per-tenant database, and the e2e profile registers one only for the
  seeded tenant (UUID `e2e00000-0000-4000-8000-000000000002`). A tenant your
  test creates has no such database — creating users inside it returns HTTP 500.
  Do tenant-scoped work against the seeded tenant.
- **Some UI strings are Ukrainian**, even though the tests pin `en-US` — the
  post-login greeting `Вітаємо у Milestone Pilot!` is hard-coded in the
  component rather than translated. Copy such strings exactly from the source;
  don't transliterate them, and don't "fix" the test. It's a product bug the
  test is honestly documenting.

## 13. Troubleshooting

| Symptom | Cause & fix |
|---------|-------------|
| A test lands on the **login page** in the middle of a journey | A session got reused. Section 4. Use `test.use({ identity: ... })`; never share sessions between tests. |
| `expect login as … to succeed (got HTTP 000/ECONNREFUSED)` | Backend isn't running. Section 6. |
| Tests time out on the first page load | The `webServer` build failed — scroll up for `[WebServer]` lines with the TypeScript/Vite error. |
| Changed app code, but tests behave as if it didn't change | A Playwright **UI window is still open** and serving the old build; the next run reuses it. Close every UI window and rerun `npm run e2e` so it rebuilds. |
| HTTP 500 when creating a user inside a tenant | The tenant was created by a test and has no database. Section 12. |
| Verification code never arrives | Backend isn't running with the `e2e` profile (mail must go to `localhost:1025`). Check the Mailpit UI at <http://localhost:8025> before blaming test code. |
| Tests see Ukrainian/Russian text where English was expected | Either `locale: "en-US"` was removed from `playwright.config.ts`, or the string is hard-coded rather than translated. Section 12. |
| `strict mode violation: getByText(...) resolved to 2 elements` | The text appears twice. Add `.first()` or use a more specific locator (`getByRole("cell", { name: … })`). |
| Red `ERROR … /actuator/health` in backend logs | Expected. It's the health probe getting its 401. Section 9. |
| HTTP 429 (too many requests) | Should be impossible — the e2e profile raises the rate limit to 100,000/min. It means the backend is running the **wrong profile**. |
| Port 8080 already in use | An orphaned backend from a previous session. PowerShell: `Get-NetTCPConnection -LocalPort 8080 -State Listen`, then stop that PID. |

Deeper debugging — reading traces, deciding whether the test, the product, or
the environment is at fault — is covered by the `playwright-debug-test` skill.

## 14. Cheat sheet

```bash
npm run e2e                                  # run everything, terminal output
npm run e2e:ui                               # interactive mode, watch tests live
npm run e2e:report                           # open the HTML report of the last run
npx playwright test e2e/login.spec.ts        # run a single file
npx playwright test --headed --workers=1     # watch in a real browser window
npx playwright test -g "seeded tenant"       # run tests whose name matches
npx playwright test e2e/foo.spec.ts --repeat-each=3   # prove parallel-safety
```

## 15. Keeping this guide honest

This guide lives in `docs/` and is committed to git **on purpose**.
If you change how authentication, the environment, or the suite's structure
works, **update this file in the same PR.** 
