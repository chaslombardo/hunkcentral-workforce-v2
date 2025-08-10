/**
 * Navigation Flow Integration Tests
 * 
 * Tests for the enhanced navigation system including smart breadcrumbs,
 * unified mobile navigation, and navigation state management.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Mock Next.js navigation
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock navigation context
const mockNavigationContext = {
  currentPath: '/dashboard',
  breadcrumbs: [
    { label: 'Dashboard', href: '/dashboard' }
  ],
  navigationState: {
    pendingLogs: 3,
    draftLogs: 1,
    pendingCommissions: 2,
  },
  updateNavigationState: vi.fn(),
};

vi.mock('@/contexts/navigation-context', () => ({
  useNavigationContext: () => mockNavigationContext,
  NavigationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Home: ({ className }: { className?: string }) => <div data-testid="home-icon" className={className} />,
  FileText: ({ className }: { className?: string }) => <div data-testid="file-icon" className={className} />,
  DollarSign: ({ className }: { className?: string }) => <div data-testid="dollar-icon" className={className} />,
  BarChart3: ({ className }: { className?: string }) => <div data-testid="chart-icon" className={className} />,
  Settings: ({ className }: { className?: string }) => <div data-testid="settings-icon" className={className} />,
  Users: ({ className }: { className?: string }) => <div data-testid="users-icon" className={className} />,
  ChevronRight: ({ className }: { className?: string }) => <div data-testid="chevron-right-icon" className={className} />,
  Menu: ({ className }: { className?: string }) => <div data-testid="menu-icon" className={className} />,
  X: ({ className }: { className?: string }) => <div data-testid="x-icon" className={className} />,
  Bell: ({ className }: { className?: string }) => <div data-testid="bell-icon" className={className} />,
}));

// Import components to test
import { SmartBreadcrumbs } from '@/components/layout/smart-breadcrumbs';
import { EnhancedSidebar } from '@/components/layout/enhanced-sidebar';
import { MobileNavigation } from '@/components/layout/mobile-navigation';
import { NavigationBadges } from '@/components/layout/navigation-badges';

describe('Navigation Flow Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Smart Breadcrumbs Navigation', () => {
    it('renders breadcrumbs with proper navigation structure', () => {
      const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Logs', href: '/logs' },
        { label: 'Create Log', href: '/logs/create' },
      ];

      render(<SmartBreadcrumbs breadcrumbs={breadcrumbs} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Create Log')).toBeInTheDocument();

      // Should show separators between breadcrumbs
      expect(screen.getAllByTestId('chevron-right-icon')).toHaveLength(2);
    });

    it('handles breadcrumb navigation clicks', async () => {
      const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Logs', href: '/logs' },
        { label: 'Create Log', href: '/logs/create' },
      ];

      render(<SmartBreadcrumbs breadcrumbs={breadcrumbs} />);

      const dashboardLink = screen.getByText('Dashboard');
      await user.click(dashboardLink);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('shows current page as non-clickable', () => {
      const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Current Page', href: '/current', current: true },
      ];

      render(<SmartBreadcrumbs breadcrumbs={breadcrumbs} />);

      const currentPage = screen.getByText('Current Page');
      expect(currentPage).not.toHaveAttribute('href');
      expect(currentPage).toHaveClass('text-foreground'); // Current page styling
    });

    it('handles parameterized routes correctly', () => {
      const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Logs', href: '/logs' },
        { label: 'Log #12345', href: '/logs/12345', current: true },
      ];

      render(<SmartBreadcrumbs breadcrumbs={breadcrumbs} />);

      expect(screen.getByText('Log #12345')).toBeInTheDocument();
    });

    it('is responsive on mobile devices', () => {
      const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Very Long Page Name That Should Truncate', href: '/long-page', current: true },
      ];

      render(<SmartBreadcrumbs breadcrumbs={breadcrumbs} />);

      const longPageName = screen.getByText('Very Long Page Name That Should Truncate');
      expect(longPageName).toHaveClass('truncate'); // Should truncate on mobile
    });
  });

  describe('Enhanced Sidebar Navigation', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'CAPTAIN',
    };

    it('renders navigation groups with role-based filtering', () => {
      render(<EnhancedSidebar user={mockUser} />);

      // Should show captain-appropriate navigation
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Logs')).toBeInTheDocument();
      expect(screen.getByText('Commission')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();

      // Should not show admin-only sections for captain
      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });

    it('shows admin sections for admin users', () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      render(<EnhancedSidebar user={adminUser} />);

      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Pay Periods')).toBeInTheDocument();
      expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    });

    it('handles navigation item clicks', async () => {
      render(<EnhancedSidebar user={mockUser} />);

      const logsLink = screen.getByText('Logs');
      await user.click(logsLink);

      expect(mockPush).toHaveBeenCalledWith('/logs');
    });

    it('shows active state for current page', () => {
      // Mock current path as logs
      vi.mocked(require('next/navigation').usePathname).mockReturnValue('/logs');

      render(<EnhancedSidebar user={mockUser} />);

      const logsLink = screen.getByText('Logs');
      expect(logsLink.closest('a')).toHaveClass('bg-hunks-green/10'); // Active state styling
    });

    it('displays navigation badges for pending items', () => {
      render(<EnhancedSidebar user={mockUser} />);

      // Should show badges for pending items
      expect(screen.getByText('3')).toBeInTheDocument(); // Pending logs
      expect(screen.getByText('1')).toBeInTheDocument(); // Draft logs
      expect(screen.getByText('2')).toBeInTheDocument(); // Pending commissions
    });

    it('groups navigation items with visual separators', () => {
      render(<EnhancedSidebar user={mockUser} />);

      const separators = screen.getAllByRole('separator');
      expect(separators.length).toBeGreaterThan(0);
    });

    it('is collapsible on desktop', async () => {
      render(<EnhancedSidebar user={mockUser} collapsible />);

      const collapseButton = screen.getByLabelText('Toggle sidebar');
      await user.click(collapseButton);

      // Should collapse sidebar (hide text, show only icons)
      const sidebar = screen.getByRole('navigation');
      expect(sidebar).toHaveClass('w-16'); // Collapsed width
    });
  });

  describe('Mobile Navigation', () => {
    it('renders unified mobile navigation', () => {
      render(<MobileNavigation user={mockUser} />);

      // Should show mobile-appropriate navigation items
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
      expect(screen.getByTestId('dollar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
    });

    it('has proper touch targets for mobile', () => {
      render(<MobileNavigation user={mockUser} />);

      const navButtons = screen.getAllByRole('button');
      navButtons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Should have minimum 48px touch targets
        expect(button).toHaveClass('h-12'); // 48px in Tailwind
      });
    });

    it('shows active state for current page', () => {
      render(<MobileNavigation user={mockUser} />);

      const activeButton = screen.getByLabelText('Dashboard');
      expect(activeButton).toHaveClass('text-hunks-green'); // Active state color
    });

    it('handles navigation with haptic feedback', async () => {
      // Mock haptic feedback
      const mockVibrate = vi.fn();
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
      });

      render(<MobileNavigation user={mockUser} />);

      const logsButton = screen.getByLabelText('Logs');
      await user.click(logsButton);

      expect(mockVibrate).toHaveBeenCalledWith(10); // Light haptic feedback
      expect(mockPush).toHaveBeenCalledWith('/logs');
    });

    it('shows notification badges on mobile', () => {
      render(<MobileNavigation user={mockUser} />);

      // Should show badges for pending items
      const badges = screen.getAllByText(/[0-9]+/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('adapts to different screen sizes', () => {
      render(<MobileNavigation user={mockUser} />);

      const navigation = screen.getByRole('navigation');
      expect(navigation).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0'); // Bottom navigation
    });
  });

  describe('Navigation State Management', () => {
    it('updates navigation badges when state changes', async () => {
      const { rerender } = render(<NavigationBadges navigationState={mockNavigationContext.navigationState} />);

      expect(screen.getByText('3')).toBeInTheDocument(); // Initial pending logs

      // Update state
      const updatedState = {
        ...mockNavigationContext.navigationState,
        pendingLogs: 5,
      };

      rerender(<NavigationBadges navigationState={updatedState} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // Updated pending logs
    });

    it('handles real-time updates from server', async () => {
      // Mock WebSocket or polling updates
      const mockUpdateState = vi.fn();
      
      render(
        <div data-testid="navigation-container">
          <NavigationBadges 
            navigationState={mockNavigationContext.navigationState}
            onStateUpdate={mockUpdateState}
          />
        </div>
      );

      // Simulate server update
      fireEvent(window, new CustomEvent('navigation-update', {
        detail: { pendingLogs: 7 }
      }));

      await waitFor(() => {
        expect(mockUpdateState).toHaveBeenCalledWith({ pendingLogs: 7 });
      });
    });

    it('persists navigation state across page reloads', () => {
      // Mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn(() => JSON.stringify(mockNavigationContext.navigationState)),
        setItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
      });

      render(<NavigationBadges navigationState={mockNavigationContext.navigationState} />);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('navigation-state');
    });
  });

  describe('Complete Navigation Flow', () => {
    it('completes full navigation workflow from sidebar to breadcrumbs', async () => {
      const TestNavigationFlow = () => {
        const [currentPath, setCurrentPath] = React.useState('/dashboard');
        const [breadcrumbs, setBreadcrumbs] = React.useState([
          { label: 'Dashboard', href: '/dashboard', current: true }
        ]);

        const handleNavigation = (path: string) => {
          setCurrentPath(path);
          
          // Update breadcrumbs based on path
          if (path === '/logs') {
            setBreadcrumbs([
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Logs', href: '/logs', current: true }
            ]);
          } else if (path === '/logs/create') {
            setBreadcrumbs([
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Logs', href: '/logs' },
              { label: 'Create Log', href: '/logs/create', current: true }
            ]);
          }
        };

        return (
          <div data-testid="navigation-flow">
            <SmartBreadcrumbs breadcrumbs={breadcrumbs} />
            <EnhancedSidebar 
              user={mockUser} 
              onNavigate={handleNavigation}
            />
          </div>
        );
      };

      render(<TestNavigationFlow />);

      // Start at dashboard
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Navigate to logs via sidebar
      const logsLink = screen.getByText('Logs');
      await user.click(logsLink);

      // Breadcrumbs should update
      await waitFor(() => {
        const breadcrumbItems = screen.getAllByText('Logs');
        expect(breadcrumbItems.length).toBeGreaterThan(0);
      });

      // Navigate back via breadcrumbs
      const dashboardBreadcrumb = screen.getByText('Dashboard');
      await user.click(dashboardBreadcrumb);

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('maintains consistent state across desktop and mobile navigation', async () => {
      const TestResponsiveNavigation = () => {
        const [isMobile, setIsMobile] = React.useState(false);

        return (
          <div data-testid="responsive-navigation">
            <button onClick={() => setIsMobile(!isMobile)}>
              Toggle Mobile
            </button>
            {isMobile ? (
              <MobileNavigation user={mockUser} />
            ) : (
              <EnhancedSidebar user={mockUser} />
            )}
          </div>
        );
      };

      render(<TestResponsiveNavigation />);

      // Start with desktop navigation
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Switch to mobile
      const toggleButton = screen.getByText('Toggle Mobile');
      await user.click(toggleButton);

      // Should show mobile navigation with same functionality
      expect(screen.getByTestId('home-icon')).toBeInTheDocument();
      expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
    });

    it('handles navigation errors gracefully', async () => {
      // Mock navigation error
      mockPush.mockRejectedValueOnce(new Error('Navigation failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<EnhancedSidebar user={mockUser} />);

      const logsLink = screen.getByText('Logs');
      await user.click(logsLink);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Navigation error:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('supports keyboard navigation throughout the flow', async () => {
      render(
        <div data-testid="keyboard-navigation">
          <SmartBreadcrumbs breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Logs', href: '/logs', current: true }
          ]} />
          <EnhancedSidebar user={mockUser} />
        </div>
      );

      // Tab through navigation elements
      await user.tab();
      expect(screen.getByText('Dashboard')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Dashboard').closest('nav')?.nextElementSibling?.querySelector('a')).toHaveFocus();

      // Enter should activate navigation
      await user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalled();
    });

    it('maintains accessibility throughout navigation flow', () => {
      render(
        <div data-testid="accessible-navigation">
          <SmartBreadcrumbs breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Current Page', href: '/current', current: true }
          ]} />
          <EnhancedSidebar user={mockUser} />
          <MobileNavigation user={mockUser} />
        </div>
      );

      // Check ARIA labels and roles
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
      
      // Check that current page is properly marked
      const currentPage = screen.getByText('Current Page');
      expect(currentPage).toHaveAttribute('aria-current', 'page');

      // Check mobile navigation accessibility
      const mobileNavButtons = screen.getAllByRole('button');
      mobileNavButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });
});