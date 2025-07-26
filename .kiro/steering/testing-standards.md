---
inclusion: fileMatch
fileMatchPattern: "**/*.test.*"
---

# Testing Standards

Comprehensive testing is critical to ensure HUNKCentral meets its requirements.  The following guidelines define how tests should be written, organized and maintained.  Tests are treated as first‑class citizens: they **validate requirements – fix code, not tests** (a core principle defined in the implementation tasks).

## Testing philosophy

- **Requirements‑driven** – Tests are derived from the functional requirements document.  A failing test means the implementation does not meet the business need and must be corrected.
- **Layered testing** – Use different types of tests to exercise the system at various levels:
  - **Unit tests** for individual functions and business logic (e.g. payroll calculations, commission matching).
  - **Integration tests** for workflows spanning multiple modules (e.g. log creation plus auto‑matching commissions).
  - **End‑to‑end (E2E) tests** for critical user journeys across the browser (e.g. captain submitting a daily log on mobile).
- **Real functionality** – Do not simply check that a button renders; test the real behavior (e.g. form validation triggers, state updates, database writes).

## Recommended tools

- **Jest** for unit and integration tests.
- **React Testing Library (RTL)** for component tests – focus on behavior, not implementation details.
- **Playwright** or **Cypress** for E2E tests – simulate user interactions in a real browser environment.
- **MSW (Mock Service Worker)** for mocking network requests in tests when necessary.

## Directory structure

Tests should mirror the application structure inside a top‑level `__tests__` directory:

```
/__tests__
  /components         → Component unit tests (RTL)
  /lib                → Business logic unit tests
  /integration        → Integration test suites
  /e2e                → End‑to‑end test scenarios
```

File names should match the tested file, e.g. `payCalculator.test.ts` tests `lib/payCalculator.ts`.

## Writing unit tests

- Import only the function being tested; avoid coupling tests to implementation details.
- Use descriptive `describe` and `it` blocks that read like documentation.
- Test happy paths **and** edge cases (e.g. zero hours, negative input, missing fields).
- Avoid stubbing too much internal logic – it hides bugs.

Example unit test for the payroll calculation logic:

```ts
// __tests__/lib/payCalculator.test.ts
import { calculatePayroll } from "@/lib/payCalculator";

describe("calculatePayroll", () => {
  it("calculates labor cost percentage and bonuses", () => {
    const result = calculatePayroll({
      revenue: 1000,
      hours: 40,
      rate: 15,
      goalPercent: 0.14,
    });
    // labor cost = 40 * 15 = 600, labor % = 600/1000 = 0.6
    expect(result.laborPercent).toBeCloseTo(0.6);
    expect(result.bonus).toBe(0); // above goal so no bonus
  });
});
```

## Integration testing

- Set up a test database or use an in‑memory database to avoid polluting production data.
- Use `supertest` or Next.js' built‑in `fetch` to call API routes directly.
- Mock external services (e.g. authentication) using MSW.
- Focus on workflow correctness: e.g. create a log via API, approve it, then verify a commission entry was matched and payroll was updated.

Example integration test skeleton:

```ts
import { appRouter } from "@/app/api";

describe("log approval workflow", () => {
  it("matches commissions on approval", async () => {
    // arrange: create commission entry and log via API
    const commission = await createCommission({ jobId: "ABC123", estimatedAmount: 500 });
    const log = await createLog({ jobId: "ABC123", revenue: 600 });
    // act: approve the log
    await approveLog(log.id);
    // assert: commission is matched to log
    const updated = await getCommission(commission.id);
    expect(updated.status).toBe("matched");
    expect(updated.actualRevenue).toBe(600);
  });
});
```

## End‑to‑end testing

- Use Playwright to drive a real browser.  Write tests from the perspective of a user, not a developer.
- Test critical flows: logging in, creating logs, approving logs, entering commissions, generating reports and viewing payroll.
- Configure E2E tests to run against a staging environment with seed data.
- Keep test suites deterministic; avoid relying on actual external services.

## Coverage and quality

- Aim for **80%+** line and branch coverage across the codebase.  High coverage does not guarantee quality, but low coverage is a red flag.
- Do not add trivial tests solely to increase coverage; focus on meaningful scenarios.
- Use `npm run test` (or equivalent) in CI to run all unit and integration tests on every pull request.

## Continuous improvement

- Review tests as part of code reviews.  Ensure tests accurately reflect requirements and are easy to understand.
- When a bug is found, write a failing test to reproduce it, then fix the code.  This prevents regressions.
- Regularly refactor tests to remove duplication and improve readability.

Following these testing standards will help maintain a robust, reliable codebase and ensure that HUNKCentral functions as intended across all scenarios.