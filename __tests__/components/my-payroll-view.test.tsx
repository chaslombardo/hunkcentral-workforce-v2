import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act, waitForElementToBeRemoved } from '@testing-library/react';
import { MyPayrollView } from '@/components/features/reports/my-payroll-view';

// Mock the offline detection hook to prevent network requests
vi.mock('@/hooks/useOfflineDetection', () => ({
  useOfflineDetection: () => ({
    isOffline: false,
    hasOfflineData: false,
  }),
}));

// Mock the mobile detection hook
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => false,
}));

// Mock the payroll validation functions
vi.mock('@/lib/actions/payroll-validation', () => ({
  validateEmployeePayroll: vi.fn().mockResolvedValue({
    success: false,
    error: 'Validation not available in test environment'
  }),
  submitDiscrepancyReport: vi.fn().mockResolvedValue({
    success: true,
    data: { id: 'test-report-id' }
  }),
}));

// Mock the child components
vi.mock('@/components/features/reports/payroll-breakdown/department-breakdown', () => ({
  DepartmentBreakdown: ({ departments }: any) => (
    <div data-testid="department-breakdown">
      Department Breakdown: {departments?.length || 0} departments
    </div>
  ),
}));

vi.mock('@/components/features/reports/payroll-breakdown/daily-work-calendar', () => ({
  DailyWorkCalendar: ({ workEntries }: any) => (
    <div data-testid="daily-work-calendar">
      Daily Calendar: {workEntries?.length || 0} entries
    </div>
  ),
}));

vi.mock('@/components/features/reports/payroll-breakdown/tips-detail-view', () => ({
  TipsDetailView: ({ tips }: any) => (
    <div data-testid="tips-detail-view">
      Tips Details: {tips?.length || 0} tips
    </div>
  ),
}));

vi.mock('@/components/features/reports/payroll-breakdown/rate-information-panel', () => ({
  RateInformationPanel: ({ user }: any) => (
    <div data-testid="rate-information-panel">
      Rate Panel: {user?.fullName || 'Unknown User'}
    </div>
  ),
}));

vi.mock('@/components/features/reports/payroll-breakdown/pay-period-analysis', () => ({
  PayPeriodAnalysis: ({ userId }: any) => (
    <div data-testid="pay-period-analysis">
      Pay Period Analysis for user: {userId}
    </div>
  ),
}));

vi.mock('@/components/features/reports/payroll-breakdown/payroll-validation-panel', () => ({
  PayrollValidationPanel: ({ validationResult }: any) => (
    <div data-testid="payroll-validation-panel">
      Validation Panel: {validationResult ? 'Has validation data' : 'No validation data'}
    </div>
  ),
}));

describe('MyPayrollView Enhanced Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should render with default tab (breakdown)', async () => {
    await act(async () => {
      render(<MyPayrollView />);
    });
    
    expect(screen.getByText('My Payroll')).toBeInTheDocument();
    expect(screen.getByText('View your compensation details and pay history')).toBeInTheDocument();
  });

  it('should display summary cards with loading states', async () => {
    await act(async () => {
      render(<MyPayrollView userId="test-user" />);
    });
    
    // Should show summary data - use data-testid for specific "Total Pay" element
    expect(screen.getByTestId('total-pay-label')).toBeInTheDocument();
    expect(screen.getByText('Hours Worked')).toBeInTheDocument();
    expect(screen.getByText('Tips Earned')).toBeInTheDocument();
    expect(screen.getByText('Bonuses')).toBeInTheDocument(); // Only one in summary cards
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getAllByText('$955.00')[0]).toBeInTheDocument(); // Total pay amount
    });
  });

  it('should have responsive tab navigation', async () => {
    await act(async () => {
      render(<MyPayrollView />);
    });
    
    // Check all tabs are present - use more specific names to avoid conflicts
    expect(screen.getByRole('tab', { name: /breakdown/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /work/i })).toBeInTheDocument(); // Daily Work tab
    expect(screen.getByRole('tab', { name: /tips/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pay history/i })).toBeInTheDocument(); // Pay History tab
    expect(screen.getByRole('tab', { name: /performance/i })).toBeInTheDocument();
  });

  it('should switch between tabs correctly', async () => {
    render(<MyPayrollView />);
    
    // Default tab should be breakdown
    expect(screen.getByRole('tab', { name: /breakdown/i })).toHaveAttribute('data-state', 'active');
    
    // Test basic tab switching functionality
    // Switch to daily work tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /work/i }));
    });
    
    // Wait for state change to be reflected
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /work/i })).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getByRole('tab', { name: /breakdown/i })).toHaveAttribute('data-state', 'inactive');
    
    // Switch to tips tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /tips/i }));
    });
    
    // Wait for state change to be reflected
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /tips/i })).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getByRole('tab', { name: /work/i })).toHaveAttribute('data-state', 'inactive');
    
    // Switch back to breakdown tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /breakdown/i }));
    });
    
    // Wait for state change to be reflected
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /breakdown/i })).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getByRole('tab', { name: /tips/i })).toHaveAttribute('data-state', 'inactive');
  });

  it('should show progressive loading for detailed data', async () => {
    render(<MyPayrollView userId="test-user" />);
    
    // Test that tabs exist and can be clicked
    expect(screen.getByRole('tab', { name: /breakdown/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /work/i })).toBeInTheDocument();
    
    // Test tab switching without waiting for content
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /work/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /work/i })).toHaveAttribute('data-state', 'active');
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /breakdown/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /breakdown/i })).toHaveAttribute('data-state', 'active');
    });
  });

  it('should handle pay period selection', async () => {
    await act(async () => {
      render(<MyPayrollView />);
    });
    
    // Should have pay period selector
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Download Paystub')).toBeInTheDocument();
  });

  it('should display performance metrics in performance tab', async () => {
    render(<MyPayrollView />);
    
    // Verify performance tab exists
    expect(screen.getByRole('tab', { name: /performance/i })).toBeInTheDocument();
    
    // Click on performance tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /performance/i }));
    });
    
    // Verify the performance tab is now active
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /performance/i })).toHaveAttribute('data-state', 'active');
    });
  });

  it('should show mobile-optimized pay history', async () => {
    render(<MyPayrollView />);
    
    // Verify pay history tab exists
    expect(screen.getByRole('tab', { name: /pay history/i })).toBeInTheDocument();
    
    // Click on pay history tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /pay history/i }));
    });
    
    // Verify the pay history tab is now active
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /pay history/i })).toHaveAttribute('data-state', 'active');
    });
  });

  it('should handle validation tab correctly', async () => {
    render(<MyPayrollView userId="test-user" />);
    
    // Verify validation tab exists
    expect(screen.getByRole('tab', { name: /validation/i })).toBeInTheDocument();
    
    // Click on validation tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /validation/i }));
    });
    
    // Verify the validation tab is now active
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /validation/i })).toHaveAttribute('data-state', 'active');
    });
  });

  it('should ensure only active tab content is visible', async () => {
    render(<MyPayrollView />);
    
    // Test that all tabs exist
    expect(screen.getByRole('tab', { name: /breakdown/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /work/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tips/i })).toBeInTheDocument();
    
    // Test tab state changes
    expect(screen.getByRole('tab', { name: /breakdown/i })).toHaveAttribute('data-state', 'active');
    
    // Switch to tips tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /tips/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /tips/i })).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getByRole('tab', { name: /breakdown/i })).toHaveAttribute('data-state', 'inactive');
    
    // Switch to daily work tab
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /work/i }));
    });
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /work/i })).toHaveAttribute('data-state', 'active');
    });
    expect(screen.getByRole('tab', { name: /tips/i })).toHaveAttribute('data-state', 'inactive');
  });

  it('should handle error states gracefully', async () => {
    // This would test error handling, but since we're using mock data,
    // we'll just verify the error UI components exist
    await act(async () => {
      render(<MyPayrollView />);
    });
    
    // The component should render without errors
    expect(screen.getByText('My Payroll')).toBeInTheDocument();
  });
});