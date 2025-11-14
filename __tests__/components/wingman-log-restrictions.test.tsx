import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RoleGuard } from '@/components/auth/role-guard';
import type { SessionUser } from '@/lib/auth';

// Mock wingman user
const mockWingmanUser: SessionUser = {
  id: 'wingman-1',
  email: 'wingman@test.com',
  fullName: 'Test Wingman',
  roles: ['wingman'],
};

// Mock captain user for comparison
const mockCaptainUser: SessionUser = {
  id: 'captain-1',
  email: 'captain@test.com',
  fullName: 'Test Captain',
  roles: ['captain'],
};

// Mock the session hook to simulate different users
let currentMockUser = mockWingmanUser;

vi.mock('@/hooks/useSession', () => ({
  useSession: () => ({
    user: currentMockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('Wingman Log Submission Restrictions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockUser = mockWingmanUser; // Reset to wingman user
  });

  describe('Log creation access control', () => {
    it('should deny wingman access to log creation', () => {
      const LogCreationComponent = () => (
        <RoleGuard requiredRoles={['captain', 'manager', 'admin']}>
          <div data-testid="log-creation-form">
            <h1>Create Daily Log</h1>
            <form>
              <button type="submit">Submit Log</button>
            </form>
          </div>
        </RoleGuard>
      );

      render(<LogCreationComponent />);

      // Wingman should not see the log creation form
      expect(screen.queryByTestId('log-creation-form')).not.toBeInTheDocument();
      expect(
        screen.getByText(/You don't have permission to view this content/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Required roles: captain or manager or admin/)
      ).toBeInTheDocument();
    });

    it('should allow captain access to log creation', () => {
      // Switch to captain user
      currentMockUser = mockCaptainUser;

      const LogCreationComponent = () => (
        <RoleGuard requiredRoles={['captain', 'manager', 'admin']}>
          <div data-testid="log-creation-form">
            <h1>Create Daily Log</h1>
            <form>
              <button type="submit">Submit Log</button>
            </form>
          </div>
        </RoleGuard>
      );

      render(<LogCreationComponent />);

      // Captain should see the log creation form
      expect(screen.getByTestId('log-creation-form')).toBeInTheDocument();
      expect(screen.getByText('Create Daily Log')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Submit Log' })
      ).toBeInTheDocument();
    });
  });

  describe('Log editing access control', () => {
    it('should deny wingman access to log editing', () => {
      const LogEditComponent = () => (
        <RoleGuard requiredRoles={['captain', 'manager', 'admin']}>
          <div data-testid="log-edit-form">
            <h1>Edit Daily Log</h1>
            <form>
              <button type="submit">Update Log</button>
            </form>
          </div>
        </RoleGuard>
      );

      render(<LogEditComponent />);

      // Wingman should not see the log edit form
      expect(screen.queryByTestId('log-edit-form')).not.toBeInTheDocument();
      expect(
        screen.getByText(/You don't have permission to view this content/)
      ).toBeInTheDocument();
    });

    it('should allow captain access to log editing', () => {
      // Switch to captain user
      currentMockUser = mockCaptainUser;

      const LogEditComponent = () => (
        <RoleGuard requiredRoles={['captain', 'manager', 'admin']}>
          <div data-testid="log-edit-form">
            <h1>Edit Daily Log</h1>
            <form>
              <button type="submit">Update Log</button>
            </form>
          </div>
        </RoleGuard>
      );

      render(<LogEditComponent />);

      // Captain should see the log edit form
      expect(screen.getByTestId('log-edit-form')).toBeInTheDocument();
      expect(screen.getByText('Edit Daily Log')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Update Log' })
      ).toBeInTheDocument();
    });
  });

  describe('Navigation restrictions for wingman', () => {
    it('should allow wingman to access payroll but not log creation', () => {
      // Test payroll access (should be allowed)
      const PayrollComponent = () => (
        <RoleGuard requiredRoles={['wingman', 'captain', 'manager', 'admin']}>
          <div data-testid="payroll-access">
            <h1>My Payroll</h1>
            <p>View your compensation details</p>
          </div>
        </RoleGuard>
      );

      const { rerender } = render(<PayrollComponent />);

      // Wingman should see payroll
      expect(screen.getByTestId('payroll-access')).toBeInTheDocument();
      expect(screen.getByText('My Payroll')).toBeInTheDocument();

      // Test log creation access (should be denied)
      const LogCreationComponent = () => (
        <RoleGuard requiredRoles={['captain', 'manager', 'admin']}>
          <div data-testid="log-creation">
            <h1>Create Log</h1>
            <p>Submit daily work log</p>
          </div>
        </RoleGuard>
      );

      rerender(<LogCreationComponent />);

      // Wingman should not see log creation
      expect(screen.queryByTestId('log-creation')).not.toBeInTheDocument();
      expect(
        screen.getByText(/You don't have permission to view this content/)
      ).toBeInTheDocument();
    });
  });

  describe('Role-specific UI elements', () => {
    it('should show appropriate navigation items for wingman', () => {
      const NavigationComponent = () => (
        <nav data-testid="navigation">
          {/* Always visible items */}
          <RoleGuard requiredRoles={['wingman', 'captain', 'manager', 'admin']}>
            <a href="/reports/my-payroll" data-testid="payroll-link">
              My Payroll
            </a>
          </RoleGuard>

          {/* Captain/Manager/Admin only items */}
          <RoleGuard requiredRoles={['captain', 'manager', 'admin']}>
            <a href="/logs/create" data-testid="create-log-link">
              Create Log
            </a>
          </RoleGuard>

          {/* Manager/Admin only items */}
          <RoleGuard requiredRoles={['manager', 'admin']}>
            <a href="/logs/review" data-testid="review-logs-link">
              Review Logs
            </a>
          </RoleGuard>

          {/* Admin only items */}
          <RoleGuard requiredRoles={['admin']}>
            <a href="/admin/users" data-testid="manage-users-link">
              Manage Users
            </a>
          </RoleGuard>
        </nav>
      );

      render(<NavigationComponent />);

      // Wingman should see payroll link
      expect(screen.getByTestId('payroll-link')).toBeInTheDocument();

      // Wingman should not see captain/manager/admin links
      expect(screen.queryByTestId('create-log-link')).not.toBeInTheDocument();
      expect(screen.queryByTestId('review-logs-link')).not.toBeInTheDocument();
      expect(screen.queryByTestId('manage-users-link')).not.toBeInTheDocument();
    });

    it('should show different navigation items for captain', () => {
      // Switch to captain user
      currentMockUser = mockCaptainUser;

      const NavigationComponent = () => (
        <nav data-testid="navigation">
          {/* Always visible items */}
          <RoleGuard requiredRoles={['wingman', 'captain', 'manager', 'admin']}>
            <a href="/reports/my-payroll" data-testid="payroll-link">
              My Payroll
            </a>
          </RoleGuard>

          {/* Captain/Manager/Admin only items */}
          <RoleGuard requiredRoles={['captain', 'manager', 'admin']}>
            <a href="/logs/create" data-testid="create-log-link">
              Create Log
            </a>
          </RoleGuard>

          {/* Manager/Admin only items */}
          <RoleGuard requiredRoles={['manager', 'admin']}>
            <a href="/logs/review" data-testid="review-logs-link">
              Review Logs
            </a>
          </RoleGuard>

          {/* Admin only items */}
          <RoleGuard requiredRoles={['admin']}>
            <a href="/admin/users" data-testid="manage-users-link">
              Manage Users
            </a>
          </RoleGuard>
        </nav>
      );

      render(<NavigationComponent />);

      // Captain should see payroll and create log links
      expect(screen.getByTestId('payroll-link')).toBeInTheDocument();
      expect(screen.getByTestId('create-log-link')).toBeInTheDocument();

      // Captain should not see manager/admin only links
      expect(screen.queryByTestId('review-logs-link')).not.toBeInTheDocument();
      expect(screen.queryByTestId('manage-users-link')).not.toBeInTheDocument();
    });
  });

  describe('API endpoint access control', () => {
    it('should verify wingman cannot access log creation endpoints', () => {
      // This would typically be tested at the API level, but we can test the client-side restrictions
      const LogSubmissionComponent = () => {
        const handleSubmit = () => {
          // This would normally make an API call
          // For testing, we just verify the UI doesn't allow it
        };

        return (
          <RoleGuard requiredRoles={['captain', 'manager', 'admin']}>
            <form onSubmit={handleSubmit} data-testid="log-submission-form">
              <button type="submit">Submit Log</button>
            </form>
          </RoleGuard>
        );
      };

      render(<LogSubmissionComponent />);

      // Wingman should not see the form
      expect(
        screen.queryByTestId('log-submission-form')
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(/You don't have permission to view this content/)
      ).toBeInTheDocument();
    });

    it('should verify wingman can access payroll endpoints', () => {
      const PayrollDataComponent = () => (
        <RoleGuard requiredRoles={['wingman', 'captain', 'manager', 'admin']}>
          <div data-testid="payroll-data">
            <p>Payroll data would be loaded here</p>
            <button>Refresh Payroll Data</button>
          </div>
        </RoleGuard>
      );

      render(<PayrollDataComponent />);

      // Wingman should see payroll data
      expect(screen.getByTestId('payroll-data')).toBeInTheDocument();
      expect(
        screen.getByText('Payroll data would be loaded here')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Refresh Payroll Data' })
      ).toBeInTheDocument();
    });
  });

  describe('Error handling for unauthorized access', () => {
    it('should show appropriate error message when wingman tries to access restricted content', () => {
      const RestrictedComponent = () => (
        <RoleGuard
          requiredRoles={['captain', 'manager', 'admin']}
          fallback={
            <div data-testid="custom-error">
              <h2>Access Denied</h2>
              <p>
                Wingmen cannot submit logs. Please contact your captain or
                manager.
              </p>
            </div>
          }
        >
          <div data-testid="restricted-content">This content is restricted</div>
        </RoleGuard>
      );

      render(<RestrictedComponent />);

      // Should show custom error message
      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Wingmen cannot submit logs. Please contact your captain or manager.'
        )
      ).toBeInTheDocument();

      // Should not show restricted content
      expect(
        screen.queryByTestId('restricted-content')
      ).not.toBeInTheDocument();
    });
  });
});
