# HunkCentral Recreation Instructions

## System Overview

HunkCentral is a digital workforce management system for College Hunks Hauling Junk & Moving that replaces paper logs and Excel spreadsheets. It handles daily captain logs, payroll calculations, commission tracking, and role-based dashboards.

## Core Business Workflows

### 1. Daily Log Management Workflow

- **Captain Submission**: Captains submit end-of-day logs with job details, revenue, employee hours, and tips
- **Three-Stage Process**: Draft → Submitted → Approved
- **Multi-Section Forms**: Junk jobs, Move jobs, Other hours with department-specific tracking
- **Team Hours Tracking**: Employee assignments with co-captain designation
- **Real-time Calculations**: Labor cost percentages, tip distribution, bonus eligibility

### 2. Payroll Calculation Engine

- **Mixed Compensation Model**: Hourly wages + salary + commission + bonuses
- **Department-Specific Rates**: Junk Captain/Wingman, Move Captain/Wingman rates
- **Labor Efficiency Bonuses**: 14% goal for junk operations, 24% for move operations
- **Tip Distribution**: Equal distribution among team members per section
- **Salary Override Logic**: Salary vs hourly + other compensation (whichever is higher)

### 3. Commission Matching System

- **Intelligent Matching**: Fuzzy matching on job IDs, client names, and dates
- **Conflict Resolution**: Handle multiple commission entries for same job
- **Booking Accuracy**: Calculate variance between estimated and actual revenue
- **Status Tracking**: Pending → Matched → Paid workflow

### 4. Role-Based Access Control

- **Five User Roles**: Admin, Manager, Captain, Sales, Wingman
- **Granular Permissions**: Role-based dashboard content and feature access
- **Location-Based Access**: Multi-location support with location restrictions

## Technical Architecture Requirements

### Tech Stack

```typescript
// Core Framework
Next.js 15 (App Router) + TypeScript (strict mode)
Shadcn/ui (New York theme) + Tailwind CSS v4
React Hook Form + Zod validation (mandatory for all forms)
NextAuth.js with credentials provider
Supabase PostgreSQL + Prisma ORM
Vercel deployment
```

### Database Schema Essentials

```prisma
// Key Models
User (roles, compensation settings, location access)
DailyLog (captain, date, status, pre-computed totals)
LogJob (job details, revenue, tips, department-specific fields)
LogHour (employee hours, department, co-captain status)
CommissionEntry (sales tracking, matching status)
PayPeriod (open/locked/closed status)
AuditLog (complete change tracking)
```

### Critical Business Logic

```typescript
// Payroll Calculator
- calculateLaborCost(hours, rates) → department-specific rates
- calculateLaborPercentage(laborCost, revenue) → efficiency metrics
- calculateBonus(laborPercent, goalPercent, revenue) → captain bonuses
- applySalaryRules(user, wages, tips, commission, bonuses) → final pay

// Commission Matcher
- findCommissionMatches(jobId, entries) → fuzzy matching
- calculateBookingAccuracy(estimated, actual) → variance tracking
- resolveConflicts(matches) → conflict resolution

// Tip Distribution
- distributeTips(sectionTips, teamMembers) → equal distribution
```

## UI/UX Implementation Guidelines

### Dashboard Architecture

```typescript
// Role-Specific Dashboards using dashboard-01 block pattern
CaptainDashboard: Personal payroll, job stats, labor cost trends
ManagerDashboard: Pending approvals, team performance, exception alerts
AdminDashboard: System metrics, user management, audit logs
SalesDashboard: Commission tracking, booking pipeline, targets
WingmanDashboard: Personal hours, tips, schedule
```

### Form Design Patterns

```typescript
// Multi-Section Log Form
<Tabs> for Junk/Move/Other Hours sections
<Card> containers for job entries
<Accordion> for team hours
Real-time calculations with debounced inputs
Autosave functionality with offline support
```

### Mobile-First Design

```css
/* College Hunks Brand Colors */
Primary: #026937 (green)
Secondary: #ea7200 (orange)
Mobile-optimized forms with touch-friendly inputs
Offline support via service worker
Progressive Web App capabilities
```

## Key Business Rules to Implement

### Payroll Rules

1. All payroll data comes from approved daily logs only
2. Labor bonus goals: 14% for junk, 24% for moves (captains only)
3. Tips distributed equally among all team members in each section
4. Salary vs hourly: use whichever results in higher pay
5. Co-captains get captain rates, regular employees get wingman rates

### Commission Rules

1. Commission entries match to completed jobs via job ID
2. Multiple matches create conflicts requiring manual resolution
3. Booking accuracy calculated as variance between estimated/actual revenue
4. Commission rate applied to actual revenue, not estimated

### Access Control Rules

1. Captains: Create/edit own logs, view personal payroll
2. Managers: Approve logs, edit team data, view team reports
3. Sales: Enter commissions, view commission reports
4. Admins: Full system access, user management, pay period control
5. Wingmen: View personal payroll and hours only

## Critical Implementation Details

### Data Precision

```typescript
// Use Prisma Decimal for all financial calculations
// Convert to numbers at application layer using decimal-utils.ts
// Maintain precision throughout calculation chain
```

### Performance Optimization

```typescript
// Pre-computed metrics for dashboard performance
// Background job processing for heavy calculations
// Optimized database queries with proper indexing
// Real-time updates with optimistic UI patterns
```

### Security & Audit

```typescript
// Complete audit trail for all data changes
// Role-based middleware protection
// Session management with timeout warnings
// Secure credential handling
```

### Testing Strategy

```typescript
// Unit tests for business logic (payroll, commission matching)
// Integration tests for workflows
// E2E tests for critical user journeys
// Performance tests for calculation accuracy
```

## Development Workflow

1. **Start with database schema** - Define all models and relationships
2. **Implement authentication** - NextAuth with role-based access
3. **Build core business logic** - Payroll calculator and commission matcher
4. **Create form components** - Daily log forms with validation
5. **Develop dashboards** - Role-specific views with metrics
6. **Add reporting features** - Payroll reports and exports
7. **Implement audit system** - Complete change tracking
8. **Mobile optimization** - PWA features and offline support

## Success Metrics

- Replace paper logs with 100% digital submission
- Reduce payroll processing time by 80%
- Eliminate manual commission matching errors
- Provide real-time labor cost visibility
- Enable mobile-first captain workflow

This system is essentially a comprehensive ERP for workforce management with sophisticated payroll calculations, commission tracking, and role-based workflows tailored specifically for the College Hunks business model.
