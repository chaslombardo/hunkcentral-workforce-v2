# Technology Stack & Development Guidelines

## Core Stack

- **Framework**: Next.js 15 with App Router and TypeScript (strict mode)
- **UI Library**: Shadcn/ui with New York theme (use shadcn/ui blocks where possible)
- **Styling**: Tailwind CSS with custom brand colors
- **Database**: Supabase-hosted PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand (minimal usage, prefer server state)
- **Deployment**: Vercel

## Brand Colors

- Primary: `#026937` (College Hunks Green)
- Secondary: `#ea7200` (College Hunks Orange)

## Architecture Patterns

- **Server Components**: Use React Server Components for data-heavy pages
- **Server Actions**: Handle form submissions and mutations
- **Client Components**: Only for interactive UI elements
- **Row-Level Security**: Database policies for all tables
- **Mobile-First**: Responsive design with touch-optimized interfaces

## Development Commands

```bash
# Project setup
npx create-next-app@latest hunkcentral-v2 --typescript --tailwind --app --src-dir=false --eslint
npm install next-auth @prisma/client react-hook-form @hookform/resolvers zod date-fns lucide-react
npm install -D prisma

# Shadcn/ui setup
npx shadcn@latest init -d  # Choose New York theme, green color

# Database operations
npx prisma generate
npx prisma db push
npx prisma studio

# Development
npm run dev
npm run build
npm run start
npm run lint
```

## Code Quality Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **Testing**: Unit tests for business logic, integration tests for workflows
- **Performance**: Lighthouse score > 90, page loads < 1 second
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: Input validation, CSRF protection, secure sessions

## State Management Philosophy

- **Server State**: Prisma via Server Actions and Server Components
- **Form State**: React Hook Form + Zod schemas
- **Client State**: Local useState/useEffect, minimal global state
- **Global State**: Zustand only when absolutely necessary (shared filters, etc.)

## Performance Targets

- Page load time: < 1 second
- Time to interactive: < 2 seconds
- First input delay: < 100ms
- Auto-save: Every 30 seconds for forms