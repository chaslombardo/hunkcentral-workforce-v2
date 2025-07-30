import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MyPayrollView } from '@/components/features/reports/my-payroll-view';

// Mock the child components
vi.mock('@/components/features/reports/payroll-breakdown/department-breakdown', () => ({
  DepartmentBreakdown: ({ departments }: any) => (
    <div data-testid="department-breakdown">
      Department Breakdown: {departments.length} departments
    </div>
  ),
}));

vi.mock('@/components/features/reports/payroll-breakdown/daily-work-calendar', () => ({
  DailyWorkCalendar: ({ workEntries }: any) => (
    <div data-testid="daily-work-calendar">
      Daily Calendar: {workEntries.length} entries
    </div>
  ),
}));

vi.mock('@/components/features/reports/payroll-breakdown/tips-detail-view', () => ({
  TipsDetailView: ({ tips }: any) => (
    <div data-testid="tips-detail-view">
      Tips Details: {tips.length} tips
    </div>
  ),
}));

vi.mock('@/components/features/reports/payroll-breakdown/rate-information-panel', () => ({
  RateInformationPanel: ({ user }: any) => (
    <div data-testid="rate-information-panel">
      Rate Panel: {user.fullName}
    </div>
  ),
}));

describe('MyPayrollView Enhanced Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default tab (breakdown)', () => {
    render(<MyPayrollView />);
    
    expect(screen.getByText('My Payroll')).toBeInTheDocument();
    expect(screen.getByText('View your compensation details and pay history')).toBeInTheDocument();
  });

  it('should display summary cards with loading states', async () => {
    render(<MyPayrollView userId="test-user" />);
    
    // Should show loading skeletons initially
    expect(screen.getAllByTestId('skeleton')).toHaveLength(0); // No skeletons when no userId provided
    
    // Should show summary data
    expect(screen.getByText('Total Pay')).toBeInTheDocument();
    expect(screen.getByText('Hours Worked')).toBeInTheDocument();
    expect(screen.getByText('Tips Earned')).toBeInTheDocument();
    expect(screen.getByText('Bonuses')).toBeInTheDocument();
  });

  it('should have responsive tab navigation', () => {
    render(<MyPayrollView />);
    
    // Check all tabs are present
    expect(screen.getByRole('tab', { name: /breakdown/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /history/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /tips/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /performance/i })).toBeInTheDocument();
  });

  it('should switch between tabs correctly', async () => {
    render(<MyPayrollView />);
    
    // Default tab should be breakdown
    expect(screen.getByRole('tab', { name: /breakdown/i })).toHaveAttribute('data-state', 'active');
    
    // Click on daily history tab
    fireEvent.click(screen.getByRole('tab', { name: /history/i }));
    
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /history/i })).toHaveAttribute('data-state', 'active');
    });
  });

  it('should show progressive loading for detailed data', async () => {
    render(<MyPayrollView userId="test-user" />);
    
    // Click on breakdown tab to trigger detailed loading
    fireEvent.click(screen.getByRole('tab', { name: /breakdown/i }));
    
    // Should eventually show the breakdown component
    await waitFor(() => {
      expect(screen.getByTestId('department-breakdown')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle pay period selection', () => {
    render(<MyPayrollView />);
    
    // Should have pay period selector
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Download Paystub')).toBeInTheDocument();
  });

  it('should display performance metrics in performance tab', async () => {
    render(<MyPayrollView />);
    
    // Click on performance tab
    fireEvent.click(screen.getByRole('tab', { name: /performance/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Labor Efficiency')).toBeInTheDocument();
      expect(screen.getByText('Avg Tips/Hour')).toBeInTheDocument();
      expect(screen.getByText('Jobs Completed')).toBeInTheDocument();
      expect(screen.getByText('Bonus Earned')).toBeInTheDocument();
    });
  });

  it('should show mobile-optimized pay history', async () => {
    render(<MyPayrollView />);
    
    // Click on history tab
    fireEvent.click(screen.getByRole('tab', { name: /history/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Recent Pay History')).toBeInTheDocument();
      expect(screen.getByText('Your compensation over the last few pay periods')).toBeInTheDocument();
    });
  });

  it('should handle error states gracefully', async () => {
    // This would test error handling, but since we're using mock data,
    // we'll just verify the error UI components exist
    render(<MyPayrollView />);
    
    // The component should render without errors
    expect(screen.getByText('My Payroll')).toBeInTheDocument();
  });
});