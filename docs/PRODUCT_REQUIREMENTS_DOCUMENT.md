# HUNKCentral Workforce Management System - Product Requirements Document (PRD)

## Executive Summary

### Product Overview
HUNKCentral is a comprehensive workforce management platform designed specifically for College Hunks Hauling Junk & Moving. This system replaces existing paper logs and Excel spreadsheets with a modern, integrated digital platform that handles all aspects of workforce operations, from daily job reporting to payroll processing and performance analytics.

### Business Objectives
- **Operational Efficiency**: Reduce administrative overhead by 75% through automation and optimization
- **Data Accuracy**: Eliminate 90% of data entry errors through improved validation and workflows
- **User Experience**: Achieve 95% user adoption with 4.5/5 satisfaction rating
- **Performance Management**: Drive employee motivation through competitive performance rankings
- **Mobile Optimization**: Enable 100% mobile functionality for field operations

### Success Metrics
- Dashboard load time: < 500ms (vs. current 6+ seconds)
- Captain log submission: < 90 seconds (vs. current 5+ minutes)
- Manager review time: < 20 seconds per log (vs. current 2+ minutes)
- Data entry error reduction: 90%
- User adoption rate: 95% within 30 days

## Product Vision and Strategy

### Vision Statement
To create the most efficient, user-friendly, and comprehensive workforce management system in the moving and junk removal industry, empowering College Hunks to optimize operations, motivate employees, and scale business growth through data-driven insights and modern technology.

### Strategic Goals
1. **Eliminate Operational Inefficiencies**: Replace slow, error-prone manual processes with fast, automated workflows
2. **Enhance User Experience**: Provide role-specific, intuitive interfaces that users enjoy using
3. **Drive Performance**: Use gamification and analytics to motivate continuous improvement
4. **Enable Scalability**: Build a foundation that supports business growth and expansion
5. **Ensure Data Integrity**: Maintain accurate, consistent data across all business operations

## Target Users and Personas

### Primary Users

#### Captains (Team Leaders)
- **Role**: Lead field teams and submit daily work reports
- **Usage Pattern**: Access from home after work to submit daily logs
- **Key Needs**: Fast log submission, performance tracking, payroll visibility
- **Pain Points**: Complex forms, slow systems, unclear calculations
- **Success Criteria**: Complete log submission in under 90 seconds

#### Managers (Operations Supervisors)
- **Role**: Review and approve team work, manage operations
- **Usage Pattern**: Throughout workday for approvals and team management
- **Key Needs**: Efficient approval workflows, team analytics, exception handling
- **Pain Points**: Time-consuming reviews, lack of team visibility, manual corrections
- **Success Criteria**: Review and approve logs in under 20 seconds each

#### Sales Consultants
- **Role**: Book jobs and track commission earnings
- **Usage Pattern**: Daily commission entry and status tracking
- **Key Needs**: Simple commission entry, automatic job matching, earnings visibility
- **Pain Points**: Manual tracking, unclear commission status, delayed payments
- **Success Criteria**: Commission entry in under 30 seconds with automatic matching

#### Wingmen (Team Members)
- **Role**: Support captains and track personal performance
- **Usage Pattern**: Periodic access for payroll and performance review
- **Key Needs**: Payroll visibility, performance rankings, career development insights
- **Pain Points**: Limited visibility into earnings and performance
- **Success Criteria**: Easy access to personal data and performance metrics

#### System Administrators
- **Role**: Manage users, system settings, and payroll processing
- **Usage Pattern**: Daily system management and periodic payroll processing
- **Key Needs**: User management, system health monitoring, comprehensive reporting
- **Pain Points**: Complex user setup, limited system visibility, manual payroll processes
- **Success Criteria**: Efficient user management and automated payroll processing

## Functional Requirements

### Core System Requirements

#### 1. Authentication and User Management
- **NextAuth.js Integration**: Secure authentication with credentials provider
- **Role-Based Access Control**: Five primary roles with granular permissions
- **User Profile Management**: Comprehensive user creation, editing, and deactivation
- **Permission System**: Granular permissions beyond basic role assignments
- **Location Access Control**: Multi-location support with location-specific permissions
- **Theme Preferences**: Light/dark/system theme support with persistent preferences

#### 2. Daily Operations Management

##### Captain Log Creation System
- **Multi-Section Forms**: Separate sections for Junk jobs, Move jobs, and Other hours
- **Dynamic Job Entry**: Unlimited jobs per section with client names, job IDs, revenue, tips
- **Employee Hour Tracking**: Team member hours by department with co-captain designations
- **Real-Time Calculations**: Live labor costs, tips per HUNK, percentages, and bonuses
- **Input Validation**: Job IDs must be 7-10 digit numbers, currency fields without pre-filled zeros
- **Mobile Optimization**: Touch-friendly interfaces with appropriate keyboard types
- **Auto-Save Capability**: Manual save with clear confirmation (no automatic save)

##### Manager Review and Approval
- **Approval Queue**: Prioritized pending logs with key metrics visible
- **Bulk Operations**: Batch approval with multi-select capabilities
- **Inline Editing**: Quick corrections without separate forms
- **Side-by-Side Comparison**: Compare with expected values and historical data
- **Exception Alerts**: Automatic anomaly detection with suggested corrections
- **Audit Trail**: Complete tracking of all review and approval activities

#### 3. Commission and Sales Management

##### Commission Tracking System
- **Simple Entry Forms**: Client name, job ID, estimated amount, target date, job type
- **Automatic Matching**: Fuzzy matching algorithms for job ID connections
- **Status Progression**: Pending → Matched → Approved workflow
- **Conflict Resolution**: Handle duplicate job IDs with guided resolution
- **Performance Analytics**: Booking accuracy and conversion rate tracking
- **Earnings Projections**: Real-time commission calculations and forecasts

#### 4. Payroll and Compensation Management

##### Mixed Compensation Model
- **Hourly Rates**: Nine department-specific rates with role-based application
- **Salary Options**: Base (replaces hourly), guaranteed (minimum), supplemental (additional)
- **Commission Rates**: Percentage-based on actual job revenue
- **Labor Bonuses**: Automatic calculation for efficiency goals (14% Junk, 24% Move)
- **Tip Distribution**: Equal division among team members per job section

##### Payroll Processing
- **Individual Reports**: Detailed compensation breakdowns for all employees
- **Team Reports**: Manager/admin views with filtering and grouping
- **Export Capabilities**: ADP-compatible files, Excel, CSV, PDF formats
- **Historical Access**: Previous pay periods with trend analysis
- **Calculation Engine**: Automated processing of all compensation components

#### 5. Performance Analytics and Rankings

##### Competitive Performance System
- **Anonymous Rankings**: Performance comparisons without payroll exposure
- **Multiple Categories**: Revenue, efficiency, productivity, and tip metrics
- **Privacy Protection**: Anonymous identifiers (Captain A, HUNK-001)
- **Gamification**: Friendly competition elements to drive improvement
- **Historical Trends**: Performance tracking over time with visual indicators

##### Ranking Categories
- **Revenue Metrics**: Total, junk, move revenue; average job size
- **Efficiency Metrics**: Labor cost percentages, tips per job, revenue per hour
- **Productivity Metrics**: Job counts by category, hours worked efficiency
- **Team Leadership**: Captain-specific performance indicators

#### 6. Administrative Functions

##### User Management
- **Comprehensive CRUD**: Create, read, update, delete user accounts
- **Bulk Operations**: Import/export, mass updates, template copying
- **Permission Management**: Granular permission assignment and auditing
- **Location Assignment**: Multi-location access control
- **Activity Monitoring**: User login tracking and activity analytics

##### Pay Period Management
- **Workflow States**: Open (editable) → Locked (no changes) → Closed (final)
- **Data Integrity**: Prevent modifications during locked periods
- **Historical Access**: Maintain access to closed period data
- **Validation Systems**: Comprehensive checks before status transitions

##### System Administration
- **Audit Trail**: Complete change logging with before/after values
- **System Health**: Performance monitoring and alerting
- **Data Management**: Backup, recovery, and maintenance procedures
- **Security Monitoring**: Access auditing and security alerts

### Data Management Requirements

#### Database Schema
- **User Model**: Authentication, roles, permissions, compensation settings, theme preferences
- **DailyLog Model**: Captain logs with approval workflow and pre-computed totals
- **LogJob Model**: Individual jobs with type-specific fields and validation
- **LogHour Model**: Employee hours by department with co-captain tracking
- **CommissionEntry Model**: Sales tracking with automatic matching capabilities
- **PayPeriod Model**: Payroll period management with workflow controls
- **PrecomputedMetrics Model**: Performance optimization through cached calculations
- **AuditLog Model**: Change tracking for compliance and debugging

#### Performance Optimization
- **Pre-Computed Metrics**: Background jobs for dashboard data calculation
- **Optimized Queries**: Single queries with joins instead of sequential queries
- **Intelligent Caching**: Smart cache invalidation and refresh strategies
- **Database Indexing**: Proper indexing for common query patterns
- **Background Processing**: Asynchronous heavy calculations

### User Interface Requirements

#### Design System
- **Shadcn/UI Blocks**: Use dashboard-01, login-02, sidebar-07 blocks where available
- **New York Theme**: Professional, modern aesthetic with consistent typography
- **Brand Integration**: College Hunks colors (#026937 green, #ea7200 orange)
- **Theme Support**: Light/dark/system themes with smooth transitions
- **Responsive Design**: Mobile-first approach with touch optimization

#### Universal Data Interaction
- **Comprehensive Search**: Global search across all data with intelligent matching
- **Advanced Filtering**: Date ranges, number ranges, multi-select, quick filters
- **Sorting Capabilities**: Multi-column sorting with visual indicators
- **Export Functionality**: Excel, CSV, PDF exports for all data
- **Bulk Operations**: Multi-select with batch actions

#### Role-Specific Dashboards
- **Captain Dashboard**: Job statistics, labor cost %, revenue, tips, bonuses, rankings
- **Manager Dashboard**: Pending approvals, team performance, alerts, analytics
- **Sales Dashboard**: Commission tracking, pipeline, performance targets
- **Admin Dashboard**: System health, user activity, administrative tasks
- **Wingman Dashboard**: Personal payroll, performance rankings, schedule info

### Mobile Requirements

#### Mobile-First Design
- **Touch Optimization**: Large touch targets (minimum 44px), gesture support
- **Input Methods**: Context-appropriate keyboards and input types
- **Navigation**: Bottom navigation, slide-out panels, thumb-friendly design
- **Performance**: Optimized for mobile networks and devices
- **Cross-Browser**: Consistent functionality across iOS Safari, Chrome, others

#### Progressive Web App Features
- **Offline Capability**: Critical functions work without internet
- **Installation**: App manifest for home screen installation
- **Push Notifications**: Important alerts and updates
- **Background Sync**: Data synchronization when connection restored

## Technical Requirements

### Technology Stack
- **Framework**: Next.js 15 with App Router and TypeScript strict mode
- **UI Library**: Shadcn/ui with New York theme (blocks prioritized)
- **Styling**: Tailwind CSS v4 with custom brand colors
- **Database**: Supabase-hosted PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Forms**: React Hook Form + Zod validation (mandatory)
- **State Management**: Zustand (minimal usage, prefer server state)
- **Deployment**: Vercel with automated CI/CD

### Performance Requirements
- **Page Load Time**: < 500ms for all pages
- **Dashboard Metrics**: Instant loading from pre-computed cache
- **Form Submission**: < 300ms response time
- **Export Generation**: < 5 seconds for standard reports
- **Database Queries**: < 100ms average response time
- **Concurrent Users**: Support 100+ simultaneous users

### Security Requirements
- **Authentication**: Secure session management with appropriate timeouts
- **Authorization**: Role-based access control with granular permissions
- **Data Protection**: Encryption at rest and in transit
- **Input Validation**: Comprehensive server-side validation for all inputs
- **Audit Trail**: Complete logging of all system changes
- **Privacy Protection**: Anonymous performance rankings protect payroll data

### Quality Requirements
- **Code Quality**: TypeScript strict mode, no `any` types allowed
- **Testing**: 80% code coverage for business logic, comprehensive test suite
- **Linting**: ESLint compliance with zero warnings
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Browser Support**: Modern browsers with mobile optimization
- **Documentation**: Comprehensive code and user documentation

## Business Logic and Rules

### Payroll Calculation Rules
- **Labor Cost Calculation**: Sum of (hours × rate) for all employees
- **Rate Application**: Wingman rate default, captain rate for captains/co-captains
- **Labor Percentage**: Labor cost ÷ revenue × 100
- **Bonus Calculation**: max((goal% - actual%), 0) × revenue (captains only)
- **Tip Distribution**: Equal division among team members per section
- **Mixed Compensation**: Combine hourly, salary, commission, and bonuses appropriately

### Commission Matching Rules
- **Automatic Matching**: Match commission entries to completed jobs via job ID
- **Conflict Resolution**: Handle duplicate job IDs with manual resolution workflow
- **Status Progression**: Pending → Matched (on log approval) → Approved (on payroll)
- **Commission Calculation**: Actual revenue × commission rate percentage
- **Booking Accuracy**: Track estimated vs. actual revenue for performance metrics

### Performance Ranking Rules
- **Data Source**: Only approved daily log data used for rankings
- **Privacy Protection**: No dollar amounts exposed, use ratios and percentages
- **Anonymous Identifiers**: Protect individual identity while enabling competition
- **Ranking Categories**: Revenue, efficiency, productivity based on log data only
- **Update Frequency**: Rankings updated after each pay period close

### Validation Rules
- **Job IDs**: Must be numeric, 7-10 digits long, unique across commission entries
- **Revenue**: Minimum $1.00, maximum $10,000,000 per job
- **Tips**: Minimum $0.00, no maximum limit
- **Hours**: Maximum 24 hours per employee per day
- **Required Fields**: Job type, client name, job ID, revenue for all jobs

## Integration Requirements

### External System Integration
- **ADP Payroll**: Export payroll data in ADP-compatible format
- **Email System**: Automated notifications and report distribution
- **File Storage**: Secure document and report storage
- **Backup Systems**: Automated backup and disaster recovery

### API Requirements
- **RESTful APIs**: Standard REST endpoints for all data operations
- **Authentication**: Secure API authentication with proper authorization
- **Rate Limiting**: Prevent abuse with appropriate rate limits
- **Documentation**: Comprehensive API documentation for future integrations

## Compliance and Audit Requirements

### Data Compliance
- **Audit Trail**: Complete logging of all data changes with user attribution
- **Data Retention**: Appropriate retention policies for different data types
- **Privacy Protection**: Ensure payroll privacy while enabling performance features
- **Backup and Recovery**: Regular backups with tested recovery procedures

### Security Compliance
- **Access Control**: Strict role-based access with regular audits
- **Data Encryption**: Encrypt sensitive data at rest and in transit
- **Session Management**: Secure session handling with appropriate timeouts
- **Vulnerability Management**: Regular security assessments and updates

## Success Criteria and Metrics

### Performance Metrics
- **Dashboard Load Time**: < 500ms (target: 75% improvement)
- **Query Optimization**: Eliminate 90% of sequential database queries
- **Form Response Time**: < 300ms for all form submissions
- **Export Generation**: < 5 seconds for standard reports
- **System Uptime**: 99.9% availability during business hours

### User Experience Metrics
- **Task Completion Time**: Captain logs < 90 seconds, manager reviews < 20 seconds
- **User Adoption Rate**: 95% within 30 days of deployment
- **User Satisfaction**: 4.5/5 rating (vs. current 2.1/5)
- **Error Rate**: 90% reduction in data entry errors
- **Mobile Usage**: 100% functionality on mobile devices

### Business Impact Metrics
- **Administrative Efficiency**: 75% reduction in administrative task time
- **Data Accuracy**: 90% reduction in payroll errors
- **Employee Engagement**: Measurable improvement through performance rankings
- **Operational Scalability**: System supports 2x current user load without degradation

## Risk Assessment and Mitigation

### Technical Risks
- **Data Migration**: Risk of data loss during transition
  - Mitigation: Comprehensive backup and parallel system operation
- **Performance Issues**: Risk of slow performance under load
  - Mitigation: Pre-computed metrics and thorough load testing
- **Integration Failures**: Risk of external system integration problems
  - Mitigation: Robust error handling and fallback procedures

### Business Risks
- **User Adoption**: Risk of low user adoption due to change resistance
  - Mitigation: Comprehensive training and gradual rollout
- **Data Accuracy**: Risk of calculation errors affecting payroll
  - Mitigation: Extensive testing and validation of all business logic
- **Operational Disruption**: Risk of business disruption during transition
  - Mitigation: Parallel system operation and rollback capabilities

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-4)
- Project setup, database design, authentication, basic navigation
- **Deliverables**: Working authentication, basic dashboard structure
- **Success Criteria**: Users can log in and see role-appropriate interfaces

### Phase 2: Core Operations (Weeks 5-8)
- Log creation, manager review, commission tracking
- **Deliverables**: Complete log workflow from creation to approval
- **Success Criteria**: End-to-end log processing with real-time calculations

### Phase 3: Advanced Features (Weeks 9-12)
- Payroll processing, performance rankings, user management
- **Deliverables**: Complete payroll system with performance analytics
- **Success Criteria**: Full payroll processing and competitive rankings

### Phase 4: Optimization and Deployment (Weeks 13-16)
- Performance optimization, testing, data migration, production deployment
- **Deliverables**: Production-ready system with migrated data
- **Success Criteria**: System meets all performance targets with complete data migration

## Conclusion

HUNKCentral represents a comprehensive solution to College Hunks' workforce management challenges. By combining modern technology, user-centric design, and robust business logic, the system will transform operations, improve user satisfaction, and provide a competitive advantage through performance analytics and operational efficiency.

The detailed requirements outlined in this PRD ensure that all stakeholders understand the system's capabilities, technical implementation, and expected business impact. The phased implementation approach minimizes risk while delivering value incrementally, ensuring a successful transition to the new system.