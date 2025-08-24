import * as React from 'react';

import { cn } from '@/lib/utils';
import {
  getOptimalKeyboardType,
  manageMobileFocus,
  isMobileDevice,
} from '@/lib/mobile-utils';

export interface InputProps extends React.ComponentProps<'input'> {
  mobileOptimized?: boolean;
  keyboardType?:
    | 'default'
    | 'email'
    | 'numeric'
    | 'tel'
    | 'url'
    | 'search'
    | 'currency'
    | 'decimal'
    | 'password'
    | 'new-password'
    | 'name'
    | 'given-name'
    | 'family-name';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      mobileOptimized = true,
      keyboardType = 'default',
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Get optimal keyboard configuration for mobile
    const keyboardConfig = React.useMemo(() => {
      if (!mobileOptimized || !isMobileDevice()) return {};

      const inputTypeForKeyboard =
        keyboardType !== 'default' ? keyboardType : type || 'text';
      return getOptimalKeyboardType(inputTypeForKeyboard);
    }, [mobileOptimized, keyboardType, type]);

    // Handle focus for mobile optimizations
    const handleFocus = React.useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        if (mobileOptimized && inputRef.current) {
          manageMobileFocus(inputRef.current);
        }
        props.onFocus?.(e);
      },
      [mobileOptimized, props]
    );

    // Determine appropriate inputMode and keyboard type for mobile
    const getInputMode = (
      inputType: string
    ):
      | 'search'
      | 'text'
      | 'email'
      | 'tel'
      | 'url'
      | 'none'
      | 'numeric'
      | 'decimal'
      | undefined => {
      switch (inputType) {
        case 'email':
          return 'email';
        case 'tel':
          return 'tel';
        case 'url':
          return 'url';
        case 'number':
        case 'currency':
          return 'numeric';
        case 'decimal':
          return 'decimal';
        case 'search':
          return 'search';
        default:
          return keyboardConfig.inputMode;
      }
    };

    const inputMode = getInputMode(type || 'text');

    return (
      <input
        ref={inputRef}
        type={type}
        inputMode={inputMode}
        onFocus={handleFocus}
        className={cn(
          // Base styles
          'flex w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          // Mobile optimizations
          mobileOptimized && [
            // Minimum height for touch targets (48px)
            'min-h-[48px] h-12',
            // Font size to prevent iOS zoom (16px minimum)
            'text-base',
            // Touch action optimization
            'touch-manipulation',
            // Better focus states for mobile
            'focus-visible:ring-2 focus-visible:ring-offset-1',
            // Remove iOS styling
            'appearance-none',
            // Better tap highlight
            '[&::-webkit-tap-highlight-color]:transparent',
          ],
          // Desktop styles
          !mobileOptimized && 'h-9 text-base md:text-sm',
          className
        )}
        {...keyboardConfig}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
