# Design Document

## Overview

The Employee Payroll Breakdown enhancement transforms the existing "My Payroll" page from a simple summary view into a comprehensive self-service portal. The design leverages the existing payroll calculation logic while adding detailed breakdowns, interactive visualizations, and mobile-optimized interfaces. The enhancement maintains the current shadcn/ui design system and College Hunks branding while significantly expanding functionality.

## Architecture

### Component Architecture

The design extends the existing `MyPayrollView` component with new sub-components organized in a modular structure:

```
components/features/reports/
├── my-payroll-view.tsx (enhanced)
├── payroll-breakdown/
│   ├── department-breakdown.tsx
│   ├── daily-work-calendar.tsx
│   ├── tips-detail-view.tsx
│   ├── rate-information-panel.tsx
│   └── payroll-export-dialog.tsx
└── shared/
    ├── payroll-calculation-tooltip.tsx
    └── audit-trail-link.tsx
```

### Data Flow Architecture

The design maintains the existing server-side data fetching pattern while adding new data aggregation layers:

1. **Server Actions**: Enhanced payroll queries that include detailed breakdowns
2. **Data Aggregation**: Client-side processing for interactive features
3. **State Management**: Local state for UI interactions, server state for data
4. **Export Generation**: Server-side PDF/CSV generation with detailed data

### Database Query Enhancements

The design requires enhanced database queries to support detailed breakdowns:

```sql
-- Department breakdown query
SELECT 
  lh.department,
  SUM(lh.hours) as total_hours,
  u.hourly_rates[lh.department] as rate,
  SUM(lh.hours * u.hourly_rates[lh.department]) as gross_pay
FROM log_hours lh
JOIN users u ON lh.user_id = u.id
WHERE lh.user_id = ? AND log_date BETWEEN ? AND ?
GROUP BY lh.department, u.hourly_rates[lh.department]

-- Daily work history query
SELECT 
  dl.log_date,
  lh.department,
  lh.hours,
  COALESCE(SUM(lj.tips), 0) as daily_tips
FROM daily_logs dl
JOIN log_hours lh ON dl.id = lh.daily_log_id
LEFT JOIN log_jobs lj ON dl.id = lj.daily_log_id
WHERE lh.user_id = ? AND dl.log_date BETWEEN ? AND ?
GROUP BY dl.log_date, lh.department, lh.hours
ORDER BY dl.log_date DESC
```

## Components and Interfaces

### Enhanced MyPayrollView Component

The main component is restructured with a new tabbed interface:

```typescript
interface EnhancedPayrollData extends PayrollCalculation {
  departmentBreakdown: DepartmentBreakdown[];
  dailyWorkHistory: DailyWorkEntry[];
  tipsDetails: TipEntry[];
  rateInformation: RateInfo;
  auditTrail: AuditEntry[];
}

interface DepartmentBreakdown {
  department: Department;
  hours: number;
  rate: number;
  grossPay: number;
  percentage: number;
  isPrimary: boolean;
}

interface DailyWorkEntry {
  date: Date;
  departments: {
    department: Department;
    hours: number;
    rate: number;
  }[];
  tips: number;
  logIds: string[];
  role: 'captain' | 'co-captain' | 'wingman';
}

interface TipEntry {
  date: Date;
  jobId: string;
  clientName: string;
  totalJobTips: number;
  teamMembers: number;
  myShare: number;
  jobType: 'junk' | 'move';
  logId: string;
}
```

### Department Breakdown Component

A comprehensive department analysis component using shadcn/ui cards and progress indicators:

```typescript
export function DepartmentBreakdown({ 
  departments, 
  totalHours, 
  totalPay 
}: DepartmentBreakdownProps) {
  return (
    <div className="space-y-4">
      {departments.map((dept) => (
        <Card key={dept.department} className={dept.isPrimary ? 'border-[#026937]' : ''}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="capitalize flex items-center gap-2">
                {dept.department}
                {dept.isPrimary && <Badge className="bg-[#026937]">Primary</Badge>}
              </CardTitle>
              <div className="text-right">
                <div className="font-mono text-lg">{formatCurrency(dept.grossPay)}</div>
                <div className="text-sm text-muted-foreground">
                  {dept.hours}h @ {formatCurrency(dept.rate)}/hr
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Percentage of Total Hours:</span>
                <span>{dept.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={dept.percentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Daily Work Calendar Component

An interactive calendar component showing work patterns:

```typescript
export function DailyWorkCalendar({ 
  workEntries, 
  selectedDate, 
  onDateSelect 
}: DailyWorkCalendarProps) {
  return (
    <div className="space-y-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        modifiers={{
          workDay: workEntries.map(entry => entry.date),
          highTips: workEntries.filter(entry => entry.tips > 50).map(entry => entry.date)
        }}
        modifiersStyles={{
          workDay: { backgroundColor: '#026937', color: 'white' },
          highTips: { backgroundColor: '#ea7200', color: 'white' }
        }}
      />
      
      {selectedDate && (
        <DailyWorkDetail 
          entry={workEntries.find(e => isSameDay(e.date, selectedDate))}
        />
      )}
    </div>
  );
}
```

### Tips Detail View Component

A comprehensive tips tracking interface:

```typescript
export function TipsDetailView({ tips, totalTips }: TipsDetailViewProps) {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [filterBy, setFilterBy] = useState<'all' | 'junk' | 'move'>('all');
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Tips Breakdown</h3>
          <p className="text-muted-foreground">
            Total: {formatCurrency(totalTips)} from {tips.length} jobs
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">By Date</SelectItem>
              <SelectItem value="amount">By Amount</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="junk">Junk Only</SelectItem>
              <SelectItem value="move">Move Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        {filteredAndSortedTips.map((tip) => (
          <Card key={`${tip.logId}-${tip.jobId}`}>
            <CardContent className="pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{tip.clientName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(tip.date)} • Job #{tip.jobId} • {tip.jobType}
                  </div>
                  <div className="text-sm">
                    Split {formatCurrency(tip.totalJobTips)} among {tip.teamMembers} team members
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg">{formatCurrency(tip.myShare)}</div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/logs/${tip.logId}`}>
                      View Log
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Data Models

### Enhanced Payroll Calculation

The existing `PayrollCalculation` type is extended with detailed breakdown data:

```typescript
interface EnhancedPayrollCalculation extends PayrollCalculation {
  departmentBreakdown: {
    [key in Department]: {
      hours: number;
      rate: number;
      grossPay: number;
      percentage: number;
    };
  };
  dailyBreakdown: {
    [date: string]: {
      departments: { [key in Department]: number };
      tips: number;
      totalHours: number;
    };
  };
  tipsBreakdown: TipEntry[];
  rateSchedule: {
    [key in Department]: {
      captainRate?: number;
      wingmanRate?: number;
      currentRate: number;
    };
  };
}
```

### Database Schema Enhancements

No new tables are required, but enhanced queries and indexes are needed:

```sql
-- Index for efficient payroll queries
CREATE INDEX idx_log_hours_user_date ON log_hours(user_id, created_at);
CREATE INDEX idx_daily_logs_date_status ON daily_logs(log_date, status);

-- View for department summary
CREATE VIEW employee_department_summary AS
SELECT 
  lh.user_id,
  dl.log_date,
  lh.department,
  SUM(lh.hours) as hours,
  AVG(CASE WHEN lh.department = 'junk' THEN 
    CASE WHEN lh.user_id = dl.captain_id OR lh.is_co_captain THEN u.junk_captain_rate 
    ELSE u.junk_wingman_rate END
  WHEN lh.department = 'move' THEN
    CASE WHEN lh.user_id = dl.captain_id OR lh.is_co_captain THEN u.move_captain_rate 
    ELSE u.move_wingman_rate END
  ELSE u.admin_rate END) as effective_rate
FROM log_hours lh
JOIN daily_logs dl ON lh.daily_log_id = dl.id
JOIN users u ON lh.user_id = u.id
WHERE dl.status = 'approved'
GROUP BY lh.user_id, dl.log_date, lh.department;
```

## Error Handling

### Data Validation

The design includes comprehensive validation for payroll calculations:

```typescript
function validatePayrollBreakdown(data: EnhancedPayrollCalculation): ValidationResult {
  const errors: string[] = [];
  
  // Validate department totals match overall totals
  const departmentHoursSum = Object.values(data.departmentBreakdown)
    .reduce((sum, dept) => sum + dept.hours, 0);
  
  if (Math.abs(departmentHoursSum - data.totalHours) > 0.01) {
    errors.push('Department hours do not match total hours');
  }
  
  // Validate tips breakdown matches total tips
  const tipsSum = data.tipsBreakdown.reduce((sum, tip) => sum + tip.myShare, 0);
  if (Math.abs(tipsSum - data.tips) > 0.01) {
    errors.push('Tips breakdown does not match total tips');
  }
  
  return { isValid: errors.length === 0, errors };
}
```

### Error Recovery

The design includes graceful degradation when detailed data is unavailable:

```typescript
function PayrollBreakdownWithFallback({ userId, payPeriod }: Props) {
  const { data, error, isLoading } = usePayrollBreakdown(userId, payPeriod);
  
  if (error) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Detailed breakdown unavailable</p>
              <p className="text-yellow-700 text-sm">
                Showing summary totals only. Contact support if this persists.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <PayrollBreakdownView data={data} />;
}
```

## Testing Strategy

### Unit Testing

Each component requires comprehensive unit tests:

```typescript
describe('DepartmentBreakdown', () => {
  it('should highlight primary department', () => {
    const departments = [
      { department: 'junk', hours: 30, isPrimary: true, /* ... */ },
      { department: 'move', hours: 10, isPrimary: false, /* ... */ }
    ];
    
    render(<DepartmentBreakdown departments={departments} />);
    
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.getByTestId('junk-card')).toHaveClass('border-[#026937]');
  });
  
  it('should calculate percentages correctly', () => {
    // Test percentage calculations
  });
});
```

### Integration Testing

Test the complete payroll calculation flow:

```typescript
describe('Enhanced Payroll Integration', () => {
  it('should calculate department breakdowns correctly', async () => {
    // Create test data with multiple departments
    const testLogs = createTestLogsWithMultipleDepartments();
    
    // Calculate payroll
    const result = await calculateEnhancedPayroll(testUserId, testPayPeriod);
    
    // Verify department totals match overall totals
    expect(sumDepartmentHours(result.departmentBreakdown)).toEqual(result.totalHours);
    expect(sumDepartmentPay(result.departmentBreakdown)).toEqual(result.grossWages);
  });
});
```

### End-to-End Testing

Test the complete user workflow:

```typescript
test('Employee can view detailed payroll breakdown', async ({ page }) => {
  await page.goto('/reports/my-payroll');
  
  // Select a pay period
  await page.selectOption('[data-testid=pay-period-select]', 'current-period');
  
  // Navigate to breakdown tab
  await page.click('[data-testid=breakdown-tab]');
  
  // Verify department breakdown is visible
  await expect(page.locator('[data-testid=department-breakdown]')).toBeVisible();
  
  // Check daily calendar
  await page.click('[data-testid=daily-history-tab]');
  await expect(page.locator('[data-testid=work-calendar]')).toBeVisible();
  
  // Verify tips details
  await page.click('[data-testid=tips-tab]');
  await expect(page.locator('[data-testid=tips-breakdown]')).toBeVisible();
});
```

## Performance Considerations

### Data Loading Strategy

The design uses progressive loading to maintain performance:

```typescript
function usePayrollBreakdown(userId: string, payPeriod: PayPeriod) {
  // Load summary data first
  const { data: summary } = useSWR(
    ['payroll-summary', userId, payPeriod.id],
    () => getPayrollSummary(userId, payPeriod)
  );
  
  // Load detailed breakdowns on demand
  const { data: breakdown } = useSWR(
    summary ? ['payroll-breakdown', userId, payPeriod.id] : null,
    () => getPayrollBreakdown(userId, payPeriod),
    { revalidateOnFocus: false }
  );
  
  return { summary, breakdown };
}
```

### Caching Strategy

Implement aggressive caching for closed pay periods:

```typescript
export async function getPayrollBreakdown(userId: string, payPeriod: PayPeriod) {
  const cacheKey = `payroll-breakdown-${userId}-${payPeriod.id}`;
  
  // For closed pay periods, cache indefinitely
  if (payPeriod.status === 'closed') {
    return unstable_cache(
      () => calculatePayrollBreakdown(userId, payPeriod),
      [cacheKey],
      { revalidate: false }
    )();
  }
  
  // For open periods, cache for 1 hour
  return unstable_cache(
    () => calculatePayrollBreakdown(userId, payPeriod),
    [cacheKey],
    { revalidate: 3600 }
  )();
}
```

## Mobile Optimization

### Responsive Design Strategy

The design prioritizes mobile-first responsive layouts:

```typescript
function MobileOptimizedBreakdown({ data }: Props) {
  return (
    <div className="space-y-4">
      {/* Mobile: Stack cards vertically */}
      <div className="block md:hidden space-y-3">
        {data.departmentBreakdown.map(dept => (
          <MobileDepartmentCard key={dept.department} department={dept} />
        ))}
      </div>
      
      {/* Desktop: Grid layout */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.departmentBreakdown.map(dept => (
          <DesktopDepartmentCard key={dept.department} department={dept} />
        ))}
      </div>
    </div>
  );
}
```

### Touch Optimization

All interactive elements are optimized for touch:

```css
/* Minimum touch target size */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* Larger tap areas for mobile */
@media (max-width: 768px) {
  .mobile-button {
    padding: 12px 16px;
    font-size: 16px;
  }
}
```

This comprehensive design provides the detailed payroll breakdown functionality while maintaining the existing system's performance, usability, and design consistency.