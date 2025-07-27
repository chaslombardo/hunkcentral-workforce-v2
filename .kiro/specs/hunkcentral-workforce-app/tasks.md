# HUNKCentral Implementation Plan

## Testing Philosophy

**CORE PRINCIPLE: Tests validate requirements - fix code, not tests**

- Tests are written based on requirements and should not be modified to pass
- When tests fail, the implementation must be fixed to meet the requirements
- Tests should be comprehensive and test real functionality, not just UI presence
- Unit tests focus on business logic, integration tests on workflows, E2E tests on user journeys
- All calculations, validations, and business rules must have corresponding tests

## Shadcn/UI Implementation Rules

**ALWAYS use Shadcn/UI MCP server for UI components:**

- Use `list_blocks` to find relevant blocks before implementing any UI feature
- Use `get_block` to get complete block implementations for complex layouts
- Use `get_component_demo` to see proper usage patterns before implementation
- Prioritize blocks over individual components when available
- Follow New York theme styling consistently throughout
- Apply College Hunks brand colors (#026937 green, #ea7200 orange) to all components

## Phase 1: Foundation & Authentication

- [x] 0. Fix critical application errors preventing startup
  - Created fresh Next.js 15 app with modern patterns
  - Removed all legacy code and `legacyBehavior` props
  - Verified application starts without errors
  - _Requirements: 10.1, 8.1_

- [x] 1. Set up modern Next.js 15 project foundation
  - Install and configure Shadcn/ui with New York theme using MCP server
  - Use `list_blocks` to identify layout and authentication blocks
  - Set up Tailwind with College Hunks brand colors (#026937, #ea7200)
  - Configure TypeScript strict mode and ESLint
  - Install core dependencies: React Hook Form, Zod, NextAuth.js, Prisma
  - Create proper folder structure following design document
  - Use `get_component_demo` for Button, Input, Card foundation components
  - _Requirements: 8.1, 8.4, 10.1_

- [x] 2. Configure database and Prisma schema
  - Set up Supabase PostgreSQL database
  - Implement complete Prisma schema from design document
  - Create database migrations for all models
  - Set up proper database relationships and constraints
  - _Requirements: 1.1, 1.2, 6.1, 6.2, 10.2, 10.3, 12.1_

- [x] 3. Implement authentication system
  - Use `list_blocks` to find login/authentication blocks
  - Use `get_block` for login-02 or similar authentication block
  - Create NextAuth.js configuration with credentials provider
  - Build login form using Shadcn/UI blocks with proper validation
  - Implement session management and role-based access control
  - Create protected route wrapper and role guards
  - Write unit tests for authentication logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.3_

## Phase 2: Core Log Management

- [x] 4. Build basic layout and navigation
  - Use `list_blocks` to find navigation and sidebar blocks
  - Use `get_block` for sidebar-07 or similar navigation block
  - Create responsive header with navigation menu using Shadcn/UI blocks
  - Implement role-based navigation structure
  - Build mobile-friendly sidebar/drawer navigation
  - Add user profile dropdown and logout functionality
  - Apply New York theme styling throughout
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 5. Create captain log form foundation
  - Use `get_component_demo` for Tabs, Card, and Select components
  - Build log form with section tabs (Junk, Move, Other Hours)
  - Implement captain selector with current user default
  - Create section visibility toggles using Checkbox components
  - Add basic form state management with React Hook Form
  - Apply College Hunks brand colors to form elements
  - _Requirements: 2.1, 2.16_

- [x] 6. Implement job entry system
  - Use `get_component_demo` for Card, Input, Button components
  - Create dynamic job tiles for Junk and Move sections
  - Build job form with proper validation (Job ID, client, revenue, tips)
  - Implement "Add Another Job" functionality
  - Add move-specific fields (junk on move, valuation, materials)
  - Write unit tests for job validation logic
  - _Requirements: 2.2, 2.3, 2.4, 2.14, 9.1, 9.3_

- [x] 7. Build team hours tracking
  - Use `get_component_demo` for Accordion, Select, Input components
  - Create employee hour entry system
  - Implement department selection and hour input
  - Add co-captain des ``1234ignation functionality using Checkbox
  - Build "Add HUNK" functionality for multiple employees
  - Write unit tests for hour calculation logic
  - _Requirements: 2.5, 2.11_

- [x] 8. Implement real-time calculations
  - Use `get_component_demo` for Progress, Badge components
  - Build labor cost percentage calculations
  - Implement tips per HUNK calculations
  - Create section summaries with progress indicators
  - Add overall log totals and employee summary
  - Apply College Hunks brand colors to progress indicators
  - Write comprehensive unit tests for all calculation logic
  - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 5.3_

- [x] 9. Add log submission and auto-save
  - Use `get_component_demo` for Toast, Alert components
  - Implement auto-save functionality (every 30 seconds)
  - Create log submission workflow with validation
  - Add draft/submitted status management
  - Build error handling and user feedback
  - Write integration tests for complete log creation workflow
  - _Requirements: 2.8, 2.9, 8.2, 8.4, 9.1, 9.2, 9.3_

## Phase 3: Review & Approval System

- [x] 10. Build manager review interface
  - Use `list_blocks` to find table and dashboard blocks
  - Use `get_block` for appropriate table/dashboard block
  - Create log review queue with filtering and search
  - Implement side-by-side log comparison view using Resizable panels
  - Build approve/reject functionality with comments
  - Add bulk operations for multiple logs
  - Write unit tests for approval logic
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7_

- [x] 11. Implement audit trail system
  - Use `get_component_demo` for Table, Badge, HoverCard components
  - Create audit logging for all log changes
  - Build audit trail viewer with filtering
  - Implement change history tracking
  - Add user activity monitoring
  - Write unit tests for audit functionality
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

## Phase 4: Commission System

- [x] 12. Build commission entry system
  - Use `get_component_demo` for Dialog, Calendar, Select components
  - Create commission entry form with validation
  - Implement sales consultant selector
  - Add job ID uniqueness validation
  - Build commission list with status tracking
  - Write unit tests for commission validation
  - _Requirements: 4.1, 4.2, 4.6, 4.7_

- [x] 13. Implement automatic commission matching
  - Create commission matching service
  - Implement automatic matching on log approval
  - Build commission calculation logic
  - Add conflict resolution for duplicate job IDs
  - Use Toast components for match notifications
  - Write comprehensive unit tests for matching logic
  - _Requirements: 3.5, 4.3, 4.4, 4.5_

## Phase 5: Payroll & Administration

- [x] 14. Build user management system
  - Use `get_component_demo` for Dialog, Tabs, Checkbox components
  - Create user creation/editing forms
  - Implement role assignment interface
  - Build compensation settings (rates, salary, commission)
  - Add user search and filtering
  - Write unit tests for user management operations
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 15. Implement payroll calculation engine
  - Build comprehensive payroll calculation logic
  - Implement all salary types (base, guaranteed, supplemental)
  - Create bonus calculation system
  - Add tip distribution calculations
  - Write extensive unit tests for all payroll calculations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 16. Build payroll reporting system
  - **MANDATORY**: Use shadcn/ui MCP server for ALL UI components
  - **STEP 1**: Use `list_blocks` to find dashboard/report blocks
  - **STEP 2**: Use `get_block` for dashboard-01 or similar reporting block
  - **STEP 3**: Use `get_component_demo` for individual components as needed
  - **STEP 4**: Create payroll report generation using shadcn/ui patterns from dashboard-01
  - **STEP 5**: Implement ADP export functionality with shadcn/ui Dialog components
  - **STEP 6**: Build employee self-service payroll view using shadcn/ui blocks
  - **STEP 7**: Add report filtering and date range selection with shadcn/ui components
  - **STEP 8**: Write unit tests for report generation logic
  - **IMPORTANT**: Follow dashboard-01 block patterns for layout, cards, tables, and charts
  - **NO CUSTOM COMPONENTS**: Use only shadcn/ui blocks and components
  - _Requirements: 5.7, 5.8_

- [ ] 17. Implement pay period management
  - Use `get_component_demo` for Calendar, AlertDialog components
  - Create pay period creation and management
  - Build period status workflow (open/locked/closed)
  - Implement data locking for closed periods
  - Add period-based report filtering
  - Write unit tests for pay period logic
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

## Phase 6: Testing & Deployment

- [ ] 18. Comprehensive testing suite
  - Write integration tests for all major workflows
  - Create E2E tests for critical user journeys
  - Test all business logic with edge cases
  - Validate all calculations against requirements
  - Test error handling and recovery scenarios
  - _Requirements: 10.7_

- [ ] 19. Performance optimization and mobile polish
  - Use `get_component_demo` for Skeleton, Sheet, Drawer components
  - Optimize for mobile-first experience
  - Implement proper loading states and error boundaries
  - Add offline capability and data synchronization
  - Optimize performance for target metrics (<1s load time)
  - _Requirements: 8.2, 8.5, 8.6, 8.7, 10.1, 10.5, 10.6_

- [ ] 20. Production deployment
  - Set up Vercel deployment pipeline
  - Configure production database and security
  - Implement monitoring and error tracking
  - Conduct user acceptance testing
  - Deploy to production with proper rollback procedures
  - _Requirements: 10.1, 10.2, 10.4_

## Key Implementation Principles

1. **Shadcn/UI First**: Always check MCP server for blocks and components before custom implementation
2. **New York Theme**: Consistent styling throughout with College Hunks brand colors
3. **Test-Driven Development**: Write tests based on requirements, then implement code to pass tests
4. **Mobile-First**: Every component must work perfectly on mobile devices
5. **Real-Time Feedback**: Calculations update immediately as users input data
6. **Error Handling**: Comprehensive error handling with user-friendly messages
7. **Performance**: Target <1 second page load times
8. **Accessibility**: WCAG 2.1 AA compliance for all components
9. **Security**: Proper input validation and role-based access control

## Shadcn/UI MCP Usage Checklist

Before implementing any UI feature:

- Run `list_blocks` to find relevant blocks
- Use `get_block` for complex layouts (login, dashboard, forms)
- Use `get_component_demo` to understand proper usage
- Apply New York theme styling consistently
- Integrate College Hunks brand colors appropriately
- Test responsive behavior on mobile devices
