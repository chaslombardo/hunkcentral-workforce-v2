# HunkCentral Create Log Page & Payroll System

## Create Log Page Overview

The create log page is a sophisticated multi-section form that allows captains to record their daily work activities, jobs, and team hours. It features real-time calculations, dynamic section management, and comprehensive validation.

### Page Structure

#### 1. Header Section

- **Captain Selection**: Dropdown to select the captain (defaults to current user)
- **Log Date**: Date picker for the work day
- **Section Toggles**: Checkboxes to enable/disable Junk Jobs, Move Jobs, and Other Hours sections

#### 2. Main Log Sections (Tabbed Interface)

The form uses a tabbed interface with three main sections:

**Junk Jobs Tab**

- Job entry forms for junk removal work
- Team hours tracking for junk department
- Real-time labor cost calculations
- Disposal cost tracking (section-level)

**Move Jobs Tab**

- Job entry forms for moving work
- Team hours tracking for move department
- Upsell tracking (junk on move, valuation, materials)
- Real-time labor cost calculations

**Other Hours Tab**

- General hours tracking for non-job-specific work
- Multiple department options (Training, Estimating, Warehouse, Admin, Zigma)
- Flexible employee assignment

### Dynamic Job Management

#### Job Tiles

Each job is represented by an expandable card (JobTile) containing:

```typescript
// Job Fields
- jobId: string (unique identifier)
- clientName: string
- revenue: number (required)
- tips: number

// Move-specific fields
- junkOnMove: number (upsell)
- valuation: number (upsell)
- materials: number (upsell)
```

**Features:**

- **Add/Remove Jobs**: Unlimited job entries per section
- **Collapsible Interface**: Expand/collapse individual jobs
- **Validation**: Real-time form validation with error highlighting
- **Auto-calculation**: Revenue and tip totals update instantly

### Team Hours Management

#### Employee Hour Tracking

Each section has its own team hours component with:

```typescript
// Hour Entry Fields
- employeeId: string (dropdown selection)
- department: Department (auto-set based on section)
- hours: number (decimal precision)
- isCoCaptain: boolean (affects pay rate)
```

**Features:**

- **Employee Dropdown**: Select from all active employees
- **Department Auto-Assignment**: Junk section = junk department, etc.
- **Co-Captain Toggle**: Checkbox to apply captain rates
- **Accordion Interface**: Expandable employee entries
- **Real-time Rate Application**: Instant labor cost calculations

### Real-Time Calculations

#### Section Summary Cards

Each section displays live calculations:

```typescript
interface SectionCalculation {
  totalRevenue: number;
  totalTips: number;
  totalLaborCost: number;
  laborCostPercentage: number;
  tipsPerHunk: number;
  totalHours: number;
  employeeCount: number;
  isUnderGoal: boolean;
  goal: number; // 14% for junk, 24% for moves
}
```

**Visual Indicators:**

- **Progress Bars**: Labor cost percentage vs. goal
- **Color-Coded Badges**: Green for under goal, red for over goal
- **Tips Per HUNK**: Equal distribution calculation
- **Employee Summary**: Hours and rates per person

#### Overall Totals Card

Comprehensive summary showing:

- Total revenue across all sections
- Total tips and distribution
- Total labor costs and percentages
- Bonus eligibility indicators
- Employee participation summary

## Employee Rate System (9 Department Rates)

### Rate Structure

Each employee has up to 9 different hourly rates stored in the database:

```typescript
// Department-specific rates
rateJunkCaptain: Decimal; // Captain rate for junk work
rateJunkWingman: Decimal; // Wingman rate for junk work
rateMoveCaptain: Decimal; // Captain rate for moving work
rateMoveWingman: Decimal; // Wingman rate for moving work
rateZigma: Decimal; // Zigma department rate
rateTraining: Decimal; // Training department rate
rateEstimating: Decimal; // Estimating department rate
rateWarehouse: Decimal; // Warehouse department rate
rateAdmin: Decimal; // Administrative work rate
```

### Rate Application Logic

```typescript
function calculateHourlyWage(
  user: User,
  department: Department,
  isCoCaptain: boolean
): number {
  const usesCaptainRate = user.roles.includes('captain') || isCoCaptain;

  switch (department) {
    case 'junk':
      return usesCaptainRate ? user.rateJunkCaptain : user.rateJunkWingman;
    case 'move':
      return usesCaptainRate ? user.rateMoveCaptain : user.rateMoveWingman;
    case 'zigma':
      return user.rateZigma;
    // ... other departments use single rates
  }
}
```

**Rate Selection Rules:**

1. **Captain Role**: Always uses captain rates for junk/move departments
2. **Co-Captain Flag**: Non-captains can get captain rates when designated as co-captain
3. **Single Rates**: Zigma, Training, Estimating, Warehouse, Admin have one rate per employee
4. **Fallback**: Missing rates default to 0 (validation should prevent this)

## Comprehensive Payroll System

### Mixed Compensation Model

Employees can have combinations of all compensation types:

#### 1. Hourly Wages

- Based on hours worked and department-specific rates
- Calculated per hour entry with appropriate rate application
- Supports co-captain rate upgrades

#### 2. Salary Options

```typescript
// Salary configuration
salaryAmount: Decimal; // Dollar amount
salaryFrequency: string; // 'weekly', 'bi-weekly', 'monthly'
salaryType: string; // 'base', 'guaranteed', 'supplemental'
```

**Salary Types:**

- **Base**: Replaces hourly wages entirely
- **Guaranteed**: Minimum pay (uses whichever is higher: salary or hourly+other)
- **Supplemental**: Added on top of all other earnings

#### 3. Commission System

```typescript
commissionRate: Decimal; // Percentage rate (e.g., 5.00 = 5%)
```

- Applied to actual job revenue (not estimated)
- Tracked through commission entries
- Matched to completed jobs via intelligent matching system

#### 4. Labor Bonuses

```typescript
junkBonusGoal: Decimal; // Default 0.14 (14%)
moveBonusGoal: Decimal; // Default 0.24 (24%)
```

- **Captain-only benefit**
- Earned when labor cost percentage is under goal
- Formula: `(goalPercent - actualPercent) × revenue`
- Calculated per section (junk and move separately)

### Payroll Calculation Process

#### Step 1: Hour-by-Hour Calculation

```typescript
for (const hour of employeeHours) {
  const rate = calculateHourlyWage(user, hour.department, hour.isCoCaptain);
  hourlyWages += hour.hours * rate;
}
```

#### Step 2: Tip Distribution

```typescript
// Equal distribution within each section
const tipsPerHunk = sectionTips / numberOfEmployeesInSection;
```

#### Step 3: Commission Calculation

```typescript
const commissionAmount = actualRevenue * (commissionRate / 100);
```

#### Step 4: Labor Bonus Calculation

```typescript
if (actualLaborPercent < goalPercent && user.roles.includes('captain')) {
  bonus = (goalPercent - actualLaborPercent) * sectionRevenue;
}
```

#### Step 5: Salary Rule Application

```typescript
function applySalaryRules(user, hourlyWages, tips, commission, bonuses) {
  const totalBeforeSalary = hourlyWages + tips + commission + bonuses;

  switch (user.salaryType) {
    case 'base':
      return weeklySalaryAmount; // Ignore hourly wages
    case 'guaranteed':
      return Math.max(totalBeforeSalary, weeklySalaryAmount);
    case 'supplemental':
      return totalBeforeSalary + weeklySalaryAmount;
    default:
      return totalBeforeSalary; // No salary
  }
}
```

### Payroll Features

#### Real-Time Validation

- **Rate Verification**: Ensures all employees have rates for worked departments
- **Hour Validation**: Prevents negative hours or excessive entries
- **Revenue Matching**: Validates revenue against historical patterns

#### Comprehensive Reporting

- **Individual Breakdowns**: Detailed pay calculation per employee
- **Department Analysis**: Labor costs and efficiency by department
- **Commission Tracking**: Booking accuracy and payment status
- **Bonus Summaries**: Captain performance and bonus eligibility

#### Audit Trail

- **Complete History**: Every payroll calculation is logged
- **Change Tracking**: All modifications recorded with timestamps
- **Approval Workflow**: Manager review and approval required

This system handles the complexity of mixed compensation while maintaining accuracy and providing transparency for both employees and management.

## Form State Management & User Experience

### Auto-Save Functionality

- **Draft Saving**: Form automatically saves as draft every 30 seconds
- **Manual Save**: "Save Draft" button for immediate saving
- **Offline Support**: Local storage backup when connection is lost
- **Recovery**: Automatic recovery of unsaved changes on page reload

### Real-Time Updates

- **Live Calculations**: All totals update instantly as data is entered
- **Validation Feedback**: Immediate error highlighting and messages
- **Progress Indicators**: Visual feedback for completion status
- **Rate Display**: Shows applied rates next to employee selections

### Mobile Optimization

- **Touch-Friendly**: Large touch targets for mobile devices
- **Responsive Layout**: Adapts to different screen sizes
- **Swipe Navigation**: Tab switching via swipe gestures
- **Keyboard Optimization**: Numeric keyboards for number inputs

### Data Validation

- **Required Fields**: Job ID, client name, revenue are mandatory
- **Range Validation**: Hours must be positive, revenue must be reasonable
- **Duplicate Prevention**: Warns about duplicate job IDs
- **Employee Conflicts**: Prevents double-booking employees in same time slot

## Integration Points

### Employee Management Integration

- **Live Employee Data**: Pulls current employee list with all rate information
- **Role-Based Rates**: Automatically applies correct rates based on employee roles
- **Department Assignments**: Validates employee can work in selected departments
- **Status Checking**: Only shows active employees in dropdowns

### Commission System Integration

- **Job ID Matching**: Creates linkage points for commission matching
- **Revenue Tracking**: Provides actual revenue for commission calculations
- **Client Name Standardization**: Helps with fuzzy matching algorithms
- **Date Correlation**: Enables time-based commission matching

### Payroll System Integration

- **Approved Log Processing**: Only approved logs contribute to payroll
- **Rate Application**: Uses employee's current rates at time of log creation
- **Department Tracking**: Maintains department-level hour tracking
- **Bonus Calculations**: Provides data for labor efficiency bonus calculations

This comprehensive system ensures accurate payroll processing while providing an intuitive user experience for daily log creation and management.
