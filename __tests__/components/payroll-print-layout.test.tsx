import { render, screen, fireEvent } from '@testing-library/react';
import { PayrollPrintLayout, PrintPreviewDialog } from '@/components/features/reports/payroll-print-layout';
import type { PayPeriod, User } from '@/types';
import type { PayrollCalculation, TipEntry } from '@/lib/payCalculator';
import type { DepartmentBreakdownData } from '@/components/features/reports/payroll-breakdown/department-breakdown';
import type { DailyWorkEntry } from '@/lib/actions/daily-work';

import { vi } from 'vitest';

// Mock formatters
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (amount: number) => `$${amount.toFixed(2)}`,
  formatDate: (date: Date) => date.toLocaleDateString(),
}));

const mockUser: User = {
  id: '1',
  fullName: 'John Smith',
  email: 'john@example.com',
  roles: ['captain'],
  rateJunkCaptain: 20,
  rateJunkWingman: 16,
  rateMoveCaptain: 22,
  rateMoveWingman: 18,
  rateZigma: 19,
  rateTraining: 15,
  rateEstimating: 25,
  rateWarehouse: 17,
  rateAdmin: 14,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPayPeriod: PayPeriod = {
  id: '1',
  name: 'January 2025 - Week 1',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-07'),
  status: 'closed',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPayrollData: PayrollCalculation = {
  employeeId: '1',
  employee: mockUser,
  totalHours: 40,
  hoursByDepartment: { junk: 30, move: 8, zigma: 2, training: 0, estimating: 0, warehouse: 0, admin: 0 },
  grossWages: 720,
  tips: 150,
  bonuses: 85,
  commission: 0,
  totalPay: 955,
  breakdown: {
    hourlyWages: 720,
    salaryAmount: 0,
    salaryType: null,
    salaryFrequency: null,
    tips: 150,
    commission: 0,
    laborBonuses: 85,
    totalBeforeSalaryAdjustment: 955,
    finalPay: 955,
  },
};

const mockDepartmentBreakdown: DepartmentBreakdownData[] = [
  {
    department: 'junk',
    hours: 30,
    rate: 20,
    grossPay: 600,
    percentage: 75,
    isPrimary: true,
  },
  {
    department: 'move',
    hours: 8,
    rate: 18,
    grossPay: 144,
    percentage: 20,
    isPrimary: false,
  },
];

const mockDailyWorkHistory: DailyWorkEntry[] = [
  {
    date: new Date('2025-01-02'),
    logId: 'log-1',
    departments: [
      { department: 'junk', hours: 6, rate: 20, role: 'captain' },
    ],
    tips: 45,
    totalHours: 6,
    grossPay: 120,
    jobsCompleted: 3,
  },
  {
    date: new Date('2025-01-03'),
    logId: 'log-2',
    departments: [
      { department: 'move', hours: 8, rate: 22, role: 'captain' },
    ],
    tips: 60,
    totalHours: 8,
    grossPay: 176,
    jobsCompleted: 2,
  },
];

const mockTipsDetails: TipEntry[] = [
  {
    date: new Date('2025-01-02'),
    jobId: 'J2025-001',
    clientName: 'Smith Residence',
    totalJobTips: 80,
    teamMembers: 4,
    myShare: 20,
    jobType: 'junk',
    logId: 'log-1',
  },
  {
    date: new Date('2025-01-03'),
    jobId: 'J2025-002',
    clientName: 'Johnson Office',
    totalJobTips: 60,
    teamMembers: 3,
    myShare: 20,
    jobType: 'move',
    logId: 'log-2',
  },
];

const defaultProps = {
  payrollData: mockPayrollData,
  payPeriod: mockPayPeriod,
  departmentBreakdown: mockDepartmentBreakdown,
  dailyWorkHistory: mockDailyWorkHistory,
  tipsDetails: mockTipsDetails,
};

describe('PayrollPrintLayout', () => {
  it('renders the basic paystub header', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    expect(screen.getByText('College Hunks Hauling Junk & Moving')).toBeInTheDocument();
    expect(screen.getByText('Employee Paystub')).toBeInTheDocument();
    expect(screen.getByText('Official Paystub')).toBeInTheDocument();
  });

  it('displays employee information correctly', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    expect(screen.getByText('Employee Information')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('captain')).toBeInTheDocument();
  });

  it('displays pay period details', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    expect(screen.getByText('Pay Period Details')).toBeInTheDocument();
    expect(screen.getByText('January 2025 - Week 1')).toBeInTheDocument();
    expect(screen.getByText('closed')).toBeInTheDocument();
  });

  it('shows pay summary with correct totals', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    expect(screen.getByText('Pay Summary')).toBeInTheDocument();
    expect(screen.getByText('40h')).toBeInTheDocument(); // Total hours
    expect(screen.getByText('$720.00')).toBeInTheDocument(); // Gross wages
    expect(screen.getByText('$235.00')).toBeInTheDocument(); // Tips + bonuses (150 + 85)
    expect(screen.getByText('$955.00')).toBeInTheDocument(); // Total pay
  });

  it('displays detailed pay breakdown', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    expect(screen.getByText('Regular Wages (40 hours)')).toBeInTheDocument();
    expect(screen.getByText('Tips Earned')).toBeInTheDocument();
    expect(screen.getByText('Performance Bonuses')).toBeInTheDocument();
    expect(screen.getByText('Commission')).toBeInTheDocument();
    expect(screen.getByText('Total Gross Pay')).toBeInTheDocument();
  });

  it('shows department breakdown when enabled', () => {
    render(<PayrollPrintLayout {...defaultProps} includeBreakdown={true} />);
    
    expect(screen.getByText('Department Breakdown')).toBeInTheDocument();
    expect(screen.getByText('junk')).toBeInTheDocument();
    expect(screen.getByText('move')).toBeInTheDocument();
    expect(screen.getByText('Primary')).toBeInTheDocument(); // Primary department badge
    expect(screen.getByText('30h')).toBeInTheDocument(); // Junk hours
    expect(screen.getByText('8h')).toBeInTheDocument(); // Move hours
  });

  it('hides department breakdown when disabled', () => {
    render(<PayrollPrintLayout {...defaultProps} includeBreakdown={false} />);
    
    expect(screen.queryByText('Department Breakdown')).not.toBeInTheDocument();
  });

  it('shows daily work history when enabled', () => {
    render(<PayrollPrintLayout {...defaultProps} includeDailyHistory={true} />);
    
    expect(screen.getByText('Daily Work History')).toBeInTheDocument();
    expect(screen.getByText('1/2/2025')).toBeInTheDocument(); // First work day
    expect(screen.getByText('1/3/2025')).toBeInTheDocument(); // Second work day
    expect(screen.getByText('3 jobs')).toBeInTheDocument(); // Jobs completed
    expect(screen.getByText('2 jobs')).toBeInTheDocument(); // Jobs completed
  });

  it('hides daily work history when disabled', () => {
    render(<PayrollPrintLayout {...defaultProps} includeDailyHistory={false} />);
    
    expect(screen.queryByText('Daily Work History')).not.toBeInTheDocument();
  });

  it('displays tips details', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    expect(screen.getByText('Tips Details')).toBeInTheDocument();
    expect(screen.getByText('Smith Residence')).toBeInTheDocument();
    expect(screen.getByText('Johnson Office')).toBeInTheDocument();
    expect(screen.getByText('Job #J2025-001')).toBeInTheDocument();
    expect(screen.getByText('Job #J2025-002')).toBeInTheDocument();
    expect(screen.getByText('4 team members')).toBeInTheDocument();
    expect(screen.getByText('3 team members')).toBeInTheDocument();
  });

  it('shows calculation explanations when enabled', () => {
    render(<PayrollPrintLayout {...defaultProps} includeCalculations={true} />);
    
    expect(screen.getByText('Calculation Explanations')).toBeInTheDocument();
    expect(screen.getByText('Regular Pay Calculation')).toBeInTheDocument();
    expect(screen.getByText('Tips Distribution')).toBeInTheDocument();
    expect(screen.getByText('Performance Bonuses')).toBeInTheDocument();
    expect(screen.getByText('Department Goals')).toBeInTheDocument();
    expect(screen.getByText('Junk operations target: 14% labor cost')).toBeInTheDocument();
    expect(screen.getByText('Move operations target: 24% labor cost')).toBeInTheDocument();
  });

  it('displays notes when provided', () => {
    const notes = 'This is a test paystub with additional notes.';
    render(<PayrollPrintLayout {...defaultProps} notes={notes} />);
    
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText(notes)).toBeInTheDocument();
  });

  it('shows print button', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    const printButton = screen.getByText('Print Paystub');
    expect(printButton).toBeInTheDocument();
    expect(printButton.closest('button')).toBeInTheDocument();
  });

  it('handles print button click', () => {
    // Mock window.print
    const mockPrint = vi.fn();
    Object.defineProperty(window, 'print', {
      value: mockPrint,
      writable: true,
    });

    render(<PayrollPrintLayout {...defaultProps} />);
    
    const printButton = screen.getByText('Print Paystub');
    fireEvent.click(printButton);
    
    expect(mockPrint).toHaveBeenCalled();
  });

  it('includes print-specific CSS classes', () => {
    const { container } = render(<PayrollPrintLayout {...defaultProps} />);
    
    // Check for print-specific classes
    expect(container.querySelector('.print\\:border')).toBeInTheDocument();
    expect(container.querySelector('.print\\:p-4')).toBeInTheDocument();
    expect(container.querySelector('.no-print')).toBeInTheDocument();
  });

  it('handles missing optional data gracefully', () => {
    render(
      <PayrollPrintLayout
        payrollData={mockPayrollData}
        payPeriod={mockPayPeriod}
        // No optional props provided
      />
    );
    
    // Should still render basic information
    expect(screen.getByText('Pay Summary')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    
    // Should not show optional sections
    expect(screen.queryByText('Department Breakdown')).not.toBeInTheDocument();
    expect(screen.queryByText('Daily Work History')).not.toBeInTheDocument();
    expect(screen.queryByText('Tips Details')).not.toBeInTheDocument();
  });
});

describe('PrintPreviewDialog', () => {
  it('renders trigger element', () => {
    render(
      <PrintPreviewDialog {...defaultProps}>
        <button>Show Preview</button>
      </PrintPreviewDialog>
    );
    
    expect(screen.getByText('Show Preview')).toBeInTheDocument();
  });

  it('opens preview dialog when clicked', () => {
    render(
      <PrintPreviewDialog {...defaultProps}>
        <button>Show Preview</button>
      </PrintPreviewDialog>
    );
    
    fireEvent.click(screen.getByText('Show Preview'));
    
    expect(screen.getByText('Print Preview')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('closes preview dialog when close button clicked', () => {
    render(
      <PrintPreviewDialog {...defaultProps}>
        <button>Show Preview</button>
      </PrintPreviewDialog>
    );
    
    // Open dialog
    fireEvent.click(screen.getByText('Show Preview'));
    expect(screen.getByText('Print Preview')).toBeInTheDocument();
    
    // Close dialog
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Print Preview')).not.toBeInTheDocument();
  });

  it('shows payroll content in preview', () => {
    render(
      <PrintPreviewDialog {...defaultProps}>
        <button>Show Preview</button>
      </PrintPreviewDialog>
    );
    
    fireEvent.click(screen.getByText('Show Preview'));
    
    // Should show payroll content
    expect(screen.getByText('College Hunks Hauling Junk & Moving')).toBeInTheDocument();
    expect(screen.getByText('Employee Paystub')).toBeInTheDocument();
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });
});

describe('PayrollPrintLayout Requirements Validation', () => {
  it('meets requirement 7.4: Implements print-friendly layouts', () => {
    const { container } = render(<PayrollPrintLayout {...defaultProps} />);
    
    // Should have print-specific styling
    expect(container.querySelector('.print\\:bg-white')).toBeInTheDocument();
    expect(container.querySelector('.print\\:text-black')).toBeInTheDocument();
    expect(container.querySelector('.print\\:border')).toBeInTheDocument();
    expect(container.querySelector('.no-print')).toBeInTheDocument();
    
    // Should have print button
    expect(screen.getByText('Print Paystub')).toBeInTheDocument();
  });

  it('meets requirement 7.2: Includes all breakdown information', () => {
    render(
      <PayrollPrintLayout 
        {...defaultProps} 
        includeBreakdown={true}
        includeDailyHistory={true}
        includeCalculations={true}
      />
    );
    
    // Should include comprehensive breakdown
    expect(screen.getByText('Department Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Daily Work History')).toBeInTheDocument();
    expect(screen.getByText('Tips Details')).toBeInTheDocument();
    expect(screen.getByText('Calculation Explanations')).toBeInTheDocument();
  });

  it('meets requirement 7.3: Provides calculation explanations', () => {
    render(<PayrollPrintLayout {...defaultProps} includeCalculations={true} />);
    
    // Should show detailed calculation explanations
    expect(screen.getByText('Regular Pay Calculation')).toBeInTheDocument();
    expect(screen.getByText(/Regular pay is calculated by multiplying hours worked/)).toBeInTheDocument();
    expect(screen.getByText('Tips Distribution')).toBeInTheDocument();
    expect(screen.getByText(/Tips from each job are divided equally/)).toBeInTheDocument();
    expect(screen.getByText('Performance Bonuses')).toBeInTheDocument();
    expect(screen.getByText(/Labor efficiency bonuses are earned/)).toBeInTheDocument();
  });

  it('meets requirement 7.5: Supports professional paystub format', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    // Should have professional paystub elements
    expect(screen.getByText('College Hunks Hauling Junk & Moving')).toBeInTheDocument();
    expect(screen.getByText('Employee Paystub')).toBeInTheDocument();
    expect(screen.getByText('Official Paystub')).toBeInTheDocument();
    expect(screen.getByText('Employee Information')).toBeInTheDocument();
    expect(screen.getByText('Pay Period Details')).toBeInTheDocument();
    expect(screen.getByText('Pay Summary')).toBeInTheDocument();
    expect(screen.getByText('This is an official paystub')).toBeInTheDocument();
  });

  it('meets requirement 7.6: Includes comprehensive pay data', () => {
    render(<PayrollPrintLayout {...defaultProps} />);
    
    // Should show all pay components
    expect(screen.getByText('Regular Wages (40 hours)')).toBeInTheDocument();
    expect(screen.getByText('Tips Earned')).toBeInTheDocument();
    expect(screen.getByText('Performance Bonuses')).toBeInTheDocument();
    expect(screen.getByText('Commission')).toBeInTheDocument();
    expect(screen.getByText('Total Gross Pay')).toBeInTheDocument();
    
    // Should show correct amounts
    expect(screen.getByText('$720.00')).toBeInTheDocument(); // Gross wages
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // Tips
    expect(screen.getByText('$85.00')).toBeInTheDocument(); // Bonuses
    expect(screen.getByText('$955.00')).toBeInTheDocument(); // Total
  });
});