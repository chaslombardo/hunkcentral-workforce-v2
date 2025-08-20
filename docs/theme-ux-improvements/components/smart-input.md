# SmartInput Component

The `SmartInput` component provides progressive validation with real-time feedback, accessibility enhancements, and mobile optimization for form inputs.

## Overview

The SmartInput enhances the standard input functionality with:

- **Progressive validation** that shows feedback as users interact
- **Real-time validation** with debounced async support
- **Accessibility enhancements** with ARIA labels and descriptions
- **Mobile optimization** with appropriate keyboard types
- **Visual feedback** with success, error, and warning states
- **Password toggle** functionality for secure inputs

## API Reference

### Props

```tsx
interface SmartInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  // Required
  label: string;

  // Validation
  error?: string;
  success?: string;
  hint?: string;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  showValidation?: boolean;
  progressiveValidation?: boolean;
  validationRules?: ValidationRule[];

  // Callbacks
  onValueChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;

  // Features
  showPasswordToggle?: boolean;
  loading?: boolean;
  debounceMs?: number;

  // Mobile
  mobileOptimized?: boolean;
  keyboardType?: 'default' | 'email' | 'numeric' | 'tel' | 'url' | 'search';
}
```

### ValidationRule Interface

```tsx
interface ValidationRule {
  test: (value: string) => boolean | Promise<boolean>;
  message: string;
  type: 'error' | 'warning' | 'info';
  priority: number; // Lower numbers have higher priority
}
```

## Usage Examples

### Basic Usage

```tsx
import { SmartInput } from '@/components/forms/smart-input';

<SmartInput
  label="Full Name"
  placeholder="Enter your full name"
  hint="This will be displayed on your profile"
/>;
```

### With Validation Rules

```tsx
import {
  SmartInput,
  commonValidationRules,
} from '@/components/forms/smart-input';

<SmartInput
  label="Email Address"
  type="email"
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.email(),
  ]}
  progressiveValidation
  validateOnChange
/>;
```

### Password Input

```tsx
<SmartInput
  label="Password"
  type="password"
  showPasswordToggle
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.strongPassword(),
    commonValidationRules.passwordStrengthWarning(),
  ]}
  progressiveValidation
/>
```

### Mobile-Optimized Inputs

```tsx
// Phone number input
<SmartInput
  label="Phone Number"
  keyboardType="tel"
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.phone()
  ]}
  mobileOptimized
/>

// Numeric input
<SmartInput
  label="Amount"
  keyboardType="numeric"
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.positiveNumber()
  ]}
  mobileOptimized
/>
```

### Form Integration

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function LoginForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <SmartInput
            label="Email Address"
            type="email"
            error={errors.email?.message}
            validationRules={[
              commonValidationRules.required(),
              commonValidationRules.email(),
            ]}
            progressiveValidation
            {...field}
          />
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <SmartInput
            label="Password"
            type="password"
            showPasswordToggle
            error={errors.password?.message}
            validationRules={[
              commonValidationRules.required(),
              commonValidationRules.minLength(8),
            ]}
            progressiveValidation
            {...field}
          />
        )}
      />

      <BrandButton type="submit" variant="primary">
        Sign In
      </BrandButton>
    </form>
  );
}
```

### Custom Validation Rules

```tsx
// Custom async validation
const checkUsernameAvailability: ValidationRule = {
  test: async (value) => {
    if (value.length < 3) return true // Don't check short usernames

    const response = await fetch(`/api/check-username?username=${value}`)
    const { available } = await response.json()
    return available
  },
  message: 'This username is already taken',
  type: 'error',
  priority: 3
}

<SmartInput
  label="Username"
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.minLength(3),
    checkUsernameAvailability
  ]}
  progressiveValidation
  debounceMs={500}
/>
```

## Common Validation Rules

The component includes pre-built validation rules:

### Required Field

```tsx
commonValidationRules.required('This field is required');
```

### Length Validation

```tsx
commonValidationRules.minLength(8, 'Must be at least 8 characters');
commonValidationRules.maxLength(50, 'Must be no more than 50 characters');
```

### Format Validation

```tsx
commonValidationRules.email('Please enter a valid email address');
commonValidationRules.phone('Please enter a valid phone number');
commonValidationRules.numeric('Please enter a valid number');
commonValidationRules.positiveNumber('Please enter a positive number');
```

### Password Validation

```tsx
commonValidationRules.strongPassword();
commonValidationRules.passwordStrengthWarning(); // Shows as warning, not error
```

### Informational Rules

```tsx
commonValidationRules.characterCount(100); // Shows "45/100 characters"
```

## Progressive Validation

The component supports progressive disclosure of validation feedback:

### Validation Timing

- **On focus**: No validation shown initially
- **On input**: Validation shown after user has interacted
- **On blur**: Full validation performed
- **Real-time**: Debounced validation during typing (optional)

### Example Behavior

```tsx
<SmartInput
  label="Email"
  validationRules={[
    commonValidationRules.required(),
    commonValidationRules.email(),
  ]}
  progressiveValidation={true} // Default behavior
  validateOnChange={true} // Real-time validation
  debounceMs={300} // Wait 300ms after typing stops
/>
```

## Accessibility Features

### ARIA Support

```tsx
<SmartInput
  label="Email Address"
  hint="We'll use this to send you updates"
  error="Please enter a valid email address"
  aria-describedby="email-hint email-error"
  aria-invalid={hasError}
/>
```

### Screen Reader Announcements

```tsx
// Validation messages are announced automatically
<SmartInput
  label="Password"
  validationRules={[
    {
      test: (value) => value.length >= 8,
      message: 'Password must be at least 8 characters',
      type: 'error',
      priority: 1,
    },
  ]}
/>
```

### Keyboard Navigation

- **Tab**: Moves focus to the input
- **Shift+Tab**: Moves focus away from the input
- **Enter**: Submits the form (if in a form)
- **Escape**: Clears the input (optional behavior)

## Mobile Optimization

### Keyboard Types

```tsx
// Email keyboard with @ symbol
<SmartInput keyboardType="email" />

// Numeric keyboard
<SmartInput keyboardType="numeric" />

// Phone keyboard with +*# symbols
<SmartInput keyboardType="tel" />

// URL keyboard with .com button
<SmartInput keyboardType="url" />

// Search keyboard with search button
<SmartInput keyboardType="search" />
```

### Touch Targets

- **Input height**: Minimum 44px for easy tapping
- **Font size**: 16px minimum to prevent zoom on iOS
- **Spacing**: Adequate spacing between form fields

### Mobile-Specific Features

```tsx
<SmartInput
  label="Phone Number"
  keyboardType="tel"
  mobileOptimized={true}
  className="text-base" // Prevents zoom on iOS
/>
```

## Styling and Customization

### CSS Classes

```css
/* Base input styles */
.smart-input-container {
  display: grid;
  gap: 0.5rem;
}

.smart-input-label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1;
}

.smart-input-field {
  position: relative;
}

.smart-input-input {
  padding-right: 2.5rem; /* Space for status icon */
}

/* State styles */
.smart-input-input[aria-invalid='true'] {
  border-color: hsl(var(--destructive));
}

.smart-input-input:focus-visible {
  ring: 2px;
  ring-color: hsl(var(--ring));
}
```

### Custom Styling

```tsx
<SmartInput
  label="Custom Styled Input"
  className="rounded-lg border-2 border-hunks-green focus:border-hunks-green-700"
  validationRules={[commonValidationRules.required()]}
/>
```

## Performance Considerations

### Debounced Validation

```tsx
<SmartInput
  label="Search Query"
  validationRules={[asyncSearchValidation]}
  debounceMs={500} // Wait 500ms after user stops typing
  validateOnChange
/>
```

### Memoization

The component uses React.memo and memoized calculations:

```tsx
const SmartInput = React.memo(function SmartInput(props) {
  // Memoized validation state
  const shouldShowValidation = React.useMemo(() => {
    // Calculation logic
  }, [dependencies]);

  // Memoized ARIA attributes
  const accessibilityProps = React.useMemo(() => {
    // ARIA attribute calculation
  }, [dependencies]);
});
```

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmartInput, commonValidationRules } from './smart-input';

describe('SmartInput', () => {
  it('shows validation error after blur', async () => {
    render(
      <SmartInput
        label="Email"
        validationRules={[commonValidationRules.email()]}
      />
    );

    const input = screen.getByLabelText(/email/i);
    await userEvent.type(input, 'invalid-email');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('shows success state for valid input', async () => {
    render(
      <SmartInput
        label="Email"
        validationRules={[commonValidationRules.email()]}
        progressiveValidation
      />
    );

    const input = screen.getByLabelText(/email/i);
    await userEvent.type(input, 'valid@example.com');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByRole('img', { name: /success/i })).toBeInTheDocument();
    });
  });
});
```

### Accessibility Tests

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('should not have accessibility violations', async () => {
  const { container } = render(
    <SmartInput
      label="Accessible Input"
      hint="This is a hint"
      error="This is an error"
    />
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Best Practices

### Validation Timing

```tsx
// Good: Progressive validation for better UX
<SmartInput
  label="Email"
  validationRules={[commonValidationRules.email()]}
  progressiveValidation={true}
  validateOnBlur={true}
  validateOnChange={false} // Only after first interaction
/>

// Avoid: Immediate validation that interrupts typing
<SmartInput
  label="Email"
  validationRules={[commonValidationRules.email()]}
  progressiveValidation={false}
  validateOnChange={true}
/>
```

### Error Messages

```tsx
// Good: Specific, actionable error messages
const customEmailRule: ValidationRule = {
  test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message: 'Please enter a valid email address (e.g., user@example.com)',
  type: 'error',
  priority: 1,
};

// Avoid: Generic error messages
const genericRule: ValidationRule = {
  test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  message: 'Invalid input',
  type: 'error',
  priority: 1,
};
```

### Mobile Optimization

```tsx
// Good: Appropriate keyboard type
<SmartInput
  label="Phone Number"
  keyboardType="tel"
  placeholder="(555) 123-4567"
  validationRules={[commonValidationRules.phone()]}
/>

// Good: Prevent zoom on iOS
<SmartInput
  label="Search"
  className="text-base" // 16px minimum
  keyboardType="search"
/>
```

### Form Integration

```tsx
// Good: Consistent validation with form library
const schema = z.object({
  email: z.string().email('Please enter a valid email address')
})

<Controller
  name="email"
  control={control}
  render={({ field, fieldState }) => (
    <SmartInput
      label="Email"
      error={fieldState.error?.message}
      validationRules={[commonValidationRules.email()]}
      {...field}
    />
  )}
/>
```

The SmartInput component provides a comprehensive solution for form inputs with progressive validation, accessibility, and mobile optimization built-in.
