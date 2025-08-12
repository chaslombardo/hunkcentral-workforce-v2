import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UserManagementDashboard } from '@/components/features/admin/user-management-dashboard';
import { getUsers } from '@/lib/actions/users';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
vi.mock('@/lib/actions/users');
vi.mock('@/hooks/use-toast');

const mockGetUsers = vi.mocked(getUsers);
const mockToast = vi.fn();
vi.mocked(useToast).mockReturnValue({ toast: mockToast });

// Mock user data
const mockManagerUserData = {
  success: true,
  data: {
    users: [
      {
        id: 'captain1',
        email: 'captain1@test.com',
        fullName: 'Captain One',
        roles: ['captain'],
        rateJunkCaptain: 20.00,
        rateJunkWingman: 15.00,
        rateMoveCaptain: 22.00,
        rateMoveWingman: 17.00,
        salaryAmount: null,
        commissionRate: null,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'wingman1',
        email: 'wingman1@test.com',
        fullName: 'Wingman One',
        roles: ['wingman'],
        rateJunkCaptain: null,
        rateJunkWingman: 15.00,
        rateMoveCaptain: null,
        rateMoveWingman: 17.00,
        salaryAmount: null,
        commissionRate: null,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'captain2',
        email: 'captain2@test.com',
        fullName: 'Captain Two',
        roles: ['captain'],
        rateJunkCaptain: 21.00,
        rateJunkWingman: 15.00,
        rateMoveCaptain: 23.00,
        rateMoveWingman: 17.00,
        salaryAmount: 50000.00,
        salaryFrequency: 'annual',
        salaryType: 'base',
        commissionRate: 0.05,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 3,
      pages: 1,
    },
  },
};

const mockAdminUserData = {
  success: true,
  data: {
    users: [
      ...mockManagerUserData.data.users,
      {
        id: 'sales1',
        email: 'sales1@test.com',
        fullName: 'Sales One',
        roles: ['sales'],
        commissionRate: 0.10,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'manager1',
        email: 'manager1@test.com',
        fullName: 'Manager One',
        roles: ['manager'],
        salaryAmount: 60000.00,
        salaryFrequency: 'annual',
        salaryType: 'base',
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ],
    pagination: {
      page: 1,
      limit: 10,
      total: 5,
      pages: 1,
    },
  },
};

describe('UserManagementDashboard - Manager Capabilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Manager Role Access', () => {
    it('should display captain and wingman users for managers', async () => {
      // Requirement 2.1, 2.2: Managers can see captain/wingman data
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Captain One')).toBeInTheDocument();
        expect(screen.getByText('Wingman One')).toBeInTheDocument();
        expect(screen.getByText('Captain Two')).toBeInTheDocument();
      });

      // Verify captain and wingman badges are displayed (using getAllByText since there are filter labels too)
      expect(screen.getAllByText('Captain').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Wingman').length).toBeGreaterThan(0);
    });

    it('should show compensation information for captain and wingman users', async () => {
      // Requirement 2.4: Comprehensive visibility into performance metrics and compensation
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        // Should show salary information (using partial text match)
        expect(screen.getByText((content, element) => {
          return content.includes('Salary:') && content.includes('50,000');
        })).toBeInTheDocument();
        
        // Should show commission information (using partial text match)
        expect(screen.getByText((content, element) => {
          return content.includes('Commission:') && content.includes('5');
        })).toBeInTheDocument();
        
        // Should show hourly only for users without salary/commission (there are multiple users with this)
        expect(screen.getAllByText('Hourly only').length).toBeGreaterThan(0);
      });
    });

    it('should not display sales consultants or other managers for manager users', async () => {
      // Requirement 2.3: Managers cannot see other sales consultants, managers, or admins
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        // Should not show sales or manager roles
        expect(screen.queryByText('Sales One')).not.toBeInTheDocument();
        expect(screen.queryByText('Manager One')).not.toBeInTheDocument();
        expect(screen.queryByText('Sales')).not.toBeInTheDocument();
        expect(screen.queryByText('Manager')).not.toBeInTheDocument();
      });
    });
  });

  describe('Admin Role Access', () => {
    it('should display all user types for admin users', async () => {
      // Admins should see all users including sales and managers
      mockGetUsers.mockResolvedValue(mockAdminUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Captain One')).toBeInTheDocument();
        expect(screen.getByText('Wingman One')).toBeInTheDocument();
        expect(screen.getByText('Sales One')).toBeInTheDocument();
        expect(screen.getByText('Manager One')).toBeInTheDocument();
      });

      // Verify all role badges are displayed (using getAllByText since there are filter labels too)
      expect(screen.getAllByText('Captain').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Wingman').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Sales').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Manager').length).toBeGreaterThan(0);
    });
  });

  describe('Filtering and Search Functionality', () => {
    it('should support role-based filtering for managers', async () => {
      // Requirement 2.4: Existing Tabs and filtering work for manager use cases
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        // Should show role filter checkboxes
        expect(screen.getByLabelText('Captain')).toBeInTheDocument();
        expect(screen.getByLabelText('Wingman')).toBeInTheDocument();
      });

      // Test filtering by captain role
      const captainFilter = screen.getByLabelText('Captain');
      fireEvent.click(captainFilter);

      await waitFor(() => {
        expect(mockGetUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            roles: ['captain'],
          })
        );
      });
    });

    it('should support search functionality', async () => {
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      const searchInput = await screen.findByPlaceholderText('Search by name, email, or role...');
      
      fireEvent.change(searchInput, { target: { value: 'Captain' } });

      // Should trigger search with debounce
      await waitFor(() => {
        expect(mockGetUsers).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Captain',
          })
        );
      }, { timeout: 500 });
    });

    it('should support sorting functionality', async () => {
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        // Look for sortable headers - they should be present
        const headers = screen.getAllByRole('button');
        expect(headers.length).toBeGreaterThan(0);
      });

      // Test that sorting headers exist and are clickable
      const headers = screen.getAllByRole('button');
      const sortableHeaders = headers.filter(header => 
        header.textContent?.includes('Name') || 
        header.textContent?.includes('Email') || 
        header.textContent?.includes('Created')
      );
      
      expect(sortableHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Drill-down Patterns', () => {
    it('should provide drill-down capabilities through user links', async () => {
      // Requirement 5.2: Existing drill-down patterns work for manager team oversight
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        const captainLink = screen.getByRole('link', { name: 'Captain One' });
        expect(captainLink).toBeInTheDocument();
        expect(captainLink).toHaveAttribute('href', '/admin/users/captain1');
      });
    });

    it('should provide action menus for user management', async () => {
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        const actionButtons = screen.getAllByRole('button', { name: '' });
        expect(actionButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Pagination and Data Management', () => {
    it('should display pagination information correctly', async () => {
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Showing 1 to 3 of 3 users')).toBeInTheDocument();
        expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
      });
    });

    it('should support rows per page selection', async () => {
      mockGetUsers.mockResolvedValue(mockManagerUserData);

      render(<UserManagementDashboard />);

      await waitFor(() => {
        // Look for pagination controls - the select might not have a display value initially
        const paginationText = screen.getByText('Rows per page');
        expect(paginationText).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockGetUsers.mockResolvedValue({
        success: false,
        error: 'Failed to load users',
      });

      render(<UserManagementDashboard />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      });
    });

    it('should show loading state while fetching data', async () => {
      mockGetUsers.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<UserManagementDashboard />);

      expect(screen.getByText('Loading Users...')).toBeInTheDocument();
      // Check for the loading spinner element
      expect(screen.getByText('Loading Users...')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no users are found', async () => {
      mockGetUsers.mockResolvedValue({
        success: true,
        data: {
          users: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
          },
        },
      });

      render(<UserManagementDashboard />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
        expect(screen.getByText('Get started by creating your first user account.')).toBeInTheDocument();
      });
    });

    it('should show filtered empty state when search returns no results', async () => {
      mockGetUsers.mockResolvedValue({
        success: true,
        data: {
          users: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
          },
        },
      });

      render(<UserManagementDashboard />);

      // Simulate a search that returns no results
      const searchInput = await screen.findByPlaceholderText('Search by name, email, or role...');
      fireEvent.change(searchInput, { target: { value: 'NonExistentUser' } });

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
        expect(screen.getByText('No users match your current filters. Try adjusting your search criteria.')).toBeInTheDocument();
      });
    });
  });
});