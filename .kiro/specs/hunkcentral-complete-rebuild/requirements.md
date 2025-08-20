# HUNKCentral Complete Rebuild - Product Requirements Document

## Introduction

This document outlines the complete rebuild of HUNKCentral, a digital workforce management system for College Hunks Hauling Junk & Moving. The current system suffers from performance issues, poor user experience, architectural bloat, and misaligned dashboards that don't serve each role effectively. This rebuild will create a modern, performant, and user-centric application from scratch.

**Key Problems with Current System:**

- Slow loading times due to multiple sequential database queries
- Basic dashboard blocks that don't align with role-specific needs
- Heavy calculations performed on every page load instead of pre-computation
- Poor workflow design that isn't fluid or enjoyable
- Input field issues (currency fields with undeletable zeros)
- Architectural bloat not suited for complex business operations

**Rebuild Goals:**

- Modern, smooth, and crisp UI using shadcn/ui blocks with New York theme
- Optimized performance with pre-computed metrics and efficient queries
- Role-specific dashboards that align with job responsibilities
- Fluid, enjoyable workflows with animations and polished interactions
- Tailwind CSS v4 with branded colors (#026937 green, #ea7200 orange)
- Mobile-first responsive design
- TypeScript strict mode with comprehensive linting

## Requirements

### Requirement 1: Modern Performance-Optimized Architecture

**User Story:** As a system user, I want the application to load instantly and respond immediately to my actions, so that I can complete my work efficiently without waiting.

#### Acceptance Criteria

1. WHEN any page loads THEN the system SHALL achieve page load times under 500ms
2. WHEN dashboard metrics are displayed THEN the system SHALL use pre-computed aggregations instead of real-time calculations
3. WHEN multiple database queries are needed THEN the system SHALL use optimized batch queries or single queries with joins
4. WHEN heavy calculations are required THEN the system SHALL perform them asynchronously in background jobs
5. WHEN data changes THEN the system SHALL update pre-computed metrics using incremental updates
6. WHEN users navigate between pages THEN the system SHALL use optimized caching and prefetching
7. WHEN the system performs calculations THEN it SHALL cache results and invalidate only when underlying data changes
8. WHEN displaying real-time data THEN the system SHALL use efficient WebSocket connections or optimized polling

### Requirement 2: Role-Specific Modern Dashboards

**User Story:** As a user with a specific role, I want a dashboard that shows exactly the information I need for my job responsibilities, so that I can quickly understand my priorities and take action.

#### Acceptance Criteria

1. WHEN a captain logs in THEN the system SHALL display a dashboard with personal payroll status, job statistics (number of jobs by category, average job size, junk labor cost %, move labor cost %), total revenue, total tips, total hours, and labor bonuses
2. WHEN a wingman logs in THEN the system SHALL display a dashboard showing their scheduled jobs, hours tracking, and performance metrics
3. WHEN a manager logs in THEN the system SHALL display a dashboard with pending approvals, team performance, labor cost trends, and exception alerts
4. WHEN a sales consultant logs in THEN the system SHALL display a dashboard with commission tracking, booking pipeline, and performance against targets
5. WHEN an admin logs in THEN the system SHALL display a dashboard with system health, user activity, payroll status, and administrative alerts
6. WHEN displaying dashboard metrics THEN the system SHALL use modern shadcn/ui blocks with charts, tables, progress indicators, and visual hierarchy instead of basic tiles
7. WHEN showing data trends THEN the system SHALL use interactive charts with hover states and drill-down capabilities
8. WHEN displaying actionable items THEN the system SHALL provide one-click actions directly from dashboard cards
9. WHEN viewing any dashboard THEN the system SHALL provide date range selection that defaults to current pay period (2-week periods)
10. WHEN changing date ranges THEN the system SHALL update all dashboard metrics and charts to reflect the selected period

### Requirement 3: Fluid Workflow Design with Animations

**User Story:** As a user, I want smooth, enjoyable workflows that guide me through tasks with visual feedback and animations, so that using the system feels modern and engaging.

#### Acceptance Criteria

1. WHEN navigating between sections THEN the system SHALL use smooth page transitions and loading animations
2. WHEN forms are submitted THEN the system SHALL provide immediate visual feedback with success animations
3. WHEN data is loading THEN the system SHALL use skeleton screens and progress indicators instead of blank pages
4. WHEN errors occur THEN the system SHALL display them with gentle animations and clear recovery actions
5. WHEN completing tasks THEN the system SHALL provide satisfying completion animations and progress updates
6. WHEN interacting with UI elements THEN the system SHALL use hover states, micro-interactions, and smooth state changes
7. WHEN using mobile devices THEN the system SHALL provide touch-optimized animations and gestures
8. WHEN a captain submits a log THEN the system SHALL update their dashboard and payroll view to reflect current hours, tips, and labor bonuses

### Requirement 4: Optimized Log Creation Workflow

**User Story:** As a captain, I want to create daily logs quickly and efficiently with intelligent defaults and streamlined input, so that I can complete this task in under 2 minutes.

#### Acceptance Criteria

1. WHEN creating a new log THEN the system SHALL pre-populate the captain field with the current logged-in user if they have captain role
2. WHEN entering job information THEN the system SHALL provide clean, empty input fields without pre-filled zeros
3. WHEN adding the first team member to a section THEN the system SHALL automatically add the selected captain as the first employee entry
4. WHEN calculating totals THEN the system SHALL update all calculations in real-time without page refreshes
5. WHEN entering currency amounts THEN the system SHALL provide clean input fields without pre-filled zeros that can be easily cleared
6. WHEN saving progress THEN the system SHALL allow manual save with clear save button and confirmation
7. WHEN submitting logs THEN the system SHALL validate all data and provide clear error messages with specific field highlighting
8. WHEN using mobile devices THEN the system SHALL optimize keyboard types and input methods for each field type

### Requirement 5: Streamlined Manager Review Interface

**User Story:** As a manager, I want to review and approve logs efficiently with bulk operations and quick-edit capabilities, so that I can process multiple logs in under 30 seconds each.

#### Acceptance Criteria

1. WHEN viewing pending logs THEN the system SHALL display them in a prioritized queue with key metrics visible
2. WHEN reviewing a log THEN the system SHALL provide side-by-side comparison with expected values and historical averages
3. WHEN making corrections THEN the system SHALL allow inline editing of key fields without opening separate forms
4. WHEN approving multiple logs THEN the system SHALL provide bulk approval with batch processing
5. WHEN identifying issues THEN the system SHALL highlight anomalies and provide suggested corrections
6. WHEN processing approvals THEN the system SHALL immediately trigger commission matching and payroll updates
7. WHEN viewing log details THEN the system SHALL use expandable sections to show relevant information without clutter
8. WHEN making decisions THEN the system SHALL provide contextual information and recommendations

### Requirement 6: Intelligent Commission Tracking System

**User Story:** As a sales consultant, I want an intelligent commission tracking system that automatically matches my bookings to completed jobs and provides accurate earnings projections.

#### Acceptance Criteria

1. WHEN creating commission entries THEN the system SHALL provide auto-complete for client information and job details
2. WHEN jobs are completed THEN the system SHALL automatically match commission entries using fuzzy matching algorithms
3. WHEN matches are uncertain THEN the system SHALL provide a review interface for manual confirmation
4. WHEN calculating commissions THEN the system SHALL use actual revenue and provide detailed breakdowns
5. WHEN tracking performance THEN the system SHALL show booking accuracy, conversion rates, and earnings trends
6. WHEN viewing commission status THEN the system SHALL provide real-time updates and projected earnings
7. WHEN conflicts arise THEN the system SHALL provide clear resolution workflows with audit trails
8. WHEN generating reports THEN the system SHALL include commission data in payroll exports automatically

### Requirement 7: Advanced User Management with Role-Based Permissions

**User Story:** As an administrator, I want comprehensive user management with granular permissions and bulk operations, so that I can efficiently manage a large workforce.

#### Acceptance Criteria

1. WHEN managing users THEN the system SHALL provide bulk import/export capabilities for user data
2. WHEN setting permissions THEN the system SHALL offer granular role-based access control with custom permission sets
3. WHEN configuring compensation THEN the system SHALL provide templates and bulk update capabilities
4. WHEN duplicating users THEN the system SHALL copy all relevant settings while generating unique identifiers
5. WHEN deactivating users THEN the system SHALL preserve historical data while preventing new access
6. WHEN managing pay periods THEN the system SHALL provide workflow controls with approval gates
7. WHEN viewing user activity THEN the system SHALL provide comprehensive audit trails and activity monitoring
8. WHEN handling user requests THEN the system SHALL provide self-service capabilities for common tasks

### Requirement 8: Pre-Computed Analytics and Reporting

**User Story:** As a manager or administrator, I want instant access to comprehensive reports and analytics, so that I can make data-driven decisions without waiting for calculations.

#### Acceptance Criteria

1. WHEN generating payroll reports THEN the system SHALL use pre-computed data and generate reports in under 5 seconds
2. WHEN viewing analytics THEN the system SHALL display interactive charts with drill-down capabilities
3. WHEN calculating labor costs THEN the system SHALL use cached calculations updated incrementally
4. WHEN showing trends THEN the system SHALL provide historical comparisons and predictive insights
5. WHEN exporting data THEN the system SHALL provide multiple formats (PDF, Excel, CSV) with custom templates
6. WHEN scheduling reports THEN the system SHALL provide automated report generation and distribution
7. WHEN viewing individual performance THEN the system SHALL show comprehensive breakdowns with visual representations
8. WHEN analyzing efficiency THEN the system SHALL provide benchmarking against goals and historical performance

### Requirement 9: Mobile-First Responsive Design

**User Story:** As a field worker, I want a mobile-optimized interface that works perfectly on my phone, so that I can complete all tasks efficiently while on-site.

#### Acceptance Criteria

1. WHEN using mobile devices THEN the system SHALL provide touch-optimized interfaces with appropriate gesture support
2. WHEN entering data on mobile THEN the system SHALL use context-appropriate keyboards and input methods
3. WHEN navigating on mobile THEN the system SHALL use bottom navigation and thumb-friendly touch targets
4. WHEN viewing data on mobile THEN the system SHALL use responsive layouts that adapt to screen size
5. WHEN network issues occur THEN the system SHALL display appropriate error messages and retry options
6. WHEN using different devices THEN the system SHALL maintain consistent functionality across all screen sizes
7. WHEN loading on mobile networks THEN the system SHALL optimize for slower connections with progressive loading
8. WHEN using mobile browsers THEN the system SHALL work consistently across iOS Safari, Chrome, and other mobile browsers

### Requirement 10: Modern UI with Shadcn/UI Blocks and Animations

**User Story:** As a user, I want a modern, visually appealing interface that uses contemporary design patterns and smooth animations, so that the system feels professional and enjoyable to use.

#### Acceptance Criteria

1. WHEN designing interfaces THEN the system SHALL use shadcn/ui blocks (dashboard-01, login-02, sidebar-07) instead of custom components
2. WHEN applying styling THEN the system SHALL use Tailwind CSS v4 with College Hunks brand colors (#026937, #ea7200)
3. WHEN displaying content THEN the system SHALL use the New York theme with consistent typography and spacing
4. WHEN showing interactive elements THEN the system SHALL provide hover states, focus indicators, and smooth transitions
5. WHEN loading content THEN the system SHALL use skeleton screens and progressive loading animations
6. WHEN displaying data THEN the system SHALL use modern card layouts, proper visual hierarchy, and consistent spacing
7. WHEN showing status information THEN the system SHALL use badges, progress indicators, and color-coded states
8. WHEN providing feedback THEN the system SHALL use toast notifications, modal dialogs, and inline messages

### Requirement 11: Comprehensive Error Handling and Input Validation

**User Story:** As a user, I want clear error messages and input validation that helps me correct mistakes quickly, so that I can complete tasks without frustration.

#### Acceptance Criteria

1. WHEN entering invalid data THEN the system SHALL provide real-time validation with specific error messages
2. WHEN currency fields are displayed THEN the system SHALL show clean inputs without pre-filled zeros that can be easily cleared
3. WHEN validation errors occur THEN the system SHALL highlight problematic fields and provide correction suggestions
4. WHEN system errors happen THEN the system SHALL display user-friendly messages with recovery options
5. WHEN network issues occur THEN the system SHALL handle gracefully with retry mechanisms and offline indicators
6. WHEN data conflicts arise THEN the system SHALL provide clear resolution workflows with guided steps
7. WHEN form submission fails THEN the system SHALL preserve user input and provide clear next steps
8. WHEN validation passes THEN the system SHALL provide positive feedback and smooth progression

### Requirement 12: Development Quality and Maintenance Standards

**User Story:** As a developer maintaining this system, I want clean, well-structured code with comprehensive testing and linting, so that the system remains maintainable and reliable.

#### Acceptance Criteria

1. WHEN writing code THEN the system SHALL use TypeScript strict mode with no any types allowed
2. WHEN completing tasks THEN the system SHALL run ESLint and TypeScript compiler checks after each implementation
3. WHEN building components THEN the system SHALL use only shadcn/ui blocks and components, no custom UI components
4. WHEN implementing features THEN the system SHALL include comprehensive unit tests for business logic
5. WHEN creating forms THEN the system SHALL use React Hook Form with Zod validation schemas
6. WHEN handling state THEN the system SHALL prefer server state and minimize client-side state management
7. WHEN writing database queries THEN the system SHALL use Prisma ORM with proper type safety
8. WHEN deploying changes THEN the system SHALL pass all automated tests and quality checks

### Requirement 13: Simple Audit Trail

**User Story:** As a manager or administrator, I want to track basic changes to logs and user data, so that I can investigate discrepancies when needed.

#### Acceptance Criteria

1. WHEN a log is created THEN the system SHALL record who created it and when
2. WHEN a log is edited THEN the system SHALL record who made the edit and when
3. WHEN a log is approved THEN the system SHALL record who approved it and when
4. WHEN user data is modified THEN the system SHALL record basic change information
5. WHEN viewing audit information THEN the system SHALL display it in a simple, readable format
6. WHEN investigating issues THEN the system SHALL provide basic search and filtering of audit records
7. WHEN accessing audit data THEN the system SHALL restrict access to managers and administrators only
8. WHEN storing audit data THEN the system SHALL keep records for at least 2 years

### Requirement 14: Data Migration and System Transition

**User Story:** As a business stakeholder, I want a smooth transition from the old system to the new system with complete data preservation, so that business operations continue without disruption.

#### Acceptance Criteria

1. WHEN migrating data THEN the system SHALL preserve all historical logs, user data, and commission information
2. WHEN transitioning users THEN the system SHALL provide training materials and guided onboarding
3. WHEN running parallel systems THEN the system SHALL provide data synchronization during transition period
4. WHEN validating migration THEN the system SHALL verify data integrity and completeness
5. WHEN switching systems THEN the system SHALL provide rollback capabilities in case of issues
6. WHEN training users THEN the system SHALL provide role-specific documentation and video tutorials
7. WHEN supporting transition THEN the system SHALL provide dedicated support channels during cutover
8. WHEN measuring success THEN the system SHALL track adoption metrics and user satisfaction

### Requirement 15: Performance Rankings and Gamification

**User Story:** As a captain or wingman, I want to see performance rankings compared to my peers, so that I can track my performance and be motivated to improve through friendly competition.

#### Acceptance Criteria

1. WHEN viewing rankings THEN the system SHALL display performance metrics without revealing specific dollar amounts or personal payroll information
2. WHEN calculating rankings THEN the system SHALL use only data from approved daily log sheets
3. WHEN displaying junk performance THEN the system SHALL rank by total junk revenue, average junk job size, and lowest junk labor cost percentage
4. WHEN displaying move performance THEN the system SHALL rank by total move revenue, average move job size, and lowest move labor cost percentage
5. WHEN showing productivity metrics THEN the system SHALL rank by number of junk jobs, number of move jobs, and total jobs completed
6. WHEN displaying efficiency metrics THEN the system SHALL rank by tips earned, hours worked efficiency, and overall performance scores
7. WHEN accessing rankings THEN the system SHALL show current pay period rankings with historical comparison options
8. WHEN viewing personal performance THEN the system SHALL show individual ranking position and improvement trends without exposing other users' specific earnings
9. WHEN calculating rankings THEN the system SHALL only include data that captains input on daily log sheets (revenue, tips, hours, job counts, labor costs)
10. WHEN displaying rankings THEN the system SHALL use anonymous identifiers or initials to maintain privacy while enabling competition

### Requirement 16: Data Integrity and Backup

**User Story:** As a system administrator, I want reliable data storage and backup capabilities, so that business data is protected and recoverable.

#### Acceptance Criteria

1. WHEN data is saved THEN the system SHALL ensure data integrity with proper validation
2. WHEN system errors occur THEN the system SHALL prevent data corruption and provide error recovery
3. WHEN backups are needed THEN the system SHALL provide database backup and restore capabilities
4. WHEN data is deleted THEN the system SHALL use soft deletes to preserve historical records
5. WHEN migrating data THEN the system SHALL provide data export and import tools
6. WHEN system maintenance occurs THEN the system SHALL provide maintenance mode with user notifications
7. WHEN data conflicts arise THEN the system SHALL provide clear resolution options
8. WHEN ensuring reliability THEN the system SHALL implement proper error handling and logging

## Technical Implementation Requirements

### Technology Stack

- **Framework**: Next.js 15 with App Router and TypeScript (strict mode)
- **UI Library**: Shadcn/ui with New York theme (use blocks where available)
- **Styling**: Tailwind CSS v4 with College Hunks brand colors
- **Database**: Supabase-hosted PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Forms**: React Hook Form + Zod validation
- **State Management**: Zustand (minimal usage, prefer server state)
- **Deployment**: Vercel
- **Testing**: Jest for unit tests, Playwright for E2E tests
- **Linting**: ESLint with TypeScript rules
- **Performance**: Lighthouse score > 95

### Development Standards

- TypeScript strict mode enabled, no `any` types
- ESLint and TSC checks after each task completion
- Comprehensive unit tests for business logic
- Integration tests for critical workflows
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance
- Performance targets: < 500ms page loads, < 100ms interactions

### Architecture Patterns

- Server Components for data-heavy pages
- Server Actions for form submissions and mutations
- Client Components only for interactive UI elements
- Row-Level Security for all database tables
- Optimized database queries with proper indexing
- Background job processing for heavy calculations
- Intelligent caching with cache invalidation strategies

## Success Metrics

### Performance Targets

- Page load time: < 1 second
- Time to interactive: < 2 seconds
- Dashboard load time: < 1 second
- Form submission response: < 500ms
- Database query optimization for single queries instead of multiple sequential queries

### User Experience Targets

- Captain log submission: < 2 minutes
- Manager log review: < 30 seconds per log
- Clean currency input fields without pre-filled zeros
- Smooth animations and modern UI feel
- Mobile-responsive design for all screen sizes

### Business Impact Targets

- Faster dashboard loading with pre-computed metrics
- Elimination of slow sequential database queries
- Better role-specific dashboards that align with job responsibilities
- Improved workflow efficiency and user satisfaction
- Modern, maintainable codebase for future development

## Implementation Phases

### Phase 1: Foundation and Architecture (Weeks 1-2)

- Set up Next.js 15 project with TypeScript strict mode
- Configure Shadcn/ui with New York theme and brand colors
- Set up Tailwind CSS v4 with custom color scheme
- Configure Supabase and Prisma with optimized schema
- Implement authentication with NextAuth.js
- Create basic layouts using shadcn/ui blocks

### Phase 2: Core Dashboard and Navigation (Weeks 3-4)

- Implement role-specific dashboards using dashboard-01 block
- Create optimized navigation using sidebar-07 block
- Build pre-computed metrics system with background jobs
- Implement real-time updates with WebSocket connections
- Create responsive mobile navigation
- Add smooth animations and transitions

### Phase 3: Log Management System (Weeks 5-6)

- Build optimized log creation form with intelligent defaults
- Implement real-time calculations with caching
- Create streamlined manager review interface
- Build bulk operations and quick-edit capabilities
- Add auto-save functionality with visual feedback
- Implement mobile-optimized input methods

### Phase 4: Commission and Reporting (Weeks 7-8)

- Build intelligent commission tracking system
- Implement fuzzy matching algorithms for job matching
- Create pre-computed analytics and reporting system
- Build interactive charts and data visualization
- Implement automated report generation and distribution
- Add export capabilities in multiple formats

### Phase 5: User Management and Admin Tools (Weeks 9-10)

- Build comprehensive user management interface
- Implement granular role-based permissions
- Create bulk operations for user management
- Build pay period management with workflow controls
- Implement audit trail and compliance features
- Add system monitoring and performance tracking

### Phase 6: Testing, Migration, and Launch (Weeks 11-12)

- Comprehensive testing (unit, integration, E2E)
- Data migration from existing system
- User training and documentation
- Performance optimization and monitoring setup
- Staged rollout with parallel system operation
- Full production launch with support

## Conclusion

This complete rebuild of HUNKCentral will transform the workforce management experience for College Hunks Hauling Junk & Moving. By focusing on performance, user experience, and modern design patterns, the new system will eliminate current pain points and provide a foundation for future growth.

The emphasis on role-specific dashboards, optimized workflows, and pre-computed analytics will significantly improve productivity while the modern UI and smooth animations will make the system enjoyable to use. The comprehensive technical requirements ensure the system will be maintainable, scalable, and reliable for years to come.
