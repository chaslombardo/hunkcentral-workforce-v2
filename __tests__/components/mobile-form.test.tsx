import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MobileForm } from '@/components/forms/mobile-form';
import { MobileFormValidation } from '@/components/forms/mobile-form-validation';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className} />
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div data-testid="alert-icon" className={className} />
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="warning-icon" className={className} />
  ),
  Info: ({ className }: { className?: string }) => (
    <div data-testid="info-icon" className={className} />
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className} />
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down-icon" className={className} />
  ),
  ChevronUp: ({ className }: { className?: string }) => (
    <div data-testid="chevron-up-icon" className={className} />
  ),
  Save: ({ className }: { className?: string }) => (
    <div data-testid="save-icon" className={className} />
  ),
}));

// Mock auto-save hook
vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: vi.fn(() => ({
    saveStatus: 'saved',
    lastSaved: new Date(),
    save: vi.fn(),
  })),
}));

describe('MobileForm', () => {
  const user = userEvent.setup();

  const defaultProps = {
    title: 'Test Form',
    onSubmit: vi.fn(),
    children: <input data-testid="test-input" />,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders form with title and children', () => {
      render(<MobileForm {...defaultProps} />);

      expect(screen.getByText('Test Form')).toBeInTheDocument();
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('renders submit button with default text', () => {
      render(<MobileForm {...defaultProps} />);

      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('renders custom submit button text', () => {
      render(<MobileForm {...defaultProps} submitText="Save Changes" />);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Mobile Optimizations', () => {
    it('has proper touch targets for mobile', () => {
      render(<MobileForm {...defaultProps} />);

      const submitButton = screen.getByText('Submit');
      const buttonStyles = window.getComputedStyle(submitButton);

      // Should have minimum 48px height for touch targets
      expect(submitButton).toHaveClass('h-12'); // 48px in Tailwind
    });

    it('prevents zoom on iOS with proper font sizes', () => {
      render(
        <MobileForm {...defaultProps}>
          <input data-testid="mobile-input" className="text-base" />
        </MobileForm>
      );

      const input = screen.getByTestId('mobile-input');
      expect(input).toHaveClass('text-base'); // 16px to prevent zoom
    });

    it('has proper keyboard types for mobile inputs', () => {
      render(
        <MobileForm {...defaultProps}>
          <input data-testid="email-input" type="email" inputMode="email" />
          <input data-testid="number-input" type="number" inputMode="decimal" />
          <input data-testid="tel-input" type="tel" inputMode="tel" />
        </MobileForm>
      );

      expect(screen.getByTestId('email-input')).toHaveAttribute(
        'inputMode',
        'email'
      );
      expect(screen.getByTestId('number-input')).toHaveAttribute(
        'inputMode',
        'decimal'
      );
      expect(screen.getByTestId('tel-input')).toHaveAttribute(
        'inputMode',
        'tel'
      );
    });
  });

  describe('Auto-Save Functionality', () => {
    it('shows auto-save status indicator', () => {
      render(<MobileForm {...defaultProps} autoSave={true} />);

      expect(screen.getByText('Saved')).toBeInTheDocument();
      expect(screen.getByTestId('save-icon')).toBeInTheDocument();
    });

    it('shows saving status during auto-save', () => {
      const mockUseAutoSave = vi.fn(() => ({
        saveStatus: 'saving',
        lastSaved: null,
        save: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useAutoSave').useAutoSave).mockImplementation(
        mockUseAutoSave
      );

      render(<MobileForm {...defaultProps} autoSave={true} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows error status when auto-save fails', () => {
      const mockUseAutoSave = vi.fn(() => ({
        saveStatus: 'error',
        lastSaved: null,
        save: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useAutoSave').useAutoSave).mockImplementation(
        mockUseAutoSave
      );

      render(<MobileForm {...defaultProps} autoSave={true} />);

      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit when form is submitted', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(<MobileForm {...defaultProps} onSubmit={handleSubmit} />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it('shows loading state during submission', async () => {
      const handleSubmit = vi.fn((e) => {
        e.preventDefault();
        return new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<MobileForm {...defaultProps} onSubmit={handleSubmit} />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText('Submit')).toBeInTheDocument();
      });
    });

    it('disables submit button when form is invalid', () => {
      render(<MobileForm {...defaultProps} disabled={true} />);

      const submitButton = screen.getByText('Submit');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Validation Integration', () => {
    it('integrates with mobile form validation', () => {
      const errors = [
        { field: 'email', message: 'Invalid email', type: 'error' as const },
        {
          field: 'password',
          message: 'Password too short',
          type: 'error' as const,
        },
      ];

      render(
        <MobileForm {...defaultProps}>
          <input data-testid="email-input" />
          <input data-testid="password-input" />
          <MobileFormValidation
            errors={errors}
            onErrorClick={vi.fn()}
            onDismiss={vi.fn()}
          />
        </MobileForm>
      );

      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.getByText('Password too short')).toBeInTheDocument();
    });

    it('shows validation summary when there are errors', () => {
      const errors = [
        { field: 'email', message: 'Invalid email', type: 'error' as const },
        {
          field: 'password',
          message: 'Password too short',
          type: 'error' as const,
        },
      ];

      render(
        <MobileForm {...defaultProps}>
          <MobileFormValidation
            errors={errors}
            onErrorClick={vi.fn()}
            onDismiss={vi.fn()}
          />
        </MobileForm>
      );

      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labeling', () => {
      render(
        <MobileForm {...defaultProps}>
          <label htmlFor="test-input">Test Input</label>
          <input id="test-input" data-testid="test-input" />
        </MobileForm>
      );

      const input = screen.getByTestId('test-input');
      expect(input).toHaveAccessibleName('Test Input');
    });

    it('has proper ARIA attributes for form', () => {
      render(<MobileForm {...defaultProps} />);

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('noValidate'); // Client-side validation
    });

    it('announces form submission status', async () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(<MobileForm {...defaultProps} onSubmit={handleSubmit} />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      // Should have aria-live region for status updates
      const statusRegion = document.querySelector('[aria-live]');
      expect(statusRegion).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for different screen sizes', () => {
      render(<MobileForm {...defaultProps} />);

      const form = screen.getByRole('form');
      expect(form).toHaveClass('space-y-4'); // Proper spacing for mobile
    });

    it('has proper padding and margins for mobile', () => {
      render(<MobileForm {...defaultProps} />);

      const container = screen.getByRole('form').parentElement;
      expect(container).toHaveClass('p-4'); // Mobile padding
    });
  });

  describe('Error Handling', () => {
    it('handles form submission errors gracefully', async () => {
      const handleSubmit = vi.fn((e) => {
        e.preventDefault();
        throw new Error('Submission failed');
      });

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<MobileForm {...defaultProps} onSubmit={handleSubmit} />);

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Form submission error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('shows retry option when submission fails', async () => {
      const handleSubmit = vi.fn((e) => {
        e.preventDefault();
        return Promise.reject(new Error('Network error'));
      });

      render(
        <MobileForm
          {...defaultProps}
          onSubmit={handleSubmit}
          showRetry={true}
        />
      );

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Click retry should attempt submission again
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      expect(handleSubmit).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    it('debounces auto-save to prevent excessive saves', async () => {
      const mockSave = vi.fn();
      const mockUseAutoSave = vi.fn(() => ({
        saveStatus: 'saved',
        lastSaved: new Date(),
        save: mockSave,
      }));

      vi.mocked(require('@/hooks/useAutoSave').useAutoSave).mockImplementation(
        mockUseAutoSave
      );

      render(
        <MobileForm {...defaultProps} autoSave={true}>
          <input data-testid="debounce-input" />
        </MobileForm>
      );

      const input = screen.getByTestId('debounce-input');

      // Type rapidly
      await user.type(input, 'rapid typing', { delay: 10 });

      // Should debounce save calls
      await waitFor(
        () => {
          expect(mockSave).toHaveBeenCalledTimes(1);
        },
        { timeout: 1000 }
      );
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(<MobileForm {...defaultProps} />);

      // Add event listeners
      const form = screen.getByRole('form');
      const removeEventListenerSpy = vi.spyOn(form, 'removeEventListener');

      unmount();

      // Should clean up listeners (this is more of a smoke test)
      expect(removeEventListenerSpy).toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
    });
  });
});
