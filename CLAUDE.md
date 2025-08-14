# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HUNKCentral is a workforce management system for College Hunks Hauling Junk & Moving, built with Next.js 15, TypeScript, and Supabase. It replaces paper logs and Excel spreadsheets with a digital solution for managing daily captain logs, payroll calculations, and commission tracking.

## Common Development Commands

### Development

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
```

### Testing

```bash
npm test                    # Run all tests once
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
npm run test:ui            # Open Vitest UI
npm run test:integration   # Run integration tests only
npm run test:e2e           # Run Playwright E2E tests
npm run test:e2e:ui        # Run Playwright tests with UI
npm run test:edge-cases    # Run edge case tests
npm run test:performance   # Run performance tests
npm run test:comprehensive # Run comprehensive test suite

# Run a single test file
npm test -- auth.test.ts
npm test -- __tests__/components/brand-button.test.tsx
```

### Database

```bash
npx prisma generate        # Generate Prisma client
npx prisma db push        # Push schema changes to database
npx prisma migrate dev    # Create and apply migrations
npx prisma studio         # Open Prisma Studio GUI
npm run db:seed           # Seed database with test data
```

### Code Quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without fixing
```

## Architecture Overview

### Authentication & Authorization

- NextAuth.js with credentials provider for authentication
- Role-based access control (RBAC) with five roles: admin, manager, captain, sales, wingman
- Session management via `lib/auth.ts` and `lib/auth-config.ts`
- Protected routes using middleware and layout components

### Data Flow Architecture

1. **Database Layer**: PostgreSQL via Supabase with Prisma ORM
2. **Server Actions**: All data mutations through server actions in `lib/actions/`
3. **Type Safety**: Prisma Decimal types converted to numbers at application layer using `lib/decimal-utils.ts`
4. **Client Components**: React Hook Form + Zod for form validation

### Key Business Logic

#### Payroll Calculation System (`lib/payCalculator.ts`)

- Mixed compensation model supporting hourly wages, salary, commission, and bonuses
- Department-specific hourly rates (Junk Captain/Wingman, Move Captain/Wingman, etc.)
- Labor efficiency bonuses when teams hit department-specific goals
- Tip distribution based on team participation

#### Commission Matching (`lib/commissionMatcher.ts`, `lib/commissionMatchingService.ts`)

- Intelligent matching of sales commissions to completed jobs
- Fuzzy matching on job IDs, client names, and dates
- Conflict resolution for multiple matches

#### Daily Log System

- Multi-section forms for Junk jobs, Move jobs, and Other hours
- Team hours tracking with co-captain designation
- Three-stage workflow: draft → submitted → approved

### UI Architecture

- Shadcn/ui components with New York theme
- College Hunks brand colors: Primary `#026937` (green), Secondary `#ea7200` (orange)
- Mobile-first responsive design
- Offline support with service worker and local storage

### State Management

- Server state via React Server Components
- Form state via React Hook Form
- UI state via React hooks and context
- Offline state via `lib/offlinePayrollManager.ts`

### Critical Files

- `prisma/schema.prisma` - Database schema defining all entities
- `lib/auth-config.ts` - NextAuth configuration
- `lib/payCalculator.ts` - Core payroll calculation engine
- `lib/validations.ts` - Zod schemas for data validation
- `middleware.ts` - Route protection and authentication

### Testing Strategy

- Unit tests with Vitest for business logic
- Integration tests for workflows
- E2E tests with Playwright for critical user journeys
- Performance tests for payroll calculations
- Edge case tests for calculation accuracy

### Deployment

- Vercel deployment with automatic builds on push
- Environment variables for database and auth configuration
- Service worker for offline functionality
