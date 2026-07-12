---
name: test-coverage
description: Use when adding Vitest tests, improving coverage, validating a fix with tests, or deciding how much testing a change deserves in this repository. Encodes the repository's minimal-necessary-coverage policy, the layer boundary between Vitest and Playwright, and this codebase's mocking and rendering conventions.
---

# Test Coverage (Vitest)

Component and unit tests for `milestone-pilot-ui`. Browser E2E is a different
layer with different rules — see `playwright-write-test`.

## Policy: minimal necessary coverage

Production code comes first. A file changing is **not** a reason to add tests.

Write a test only when one of these holds:

- the user asked for tests or coverage,
- a test is the fastest way to prove the change works,
- the change is risky enough that a regression guard is warranted.

Otherwise finish the implementation and keep the response about the code.

## Order tests are added

When tests are needed, add them in this order and stop as soon as the behavior
is convincingly covered:

1. One success case exercising the full intended flow with all available
   inputs/filters/parameters supplied.
2. One success case with only the minimum required inputs — but only if that is
   a genuinely distinct contract.
3. One test per *meaningful* error path.

Do not open with a permutation matrix. Do not duplicate equivalent branches.
Skip trivial passthroughs, framework wiring, and anything a lower-level test
already guarantees. Expand past this baseline only on explicit request or when
bug history justifies it.

## Which layer does this belong in?

| Prove this | Layer |
|---|---|
| Permission logic, role/authority derivation, pure helpers | `model/*.test.ts` (pure functions — cheapest, prefer these) |
| Component/page behavior: rendering, interaction, disabled states, API payload shape | `*.test.tsx` with Testing Library (mocked API) |
| A real user journey through the real backend | Playwright, `e2e/` — keep it to 10–20 journeys |
| API contract, persistence, rate limits, token semantics | backend tests in `milestonepilot-api` |

Vitest is configured to ignore `e2e/**` and Playwright ignores `src/**`; keep
that boundary. If you can prove it without a browser, it does not belong in E2E.

## Where tests live

Colocated with the code, `*.test.ts` / `*.test.tsx`, inside the owning feature
package (`src/features/<feature>/model|pages|components/`). No central
`__tests__` directory.

## How the stack is wired

- Config is **`vitest.config.ts`** (not `vite.config.ts`): `jsdom`,
  `globals: true`, `@` → `src` alias, `e2e/**` excluded.
- `src/setupTests.ts` loads jest-dom matchers, **the real i18n bundle**, and
  polyfills `matchMedia` / `ResizeObserver` / `scrollIntoView` (Radix needs
  them in jsdom).
- Because i18n is real, assert on the actual English strings from
  `src/locales` — do not stub the translator.
- `globals: true` is on, but existing files still import `describe/it/expect/vi`
  from `vitest` explicitly. Match the file you are editing.

## Mocking conventions (follow these, don't invent)

Mock the **feature's own API module**, never axios:

```ts
const apiMock = vi.hoisted(() => ({ getUsersByTenant: vi.fn(), createUserInTenant: vi.fn() }));
vi.mock("../api/tenantUsers", () => ({ ...apiMock }));
```

The two other things worth mocking, and how:

- `@/services/NotificationService` — mock `notifier.success` / `notifier.error`
  and assert the user got feedback.
- `@/contexts/AuthContext` — **partial** mock via `importOriginal`, overriding
  only `useAuth`, so the `Authority` enum stays real:

```ts
vi.mock("@/contexts/AuthContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/contexts/AuthContext")>();
  return { ...actual, useAuth: () => ({ principal: authMock.principal }) };
});
```

Reset every mock in `beforeEach` — including mutations to the `principal`
object, which is shared across tests in the file.

## Rendering a page under test

Pages need TanStack Query and a router. Use a local `renderPage` helper with
`retry: false` (otherwise failed-query tests hang), and `MemoryRouter` +
`Routes` so route params resolve:

```tsx
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={["/platform/tenants/tenant-uuid-1/users"]}>
      <Routes><Route path="/platform/tenants/:tenantId/users" element={<TenantUsersPage />} /></Routes>
    </MemoryRouter>
  </QueryClientProvider>
);
```

Register **every** route the page can be reached from — several pages behave
differently under the platform vs. tenant route and that difference is worth a
test.

## Selectors and interaction

Role/label first, exactly as in E2E: `getByRole`, `getByLabelText`. Async
queries (`findBy*`) for anything behind a query.

- Radix `Select` renders as `combobox` → `listbox` → `option`. Open it with a
  click, then scope with `within(listbox)`.
- This repo uses `fireEvent`, not `userEvent`. Stay consistent.
- Scope row assertions with `within(row)` after finding the row via
  `cell.closest("tr")`.

## Domain rule that drives most tests here

**Authorities gate the UI, not roles.** `activeTenantRole` alone must never
unlock an action — the `Authority` list does. Permission matrices belong in
`model/access-policy.test.ts` as pure-function tests; page tests should assert
only the *visible consequence* (button disabled, Edit hidden, option absent).

## Known trap worth a regression test

React identity instability: a fresh array/object created per render (e.g.
`roleOptions`) can cascade into a dialog-reset effect that wipes an input the
user already filled. It was a real bug in `TenantUsersPage.tsx`, fixed with
`useMemo`. A component test that fills a form *after* opening a dialog catches
this class of bug; E2E catches it late and expensively.

## Commands

```bash
npm run test         # WATCH mode — will not exit; not for verification runs
npx vitest run       # one-shot, use this to verify
npx vitest run src/features/tenant-users   # scope to a path
npm run coverage     # one-shot + V8 coverage report
```

Verify with `npx vitest run`, and report the actual pass/fail counts.
