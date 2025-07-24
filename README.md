# HUNKCentral - Workforce Management System

A modern digital workforce management system built for College Hunks Hauling Junk & Moving, replacing paper logs and Excel spreadsheets with a streamlined web application.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router and TypeScript
- **UI Library**: Shadcn/ui with New York theme
- **Styling**: Tailwind CSS with College Hunks brand colors
- **Database**: Supabase-hosted PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Vercel

## 🎨 Brand Colors

- **Primary**: `#026937` (College Hunks Green)
- **Secondary**: `#ea7200` (College Hunks Orange)

## 📁 Project Structure

```
/app
  /auth                → Login + password reset
  /(protected)         → Protected routes with middleware
    /dashboard         → Role-based dashboard views
    /logs              → Log creation, review, detail pages
    /commission        → Commission entry and tracking
    /reports           → Payroll and compensation reports
    /admin             → Administrative functions

/components
  /ui                  → Shadcn/ui base components
  /layout              → Layout and navigation components
  /auth                → Authentication components
  /features            → Feature-specific components

/lib
  /auth.ts             → Authentication utilities
  /prisma.ts           → Prisma client configuration
  /payCalculator.ts    → Payroll calculation logic
  /commissionMatcher.ts → Commission matching algorithms
  /validations.ts      → Zod schemas for validation
  /utils.ts            → General utility functions
  /constants.ts        → Application constants
  /routes.ts           → Route definitions

/hooks
  /useSession.ts       → Session management hook

/types
  /index.ts            → TypeScript type definitions
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (local or Supabase)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hunkcentral-v2
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your database and auth configuration
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio for database management
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database

## 🏗️ Implementation Status

### ✅ Phase 1: Foundation (Task 1) - COMPLETED

- [x] Next.js 15 project setup with TypeScript strict mode
- [x] Shadcn/ui configuration with New York theme
- [x] Tailwind CSS with College Hunks brand colors (#026937, #ea7200)
- [x] Core dependencies installed (React Hook Form, Zod, NextAuth.js, Prisma)
- [x] Proper folder structure following design document
- [x] Essential lib files (auth, constants, prisma, utils, validations)
- [x] Basic layout components (Header, Sidebar, MainLayout)
- [x] Protected route wrapper with role-based access control
- [x] Foundation UI components (Button, Input, Card, etc.)
- [x] Build verification and development server testing

### 🔄 Next Steps

- **Task 2**: Configure database and Prisma schema
- **Task 3**: Implement authentication system
- **Task 4**: Build basic layout and navigation
- **Task 5**: Create captain log form foundation

## 🎯 Key Features (Planned)

- **Captain Daily Logs**: Multi-section forms for Junk jobs, Move jobs, and Other hours
- **Manager Review**: Workflow for reviewing and approving submitted logs
- **Commission Tracking**: Sales staff can enter and track job commissions
- **Payroll Reports**: Comprehensive compensation reports with mixed pay models
- **User Management**: Role-based system with detailed compensation settings
- **Mobile-First Design**: Optimized for field workers using mobile devices

## 🔐 User Roles

- **Admin**: Full system access, user management, pay period management
- **Manager**: Review logs, generate reports, manage team operations
- **Captain**: Create daily logs, view own reports
- **Sales**: Enter commission entries, track bookings
- **Wingman**: View own payroll information

## 🚀 Deployment

The application is configured for deployment on Vercel:

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

## 📚 Documentation

- [Design Document](.kiro/specs/hunkcentral-workforce-app/design.md)
- [Requirements Document](.kiro/specs/hunkcentral-workforce-app/requirements.md)
- [Implementation Tasks](.kiro/specs/hunkcentral-workforce-app/tasks.md)

## 🤝 Contributing

This project follows a spec-driven development approach. Please refer to the task list and requirements before making changes.

## 📄 License

Private project for College Hunks Hauling Junk & Moving.
