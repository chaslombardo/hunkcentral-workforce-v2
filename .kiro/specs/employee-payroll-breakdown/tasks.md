# Implementation Plan

- [x] 1. Enhance database queries and server actions for detailed payroll data
  - Create enhanced payroll calculation functions that include department breakdowns, daily work history, and tips details
  - Implement database queries for department-specific hours and rates
  - Add server actions for fetching detailed payroll breakdowns with proper caching
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2_

- [x] 2. Create department breakdown component with rate visibility
  - Implement DepartmentBreakdown component showing hours, rates, and pay by department
  - Add rate information panel displaying all employee hourly rates across departments
  - Create visual indicators for primary department and percentage calculations
  - Include tooltips and explanations for rate applications
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 4.1, 4.2, 4.5_

- [x] 3. Build daily work calendar and history components
  - Create DailyWorkCalendar component with interactive date selection
  - Implement daily work detail view showing department hours and roles for specific days
  - Add work pattern analysis and summary statistics
  - Create mobile-optimized calendar interface with touch targets
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6, 6.3_

- [x] 4. Implement comprehensive tips tracking and breakdown
  - Create TipsDetailView component with sortable and filterable tips list
  - Add detailed tip entry cards showing job information, team sharing, and calculations
  - Implement tips performance metrics and daily/job-level breakdowns
  - Create explanatory tooltips for tip distribution formulas
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Enhance main payroll view with new tabbed interface
  - Restructure MyPayrollView component to include new detailed breakdown tabs
  - Add progressive loading for detailed data while maintaining summary performance
  - Implement tab navigation for breakdown, daily history, tips, and rates sections
  - Create responsive layout that works on mobile and desktop
  - _Requirements: 1.7, 2.7, 5.1, 5.2, 6.1, 6.2_

- [x] 6. Add interactive pay period analysis and comparison features
  - Implement period-to-period comparison functionality with trend indicators
  - Create performance metrics showing labor efficiency and tip averages over time
  - Add charts or visual representations of pay trends and work patterns
  - Include insights and pattern recognition for employee performance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 7. Create export and documentation features
  - Implement PayrollExportDialog component for PDF and CSV generation
  - Add detailed paystub generation with all breakdown information
  - Create calculation explanation tooltips and help documentation
  - Implement print-friendly layouts for payroll information
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 8. Add data validation and audit trail functionality
  - Implement payroll calculation validation with error detection
  - Create audit trail links connecting payroll data to original logs
  - Add discrepancy reporting and flagging system
  - Create data accuracy verification tools for employees
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 9. Optimize mobile experience and responsive design
  - Implement mobile-first responsive layouts for all new components
  - Add touch-optimized interactions and navigation
  - Create collapsible sections and progressive disclosure for mobile
  - Optimize loading performance and add appropriate loading states
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 10. Refactor mobile optimizations to use pure shadcn/ui patterns
  - Remove all custom mobile optimization components (MobileOptimizedContainer, TouchOptimizedButton, MobileProgressiveDisclosure)
  - Replace custom components with direct shadcn/ui Button, Collapsible, and responsive classes
  - Ensure all mobile touch targets and responsive behavior still work with pure shadcn/ui
  - Update all payroll breakdown components to use standard shadcn/ui patterns only
  - Verify mobile functionality remains intact after removing custom abstractions
  - _Requirements: 6.1, 6.2, 6.3, 6.4 (maintaining mobile experience with proper shadcn/ui patterns)_

- [x] 11. Add error handling and fallback states
  - Implement graceful degradation when detailed data is unavailable
  - Add error boundaries and user-friendly error messages
  - Create fallback views that show summary data when breakdowns fail
  - Add retry mechanisms and offline capability for mobile users
  - _Requirements: 8.1, 8.6, 8.7_

- [x] 12. Create comprehensive test suite for payroll breakdown features
  - Write unit tests for all new components and calculation functions
  - Add integration tests for complete payroll calculation workflows
  - Create end-to-end tests for user interactions with detailed breakdowns
  - Test mobile responsiveness and touch interactions
  - _Requirements: All requirements - testing validates implementation_

- [x] 13. Implement performance optimizations and caching
  - Add intelligent caching for closed pay periods and historical data
  - Implement progressive loading strategies for large datasets
  - Optimize database queries with proper indexing
  - Add performance monitoring and optimization for mobile devices
  - _Requirements: 5.7, 6.7_

- [x] 14. Fix components to use proper shadcn/ui blocks and components
  - Review all payroll breakdown components and replace custom implementations with proper shadcn/ui blocks where available
  - Use shadcn/ui MCP server to get component demos before implementing any components
  - Ensure all components follow shadcn/ui patterns and class names
  - Fix failing tests by using proper shadcn/ui structure
  - Prioritize blocks over individual components where possible
  - _Requirements: All requirements - proper UI implementation_

- [x] 15. Fix multiple "Total Pay" elements test failure
  - Update test in **tests**/components/my-payroll-view.test.tsx to use more specific selectors
  - Change `screen.getByText('Total Pay')` to `screen.getAllByText('Total Pay')[0]` or use more specific queries
  - Add data-testid attributes to distinguish between header "Total Pay" and summary card "Total Pay"
  - Verify the test can find the correct "Total Pay" element in the summary cards section
  - _Requirements: All requirements - ensure test coverage validates implementation_

- [x] 16. Fix missing test IDs in mocked components (Remember to use shadnc/ui mcp for blocks and components with component demos, never use custom components, if you see one it must be switched back to shadcn)
  - Update mocked DepartmentBreakdown component to include data-testid="department-breakdown"
  - Update mocked DailyWorkCalendar component to include data-testid="daily-work-calendar"
  - Update mocked TipsDetailView component to include data-testid="tips-detail-view"
  - Update mocked RateInformationPanel component to include data-testid="rate-information-panel"
  - Ensure all mocked components render the expected test IDs for tab content verification
  - _Requirements: All requirements - ensure test coverage validates implementation_

- [ ] 17. Fix React act() warnings and async state updates (Remember to use shadnc/ui mcp for blocks and components with component demos, never use custom components, if you see one it must be switched back to shadcn)
  - Mock the useOfflineDetection hook to prevent async fetch calls during tests
  - Wrap component renders in act() where state updates occur during mounting
  - Add proper async/await handling for components that trigger state updates
  - Mock the connectivity check function to return synchronous results in tests
  - Ensure all useEffect hooks that cause state updates are properly handled in test environment
  - _Requirements: All requirements - ensure test coverage validates implementation_

- [ ] 18. Fix offline detection hook test environment issues (Remember to use shadnc/ui mcp for blocks and components with component demos, never use custom components, if you see one it must be switched back to shadcn)
  - Create a mock for useOfflineDetection hook that returns stable offline state
  - Mock the fetch call to /api/health that's causing "Invalid URL" errors in tests
  - Add vi.mock for hooks/useOfflineDetection.ts in test setup
  - Ensure the mock returns consistent isOffline: false and hasOfflineData: false values
  - Prevent the hook from making actual network requests during test execution
  - _Requirements: All requirements - ensure test coverage validates implementation_

- [ ] 19. Fix tab navigation and component rendering in tests (Remember to use shadnc/ui mcp for blocks and components with component demos, never use custom components, if you see one it must be switched back to shadcn)
  - Verify that tab switching works correctly in the test environment
  - Ensure TabsContent components render their children when the tab is active
  - Fix any issues with conditional rendering based on activeTab state
  - Add proper test assertions for tab content visibility after tab switches
  - Ensure mocked components are rendered within the correct TabsContent containers
  - _Requirements: All requirements - ensure test coverage validates implementation_

- [x] 20. Fix critical syntax error in payroll-error-recovery.test.ts (COMMIT BLOCKING)
  - Fix malformed JSX on line 132: `render(<MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />);`
  - Ensure proper JSX syntax and component props are correctly formatted
  - Verify the test file compiles without syntax errors
  - Run the specific test to ensure it executes properly
  - _Requirements: All requirements - critical build fix_

- [x] 21. Fix Playwright configuration error in captain-journey.test.ts (COMMIT BLOCKING)
  - Fix the Playwright test configuration issue preventing test.describe() from being called
  - Ensure proper Playwright test setup and imports
  - Verify the E2E test can run without configuration errors
  - Check for conflicting Playwright versions or configuration issues
  - _Requirements: All requirements - critical test configuration fix_

- [x] 22. Fix multiple element selection issues in tests
  - Replace `getByText()` with `getAllByText()[0]` or more specific selectors for elements that appear multiple times
  - Fix "Tips Distribution", "$720.00", "Performance Bonuses", "College Hunks Hauling Junk & Moving" multiple element errors
  - Add data-testid attributes to distinguish between similar elements
  - Use more specific query methods like `getByRole()` with name options where appropriate
  - Update all affected test files to use proper element selection
  - _Requirements: ensure test coverage validates implementation_

- [x] 23. Fix missing validation functions and schema errors (COMMIT BLOCKING)
  - Implement missing `validatePayrollAction` function referenced in enhanced-payroll-calculations.test.ts
  - Fix Zod validation schema error messages to match test expectations
  - Ensure validation functions return proper error objects with expected message formats
  - Update validation tests to match actual Zod error message formats
  - _Requirements: All requirements - ensure validation works correctly_

- [ ] 24. Replace all custom components with proper shadcn/ui blocks and components (Use shadcn/ui MCP server)
  - Use shadcn/ui MCP server to get proper blocks and component demos before implementing
  - Replace any custom mobile optimization components with standard shadcn/ui patterns
  - Replace custom error boundary components with proper shadcn/ui Alert and Card patterns
  - Replace custom loading skeleton components with proper shadcn/ui Skeleton component
  - Replace custom tooltip and popover components with proper shadcn/ui Tooltip and Popover components
  - Ensure all components follow shadcn/ui New York theme patterns
  - _Requirements: All requirements - proper UI implementation with shadcn/ui_

- [x] 25. Fix missing test IDs and mock issues (COMMIT BLOCKING)
  - Add proper data-testid attributes to skeleton components for test identification
  - Fix offline detection hook mocking to prevent network requests during tests
  - Mock localStorage operations properly in test environment
  - Add missing test IDs for payroll export dialog elements
  - Fix print layout component test element selection issues
  - _Requirements: All requirements - ensure test coverage validates implementation_

- [ ] 26. Fix database and integration test issues
  - Fix Prisma Decimal comparison issues in integration tests
  - Fix database constraint violations in log workflow tests
  - Ensure proper test data cleanup between test runs
  - Fix commission calculation and matching logic in integration tests
  - Update payroll calculation tests to handle proper data types
  - _Requirements: All requirements - ensure integration tests pass_
