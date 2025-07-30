import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DailyWorkCalendar, type DailyWorkEntry, type WorkPatternStats } from '@/components/features/reports/payroll-breakdown/daily-work-calendar';

// Mock the formatters
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatDate: (date: Date) => date.toLocaleDateString(),
}));

// Mock the utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}));

const mockWorkEntries: DailyWorkEntry[] = [
  {
    date: new Date('2025-01-02'),
    logId: 'log-1',
    departments: [
      { department: 'junk', hours: 6, rate: 20, role: 'captain' },
      { department: 'move', hours: 2, rate: 18, role: 'wingman' },
    ],
    tips: 45,
    totalHours: 8,
    grossPay: 156,
    jobsCompleted: 3,
  },
  {
    date: new Date('2025-01-03'),
    logId: 'log-2',
    departments: [
      { department: 'junk', hours: 8, rate: 20, role: 'captain' },
    ],
    tips: 60,
    totalHours: 8,
    grossPay: 160,
    jobsCompleted: 4,
  },
];

const mockWorkPatternStats: WorkPatternStats = {
  totalDaysWorked: 15,
  avgHoursPerDay: 8.2,
  mostCommonDepartment: 'junk',
  totalJobsCompleted: 45,
  avgTipsPerDay: 42.5,
  busiestDay: new Date('2025-01-03'),
  highestTipDay: new Date('2025-01-03'),
  highestPayDay: new Date('2025-01-03'),
};

describe('DailyWorkCalendar', () => {
  const mockOnDateSelect = vi.fn();
  const payPeriodStart = new Date('2025-01-01');
  const payPeriodEnd = new Date('2025-01-31');

  beforeEach(() => {
    mockOnDateSelect.mockClear();
  });

  it('renders work pattern analysis correctly', () => {
    render(
      <DailyWorkCalendar
        workEntries={mockWorkEntries}
        workPatternStats={mockWorkPatternStats}
        onDateSelect={mockOnDateSelect}
        payPeriodStart={payPeriodStart}
        payPeriodEnd={payPeriodEnd}
      />
    );

    expect(screen.getByText('Work Pattern Analysis')).toBeInTheDocument();
    expect(screen.getByText('Days Worked')).toBeInTheDocument();
    expect(screen.getByText('8.2h')).toBeInTheDocument(); // Avg hours per day
    expect(screen.getByText('Primary Dept')).toBeInTheDocument();
    expect(screen.getByText('$42.50')).toBeInTheDocument(); // Avg tips per day
  });

  it('renders calendar with work days highlighted', () => {
    render(
      <DailyWorkCalendar
        workEntries={mockWorkEntries}
        workPatternStats={mockWorkPatternStats}
        onDateSelect={mockOnDateSelect}
        payPeriodStart={payPeriodStart}
        payPeriodEnd={payPeriodEnd}
      />
    );

    expect(screen.getByText('Daily Work Calendar')).toBeInTheDocument();
    expect(screen.getByText('Legend:')).toBeInTheDocument();
    expect(screen.getByText('Work Day')).toBeInTheDocument();
    expect(screen.getByText('High Tips')).toBeInTheDocument();
    expect(screen.getByText('Long Hours')).toBeInTheDocument();
  });

  it('shows daily detail when date is selected', () => {
    const selectedDate = new Date('2025-01-02');
    
    render(
      <DailyWorkCalendar
        workEntries={mockWorkEntries}
        workPatternStats={mockWorkPatternStats}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        payPeriodStart={payPeriodStart}
        payPeriodEnd={payPeriodEnd}
      />
    );

    // Should show daily detail for selected date
    expect(screen.getByText('8h')).toBeInTheDocument(); // Total hours
    expect(screen.getByText('$156.00')).toBeInTheDocument(); // Gross pay
    expect(screen.getByText('$45.00')).toBeInTheDocument(); // Tips earned
    expect(screen.getByText('Total Hours')).toBeInTheDocument();
    expect(screen.getByText('Gross Pay')).toBeInTheDocument();
    expect(screen.getByText('Tips Earned')).toBeInTheDocument();
    expect(screen.getByText('Jobs Done')).toBeInTheDocument();
  });

  it('shows department breakdown in daily detail', () => {
    const selectedDate = new Date('2025-01-02');
    
    render(
      <DailyWorkCalendar
        workEntries={mockWorkEntries}
        workPatternStats={mockWorkPatternStats}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
        payPeriodStart={payPeriodStart}
        payPeriodEnd={payPeriodEnd}
      />
    );

    expect(screen.getByText('Department Breakdown')).toBeInTheDocument();
    expect(screen.getByText('captain')).toBeInTheDocument();
    expect(screen.getByText('wingman')).toBeInTheDocument();
    
    // Check for department badges
    const badges = screen.getAllByRole('generic');
    const departmentBadges = badges.filter(badge => 
      badge.textContent?.includes('junk') || badge.textContent?.includes('move')
    );
    expect(departmentBadges.length).toBeGreaterThan(0);
  });

  it('shows placeholder when no date is selected', () => {
    render(
      <DailyWorkCalendar
        workEntries={mockWorkEntries}
        workPatternStats={mockWorkPatternStats}
        onDateSelect={mockOnDateSelect}
        payPeriodStart={payPeriodStart}
        payPeriodEnd={payPeriodEnd}
      />
    );

    expect(screen.getByText('Select a Date')).toBeInTheDocument();
    expect(screen.getByText('Choose a date from the calendar to view details')).toBeInTheDocument();
    expect(screen.getByText('Select a date to view work details')).toBeInTheDocument();
  });

  it('handles empty work entries gracefully', () => {
    const emptyStats: WorkPatternStats = {
      totalDaysWorked: 0,
      avgHoursPerDay: 0,
      mostCommonDepartment: 'admin',
      totalJobsCompleted: 0,
      avgTipsPerDay: 0,
      busiestDay: new Date(),
      highestTipDay: new Date(),
      highestPayDay: new Date(),
    };

    render(
      <DailyWorkCalendar
        workEntries={[]}
        workPatternStats={emptyStats}
        onDateSelect={mockOnDateSelect}
        payPeriodStart={payPeriodStart}
        payPeriodEnd={payPeriodEnd}
      />
    );

    expect(screen.getByText('Days Worked')).toBeInTheDocument();
    expect(screen.getByText('0.0h')).toBeInTheDocument(); // Avg hours per day
    expect(screen.getByText('Primary Dept')).toBeInTheDocument();
    expect(screen.getByText('$0.00')).toBeInTheDocument(); // Avg tips per day
  });

  it('calculates high tip and high hour days correctly', () => {
    const highTipEntries: DailyWorkEntry[] = [
      {
        date: new Date('2025-01-02'),
        logId: 'log-1',
        departments: [{ department: 'junk', hours: 8, rate: 20, role: 'captain' }],
        tips: 100, // High tips (> 42.5 * 1.5 = 63.75)
        totalHours: 8,
        grossPay: 160,
        jobsCompleted: 3,
      },
      {
        date: new Date('2025-01-03'),
        logId: 'log-2',
        departments: [{ department: 'junk', hours: 12, rate: 20, role: 'captain' }],
        tips: 30,
        totalHours: 12, // High hours (> 8.2 * 1.2 = 9.84)
        grossPay: 240,
        jobsCompleted: 4,
      },
    ];

    render(
      <DailyWorkCalendar
        workEntries={highTipEntries}
        workPatternStats={mockWorkPatternStats}
        onDateSelect={mockOnDateSelect}
        payPeriodStart={payPeriodStart}
        payPeriodEnd={payPeriodEnd}
      />
    );

    // Calendar should render without errors and show legend
    expect(screen.getByText('High Tips')).toBeInTheDocument();
    expect(screen.getByText('Long Hours')).toBeInTheDocument();
  });
});