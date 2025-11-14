# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router pages, layouts, API routes.
- `components/`, `hooks/`, `lib/`: UI primitives, hooks, and domain utilities.
- `__tests__/`: Unit/integration tests; E2E under `__tests__/e2e/`.
- `prisma/`: Schema, migrations, seed. `lib/prisma.ts` initializes client.
- `public/`: Static assets. `types/`, `contexts/`, `scripts/` for support code.

## Build, Test, and Development Commands

- `npm run dev`: Start Next.js (Turbopack) at `localhost:3000`.
- `npm run build` / `npm start`: Production build and serve.
- `npm run lint` / `npm run format`: ESLint/Prettier.
- `npm run type-check`: TypeScript no‐emit check.
- `npm test` / `npm run test:watch`: Vitest unit/integration tests.
- `npm run test:e2e`: Playwright E2E (auto‑starts dev server). First time: `npx playwright install`.
- DB: `npm run db:generate`, `db:push`, `db:migrate`, `db:studio`, `db:seed`.

## Coding Style & Naming Conventions

- TypeScript everywhere; 2‑space indent, single quotes, semicolons, print width 80 (see `.prettierrc`).
- ESLint: Next.js core‑web‑vitals + TypeScript; console limited to `warn`/`error`.
- Components: `PascalCase.tsx` in `components/`; hooks: `useThing.ts` in `hooks/`.
- Utilities: `lib/` prefer kebab‑case or clear domain names (e.g., `audit-trail.ts`).
- Tests: `*.test.ts(x)` colocated in `__tests__/` mirroring source paths.
- Imports: `@` alias resolves to repo root (see `vitest.config.ts`).

## Testing Guidelines

- Unit/UI: Vitest + Testing Library (`jsdom`), setup in `vitest.setup.ts`.
- Coverage: V8 reports (`text,json,html,lcov`) written to `coverage/`.
- E2E: Playwright projects for Chromium/Firefox/WebKit; base URL `http://localhost:3000`.
- Aim for meaningful coverage on changed code; add tests with clear Arrange‑Act‑Assert structure.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, optional scopes (e.g., `feat(ui): ...`).
- PRs include: purpose, linked issues, screenshots for UI, test plan/steps, DB notes if schema changes.
- Before opening: `npm run lint && npm run type-check && npm test` (and `npm run test:e2e` when applicable).

## Security & Configuration Tips

- Copy `.env.example` to `.env`; never commit secrets. Key vars: `DATABASE_URL`, NextAuth, VAPID.
- Prisma runs on `postinstall`; re‑generate after schema edits (`db:generate`).
