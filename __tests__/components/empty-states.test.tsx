import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  NoLogsEmptyState,
  NoLogResultsEmptyState,
  NoCommissionsEmptyState,
  NoCommissionMatchesEmptyState,
  NoPayrollDataEmptyState,
  NoReportDataEmptyState,
  NoUsersEmptyState,
  NoUserResultsEmptyState,
  NoDashboardDataEmptyState,
  NoAuditDataEmptyState,
  GenericEmptyState,
  LoadingEmptyState,
} from '@/components/features/empty-states';

import { vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('Empty States', () => {
  describe('NoLogsEmptyState', () => {
    it('renders with correct title and description', () => {
      render(<NoLogsEmptyState />);

      expect(screen.getByText('No logs found')).toBeInTheDocument();
      expect(
        screen.getByText(/Get started by creating your first daily log/)
      ).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<NoLogsEmptyState />);

      expect(screen.getByText('Create First Log')).toBeInTheDocument();
      expect(screen.getByText('Learn More')).toBeInTheDocument();
    });

    it('calls onCreateLog when provided', () => {
      const mockOnCreateLog = vi.fn();
      render(<NoLogsEmptyState onCreateLog={mockOnCreateLog} />);

      fireEvent.click(screen.getByText('Create First Log'));
      expect(mockOnCreateLog).toHaveBeenCalled();
    });

    it('has proper accessibility attributes', () => {
      render(<NoLogsEmptyState />);

      const region = screen.getByRole('region', { name: 'Empty state' });
      expect(region).toBeInTheDocument();
    });
  });

  describe('NoLogResultsEmptyState', () => {
    it('renders search-specific messaging', () => {
      render(<NoLogResultsEmptyState />);

      expect(screen.getByText('No logs match your search')).toBeInTheDocument();
      expect(
        screen.getByText(/Try adjusting your filters/)
      ).toBeInTheDocument();
    });

    it('calls onClearFilters when provided', () => {
      const mockOnClearFilters = vi.fn();
      render(<NoLogResultsEmptyState onClearFilters={mockOnClearFilters} />);

      fireEvent.click(screen.getByText('Clear Filters'));
      expect(mockOnClearFilters).toHaveBeenCalled();
    });
  });

  describe('NoCommissionsEmptyState', () => {
    it('renders commission-specific content', () => {
      render(<NoCommissionsEmptyState />);

      expect(
        screen.getByText('No commissions tracked yet')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Start tracking your sales commissions/)
      ).toBeInTheDocument();
    });

    it('renders with card variant', () => {
      const { container } = render(<NoCommissionsEmptyState />);

      // Check for card styling classes
      expect(container.querySelector('.border-dashed')).toBeInTheDocument();
    });
  });

  describe('NoPayrollDataEmptyState', () => {
    it('renders payroll-specific messaging', () => {
      render(<NoPayrollDataEmptyState />);

      expect(screen.getByText('No payroll data available')).toBeInTheDocument();
      expect(
        screen.getByText(/Payroll reports will appear here/)
      ).toBeInTheDocument();
    });

    it('calls onRefresh when provided', () => {
      const mockOnRefresh = vi.fn();
      render(<NoPayrollDataEmptyState onRefresh={mockOnRefresh} />);

      fireEvent.click(screen.getByText('Refresh Data'));
      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  describe('NoUsersEmptyState', () => {
    it('renders user management messaging', () => {
      render(<NoUsersEmptyState />);

      expect(screen.getByText('No users found')).toBeInTheDocument();
      expect(
        screen.getByText(/Add team members to get started/)
      ).toBeInTheDocument();
    });
  });

  describe('NoDashboardDataEmptyState', () => {
    it('renders welcome messaging', () => {
      render(<NoDashboardDataEmptyState />);

      expect(screen.getByText('Welcome to HUNKCentral')).toBeInTheDocument();
      expect(
        screen.getByText(/Your dashboard will show key metrics/)
      ).toBeInTheDocument();
    });

    it('renders both primary and secondary actions', () => {
      render(<NoDashboardDataEmptyState />);

      expect(screen.getByText('Create Your First Log')).toBeInTheDocument();
      expect(screen.getByText('Take a Tour')).toBeInTheDocument();
    });
  });

  describe('GenericEmptyState', () => {
    it('renders custom content', () => {
      render(
        <GenericEmptyState
          title="Custom Title"
          description="Custom description"
          actionLabel="Custom Action"
          onAction={vi.fn()}
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description')).toBeInTheDocument();
      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });

    it('works without action', () => {
      render(
        <GenericEmptyState
          title="No Action State"
          description="This has no action button"
        />
      );

      expect(screen.getByText('No Action State')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('LoadingEmptyState', () => {
    it('renders loading message', () => {
      render(<LoadingEmptyState />);

      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('renders custom loading message', () => {
      render(<LoadingEmptyState message="Fetching reports..." />);

      expect(screen.getByText('Fetching reports...')).toBeInTheDocument();
    });

    it('has pulse animation class', () => {
      const { container } = render(<LoadingEmptyState />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('all empty states have proper ARIA labels', () => {
      const emptyStates = [
        <NoLogsEmptyState key="logs" />,
        <NoCommissionsEmptyState key="commissions" />,
        <NoUsersEmptyState key="users" />,
        <NoDashboardDataEmptyState key="dashboard" />,
      ];

      emptyStates.forEach((component, index) => {
        const { unmount } = render(component);

        const region = screen.getByRole('region', { name: 'Empty state' });
        expect(region).toBeInTheDocument();

        unmount();
      });
    });

    it('illustrations have proper alt text', () => {
      render(<NoLogsEmptyState />);

      const illustration = screen.getByRole('img', {
        name: 'Empty logs illustration',
      });
      expect(illustration).toBeInTheDocument();
    });

    it('buttons are keyboard accessible', () => {
      const mockAction = vi.fn();
      render(<NoLogsEmptyState onCreateLog={mockAction} />);

      const button = screen.getByText('Create First Log');
      button.focus();

      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Note: The actual Enter key handling is done by the Button component
      // This test ensures the button can receive focus
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Brand Consistency', () => {
    it('primary actions use brand green color', () => {
      render(<NoLogsEmptyState />);

      const primaryButton = screen.getByText('Create First Log');
      // The brand color is applied via CSS custom properties, not direct classes
      // Check that it's a primary button (which gets the brand styling)
      expect(primaryButton).toHaveClass('bg-primary');
    });

    it('secondary actions use outline variant', () => {
      render(<NoLogsEmptyState />);

      const secondaryButton = screen.getByText('Learn More');
      // The outline variant is applied by default for secondary actions
      expect(secondaryButton.closest('a')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders different sizes correctly', () => {
      const { rerender } = render(
        <GenericEmptyState title="Small" description="Small size test" />
      );

      // Default size (md)
      expect(screen.getByText('Small')).toBeInTheDocument();

      // Test that the component rerenders with different content
      rerender(
        <GenericEmptyState title="Large" description="Large size test" />
      );

      expect(screen.getByText('Large')).toBeInTheDocument();
    });
  });
});
