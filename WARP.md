# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Essential Commands

### Development

- `npm run dev` — Start Next.js with Turbopack at localhost:3000
- `npm run build` — Production build
- `npm start` — Serve production build

### Testing

- `npm test` — Run Vitest unit/integration tests
- `npm run test:watch` — Run tests in watch mode
- `npm test -- path/to/file.test.ts` — Run single test file
- `npm test -- -t "pattern"` — Run tests matching pattern
- `npm run test:e2e` — Run Playwright E2E tests (first time: `npx playwright install`)

### Database (Prisma + Supabase PostgreSQL)

- `npm run db:generate` — Regenerate Prisma client after schema changes
- `npm run db:push` — Push schema to database (no migration)
- `npm run db:migrate` — Create and apply migrations
- `npm run db:studio` — Open Prisma Studio GUI
- `npm run db:seed` — Seed database with test data

### Code Quality

- `npm run lint` — Run ESLint
- `npm run format` — Format code with Prettier
- `npm run type-check` — TypeScript validation (no emit)

## Architecture Overview

### Next.js 15 App Router with Server Components

- **Server Actions** for all data mutations (in `lib/actions/`)
- **Protected Routes Pattern**: Three-layer enforcement
  1. `middleware.ts` — Route-level authentication and role checks
  2. Layout guards (e.g., `app/(protected)/layout.tsx`) — Server-side session validation
  3. Component guards — UI-level permissions and re-verification on actions

### Authentication & Authorization

- **NextAuth.js** configured in `lib/auth-config.ts`
- **Five Roles**: `admin`, `manager`, `captain`, `sales`, `wingman`
- **RBAC enforced** at middleware, layout, and component levels to prevent privilege escalation
- Session management via `lib/auth.ts` and `lib/server-auth.ts`

### Data Flow Architecture

```
PostgreSQL (Supabase) → Prisma Client → Server Actions → React Components
```

- All database writes go through server actions
- Audit trail logged on every mutation via `lib/auditLogger.ts`
- Prisma Decimal types converted to numbers at application boundary using `lib/decimal-utils.ts`

### Key Business Systems

#### Payroll Calculation (`lib/payCalculator.ts`)

- **Mixed compensation model**: Hourly wages + salary + commission + bonuses
- **Department-specific rates**: Separate rates for Junk Captain/Wingman, Move Captain/Wingman, Zigma, Training, Estimating, Warehouse, Admin
- **Labor efficiency bonuses**: Department-specific thresholds (14% for Junk, 24% for Move)
- **Tip distribution**: Based on team participation
- **Weekly calculation, bi-weekly payment**: Bonuses calculated per week, paid in bi-weekly checks

#### Commission Matching (`lib/commissionMatcher.ts`, `lib/commissionMatchingService.ts`)

- **Fuzzy matching algorithm**: Matches sales commissions to completed jobs
- **Multiple criteria**: Job IDs, client names, target dates
- **Conflict resolution**: Handles multiple match scenarios

#### Daily Log System

- **Multi-section forms**: Junk jobs, Move jobs, Other hours (Training/Admin/Warehouse/Estimating/Zigma only)
- **Team hours tracking**: With co-captain designation
- **Three-stage workflow**: draft → submitted → approved
- **Data flow**: Approved logs feed payroll calculations, overtime tracking, and labor cost analytics

## Critical Files & Patterns

### Core Files

- `prisma/schema.prisma` — Complete database schema
- `lib/auth-config.ts` — NextAuth configuration and role mapping
- `lib/payCalculator.ts` — Core payroll calculation engine
- `lib/validations.ts` — Zod schemas for all form validation
- `lib/decimal-utils.ts` — Prisma Decimal ⇄ number conversions
- `middleware.ts` — Route protection and RBAC entry point

### Component Organization

- `components/features/` — Feature-specific components (logs, dashboard, etc.)
- `components/ui/` — Shadcn/ui primitives (New York theme)
- `components/brand/` — College Hunks branded components
- `components/forms/` — Reusable form components

## Development Guidelines

### Decimal Type Handling (CRITICAL)

- **Never pass Prisma.Decimal to components** — Convert using `lib/decimal-utils.ts` at server action boundaries
- **Never serialize Prisma.Decimal to JSON** — Convert before returning from server actions
- Use `decimalToNumber()` and `numberToDecimal()` from `lib/decimal-utils.ts`

### Data Validation

- Use Zod schemas from `lib/validations.ts` for all form inputs and server actions
- Add new schemas to `lib/validations.ts` rather than inline definitions

### Server Actions

- Include robust error handling with typed error responses
- Log all mutations via `lib/auditLogger.ts`
- Return structured responses: `{ success: boolean, data?: T, error?: string }`

### Business Logic

- Payroll calculations must support mixed compensation models
- Commission matching requires fuzzy matching on multiple criteria
- All financial calculations maintain precision using Decimal types in database (convert at edges)
- Labor efficiency bonuses are department-specific with different thresholds

### UI/UX

- **Mobile-first design** with offline support via service worker
- **College Hunks brand colors**: Primary `#026937` (green), Secondary `#ea7200` (orange)
- Form autosave to prevent data loss
- Real-time validation with debounced inputs

### Testing

- Vitest + Testing Library for unit/integration tests (`jsdom`)
- Playwright E2E tests (base URL: `http://localhost:3000`)
- Import alias `@` resolves to repo root
- Follow Arrange-Act-Assert structure

### Commits & PRs

- Follow Conventional Commits: `feat:`, `fix:`, `chore:` with optional scopes
- Run `npm run lint && npm run type-check && npm test` before opening PRs
- Include purpose, linked issues, screenshots (for UI), test plan, and DB notes (if schema changes)

## Important Project Context

This is a workforce management system for College Hunks Hauling Junk & Moving that replaces paper logs and Excel spreadsheets. The system emphasizes:

- **Employee transparency**: Workers can see their effective hourly rate including tips and bonuses
- **Real-time metrics**: Captains track their labor cost percentage to optimize performance
- **Flashy UX**: Smooth transitions, animations, and encouraging stats to drive performance
- **Labor efficiency**: Track and reward teams that hit department-specific labor cost goals
