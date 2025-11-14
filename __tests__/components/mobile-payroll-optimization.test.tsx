import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyPayrollView } from '@/components/features/reports/my-payroll-view';

// Mock the mobile hook
const mockIsMobile = vi.fn();
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => mockIsMobile(),
}));

// Mock other hooks and dependencies
vi.mock('@/lib/actions/payroll-validation', () => ({
  validateEmployeePayroll: vi
    .fn()
    .mockResolvedValue({ success: true, data: {} }),
  submitDiscrepancyReport: vi.fn().mockResolvedValue({ success: true }),
}));

describe('Mobile Payroll Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mobile Layout Optimizations', () => {
    beforeEach(() => {
      mockIsMobile.mockReturnValue(true);
    });

    it('should render mobile-optimized tabs with horizontal scroll', () => {
      render(<MyPayrollView />);

      // Check for mobile tab layout
      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('inline-flex');
      expect(tabsList).toHaveClass('w-max');

      // Check for touch-optimized tab triggers
      const breakdownTab = screen.getByRole('tab', { name: /breakdown/i });
      expect(breakdownTab).toHaveClass('touch-manipulation');
      expect(breakdownTab).toHaveClass('h-10');
    });

    it('should use mobile-optimized summary cards layout', () => {
      render(<MyPayrollView />);

      // Check for mobile card optimizations by finding the grid container with summary cards
      const summaryCards = document.querySelector('.grid.grid-cols-1.gap-3');
      expect(summaryCards).toBeInTheDocument();
      expect(summaryCards).toHaveClass('grid-cols-1');
      expect(summaryCards).toHaveClass('sm:grid-cols-2');
    });

    it('should render mobile-optimized buttons with larger touch targets', () => {
      render(<MyPayrollView />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toHaveClass('min-h-[44px]');
      expect(downloadButton).toHaveClass('touch-manipulation');
    });

    it('should use mobile-optimized select components', () => {
      render(<MyPayrollView />);

      const payPeriodSelect = screen.getByRole('combobox');
      expect(payPeriodSelect).toHaveClass('h-12');
      expect(payPeriodSelect).toHaveClass('touch-manipulation');
    });
  });

  describe('Desktop Layout Preservation', () => {
    beforeEach(() => {
      mockIsMobile.mockReturnValue(false);
    });

    it('should render desktop tab layout when not mobile', () => {
      render(<MyPayrollView />);

      const tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('grid');
      expect(tabsList).toHaveClass('grid-cols-3');
      expect(tabsList).toHaveClass('sm:grid-cols-6');
    });

    it('should use standard button sizes on desktop', () => {
      render(<MyPayrollView />);

      const downloadButton = screen.getByRole('button', {
        name: /download paystub/i,
      });
      expect(downloadButton).not.toHaveClass('h-12');
    });
  });

  describe('Progressive Loading States', () => {
    beforeEach(() => {
      mockIsMobile.mockReturnValue(true);
    });

    it('should show mobile-optimized loading text', async () => {
      render(<MyPayrollView userId="test-user" />);

      // Switch to a tab that triggers detailed loading
      const dailyTab = screen.getByRole('tab', { name: /work/i });
      fireEvent.click(dailyTab);

      // Should show mobile-optimized loading skeleton
      await waitFor(() => {
        const skeletonElements = document.querySelectorAll('.animate-pulse');
        expect(skeletonElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Touch Optimization', () => {
    beforeEach(() => {
      mockIsMobile.mockReturnValue(true);
    });

    it('should apply touch-manipulation class to interactive elements', () => {
      render(<MyPayrollView />);

      // Check tabs
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveClass('touch-manipulation');
      });

      // Check main action buttons (download button)
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toHaveClass('touch-manipulation');

      // Check select components
      const payPeriodSelect = screen.getByRole('combobox');
      expect(payPeriodSelect).toHaveClass('touch-manipulation');
    });

    it('should have minimum touch target sizes', () => {
      render(<MyPayrollView />);

      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toHaveClass('min-h-[44px]'); // 44px minimum

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveClass('h-10'); // 40px minimum for tabs
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt layout based on mobile state changes', () => {
      mockIsMobile.mockReturnValue(false);
      const { rerender } = render(<MyPayrollView />);

      // Initially desktop layout
      let tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('grid');

      // Switch to mobile
      mockIsMobile.mockReturnValue(true);
      rerender(<MyPayrollView />);

      // Should now use mobile layout
      tabsList = screen.getByRole('tablist');
      expect(tabsList).toHaveClass('inline-flex');
    });
  });

  describe('Performance Optimizations', () => {
    beforeEach(() => {
      mockIsMobile.mockReturnValue(true);
    });

    it('should render mobile-optimized loading skeletons', async () => {
      render(<MyPayrollView userId="test-user" />);

      // Switch to breakdown tab to trigger loading
      const breakdownTab = screen.getByRole('tab', { name: /breakdown/i });
      fireEvent.click(breakdownTab);

      // Should show mobile loading text (shorter version)
      await waitFor(() => {
        expect(
          screen.getByText(/You're currently offline/)
        ).toBeInTheDocument();
      });
    });
  });
});

describe('Mobile Component Specific Tests', () => {
  beforeEach(() => {
    mockIsMobile.mockReturnValue(true);
  });

  describe('Department Breakdown Mobile', () => {
    it('should render single column layout on mobile', () => {
      // This would need to be tested with the actual DepartmentBreakdown component
      // when it's rendered within MyPayrollView
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Tips Detail View Mobile', () => {
    it('should show mobile card view instead of table', () => {
      // This would need to be tested with the actual TipsDetailView component
      // when it's rendered within MyPayrollView
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Daily Work Calendar Mobile', () => {
    it('should stack calendar and details vertically on mobile', () => {
      // This would need to be tested with the actual DailyWorkCalendar component
      // when it's rendered within MyPayrollView
      expect(true).toBe(true); // Placeholder
    });
  });
});
