# HUNKCentral Complete Rebuild - Comprehensive Product Requirements Document

## Executive Summary

This document provides complete specifications for rebuilding HUNKCentral, a workforce management system for College Hunks Hauling Junk & Moving. The current system suffers from performance issues, poor UX, and architectural problems. This rebuild will create a modern, efficient system from scratch.

## Current System Problems

### Performance Issues
- Multiple sequential database queries (6+ separate queries for dashboard metrics)
- Heavy calculations on every page load instead of pre-computation
- Slow loading times and poor user experience
- Inefficient data flow: Page loads → Session loads → General metrics → Role metrics → Render tiles

### User Experience Problems
- Basic dashboard blocks that don't align with role-specific needs
- Currency input fields with undeletable zeros
- Non-fluid workflows that aren't enjoyable to use
- Poor mobile experience for field workers

### Technical Debt
- Architectural bloat not suited for complex business operations
- Lack of optimization for workforce management workflows
- No pre-computed metrics or efficient caching

## Business Context

### Core Business Functions
- **Captain Daily Logs**: End-of-day reporting with job details, revenue, employee hours, tips, upsell stats
- **Manager Review**: Approval workflow for submitted logs with editing capabilities
- **Commission Tracking**: Sales consultant job bookings that match to completed work
- **Payroll Processing**: All compensation calculations based on approved log data
- **User Management**: Role-based access with detailed compensation settings

### Key Business Rules
- All payroll data comes from approved end-of-day log sheets
- Commission entries match to completed jobs via job ID numbers
- Labor bonus goals: Junk operations 14%, Move operations 24%
- Mixed compensation: hourly, salary, commission, and bonuses
- Role-based access: admin, manager, captain, sales, wingman

### User Roles and Responsibilities

#### Captains
- Submit daily logs from home (not in field)
- View personal payroll status, tips, labor bonuses
- Track log submission history

#### Wingmen
- View personal payroll information
- Check hours and tips earned

#### Managers
- Review and approve captain logs
- Quick edit hours, revenue, employee assignments
- View team performance and pending approvals

#### Sales Consultants
- Create commission entries for booked jobs
- Track commission status and earnings

#### System Administrators
- Manage users (add, edit, duplicate, delete)
- Control pay periods (create, edit, lock, unlock, close, open)
- Manage access levels and permissions
- Generate payroll reports

## Technical Requirements

### Technology Stack (MANDATORY)
- **Framework**: Next.js 15 with App Router and TypeScript (strict mode)
- **UI Library**: Shadcn/ui with New York theme - USE BLOCKS WHERE AVAILABLE
- **Styling**: Tailwind CSS v4 with College Hunks brand colors
- **Database**: Supabase-hosted PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Forms**: React Hook Form + Zod validation (required for all forms)
- **State Management**: Zustand (minimal usage, prefer server state)
- **Deployment**: Vercel

### Brand Colors (MANDATORY)
- Primary: `#026937` (College Hunks Green)
- Secondary: `#ea7200` (College Hunks Orange)

### Development Standards (MANDATORY)
- TypeScript strict mode enabled, NO `any` types allowed
- ESLint and TSC checks MUST be run after each task completion
- Use ONLY shadcn/ui blocks and components - NO custom UI components
- React Hook Form + Zod for ALL forms
- Comprehensive unit tests for business logic
- Mobile-first responsive design

## Functional Requirements

### 1. Role-Specific Modern Dashboards

#### Dashboard Design Requirements
- Use modern shadcn/ui components: charts, tables, progress bars, cards
- Interactive data visualization with hover states and animations
- Date range selector on all dashboards (defaults to current pay period)
- Pay periods are 2-week periods (e.g., PP17: 08/03/2025 - 08/16/2025)
- Real-time updates when date range changes
- Responsive design for mobile and desktop viewing

#### Captain Dashboard
- Personal payroll status (current hours, tips, labor bonuses)
- Job statistics: number of jobs by category (Junk/Move), average job size (AJS)
- Performance metrics: Junk labor cost %, Move labor cost %
- Financial summary: total revenue, total tips, total hours
- Log submission history and status
- Interactive charts and progress indicators
- Date range selector (defaults to current pay period)

#### Wingman Dashboard
- Personal payroll information
- Hours and tips earned
- Schedule and assignment information

#### Manager Dashboard
- Pending log approvals queue
- Team performance overview
- Labor cost trends and alerts
- Quick action buttons for common tasks

#### Sales Dashboard
- Commission tracking and status
- Booking pipeline and targets
- Performance metrics and trends

#### Admin Dashboard
- System health and user activity
- Payroll processing status
- Administrative alerts and tasks
- User management shortcuts

### 2. Optimized Log Creation System

#### Core Features
- Clean form with sections for Junk jobs, Move jobs, Other hours
- Captain field pre-populated with current user (if captain role)
- Dynamic job tiles with "Add Another Job" functionality
- Dynamic employee hour entries with "Add HUNK" functionality
- Real-time calculations for labor costs, tips per HUNK, percentages

#### Input Requirements
- Currency fields WITHOUT pre-filled zeros that can be easily cleared
- Appropriate keyboard types for mobile (number pad for amounts)
- Large touch targets (minimum 44px) for mobile use
- Clean, modern input styling with proper validation

#### Calculations (Real-time)
- Tips per HUNK: total section tips ÷ number of employees
- Labor cost percentage: labor cost ÷ revenue
- Disposal cost percentage (Junk section)
- Upsell percentage (Move section)
- Labor bonuses when under target goals

### 3. Manager Review Interface

#### Review Queue
- Prioritized list of pending logs
- Key metrics visible without opening log
- Bulk approval capabilities
- Search and filter options

#### Log Review
- Side-by-side comparison view
- Inline editing for key fields (hours, revenue, employee assignments)
- Anomaly highlighting and suggested corrections
- Quick approval with one-click actions

#### Approval Process
- Immediate commission matching upon approval
- Audit trail creation
- Payroll data updates
- Status change notifications

### 4. Commission Tracking System

#### Entry Creation
- Minimal fields: client name, job ID (numeric, 7-10 digits), estimated amount, target date, job type
- Sales consultant selection (defaults to current user if sales role)
- Clean, simple form interface with proper job ID validation

#### Automatic Matching
- Match commission entries to completed jobs via job ID
- Update actual revenue from approved logs
- Calculate commission: actual revenue × commission rate
- Handle conflicts and duplicates

#### Status Tracking
- Pending: awaiting job completion
- Matched: job completed and matched
- Approved: included in payroll
- Booking accuracy metrics (estimated vs actual)

### 5. User Management System

#### User Operations
- Add, edit, duplicate, delete users
- Bulk operations for efficiency
- Role assignment with multiple roles per user
- Compensation settings (9 department rates, salary, commission, bonuses)

#### Compensation Configuration
- Department-specific hourly rates (junk captain/wingman, move captain/wingman, zigma, training, estimating, warehouse, admin)
- Salary settings (amount, frequency, type: base/guaranteed/supplemental)
- Commission rates and bonus goals
- Template functionality for copying settings

#### Access Control
- Granular role-based permissions
- User activation/deactivation
- Historical data preservation

### 6. Pay Period Management

#### Period Operations
- Create, edit, delete pay periods
- Lock, unlock, close, open periods
- Status workflow controls
- Data integrity validation

#### Status Controls
- Open: normal operations allowed
- Locked: prevent modifications to logs/commissions
- Closed: finalize calculations, prevent all changes
- Historical access maintained

### 7. Payroll Report Generation

#### Report Types
- Individual employee payroll breakdown
- Department summaries
- Commission reports
- Labor cost analysis
- Tip distribution reports

#### Calculation Logic
- Hours by department for each employee
- Appropriate rates (wingman default, captain for captains/co-captains)
- Tip distribution (equal among team members per section)
- Labor bonuses: (goal% - actual%) × revenue for qualifying captains
- Mixed compensation handling (hourly + salary + commission + bonuses)

#### Export Capabilities
- Multiple formats (PDF, Excel, CSV)
- ADP-compatible formatting
- Custom date ranges
- Detailed breakdowns

### 8. Performance Optimization

#### Database Optimization
- Single optimized queries instead of multiple sequential queries
- Pre-computed metrics updated incrementally
- Proper indexing and query optimization
- Background job processing for heavy calculations

#### Caching Strategy
- Intelligent caching of calculated values
- Cache invalidation on data changes
- Session-based caching for user-specific data

#### Loading Performance
- Page load times under 1 second
- Dashboard metrics load instantly
- Skeleton screens during loading
- Progressive loading for large datasets

## User Interface Requirements

### Design System
- Use shadcn/ui blocks wherever available (dashboard-01, login-02, sidebar-07, etc.)
- New York theme with consistent typography and spacing
- College Hunks brand colors throughout
- Modern dashboard components: charts, tables, progress indicators, not just basic tiles
- Interactive data visualization with hover states and drill-down capabilities
- Date range selectors on all dashboards (default to current pay period)

### Animation Requirements
- Smooth page transitions
- Loading animations and skeleton screens
- Success/error feedback animations
- Hover states and micro-interactions
- Form submission feedback

### Mobile Optimization
- Mobile-first responsive design
- Touch-optimized interfaces
- Bottom navigation for mobile
- Appropriate keyboard types
- Thumb-friendly touch targets

### Form Design
- Clean input fields without pre-filled zeros
- Real-time validation with clear error messages
- Logical field grouping and flow
- Save confirmation and status indicators

## Data Models

### Core Entities

#### User
- Authentication (email, password)
- Personal info (name, roles)
- Compensation settings (9 department rates, salary, commission, bonuses)
- Audit fields (created, updated)

#### DailyLog
- Captain assignment and date
- Status workflow (draft, submitted, approved)
- Audit trail (created by, edited by, approved by)
- Related jobs and hours

#### LogJob
- Job details (type, ID, client, revenue, tips)
- Section-specific fields (upsells for Move, disposal for Junk)
- Relationship to daily log

#### LogHour
- Employee and department assignment
- Hours worked and co-captain status
- Relationship to daily log and employee

#### CommissionEntry
- Sales consultant and job details
- Revenue estimates and actuals
- Matching status and calculations
- Relationship to completed logs

#### PayPeriod
- Date ranges and status
- Workflow controls
- Historical preservation

#### AuditLog (Simple)
- Basic change tracking
- User and timestamp
- Entity type and action
- Simple before/after values

### Relationships
- User → DailyLogs (one-to-many)
- DailyLog → LogJobs, LogHours (one-to-many)
- User → LogHours (one-to-many)
- User → CommissionEntries (one-to-many)
- CommissionEntry → DailyLog (optional match)

## Business Logic

### Payroll Calculations

#### Labor Cost Calculation
```
Labor Cost = Σ(hours × rate) for all employees
Rate = wingman rate (default) or captain rate (for captains/co-captains)
Labor Percentage = Labor Cost ÷ Revenue × 100
```

#### Bonus Calculation
```
Bonus = max((goalPercent - actualLaborPercent), 0) × revenue
Junk Goal: 14%
Move Goal: 24%
Only captains receive bonuses
```

#### Tip Distribution
```
Tips per HUNK = Total Section Tips ÷ Number of Employees in Section
Equal distribution among all team members
```

#### Commission Calculation
```
Commission = Actual Revenue × Commission Rate
Only calculated after job completion and matching
```

#### Mixed Compensation
- Base Salary: replaces hourly wages
- Guaranteed Salary: minimum amount (higher of salary or calculated earnings)
- Supplemental Salary: added to other earnings
- Final Pay = max(hourly + tips + commission + bonus, guaranteed salary) + supplemental salary

### Validation Rules

#### Input Validation
- Revenue: minimum $1.00, maximum $10,000,000
- Tips: minimum $0.00
- Hours: maximum 24 per employee per day
- Job IDs: numeric only, 7-10 digits long, must be unique across commission entries
- Required fields: job type, client name, job ID, revenue

#### Business Rules
- Commission entries can only match to one completed job
- Pay period locking prevents data modifications
- Audit trail required for all data changes
- Role-based access enforcement

## Implementation Guidelines

### Development Process
1. Set up project with required tech stack
2. Configure shadcn/ui with New York theme and brand colors
3. Implement authentication and role-based access
4. Build role-specific dashboards using shadcn/ui blocks
5. Create optimized log creation and review workflows
6. Implement commission tracking and matching
7. Build user management and pay period controls
8. Create payroll reporting and export functionality
9. Add performance optimizations and caching
10. Comprehensive testing and deployment

### Code Quality Requirements
- TypeScript strict mode, no `any` types
- ESLint and TSC checks after each task
- Unit tests for all business logic
- Integration tests for critical workflows
- Proper error handling and validation
- Clean, maintainable code structure

### Performance Requirements
- Page load times under 1 second
- Dashboard metrics load instantly
- Single optimized database queries
- Pre-computed metrics with incremental updates
- Efficient caching and invalidation

### Testing Requirements
- Unit tests for calculation logic
- Integration tests for workflows
- End-to-end tests for critical paths
- Mobile responsiveness testing
- Cross-browser compatibility

## Success Criteria

### Performance Metrics
- 90% reduction in dashboard load time
- Elimination of sequential database queries
- Page loads under 1 second
- Form submissions under 500ms response time

### User Experience Metrics
- Captain log submission under 2 minutes
- Manager log review under 30 seconds
- Clean currency inputs without pre-filled zeros
- Smooth animations and modern feel
- 100% mobile responsiveness

### Business Impact
- Role-specific dashboards aligned with job responsibilities
- Improved workflow efficiency
- Better data accuracy and validation
- Modern, maintainable codebase
- Scalable architecture for future growth

## Conclusion

This comprehensive PRD provides all necessary specifications for rebuilding HUNKCentral as a modern, efficient workforce management system. The focus on performance optimization, role-specific user experiences, and clean technical implementation will address all current system problems while providing a solid foundation for future development.

The emphasis on using shadcn/ui blocks, Tailwind CSS v4, and modern React patterns will ensure a contemporary user interface that's both functional and visually appealing. The detailed business logic and technical requirements provide clear guidance for implementation while maintaining the complexity needed for effective workforce management.