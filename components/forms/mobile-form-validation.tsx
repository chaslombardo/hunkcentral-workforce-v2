'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  AlertTriangle, 
  Info,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  severity?: 'high' | 'medium' | 'low';
}

export interface MobileFormValidationProps {
  errors: ValidationError[];
  onErrorClick?: (field: string) => void;
  onDismiss?: (field: string) => void;
  className?: string;
  collapsible?: boolean;
  maxVisible?: number;
}

export function MobileFormValidation({
  errors,
  onErrorClick,
  onDismiss,
  className,
  collapsible = true,
  maxVisible = 3,
}: MobileFormValidationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const errorsByType = React.useMemo(() => {
    return {
      error: errors.filter(e => e.type === 'error'),
      warning: errors.filter(e => e.type === 'warning'),
      info: errors.filter(e => e.type === 'info'),
    };
  }, [errors]);

  if (errors.length === 0) return null;

  const totalErrors = errorsByType.error.length;
  const totalWarnings = errorsByType.warning.length;
  const totalInfo = errorsByType.info.length;

  const visibleErrors = isExpanded ? errors : errors.slice(0, maxVisible);
  const hasMore = errors.length > maxVisible;

  const getIcon = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-hunks-orange" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  const getAlertClassName = (type: ValidationError['type']) => {
    switch (type) {
      case 'error':
        return '';
      case 'warning':
        return 'border-hunks-orange/20 bg-hunks-orange/5';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return '';
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary header */}
      {(totalErrors > 0 || totalWarnings > 0) && (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {totalErrors > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {totalErrors} error{totalErrors !== 1 ? 's' : ''}
                </Badge>
              )}
              {totalWarnings > 0 && (
                <Badge variant="secondary" className="text-xs bg-hunks-orange/10 text-hunks-orange">
                  {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''}
                </Badge>
              )}
              {totalInfo > 0 && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  {totalInfo} info
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Please review and fix the issues below
            </span>
          </div>
          
          {collapsible && hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show All ({errors.length})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Error list */}
      <div className="space-y-2">
        {visibleErrors.map((error, index) => (
          <Alert
            key={`${error.field}-${index}`}
            variant={getAlertVariant(error.type)}
            className={cn(
              'relative',
              getAlertClassName(error.type),
              // Mobile optimizations
              'min-h-[48px] touch-manipulation',
              onErrorClick && 'cursor-pointer hover:bg-accent/50'
            )}
            onClick={() => onErrorClick?.(error.field)}
          >
            {getIcon(error.type)}
            
            <div className="flex-1 pr-8">
              <AlertDescription className="text-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-medium capitalize">
                    {error.field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                  <span>{error.message}</span>
                </div>
              </AlertDescription>
            </div>

            {/* Dismiss button */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(error.field);
                }}
                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/5"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Dismiss</span>
              </Button>
            )}
          </Alert>
        ))}
      </div>

      {/* Collapsible content for additional errors */}
      {collapsible && hasMore && !isExpanded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="w-full h-12 touch-manipulation"
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Show {errors.length - maxVisible} more issue{errors.length - maxVisible !== 1 ? 's' : ''}
        </Button>
      )}
    </div>
  );
}

// Hook for managing form validation state
export function useMobileFormValidation() {
  const [errors, setErrors] = React.useState<ValidationError[]>([]);

  const addError = React.useCallback((error: ValidationError) => {
    setErrors(prev => {
      // Remove existing error for the same field
      const filtered = prev.filter(e => e.field !== error.field);
      return [...filtered, error];
    });
  }, []);

  const removeError = React.useCallback((field: string) => {
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const clearErrors = React.useCallback(() => {
    setErrors([]);
  }, []);

  const hasErrors = React.useMemo(() => {
    return errors.some(e => e.type === 'error');
  }, [errors]);

  const hasWarnings = React.useMemo(() => {
    return errors.some(e => e.type === 'warning');
  }, [errors]);

  const getFieldError = React.useCallback((field: string) => {
    return errors.find(e => e.field === field);
  }, [errors]);

  const validateField = React.useCallback((
    field: string,
    value: unknown,
    rules: Array<{
      test: (value: unknown) => boolean;
      message: string;
      type?: ValidationError['type'];
      severity?: ValidationError['severity'];
    }>
  ) => {
    // Remove existing error for this field
    removeError(field);

    // Run validation rules
    for (const rule of rules) {
      if (!rule.test(value)) {
        addError({
          field,
          message: rule.message,
          type: rule.type || 'error',
          severity: rule.severity || 'medium',
        });
        break; // Stop at first failed rule
      }
    }
  }, [addError, removeError]);

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    hasErrors,
    hasWarnings,
    getFieldError,
    validateField,
  };
}

// Common validation rules for mobile forms
export const mobileValidationRules = {
  required: (message = 'This field is required') => ({
    test: (value: unknown) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return !isNaN(value);
      return value != null && value !== '';
    },
    message,
    type: 'error' as const,
    severity: 'high' as const,
  }),

  email: (message = 'Please enter a valid email address') => ({
    test: (value: unknown) => {
      if (!value || typeof value !== 'string') return true; // Let required rule handle empty values
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
    type: 'error' as const,
    severity: 'high' as const,
  }),

  phone: (message = 'Please enter a valid phone number') => ({
    test: (value: unknown) => {
      if (!value || typeof value !== 'string') return true; // Let required rule handle empty values
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
    },
    message,
    type: 'error' as const,
    severity: 'medium' as const,
  }),

  minLength: (min: number, message?: string) => ({
    test: (value: unknown) => {
      if (!value || typeof value !== 'string') return true; // Let required rule handle empty values
      return value.length >= min;
    },
    message: message || `Must be at least ${min} characters`,
    type: 'error' as const,
    severity: 'medium' as const,
  }),

  maxLength: (max: number, message?: string) => ({
    test: (value: unknown) => {
      if (!value || typeof value !== 'string') return true;
      return value.length <= max;
    },
    message: message || `Must be no more than ${max} characters`,
    type: 'error' as const,
    severity: 'medium' as const,
  }),

  numeric: (message = 'Please enter a valid number') => ({
    test: (value: unknown) => {
      if (!value || typeof value !== 'string') return true;
      return !isNaN(Number(value)) && value.trim() !== '';
    },
    message,
    type: 'error' as const,
    severity: 'medium' as const,
  }),

  positiveNumber: (message = 'Please enter a positive number') => ({
    test: (value: unknown) => {
      if (!value || typeof value !== 'string') return true;
      const num = Number(value);
      return !isNaN(num) && num > 0;
    },
    message,
    type: 'error' as const,
    severity: 'medium' as const,
  }),

  // Warning rules
  strongPassword: (message = 'Consider using a stronger password') => ({
    test: (value: unknown) => {
      if (!value || typeof value !== 'string' || value.length < 6) return false;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[@$!%*?&]/.test(value);
      return (hasUpper && hasLower && hasNumber) || hasSpecial;
    },
    message,
    type: 'warning' as const,
    severity: 'low' as const,
  }),
};