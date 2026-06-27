---
name: test-coverage
description: Use when the user asks to add tests, improve test coverage, validate a fix with tests, or decide how much testing is appropriate for a change in this repository. Applies the repository preference for minimal necessary coverage, success-first test design, and production-code-first delivery.
---

# Test Coverage

Follow this skill when working on tests in this repository.

## Default Testing Strategy

Prioritize production code first. Do not expand test coverage by default just because a file changed.

Write tests only when one of these is true:

- The user explicitly asks for tests or coverage.
- A test is the fastest way to prove the change works.
- The change is risky enough that a regression test is necessary.

If tests are not clearly needed, finish the implementation first and keep the response focused on code changes.

## Preferred Test Order

When tests are needed, keep them minimal and high-value. Add them in this order:

1. One successful test covering the full intended flow with all enabled, available, or non-nullable parameters, filters, or inputs.
2. One successful test covering only the minimum required parameters or inputs.
3. One test per distinct error scenario, only for meaningful validation paths.

Do not start by writing a matrix of permutations. Avoid exhaustive edge-case coverage unless the user explicitly asks for broader coverage.

## Scope Rules

Prefer the smallest number of tests that proves behavior.

- Combine related happy-path assertions into one test when that keeps the scenario readable.
- Do not create duplicate tests for equivalent branches.
- Skip low-value coverage for trivial passthrough code, framework wiring, or behavior already guaranteed by a lower-level test.
- Add broader coverage only when the user directly asks for more coverage or when a bug history justifies it.

## Test Design Guidelines

Use realistic inputs and assert observable behavior, not implementation details.

- For reducers, generators, and utilities, test the public output for representative inputs.
- For hooks and pages, verify user-visible state, rendered output, and important side effects.
- Prefer one clear scenario per test.
- Keep setup lean; extract helpers only after repetition appears.
- Name tests by behavior, not by function internals.

## Repository Context

Use the repository’s existing test stack:

- `vitest` for test execution
- `@testing-library/react` for React rendering and interaction
- `jsdom` environment configured in `vite.config.ts`
- shared setup from `src/setupTests.ts`

Keep tests near the code they verify using `*.test.ts` or `*.test.tsx`.

## Practical Workflow

When asked to add tests or coverage:

1. Identify the smallest behavior that actually needs proof.
2. Implement or finish the production code first unless testing is required to drive or verify the fix.
3. Add the full happy-path test.
4. Add the minimal-input happy-path test if it covers a distinct contract.
5. Add only the necessary error-path tests.
6. Stop once the behavior is convincingly covered.

If the user asks for broader test coverage, then expand beyond this minimum baseline.
