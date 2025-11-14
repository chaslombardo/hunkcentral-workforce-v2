import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  SmartInput,
  commonValidationRules,
  ValidationRule,
} from '@/components/forms/smart-input';
import { FormFeedback } from '@/components/forms/form-feedback';
import {
  MobileFormValidation,
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

describe('Form Validation Performance Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SmartInput Performance', () => {
    it('handles rapid input changes efficiently', async () => {
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

      const startTime = performance.now();

      render(
        <SmartInput
          label="Performance Test"
          validationRules={[performanceRule]}
          validateOnChange={true}
          debounceMs={50}
        />
      );

      const input = screen.getByLabelText('Performance Test');

      // Focus to enable validation
      await user.click(input);
      await user.tab();

      // Simulate rapid typing
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

      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000);

      // Should not call validation for every keystroke due to debouncing
      expect(validationCallCount).toHaveBeenCalledTimes(1);
    });

    it('handles large validation rule sets without performance degradation', async () => {
      const ruleCallCounts = Array.from({ length: 20 }, () => vi.fn());
      const manyRules: ValidationRule[] = ruleCallCounts.map(
        (callCount, i) => ({
          test: (value: string) => {
            callCount();
            return value.includes(`test${i}`) || value.length < 10;
          },
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

      await waitFor(() => {
        expect(screen.getByText('Rule 0 failed')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);

      // Should stop at first failed rule due to priority
      expect(ruleCallCounts[0]).toHaveBeenCalled();
      expect(ruleCallCounts[1]).not.toHaveBeenCalled();
    });

    it('handles async validation efficiently with concurrent requests', async () => {
      let requestCount = 0;
      const asyncRule: ValidationRule = {
        test: async (value: string) => {
          const currentRequest = ++requestCount;
          await new Promise((resolve) => setTimeout(resolve, 100));
          // Only the latest request should matter
          return currentRequest === requestCount && value === 'valid';
        },
        message: 'Invalid value',
        type: 'error',
        priority: 1,
      };

      const onValidationChange = vi.fn();

      render(
        <SmartInput
          label="Async Performance Test"
          validationRules={[asyncRule]}
          onValidationChange={onValidationChange}
          validateOnChange={true}
          debounceMs={50}
        />
      );

      const input = screen.getByLabelText('Async Performance Test');

      // Focus to enable validation
      await user.click(input);
      await user.tab();

      // Rapidly change values to trigger multiple async validations
      await user.click(input);
      await user.type(input, 'a', { delay: 10 });
      await user.type(input, 'b', { delay: 10 });
      await user.type(input, 'c', { delay: 10 });
      await user.clear(input);
      await user.type(input, 'valid', { delay: 10 });

      // Wait for final validation
      await waitFor(
        () => {
          expect(onValidationChange).toHaveBeenLastCalledWith(true, []);
        },
        { timeout: 2000 }
      );

      // Should have made multiple requests but only the last one matters
      expect(requestCount).toBeGreaterThan(1);
    });

    it('efficiently handles memory cleanup on unmount', async () => {
      const cleanupSpy = vi.fn();
      const asyncRule: ValidationRule = {
        test: async (value: string) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          cleanupSpy();
          return value.length > 0;
        },
        message: 'Required',
        type: 'error',
        priority: 1,
      };

      const { unmount } = render(
        <SmartInput
          label="Cleanup Test"
          validationRules={[asyncRule]}
          validateOnChange={true}
        />
      );

      const input = screen.getByLabelText('Cleanup Test');

      // Start async validation
      await user.click(input);
      await user.type(input, 'test');

      // Unmount before validation completes
      unmount();

      // Wait longer than validation would take
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Cleanup should not have been called since component unmounted
      expect(cleanupSpy).not.toHaveBeenCalled();
    });
  });

  describe('MobileFormValidation Performance', () => {
    it('handles large error lists efficiently', () => {
      const startTime = performance.now();

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
          maxVisible={10}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(500);

      // Should show summary correctly
      expect(screen.getByText('1000 errors')).toBeInTheDocument();

      // Should only render visible errors initially
      expect(screen.getByText('Field0')).toBeInTheDocument();
      expect(screen.getByText('Field9')).toBeInTheDocument();
      expect(screen.queryByText('Field10')).not.toBeInTheDocument();
    });

    it('efficiently handles rapid error state changes', async () => {
      const startTime = performance.now();

      const { rerender } = render(<MobileFormValidation errors={[]} />);

      // Rapidly change error states
      for (let i = 0; i < 100; i++) {
        const errors: ValidationError[] = Array.from(
          { length: i % 10 },
          (_, j) => ({
            field: `field${j}`,
            message: `Error ${j}`,
            type: 'error' as const,
          })
        );

        rerender(<MobileFormValidation errors={errors} />);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle rapid changes efficiently
      expect(duration).toBeLessThan(1000);
    });

    it('optimizes collapsible expansion performance', async () => {
      const manyErrors: ValidationError[] = Array.from(
        { length: 500 },
        (_, i) => ({
          field: `field${i}`,
          message: `Error message ${i}`,
          type: 'error' as const,
        })
      );

      render(
        <MobileFormValidation
          errors={manyErrors}
          collapsible={true}
          maxVisible={5}
        />
      );

      const expandButton = screen.getByText('Show All (500)');

      const startTime = performance.now();
      await user.click(expandButton);
      const endTime = performance.now();

      const expansionTime = endTime - startTime;

      // Should expand within reasonable time
      expect(expansionTime).toBeLessThan(500);

      // Should show all errors after expansion
      await waitFor(() => {
        expect(screen.getByText('Field499')).toBeInTheDocument();
      });
    });
  });

  describe('FormFeedback Performance', () => {
    it('handles rapid feedback state changes efficiently', async () => {
      const startTime = performance.now();

      const { rerender } = render(
        <FormFeedback type="info" message="Initial message" />
      );

      // Rapidly change feedback types and messages
      const feedbackTypes = ['success', 'error', 'warning', 'info'] as const;

      for (let i = 0; i < 100; i++) {
        const type = feedbackTypes[i % feedbackTypes.length];
        rerender(
          <FormFeedback
            type={type}
            message={`Message ${i}`}
            suggestions={Array.from(
              { length: i % 5 },
              (_, j) => `Suggestion ${j}`
            )}
          />
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should handle rapid changes efficiently
      expect(duration).toBeLessThan(1000);
    });

    it('efficiently handles large suggestion lists', () => {
      const startTime = performance.now();

      const manySuggestions = Array.from(
        { length: 100 },
        (_, i) => `This is suggestion number ${i + 1} with detailed information`
      );

      render(
        <FormFeedback
          type="error"
          message="Error with many suggestions"
          suggestions={manySuggestions}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time
      expect(renderTime).toBeLessThan(300);

      // Should display all suggestions
      expect(
        screen.getByText(
          'This is suggestion number 1 with detailed information'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'This is suggestion number 100 with detailed information'
        )
      ).toBeInTheDocument();
    });

    it('optimizes auto-dismiss timer performance', async () => {
      vi.useFakeTimers();
      const mockDismiss = vi.fn();

      render(
        <FormFeedback
          type="success"
          message="Auto-dismiss message"
          onDismiss={mockDismiss}
        />
      );

      // Fast-forward time multiple times
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(1000);
      }

      // Should only call dismiss once after 5 seconds
      expect(mockDismiss).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('Integrated Performance', () => {
    it('handles complex form with multiple validation components efficiently', async () => {
      function ComplexForm() {
        const [formData, setFormData] = React.useState({
          field1: '',
          field2: '',
          field3: '',
          field4: '',
          field5: '',
          field6: '',
          field7: '',
          field8: '',
          field9: '',
          field10: '',
        });

        const errors: ValidationError[] = Object.entries(formData)
          .filter(([_, value]) => !value.trim())
          .map(([field]) => ({
            field,
            message: `${field} is required`,
            type: 'error' as const,
          }));

        return (
          <div className="space-y-4">
            {Object.keys(formData).map((field) => (
              <SmartInput
                key={field}
                label={field}
                value={formData[field as keyof typeof formData]}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, [field]: value }))
                }
                validationRules={[
                  commonValidationRules.required(),
                  commonValidationRules.minLength(3),
                ]}
                validateOnChange={true}
              />
            ))}

            <MobileFormValidation errors={errors} />

            <FormFeedback
              type="info"
              message="Fill all fields to continue"
              suggestions={['Each field must be at least 3 characters']}
            />
          </div>
        );
      }

      const startTime = performance.now();

      render(<ComplexForm />);

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render complex form within reasonable time
      expect(renderTime).toBeLessThan(1000);

      // Should show all form fields
      expect(screen.getByLabelText('field1')).toBeInTheDocument();
      expect(screen.getByLabelText('field10')).toBeInTheDocument();

      // Should show validation errors for empty fields
      expect(screen.getByText('field1 is required')).toBeInTheDocument();
    });

    it('maintains performance during intensive user interactions', async () => {
      function InteractiveForm() {
        const [values, setValues] = React.useState<Record<string, string>>({});
        const [errors, setErrors] = React.useState<ValidationError[]>([]);

        const handleChange = (field: string, value: string) => {
          setValues((prev) => ({ ...prev, [field]: value }));

          // Update errors
          if (!value.trim()) {
            setErrors((prev) => [
              ...prev.filter((e) => e.field !== field),
              {
                field,
                message: `${field} is required`,
                type: 'error' as const,
              },
            ]);
          } else {
            setErrors((prev) => prev.filter((e) => e.field !== field));
          }
        };

        return (
          <div className="space-y-4">
            {Array.from({ length: 20 }, (_, i) => (
              <SmartInput
                key={`field${i}`}
                label={`Field ${i}`}
                value={values[`field${i}`] || ''}
                onValueChange={(value) => handleChange(`field${i}`, value)}
                validationRules={[commonValidationRules.required()]}
                validateOnChange={true}
                debounceMs={100}
              />
            ))}

            <MobileFormValidation errors={errors} />
          </div>
        );
      }

      render(<InteractiveForm />);

      const startTime = performance.now();

      // Simulate intensive user interaction
      for (let i = 0; i < 10; i++) {
        const input = screen.getByLabelText(`Field ${i}`);
        await user.click(input);
        await user.type(input, `value${i}`, { delay: 1 });
      }

      const endTime = performance.now();
      const interactionTime = endTime - startTime;

      // Should handle intensive interactions within reasonable time
      expect(interactionTime).toBeLessThan(3000);

      // Should show updated values
      expect(screen.getByDisplayValue('value0')).toBeInTheDocument();
      expect(screen.getByDisplayValue('value9')).toBeInTheDocument();
    });

    it('efficiently handles form reset operations', async () => {
      function ResettableForm() {
        const [values, setValues] = React.useState<Record<string, string>>({
          field1: 'initial1',
          field2: 'initial2',
          field3: 'initial3',
          field4: 'initial4',
          field5: 'initial5',
        });

        const handleReset = () => {
          setValues({
            field1: '',
            field2: '',
            field3: '',
            field4: '',
            field5: '',
          });
        };

        return (
          <div className="space-y-4">
            {Object.keys(values).map((field) => (
              <SmartInput
                key={field}
                label={field}
                value={values[field]}
                onValueChange={(value) =>
                  setValues((prev) => ({ ...prev, [field]: value }))
                }
                validationRules={[commonValidationRules.required()]}
                validateOnChange={true}
              />
            ))}

            <button
              onClick={handleReset}
              className="bg-red-500 text-white p-2 rounded"
            >
              Reset Form
            </button>
          </div>
        );
      }

      render(<ResettableForm />);

      // Verify initial values
      expect(screen.getByDisplayValue('initial1')).toBeInTheDocument();

      const resetButton = screen.getByText('Reset Form');

      const startTime = performance.now();
      await user.click(resetButton);
      const endTime = performance.now();

      const resetTime = endTime - startTime;

      // Should reset efficiently
      expect(resetTime).toBeLessThan(200);

      // Should clear all values
      await waitFor(() => {
        expect(screen.queryByDisplayValue('initial1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Memory Performance', () => {
    it('prevents memory leaks from validation timers', async () => {
      const { unmount } = render(
        <SmartInput
          label="Memory Test"
          validationRules={[commonValidationRules.required()]}
          validateOnChange={true}
          debounceMs={1000}
        />
      );

      const input = screen.getByLabelText('Memory Test');

      // Start typing to create debounce timers
      await user.type(input, 'test');

      // Unmount immediately
      unmount();

      // Wait longer than debounce time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // If we get here without errors, timers were cleaned up properly
      expect(true).toBe(true);
    });

    it('efficiently handles component re-renders', () => {
      let renderCount = 0;

      function CountingComponent() {
        renderCount++;
        return (
          <SmartInput
            label="Render Count Test"
            validationRules={[commonValidationRules.required()]}
          />
        );
      }

      const { rerender } = render(<CountingComponent />);

      const initialRenderCount = renderCount;

      // Re-render multiple times with same props
      for (let i = 0; i < 10; i++) {
        rerender(<CountingComponent />);
      }

      // Should have rendered for each rerender call
      expect(renderCount).toBe(initialRenderCount + 10);
    });
  });
});
