# Implementation Plan

## CRITICAL TESTING RULES (MUST FOLLOW)

**NEVER modify tests to make them pass. Always fix the implementation.**

- When a test fails, the implementation code must be fixed, not the test
- Tests should only be modified if the requirements have changed
- If a test is incorrect, verify against requirements before changing
- All tests must validate actual functionality, not bypass it
- Failed tests indicate broken functionality that must be repaired
- Test modifications require explicit justification against requirements
- Any task marked as complete must have working tests that validate the actual functionality
- Before marking any task complete, run all related tests and ensure they pass with real functionality
- If tests were modified to pass without fixing implementation, the task is NOT complete

**ADDITIONAL TESTING ENFORCEMENT:**

- Every task completion must include: "Verified all tests pass with actual working functionality"
- Any test modification must be documented with specific requirement justification
- Tasks with bypassed/modified tests without proper justification are automatically marked incomplete
- Implementation must be tested against real user scenarios, not mocked/stubbed behavior
- All components must render and function correctly in actual application context

**TESTING QUALITY STANDARDS:**

- Tests must verify actual business logic, not just UI element presence
- Mock only external dependencies (APIs, databases), never internal business logic
- Component tests must verify user interactions produce correct results
- Integration tests must test complete workflows end-to-end
- Unit tests must verify calculations, validations, and data transformations
- Tests that only check "toBeInTheDocument" without verifying functionality are insufficient
- Every test must have a clear assertion about expected behavior, not just element existence

**TASK COMPLETION VERIFICATION:**

- Run `npm test` and ensure all tests pass with real functionality
- Manually test the feature in the browser to verify it works as expected
- Verify the implementation matches the requirements exactly
- Check that all edge cases are handled properly
- Ensure error handling works correctly
- Confirm accessibility and responsive design requirements are met

**IMMEDIATE ACTION REQUIRED:**

- All tasks marked as complete must be re-verified for actual functionality
- Any task with modified tests without proper requirement justification is marked incomplete
- Implementation must be fixed to make original tests pass, not tests modified to pass
- No task can be considered complete until both tests pass AND manual verification confirms functionality

## Critical Bug Fixes (Immediate Priority)

- [ ] 0. Fix critical application errors preventing startup
  - Fix Next.js Link component error: "Multiple children were passed to <Link> with `href` of `/`" in login page
  - Remove `legacyBehavior` prop and wrap multiple children in single element
  - Test application startup and ensure all pages load without errors
  - Verify navigation works correctly across all routes
  - _Requirements: 10.1, 8.1_

## Foundation (Completed)

what - [ ] 1. Set up project structure and core interfaces

- Create Next.js 15 project with App Router and TypeScript strict mode
- Install and configure Shadcn/ui with New York theme and College Hunks brand colors (#026937 green, #ea7200 orange)
- Set up Tailwind CSS configuration with custom brand color scheme and responsive design utilities
- Install core dependencies: React Hook Form, Zod, NextAuth.js, Prisma, date-fns, lucide-react
- Create comprehensive folder structure following modern Next.js patterns (/app, /components/ui, /components/features, /lib, /hooks, /types)
- Initialize Shadcn/ui components foundation with **Button**, **Input**, **Card**, **NavigationMenu** base components
- _Requirements: 8.1, 8.4, 10.1_

- [x] 2. Configure database and authentication foundation
  - Set up Supabase project and configure PostgreSQL database
  - Install and configure Prisma ORM with database schema
  - Implement User model with multiple roles support and compensation fields
  - Set up NextAuth.js with credentials provider and session management
  - Create database migrations for all core models (User, DailyLog, LogJob, LogHour, CommissionEntry, PayPeriod, AuditLog)
  - _Requirements: 1.1, 1.2, 6.1, 6.2, 10.2, 10.3, 12.1_

- [x] 3. Implement authentication and role-based access control
  - Create LoginForm component with email/password authentication
  - Implement ProtectedRoute HOC for route protection
  - Build RoleGuard component for conditional rendering based on multiple roles
  - Create session management utilities and role checking helpers
  - Implement logout functionality with session cleanup
  - Write unit tests for authentication and authorization logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.3_

## Core Components (Partially Complete - Need Integration)

- [x] 4. Build comprehensive layout and navigation system with modern UI components
  - Create **NavigationMenu** with role-based dropdowns, contextual menus, and **Collapsible** sidebar for desktop layout
  - Implement **Sheet** slide-out navigation for mobile with touch-optimized **NavigationMenu** adaptation and **Drawer** for bottom-up interactions
  - Build **Avatar** + **DropdownMenu** header with theme toggle, user profile access, and **Separator** sections for organization
  - Create **Breadcrumb** navigation component for contextual location display with proper hierarchy
  - Implement **Tabs** for role-based dashboard views with **Card** grid layouts, **Badge** status indicators, and **Progress** bars for metrics
  - Add **Separator** elements for visual hierarchy, **Button** groups for quick actions, and **HoverCard** for contextual information
  - Integrate **Resizable** panels for customizable layouts and **ContextMenu** for power user interactions
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 5. Implement captain selector and log section selector with enhanced UX
  - Create CaptainSelector component using **Select** with searchable dropdown, **HoverCard** for captain information, and **Badge** for role indicators
  - Build LogSectionSelector component using **Checkbox** group for dynamic section visibility (Junk, Move, Other hours) with **ToggleGroup** for exclusive selections
  - Implement **Collapsible** sections for space management and **Accordion** for organized information display
  - Add **Tooltip** components for helpful hints and selection guidance
  - Implement default behavior (current user if they have captain role) with **Alert** for permission notifications
  - Add comprehensive validation with **Toast** notifications for feedback and **AlertDialog** for confirmations
  - _Requirements: 2.16, 2.1_

- [x] 6. Build dynamic job tile system with comprehensive UI components
  - Create **Card** components with **CardHeader**, **CardContent**, and **CardFooter** for polished job tiles with subtle elevation
  - Implement **Button** with "Add Another Job" functionality, **Collapsible** optional fields, and **Separator** for visual organization
  - Build **Select** dropdowns for job types with **Popover** for quick actions and **Input** components with floating labels and appropriate keyboard types
  - Add **Badge** components for co-captain indicators, job status, and **Progress** indicators for completion tracking
  - Implement **HoverCard** for detailed job information, **Tooltip** for field explanations, and **AspectRatio** for consistent sizing
  - Create **Toast** notifications for auto-save feedback, form validation, and **Alert** components for important notices
  - Add **ContextMenu** for right-click actions and **Sheet** for mobile-optimized job editing
  - _Requirements: 2.2, 2.3, 2.4, 2.14, 9.1, 9.3_

- [x] 7. Implement dynamic team hours tracking with advanced UI components
  - Create TeamHoursSection component using **Accordion** for expandable employee sections with **Button** "Add HUNK" functionality
  - Build HunkEntry component using **Card** layout with **Select** for employee/department selection and **Input** for hours with number validation
  - Implement **Checkbox** for co-captain designation with **Badge** indicators and **HoverCard** for employee information
  - Add **Slider** components for numeric range inputs and **RadioGroup** for exclusive department choices
  - Create **Table** with sortable columns for employee hour summary and **Progress** bars for hour distribution visualization
  - Implement **Popover** for inline editing, **Dialog** for detailed employee information, and **AlertDialog** for deletion confirmations
  - Add comprehensive form validation with **Toast** notifications and **Alert** components for validation errors
  - _Requirements: 2.5, 2.11_

- [x] 8. Build real-time section summary with eye-catching visual components
  - Create **Card** components with **Progress** bars for labor cost percentages vs goals using College Hunks brand colors with gradient effects
  - Implement **Badge** components for tips per HUNK display with **HoverCard** explanations and smooth reveal animations
  - Build **Progress** indicators with brand color shifts and **Chart** components for visual data representation
  - Add **Alert** components for goal achievement notifications, warnings, and **Toast** for real-time feedback
  - Implement **Tooltip** components for calculation explanations, **Popover** for detailed breakdowns, and **Separator** with brand color accents
  - Create **Table** with alternating row colors, hover effects, and **Badge** clusters for status visualization
  - Add **Collapsible** sections with fluid transitions and **NavigationMenu** dropdowns with polished animations
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 9. Implement overall log totals and employee summary
  - Create LogTotals component displaying combined statistics across all sections
  - Build employee summary showing total hours and earned tips per employee
  - Implement combined revenue statistics for all jobs
  - Add real-time updates when section data changes
  - Create comprehensive display of all compensation components
  - _Requirements: 2.11, 5.3_

- [ ] 10. Build complete log form with auto-save and validation
  - Create LogForm component integrating all section components
  - Implement auto-save functionality every 30 seconds
  - Add comprehensive form validation using React Hook Form and Zod
  - Build draft, submit, and validation state management
  - Implement mobile-optimized input methods and touch targets
  - Add error handling and user feedback for form operations
  - Write integration tests for complete log creation workflow
  - _Requirements: 2.8, 2.9, 8.2, 8.4, 9.1, 9.2, 9.3_

- [ ] 11. Implement comprehensive manager review interface with advanced interactions (you )

  -[x] Create **Table** with sortable columns, **Badge** status indicators, **Input** search functionality, and **Select** for filtering options -[x] Build **Resizable** panels for side-by-side comparison with **Tabs** for log sections and **Card** layout for job details -[x] Implement **Popover** components for inline editing, **Button** groups for approve/reject actions, and **ContextMenu** for power user shortcuts -[x] Add **Checkbox** multi-select with **DropdownMenu** bulk actions, **AlertDialog** confirmations, and **Progress** for batch processing -[x] Create **HoverCard** components for employee information, **Tooltip** for action descriptions, and **Sheet** for mobile-optimized review -[x] Implement **Drawer** for bottom-up mobile interactions, **NavigationMenu** for contextual actions, and **Separator** for visual organization -[x] Add **Accordion** for organized information display, **Collapsible** sections for space management, and **AspectRatio** for consistent layouts -[ ] Write unit tests for review and approval logic with **Toast** feedback notifications and **Skeleton** loading states
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

- [ ] 12. Build commission entry system with polished UI components

  -[x] Create SalesConsultantSelector using **Select** with searchable dropdown, **HoverCard** for consultant details, and **Badge** for role identification -[x] Build CommissionForm using **Card** with clean layout, **Input** with job ID validation, **Calendar** for target date selection, and **Button** for submission -[x] Implement **Dialog** for commission creation/editing, **Tabs** for different commission information sections, and **Alert** for validation errors -[x] Add **Table** for CommissionList with status columns, **Badge** for commission status, **Progress** for booking accuracy metrics, and **DropdownMenu** for actions -[x] Create **HoverCard** for detailed commission information, **Popover** for quick actions, and **Toast** notifications for successful operations -[x] Implement **AlertDialog** for deletion confirmations, **Separator** for visual organization, and **Tooltip** for helpful hints -[x] Add **Skeleton** loading states, **ContextMenu** for advanced actions, and **Sheet** for mobile-optimized commission management -[ ] Write unit tests for commission entry creation and validation with comprehensive error handling
  - _Requirements: 4.1, 4.2, 4.6, 4.7_

- [ ] 13. Implement automatic commission matching system

  -[x] Create CommissionMatcher service for automatic job ID matching -[x] Implement matching logic triggered on log approval -[x] Build commission calculation using actual revenue and commission rates -[x] Add booking accuracy metrics comparing estimated vs actual revenue -[x] Create conflict resolution for duplicate job IDs -[ ] Write unit tests for commission matching and calculation logic -[ ] _Requirements: 3.5, 4.3, 4.4, 4.5_

- [ ] 14. Build comprehensive user management system

  -[x] Create UserForm component with all compensation settings fields -[x] Implement multiple role assignment with checkbox interface -[x] Build template functionality for copying rates from existing users -[x] Add search, filter, and bulk edit capabilities for user management -[x] Create logical grouping of compensation fields (rates, salary, commission, bonuses) -[ ] Write unit tests for user management operations -[ ] _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 15. Implement comprehensive payroll report system with advanced UI components

  -[x] Create **Tabs** for different report types with **Table** components featuring advanced sorting, filtering, and **Input** search functionality -[x] Build **Card** summaries for key metrics with **Chart** components for visual analytics, **Progress** bars for performance indicators, and **Badge** for achievement status -[x] Implement **Progress** indicators for report generation, **Badge** clusters for status visualization, and **HoverCard** for metric explanations -[x] Add **Accordion** components for expandable employee sections with **Separator** for pay components and **Collapsible** for detailed breakdowns -[x] Create **Button** with **Dialog** for export options, **Calendar** for date range selection, **Select** for format options, and **Toast** notifications for completion -[x] Implement **Resizable** panels for customizable report layouts, **NavigationMenu** for report navigation, and **Breadcrumb** for context -[x] Add **AlertDialog** for export confirmations, **Popover** for quick filters, **ContextMenu** for advanced options, and **Sheet** for mobile report viewing -[x] Create **AspectRatio** for consistent chart sizing, **Tooltip** for data point explanations, and **Drawer** for mobile-specific interactions -[ ] Write unit tests for all payroll calculation logic with **Skeleton** loading states and performance optimization -[ ] _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.8, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 16. Build pay period management with sophisticated UI components

  -[x] Create PayPeriodManager using **Card** grid for period overview, **Calendar** for date selection, and **Badge** for period status indicators -[x] Implement **AlertDialog** for status change confirmations, **Progress** for period completion status, and **Button** groups for period actions -[x] Add **Table** for period listing with **Badge** status indicators, **HoverCard** for period details, and **DropdownMenu** for period actions -[x] Build **Dialog** for period creation/editing with **Tabs** for different period settings and **Input** components for period configuration -[x] Create **Alert** components for data modification warnings, **Toast** notifications for status changes, and **Separator** for visual organization -[x] Implement **Collapsible** sections for historical periods, **Accordion** for period details, and **Tooltip** for status explanations -[x] Add **ContextMenu** for advanced period operations, **Popover** for quick status changes, and **Sheet** for mobile period management -[ ] Write unit tests for pay period management and data locking with **Skeleton** loading states -[ ] _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 17. Implement ADP export and report formatting

  -[x] Create ReportExport component for ADP-compatible format export -[x] Build export functionality for payroll reports -[x] Implement proper data formatting for external payroll systems -[x] Add file download capabilities with appropriate naming conventions -[x] Create export validation to ensure data integrity -[ ] Write unit tests for export functionality and data formatting -[ ] _Requirements: 5.7_

- [ ] 18. Build comprehensive audit trail system with rich UI components

  -[x] Create AuditLogViewer using **Table** with chronological activity display, **Badge** for action types, and **HoverCard** for change details -[x] Build AuditLogDetail using **Card** with before/after comparison, **Tabs** for different change types, and **Badge** for user identification -[x] Implement AuditLogFilter using **Select** and **Input** components for filtering by date range, user, and entity type with **Calendar** for date selection -[x] Add ChangeHistory using **Timeline** component showing sequential changes with **Separator** between entries and **Progress** for change progression -[x] Create **Dialog** for detailed audit information, **Accordion** for organized change display, and **Collapsible** sections for change categories -[x] Implement **Popover** for quick change summaries, **Tooltip** for field explanations, and **Alert** for important audit notifications -[x] Add **ContextMenu** for audit actions, **Sheet** for mobile audit viewing, and **Drawer** for bottom-up audit interactions -[x] Create **AspectRatio** for consistent audit layouts and **NavigationMenu** for audit navigation -[ ] Write unit tests for audit trail functionality with **Skeleton** loading states and real-time updates -[ ] _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [ ] 19. Implement performance optimizations and mobile-first enhancements

  -[x] Optimize components using React Server Components for data-heavy pages with **Skeleton** loading states and smooth transitions -[x] Implement code splitting and lazy loading with **Progress** indicators for loading feedback and **Toast** notifications for offline status -[x] Add offline capability with draft synchronization using **Alert** components for connection status and **Badge** for sync indicators -[x] Optimize mobile experience with **Sheet** replacing sidebar, **Drawer** for mobile-specific interactions, and **NavigationMenu** adaptation for touch -[x] Implement **Button** hover states with brand color shifts, **Card** components with subtle elevation, and **Progress** components with gradient effects -[x] Add biometric authentication support with **Dialog** for biometric prompts and **Alert** for authentication status -[x] Create **HoverCard** reveals with smooth animations, **Collapsible** sections with fluid transitions, and **Table** with responsive scrolling -[ ] Conduct performance testing with **Chart** components for analytics visualization and **Badge** clusters for performance metrics -[ ] _Requirements: 8.2, 8.5, 8.6, 8.7, 10.1, 10.5, 10.6_

- [ ] 20. Add comprehensive error handling and data validation

  -[x] Implement robust error handling throughout the application -[x] Add user-friendly error messages and recovery options -[x] Create network error handling with retry mechanismsy -[x] Build data conflict resolution systems -[ ] Add comprehensive input validation on both client and server -[ ] Write unit tests for error handling scenarios -[ ] _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.4_

- [ ] 21. Conduct integration testing and end-to-end testing

  -[ ] Write integration tests for complete user workflows (captain, manager, admin) -[ ] Create end-to-end tests using Playwright for critical user journeys -[ ] Test commission matching workflow from creation to approval -[ ] Validate payroll report generation with various compensation scenarios -[ ] Test multi-role user scenarios and permission enforcementyou -[ ] Conduct performance testing under concurrent user load -[ ] _Requirements: 10.7_

- [ ] 22. Deploy application and configure production environment -[ ] Set up Vercel deployment with preview and production environments -[ ] Configure production database with proper security settings -[ ] Implement environment-specific configurations -[ ] Set up error monitoring and logging services -[ ] Configure backup and disaster recovery procedures -[ ] Conduct user acceptance testing in production environment -[ ] _Requirements: 10.1, 10.2, 10.4_
