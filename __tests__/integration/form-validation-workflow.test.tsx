import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SmartInput, commonValidationRules } from '@/components/forms/smart-input';
import { FormFeedback, useFormFeedback } from '@/components/forms/form-feedback';
import { MobileFormValidation, useMobileFormValidation, mobileValidationRules } from '@/components/forms/mobile-form-validation';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className?: string }) => <div data-testid="check-icon" className={className} />,
  AlertCircle: ({ className }: { className?: string }) => <div data-testid="alert-icon" className={className} />,
  AlertTriangle: ({ className }: { className?: string }) => <div data-testid="warning-icon" className={className} />,
  Info: ({ className }: { className?: string }) => <div data-testid="info-icon" className={className} />,
  Eye: ({ className }: { className?: string }) => <div data-testid="eye-icon" className={className} />,
  EyeOff: ({ className }: { className?: string }) => <div data-testid="eye-off-icon" className={className} />,
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader-icon" className={className} />,
  RefreshCw: ({ className }: { className?: string }) => <div data-testid="refresh-icon" className={className} />,
  ExternalLink: ({ className }: { className?: string }) => <div data-testid="external-link-icon" className={className} />,
  Lightbulb: ({ className }: { className?: string }) => <div data-testid="lightbulb-icon" className={className} />,
  X: ({ className }: { className?: string }) => <div data-testid="x-icon" className={className} />,
  ChevronDown: ({ className }: { className?: string }) => <div data-testid="chevron-down-icon" className={className} />,
  ChevronUp: ({ className }: { className?: string }) => <div data-testid="chevron-up-icon" className={className} />,
}));

// Mock InlineSuccessCheck component
vi.mock('@/components/forms/success-animation', () => ({
  InlineSuccessCheck: ({ className }: { className?: string }) => (
    <div data-testid="success-animation" className={className} />
  ),
}));

// Mock form submission API
const mockSubmitForm = vi.fn();
vi.mock('@/lib/actions/forms', () => ({
  submitContactForm: mockSubmitForm,
}));

describe('Form Validation Workflow Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitForm.mockResolvedValue({ success: true });
  });

  describe('Complete Form Validation Workflow', () => {
    // Complex form component that uses all validation features
    function CompleteFormExample() {
      const [formData, setFormData] = React.useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });

      const [fieldValidation, setFieldValidation] = React.useState<Record<string, boolean>>({});
      const { feedback, showSuccess, showError, clearFeedback } = useFormFeedback();
      const { errors, addError, removeError, clearErrors, hasErrors } = useMobileFormValidation();

      const handleFieldChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
      };

      const handleFieldValidation = (field: string, isValid: boolean, fieldErrors: string[]) => {
        setFieldValidation(prev => ({ ...prev, [field]: isValid }));
        
        if (!isValid && fieldErrors.length > 0) {
          addError({
            field,
            message: fieldErrors[0],
            type: 'error',
          });
        } else {
          removeError(field);
        }
      };

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearFeedback();

        // Validate all fields
        const allFieldsValid = Object.values(fieldValidation).every(Boolean);
        
        if (!allFieldsValid || hasErrors) {
          showError({
            title: 'Validation Error',
            message: 'Please fix all errors before submitting.',
            suggestions: ['Check all required fields', 'Ensure passwords match'],
          });
          return;
        }

        try {
          const result = await mockSubmitForm(formData);
          if (result.success) {
            showSuccess({
              title: 'Success!',
              message: 'Your form has been submitted successfully.',
            });
            // Reset form
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              password: '',
              confirmPassword: '',
            });
            clearErrors();
          }
        } catch (error) {
          showError({
            title: 'Submission Error',
            message: 'Failed to submit form. Please try again.',
            onRetry: () => handleSubmit(e),
          });
        }
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SmartInput
              label="First Name"
              value={formData.firstName}
              onValueChange={(value) => handleFieldChange('firstName', value)}
              onValidationChange={(isValid, errors) => handleFieldValidation('firstName', isValid, errors)}
              validationRules={[commonValidationRules.required('First name is required')]}
              validateOnBlur={true}
              progressiveValidation={true}
            />
            
            <SmartInput
              label="Last Name"
              value={formData.lastName}
              onValueChange={(value) => handleFieldChange('lastName', value)}
              onValidationChange={(isValid, errors) => handleFieldValidation('lastName', isValid, errors)}
              validationRules={[commonValidationRules.required('Last name is required')]}
              validateOnBlur={true}
              progressiveValidation={true}
            />
          </div>

          <SmartInput
            label="Email Address"
            type="email"
            keyboardType="email"
            value={formData.email}
            onValueChange={(value) => handleFieldChange('email', value)}
            onValidationChange={(isValid, errors) => handleFieldValidation('email', isValid, errors)}
            validationRules={[
              commonValidationRules.required('Email is required'),
              commonValidationRules.email('Please enter a valid email address'),
            ]}
            validateOnChange={true}
            progressiveValidation={true}
            hint="We'll use this to contact you"
          />

          <SmartInput
            label="Phone Number"
            type="tel"
            keyboardType="tel"
            value={formData.phone}
            onValueChange={(value) => handleFieldChange('phone', value)}
            onValidationChange={(isValid, errors) => handleFieldValidation('phone', isValid, errors)}
            validationRules={[
              commonValidationRules.required('Phone number is required'),
              commonValidationRules.phone('Please enter a valid phone number'),
            ]}
            validateOnBlur={true}
            progressiveValidation={true}
          />

          <SmartInput
            label="Password"
            type="password"
            showPasswordToggle={true}
            value={formData.password}
            onValueChange={(value) => handleFieldChange('password', value)}
            onValidationChange={(isValid, errors) => handleFieldValidation('password', isValid, errors)}
            validationRules={[
              commonValidationRules.required('Password is required'),
              commonValidationRules.minLength(8, 'Password must be at least 8 characters'),
              commonValidationRules.strongPassword(),
            ]}
            validateOnChange={true}
            progressiveValidation={true}
          />

          <SmartInput
            label="Confirm Password"
            type="password"
            showPasswordToggle={true}
            value={formData.confirmPassword}
            onValueChange={(value) => handleFieldChange('confirmPassword', value)}
            onValidationChange={(isValid, errors) => handleFieldValidation('confirmPassword', isValid, errors)}
            validationRules={[
              commonValidationRules.required('Please confirm your password'),
              {
                test: (value) => value === formData.password,
                message: 'Passwords do not match',
                type: 'error',
                priority: 2,
              },
            ]}
            validateOnChange={true}
            progressiveValidation={true}
          />

          {errors.length > 0 && (
            <MobileFormValidation
              errors={errors}
              onErrorClick={(field) => {
                // Focus the field with error
                const input = document.querySelector(`input[aria-label*="${field}"]`) as HTMLInputElement;
                input?.focus();
              }}
              onDismiss={removeError}
            />
          )}

          {feedback && <FormFeedback {...feedback} />}

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-hunks-green text-white rounded hover:bg-hunks-green/90"
              disabled={hasErrors}
            >
              Submit Form
            </button>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  password: '',
                  confirmPassword: '',
                });
                clearErrors();
                clearFeedback();
              }}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </form>
      );
    }

    it('completes full form validation workflow successfully', async () => {
      render(<CompleteFormExample />);

      // Fill out the form with valid data
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email Address'), 'john.doe@example.com');
      await user.type(screen.getByLabelText('Phone Number'), '1234567890');
      await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPass123!');

      // Submit the form
      const submitButton = screen.getByText('Submit Form');
      await user.click(submitButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
        expect(screen.getByText('Your form has been submitted successfully.')).toBeInTheDocument();
      });

      // Should call the mock submit function
      expect(mockSubmitForm).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
      });

      // Form should be reset
      await waitFor(() => {
        expect(screen.getByLabelText('First Name')).toHaveValue('');
        expect(screen.getByLabelText('Email Address')).toHaveValue('');
      });
    });

    it('handles validation errors during form submission', async () => {
      render(<CompleteFormExample />);

      // Try to submit empty form
      const submitButton = screen.getByText('Submit Form');
      await user.click(submitButton);

      // Should show validation error feedback
      await waitFor(() => {
        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('Please fix all errors before submitting.')).toBeInTheDocument();
      });

      // Should not call submit function
      expect(mockSubmitForm).not.toHaveBeenCalled();
    });

    it('handles progressive validation correctly', async () => {
      render(<CompleteFormExample />);

      const emailInput = screen.getByLabelText('Email Address');

      // Focus the email field
      await user.click(emailInput);

      // Initially no validation should be shown
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();

      // Type invalid email
      await user.type(emailInput, 'invalid-email');

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Clear and type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      // Should show success state
      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
        expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      });
    });

    it('handles password confirmation validation', async () => {
      render(<CompleteFormExample />);

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      // Enter password
      await user.type(passwordInput, 'StrongPass123!');
      await user.type(confirmPasswordInput, 'DifferentPass123!');
      await user.tab();

      // Should show password mismatch error
      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      // Fix the confirmation password
      await user.clear(confirmPasswordInput);
      await user.type(confirmPasswordInput, 'StrongPass123!');
      await user.tab();

      // Should remove the error
      await waitFor(() => {
        expect(screen.queryByText('Passwords do not match')).not.toBeInTheDocument();
      });
    });

    it('handles mobile form validation interactions', async () => {
      render(<CompleteFormExample />);

      // Trigger multiple validation errors
      const firstNameInput = screen.getByLabelText('First Name');
      const emailInput = screen.getByLabelText('Email Address');

      await user.click(firstNameInput);
      await user.tab();
      await user.click(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      // Should show mobile validation summary
      await waitFor(() => {
        expect(screen.getByText(/error/)).toBeInTheDocument();
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Click on an error should focus the field
      const firstNameError = screen.getByText('firstName');
      await user.click(firstNameError);

      // Should focus the first name input
      expect(firstNameInput).toHaveFocus();
    });

    it('handles form reset correctly', async () => {
      render(<CompleteFormExample />);

      // Fill out some fields
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Email Address'), 'john@example.com');

      // Trigger some validation errors
      const lastNameInput = screen.getByLabelText('Last Name');
      await user.click(lastNameInput);
      await user.tab();

      // Should have validation error
      await waitFor(() => {
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });

      // Reset the form
      const resetButton = screen.getByText('Reset');
      await user.click(resetButton);

      // All fields should be cleared
      expect(screen.getByLabelText('First Name')).toHaveValue('');
      expect(screen.getByLabelText('Email Address')).toHaveValue('');

      // Validation errors should be cleared
      expect(screen.queryByText('Last name is required')).not.toBeInTheDocument();
    });

    it('handles server errors gracefully', async () => {
      // Mock server error
      mockSubmitForm.mockRejectedValueOnce(new Error('Server error'));

      render(<CompleteFormExample />);

      // Fill out valid form
      await user.type(screen.getByLabelText('First Name'), 'John');
      await user.type(screen.getByLabelText('Last Name'), 'Doe');
      await user.type(screen.getByLabelText('Email Address'), 'john.doe@example.com');
      await user.type(screen.getByLabelText('Phone Number'), '1234567890');
      await user.type(screen.getByLabelText('Password'), 'StrongPass123!');
      await user.type(screen.getByLabelText('Confirm Password'), 'StrongPass123!');

      // Submit form
      const submitButton = screen.getByText('Submit Form');
      await user.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('Submission Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to submit form. Please try again.')).toBeInTheDocument();
      });

      // Should have retry button
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      mockSubmitForm.mockResolvedValueOnce({ success: true });

      // Click retry
      await user.click(retryButton);

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });

    it('handles async validation correctly', async () => {
      // Create a form with async validation
      function AsyncValidationForm() {
        const [username, setUsername] = React.useState('');
        const [isValidating, setIsValidating] = React.useState(false);

        const asyncUsernameRule = {
          test: async (value: string) => {
            setIsValidating(true);
            await new Promise(resolve => setTimeout(resolve, 100));
            setIsValidating(false);
            return value !== 'taken-username';
          },
          message: 'This username is already taken',
          type: 'error' as const,
          priority: 1,
        };

        return (
          <SmartInput
            label="Username"
            value={username}
            onValueChange={setUsername}
            validationRules={[asyncUsernameRule]}
            validateOnBlur={true}
            loading={isValidating}
          />
        );
      }

      render(<AsyncValidationForm />);

      const usernameInput = screen.getByLabelText('Username');

      // Type taken username
      await user.type(usernameInput, 'taken-username');
      await user.tab();

      // Should show loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

      // Should show error after validation completes
      await waitFor(() => {
        expect(screen.getByText('This username is already taken')).toBeInTheDocument();
      });

      // Should not show loading state anymore
      expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();

      // Type available username
      await user.clear(usernameInput);
      await user.type(usernameInput, 'available-username');
      await user.tab();

      // Should show loading state again
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

      // Should not show error after validation completes
      await waitFor(() => {
        expect(screen.queryByText('This username is already taken')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles rapid input changes without performance issues', async () => {
      const onValidationChange = vi.fn();

      render(
        <SmartInput
          label="Performance Test"
          validationRules={[commonValidationRules.email()]}
          onValidationChange={onValidationChange}
          validateOnChange={true}
          debounceMs={50}
        />
      );

      const input = screen.getByLabelText('Performance Test');

      // Type rapidly
      const rapidText = 'test@example.com';
      for (const char of rapidText) {
        await user.type(input, char, { delay: 10 });
      }

      // Should debounce validation calls
      await waitFor(() => {
        expect(onValidationChange).toHaveBeenCalledWith(true, []);
      }, { timeout: 200 });

      // Should not have excessive validation calls
      expect(onValidationChange).toHaveBeenCalledTimes(1);
    });

    it('handles validation rule exceptions gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const faultyRule = {
        test: () => {
          throw new Error('Validation rule error');
        },
        message: 'This should not be shown',
        type: 'error' as const,
        priority: 1,
      };

      render(
        <SmartInput
          label="Faulty Validation"
          validationRules={[faultyRule]}
          validateOnBlur={true}
        />
      );

      const input = screen.getByLabelText('Faulty Validation');

      await user.type(input, 'test');
      await user.tab();

      // Should show generic error message
      await waitFor(() => {
        expect(screen.getByText('Validation error occurred')).toBeInTheDocument();
      });

      // Should log the error
      expect(consoleSpy).toHaveBeenCalledWith('Validation rule error:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('handles memory cleanup on unmount', () => {
      const { unmount } = render(
        <SmartInput
          label="Cleanup Test"
          validationRules={[commonValidationRules.required()]}
          validateOnChange={true}
          debounceMs={100}
        />
      );

      const input = screen.getByLabelText('Cleanup Test');

      // Start typing to trigger debounced validation
      fireEvent.change(input, { target: { value: 'test' } });

      // Unmount before debounce completes
      unmount();

      // Should not cause any errors or memory leaks
      // This test mainly ensures no console errors occur
    });
  });
});