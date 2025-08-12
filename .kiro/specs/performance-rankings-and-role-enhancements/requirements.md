# Requirements Document

## Introduction

This feature introduces a comprehensive performance rankings system that allows all employees to view captain performance metrics, enhances manager permissions to oversee their team members effectively, and ensures wingmen have proper access to their payroll information including tips analysis. The system will provide transparent performance visibility while maintaining appropriate role-based access controls and protecting sensitive payroll data.

## Requirements

### Requirement 1

**User Story:** As any employee, I want to view a performance rankings report so that I can see how captains are performing across different metrics without accessing sensitive payroll information.

#### Acceptance Criteria

1. WHEN I navigate to the rankings report THEN the system SHALL display captain performance metrics split between Junk and Move operations
2. WHEN viewing captain rankings THEN the system SHALL show number of jobs, average job size (revenue / number of jobs), total revenue, and captain labor percentage for both Junk and Move separately
3. WHEN viewing captain performance THEN the system SHALL display disposal percentages for all captains
4. WHEN viewing Move operation metrics THEN the system SHALL show upsell revenue and percentage, valuation revenue and percentage, junk on move revenue and percentage, and materials revenue and percentage
5. WHEN accessing the rankings report THEN the system SHALL NOT display any payroll numbers, labor costs, or compensation information
6. WHEN I am any role (Captain, Wingman, Sales Consultant, Manager, System Admin) THEN the system SHALL allow me to access the rankings report

### Requirement 2

**User Story:** As a manager, I want to see comprehensive information about captains and wingmen under my supervision so that I can effectively manage my team's performance and operations.

#### Acceptance Criteria

1. WHEN I am logged in as a manager THEN the system SHALL allow me to view all information about captains including jobs, stats, reports, payroll, and logs
2. WHEN I am logged in as a manager THEN the system SHALL allow me to view all information about wingmen including stats, reports, payroll, and relevant data
3. WHEN I am logged in as a manager THEN the system SHALL NOT allow me to view information about other sales consultants, managers, or system admin users
4. WHEN accessing team member information THEN the system SHALL provide comprehensive visibility into performance metrics, work history, and compensation details
5. WHEN viewing subordinate data THEN the system SHALL maintain audit trails of manager access to sensitive information

### Requirement 3

**User Story:** As a wingman, I want to access my payroll information and tips analysis so that I can understand my compensation and track my earnings over different time periods.

#### Acceptance Criteria

1. WHEN I am logged in as a wingman THEN the system SHALL allow me to access "My Payroll" section
2. WHEN viewing my payroll THEN the system SHALL display tips earned for current pay period, previous pay period, and all time
3. WHEN accessing my compensation details THEN the system SHALL show my department hourly rates
4. WHEN viewing earnings analysis THEN the system SHALL calculate and display my average rate including tips
5. WHEN I am a wingman THEN the system SHALL NOT allow me to submit logs but SHALL maintain login access for payroll viewing
6. WHEN accessing payroll information THEN the system SHALL provide time period filtering (current, previous, all time, custom date ranges)

### Requirement 4

**User Story:** As a system administrator, I want the rankings and role-based access system to integrate seamlessly with existing authentication and authorization so that security and data integrity are maintained.

#### Acceptance Criteria

1. WHEN implementing rankings functionality THEN the system SHALL integrate with existing role-based authentication
2. WHEN displaying performance data THEN the system SHALL ensure data accuracy by pulling from approved logs and commission entries
3. WHEN managers access subordinate information THEN the system SHALL log all access attempts for audit purposes
4. WHEN calculating performance metrics THEN the system SHALL use real-time data from the database with appropriate caching for performance
5. WHEN users access role-restricted information THEN the system SHALL enforce permissions at both UI and API levels
6. WHEN displaying rankings THEN the system SHALL handle edge cases such as captains with no jobs, missing data, or calculation errors gracefully

### Requirement 5

**User Story:** As a captain, I want to see my own detailed performance metrics in the rankings system so that I can understand how I compare to other captains and identify areas for improvement.

#### Acceptance Criteria

1. WHEN viewing the rankings report as a captain THEN the system SHALL highlight my own performance metrics
2. WHEN accessing detailed performance data THEN the system SHALL provide drill-down capabilities to see job-level details for my own work
3. WHEN comparing performance THEN the system SHALL show percentile rankings and relative performance indicators
4. WHEN viewing historical data THEN the system SHALL allow filtering by date ranges to track performance trends
5. WHEN accessing performance metrics THEN the system SHALL provide explanations of how each metric is calculated

### Requirement 6

**User Story:** As a sales consultant, I want to access the rankings report to understand captain performance so that I can make informed decisions about job assignments and team collaboration.

#### Acceptance Criteria

1. WHEN I am logged in as a sales consultant THEN the system SHALL allow me to view the rankings report
2. WHEN viewing captain performance THEN the system SHALL provide filtering and sorting capabilities by different metrics
3. WHEN accessing rankings data THEN the system SHALL show performance trends over time
4. WHEN viewing captain metrics THEN the system SHALL NOT display any payroll or compensation information
5. WHEN using the rankings report THEN the system SHALL provide export capabilities for performance data analysis