# Project Structure & Organization

## Application Structure

```
/app
  /auth                → Login + password reset
  /(protected)         → Protected routes with middleware
    /dashboard         → Role-based dashboard views
    /logs              → Log creation, review, detail pages
      /create          → Captain log creation form
      /[id]            → Individual log detail view
      /review          → Manager review interface
    /commission        → Commission entry and tracking
      /create          → Sales commission entry form
      /list            → Commission status tracking
    /reports           → Payroll and compensation reports
      /payroll         → Administrative payroll reports
      /my-payroll      → Employee self-service view
    /admin             → Administrative functions
      /users           → User management interface
      /pay-periods     → Pay period management

/components
  /ui                  → Shadcn/ui base components
  /features            → Feature-specific components
    /logs              → Log-related components
    /commission        → Commission components
    /reports           → Report components
    /auth              → Authentication components
  /layout              → Layout and navigation components
  /forms               → Reusable form components

/lib
  /auth.ts             → Authentication utilities and session helpers
  /prisma.ts           → Prisma client configuration
  /payCalculator.ts    → Payroll and bonus calculation logic
  /commissionMatcher.ts → Commission matching algorithms
  /validations.ts      → Zod schemas for form validation
  /utils.ts            → General utility functions
  /constants.ts        → Application constants and enums

/hooks
  /useSession.ts       → Session management hook
  /useLogs.ts          → Log data fetching hooks
  /useCommission.ts    → Commission data hooks
  /useUsers.ts         → User management hooks

/types
  /index.ts            → TypeScript type definitions
  /database.ts         → Database model types
  /api.ts              → API response types
```

## Key Architectural Decisions

### Route Organization
- **Protected Routes**: All main application routes under `/(protected)` with middleware
- **Role-Based Access**: Dashboard and admin routes adapt based on user roles
- **RESTful Patterns**: Consistent URL patterns for CRUD operations

### Component Architecture
- **Feature-Based**: Components organized by business domain
- **Composition**: Small, reusable components that compose into larger features
- **Server/Client Split**: Clear separation between server and client components

### Data Layer
- **Prisma Models**: Single source of truth for database schema
- **Server Actions**: Handle all data mutations
- **Type Safety**: Full TypeScript coverage from database to UI

### Form Patterns
- **Unified Forms**: Consistent form handling with React Hook Form + Zod
- **Auto-save**: Draft functionality for complex forms
- **Real-time Validation**: Immediate feedback on user input

## File Naming Conventions

- **Components**: PascalCase (e.g., `LogForm.tsx`, `UserManager.tsx`)
- **Pages**: lowercase with hyphens (e.g., `create-log`, `pay-periods`)
- **Utilities**: camelCase (e.g., `payCalculator.ts`, `authHelpers.ts`)
- **Types**: PascalCase interfaces/types (e.g., `User`, `DailyLog`)

## Database Schema Organization

### Core Models
- **User**: Authentication and compensation settings
- **DailyLog**: Captain work logs with approval workflow
- **LogJob**: Individual jobs within daily logs
- **LogHour**: Employee hours by department
- **CommissionEntry**: Sales commission tracking
- **PayPeriod**: Payroll period management
- **AuditLog**: Change tracking and audit trail

### Relationships
- One-to-many: User → DailyLogs, DailyLog → LogJobs/LogHours
- Many-to-one: CommissionEntry → User (sales), LogHour → User (employee)
- Optional: CommissionEntry → DailyLog (when matched)

## Testing Structure

```
/__tests__
  /components         → Component unit tests
  /lib               → Business logic unit tests
  /integration       → Integration test suites
  /e2e              → End-to-end test scenarios
```

## Environment Configuration

- **Development**: Local database, debug logging enabled
- **Preview**: Vercel preview deployments for PRs
- **Production**: Supabase cloud database, error tracking enabled