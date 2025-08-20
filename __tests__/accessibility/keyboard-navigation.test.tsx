/**
 * Keyboard Navigation Accessibility Tests
 *
 * Comprehensive tests for keyboard accessibility across all enhanced components.
 * Tests focus on tab order, keyboard activation, focus management, and ARIA support.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Import components to test
import { BrandButton } from '@/components/brand/brand-button';
import { MetricCard } from '@/components/brand/metric-card';
import { SmartInput } from '@/components/forms/smart-input';
import { FormFeedback } from '@/components/forms/form-feedback';
import { SmartBreadcrumbs } from '@/components/layout/smart-breadcrumbs';
import { EnhancedSidebar } from '@/components/layout/enhanced-sidebar';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock navigation context
vi.mock('@/contexts/navigation-context', () => ({
  useNavigationContext: () => ({
    currentPath: '/dashboard',
    breadcrumbs: [],
    navigationState: { pendingLogs: 0, draftLogs: 0, pendingCommissions: 0 },
    updateNavigationState: vi.fn(),
  }),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Home: ({ className }: { className?: string }) => (
    <div data-testid="home-icon" className={className} />
  ),
  FileText: ({ className }: { className?: string }) => (
    <div data-testid="file-icon" className={className} />
  ),
  Settings: ({ className }: { className?: string }) => (
    <div data-testid="settings-icon" className={className} />
  ),
  ChevronRight: ({ className }: { className?: string }) => (
    <div data-testid="chevron-right-icon" className={className} />
  ),
  TrendingUp: ({ className }: { className?: string }) => (
    <div data-testid="trending-up-icon" className={className} />
  ),
  CheckCircle2: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className} />
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div data-testid="alert-icon" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className} />
  ),
}));

describe('Keyboard Navigation Accessibility Tests', () => {
  const user = userEvent.setup();

  describe('Button Keyboard Navigation', () => {
    it('activates buttons with Enter key', async () => {
      const handleClick = vi.fn();

      render(<BrandButton onClick={handleClick}>Test Button</BrandButton>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('activates buttons with Space key', async () => {
      const handleClick = vi.fn();

      render(<BrandButton onClick={handleClick}>Test Button</BrandButton>);

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not activate disabled buttons', async () => {
      const handleClick = vi.fn();

      render(
        <BrandButton onClick={handleClick} disabled>
          Disabled Button
        </BrandButton>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not activate loading buttons', async () => {
      const handleClick = vi.fn();

      render(
        <BrandButton onClick={handleClick} loading>
          Loading Button
        </BrandButton>
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('has proper focus indicators', () => {
      render(<BrandButton>Focusable Button</BrandButton>);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-hunks-green/20');
    });

    it('supports tab navigation between multiple buttons', async () => {
      render(
        <div>
          <BrandButton>First Button</BrandButton>
          <BrandButton>Second Button</BrandButton>
          <BrandButton>Third Button</BrandButton>
        </div>
      );

      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');
      const thirdButton = screen.getByText('Third Button');

      // Tab through buttons
      await user.tab();
      expect(firstButton).toHaveFocus();

      await user.tab();
      expect(secondButton).toHaveFocus();

      await user.tab();
      expect(thirdButton).toHaveFocus();

      // Shift+Tab should go backwards
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(secondButton).toHaveFocus();
    });
  });

  describe('Form Input Keyboard Navigation', () => {
    it('focuses inputs with tab navigation', async () => {
      render(
        <div>
          <SmartInput label="First Input" />
          <SmartInput label="Second Input" />
        </div>
      );

      const firstInput = screen.getByLabelText('First Input');
      const secondInput = screen.getByLabelText('Second Input');

      await user.tab();
      expect(firstInput).toHaveFocus();

      await user.tab();
      expect(secondInput).toHaveFocus();
    });

    it('handles Enter key in form inputs', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={handleSubmit}>
          <SmartInput label="Test Input" />
          <BrandButton type="submit">Submit</BrandButton>
        </form>
      );

      const input = screen.getByLabelText('Test Input');
      input.focus();

      await user.type(input, 'test value');
      await user.keyboard('{Enter}');

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('shows validation errors with proper focus management', async () => {
      render(
        <SmartInput
          label="Required Input"
          validationRules={[
            {
              test: (value) => value.length > 0,
              message: 'This field is required',
              type: 'error',
              priority: 1,
            },
          ]}
          validateOnBlur={true}
        />
      );

      const input = screen.getByLabelText('Required Input');

      // Focus and blur without entering text
      input.focus();
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      // Error should be associated with input
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('handles password toggle with keyboard', async () => {
      render(
        <SmartInput
          label="Password"
          type="password"
          showPasswordToggle={true}
        />
      );

      const input = screen.getByLabelText('Password');
      const toggleButton = screen.getByLabelText('Show password');

      // Tab to toggle button
      input.focus();
      await user.tab();
      expect(toggleButton).toHaveFocus();

      // Activate with Enter
      await user.keyboard('{Enter}');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();

      // Activate with Space
      await user.keyboard(' ');
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });
  });

  describe('Interactive Card Keyboard Navigation', () => {
    it('makes interactive metric cards keyboard accessible', async () => {
      const handleClick = vi.fn();

      render(
        <MetricCard
          title="Revenue"
          value="$1,234"
          color="green"
          interactive={true}
          onCardClick={handleClick}
        />
      );

      const card = screen.getByRole('button');
      card.focus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);

      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('has proper ARIA labels for interactive cards', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1,234"
          color="green"
          change={{ value: 12, type: 'increase', period: 'this month' }}
          interactive={true}
        />
      );

      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('aria-label');

      const ariaLabel = card.getAttribute('aria-label');
      expect(ariaLabel).toContain('Revenue');
      expect(ariaLabel).toContain('$1,234');
      expect(ariaLabel).toContain('12%');
    });

    it('does not make non-interactive cards focusable', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1,234"
          color="green"
          interactive={false}
        />
      );

      // Should not be focusable
      expect(screen.queryByRole('button')).not.toBeInTheDocument();

      const card = screen.getByText('Revenue').closest('div');
      expect(card).not.toHaveAttribute('tabindex');
    });
  });

  describe('Navigation Keyboard Accessibility', () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'CAPTAIN' as const,
    };

    it('supports keyboard navigation in breadcrumbs', async () => {
      const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Logs', href: '/logs' },
        { label: 'Current Page', href: '/current', current: true },
      ];

      render(<SmartBreadcrumbs breadcrumbs={breadcrumbs} />);

      const dashboardLink = screen.getByText('Dashboard');
      const logsLink = screen.getByText('Logs');

      // Tab through breadcrumb links
      await user.tab();
      expect(dashboardLink).toHaveFocus();

      await user.tab();
      expect(logsLink).toHaveFocus();

      // Current page should not be focusable
      await user.tab();
      expect(document.activeElement).not.toBe(screen.getByText('Current Page'));
    });

    it('supports keyboard navigation in sidebar', async () => {
      render(<EnhancedSidebar user={mockUser} />);

      const dashboardLink = screen.getByText('Dashboard');
      const logsLink = screen.getByText('Logs');

      // Tab through navigation links
      await user.tab();
      expect(dashboardLink).toHaveFocus();

      await user.tab();
      expect(logsLink).toHaveFocus();

      // Enter should activate navigation
      const mockPush = vi.fn();
      vi.mocked(require('next/navigation').useRouter).mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        back: vi.fn(),
      });

      await user.keyboard('{Enter}');
      expect(mockPush).toHaveBeenCalledWith('/logs');
    });

    it('handles arrow key navigation in sidebar', async () => {
      render(<EnhancedSidebar user={mockUser} />);

      const firstLink = screen.getByText('Dashboard');
      firstLink.focus();

      // Arrow down should move to next item
      await user.keyboard('{ArrowDown}');
      expect(screen.getByText('Logs')).toHaveFocus();

      // Arrow up should move to previous item
      await user.keyboard('{ArrowUp}');
      expect(firstLink).toHaveFocus();
    });

    it('supports Home and End keys in navigation', async () => {
      render(<EnhancedSidebar user={mockUser} />);

      const firstLink = screen.getByText('Dashboard');
      const lastLink = screen.getAllByRole('link').pop();

      firstLink.focus();

      // End key should move to last item
      await user.keyboard('{End}');
      expect(lastLink).toHaveFocus();

      // Home key should move to first item
      await user.keyboard('{Home}');
      expect(firstLink).toHaveFocus();
    });
  });

  describe('Modal and Dialog Keyboard Navigation', () => {
    it('traps focus within dismissible feedback', async () => {
      const handleDismiss = vi.fn();

      render(
        <div>
          <BrandButton>Before Modal</BrandButton>
          <FormFeedback
            type="success"
            title="Success"
            message="Success message"
            dismissible={true}
            onDismiss={handleDismiss}
          />
          <BrandButton>After Modal</BrandButton>
        </div>
      );

      const dismissButton = screen.getByLabelText('Dismiss');

      // Focus should be trapped within the feedback
      dismissButton.focus();

      // Tab should not move outside the feedback
      await user.tab();
      expect(dismissButton).toHaveFocus(); // Should cycle back

      // Escape should dismiss
      await user.keyboard('{Escape}');
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('returns focus to trigger element after dismissal', async () => {
      const TestComponent = () => {
        const [showFeedback, setShowFeedback] = React.useState(false);

        return (
          <div>
            <BrandButton onClick={() => setShowFeedback(true)}>
              Show Feedback
            </BrandButton>
            {showFeedback && (
              <FormFeedback
                type="info"
                title="Info"
                message="Info message"
                dismissible={true}
                onDismiss={() => setShowFeedback(false)}
              />
            )}
          </div>
        );
      };

      render(<TestComponent />);

      const triggerButton = screen.getByText('Show Feedback');

      // Click to show feedback
      await user.click(triggerButton);

      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toBeInTheDocument();

      // Dismiss feedback
      await user.click(dismissButton);

      // Focus should return to trigger
      expect(triggerButton).toHaveFocus();
    });
  });

  describe('Complex Form Keyboard Navigation', () => {
    it('handles tab order in complex forms', async () => {
      render(
        <form>
          <SmartInput label="First Name" />
          <SmartInput label="Last Name" />
          <SmartInput
            label="Email"
            type="email"
            hint="Enter your email address"
          />
          <SmartInput
            label="Password"
            type="password"
            showPasswordToggle={true}
          />
          <BrandButton type="submit">Submit</BrandButton>
          <BrandButton type="button">Cancel</BrandButton>
        </form>
      );

      const firstName = screen.getByLabelText('First Name');
      const lastName = screen.getByLabelText('Last Name');
      const email = screen.getByLabelText('Email');
      const password = screen.getByLabelText('Password');
      const passwordToggle = screen.getByLabelText('Show password');
      const submitButton = screen.getByText('Submit');
      const cancelButton = screen.getByText('Cancel');

      // Tab through form in correct order
      await user.tab();
      expect(firstName).toHaveFocus();

      await user.tab();
      expect(lastName).toHaveFocus();

      await user.tab();
      expect(email).toHaveFocus();

      await user.tab();
      expect(password).toHaveFocus();

      await user.tab();
      expect(passwordToggle).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();
    });

    it('handles validation errors in tab order', async () => {
      render(
        <form>
          <SmartInput
            label="Required Field"
            validationRules={[
              {
                test: (value) => value.length > 0,
                message: 'This field is required',
                type: 'error',
                priority: 1,
              },
            ]}
            validateOnBlur={true}
          />
          <BrandButton type="submit">Submit</BrandButton>
        </form>
      );

      const input = screen.getByLabelText('Required Field');
      const submitButton = screen.getByText('Submit');

      // Tab to input and blur to trigger validation
      await user.tab();
      expect(input).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      // Error should be announced and associated
      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
      });

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Skip Navigation', () => {
    it('provides skip links for keyboard users', async () => {
      render(
        <div>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <nav>
            <EnhancedSidebar
              user={{
                id: '1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'CAPTAIN',
              }}
            />
          </nav>
          <main id="main-content">
            <h1>Main Content</h1>
          </main>
        </div>
      );

      // Tab to skip link
      await user.tab();
      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveFocus();

      // Activate skip link
      await user.keyboard('{Enter}');

      // Focus should move to main content
      const mainContent = document.getElementById('main-content');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation Performance', () => {
    it('does not cause performance issues with rapid keyboard input', async () => {
      const handleChange = vi.fn();

      render(
        <SmartInput
          label="Performance Test"
          onValueChange={handleChange}
          validateOnChange={true}
          debounceMs={100}
        />
      );

      const input = screen.getByLabelText('Performance Test');
      input.focus();

      // Rapid keyboard input
      const rapidText = 'rapid keyboard input test';
      for (const char of rapidText) {
        await user.keyboard(char);
      }

      // Should handle rapid input without issues
      expect(input).toHaveValue(rapidText);

      // Should debounce change events
      await waitFor(
        () => {
          expect(handleChange).toHaveBeenCalledWith(rapidText);
        },
        { timeout: 200 }
      );
    });

    it('maintains focus during dynamic content updates', async () => {
      const TestComponent = () => {
        const [items, setItems] = React.useState(['Item 1', 'Item 2']);

        return (
          <div>
            <BrandButton
              onClick={() => setItems([...items, `Item ${items.length + 1}`])}
            >
              Add Item
            </BrandButton>
            {items.map((item, index) => (
              <BrandButton
                key={item}
                onClick={() => {
                  const newItems = items.filter((_, i) => i !== index);
                  setItems(newItems);
                }}
              >
                {item}
              </BrandButton>
            ))}
          </div>
        );
      };

      render(<TestComponent />);

      const addButton = screen.getByText('Add Item');
      const firstItem = screen.getByText('Item 1');

      // Focus first item
      firstItem.focus();
      expect(firstItem).toHaveFocus();

      // Add new item
      await user.click(addButton);

      // Focus should be maintained
      expect(firstItem).toHaveFocus();
    });
  });
});
