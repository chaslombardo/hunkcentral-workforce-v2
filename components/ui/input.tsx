import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  mobileOptimized?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, mobileOptimized = true, ...props }, ref) => {
    // Determine appropriate inputMode and keyboard type for mobile
    const getInputMode = (inputType: string): "search" | "text" | "email" | "tel" | "url" | "none" | "numeric" | "decimal" | undefined => {
      switch (inputType) {
        case 'email':
          return 'email';
        case 'tel':
          return 'tel';
        case 'url':
          return 'url';
        case 'number':
          return 'numeric';
        case 'search':
          return 'search';
        default:
          return undefined;
      }
    };

    const inputMode = getInputMode(type || 'text');

    return (
      <input
        type={type}
        inputMode={inputMode}
        className={cn(
          // Base styles
          "flex w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          // Mobile optimizations
          mobileOptimized && [
            // Minimum height for touch targets (48px)
            "min-h-[48px] h-12",
            // Font size to prevent iOS zoom (16px minimum)
            "text-base",
            // Touch action optimization
            "touch-manipulation",
            // Better focus states for mobile
            "focus-visible:ring-2 focus-visible:ring-offset-1",
          ],
          // Desktop styles
          !mobileOptimized && "h-9 text-base md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
