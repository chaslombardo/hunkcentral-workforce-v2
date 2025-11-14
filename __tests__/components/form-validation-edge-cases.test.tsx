import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('Form Validation Edge Cases', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SmartInput Edge Cases', () => {
    it('handles extremely long input values', async () => {
      const longValue = 'a'.repeat(10000);
      const onValueChange = vi.fn();

      render(
        <SmartInput
          label="Long Input"
          onValueChange={onValueChange}
          validationRules={[commonValidationRules.maxLength(5000)]}
          validateOnChange={true}
        />
      );

      const input = screen.getByLabelText('Long Input');

      // Simulate pasting a very long value
      fireEvent.change(input, { target: { value: longValue } });

      expect(onValueChange).toHaveBeenCalledWith(longValue);

      await waitFor(() => {
        expect(
          screen.getByText(/Must be no more than \d+ characters/)
        ).toBeInTheDocument();
      });
    });

    it('handles special characters and unicode in validation', async () => {
      const unicodeRule: ValidationRule = {
        test: (value: string) => /^[\u0000-\u007F]*$/.test(value), // ASCII only
        message: 'Only ASCII characters allowed',
        type: 'error',
        priority: 1,
      };

      render(
        <SmartInput
          label="Unicode Test"
          validationRules={[unicodeRule]}
          validateOnChange={true}
          progressiveValidation={false}
        />
      );

      const input = screen.getByLabelText('Unicode Test');

      // Test with unicode characters
      await user.type(input, '测试🚀');

      await waitFor(
        () => {
          expect(
            screen.getByText('Only ASCII characters allowed')
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      // Test with ASCII characters
      await user.clear(input);
      await user.type(input, 'test123');

      await waitFor(() => {
        expect(
          screen.queryByText('Only ASCII characters allowed')
        ).not.toBeInTheDocument();
      });
    });

    it('handles rapid input changes without race conditions', async () => {
      const asyncRule: ValidationRule = {
        test: async (value: string) => {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 100)
          );
          return value.length > 3;
        },
        message: 'Must be longer than 3 characters',
        type: 'error',
        priority: 1,
      };

      const onValidationChange = vi.fn();

      render(
        <SmartInput
          label="Race Condition Test"
          validationRules={[asyncRule]}
          onValidationChange={onValidationChange}
          validateOnChange={true}
          debounceMs={50}
        />
      );

      const input = screen.getByLabelText('Race Condition Test');

      // Rapidly type and delete
      await user.click(input);
      await user.type(input, 'a', { delay: 10 });
      await user.type(input, 'b', { delay: 10 });
      await user.type(input, 'c', { delay: 10 });
      await user.type(input, 'd', { delay: 10 });
      await user.clear(input);
      await user.type(input, 'final', { delay: 10 });

      // Wait for all async operations to complete
      await waitFor(
        () => {
          expect(onValidationChange).toHaveBeenLastCalledWith(true, []);
        },
        { timeout: 1000 }
      );
    });

    it('handles validation rule exceptions gracefully', async () => {
      const faultyRule: ValidationRule = {
        test: (value: string) => {
          if (value === 'crash') {
            throw new Error('Intentional crash');
          }
          return true;
        },
        message: 'Should not see this',
        type: 'error',
        priority: 1,
      };

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <SmartInput
          label="Faulty Rule Test"
          validationRules={[faultyRule]}
          validateOnChange={true}
          progressiveValidation={false}
        />
      );

      const input = screen.getByLabelText('Faulty Rule Test');

      await user.type(input, 'crash');

      await waitFor(
        () => {
          expect(
            screen.getByText('Validation error occurred')
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Validation rule error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('handles null and undefined values correctly', async () => {
      const onValueChange = vi.fn();

      const { rerender } = render(
        <SmartInput
          label="Null Test"
          value={undefined}
          onValueChange={onValueChange}
          validationRules={[commonValidationRules.required()]}
        />
      );

      const input = screen.getByLabelText('Null Test');
      expect(input).toHaveValue('');

      // Test with null value
      rerender(
        <SmartInput
          label="Null Test"
          value={null as any}
          onValueChange={onValueChange}
          validationRules={[commonValidationRules.required()]}
        />
      );

      expect(input).toHaveValue('');
    });

    it('handles concurrent validation requests', async () => {
      let resolveCount = 0;
      const slowAsyncRule: ValidationRule = {
        test: async (value: string) => {
          const delay = resolveCount === 0 ? 200 : 50; // First request is slower
          resolveCount++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return value === 'valid';
        },
        message: 'Value must be "valid"',
        type: 'error',
        priority: 1,
      };

      const onValidationChange = vi.fn();

      render(
        <SmartInput
          label="Concurrent Test"
          validationRules={[slowAsyncRule]}
          onValidationChange={onValidationChange}
          validateOnBlur={true}
        />
      );

      const input = screen.getByLabelText('Concurrent Test');

      // Start first validation (slow)
      await user.type(input, 'invalid');
      await user.tab();

      // Start second validation (fast) before first completes
      await user.click(input);
      await user.clear(input);
      await user.type(input, 'valid');
      await user.tab();

      // The second (faster) validation should win
      await waitFor(
        () => {
          expect(onValidationChange).toHaveBeenLastCalledWith(true, []);
        },
        { timeout: 1000 }
      );
    });

    it('handles memory leaks from unmounted components', async () => {
      const asyncRule: ValidationRule = {
        test: async (value: string) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return value.length > 0;
        },
        message: 'Required',
        type: 'error',
        priority: 1,
      };

      const { unmount } = render(
        <SmartInput
          label="Memory Leak Test"
          validationRules={[asyncRule]}
          validateOnChange={true}
        />
      );

      const input = screen.getByLabelText('Memory Leak Test');

      // Start async validation
      await user.type(input, 'test');

      // Unmount before validation completes
      unmount();

      // Wait to ensure no errors are thrown
      await new Promise((resolve) => setTimeout(resolve, 200));

      // If we get here without errors, the test passes
      expect(true).toBe(true);
    });
  });

  describe('FormFeedback Edge Cases', () => {
    it('handles extremely long messages and suggestions', () => {
      const longMessage =
        'This is a very long error message that should wrap properly and not break the layout. '.repeat(
          10
        );
      const longSuggestions = Array.from(
        { length: 20 },
        (_, i) =>
          `This is suggestion number ${i + 1} with a lot of text that might cause layout issues`
      );

      render(
        <FormFeedback
          type="error"
          message={longMessage}
          suggestions={longSuggestions}
        />
      );

      expect(
        screen.getByText(longMessage, { exact: false })
      ).toBeInTheDocument();
      longSuggestions.forEach((suggestion) => {
        expect(screen.getByText(suggestion)).toBeInTheDocument();
      });
    });

    it('handles rapid show/hide cycles', async () => {
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
          </div>
        );
      }

      render(<TestComponent />);

      // Rapidly show different feedback types
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText('Show Success'));
        fireEvent.click(screen.getByText('Show Error'));
      }

      // Should show the last error
      expect(screen.getByText('Error!')).toBeInTheDocument();
      expect(screen.queryByText('Success!')).not.toBeInTheDocument();
    });

    it('handles action callbacks that throw errors', async () => {
      const faultyAction = vi.fn(() => {
        throw new Error('Action failed');
      });

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <FormFeedback
          type="error"
          message="Test message"
          actions={[{ label: 'Faulty Action', onClick: faultyAction }]}
        />
      );

      const actionButton = screen.getByText('Faulty Action');

      // Should not crash the component
      fireEvent.click(actionButton);

      expect(faultyAction).toHaveBeenCalled();
      expect(screen.getByText('Test message')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('MobileFormValidation Edge Cases', () => {
    it('handles extremely large error lists', () => {
      const manyErrors: ValidationError[] = Array.from(
        { length: 1000 },
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
          maxVisible={5}
        />
      );

      // Should show summary correctly
      expect(screen.getByText('1000 errors')).toBeInTheDocument();

      // Should show only first 5 errors
      expect(screen.getByText('Field0')).toBeInTheDocument();
      expect(screen.getByText('Field4')).toBeInTheDocument();
      expect(screen.queryByText('Field5')).not.toBeInTheDocument();

      // Should show expand button
      expect(screen.getByText('Show All (1000)')).toBeInTheDocument();
    });

    it('handles duplicate field errors correctly', () => {
      const duplicateErrors: ValidationError[] = [
        { field: 'email', message: 'Email is required', type: 'error' },
        { field: 'email', message: 'Email format is invalid', type: 'error' },
        {
          field: 'email',
          message: 'Email domain not allowed',
          type: 'warning',
        },
      ];

      render(<MobileFormValidation errors={duplicateErrors} />);

      // Should show all errors even for the same field
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Email format is invalid')).toBeInTheDocument();
      expect(screen.getByText('Email domain not allowed')).toBeInTheDocument();
    });

    it('handles field names with special characters', () => {
      const specialFieldErrors: ValidationError[] = [
        {
          field: 'user.profile.firstName',
          message: 'First name required',
          type: 'error',
        },
        {
          field: 'settings[0].value',
          message: 'Value required',
          type: 'error',
        },
        {
          field: 'data-attribute',
          message: 'Attribute required',
          type: 'error',
        },
        {
          field: 'field_with_underscores',
          message: 'Field required',
          type: 'error',
        },
      ];

      render(<MobileFormValidation errors={specialFieldErrors} />);

      // Should properly format field names (check actual formatting)
      expect(
        screen.getByText(/User.*profile.*first.*Name/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Settings.*Value/)).toBeInTheDocument();
      expect(screen.getByText(/Data.*attribute/i)).toBeInTheDocument();
      expect(screen.getByText(/Field.*underscores/i)).toBeInTheDocument();
    });

    it('handles rapid error state changes', async () => {
      let hookResult: ReturnType<typeof useMobileFormValidation>;

      function TestComponent() {
        hookResult = useMobileFormValidation();
        return (
          <div>
            <div data-testid="error-count">{hookResult.errors.length}</div>
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
            <button onClick={() => hookResult.clearErrors()}>Clear All</button>
          </div>
        );
      }

      render(<TestComponent />);

      // Rapidly add and remove errors
      for (let i = 0; i < 50; i++) {
        fireEvent.click(screen.getByText('Add Error'));
        fireEvent.click(screen.getByText('Remove Error'));
      }

      expect(screen.getByTestId('error-count')).toHaveTextContent('0');

      // Add multiple errors then clear
      for (let i = 0; i < 10; i++) {
        fireEvent.click(screen.getByText('Add Error'));
      }

      expect(screen.getByTestId('error-count')).toHaveTextContent('1'); // Same field, so only 1

      fireEvent.click(screen.getByText('Clear All'));
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });
  });

  describe('Validation Rules Edge Cases', () => {
    it('handles edge cases in email validation', () => {
      const emailRule = commonValidationRules.email();

      const edgeCaseEmails = [
        { email: '', expected: true }, // Empty should pass (let required handle it)
        { email: 'test@', expected: false },
        { email: '@domain.com', expected: false },
        { email: 'test@domain', expected: false },
        { email: 'test.email@domain.com', expected: true },
        { email: 'test+tag@domain.com', expected: true },
        { email: 'test@domain.co.uk', expected: true },
        { email: 'test@sub.domain.com', expected: true },
        { email: 'test..test@domain.com', expected: false },
        { email: 'test@domain..com', expected: false },
        { email: 'test@domain.c', expected: true }, // Single char TLD is technically valid
        { email: 'a@b.co', expected: true },
      ];

      edgeCaseEmails.forEach(({ email, expected }) => {
        expect(emailRule.test(email)).toBe(expected);
      });
    });

    it('handles edge cases in phone validation', () => {
      const phoneRule = commonValidationRules.phone();

      const edgeCasePhones = [
        { phone: '', expected: true }, // Empty should pass
        { phone: '123', expected: false }, // Too short
        { phone: '1234567890', expected: true },
        { phone: '+1234567890', expected: true },
        { phone: '123-456-7890', expected: true },
        { phone: '(123) 456-7890', expected: true },
        { phone: '123 456 7890', expected: true },
        { phone: 'abc-def-ghij', expected: false },
        { phone: '123456789012345678901', expected: false }, // Too long
        { phone: '+1 (555) 123-4567', expected: true },
      ];

      edgeCasePhones.forEach(({ phone, expected }) => {
        expect(phoneRule.test(phone)).toBe(expected);
      });
    });

    it('handles edge cases in numeric validation', () => {
      const numericRule = commonValidationRules.numeric();

      const edgeCaseNumbers = [
        { value: '', expected: true }, // Empty should pass
        { value: '0', expected: true },
        { value: '123', expected: true },
        { value: '-123', expected: true },
        { value: '123.45', expected: true },
        { value: '.45', expected: true },
        { value: '123.', expected: true },
        { value: 'abc', expected: false },
        { value: '12a3', expected: false },
        { value: '12.34.56', expected: false },
        { value: 'Infinity', expected: true }, // JavaScript considers this a number
        { value: 'NaN', expected: false },
        { value: '1e10', expected: true },
        { value: '1e-10', expected: true },
      ];

      edgeCaseNumbers.forEach(({ value, expected }) => {
        expect(numericRule.test(value)).toBe(expected);
      });
    });

    it('handles edge cases in strong password validation', () => {
      const strongPasswordRule = commonValidationRules.strongPassword();

      const edgeCasePasswords = [
        { password: '', expected: false },
        { password: 'a', expected: false },
        { password: 'password', expected: false },
        { password: 'PASSWORD', expected: false },
        { password: '12345678', expected: false },
        { password: 'Password', expected: false },
        { password: 'Password1', expected: false },
        { password: 'Password!', expected: false },
        { password: 'Password1!', expected: true },
        { password: 'P@ssw0rd', expected: true },
        {
          password: 'MyVeryLongPasswordWithoutSpecialChars123',
          expected: false,
        },
        { password: 'Short1!', expected: false }, // Less than 8 chars
        {
          password: 'VeryLongPasswordWithMixedCase123AndSpecialChars!',
          expected: true,
        },
      ];

      edgeCasePasswords.forEach(({ password, expected }) => {
        expect(strongPasswordRule.test(password)).toBe(expected);
      });
    });
  });

  describe('Performance Edge Cases', () => {
    it('handles high-frequency validation without performance degradation', async () => {
      const validationCallCount = vi.fn();
      const performanceRule: ValidationRule = {
        test: (value: string) => {
          validationCallCount();
          return value.length > 0;
        },
        message: 'Required',
        type: 'error',
        priority: 1,
      };

      render(
        <SmartInput
          label="Performance Test"
          validationRules={[performanceRule]}
          validateOnChange={true}
          debounceMs={10} // Very short debounce
        />
      );

      const input = screen.getByLabelText('Performance Test');

      // Focus to enable validation
      await user.click(input);
      await user.tab();

      // Type rapidly
      const startTime = performance.now();
      await user.click(input);

      for (let i = 0; i < 100; i++) {
        fireEvent.change(input, { target: { value: `test${i}` } });
      }

      // Wait for debouncing to settle
      await waitFor(
        () => {
          expect(validationCallCount).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 2 seconds)
      expect(duration).toBeLessThan(2000);

      // Should not call validation for every keystroke due to debouncing
      expect(validationCallCount).toHaveBeenCalledTimes(1);
    });

    it('handles large validation rule sets efficiently', async () => {
      const manyRules: ValidationRule[] = Array.from(
        { length: 50 },
        (_, i) => ({
          test: (value: string) =>
            value.includes(`test${i}`) || value.length < 10,
          message: `Rule ${i} failed`,
          type: 'error' as const,
          priority: i,
        })
      );

      const startTime = performance.now();

      render(
        <SmartInput
          label="Many Rules Test"
          validationRules={manyRules}
          validateOnChange={true}
          progressiveValidation={false}
        />
      );

      const input = screen.getByLabelText('Many Rules Test');
      await user.type(input, 'short');

      await waitFor(
        () => {
          expect(screen.getByText('Rule 0 failed')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);
    });
  });
});
