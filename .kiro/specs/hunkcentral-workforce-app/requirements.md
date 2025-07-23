# Requirements Document

## Introduction

HUNKCentral is a digital workforce management system that replaces paper logs and Excel spreadsheets for College Hunks Hauling Junk & Moving. The system enables captains to submit daily work logs, managers to review and approve them, sales staff to track commissions, and administrators to generate payroll reports. Built as a modern Next.js web application with shadcn/ui (New York theme), the system focuses on simplicity and mobile-first design to streamline operations for field workers and office staff.

## Requirements

### Requirement 1: User Authentication and Role Management

**User Story:** As a system administrator, I want to manage user accounts with role-based access control, so that employees can access appropriate features based on their job responsibilities.

#### Acceptance Criteria

1. WHEN a user visits the application THEN the system SHALL require authentication via NextAuth credentials provider
2. WHEN a user logs in successfully THEN the system SHALL redirect them to a role-appropriate dashboard
3. WHEN an administrator creates a user account THEN the system SHALL allow assignment of multiple roles from the five available roles: admin, manager, captain, sales, wingman
4. WHEN a user attempts to access a restricted page THEN the system SHALL enforce role-based permissions and redirect unauthorized users
5. IF a user session expires THEN the system SHALL redirect to login page and preserve the intended destination

### Requirement 2: Captain Daily Log Creation

**User Story:** As a captain, I want to create and submit daily work logs from my mobile device or computer, so that I can accurately record job details, revenue, and team hours for payroll processing.

#### Acceptance Criteria

1. WHEN a captain creates a new daily log THEN the system SHALL provide sections for Junk jobs, Move jobs, and Other hours
2. WHEN adding jobs to the Junk section THEN the system SHALL capture job type, client name, job ID, revenue, tips, and co-captain assignments with disposal costs tracked at section level
3. WHEN adding jobs to the Move section THEN the system SHALL capture job type, client name, job ID, revenue, tips, upsells (Junk on Move, Valuation, Materials), and co-captain assignments
4. WHEN entering job information THEN the system SHALL provide dynamic job tiles that allow adding multiple jobs to each section with an "Add Another Job" button
5. WHEN recording team hours THEN the system SHALL provide dynamic "Add HUNK" functionality to add employee entries for each section (Junk, Move, Other Hours)
6. WHEN adding employee hours THEN the system SHALL allow selection of employee name and input of total hours for that specific log section
7. WHEN calculating section summaries THEN the system SHALL display real-time calculations including tips per HUNK (total section tips divided by number of HUNKs), total hours, and labor cost percentage
8. WHEN displaying Junk section summary THEN the system SHALL show disposal cost percentage if disposal expenses were reported
9. WHEN displaying Move section summary THEN the system SHALL show upsell percentage (total upsells divided by move revenue) and move labor cost percentage
10. WHEN completing all sections THEN the system SHALL display overall totals including employee summary with total hours and earned tips, plus combined revenue statistics across all jobs
11. WHEN calculating labor costs THEN the system SHALL apply appropriate hourly rates (wingman rate by default, captain rate for captain and co-captains)
12. WHEN displaying labor percentages THEN the system SHALL show calculated labor cost percentage against goals (14% for Junk, 24% for Move)
13. WHEN working on mobile devices THEN the system SHALL provide large touch targets and optimized input methods
14. WHEN creating a log THEN the system SHALL auto-save drafts every 30 seconds to prevent data loss
15. WHEN submitting a log THEN the system SHALL validate all required fields and change status to "submitted"
16. WHEN creating a log THEN the system SHALL allow users with appropriate permissions to select a different captain than themselves for the log entry

### Requirement 3: Manager Review and Approval Workflow

**User Story:** As a manager, I want to review and approve captain daily logs with the ability to make corrections, so that payroll data is accurate before processing.

#### Acceptance Criteria

1. WHEN a manager accesses the review interface THEN the system SHALL display a queue of submitted logs awaiting approval
2. WHEN reviewing a log THEN the system SHALL provide a detailed view with all job and hour entries
3. WHEN editing a log during review THEN the system SHALL allow inline modification of employee assignments, hours, revenue, and job details
4. WHEN approving a log THEN the system SHALL update the status to "approved" and timestamp the approval
5. WHEN a log is approved THEN the system SHALL trigger automatic commission matching for any jobs with matching job IDs
6. WHEN viewing logs THEN the system SHALL provide side-by-side comparison capability with external systems
7. WHEN bulk operations are needed THEN the system SHALL support batch approval of multiple logs

### Requirement 4: Sales Commission Tracking

**User Story:** As a sales employee, I want to enter commission entries for jobs I book, so that I can track my earnings and ensure proper commission calculation when jobs are completed.

#### Acceptance Criteria

1. WHEN any employee with commission permissions creates an entry THEN the system SHALL capture client name, job ID, estimated amount, target date, and job type
2. WHEN a commission entry is created THEN the system SHALL set initial status to "pending" awaiting job completion
3. WHEN a captain log containing a matching job ID is approved THEN the system SHALL automatically match the commission entry and update actual revenue
4. WHEN commission is calculated THEN the system SHALL multiply actual revenue by the employee's commission rate
5. WHEN displaying commission status THEN the system SHALL show booking accuracy metrics comparing estimated vs actual revenue
6. WHEN multiple employees book the same job ID THEN the system SHALL prevent duplicate entries and flag conflicts
7. WHEN creating a commission entry THEN the system SHALL allow users with appropriate permissions to select a different sales consultant than themselves for the entry

### Requirement 5: Payroll Report Generation

**User Story:** As a manager or administrator, I want to generate comprehensive payroll reports, so that I can process employee compensation accurately through ADP or other payroll systems.

#### Acceptance Criteria

1. WHEN generating payroll reports THEN the system SHALL calculate hours by department for each employee
2. WHEN calculating wages THEN the system SHALL apply appropriate hourly rates based on department and co-captain status
3. WHEN processing tips THEN the system SHALL divide tips equally among team members within each job section
4. WHEN calculating labor bonuses THEN the system SHALL apply bonus formulas: (goal% - actual%) × captain revenue for qualifying captains
5. WHEN including commission THEN the system SHALL add matched commission amounts to employee totals
6. WHEN handling salary employees THEN the system SHALL include base or supplemental salary amounts based on frequency settings
7. WHEN exporting reports THEN the system SHALL format data compatible with ADP import requirements
8. WHEN viewing individual reports THEN the system SHALL provide detailed breakdown of all compensation components

### Requirement 6: User Management with Compensation Settings

**User Story:** As an administrator, I want to manage employee profiles with comprehensive compensation settings, so that the system can accurately calculate wages, commissions, and bonuses.

#### Acceptance Criteria

1. WHEN creating or editing users THEN the system SHALL provide fields for all nine department hourly rates (junk captain/wingman, move captain/wingman, zigma, training, estimating, warehouse, admin)
2. WHEN setting salary information THEN the system SHALL allow optional salary amount and frequency (weekly, bi-weekly, monthly) with type designation (base, guaranteed, supplemental)
3. WHEN configuring commission THEN the system SHALL allow setting commission rate percentage for any employee
4. WHEN setting bonus goals THEN the system SHALL provide fields for junk bonus goal (default 14%) and move bonus goal (default 24%)
5. WHEN copying user settings THEN the system SHALL provide template functionality to copy rates from existing users
6. WHEN displaying user information THEN the system SHALL group fields logically (rates, salary, commission, bonuses)
7. WHEN managing large user lists THEN the system SHALL provide search, filter, and bulk edit capabilities

### Requirement 7: Pay Period Management

**User Story:** As an administrator, I want to manage pay periods and control when data can be modified, so that payroll processing maintains data integrity and audit trails.

#### Acceptance Criteria

1. WHEN creating pay periods THEN the system SHALL require name, start date, and end date
2. WHEN managing pay period status THEN the system SHALL support three states: open, locked, closed
3. WHEN a pay period is locked THEN the system SHALL prevent modifications to logs and commission entries within that period
4. WHEN a pay period is closed THEN the system SHALL finalize all calculations and prevent any changes
5. WHEN viewing historical data THEN the system SHALL maintain access to closed pay period reports
6. WHEN transitioning pay periods THEN the system SHALL validate data completeness before allowing status changes

### Requirement 8: Mobile-First User Experience

**User Story:** As a field employee, I want to use the system effectively on my mobile device, so that I can complete tasks efficiently while working on-site.

#### Acceptance Criteria

1. WHEN accessing the system on mobile THEN the system SHALL provide responsive design with touch-optimized interfaces
2. WHEN entering numeric data THEN the system SHALL display appropriate keyboard types (number pad for amounts, hours)
3. WHEN navigating the application THEN the system SHALL use bottom navigation on mobile and sidebar on desktop
4. WHEN using forms THEN the system SHALL provide large touch targets (minimum 44px) and clear visual feedback
5. WHEN working offline THEN the system SHALL maintain draft capability and sync when connection is restored
6. WHEN using authentication THEN the system SHALL support biometric login where available
7. WHEN loading pages THEN the system SHALL achieve page load times under 1 second on mobile networks

### Requirement 9: Data Validation and Error Handling

**User Story:** As a user, I want the system to validate my input and provide clear error messages, so that I can correct mistakes and ensure data accuracy.

#### Acceptance Criteria

1. WHEN entering form data THEN the system SHALL provide real-time validation with immediate feedback
2. WHEN validation errors occur THEN the system SHALL display clear, actionable error messages
3. WHEN submitting forms THEN the system SHALL prevent submission with invalid data and highlight problem fields
4. WHEN system errors occur THEN the system SHALL display user-friendly messages and log technical details
5. WHEN data conflicts arise THEN the system SHALL provide resolution options and prevent data corruption
6. WHEN network issues occur THEN the system SHALL handle gracefully with retry mechanisms and offline capability

### Requirement 10: Performance and Security

**User Story:** As a system user, I want the application to be fast, secure, and reliable, so that I can complete my work efficiently without security concerns.

#### Acceptance Criteria

1. WHEN accessing any page THEN the system SHALL load in under 1 second
2. WHEN handling user data THEN the system SHALL implement row-level security on all database tables
3. WHEN processing authentication THEN the system SHALL use secure session management with appropriate timeouts
4. WHEN storing sensitive data THEN the system SHALL encrypt data at rest and in transit
5. WHEN achieving performance targets THEN the system SHALL maintain Lighthouse scores above 90
6. WHEN ensuring accessibility THEN the system SHALL meet WCAG 2.1 AA standards
7. WHEN handling concurrent users THEN the system SHALL maintain performance with up to 50 simultaneous users

### Requirement 11: Mixed Compensation Model Support

**User Story:** As an administrator, I want the system to support mixed compensation models, so that employees can be paid through various combinations of hourly, salary, commission, and bonuses.

#### Acceptance Criteria

1. WHEN configuring employee compensation THEN the system SHALL allow any combination of hourly rates, salary, commission, and bonuses
2. WHEN an employee has a base salary THEN the system SHALL use their hourly rates only for labor cost reporting and bonus calculations
3. WHEN an employee has a supplemental salary THEN the system SHALL add this amount to their other earnings
4. WHEN an employee with commission rate books a job THEN the system SHALL create commission entries regardless of their primary role
5. WHEN calculating payroll THEN the system SHALL combine all applicable compensation types for each employee
6. WHEN displaying compensation breakdowns THEN the system SHALL clearly separate different payment types

### Requirement 12: Audit Trail and Activity Tracking

**User Story:** As a manager or administrator, I want to track all system activities and changes, so that I can maintain accountability and investigate any discrepancies in payroll data.

#### Acceptance Criteria

1. WHEN any user creates a daily log THEN the system SHALL record who created it and when
2. WHEN any user edits a daily log THEN the system SHALL record who made the last edit and when
3. WHEN a manager approves a log THEN the system SHALL record who approved it and when
4. WHEN any data is modified THEN the system SHALL create an audit log entry with before/after values
5. WHEN viewing audit trails THEN the system SHALL display chronological activity for any log or commission entry
6. WHEN investigating discrepancies THEN the system SHALL provide detailed audit logs showing all changes and who made them
7. WHEN accessing audit information THEN the system SHALL restrict access to users with manager or admin roles
