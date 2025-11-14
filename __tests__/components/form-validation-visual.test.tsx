import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  SmartInput,
  commonValidationRules,
} from '@/components/forms/smart-input';
import { FormFeedback } from '@/components/forms/form-feedback';
import {
  MobileFormValidation,
  ValidationError,
} from '@/components/forms/mobile-form-validation';

// Mock Lucide icons with consistent test IDs
vi.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className}>
      ✓
    </div>
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div data-testid="alert-icon" className={className}>
      !
    </div>
  ),
  AlertTriangle: ({ className }: { className?: string }) => (
    <div data-testid="warning-icon" className={className}>
      ⚠
    </div>
  ),
  Info: ({ className }: { className?: string }) => (
    <div data-testid="info-icon" className={className}>
      ℹ
    </div>
  ),
  Eye: ({ className }: { className?: string }) => (
    <div data-testid="eye-icon" className={className}>
      👁
    </div>
  ),
  EyeOff: ({ className }: { className?: string }) => (
    <div data-testid="eye-off-icon" className={className}>
      👁‍🗨
    </div>
  ),
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className}>
      ⟳
    </div>
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="refresh-icon" className={className}>
      ↻
    </div>
  ),
  ExternalLink: ({ className }: { className?: string }) => (
    <div data-testid="external-link-icon" className={className}>
      ↗
    </div>
  ),
  Lightbulb: ({ className }: { className?: string }) => (
    <div data-testid="lightbulb-icon" className={className}>
      💡
    </div>
  ),
  X: ({ className }: { className?: string }) => (
    <div data-testid="x-icon" className={className}>
      ×
    </div>
  ),
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-down-icon" className={className}>
      ▼
    </div>
  ),
  ChevronUp: ({ className }: { className?: string }) => (
    <div data-testid="chevron-up-icon" className={className}>
      ▲
    </div>
  ),
}));

// Mock InlineSuccessCheck component
vi.mock('@/components/forms/success-animation', () => ({
  InlineSuccessCheck: ({ className }: { className?: string }) => (
    <div data-testid="success-animation" className={className}>
      ✨
    </div>
  ),
}));

describe('Form Validation Visual Regression Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SmartInput Visual States', () => {
    it('renders default state consistently', () => {
      const { container } = render(
        <SmartInput
          label="Default Input"
          placeholder="Enter text here"
          hint="This is a helpful hint"
        />
      );

      // Check structure and classes
      const label = screen.getByText('Default Input');
      const input = screen.getByPlaceholderText('Enter text here');
      const hint = screen.getByText('This is a helpful hint');

      expect(label).toHaveClass('text-sm', 'font-medium');
      expect(input).toHaveClass('pr-10'); // Space for status icon
      expect(hint).toHaveClass('text-sm', 'text-muted-foreground');

      // Snapshot the structure
      expect(container.firstChild).toMatchSnapshot('smart-input-default-state');
    });

    it('renders error state with consistent styling', async () => {
      const { container } = render(
        <SmartInput
          label="Error Input"
          error="This field has an error"
          validationRules={[commonValidationRules.required()]}
        />
      );

      const input = screen.getByLabelText('Error Input');
      const errorIcon = screen.getByTestId('alert-icon');
      const errorMessage = screen.getByText('This field has an error');

      // Check error styling classes
      expect(input).toHaveClass(
        'border-destructive',
        'focus-visible:ring-destructive/20'
      );
      expect(errorIcon).toHaveClass('text-destructive');
      expect(errorMessage.closest('[role="alert"]')).toHaveClass(
        'border-destructive/20'
      );

      expect(container.firstChild).toMatchSnapshot('smart-input-error-state');
    });

    it('renders success state with consistent styling', () => {
      const { container } = render(
        <SmartInput
          label="Success Input"
          success="This field is valid"
          value="valid@example.com"
        />
      );

      const input = screen.getByLabelText('Success Input');
      const successIcon = screen.getByTestId('check-icon');
      const successMessage = screen.getByText('This field is valid');

      // Check success styling classes
      expect(input).toHaveClass(
        'border-hunks-green',
        'focus-visible:ring-hunks-green/20'
      );
      expect(successIcon).toHaveClass('text-hunks-green');
      expect(successMessage.closest('[role="alert"]')).toHaveClass(
        'border-hunks-green/20'
      );

      expect(container.firstChild).toMatchSnapshot('smart-input-success-state');
    });

    it('renders loading state with consistent styling', () => {
      const { container } = render(
        <SmartInput label="Loading Input" loading={true} value="checking..." />
      );

      const loadingIcon = screen.getByTestId('loader-icon');
      expect(loadingIcon).toHaveClass('animate-spin', 'text-muted-foreground');

      expect(container.firstChild).toMatchSnapshot('smart-input-loading-state');
    });

    it('renders warning state with consistent styling', async () => {
      const warningRule = {
        test: (value: string) => value.length <= 5,
        message: 'Consider using a longer value',
        type: 'warning' as const,
        priority: 1,
      };

      const { container } = render(
        <SmartInput
          label="Warning Input"
          validationRules={[warningRule]}
          validateOnChange={true}
          progressiveValidation={false}
          value="short"
        />
      );

      await waitFor(() => {
        const warningIcon = screen.getByTestId('info-icon');
        const warningMessage = screen.getByText(
          'Consider using a longer value'
        );

        expect(warningIcon).toHaveClass('text-hunks-orange');
        expect(warningMessage.closest('[role="alert"]')).toHaveClass(
          'border-hunks-orange/20'
        );
      });

      expect(container.firstChild).toMatchSnapshot('smart-input-warning-state');
    });

    it('renders password input with toggle consistently', () => {
      const { container } = render(
        <SmartInput
          label="Password Input"
          type="password"
          showPasswordToggle={true}
          value="secretpassword"
        />
      );

      const input = screen.getByLabelText('Password Input');
      const toggleButton = screen.getByLabelText('Show password');
      const eyeIcon = screen.getByTestId('eye-icon');

      expect(input).toHaveClass('pr-20'); // Extra space for password toggle
      expect(toggleButton).toBeInTheDocument();
      expect(eyeIcon).toBeInTheDocument();

      expect(container.firstChild).toMatchSnapshot(
        'smart-input-password-state'
      );
    });

    it('renders mobile-optimized input consistently', () => {
      const { container } = render(
        <SmartInput
          label="Mobile Input"
          keyboardType="email"
          mobileOptimized={true}
          value="user@example.com"
        />
      );

      const input = screen.getByLabelText('Mobile Input');
      expect(input).toHaveAttribute('type', 'email');

      expect(container.firstChild).toMatchSnapshot('smart-input-mobile-state');
    });

    it('renders progressive validation states consistently', async () => {
      const { container, rerender } = render(
        <SmartInput
          label="Progressive Input"
          validationRules={[commonValidationRules.required()]}
          progressiveValidation={true}
          validateOnChange={true}
        />
      );

      // Initial state - no validation shown
      expect(container.firstChild).toMatchSnapshot(
        'smart-input-progressive-initial'
      );

      // After focus and input
      rerender(
        <SmartInput
          label="Progressive Input"
          validationRules={[commonValidationRules.required()]}
          progressiveValidation={true}
          validateOnChange={true}
          value="a"
        />
      );

      expect(container.firstChild).toMatchSnapshot(
        'smart-input-progressive-typing'
      );

      // After clearing input (should show validation)
      rerender(
        <SmartInput
          label="Progressive Input"
          validationRules={[commonValidationRules.required()]}
          progressiveValidation={true}
          validateOnChange={true}
          value=""
        />
      );

      await waitFor(() => {
        expect(
          screen.queryByText('This field is required')
        ).toBeInTheDocument();
      });

      expect(container.firstChild).toMatchSnapshot(
        'smart-input-progressive-error'
      );
    });
  });

  describe('FormFeedback Visual States', () => {
    it('renders success feedback consistently', () => {
      const { container } = render(
        <FormFeedback
          type="success"
          title="Success!"
          message="Your form has been submitted successfully."
        />
      );

      const successAnimation = screen.getByTestId('success-animation');
      const alert = screen.getByRole('alert');

      expect(successAnimation).toHaveClass('text-hunks-green');
      expect(alert).toHaveClass('border-hunks-green/20', 'bg-hunks-green/5');

      expect(container.firstChild).toMatchSnapshot('form-feedback-success');
    });

    it('renders error feedback with actions consistently', () => {
      const { container } = render(
        <FormFeedback
          type="error"
          title="Validation Error"
          message="Please fix the errors below and try again."
          suggestions={['Check required fields', 'Verify email format']}
          actions={[
            { label: 'Fix Errors', onClick: vi.fn(), variant: 'outline' },
          ]}
          onRetry={vi.fn()}
          helpLink={{ text: 'Get Help', url: 'https://help.example.com' }}
        />
      );

      const errorIcon = screen.getByTestId('alert-icon');
      const alert = screen.getByRole('alert');
      const lightbulbIcon = screen.getByTestId('lightbulb-icon');

      expect(errorIcon).toHaveClass('text-destructive');
      expect(alert).toHaveClass('border-destructive/20', 'bg-destructive/5');
      expect(lightbulbIcon).toBeInTheDocument();

      expect(container.firstChild).toMatchSnapshot(
        'form-feedback-error-with-actions'
      );
    });

    it('renders warning feedback consistently', () => {
      const { container } = render(
        <FormFeedback
          type="warning"
          title="Warning"
          message="This action cannot be undone."
          details="Please review your changes before proceeding."
        />
      );

      const warningIcon = screen.getByTestId('warning-icon');
      const alert = screen.getByRole('alert');

      expect(warningIcon).toHaveClass('text-hunks-orange');
      expect(alert).toHaveClass('border-hunks-orange/20', 'bg-hunks-orange/5');

      expect(container.firstChild).toMatchSnapshot('form-feedback-warning');
    });

    it('renders info feedback consistently', () => {
      const { container } = render(
        <FormFeedback
          type="info"
          title="Information"
          message="Here are some tips to help you complete this form."
          suggestions={['Fill all required fields', 'Use valid email format']}
        />
      );

      const infoIcon = screen.getByTestId('info-icon');
      const alert = screen.getByRole('alert');

      expect(infoIcon).toHaveClass('text-blue-600');
      expect(alert).toHaveClass('border-blue-200', 'bg-blue-50');

      expect(container.firstChild).toMatchSnapshot('form-feedback-info');
    });

    it('renders feedback with dismiss button consistently', () => {
      const { container } = render(
        <FormFeedback
          type="success"
          message="Operation completed successfully."
          onDismiss={vi.fn()}
        />
      );

      const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
      expect(dismissButton).toHaveClass('absolute', 'top-2', 'right-2');

      expect(container.firstChild).toMatchSnapshot(
        'form-feedback-with-dismiss'
      );
    });
  });

  describe('MobileFormValidation Visual States', () => {
    const mockErrors: ValidationError[] = [
      {
        field: 'email',
        message: 'Invalid email format',
        type: 'error',
        severity: 'high',
      },
      {
        field: 'password',
        message: 'Password too weak',
        type: 'warning',
        severity: 'medium',
      },
      {
        field: 'username',
        message: 'Username available',
        type: 'info',
        severity: 'low',
      },
    ];

    it('renders error summary consistently', () => {
      const { container } = render(
        <MobileFormValidation errors={mockErrors} />
      );

      const errorBadge = screen.getByText('1 error');
      const warningBadge = screen.getByText('1 warning');
      const infoBadge = screen.getByText('1 info');

      expect(errorBadge).toHaveClass('text-xs');
      expect(warningBadge).toHaveClass(
        'bg-hunks-orange/10',
        'text-hunks-orange'
      );
      expect(infoBadge).toHaveClass('bg-blue-100', 'text-blue-700');

      expect(container.firstChild).toMatchSnapshot(
        'mobile-form-validation-summary'
      );
    });

    it('renders individual error items consistently', () => {
      const { container } = render(
        <MobileFormValidation
          errors={mockErrors}
          onErrorClick={vi.fn()}
          onDismiss={vi.fn()}
        />
      );

      const errorAlert = screen
        .getByText('Invalid email format')
        .closest('[role="alert"]');
      const warningAlert = screen
        .getByText('Password too weak')
        .closest('[role="alert"]');
      const infoAlert = screen
        .getByText('Username available')
        .closest('[role="alert"]');

      expect(errorAlert).toHaveClass('min-h-[48px]', 'touch-manipulation');
      expect(warningAlert).toHaveClass(
        'border-hunks-orange/20',
        'bg-hunks-orange/5'
      );
      expect(infoAlert).toHaveClass('border-blue-200', 'bg-blue-50');

      expect(container.firstChild).toMatchSnapshot(
        'mobile-form-validation-items'
      );
    });

    it('renders collapsible state consistently', () => {
      const manyErrors: ValidationError[] = Array.from(
        { length: 5 },
        (_, i) => ({
          field: `field${i}`,
          message: `Error message ${i}`,
          type: 'error' as const,
          severity: 'medium' as const,
        })
      );

      const { container } = render(
        <MobileFormValidation
          errors={manyErrors}
          collapsible={true}
          maxVisible={3}
        />
      );

      const expandButton = screen.getByText('Show All (5)');
      expect(expandButton).toHaveClass('w-full', 'h-12', 'touch-manipulation');

      expect(container.firstChild).toMatchSnapshot(
        'mobile-form-validation-collapsible'
      );
    });

    it('renders empty state consistently', () => {
      const { container } = render(<MobileFormValidation errors={[]} />);

      // Should render nothing for empty errors
      expect(container.firstChild).toBeNull();
      expect(container).toMatchSnapshot('mobile-form-validation-empty');
    });
  });

  describe('Form State Combinations', () => {
    it('renders complex form with multiple validation states', () => {
      const { container } = render(
        <div className="space-y-4">
          <SmartInput
            label="Email Address"
            type="email"
            value="user@example.com"
            success="Valid email address"
          />
          <SmartInput
            label="Password"
            type="password"
            showPasswordToggle={true}
            error="Password must be at least 8 characters"
          />
          <SmartInput
            label="Confirm Password"
            type="password"
            loading={true}
            value="checking..."
          />
          <FormFeedback
            type="error"
            title="Form Validation Error"
            message="Please fix the errors above before submitting."
            suggestions={['Check password requirements']}
          />
        </div>
      );

      expect(container.firstChild).toMatchSnapshot(
        'complex-form-validation-states'
      );
    });

    it('renders mobile form validation with mixed error types', () => {
      const mixedErrors: ValidationError[] = [
        {
          field: 'firstName',
          message: 'First name is required',
          type: 'error',
        },
        { field: 'lastName', message: 'Last name is required', type: 'error' },
        { field: 'email', message: 'Email format is invalid', type: 'error' },
        {
          field: 'phone',
          message: 'Phone number format could be improved',
          type: 'warning',
        },
        {
          field: 'bio',
          message: 'Bio is optional but recommended',
          type: 'info',
        },
      ];

      const { container } = render(
        <div className="space-y-4">
          <MobileFormValidation
            errors={mixedErrors}
            onErrorClick={vi.fn()}
            onDismiss={vi.fn()}
            collapsible={true}
            maxVisible={3}
          />
          <FormFeedback
            type="error"
            title="Multiple Validation Errors"
            message="Please review and fix the issues above."
            onRetry={vi.fn()}
          />
        </div>
      );

      expect(container.firstChild).toMatchSnapshot(
        'mobile-form-mixed-validation-states'
      );
    });
  });

  describe('Brand Color Consistency', () => {
    it('applies College Hunks brand colors consistently', () => {
      const { container } = render(
        <div className="space-y-4">
          <SmartInput
            label="Success Field"
            success="Valid input"
            value="test"
          />
          <SmartInput
            label="Warning Field"
            validationRules={[
              {
                test: () => false,
                message: 'Warning message',
                type: 'warning',
                priority: 1,
              },
            ]}
            validateOnChange={true}
            progressiveValidation={false}
            value="test"
          />
          <FormFeedback type="success" message="Success with brand colors" />
          <FormFeedback type="warning" message="Warning with brand colors" />
        </div>
      );

      // Check that brand colors are applied
      const successIcon = screen.getByTestId('check-icon');
      const warningIcon = screen.getAllByTestId('info-icon')[0]; // First one is from SmartInput

      expect(successIcon).toHaveClass('text-hunks-green');
      expect(warningIcon).toHaveClass('text-hunks-orange');

      expect(container.firstChild).toMatchSnapshot('brand-color-consistency');
    });
  });

  describe('Responsive Design States', () => {
    it('renders mobile-optimized components consistently', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { container } = render(
        <div className="space-y-4">
          <SmartInput
            label="Mobile Input"
            keyboardType="tel"
            mobileOptimized={true}
            placeholder="Enter phone number"
          />
          <MobileFormValidation
            errors={[
              {
                field: 'phone',
                message: 'Invalid phone format',
                type: 'error',
              },
            ]}
            onErrorClick={vi.fn()}
          />
        </div>
      );

      expect(container.firstChild).toMatchSnapshot('mobile-responsive-design');
    });

    it('renders desktop-optimized components consistently', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { container } = render(
        <div className="grid grid-cols-2 gap-4">
          <SmartInput label="Desktop Input 1" hint="This is a desktop hint" />
          <SmartInput label="Desktop Input 2" error="Desktop error message" />
        </div>
      );

      expect(container.firstChild).toMatchSnapshot('desktop-responsive-design');
    });
  });
});
