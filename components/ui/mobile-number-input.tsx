'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isMobileDevice } from '@/lib/mobile-utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface MobileNumberInputProps {
  value?: number;
  onChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  showSteppers?: boolean;
  allowDecimals?: boolean;
  currency?: boolean;
  currencySymbol?: string;
  thousandsSeparator?: boolean;
}

export function MobileNumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = '0',
  disabled = false,
  className,
  id,
  name,
  required = false,
  showSteppers = true,
  allowDecimals = false,
  currency = false,
  currencySymbol = '$',
  thousandsSeparator = false,
}: MobileNumberInputProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [displayValue, setDisplayValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const { tapFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Format value for display
  const formatDisplayValue = React.useCallback(
    (num: number): string => {
      if (isNaN(num)) return '';

      let formatted = allowDecimals
        ? num.toString()
        : Math.floor(num).toString();

      if (thousandsSeparator && !isFocused) {
        formatted = num.toLocaleString();
      }

      if (currency && !isFocused) {
        return `${currencySymbol}${formatted}`;
      }

      return formatted;
    },
    [allowDecimals, thousandsSeparator, isFocused, currency, currencySymbol]
  );

  // Update display value when value prop changes
  React.useEffect(() => {
    if (value !== undefined && !isFocused) {
      setDisplayValue(formatDisplayValue(value));
    } else if (value === undefined && !isFocused) {
      setDisplayValue('');
    }
  }, [value, isFocused, formatDisplayValue]);

  // Parse display value to number
  const parseDisplayValue = (str: string): number | undefined => {
    if (!str) return undefined;

    // Remove currency symbol and thousands separators
    let cleaned = str.replace(new RegExp(`\\${currencySymbol}`, 'g'), '');
    cleaned = cleaned.replace(/,/g, '');

    const parsed = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10);
    return isNaN(parsed) ? undefined : parsed;
  };

  // Validate value against constraints
  const validateValue = (num: number | undefined): number | undefined => {
    if (num === undefined) return undefined;

    if (min !== undefined && num < min) return min;
    if (max !== undefined && num > max) return max;

    return num;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    const parsed = parseDisplayValue(inputValue);
    const validated = validateValue(parsed);
    onChange?.(validated);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number without formatting when focused
    if (value !== undefined) {
      setDisplayValue(value.toString());
    }
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    // Reformat display value when focus is lost
    if (value !== undefined) {
      setDisplayValue(formatDisplayValue(value));
    }
  };

  // Handle stepper buttons
  const handleIncrement = () => {
    tapFeedback();
    const currentValue = value || 0;
    const newValue = validateValue(currentValue + step);
    onChange?.(newValue);
  };

  const handleDecrement = () => {
    tapFeedback();
    const currentValue = value || 0;
    const newValue = validateValue(currentValue - step);
    onChange?.(newValue);
  };

  // Determine input type and inputMode
  const inputType = currency || allowDecimals ? 'text' : 'number';
  const inputMode = allowDecimals ? 'decimal' : 'numeric';

  return (
    <div className={cn('relative flex items-center', className)}>
      {/* Decrement button */}
      {showSteppers && isMobile && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'h-12 w-12 rounded-r-none border-r-0 touch-manipulation',
            'min-h-[48px] min-w-[48px]' // Ensure 48px minimum touch target
          )}
          disabled={disabled || (min !== undefined && (value || 0) <= min)}
          onClick={handleDecrement}
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Decrease value</span>
        </Button>
      )}

      {/* Input field */}
      <Input
        id={id}
        name={name}
        type={inputType}
        inputMode={inputMode}
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        className={cn(
          // Base styles
          'text-center',
          // Mobile stepper styles
          showSteppers && isMobile && 'rounded-none border-x-0',
          // Desktop styles
          !showSteppers || !isMobile ? 'rounded-md' : '',
          // Enhanced mobile styling
          isMobile && [
            'min-h-[48px] text-base touch-manipulation',
            'focus-visible:ring-2 focus-visible:ring-offset-1',
          ]
        )}
        keyboardType={
          currency ? 'currency' : allowDecimals ? 'decimal' : 'numeric'
        }
        mobileOptimized={true}
      />

      {/* Increment button */}
      {showSteppers && isMobile && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            'h-12 w-12 rounded-l-none border-l-0 touch-manipulation',
            'min-h-[48px] min-w-[48px]' // Ensure 48px minimum touch target
          )}
          disabled={disabled || (max !== undefined && (value || 0) >= max)}
          onClick={handleIncrement}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Increase value</span>
        </Button>
      )}
    </div>
  );
}

// Currency input component
export interface MobileCurrencyInputProps
  extends Omit<MobileNumberInputProps, 'currency' | 'allowDecimals'> {
  currencySymbol?: string;
}

export function MobileCurrencyInput({
  currencySymbol = '$',
  ...props
}: MobileCurrencyInputProps) {
  return (
    <MobileNumberInput
      {...props}
      currency={true}
      allowDecimals={true}
      currencySymbol={currencySymbol}
      thousandsSeparator={true}
    />
  );
}

// Percentage input component
export interface MobilePercentageInputProps
  extends Omit<MobileNumberInputProps, 'currency' | 'currencySymbol'> {
  showPercentSymbol?: boolean;
}

export function MobilePercentageInput({
  showPercentSymbol = true,
  max = 100,
  min = 0,
  step = 1,
  ...props
}: MobilePercentageInputProps) {
  const handleChange = (value: number | undefined) => {
    // Ensure value is within 0-100 range for percentages
    if (value !== undefined) {
      const clampedValue = Math.max(min, Math.min(max, value));
      props.onChange?.(clampedValue);
    } else {
      props.onChange?.(value);
    }
  };

  return (
    <div className="relative">
      <MobileNumberInput
        {...props}
        value={props.value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        allowDecimals={true}
      />
      {showPercentSymbol && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          %
        </div>
      )}
    </div>
  );
}
