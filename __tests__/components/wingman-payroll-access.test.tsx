import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { MyPayrollView } from '@/components/features/reports/my-payroll-view';
import { RoleGuard } from '@/components/auth/role-guard';
import type { SessionUser } from '@/lib/auth';

// Mock the session hook to simulate wingman user
const mockWingmanUser: SessionUser = {
  id: 'wingman-1',
  email: 'wingman@test.com',
  fullName: 'Test Wingman',
  roles: ['wingman'],
};

const mockCaptainUser: SessionUser = {
  id: 'captain-1',
  email: 'captain@test.com',
  fullName: 'Test Captain',
  roles: ['captain'],
};

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    user: mockWingmanUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock the offline detection hook
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

// Mock API calls to return wingman-specific data
vi.mock('@/lib/actions/payroll', () => ({
  getPayrollSummary: vi.fn().mockResolvedValue({
    success: true,
    data: {
      employeeId: 'wingman-1',
      employee: {
        id: 'wingman-1',
        email: 'wingman@test.com',
        fullName: 'Test Wingman',
        roles: ['wingman'],
      },
      payPeriod: {
        id: 'current',
        name: 'Current Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      totalHours: 80,
      totalPay: 1200,
      grossWages: 1000,
      tips: 150,
      commission: 0, // Wingmen don't get commission
      bonuses: 50,
    },
  }),
  getCachedDetailedPayrollBreakdown: vi.fn().mockResolvedValue({
    success: true,
    data: {
      departmentBreakdown: [
        {
          department: 'junk',
          hours: 60,
          rate: 12.5,
          grossPay: 750,
          percentage: 75,
          isPrimary: true,
        },
        {
          department: 'move',
          hours: 20,
          rate: 12.5,
          grossPay: 250,
          percentage: 25,
          isPrimary: false,
        },
      ],
      dailyWorkHistory: [
        {
          date: new Date('2024-01-01'),
          logIds: ['log-1'],
          departments: [
            {
              department: 'junk',
              hours: 8,
              rate: 12.5,
            },
          ],
          tips: 25,
          role: 'wingman',
        },
        {
          date: new Date('2024-01-02'),
          logIds: ['log-2'],
          departments: [
            {
              department: 'move',
              hours: 8,
              rate: 12.5,
            },
          ],
          tips: 30,
          role: 'wingman',
        },
      ],
      tipsDetails: [
        {
          date: new Date('2024-01-01'),
          jobId: 'job-1',
          amount: 25,
          jobType: 'junk',
          teamSize: 2,
        },
        {
          date: new Date('2024-01-02'),
          jobId: 'job-2',
          amount: 30,
          jobType: 'move',
          teamSize: 3,
        },
      ],
      totalHours: 80,
      totalPay: 1200,
      tips: 150,
    },
  }),
}));

// Mock pay periods API
global.fetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes('/api/pay-periods')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 'current',
            name: 'Current Period',
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-01-15'),
            status: 'open',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'previous',
            name: 'Previous Period',
            startDate: new Date('2023-12-16'),
            endDate: new Date('2023-12-31'),
            status: 'closed',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
    });
  }
  return Promise.reject(new Error('Unknown API endpoint'));
});

// Mock child components
vi.mock(
  '@/components/features/reports/payroll-breakdown/department-breakdown',
  () => ({
    DepartmentBreakdown: ({ departments, user }: any) => (
      <div data-testid="department-breakdown">
        <div>Department Breakdown for {user?.fullName}</div>
        <div>Departments: {departments?.length || 0}</div>
        {departments?.map((dept: any, index: number) => (
          <div key={index} data-testid={`department-${dept.department}`}>
            {dept.department}: {dept.hours}h @ ${dept.rate}/hr = $
            {dept.grossPay}
          </div>
        ))}
      </div>
    ),
  })
);

vi.mock(
  '@/components/features/reports/payroll-breakdown/tips-detail-view',
  () => ({
    TipsDetailView: ({ tips, totalTips }: any) => (
      <div data-testid="tips-detail-view">
        <div>Total Tips: ${totalTips}</div>
        <div>Tip Entries: {tips?.length || 0}</div>
        {tips?.map((tip: any, index: number) => (
          <div key={index} data-testid={`tip-${index}`}>
            {tip.jobId}: ${tip.amount} ({tip.jobType})
          </div>
        ))}
      </div>
    ),
  })
);

vi.mock(
  '@/components/features/reports/payroll-breakdown/rate-information-panel',
  () => ({
    RateInformationPanel: ({ user, departmentHours }: any) => (
      <div data-testid="rate-information-panel">
        <div>Rate Information for {user?.fullName}</div>
        <div>Role: {user?.roles?.join(', ')}</div>
        <div>
          Departments worked: {Object.keys(departmentHours || {}).length}
        </div>
      </div>
    ),
  })
);

vi.mock(
  '@/components/features/reports/payroll-breakdown/daily-work-calendar',
  () => ({
    DailyWorkCalendar: ({ workEntries }: any) => (
      <div data-testid="daily-work-calendar">
        <div>Work Entries: {workEntries?.length || 0}</div>
        {workEntries?.map((entry: any, index: number) => (
          <div key={index} data-testid={`work-entry-${index}`}>
            {entry.date.toDateString()}: {entry.role} - ${entry.tips} tips
          </div>
        ))}
      </div>
    ),
  })
);

vi.mock(
  '@/components/features/reports/payroll-breakdown/pay-period-analysis',
  () => ({
    PayPeriodAnalysis: ({ userId }: any) => (
      <div data-testid="pay-period-analysis">
        Pay Period Analysis for user: {userId}
      </div>
    ),
  })
);

describe('Wingman Payroll Access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Wingman can access My Payroll section', () => {
    it('should allow wingman to view payroll summary', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Verify wingman can see their payroll data
      expect(
        screen.getByText('View your compensation details and pay history')
      ).toBeInTheDocument();

      // Wait for summary cards to load
      await waitFor(() => {
        expect(screen.getByText('$1,200.00')).toBeInTheDocument(); // Total pay
      });

      expect(screen.getByText('80')).toBeInTheDocument(); // Total hours
      expect(screen.getByText('$150.00')).toBeInTheDocument(); // Tips
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // Bonuses
    });

    it('should display tips analysis for wingman', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Click on tips tab
      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: /tips/i }));
      });

      // Wait for tips tab to be active
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /tips/i })).toHaveAttribute(
          'data-state',
          'active'
        );
      });

      // Verify tips details are shown
      await waitFor(() => {
        expect(screen.getByTestId('tips-detail-view')).toBeInTheDocument();
      });

      expect(screen.getByText('Total Tips: $150')).toBeInTheDocument();
      expect(screen.getByText('Tip Entries: 2')).toBeInTheDocument();
      expect(screen.getByTestId('tip-0')).toHaveTextContent(
        'job-1: $25 (junk)'
      );
      expect(screen.getByTestId('tip-1')).toHaveTextContent(
        'job-2: $30 (move)'
      );
    });

    it('should show time period filtering for wingman', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Verify pay period selector is available
      expect(screen.getByRole('combobox')).toBeInTheDocument();

      // Click to open the selector
      await act(async () => {
        fireEvent.click(screen.getByRole('combobox'));
      });

      // Wait for options to appear
      await waitFor(() => {
        expect(screen.getByText('Current Period')).toBeInTheDocument();
      });
    });

    it('should display rate information and average calculations for wingman', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Verify breakdown tab shows rate information
      await waitFor(() => {
        expect(
          screen.getByTestId('rate-information-panel')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('Rate Information for Test Wingman')
      ).toBeInTheDocument();
      expect(screen.getByText('Role: wingman')).toBeInTheDocument();
      expect(screen.getByText('Departments worked: 2')).toBeInTheDocument();

      // Verify department breakdown shows rates
      expect(screen.getByTestId('department-breakdown')).toBeInTheDocument();
      expect(
        screen.getByText('Department Breakdown for Test Wingman')
      ).toBeInTheDocument();
      expect(screen.getByTestId('department-junk')).toHaveTextContent(
        'junk: 60h @ $12.5/hr = $750'
      );
      expect(screen.getByTestId('department-move')).toHaveTextContent(
        'move: 20h @ $12.5/hr = $250'
      );
    });
  });

  describe('Role-based access control', () => {
    it('should allow wingman role to access payroll components', () => {
      const TestComponent = () => (
        <RoleGuard requiredRoles={['wingman', 'captain', 'manager', 'admin']}>
          <div data-testid="payroll-content">Payroll Content</div>
        </RoleGuard>
      );

      render(<TestComponent />);

      expect(screen.getByTestId('payroll-content')).toBeInTheDocument();
    });

    it('should deny access to wingman for admin-only content', () => {
      const TestComponent = () => (
        <RoleGuard requiredRoles={['admin']}>
          <div data-testid="admin-content">Admin Content</div>
        </RoleGuard>
      );

      render(<TestComponent />);

      expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
      expect(
        screen.getByText(/You don't have permission to view this content/)
      ).toBeInTheDocument();
    });
  });

  describe('Wingman work history and daily breakdown', () => {
    it('should show daily work calendar for wingman', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Click on daily work tab
      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: /work/i }));
      });

      // Wait for daily work tab to be active
      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /work/i })).toHaveAttribute(
          'data-state',
          'active'
        );
      });

      // Verify daily work calendar is shown
      await waitFor(() => {
        expect(screen.getByTestId('daily-work-calendar')).toBeInTheDocument();
      });

      expect(screen.getByText('Work Entries: 2')).toBeInTheDocument();
      expect(screen.getByTestId('work-entry-0')).toHaveTextContent(
        'wingman - $25 tips'
      );
      expect(screen.getByTestId('work-entry-1')).toHaveTextContent(
        'wingman - $30 tips'
      );
    });
  });

  describe('Data validation for wingman role', () => {
    it('should not show commission data for wingman', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Verify no commission-related content is shown
      expect(screen.queryByText(/commission/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/sales/i)).not.toBeInTheDocument();
    });

    it('should show appropriate wingman rates', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Verify wingman rates are displayed correctly
      await waitFor(() => {
        expect(screen.getByTestId('department-junk')).toHaveTextContent(
          '$12.5/hr'
        );
        expect(screen.getByTestId('department-move')).toHaveTextContent(
          '$12.5/hr'
        );
      });
    });
  });

  describe('Time period filtering functionality', () => {
    it('should allow wingman to filter by current pay period', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Verify current period is selected by default
      expect(screen.getByRole('combobox')).toBeInTheDocument();

      // The current period should be showing in the summary
      expect(screen.getByText('Current Period')).toBeInTheDocument();
    });

    it('should allow wingman to filter by previous pay period', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Click to open pay period selector
      await act(async () => {
        fireEvent.click(screen.getByRole('combobox'));
      });

      // Wait for options and verify previous period is available
      await waitFor(() => {
        expect(screen.getByText('Previous Period')).toBeInTheDocument();
      });
    });

    it('should allow wingman to view all time data', async () => {
      await act(async () => {
        render(<MyPayrollView userId="wingman-1" />);
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('My Payroll')).toBeInTheDocument();
      });

      // Click on history tab to see historical data
      await act(async () => {
        fireEvent.click(screen.getByRole('tab', { name: /pay history/i }));
      });

      // Wait for history tab to be active
      await waitFor(() => {
        expect(
          screen.getByRole('tab', { name: /pay history/i })
        ).toHaveAttribute('data-state', 'active');
      });

      // Verify pay period analysis is shown
      await waitFor(() => {
        expect(screen.getByTestId('pay-period-analysis')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Pay Period Analysis for user: wingman-1')
      ).toBeInTheDocument();
    });
  });
});
