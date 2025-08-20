import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  SmartInput,
  commonValidationRules,
} from '@/components/forms/smart-input';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className?: string }) => (
    <div data-testid="check-icon" className={className} />
  ),
  AlertCircle: ({ className }: { className?: string }) => (
    <div data-testid="alert-icon" className={className} />
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
}));

describe('SmartInput', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with basic props', () => {
    render(
      <SmartInput
        label="Test Input"
        placeholder="Enter text"
        hint="This is a hint"
      />
    );

    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    expect(screen.getByText('This is a hint')).toBeInTheDocument();
  });

  it('shows error state when error prop is provided', () => {
    render(<SmartInput label="Test Input" error="This field has an error" />);

    expect(screen.getByText('This field has an error')).toBeInTheDocument();
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
  });

  it('shows success state when success prop is provided', () => {
    render(<SmartInput label="Test Input" success="This field is valid" />);

    expect(screen.getByText('This field is valid')).toBeInTheDocument();
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('shows loading state when loading prop is true', () => {
    render(<SmartInput label="Test Input" loading={true} />);

    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
  });

  it('calls onValueChange when input value changes', async () => {
    const onValueChange = vi.fn();

    render(<SmartInput label="Test Input" onValueChange={onValueChange} />);

    const input = screen.getByLabelText('Test Input');
    await user.type(input, 'test value');

    expect(onValueChange).toHaveBeenCalledWith('test value');
  });

  it('validates required field', async () => {
    const onValidationChange = vi.fn();

    render(
      <SmartInput
        label="Required Field"
        validationRules={[commonValidationRules.required()]}
        onValidationChange={onValidationChange}
        validateOnBlur={true}
      />
    );

    const input = screen.getByLabelText('Required Field');

    // Focus and blur without entering text
    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false, [
        'This field is required',
      ]);
    });

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    const onValidationChange = vi.fn();

    render(
      <SmartInput
        label="Email Field"
        type="email"
        validationRules={[commonValidationRules.email()]}
        onValidationChange={onValidationChange}
        validateOnChange={true}
      />
    );

    const input = screen.getByLabelText('Email Field');

    // Enter invalid email
    await user.type(input, 'invalid-email');

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false, [
        'Please enter a valid email address',
      ]);
    });

    // Clear and enter valid email
    await user.clear(input);
    await user.type(input, 'test@example.com');

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(true, []);
    });
  });

  it('shows password toggle when showPasswordToggle is true', async () => {
    render(
      <SmartInput
        label="Password Field"
        type="password"
        showPasswordToggle={true}
      />
    );

    const toggleButton = screen.getByLabelText('Show password');
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();

    // Click to show password
    await user.click(toggleButton);

    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();
  });

  it('validates with multiple rules in priority order', async () => {
    const onValidationChange = vi.fn();

    render(
      <SmartInput
        label="Multi-Rule Field"
        validationRules={[
          commonValidationRules.required(),
          commonValidationRules.minLength(5),
          commonValidationRules.email(),
        ]}
        onValidationChange={onValidationChange}
        validateOnBlur={true}
      />
    );

    const input = screen.getByLabelText('Multi-Rule Field');

    // Test empty field (should show required error first)
    await user.click(input);
    await user.tab();

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false, [
        'This field is required',
      ]);
    });

    // Test short input (should show minLength error)
    await user.click(input);
    await user.type(input, 'abc');
    await user.tab();

    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false, [
        'Must be at least 5 characters',
      ]);
    });
  });

  it('supports progressive validation', async () => {
    render(
      <SmartInput
        label="Progressive Field"
        validationRules={[commonValidationRules.required()]}
        progressiveValidation={true}
        validateOnChange={true}
      />
    );

    const input = screen.getByLabelText('Progressive Field');

    // Initially, no validation should be shown
    expect(
      screen.queryByText('This field is required')
    ).not.toBeInTheDocument();

    // Focus the input
    await user.click(input);

    // Still no validation shown
    expect(
      screen.queryByText('This field is required')
    ).not.toBeInTheDocument();

    // Type and delete to trigger validation
    await user.type(input, 'a');
    await user.clear(input);

    // Now validation should be shown
    await waitFor(() => {
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  it('debounces validation when validateOnChange is true', async () => {
    const mockValidationRule = {
      test: vi.fn().mockResolvedValue(true),
      message: 'Test validation',
      type: 'error' as const,
      priority: 1,
    };

    render(
      <SmartInput
        label="Debounced Field"
        validationRules={[mockValidationRule]}
        validateOnChange={true}
        debounceMs={100}
      />
    );

    const input = screen.getByLabelText('Debounced Field');

    // Focus first to enable validation
    await user.click(input);
    await user.tab();

    // Type multiple characters quickly
    await user.click(input);
    await user.type(input, 'abc', { delay: 10 });

    // Wait for debounce
    await waitFor(
      () => {
        expect(mockValidationRule.test).toHaveBeenCalledWith('abc');
      },
      { timeout: 200 }
    );

    // Should only be called once due to debouncing
    expect(mockValidationRule.test).toHaveBeenCalledTimes(1);
  });

  it('handles async validation rules', async () => {
    const asyncRule = {
      test: vi.fn().mockImplementation(async (value: string) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return value === 'valid';
      }),
      message: 'Async validation failed',
      type: 'error' as const,
      priority: 1,
    };

    const onValidationChange = vi.fn();

    render(
      <SmartInput
        label="Async Field"
        validationRules={[asyncRule]}
        onValidationChange={onValidationChange}
        validateOnBlur={true}
      />
    );

    const input = screen.getByLabelText('Async Field');

    await user.type(input, 'invalid');
    await user.tab();

    // Should show loading state
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument();

    // Wait for async validation to complete
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false, [
        'Async validation failed',
      ]);
    });

    expect(screen.getByText('Async validation failed')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <SmartInput
        label="Accessible Field"
        hint="This is a hint"
        error="This is an error"
      />
    );

    const input = screen.getByLabelText('Accessible Field');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain('hint');
    expect(describedBy).toContain('error');
  });

  it('supports custom validation rules with different types', async () => {
    const warningRule = {
      test: (value: string) => value.length > 10,
      message: 'Consider shortening this',
      type: 'warning' as const,
      priority: 1,
    };

    const infoRule = {
      test: () => true,
      message: 'This is informational',
      type: 'info' as const,
      priority: 2,
    };

    render(
      <SmartInput
        label="Custom Rules Field"
        validationRules={[warningRule, infoRule]}
        validateOnChange={true}
        progressiveValidation={false}
      />
    );

    const input = screen.getByLabelText('Custom Rules Field');

    await user.type(input, 'short');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText('Consider shortening this')).toBeInTheDocument();
      expect(screen.getByText('This is informational')).toBeInTheDocument();
    });
  });
});
