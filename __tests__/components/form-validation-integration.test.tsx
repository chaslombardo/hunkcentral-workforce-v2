import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  SmartInput,
  commonValidationRules,
} from '@/components/forms/smart-input';
import {
  FormFeedback,
  useFormFeedback,
} from '@/components/forms/form-feedback';
import {
  MobileFormValidation,
  useMobileFormValidation,
  mobileValidationRules,
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

describe('Form Validation Integration Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Form Workflow', () => {
    it('handles a complete user registration form workflow', async () => {
      function RegistrationForm() {
        const formFeedback = useFormFeedback();
        const mobileValidation = useMobileFormValidation();
        const [formData, setFormData] = React.useState({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
        });

        const handleSubmit = (e: React.FormEvent) => {
          e.preventDefault();

          // Clear previous errors
          mobileValidation.clearErrors();

          // Validate all fields
          let hasErrors = false;

          if (!formData.firstName.trim()) {
            mobileValidation.addError({
              field: 'firstName',
              message: 'First name is required',
              type: 'error',
            });
            hasErrors = true;
          }

          if (!formData.email.trim()) {
            mobileValidation.addError({
              field: 'email',
              message: 'Email is required',
              type: 'error',
            });
            hasErrors = true;
          } else if (!commonValidationRules.email().test(formData.email)) {
            mobileValidation.addError({
              field: 'email',
              message: 'Please enter a valid email address',
              type: 'error',
            });
            hasErrors = true;
          }

          if (!formData.password) {
            mobileValidation.addError({
              field: 'password',
              message: 'Password is required',
              type: 'error',
            });
            hasErrors = true;
          } else if (
            !commonValidationRules.strongPassword().test(formData.password)
          ) {
            mobileValidation.addError({
              field: 'password',
              message:
                'Password must be at least 8 characters with mixed case, numbers, and special characters',
              type: 'error',
            });
            hasErrors = true;
          }

          if (formData.password !== formData.confirmPassword) {
            mobileValidation.addError({
              field: 'confirmPassword',
              message: 'Passwords do not match',
              type: 'error',
            });
            hasErrors = true;
          }

          if (hasErrors) {
            formFeedback.showError({
              title: 'Validation Error',
              message: 'Please fix the errors below and try again.',
            });
          } else {
            formFeedback.showSuccess({
              title: 'Registration Successful',
              message: 'Your account has been created successfully.',
            });
          }
        };

        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <SmartInput
              label="First Name"
              value={formData.firstName}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, firstName: value }))
              }
              validationRules={[commonValidationRules.required()]}
              validateOnBlur={true}
            />

            <SmartInput
              label="Last Name"
              value={formData.lastName}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, lastName: value }))
              }
            />

            <SmartInput
              label="Email Address"
              type="email"
              value={formData.email}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, email: value }))
              }
              validationRules={[
                commonValidationRules.required(),
                commonValidationRules.email(),
              ]}
              validateOnChange={true}
            />

            <SmartInput
              label="Password"
              type="password"
              showPasswordToggle={true}
              value={formData.password}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, password: value }))
              }
              validationRules={[
                commonValidationRules.required(),
                commonValidationRules.strongPassword(),
              ]}
              validateOnChange={true}
            />

            <SmartInput
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, confirmPassword: value }))
              }
              validationRules={[
                commonValidationRules.required(),
                {
                  test: (value) => value === formData.password,
                  message: 'Passwords must match',
                  type: 'error',
                  priority: 2,
                },
              ]}
              validateOnChange={true}
            />

            {mobileValidation.errors.length > 0 && (
              <MobileFormValidation
                errors={mobileValidation.errors}
                onErrorClick={(field) => {
                  const element = document.querySelector(
                    `[name="${field}"]`
                  ) as HTMLElement;
                  element?.focus();
                }}
                onDismiss={mobileValidation.removeError}
              />
            )}

            {formFeedback.feedback && (
              <FormFeedback {...formFeedback.feedback} />
            )}

            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded"
            >
              Register
            </button>
          </form>
        );
      }

      render(<RegistrationForm />);

      // Test empty form submission
      const submitButton = screen.getByText('Register');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Validation Error')).toBeInTheDocument();
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      // Fill in valid data
      const firstNameInput = screen.getByLabelText('First Name');
      const emailInput = screen.getByLabelText('Email Address');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');

      await user.type(firstNameInput, 'John');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'StrongPass123!');
      await user.type(confirmPasswordInput, 'StrongPass123!');

      // Submit valid form
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Registration Successful')).toBeInTheDocument();
        expect(
          screen.getByText('Your account has been created successfully.')
        ).toBeInTheDocument();
      });
    });

    it('handles real-time validation during form completion', async () => {
      function DynamicForm() {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');
        const [isEmailValid, setIsEmailValid] = React.useState(false);
        const [isPasswordValid, setIsPasswordValid] = React.useState(false);

        return (
          <div className="space-y-4">
            <SmartInput
              label="Email"
              type="email"
              value={email}
              onValueChange={setEmail}
              onValidationChange={(isValid) => setIsEmailValid(isValid)}
              validationRules={[
                commonValidationRules.required(),
                commonValidationRules.email(),
              ]}
              validateOnChange={true}
              progressiveValidation={true}
            />

            <SmartInput
              label="Password"
              type="password"
              value={password}
              onValueChange={setPassword}
              onValidationChange={(isValid) => setIsPasswordValid(isValid)}
              validationRules={[
                commonValidationRules.required(),
                commonValidationRules.minLength(8),
                commonValidationRules.strongPassword(),
              ]}
              validateOnChange={true}
              progressiveValidation={true}
            />

            <div data-testid="form-status">
              Email Valid: {isEmailValid.toString()}
              Password Valid: {isPasswordValid.toString()}
              Form Valid: {(isEmailValid && isPasswordValid).toString()}
            </div>
          </div>
        );
      }

      render(<DynamicForm />);

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const formStatus = screen.getByTestId('form-status');

      // Initially invalid
      expect(formStatus).toHaveTextContent('Email Valid: false');
      expect(formStatus).toHaveTextContent('Password Valid: false');
      expect(formStatus).toHaveTextContent('Form Valid: false');

      // Type invalid email
      await user.click(emailInput);
      await user.type(emailInput, 'invalid');

      await waitFor(() => {
        expect(formStatus).toHaveTextContent('Email Valid: false');
      });

      // Complete valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(formStatus).toHaveTextContent('Email Valid: true');
      });

      // Type weak password
      await user.click(passwordInput);
      await user.type(passwordInput, 'weak');

      await waitFor(() => {
        expect(formStatus).toHaveTextContent('Password Valid: false');
      });

      // Complete strong password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'StrongPass123!');

      await waitFor(() => {
        expect(formStatus).toHaveTextContent('Password Valid: true');
        expect(formStatus).toHaveTextContent('Form Valid: true');
      });
    });
  });

  describe('Cross-Component Communication', () => {
    it('synchronizes validation state between SmartInput and MobileFormValidation', async () => {
      function SynchronizedForm() {
        const mobileValidation = useMobileFormValidation();
        const [email, setEmail] = React.useState('');

        const handleEmailValidation = (isValid: boolean, errors: string[]) => {
          if (!isValid && errors.length > 0) {
            mobileValidation.addError({
              field: 'email',
              message: errors[0],
              type: 'error',
            });
          } else {
            mobileValidation.removeError('email');
          }
        };

        return (
          <div className="space-y-4">
            <SmartInput
              label="Email Address"
              type="email"
              value={email}
              onValueChange={setEmail}
              onValidationChange={handleEmailValidation}
              validationRules={[
                commonValidationRules.required(),
                commonValidationRules.email(),
              ]}
              validateOnChange={true}
            />

            <MobileFormValidation
              errors={mobileValidation.errors}
              onErrorClick={(field) => {
                if (field === 'email') {
                  screen.getByLabelText('Email Address').focus();
                }
              }}
              onDismiss={mobileValidation.removeError}
            />
          </div>
        );
      }

      render(<SynchronizedForm />);

      const emailInput = screen.getByLabelText('Email Address');

      // Focus and blur to trigger required validation
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('This field is required')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument(); // In mobile validation
      });

      // Type invalid email
      await user.click(emailInput);
      await user.type(emailInput, 'invalid-email');

      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
      });

      // Type valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      await waitFor(() => {
        expect(
          screen.queryByText('Please enter a valid email address')
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Email')).not.toBeInTheDocument(); // Should be removed from mobile validation
      });
    });

    it('handles form submission with integrated validation feedback', async () => {
      function IntegratedForm() {
        const formFeedback = useFormFeedback();
        const mobileValidation = useMobileFormValidation();
        const [formData, setFormData] = React.useState({
          username: '',
          email: '',
          age: '',
        });

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();

          // Clear previous state
          mobileValidation.clearErrors();
          formFeedback.clearFeedback();

          // Show loading
          formFeedback.showInfo({
            message: 'Validating your information...',
            showAnimation: false,
          });

          // Simulate async validation
          await new Promise((resolve) => setTimeout(resolve, 500));

          let hasErrors = false;

          // Validate username
          if (!formData.username.trim()) {
            mobileValidation.addError({
              field: 'username',
              message: 'Username is required',
              type: 'error',
            });
            hasErrors = true;
          } else if (formData.username.length < 3) {
            mobileValidation.addError({
              field: 'username',
              message: 'Username must be at least 3 characters',
              type: 'error',
            });
            hasErrors = true;
          }

          // Validate email
          if (!formData.email.trim()) {
            mobileValidation.addError({
              field: 'email',
              message: 'Email is required',
              type: 'error',
            });
            hasErrors = true;
          } else if (!commonValidationRules.email().test(formData.email)) {
            mobileValidation.addError({
              field: 'email',
              message: 'Please enter a valid email address',
              type: 'error',
            });
            hasErrors = true;
          }

          // Validate age
          if (!formData.age.trim()) {
            mobileValidation.addError({
              field: 'age',
              message: 'Age is required',
              type: 'error',
            });
            hasErrors = true;
          } else if (!commonValidationRules.numeric().test(formData.age)) {
            mobileValidation.addError({
              field: 'age',
              message: 'Age must be a number',
              type: 'error',
            });
            hasErrors = true;
          } else if (parseInt(formData.age) < 18) {
            mobileValidation.addError({
              field: 'age',
              message: 'You must be at least 18 years old',
              type: 'error',
            });
            hasErrors = true;
          }

          if (hasErrors) {
            formFeedback.showError({
              title: 'Validation Failed',
              message: `Please fix ${mobileValidation.errors.length} error${mobileValidation.errors.length !== 1 ? 's' : ''} below.`,
              suggestions: [
                'Check all required fields are filled',
                'Ensure all data is in the correct format',
              ],
              onRetry: () => handleSubmit(e),
            });
          } else {
            formFeedback.showSuccess({
              title: 'Success!',
              message: 'Your form has been submitted successfully.',
            });
          }
        };

        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <SmartInput
              label="Username"
              value={formData.username}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, username: value }))
              }
              hint="At least 3 characters"
            />

            <SmartInput
              label="Email Address"
              type="email"
              value={formData.email}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, email: value }))
              }
            />

            <SmartInput
              label="Age"
              type="number"
              value={formData.age}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, age: value }))
              }
              hint="Must be 18 or older"
            />

            {mobileValidation.errors.length > 0 && (
              <MobileFormValidation
                errors={mobileValidation.errors}
                onErrorClick={(field) => {
                  const input = screen.getByLabelText(
                    field === 'username'
                      ? 'Username'
                      : field === 'email'
                        ? 'Email Address'
                        : field === 'age'
                          ? 'Age'
                          : field
                  );
                  input.focus();
                }}
              />
            )}

            {formFeedback.feedback && (
              <FormFeedback {...formFeedback.feedback} />
            )}

            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded"
            >
              Submit Form
            </button>
          </form>
        );
      }

      render(<IntegratedForm />);

      const submitButton = screen.getByText('Submit Form');

      // Submit empty form
      fireEvent.click(submitButton);

      // Should show loading first
      await waitFor(() => {
        expect(
          screen.getByText('Validating your information...')
        ).toBeInTheDocument();
      });

      // Then show validation errors
      await waitFor(() => {
        expect(screen.getByText('Validation Failed')).toBeInTheDocument();
        expect(
          screen.getByText('Please fix 3 errors below.')
        ).toBeInTheDocument();
        expect(screen.getByText('Username is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Age is required')).toBeInTheDocument();
      });

      // Fill form with invalid data
      const usernameInput = screen.getByLabelText('Username');
      const emailInput = screen.getByLabelText('Email Address');
      const ageInput = screen.getByLabelText('Age');

      await user.type(usernameInput, 'ab'); // Too short
      await user.type(emailInput, 'invalid-email');
      await user.type(ageInput, '16'); // Too young

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Username must be at least 3 characters')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
        expect(
          screen.getByText('You must be at least 18 years old')
        ).toBeInTheDocument();
      });

      // Fill form with valid data
      await user.clear(usernameInput);
      await user.type(usernameInput, 'validuser');
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.clear(ageInput);
      await user.type(ageInput, '25');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
        expect(
          screen.getByText('Your form has been submitted successfully.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery Workflows', () => {
    it('handles network errors during form submission with retry functionality', async () => {
      let shouldFail = true;

      function NetworkForm() {
        const formFeedback = useFormFeedback();
        const [email, setEmail] = React.useState('');

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();

          formFeedback.showInfo({
            message: 'Submitting form...',
            showAnimation: false,
          });

          try {
            // Simulate network request
            await new Promise((resolve, reject) => {
              setTimeout(() => {
                if (shouldFail) {
                  reject(new Error('Network error'));
                } else {
                  resolve('success');
                }
              }, 300);
            });

            formFeedback.showSuccess({
              message: 'Form submitted successfully!',
            });
          } catch (error) {
            formFeedback.showError({
              title: 'Network Error',
              message: 'Failed to submit form due to network issues.',
              suggestions: [
                'Check your internet connection',
                'Try again in a few moments',
              ],
              onRetry: () => handleSubmit(e),
              helpLink: {
                text: 'Contact Support',
                url: 'https://support.example.com',
              },
            });
          }
        };

        return (
          <form onSubmit={handleSubmit} className="space-y-4">
            <SmartInput
              label="Email"
              type="email"
              value={email}
              onValueChange={setEmail}
              validationRules={[commonValidationRules.email()]}
            />

            {formFeedback.feedback && (
              <FormFeedback {...formFeedback.feedback} />
            )}

            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded"
            >
              Submit
            </button>
          </form>
        );
      }

      render(<NetworkForm />);

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByText('Submit');

      await user.type(emailInput, 'test@example.com');
      fireEvent.click(submitButton);

      // Should show loading
      await waitFor(() => {
        expect(screen.getByText('Submitting form...')).toBeInTheDocument();
      });

      // Should show network error
      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument();
        expect(
          screen.getByText('Failed to submit form due to network issues.')
        ).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Simulate network recovery
      shouldFail = false;

      // Click retry
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);

      // Should show success
      await waitFor(() => {
        expect(
          screen.getByText('Form submitted successfully!')
        ).toBeInTheDocument();
      });
    });

    it('handles validation errors with field-specific error recovery', async () => {
      function FieldRecoveryForm() {
        const mobileValidation = useMobileFormValidation();
        const [formData, setFormData] = React.useState({
          email: '',
          phone: '',
          website: '',
        });

        const validateField = (field: string, value: string) => {
          switch (field) {
            case 'email':
              if (!commonValidationRules.email().test(value) && value.trim()) {
                mobileValidation.addError({
                  field: 'email',
                  message: 'Please enter a valid email address',
                  type: 'error',
                });
              } else {
                mobileValidation.removeError('email');
              }
              break;
            case 'phone':
              if (!commonValidationRules.phone().test(value) && value.trim()) {
                mobileValidation.addError({
                  field: 'phone',
                  message: 'Please enter a valid phone number',
                  type: 'error',
                });
              } else {
                mobileValidation.removeError('phone');
              }
              break;
            case 'website':
              const urlPattern = /^https?:\/\/.+\..+/;
              if (!urlPattern.test(value) && value.trim()) {
                mobileValidation.addError({
                  field: 'website',
                  message: 'Please enter a valid website URL',
                  type: 'error',
                });
              } else {
                mobileValidation.removeError('website');
              }
              break;
          }
        };

        const handleFieldChange = (field: string, value: string) => {
          setFormData((prev) => ({ ...prev, [field]: value }));
          validateField(field, value);
        };

        const handleErrorClick = (field: string) => {
          const input = screen.getByLabelText(
            field === 'email'
              ? 'Email Address'
              : field === 'phone'
                ? 'Phone Number'
                : field === 'website'
                  ? 'Website URL'
                  : field
          );
          input.focus();
        };

        const handleErrorDismiss = (field: string) => {
          mobileValidation.removeError(field);
          // Optionally clear the field or provide a default value
          if (field === 'email') {
            setFormData((prev) => ({ ...prev, email: '' }));
          }
        };

        return (
          <div className="space-y-4">
            <SmartInput
              label="Email Address"
              type="email"
              value={formData.email}
              onValueChange={(value) => handleFieldChange('email', value)}
              hint="Enter your work email"
            />

            <SmartInput
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onValueChange={(value) => handleFieldChange('phone', value)}
              hint="Include country code if international"
            />

            <SmartInput
              label="Website URL"
              type="url"
              value={formData.website}
              onValueChange={(value) => handleFieldChange('website', value)}
              hint="Include http:// or https://"
            />

            <MobileFormValidation
              errors={mobileValidation.errors}
              onErrorClick={handleErrorClick}
              onDismiss={handleErrorDismiss}
            />
          </div>
        );
      }

      render(<FieldRecoveryForm />);

      const emailInput = screen.getByLabelText('Email Address');
      const phoneInput = screen.getByLabelText('Phone Number');
      const websiteInput = screen.getByLabelText('Website URL');

      // Enter invalid data in all fields
      await user.type(emailInput, 'invalid-email');
      await user.type(phoneInput, 'invalid-phone');
      await user.type(websiteInput, 'invalid-url');

      // Should show all errors
      await waitFor(() => {
        expect(
          screen.getByText('Please enter a valid email address')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Please enter a valid phone number')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Please enter a valid website URL')
        ).toBeInTheDocument();
      });

      // Click on email error to focus field
      const emailError = screen.getByText('Email Address');
      fireEvent.click(emailError);
      expect(emailInput).toHaveFocus();

      // Fix email field
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      await waitFor(() => {
        expect(
          screen.queryByText('Please enter a valid email address')
        ).not.toBeInTheDocument();
      });

      // Dismiss phone error
      const phoneErrorDismiss = screen.getAllByTestId('x-icon')[0]; // First dismiss button
      fireEvent.click(phoneErrorDismiss);

      await waitFor(() => {
        expect(
          screen.queryByText('Please enter a valid phone number')
        ).not.toBeInTheDocument();
      });

      // Fix website field
      await user.clear(websiteInput);
      await user.type(websiteInput, 'https://example.com');

      await waitFor(() => {
        expect(
          screen.queryByText('Please enter a valid website URL')
        ).not.toBeInTheDocument();
      });

      // Should have no errors left
      expect(mobileValidation.errors).toHaveLength(0);
    });
  });
});
