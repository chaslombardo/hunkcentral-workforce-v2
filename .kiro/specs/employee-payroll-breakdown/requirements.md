# Requirements Document

## Introduction

This feature enhances the existing HUNKCentral employee payroll self-service functionality by providing detailed department-specific breakdowns, daily work history, tips tracking, and comprehensive pay analysis. Currently, the "My Payroll" page shows only summary totals without the granular details employees need to understand their compensation. This enhancement will provide transparency into how pay is calculated across different departments, when tips were earned, and detailed daily work breakdowns.

## Requirements

### Requirement 1: Department-Specific Pay Breakdown

**User Story:** As an employee, I want to see my pay broken down by each department I worked in, so that I can understand how my compensation is calculated across different types of work.

#### Acceptance Criteria

1. WHEN viewing my payroll breakdown THEN the system SHALL display separate sections for each department where I worked hours
2. WHEN displaying department pay THEN the system SHALL show the hourly rate, total hours, and gross pay for each department (junk captain, junk wingman, move captain, move wingman, zigma, training, estimating, warehouse, admin)
3. WHEN I worked as both captain and wingman THEN the system SHALL clearly separate the hours and rates for each role
4. WHEN displaying department totals THEN the system SHALL show the percentage of total hours worked in each department
5. WHEN calculating department pay THEN the system SHALL apply the correct hourly rate based on my role and department settings
6. WHEN viewing the breakdown THEN the system SHALL highlight my primary department (where I worked the most hours)
7. WHEN no hours exist for a department THEN the system SHALL not display that department in the breakdown

### Requirement 2: Daily Work History and Breakdown

**User Story:** As an employee, I want to see which specific days I worked and what I did each day, so that I can verify my timesheet and understand my work patterns.

#### Acceptance Criteria

1. WHEN viewing my daily breakdown THEN the system SHALL display a calendar or list view of all days I worked in the selected pay period
2. WHEN viewing a specific work day THEN the system SHALL show which departments I worked in, total hours per department, and any tips earned that day
3. WHEN I worked multiple departments in one day THEN the system SHALL break down hours by department for that specific day
4. WHEN viewing daily details THEN the system SHALL show which captain logs I was included in and my role (captain, co-captain, or wingman)
5. WHEN tips were earned on a specific day THEN the system SHALL show the tip amount and which jobs generated those tips
6. WHEN viewing work patterns THEN the system SHALL provide summary statistics like average hours per day, most common department, and busiest days
7. WHEN no work was recorded for a day THEN the system SHALL clearly indicate non-work days in the calendar view

### Requirement 3: Comprehensive Tips Tracking

**User Story:** As an employee, I want to see detailed information about all tips I earned, including which days and jobs generated them, so that I can track my performance and verify tip calculations.

#### Acceptance Criteria

1. WHEN viewing my tips breakdown THEN the system SHALL display total tips earned with a detailed list of each tip entry
2. WHEN viewing tip details THEN the system SHALL show the date, job ID, client name, total job tips, number of team members, and my share of tips
3. WHEN tips were shared among team members THEN the system SHALL show how tips were divided and who else received shares
4. WHEN viewing tip history THEN the system SHALL provide daily tip totals and identify my highest and lowest tip days
5. WHEN analyzing tip performance THEN the system SHALL show average tips per job, tips per hour worked, and comparison to previous periods
6. WHEN viewing job-specific tips THEN the system SHALL indicate whether tips came from junk jobs, move jobs, or other services
7. WHEN tip calculations are complex THEN the system SHALL provide clear explanations of how tips were calculated and distributed

### Requirement 4: Enhanced Department Rate Visibility

**User Story:** As an employee, I want to see all my hourly rates for different departments and roles, so that I understand how my pay is calculated and can verify rate accuracy.

#### Acceptance Criteria

1. WHEN viewing my rate information THEN the system SHALL display all nine department rates (junk captain/wingman, move captain/wingman, zigma, training, estimating, warehouse, admin)
2. WHEN displaying rates THEN the system SHALL clearly indicate which rates apply to me based on my roles and permissions
3. WHEN I have captain privileges THEN the system SHALL show both captain and wingman rates for applicable departments
4. WHEN viewing rate history THEN the system SHALL show if any rates changed during the pay period and when changes took effect
5. WHEN rates differ by role THEN the system SHALL explain when captain vs wingman rates are applied
6. WHEN viewing unused rates THEN the system SHALL show all my available rates even for departments where I didn't work
7. WHEN rate calculations are applied THEN the system SHALL show which specific rate was used for each hour worked

### Requirement 5: Interactive Pay Period Analysis

**User Story:** As an employee, I want to analyze my pay across different time periods and compare my performance, so that I can track my earnings trends and identify opportunities for improvement.

#### Acceptance Criteria

1. WHEN selecting different pay periods THEN the system SHALL maintain all detailed breakdowns for the selected period
2. WHEN comparing periods THEN the system SHALL show trends in total pay, hours by department, tips earned, and bonus performance
3. WHEN viewing period comparisons THEN the system SHALL highlight significant changes in work patterns or compensation
4. WHEN analyzing performance THEN the system SHALL show metrics like labor efficiency, average tips per job, and department distribution changes
5. WHEN viewing historical data THEN the system SHALL provide charts or graphs showing pay trends over time
6. WHEN identifying patterns THEN the system SHALL highlight my most productive periods and suggest insights about work patterns
7. WHEN data is incomplete THEN the system SHALL clearly indicate which periods have partial or missing data

### Requirement 6: Mobile-Optimized Detailed Views

**User Story:** As an employee, I want to access all detailed payroll information on my mobile device, so that I can review my pay breakdown while on the go.

#### Acceptance Criteria

1. WHEN accessing detailed breakdowns on mobile THEN the system SHALL provide collapsible sections and optimized navigation
2. WHEN viewing department breakdowns on mobile THEN the system SHALL use cards or accordions to organize information efficiently
3. WHEN viewing daily work history on mobile THEN the system SHALL provide a mobile-friendly calendar with touch-optimized day selection
4. WHEN viewing tips details on mobile THEN the system SHALL use expandable lists and clear visual hierarchy
5. WHEN navigating between different views THEN the system SHALL maintain context and provide easy back navigation
6. WHEN displaying tables on mobile THEN the system SHALL use responsive design or alternative layouts for better readability
7. WHEN loading detailed data THEN the system SHALL provide loading states and progressive disclosure to maintain performance

### Requirement 7: Export and Documentation Features

**User Story:** As an employee, I want to export my detailed payroll information and access explanations of calculations, so that I can keep personal records and understand how my pay is determined.

#### Acceptance Criteria

1. WHEN exporting payroll details THEN the system SHALL include all department breakdowns, daily work history, and tips information
2. WHEN generating exports THEN the system SHALL provide multiple formats (PDF for paystubs, CSV for data analysis)
3. WHEN viewing calculation explanations THEN the system SHALL provide tooltips or help sections explaining how each component is calculated
4. WHEN accessing help information THEN the system SHALL explain department rate applications, tip distribution formulas, and bonus calculations
5. WHEN printing payroll information THEN the system SHALL provide print-friendly layouts with all essential details
6. WHEN saving personal records THEN the system SHALL allow employees to download historical data for their own record-keeping
7. WHEN viewing complex calculations THEN the system SHALL provide step-by-step breakdowns showing how final amounts were determined

### Requirement 8: Data Accuracy and Validation

**User Story:** As an employee, I want to verify that my payroll calculations are accurate and report any discrepancies, so that I can ensure I'm being paid correctly.

#### Acceptance Criteria

1. WHEN viewing payroll details THEN the system SHALL provide audit trails showing which logs contributed to each pay component
2. WHEN calculations seem incorrect THEN the system SHALL provide links to the original captain logs and commission entries
3. WHEN viewing department hours THEN the system SHALL show which specific log entries contributed hours to each department
4. WHEN tips don't match expectations THEN the system SHALL show the original job entries and tip distribution calculations
5. WHEN bonuses are applied THEN the system SHALL show the labor efficiency calculations and goal comparisons that generated bonuses
6. WHEN discrepancies are found THEN the system SHALL provide a way to flag issues or contact management for review
7. WHEN viewing historical changes THEN the system SHALL show if any payroll data was corrected after initial calculation and who made changes
