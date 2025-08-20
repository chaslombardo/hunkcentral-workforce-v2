'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import {
  usePerformanceMonitor,
  bundleAnalysis,
} from '@/lib/performance-monitor';

export interface ValidationRule {
  test: (value: string) => boolean | Promise<boolean>;
  message: string;
  type: 'error' | 'warning' | 'info';
  priority: number; // Lower numbers have higher priority
}

export interface SmartInputProps
  extends Omit<React.ComponentProps<'input'>, 'onChange'> {
  label: string;
  error?: string;
  success?: string;
  hint?: string;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  showValidation?: boolean;
  progressiveValidation?: boolean;
  validationRules?: ValidationRule[];
  onValueChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  showPasswordToggle?: boolean;
  loading?: boolean;
  debounceMs?: number;
  mobileOptimized?: boolean;
  keyboardType?: 'default' | 'email' | 'numeric' | 'tel' | 'url' | 'search';
}

interface ValidationState {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  infos: string[];
  isValidating: boolean;
  hasBeenTouched: boolean;
  hasBeenFocused: boolean;
}

export const SmartInput = React.memo(function SmartInput({
  label,
  error,
  success,
  hint,
  validateOnBlur = true,
  validateOnChange = false,
  showValidation = true,
  progressiveValidation = true,
  validationRules = [],
  onValueChange,
  onValidationChange,
  showPasswordToggle = false,
  loading = false,
  debounceMs = 300,
  mobileOptimized = true,
  keyboardType = 'default',
  className,
  type = 'text',
  id,
  ...props
}: SmartInputProps) {
  const monitor = usePerformanceMonitor('SmartInput');
  const startMarkRef = React.useRef<string>('');

  // Performance monitoring
  React.useLayoutEffect(() => {
    startMarkRef.current = monitor.startRender();
  });

  React.useLayoutEffect(() => {
    monitor.endRender(startMarkRef.current);
  });

  // Warn about large props in development
  React.useEffect(() => {
    bundleAnalysis.warnLargeProps('SmartInput', props, 500);
  }, [props]);
  const [value, setValue] = React.useState(props.value?.toString() || '');
  const [showPassword, setShowPassword] = React.useState(false);
  const [validationState, setValidationState] = React.useState<ValidationState>(
    {
      isValid: true,
      errors: [],
      warnings: [],
      infos: [],
      isValidating: false,
      hasBeenTouched: false,
      hasBeenFocused: false,
    }
  );

  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const successId = `${inputId}-success`;
  const hintId = `${inputId}-hint`;

  // Debounced validation
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  const validateValue = React.useCallback(
    async (inputValue: string) => {
      if (!showValidation || validationRules.length === 0) {
        return;
      }

      setValidationState((prev) => ({ ...prev, isValidating: true }));

      const errors: string[] = [];
      const warnings: string[] = [];
      const infos: string[] = [];

      // Sort rules by priority
      const sortedRules = [...validationRules].sort(
        (a, b) => a.priority - b.priority
      );

      for (const rule of sortedRules) {
        try {
          const result = await rule.test(inputValue);
          if (!result) {
            switch (rule.type) {
              case 'error':
                errors.push(rule.message);
                break;
              case 'warning':
                warnings.push(rule.message);
                break;
              case 'info':
                infos.push(rule.message);
                break;
            }
          } else if (rule.type === 'info') {
            // Info rules can still show messages even when they pass
            // For character count, update the message dynamically
            if (rule.message.includes('/')) {
              const parts = rule.message.split('/');
              if (parts.length === 2) {
                const target = parts[1].replace(' characters', '');
                infos.push(`${inputValue.length}/${target} characters`);
              } else {
                infos.push(rule.message);
              }
            } else {
              infos.push(rule.message);
            }
          }
        } catch (err) {
          console.error('Validation rule error:', err);
          errors.push('Validation error occurred');
        }
      }

      const isValid = errors.length === 0;

      setValidationState((prev) => ({
        isValid,
        errors,
        warnings,
        infos,
        isValidating: false,
        hasBeenTouched: prev.hasBeenTouched,
        hasBeenFocused: prev.hasBeenFocused,
      }));

      onValidationChange?.(isValid, errors);
    },
    [validationRules, showValidation, onValidationChange]
  );

  const debouncedValidate = React.useCallback(
    (inputValue: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        validateValue(inputValue);
      }, debounceMs);
    },
    [validateValue, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValueChange?.(newValue);

    if (validateOnChange) {
      // For progressive validation, only validate after user has interacted
      if (progressiveValidation) {
        if (
          validationState.hasBeenTouched ||
          (validationState.hasBeenFocused && newValue.length > 0)
        ) {
          debouncedValidate(newValue);
        }
      } else {
        // Always validate if not progressive
        debouncedValidate(newValue);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setValidationState((prev) => ({ ...prev, hasBeenTouched: true }));

    if (validateOnBlur) {
      validateValue(e.target.value);
    }

    props.onBlur?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setValidationState((prev) => ({ ...prev, hasBeenFocused: true }));
    props.onFocus?.(e);
  };

  // Progressive validation - show validation state based on interaction
  const shouldShowValidation = React.useMemo(() => {
    if (!showValidation) return false;
    if (error) return true; // Always show external errors
    if (!progressiveValidation) return validationState.hasBeenTouched;

    // Progressive disclosure: show validation after user has interacted
    if (validationState.hasBeenTouched) return true;
    if (validationState.hasBeenFocused && value.length > 0) return true;

    return false;
  }, [
    showValidation,
    error,
    progressiveValidation,
    validationState.hasBeenTouched,
    validationState.hasBeenFocused,
    value.length,
  ]);

  // Determine input state
  const hasError =
    error || (shouldShowValidation && validationState.errors.length > 0);
  const hasSuccess =
    success ||
    (shouldShowValidation &&
      validationState.isValid &&
      validationState.hasBeenTouched &&
      value.length > 0);
  const hasWarning =
    shouldShowValidation && validationState.warnings.length > 0;

  // Get the appropriate icon
  const getStatusIcon = () => {
    if (loading || validationState.isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    if (hasError) {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (hasSuccess) {
      return <CheckCircle2 className="h-4 w-4 text-hunks-green" />;
    }
    if (hasWarning) {
      return <Info className="h-4 w-4 text-hunks-orange" />;
    }
    return null;
  };

  const statusIcon = getStatusIcon();
  const inputType =
    showPasswordToggle && type === 'password'
      ? showPassword
        ? 'text'
        : 'password'
      : type;

  // Determine the appropriate input type for mobile keyboards
  const getMobileInputType = () => {
    if (keyboardType !== 'default') {
      switch (keyboardType) {
        case 'email':
          return 'email';
        case 'numeric':
          return 'number';
        case 'tel':
          return 'tel';
        case 'url':
          return 'url';
        case 'search':
          return 'search';
        default:
          return inputType;
      }
    }
    return inputType;
  };

  const finalInputType = getMobileInputType();

  // Build aria-describedby
  const ariaDescribedBy = React.useMemo(() => {
    const ids: string[] = [];
    if (hint) ids.push(hintId);
    if (hasError) ids.push(errorId);
    if (hasSuccess) ids.push(successId);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }, [hint, hasError, hasSuccess, hintId, errorId, successId]);

  return (
    <div className="grid gap-2">
      <Label
        htmlFor={inputId}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          hasError && 'text-destructive',
          hasSuccess && 'text-hunks-green'
        )}
      >
        {label}
      </Label>

      <div className="relative">
        <Input
          id={inputId}
          type={finalInputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          aria-describedby={ariaDescribedBy}
          aria-invalid={hasError ? 'true' : 'false'}
          mobileOptimized={mobileOptimized}
          className={cn(
            'pr-10', // Space for status icon
            hasError && 'border-destructive focus-visible:ring-destructive/20',
            hasSuccess &&
              'border-hunks-green focus-visible:ring-hunks-green/20',
            hasWarning &&
              'border-hunks-orange focus-visible:ring-hunks-orange/20',
            showPasswordToggle && type === 'password' && 'pr-20', // Extra space for password toggle
            className
          )}
          {...props}
        />

        {/* Status Icon */}
        {statusIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {statusIcon}
          </div>
        )}

        {/* Password Toggle */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Hint Text */}
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}

      {/* Success Message */}
      {hasSuccess && success && (
        <Alert
          id={successId}
          className="border-hunks-green/20 bg-hunks-green/5"
        >
          <CheckCircle2 className="h-4 w-4 text-hunks-green" />
          <AlertDescription className="text-hunks-green">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Messages */}
      {hasError && (
        <Alert id={errorId} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || validationState.errors[0]}
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Messages */}
      {hasWarning && shouldShowValidation && (
        <Alert className="border-hunks-orange/20 bg-hunks-orange/5">
          <Info className="h-4 w-4 text-hunks-orange" />
          <AlertDescription className="text-hunks-orange">
            {validationState.warnings[0]}
          </AlertDescription>
        </Alert>
      )}

      {/* Info Messages */}
      {shouldShowValidation && validationState.infos.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            {validationState.infos[0]}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
});

// Common validation rules
export const commonValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => value.trim().length > 0,
    message,
    type: 'error',
    priority: 1,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
    type: 'error',
    priority: 2,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => value.length <= max,
    message: message || `Must be no more than ${max} characters`,
    type: 'error',
    priority: 2,
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    test: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
    type: 'error',
    priority: 3,
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    test: (value) => {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
    },
    message,
    type: 'error',
    priority: 3,
  }),

  strongPassword: (
    message = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'
  ): ValidationRule => ({
    test: (value) => {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return strongPasswordRegex.test(value);
    },
    message,
    type: 'error',
    priority: 4,
  }),

  numeric: (message = 'Please enter a valid number'): ValidationRule => ({
    test: (value) => !isNaN(Number(value)) && value.trim() !== '',
    message,
    type: 'error',
    priority: 3,
  }),

  positiveNumber: (
    message = 'Please enter a positive number'
  ): ValidationRule => ({
    test: (value) => {
      const num = Number(value);
      return !isNaN(num) && num > 0;
    },
    message,
    type: 'error',
    priority: 3,
  }),

  // Warning rules
  passwordStrengthWarning: (): ValidationRule => ({
    test: (value) => {
      if (value.length === 0) return true; // Don't show warning for empty
      if (value.length < 6) return false;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[@$!%*?&]/.test(value);
      return (hasUpper && hasLower && hasNumber) || hasSpecial;
    },
    message:
      'Consider using a stronger password with mixed case, numbers, and special characters',
    type: 'warning',
    priority: 5,
  }),

  // Info rules
  characterCount: (target: number): ValidationRule => ({
    test: () => true, // Always pass, just informational
    message: `0/${target} characters`, // Will be updated dynamically
    type: 'info',
    priority: 10,
  }),
};
