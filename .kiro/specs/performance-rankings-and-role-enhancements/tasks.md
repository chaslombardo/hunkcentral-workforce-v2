# Implementation Plan

- [x] 1. Extend existing database schema for performance metrics (if needed)
  - Review existing tables to see if performance data can be calculated from current schema
  - If new tables needed, use existing Prisma schema patterns and migration approach
  - Update TypeScript interfaces in types/index.ts for performance data
  - Run lint, tsc check, remove console.logs, and commit changes
  - _Requirements: 1.1, 1.2, 2.5, 4.1, 4.4_

- [x] 2. Extend existing payroll calculation engine for performance metrics
  - Enhance lib/payCalculator.ts with performance calculation functions
  - Leverage existing labor percentage calculations for rankings display
  - Add disposal percentage and Move-specific metrics calculations
  - Extend existing test suite in **tests**/payroll-calculation.test.ts
  - Run lint, tsc check, remove console.logs, and commit changes
  - _Requirements: 1.2, 1.3, 1.4, 4.4, 5.5_

- [x] 3. Create performance analytics API using existing patterns
  - Add /app/api/analytics/performance/route.ts following existing API structure
  - Use existing role-based middleware and authentication patterns
  - Follow existing error handling patterns from payroll APIs
  - Extend existing API tests in **tests**/integration/
  - Run lint, tsc check, remove console.logs, and commit changes
  - _Requirements: 1.5, 4.2, 4.4, 5.2_

- [x] 4. Build rankings report page using existing components and patterns
  - Create /app/(protected)/reports/rankings/page.tsx following existing report page structure
  - Use existing Card, Table, Badge, and Chart components from components/ui/
  - If new components needed, use shadcn/ui MCP server (list_blocks, get_component_demo)
  - Follow existing responsive design patterns and brand colors (#026937, #ea7200)
  - Use existing loading states, skeleton components, and navigation patterns
  - Run lint, tsc check, remove console.logs, and commit changes
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 6.1, 6.2_

- [x] 5. Verify and enhance existing role-based access control for managers
  - Test existing RoleGuard component works for manager subordinate access
  - Verify existing role permission logic in lib/auth.ts supports manager team access
  - Enhance existing audit logging if needed for manager data access
  - Test existing API middleware properly filters manager subordinate data
  - Run lint, tsc check, remove console.logs, and commit any changes
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 4.5_

- [-] 6. Verify existing admin dashboard supports manager capabilities
  - Test existing components/features/admin/user-management-dashboard.tsx for managers
  - Verify managers can see captain/wingman data but not other roles
  - Confirm existing Tabs and filtering work for manager use cases
  - Test existing drill-down patterns work for manager team oversight
  - Run lint, tsc check, remove console.logs, and commit any fixes
  - _Requirements: 2.1, 2.2, 2.4, 5.2_

- [ ] 7. Verify existing wingman payroll access works correctly
  - Test existing components/features/reports/my-payroll-view.tsx for wingmen
  - Verify wingmen can see tips analysis and time period filtering
  - Confirm existing rate display and average calculations work for wingmen
  - Test that wingmen cannot submit logs but can access payroll
  - Run lint, tsc check, remove console.logs, and commit any fixes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 8. Add captain performance highlighting using existing components
  - Highlight current user's performance in rankings table when they are a captain
  - Add basic drill-down using existing modal/dialog patterns
  - Use existing Tooltip components for metric explanations
  - Run lint, tsc check, remove console.logs, and commit changes
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 9. Verify all roles can access rankings report appropriately
  - Test sales consultants can access rankings without payroll data exposure
  - Use existing Table sorting and filtering components
  - Ensure no sensitive compensation data is displayed to any role
  - Run lint, tsc check, remove console.logs, and commit changes
  - _Requirements: 6.1, 6.4, 1.5_

- [ ] 10. Add performance optimizations using existing patterns
  - Implement caching for performance calculations using existing strategies
  - Use existing loading states and skeleton components
  - Optimize queries following existing database patterns
  - Run lint, tsc check, remove console.logs, and commit changes
  - _Requirements: 4.4, 4.2_

- [ ] 11. Test and validate the complete feature
  - Write unit tests extending existing test suite patterns
  - Test role-based access control for all user types
  - Verify all functionality works across different roles
  - Run full test suite, lint, tsc check, and final commit
  - _Requirements: All requirements validation_
