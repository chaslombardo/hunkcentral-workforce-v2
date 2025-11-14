import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps extends React.ComponentProps<'textarea'> {
  mobileOptimized?: boolean;
}

function Textarea({
  className,
  mobileOptimized = true,
  ...props
}: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content w-full rounded-md border bg-transparent px-3 py-2 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        // Mobile optimizations
        mobileOptimized && [
          'min-h-24', // Larger minimum height for mobile
          'text-base', // Prevent iOS zoom
          'touch-manipulation',
          'resize-y', // Only vertical resize
          'leading-6', // Better line height for mobile
          '-webkit-tap-highlight-color: transparent',
        ],
        // Desktop styles
        !mobileOptimized && 'min-h-16 text-base md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
