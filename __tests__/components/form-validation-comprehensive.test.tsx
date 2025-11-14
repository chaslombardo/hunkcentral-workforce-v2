import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  SmartInput,
  commonValidationRules,
  ValidationRule,
} from '@/components/forms/smart-input';
import {
  FormFeedback,
  useFormFeedback,
  formFeedbackPresets,
} from '@/components/forms/form-feedback';
import {
  MobileFormValidation,
  useMobileFormValidation,
  mobileValidationRules,
  ValidationError,
} from '@/components/forms/mobile-form-validation';

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
  Eye: ({ className }: { className?: string }) => (
    <div data-testid="eye-icon" className={className} />
  ),
  EyeOff: ({ className }: { className?: string }) => (
    <div data-testid="eye-off-icon" className={className} />
  ),
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader-icon" className={className} />
  ),
  RefreshCw: ({ className }: { className?: string }) => (
    <div data-testid="refresh-icon" className={className} />
  ),
  ExternalLink: ({ className }: { className?: string }) => (
    <div data-testid="external-link-icon" className={className} />
  ),
  Lightbulb: ({ className }: { className?: string }) => (
    <div data-testid="lightbulb-icon" className={className} />
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
}));

// Mock InlineSuccessCheck component
vi.mock('@/components/forms/success-animation', () => ({
  InlineSuccessCheck: ({ className }: { className?: string }) => (
    <div data-testid="success-animation" className={className} />
  ),
}));

describe('Comprehensive Form Validation Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SmartInput Validation Logic', () => {
    it('validates complex business rules correctly', async () => {
      const businessRule: ValidationRule = {
        test: (value: string) => {
          // Complex business logic: must be a valid employee ID format
          const employeeIdRegex = /^EMP-\d{4}-[A-Z]{2}$/;
          return employeeIdRegex.test(value);
        },
        message:
          'Employee ID must be in format EMP-XXXX-XX (e.g., EMP-1234-AB)',
        type: 'error',
        priority: 1,
      };

      const onValidationChange = vi.fn();

      render(
        <SmartInput
          label="Employee ID"
          validationRules={[businessRule]}
          onValidationChange={onValidationChange}
          validateOnChange={true}
          progressiveValidation={false}
        />
      );

      const input = screen.getByLabelText('Employee ID');

      // Test invalid formats
      const invalidFormats = [
        'EMP-123-AB',
        'emp-1234-ab',
        'EMP-1234-A',
        'EMP-1234-ABC',
      ];

      for (const invalidFormat of invalidFormats) {
        await user.clear(input);
        await user.type(input, invalidFormat);
        await user.tab();

        await waitFor(() => {
          expect(onValidationChange).toHaveBeenCalledWith(false, [
            businessRule.message,
          ]);
        });
      }

      // Test valid format
      await user.clear(input);
      await user.type(input, 'EMP-1234-AB');
      await user.tab();

      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(true, []);
      });
    });

    it('handles async validation with proper loading states', async () => {
      const asyncValidationRule: ValidationRule = {
        test: async (value: string) => {
          // Simulate API call to check username availability
          await new Promise((resolve) => setTimeout(resolve, 100));
          return value !== 'taken-username';
        },
        message: 'This username is already taken',
        type: 'error',
        priority: 1,
      };

      const onValidationChange = vi.fn();

      render(
        <SmartInput
          label="Username"
          validationRules={[asyncValidationRule]}
          onValidationChange={onValidationChange}
          validateOnBlur={true}
        />
      );

      const input = screen.getByLabelText('Username');

      // Test taken username
      await user.type(input, 'taken-username');
      await user.tab();

      // Should show loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

      // Wait for validation to complete
      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(false, [
          'This username is already taken',
        ]);
      });

      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
      expect(
        screen.getByText('This username is already taken')
      ).toBeInTheDocument();

      // Test available username
      await user.clear(input);
      await user.type(input, 'available-username');
      await user.tab();

      // Should show loading state again
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(true, []);
      });

      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
    });

    it('validates multiple interdependent rules correctly', async () => {
      const passwordRule: ValidationRule = {
        test: (value: string) => value.length >= 8,
        message: 'Password must be at least 8 characters',
        type: 'error',
        priority: 1,
      };

      const strengthRule: ValidationRule = {
        test: (value: string) => {
          const hasUpper = /[A-Z]/.test(value);
          const hasLower = /[a-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecial = /[@$!%*?&]/.test(value);
          return hasUpper && hasLower && hasNumber && hasSpecial;
        },
        message:
          'Password must contain uppercase, lowercase, number, and special character',
        type: 'warning',
        priority: 2,
      };

      render(
        <SmartInput
          label="Password"
          type="password"
          validationRules={[passwordRule, strengthRule]}
          validateOnChange={true}
          progressiveValidation={false}
        />
      );

      const input = screen.getByLabelText('Password');

      // Test short password (should show error, not warning)
      await user.type(input, 'short');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 8 characters')
        ).toBeInTheDocument();
      });

      // Test long but weak password (should show warning)
      await user.clear(input);
      await user.type(input, 'longpassword');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(
            'Password must contain uppercase, lowercase, number, and special character'
          )
        ).toBeInTheDocument();
      });

      // Test strong password (should show no errors or warnings)
      await user.clear(input);
      await user.type(input, 'StrongPass123!');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.queryByText('Password must be at least 8 characters')
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(
            'Password must contain uppercase, lowercase, number, and special character'
          )
        ).not.toBeInTheDocument();
      });
    });

    it('handles validation rule errors gracefully', async () => {
      const faultyRule: ValidationRule = {
        test: () => {
          throw new Error('Validation rule error');
        },
        message: 'This should not be shown',
        type: 'error',
        priority: 1,
      };

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <SmartInput
          label="Faulty Field"
          validationRules={[faultyRule]}
          validateOnBlur={true}
        />
      );

      const input = screen.getByLabelText('Faulty Field');

      await user.type(input, 'test');
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText('Validation error occurred')
        ).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Validation rule error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('FormFeedback Component', () => {
    it('renders different feedback types with correct styling', () => {
      const { rerender } = render(
        <FormFeedback
          type="success"
          title="Success Title"
          message="Success message"
        />
      );

      expect(screen.getByTestId('success-animation')).toBeInTheDocument();
      expect(screen.getByText('Success Title')).toBeInTheDocument();
      expect(screen.getByText('Success message')).toBeInTheDocument();

      rerender(
        <FormFeedback
          type="error"
          title="Error Title"
          message="Error message"
        />
      );

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
      expect(screen.getByText('Error Title')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();

      rerender(
        <FormFeedback
          type="warning"
          title="Warning Title"
          message="Warning message"
        />
      );

      expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
      expect(screen.getByText('Warning Title')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();

      rerender(
        <FormFeedback type="info" title="Info Title" message="Info message" />
      );

      expect(screen.getByTestId('info-icon')).toBeInTheDocument();
      expect(screen.getByText('Info Title')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('displays suggestions and actions correctly', async () => {
      const mockAction = vi.fn();
      const mockRetry = vi.fn();

      render(
        <FormFeedback
          type="error"
          message="Something went wrong"
          suggestions={['Check your input', 'Try again later']}
          actions={[
            { label: 'Custom Action', onClick: mockAction, variant: 'outline' },
          ]}
          onRetry={mockRetry}
          helpLink={{ text: 'Get Help', url: 'https://help.example.com' }}
        />
      );

      expect(screen.getByText('Suggestions:')).toBeInTheDocument();
      expect(screen.getByText('Check your input')).toBeInTheDocument();
      expect(screen.getByText('Try again later')).toBeInTheDocument();

      const customActionButton = screen.getByText('Custom Action');
      const retryButton = screen.getByText('Try Again');
      const helpButton = screen.getByText('Get Help');

      await user.click(customActionButton);
      expect(mockAction).toHaveBeenCalled();

      await user.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();

      // Help link should open in new window
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      await user.click(helpButton);
      expect(openSpy).toHaveBeenCalledWith(
        'https://help.example.com',
        '_blank'
      );
      openSpy.mockRestore();
    });

    it('auto-dismisses success messages', async () => {
      vi.useFakeTimers();
      const mockDismiss = vi.fn();

      render(
        <FormFeedback
          type="success"
          message="Success message"
          onDismiss={mockDismiss}
        />
      );

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      // Wait for the effect to run
      await vi.runAllTimersAsync();

      expect(mockDismiss).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('MobileFormValidation Component', () => {
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

    it('displays validation errors with proper grouping', () => {
      render(<MobileFormValidation errors={mockErrors} />);

      expect(screen.getByText('1 error')).toBeInTheDocument();
      expect(screen.getByText('1 warning')).toBeInTheDocument();
      expect(screen.getByText('1 info')).toBeInTheDocument();
      expect(
        screen.getByText('Please review and fix the issues below')
      ).toBeInTheDocument();

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByText('Password too weak')).toBeInTheDocument();
    });

    it('handles collapsible behavior correctly', async () => {
      const manyErrors: ValidationError[] = Array.from(
        { length: 5 },
        (_, i) => ({
          field: `field${i}`,
          message: `Error message ${i}`,
          type: 'error' as const,
          severity: 'medium' as const,
        })
      );

      render(
        <MobileFormValidation
          errors={manyErrors}
          collapsible={true}
          maxVisible={3}
        />
      );

      // Should show only first 3 errors initially
      expect(screen.getByText('Field0')).toBeInTheDocument();
      expect(screen.getByText('Field1')).toBeInTheDocument();
      expect(screen.getByText('Field2')).toBeInTheDocument();
      expect(screen.queryByText('Field3')).not.toBeInTheDocument();

      // Should show expand button
      const expandButton = screen.getByText(/Show.*5/);
      await user.click(expandButton);

      // Should now show all errors
      await waitFor(() => {
        expect(screen.getByText('Field3')).toBeInTheDocument();
        expect(screen.getByText('Field4')).toBeInTheDocument();
      });

      // Should show collapse button
      const collapseButton = screen.getByText('Show Less');
      await user.click(collapseButton);

      // Should hide extra errors again
      await waitFor(() => {
        expect(screen.queryByText('Field3')).not.toBeInTheDocument();
      });
    });

    it('handles error click and dismiss actions', async () => {
      const mockErrorClick = vi.fn();
      const mockDismiss = vi.fn();

      render(
        <MobileFormValidation
          errors={mockErrors}
          onErrorClick={mockErrorClick}
          onDismiss={mockDismiss}
        />
      );

      // Click on error should call onErrorClick
      const emailError = screen.getByText('Email');
      await user.click(emailError);
      expect(mockErrorClick).toHaveBeenCalledWith('email');

      // Click dismiss button should call onDismiss
      const dismissButtons = screen.getAllByTestId('x-icon');
      fireEvent.click(dismissButtons[0]);
      expect(mockDismiss).toHaveBeenCalledWith('email');
    });
  });

  describe('Form Validation Hooks', () => {
    it('useFormFeedback hook manages state correctly', () => {
      let hookResult: ReturnType<typeof useFormFeedback>;

      function TestComponent() {
        hookResult = useFormFeedback();
        return (
          <div>
            {hookResult.feedback && <FormFeedback {...hookResult.feedback} />}
            <button
              onClick={() => hookResult.showSuccess({ message: 'Success!' })}
            >
              Show Success
            </button>
            <button onClick={() => hookResult.showError({ message: 'Error!' })}>
              Show Error
            </button>
            <button onClick={hookResult.clearFeedback}>Clear</button>
          </div>
        );
      }

      render(<TestComponent />);

      // Initially no feedback
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();

      // Show success feedback
      fireEvent.click(screen.getByText('Show Success'));
      expect(screen.getByText('Success!')).toBeInTheDocument();

      // Clear feedback
      fireEvent.click(screen.getByText('Clear'));
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();

      // Show error feedback
      fireEvent.click(screen.getByText('Show Error'));
      expect(screen.getByText('Error!')).toBeInTheDocument();
    });

    it('useMobileFormValidation hook manages validation state correctly', () => {
      let hookResult: ReturnType<typeof useMobileFormValidation>;

      function TestComponent() {
        hookResult = useMobileFormValidation();
        return (
          <div>
            <div data-testid="has-errors">
              {hookResult.hasErrors.toString()}
            </div>
            <div data-testid="has-warnings">
              {hookResult.hasWarnings.toString()}
            </div>
            <button
              onClick={() =>
                hookResult.addError({
                  field: 'test',
                  message: 'Test error',
                  type: 'error',
                })
              }
            >
              Add Error
            </button>
            <button onClick={() => hookResult.removeError('test')}>
              Remove Error
            </button>
            <button
              onClick={() =>
                hookResult.validateField('email', 'invalid', [
                  mobileValidationRules.required(),
                  mobileValidationRules.email(),
                ])
              }
            >
              Validate Email
            </button>
          </div>
        );
      }

      render(<TestComponent />);

      // Initially no errors
      expect(screen.getByTestId('has-errors')).toHaveTextContent('false');

      // Add error
      fireEvent.click(screen.getByText('Add Error'));
      expect(screen.getByTestId('has-errors')).toHaveTextContent('true');

      // Remove error
      fireEvent.click(screen.getByText('Remove Error'));
      expect(screen.getByTestId('has-errors')).toHaveTextContent('false');

      // Validate field
      fireEvent.click(screen.getByText('Validate Email'));
      expect(screen.getByTestId('has-errors')).toHaveTextContent('true');
    });
  });

  describe('Common Validation Rules', () => {
    it('validates all common rules correctly', () => {
      const testCases = [
        {
          rule: commonValidationRules.required(),
          validValues: ['test', '123', 'a'],
          invalidValues: ['', '   ', '\t\n'],
        },
        {
          rule: commonValidationRules.email(),
          validValues: ['test@example.com', 'user.name@domain.co.uk'],
          invalidValues: ['invalid-email', '@domain.com', 'user@'],
        },
        {
          rule: commonValidationRules.phone(),
          validValues: ['1234567890', '+1234567890', '123-456-7890'],
          invalidValues: ['abc', '123', ''],
        },
        {
          rule: commonValidationRules.minLength(5),
          validValues: ['12345', 'longer'],
          invalidValues: ['1234', 'abc'],
        },
        {
          rule: commonValidationRules.maxLength(10),
          validValues: ['short', '1234567890'],
          invalidValues: ['this is too long'],
        },
        {
          rule: commonValidationRules.numeric(),
          validValues: ['123', '123.45', '-123'],
          invalidValues: ['abc', '12a3', ''],
        },
        {
          rule: commonValidationRules.positiveNumber(),
          validValues: ['123', '123.45', '0.1'],
          invalidValues: ['-123', 'abc'],
        },
      ];

      testCases.forEach(({ rule, validValues, invalidValues }) => {
        validValues.forEach((value) => {
          expect(rule.test(value)).toBe(true);
        });

        invalidValues.forEach((value) => {
          expect(rule.test(value)).toBe(false);
        });
      });
    });

    it('validates strong password rule correctly', () => {
      const rule = commonValidationRules.strongPassword();

      const validPasswords = ['StrongPass123!', 'MyP@ssw0rd', 'Complex1@'];

      const invalidPasswords = [
        'weak',
        'password',
        'PASSWORD',
        '12345678',
        'NoSpecial123',
        'nouppercas3!',
      ];

      validPasswords.forEach((password) => {
        expect(rule.test(password)).toBe(true);
      });

      invalidPasswords.forEach((password) => {
        expect(rule.test(password)).toBe(false);
      });
    });
  });

  describe('Mobile Validation Rules', () => {
    it('validates mobile-specific rules correctly', () => {
      const testCases = [
        {
          rule: mobileValidationRules.required(),
          validValues: ['test', 123, true],
          invalidValues: ['', null, undefined, '   '],
        },
        {
          rule: mobileValidationRules.strongPassword(),
          validValues: ['StrongPass123!', 'MyP@ssw0rd'],
          invalidValues: ['weak', 'password', 'short'],
        },
      ];

      testCases.forEach(({ rule, validValues, invalidValues }) => {
        validValues.forEach((value) => {
          expect(rule.test(value)).toBe(true);
        });

        invalidValues.forEach((value) => {
          expect(rule.test(value)).toBe(false);
        });
      });
    });
  });

  describe('Form Feedback Presets', () => {
    it('generates correct preset configurations', () => {
      const formSubmittedPreset = formFeedbackPresets.formSubmitted('log');
      expect(formSubmittedPreset.title).toBe('Success!');
      expect(formSubmittedPreset.message).toBe(
        'Your log has been submitted successfully.'
      );

      const validationErrorPreset = formFeedbackPresets.validationError(3);
      expect(validationErrorPreset.title).toBe('Validation Error');
      expect(validationErrorPreset.message).toBe(
        'Please fix 3 errors below and try again.'
      );

      const networkErrorPreset = formFeedbackPresets.networkError();
      expect(networkErrorPreset.title).toBe('Connection Error');
      expect(networkErrorPreset.suggestions).toContain(
        'Check your internet connection'
      );

      const unsavedChangesPreset = formFeedbackPresets.unsavedChanges(
        vi.fn(),
        vi.fn()
      );
      expect(unsavedChangesPreset.title).toBe('Unsaved Changes');
      expect(unsavedChangesPreset.actions).toHaveLength(2);
    });
  });
});
