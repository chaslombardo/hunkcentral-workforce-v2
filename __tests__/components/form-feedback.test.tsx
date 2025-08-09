import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { FormFeedback, useFormFeedback } from '@/components/forms/form-feedback';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className?: string }) => <div data-testid="check-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-icon" className={className} />,
  AlertTriangle: ({ className }: { className?: string }) => <div data-testid="warning-icon" className={className} />,
  Info: ({ className }: { className?: string }) => <div data-testid="info-icon" className={className} />,
  X: ({ className }: { className?: string }) => <div data-testid="x-icon" className={className} />,
  RefreshCw: ({ className }: { className?: string }) => <div data-testid="refresh-icon" className={className} />,
  ExternalLink: ({ className }: { className?: string }) => <div data-testid="external-link-icon" className={className} />,
  Lightbulb: ({ className }: { className?: string }) => <div data-testid="lightbulb-icon" className={className} />,
}));

describe('FormFeedback', () => {
  const user = userEvent.setup();

  describe('Success Feedback', () => {
    it('renders success feedback with proper styling', () => {
      render(
        <FormFeedback
          type="success"
          title="Success!"
          message="Your form has been submitted successfully."
        />
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByText('Your form has been submitted successfully.')).toBeInTheDocument();
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      
      const container = screen.getByRole('alert');
      expect(container).toHaveClass('border-hunks-green');
    });

    it('renders success feedback with action button', async () => {
      const handleAction = vi.fn();
      
      render(
        <FormFeedback
          type="success"
          title="Success!"
          message="Form submitted successfully."
          actionLabel="View Results"
          onAction={handleAction}
        />
      );

      const actionButton = screen.getByText('View Results');
      expect(actionButton).toBeInTheDocument();
      
      await user.click(actionButton);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('auto-dismisses success feedback after timeout', async () => {
      const handleDismiss = vi.fn();
      
      render(
        <FormFeedback
          type="success"
          title="Success!"
          message="Auto-dismiss test"
          autoDismiss={true}
          dismissAfter={100}
          onDismiss={handleDismiss}
        />
      );

      expect(screen.getByText('Success!')).toBeInTheDocument();

      await waitFor(() => {
        expect(handleDismiss).toHaveBeenCalledTimes(1);
      }, { timeout: 200 });
    });
  });

  describe('Error Feedback', () => {
    it('renders error feedback with proper styling', () => {
      render(
        <FormFeedback
          type="error"
          title="Error!"
          message="Something went wrong."
        />
      );

      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      
      const container = screen.getByRole('alert');
      expect(container).toHaveClass('border-destructive');
    });

    it('renders error feedback with suggestions', () => {
      render(
        <FormFeedback
          type="error"
          title="Validation Error"
          message="Please fix the following issues:"
          suggestions={[
            'Check all required fields',
            'Ensure email format is correct',
            'Password must be at least 8 characters'
          ]}
        />
      );

      expect(screen.getByText('Check all required fields')).toBeInTheDocument();
      expect(screen.getByText('Ensure email format is correct')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });

    it('renders error feedback with retry functionality', async () => {
      const handleRetry = vi.fn();
      
      render(
        <FormFeedback
          type="error"
          title="Submission Failed"
          message="Failed to submit form."
          onRetry={handleRetry}
        />
      );

      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      await user.click(retryButton);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Warning Feedback', () => {
    it('renders warning feedback with proper styling', () => {
      render(
        <FormFeedback
          type="warning"
          title="Warning"
          message="Please review your input."
        />
      );

      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('Please review your input.')).toBeInTheDocument();
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
      
      const container = screen.getByRole('alert');
      expect(container).toHaveClass('border-hunks-orange');
    });
  });

  describe('Info Feedback', () => {
    it('renders info feedback with proper styling', () => {
      render(
        <FormFeedback
          type="info"
          title="Information"
          message="Here's some helpful information."
        />
      );

      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(screen.getByText('Here\'s some helpful information.')).toBeInTheDocument();
      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
      
      const container = screen.getByRole('alert');
      expect(container).toHaveClass('border-blue-200');
    });
  });

  describe('Dismissible Feedback', () => {
    it('can be dismissed manually', async () => {
      const handleDismiss = vi.fn();
      
      render(
        <FormFeedback
          type="success"
          title="Success!"
          message="Dismissible feedback"
          dismissible={true}
          onDismiss={handleDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toBeInTheDocument();
      
      await user.click(dismissButton);
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows dismiss button with proper accessibility', () => {
      render(
        <FormFeedback
          type="info"
          title="Info"
          message="Test message"
          dismissible={true}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss');
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state during async operations', () => {
      render(
        <FormFeedback
          type="info"
          title="Processing"
          message="Please wait..."
          loading={true}
        />
      );

      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toHaveClass('animate-spin');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <FormFeedback
          type="error"
          title="Error"
          message="Test error message"
        />
      );

      const container = screen.getByRole('alert');
      expect(container).toHaveAttribute('aria-live', 'assertive');
      expect(container).toHaveAttribute('aria-atomic', 'true');
    });

    it('has proper role for different feedback types', () => {
      const { rerender } = render(
        <FormFeedback
          type="error"
          title="Error"
          message="Error message"
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();

      rerender(
        <FormFeedback
          type="info"
          title="Info"
          message="Info message"
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Brand Consistency', () => {
    it('uses brand colors for success state', () => {
      render(
        <FormFeedback
          type="success"
          title="Success"
          message="Test message"
        />
      );

      const container = screen.getByRole('alert');
      expect(container).toHaveClass('border-hunks-green');
      expect(container).toHaveClass('bg-hunks-green/5');
    });

    it('uses brand colors for warning state', () => {
      render(
        <FormFeedback
          type="warning"
          title="Warning"
          message="Test message"
        />
      );

      const container = screen.getByRole('alert');
      expect(container).toHaveClass('border-hunks-orange');
      expect(container).toHaveClass('bg-hunks-orange/5');
    });
  });
});

describe('useFormFeedback Hook', () => {
  function TestComponent() {
    const { feedback, showSuccess, showError, showWarning, showInfo, clearFeedback } = useFormFeedback();

    return (
      <div>
        <button onClick={() => showSuccess({ title: 'Success', message: 'Success message' })}>
          Show Success
        </button>
        <button onClick={() => showError({ title: 'Error', message: 'Error message' })}>
          Show Error
        </button>
        <button onClick={() => showWarning({ title: 'Warning', message: 'Warning message' })}>
          Show Warning
        </button>
        <button onClick={() => showInfo({ title: 'Info', message: 'Info message' })}>
          Show Info
        </button>
        <button onClick={clearFeedback}>Clear</button>
        {feedback && <FormFeedback {...feedback} />}
      </div>
    );
  }

  const user = userEvent.setup();

  it('manages feedback state correctly', async () => {
    render(<TestComponent />);

    // Show success feedback
    await user.click(screen.getByText('Show Success'));
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();

    // Clear feedback
    await user.click(screen.getByText('Clear'));
    expect(screen.queryByText('Success')).not.toBeInTheDocument();

    // Show error feedback
    await user.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();

    // Show different feedback type (should replace previous)
    await user.click(screen.getByText('Show Warning'));
    expect(screen.queryByText('Error')).not.toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('handles auto-dismiss functionality', async () => {
    function AutoDismissTestComponent() {
      const { feedback, showSuccess } = useFormFeedback();

      return (
        <div>
          <button 
            onClick={() => showSuccess({ 
              title: 'Auto Dismiss', 
              message: 'This will auto dismiss',
              autoDismiss: true,
              dismissAfter: 100
            })}
          >
            Show Auto Dismiss
          </button>
          {feedback && <FormFeedback {...feedback} />}
        </div>
      );
    }

    render(<AutoDismissTestComponent />);

    await user.click(screen.getByText('Show Auto Dismiss'));
    expect(screen.getByText('Auto Dismiss')).toBeInTheDocument();

    // Should auto-dismiss after timeout
    await waitFor(() => {
      expect(screen.queryByText('Auto Dismiss')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });
});