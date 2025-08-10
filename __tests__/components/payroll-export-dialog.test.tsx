import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PayrollExportDialog } from '@/components/features/reports/payroll-export-dialog';
import type { PayPeriod, User } from '@/types';
import type { PayrollCalculation, TipEntry } from '@/lib/payCalculator';
import type { DepartmentBreakdownData } from '@/components/features/reports/payroll-breakdown/department-breakdown';
import type { DailyWorkEntry } from '@/lib/actions/daily-work';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
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
];

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  payrollData: [mockPayrollData],
  selectedPeriod: mockPayPeriod,
  departmentBreakdown: mockDepartmentBreakdown,
  dailyWorkHistory: mockDailyWorkHistory,
  tipsDetails: mockTipsDetails,
  currentUser: mockUser,
};

describe('PayrollExportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the export dialog with all tabs', () => {
    render(<PayrollExportDialog {...defaultProps} />);
    
    expect(screen.getByText('Export Payroll Report')).toBeInTheDocument();
    expect(screen.getByText('Basic Options')).toBeInTheDocument();
    expect(screen.getByText('Content & Data')).toBeInTheDocument();
    expect(screen.getByText('Preview & Export')).toBeInTheDocument();
  });

  it('shows correct default options', () => {
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Should default to PDF paystub for current user
    expect(screen.getByText('PDF Document (.pdf)')).toBeInTheDocument();
    expect(screen.getByText('Personal Paystub')).toBeInTheDocument();
    expect(screen.getByText('My Payroll Only')).toBeInTheDocument();
  });

  it('allows changing export format', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Click on format selector
    const formatSelect = screen.getByText('PDF Document (.pdf)');
    await user.click(formatSelect);
    
    // Select Excel format
    await user.click(screen.getByText('Excel Spreadsheet (.xlsx)'));
    
    expect(screen.getByDisplayValue('Excel Spreadsheet (.xlsx)')).toBeInTheDocument();
  });

  it('allows changing export type', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Click on type selector
    const typeSelect = screen.getByText('Personal Paystub');
    await user.click(typeSelect);
    
    // Select detailed breakdown
    await user.click(screen.getByText('Detailed Breakdown'));
    
    expect(screen.getByDisplayValue('Detailed Breakdown')).toBeInTheDocument();
  });

  it('shows content options in the second tab', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Click on Content & Data tab
    await user.click(screen.getByText('Content & Data'));
    
    // Check that content options are visible
    expect(screen.getByText('Pay Components')).toBeInTheDocument();
    expect(screen.getByText('Detailed Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Hours Worked')).toBeInTheDocument();
    expect(screen.getByLabelText('Tips Earned')).toBeInTheDocument();
    expect(screen.getByLabelText('Department Breakdown')).toBeInTheDocument();
    expect(screen.getByLabelText('Daily Work History')).toBeInTheDocument();
  });

  it('allows toggling content options', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Go to Content & Data tab
    await user.click(screen.getByText('Content & Data'));
    
    // Toggle department breakdown off
    const deptBreakdownCheckbox = screen.getByLabelText('Department Breakdown');
    expect(deptBreakdownCheckbox).toBeChecked();
    
    await user.click(deptBreakdownCheckbox);
    expect(deptBreakdownCheckbox).not.toBeChecked();
  });

  it('shows export preview in the third tab', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Click on Preview & Export tab
    await user.click(screen.getByText('Preview & Export'));
    
    // Check that preview information is visible
    expect(screen.getByText('Export Preview')).toBeInTheDocument();
    expect(screen.getByText('Format:')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Scope:')).toBeInTheDocument();
    expect(screen.getByText('Period:')).toBeInTheDocument();
    expect(screen.getByText('Employees:')).toBeInTheDocument();
  });

  it('shows included content badges in preview', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Go to preview tab
    await user.click(screen.getByText('Preview & Export'));
    
    // Check that content badges are shown
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Tips')).toBeInTheDocument();
    expect(screen.getByText('Bonuses')).toBeInTheDocument();
    expect(screen.getByText('Dept. Breakdown')).toBeInTheDocument();
  });

  it('allows adding notes', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Go to Content & Data tab
    await user.click(screen.getByText('Content & Data'));
    
    // Find and type in notes textarea
    const notesTextarea = screen.getByPlaceholderText('Add any notes or comments for this export...');
    await user.type(notesTextarea, 'Test export notes');
    
    expect(notesTextarea).toHaveValue('Test export notes');
    
    // Go to preview tab and check notes are shown
    await user.click(screen.getByText('Preview & Export'));
    expect(screen.getByText('Test export notes')).toBeInTheDocument();
  });

  it('handles export process', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Go to preview tab
    await user.click(screen.getByText('Preview & Export'));
    
    // Click export button
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);
    
    // Should show loading state
    expect(screen.getByText('Exporting...')).toBeInTheDocument();
    expect(screen.getByText('Generating export...')).toBeInTheDocument();
    
    // Wait for export to complete
    await waitFor(() => {
      expect(screen.queryByText('Exporting...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows department filter only for appropriate scopes', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Initially should not show department filter (current-user scope)
    expect(screen.queryByText('Department Filter')).not.toBeInTheDocument();
    
    // Change to department scope
    const scopeSelect = screen.getByText('My Payroll Only');
    await user.click(scopeSelect);
    await user.click(screen.getByText('My Department'));
    
    // Now should show department filter
    expect(screen.getByText('Department Filter')).toBeInTheDocument();
  });

  it('calculates correct employee count', () => {
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Go to preview tab
    fireEvent.click(screen.getByText('Preview & Export'));
    
    // Should show 1 employee for current user scope
    expect(screen.getAllByText('1')[0]).toBeInTheDocument();
  });

  it('shows help information', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Go to preview tab
    await user.click(screen.getByText('Preview & Export'));
    
    // Should show export tips
    expect(screen.getByText('Export Tips:')).toBeInTheDocument();
    expect(screen.getByText(/PDF format is recommended for paystubs/)).toBeInTheDocument();
  });

  it('handles dialog close', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    
    render(<PayrollExportDialog {...defaultProps} onOpenChange={onOpenChange} />);
    
    // Click cancel button
    await user.click(screen.getByText('Cancel'));
    
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables export during processing', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Go to preview tab
    await user.click(screen.getByText('Preview & Export'));
    
    // Click export button
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);
    
    // Export button should be disabled during processing
    expect(exportButton).toBeDisabled();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('shows progress messages during export', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Go to preview tab
    await user.click(screen.getByText('Preview & Export'));
    
    // Click export button
    await user.click(screen.getByRole('button', { name: /export/i }));
    
    // Should show progress messages
    await waitFor(() => {
      expect(screen.getByText('Collecting payroll data...')).toBeInTheDocument();
    });
  });
});

describe('PayrollExportDialog Requirements Validation', () => {
  it('meets requirement 7.1: Implements PayrollExportDialog component', () => {
    render(<PayrollExportDialog {...defaultProps} />);
    
    expect(screen.getByText('Export Payroll Report')).toBeInTheDocument();
    expect(screen.getByText('PDF Document (.pdf)')).toBeInTheDocument();
    expect(screen.getByText('Excel Spreadsheet (.xlsx)')).toBeInTheDocument();
  });

  it('meets requirement 7.2: Adds detailed paystub generation', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Should have paystub option
    expect(screen.getByText('Personal Paystub')).toBeInTheDocument();
    
    // Should include all breakdown information
    await user.click(screen.getByText('Content & Data'));
    expect(screen.getByLabelText('Department Breakdown')).toBeChecked();
    expect(screen.getByLabelText('Daily Work History')).toBeChecked();
    expect(screen.getByLabelText('Rate Information')).toBeChecked();
  });

  it('meets requirement 7.3: Creates calculation explanation tooltips', () => {
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Should have calculation details option
    fireEvent.click(screen.getByText('Content & Data'));
    expect(screen.getByText('Calculation Details & Explanations')).toBeInTheDocument();
  });

  it('meets requirement 7.4: Implements print-friendly layouts', () => {
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Should have print option
    fireEvent.click(screen.getByText('Preview'));
    expect(screen.getByText('Print Preview')).toBeInTheDocument();
  });

  it('meets requirement 7.5: Provides multiple export formats', () => {
    render(<PayrollExportDialog {...defaultProps} />);
    
    // Should have multiple format options
    expect(screen.getByText('PDF Document (.pdf)')).toBeInTheDocument();
    expect(screen.getByText('Excel Spreadsheet (.xlsx)')).toBeInTheDocument();
    expect(screen.getByText('CSV Data (.csv)')).toBeInTheDocument();
    expect(screen.getByText('Print Preview')).toBeInTheDocument();
  });

  it('meets requirement 7.6: Includes comprehensive data options', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    await user.click(screen.getByText('Content & Data'));
    
    // Should have all data inclusion options
    expect(screen.getByLabelText('Hours Worked')).toBeInTheDocument();
    expect(screen.getByLabelText('Tips Earned')).toBeInTheDocument();
    expect(screen.getByLabelText('Bonuses')).toBeInTheDocument();
    expect(screen.getByLabelText('Commission')).toBeInTheDocument();
    expect(screen.getByLabelText('Department Breakdown')).toBeInTheDocument();
    expect(screen.getByLabelText('Daily Work History')).toBeInTheDocument();
    expect(screen.getByLabelText('Rate Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Audit Trail & Log References')).toBeInTheDocument();
  });

  it('meets requirement 7.7: Provides export preview and validation', async () => {
    const user = userEvent.setup();
    render(<PayrollExportDialog {...defaultProps} />);
    
    await user.click(screen.getByText('Preview & Export'));
    
    // Should show comprehensive preview
    expect(screen.getByText('Export Preview')).toBeInTheDocument();
    expect(screen.getByText('Format:')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Employees:')).toBeInTheDocument();
    expect(screen.getByText('Included Content:')).toBeInTheDocument();
    expect(screen.getByText('Export Tips:')).toBeInTheDocument();
  });
});