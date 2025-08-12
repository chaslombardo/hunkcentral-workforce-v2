# Critical UX Fixes Implementation Plan

## Implementation Guidelines

**For ALL tasks:**

- Use shadcn/ui components wherever possible (Table, Button, Input, Select, Dialog, etc.)
- Run `npm run lint` and `npm run tsc` after completing each task to ensure code quality
- Commit changes with descriptive commit message after completing each task
- Test functionality thoroughly before marking tasks complete

## Phase 1: Critical Bug Fixes (Priority 1)

- [x] 1. Fix audit log client-side errors
  - Debug and resolve client-side exceptions in audit log component
  - Add proper error boundary protection
  - Test audit log page loads without exceptions
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Commit changes with descriptive message
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 2. Fix log viewing server-side errors
  - Debug and resolve server-side exceptions in log viewing pages
  - Add proper error handling for database queries
  - Test all log viewing pages load without server errors
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Commit changes with descriptive message
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 3. Resolve database constraint violations in log creation
  - Fix foreign key constraint errors in LogHour creation (employeeId_fkey)
  - Add proper validation for employee IDs before database operations
  - Test log submission works without Prisma errors
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Commit changes with descriptive message
  - _Requirements: 9.4, 9.5_

- [x] 4. Fix broken navigation links and add filters to review logs
  - Fix 404 error on "Learn More" button clicks
  - Implement proper routing or disable non-functional links
  - Add captain filter dropdown to filter logs by specific captain
  - Add date selection filter with options for pay periods or custom date range
  - Test all navigation links and filters work correctly
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 11.1, 11.2, 11.3_

## Phase 2: Data Integration Fixes (Priority 1)

- [x] 5. Replace mock data in reports and analytics
  - Remove hardcoded mock data from My Payroll page
  - Remove hardcoded mock data from Analytics page
  - Connect to real database queries for all report data
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 4.1, 4.2, 4.3, 6.1_

- [x] 6. Fix user data in log creation form
  - Replace mock users in captain dropdown with real database users
  - Default captain selection to current logged-in user
  - Populate team hours section with real employee data
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 7. Fix My Payroll page tab counts and layout issues
  - Correct "Detail (0)" tab to show actual count of displayed employees
  - Fix non-functional quick action buttons
  - Fix Pay History tab where chart overlaps other report tiles
  - Fix Performance tab where chart overlaps other report tiles
  - Ensure proper layout and spacing for all charts and report components
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 8. Add missing pay periods dashboard tiles
  - Create three summary tiles at top of pay periods page
  - Order pay period cards chronologically by date (most recent first)
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 2.1, 2.2, 2.3_

## Phase 3: Enhanced Data Tables (Priority 2)

- [x] 9. Add pagination and controls to employee list
  - Add pagination controls with next/previous buttons
  - Add dropdown for rows per page (10, 25, 50, 100)
  - Add search functionality across employee fields
  - Add column sorting and filtering capabilities
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

## Phase 4: Form and UI Fixes (Priority 2)

- [x] 10. Fix commission creation form issues
  - Fix sales consultant dropdown text alignment (currently squished left)
  - Enable future date selection in target date calendar
  - Fix estimated revenue field to allow clearing default zero value
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Implement commission tracking quick actions
  - Add functional options to quick action dropdown menu
  - Implement Edit, Delete, Approve, Reject actions
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 12. Implement analytics page tabs with real functionality
  - Replace "This feature is coming soon" in Performance tab with real performance metrics and charts
  - Replace "This feature is coming soon" in Trends tab with real trend analysis and charts
  - Replace "This feature is coming soon" in Commission tab with real commission analytics and charts
  - Connect all tabs to real database data and meaningful business insights
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [-] 13. Optimize draft and auto-save system
  - Disable problematic auto-save functionality causing sync issues
  - Keep reliable manual save draft feature
  - Clear "Synchronizing Data" messages and pending sync items
  - Run `npm run lint` and `npm run tsc` to ensure code quality
  - Remove any console.logs in the production code.
  - Commit changes with descriptive message
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
