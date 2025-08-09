"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { usePerformanceMonitor, bundleAnalysis } from "@/lib/performance-monitor"
import { 
  ariaLabels, 
  keyboardUtils, 
  motionUtils,
  generateAccessibilityId 
} from "@/lib/accessibility-utils"

const brandButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Brand primary - College Hunks Green
        primary:
          "bg-hunks-green text-white shadow-xs hover:bg-hunks-green-700 focus-visible:ring-hunks-green/20 dark:focus-visible:ring-hunks-green/40 active:bg-hunks-green-800",
        // Brand secondary - College Hunks Orange  
        secondary:
          "bg-hunks-orange text-white shadow-xs hover:bg-hunks-orange-600 focus-visible:ring-hunks-orange/20 dark:focus-visible:ring-hunks-orange/40 active:bg-hunks-orange-700",
        // Success variant using brand green
        success:
          "bg-hunks-green-500 text-white shadow-xs hover:bg-hunks-green-600 focus-visible:ring-hunks-green/20 dark:focus-visible:ring-hunks-green/40 active:bg-hunks-green-700",
        // Warning variant using brand orange
        warning:
          "bg-hunks-orange-400 text-white shadow-xs hover:bg-hunks-orange-500 focus-visible:ring-hunks-orange/20 dark:focus-visible:ring-hunks-orange/40 active:bg-hunks-orange-600",
        // Outline variants with brand colors
        "outline-primary":
          "border-2 border-hunks-green bg-background text-hunks-green shadow-xs hover:bg-hunks-green hover:text-white focus-visible:ring-hunks-green/20 dark:focus-visible:ring-hunks-green/40",
        "outline-secondary":
          "border-2 border-hunks-orange bg-background text-hunks-orange shadow-xs hover:bg-hunks-orange hover:text-white focus-visible:ring-hunks-orange/20 dark:focus-visible:ring-hunks-orange/40",
        // Ghost variants with brand colors
        "ghost-primary":
          "text-hunks-green hover:bg-hunks-green/10 focus-visible:ring-hunks-green/20 dark:hover:bg-hunks-green/20 dark:focus-visible:ring-hunks-green/40",
        "ghost-secondary":
          "text-hunks-orange hover:bg-hunks-orange/10 focus-visible:ring-hunks-orange/20 dark:hover:bg-hunks-orange/20 dark:focus-visible:ring-hunks-orange/40",
        // Standard variants for compatibility
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof brandButtonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ComponentType<{ className?: string }>
  /**
   * Loading text announced to screen readers
   */
  loadingText?: string
  /**
   * Success state for form submissions
   */
  success?: boolean
  /**
   * Success text announced to screen readers
   */
  successText?: string
  /**
   * Error state for form submissions
   */
  error?: boolean
  /**
   * Error text announced to screen readers
   */
  errorText?: string
  /**
   * Keyboard shortcut hint
   */
  shortcut?: string
  /**
   * Whether to respect user's reduced motion preference
   */
  respectReducedMotion?: boolean
}

const BrandButton = React.memo(React.forwardRef<HTMLButtonElement, BrandButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false, 
    success = false,
    error = false,
    icon: Icon, 
    children, 
    disabled, 
    loadingText,
    successText,
    errorText,
    shortcut,
    respectReducedMotion = true,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    onKeyDown,
    ...props 
  }, ref) => {
    const monitor = usePerformanceMonitor('BrandButton');
    const startMarkRef = React.useRef<string>('');
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const descriptionId = React.useRef(generateAccessibilityId('button-desc'));

    // Performance monitoring
    React.useLayoutEffect(() => {
      startMarkRef.current = monitor.startRender();
    });

    React.useLayoutEffect(() => {
      monitor.endRender(startMarkRef.current);
    });

    // Warn about large props in development and track bundle usage
    React.useEffect(() => {
      bundleAnalysis.warnLargeProps('BrandButton', props, 200);
      bundleAnalysis.trackRender('BrandButton', variant || undefined, props);
    }, [props, variant]);

    // Memoize component selection
    const Comp = React.useMemo(() => asChild ? Slot : "button", [asChild]);
    
    // Memoize disabled state
    const isDisabled = React.useMemo(() => disabled || loading, [disabled, loading]);
    
    // Memoize button state for accessibility
    const buttonState = React.useMemo(() => {
      if (loading) return 'loading';
      if (success) return 'success';
      if (error) return 'error';
      return 'idle';
    }, [loading, success, error]);

    // Memoize accessibility attributes
    const accessibilityProps = React.useMemo(() => {
      const props: Record<string, string | boolean | undefined> = {};
      
      // ARIA label based on state
      if (ariaLabel) {
        props['aria-label'] = ariaLabel;
      } else if (buttonState !== 'idle') {
        const baseLabel = typeof children === 'string' ? children : 'Button';
        switch (buttonState) {
          case 'loading':
            props['aria-label'] = loadingText || ariaLabels.button.loading(baseLabel);
            break;
          case 'success':
            props['aria-label'] = successText || ariaLabels.button.success(baseLabel);
            break;
          case 'error':
            props['aria-label'] = errorText || ariaLabels.button.error(baseLabel);
            break;
        }
      }

      // ARIA described by
      const describedByIds = [ariaDescribedBy];
      if (shortcut) {
        describedByIds.push(descriptionId.current);
      }
      const validIds = describedByIds.filter(Boolean);
      if (validIds.length > 0) {
        props['aria-describedby'] = validIds.join(' ');
      }

      // ARIA pressed for toggle buttons
      if (props.role === 'switch' || props['aria-pressed'] !== undefined) {
        // Keep existing aria-pressed if provided
      }

      // ARIA busy for loading state
      if (loading) {
        props['aria-busy'] = 'true';
      }

      return props;
    }, [ariaLabel, ariaDescribedBy, buttonState, children, loading, loadingText, successText, errorText, shortcut]);

    // Handle keyboard interactions
    const handleKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Call original handler first
      onKeyDown?.(event);

      // Handle keyboard shortcuts
      if (shortcut && event.key === shortcut.toLowerCase() && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        buttonRef.current?.click();
      }

      // Ensure Enter and Space work properly
      if (keyboardUtils.isActivationKey(event) && !isDisabled) {
        // Let the default behavior handle the click
      }
    }, [onKeyDown, shortcut, isDisabled]);

    // Memoize animation classes based on reduced motion preference
    const animationClasses = React.useMemo(() => {
      if (!respectReducedMotion) return '';
      
      return motionUtils.getAnimationClasses(
        'transition-all duration-200', // Animated
        'transition-none' // Static for reduced motion
      );
    }, [respectReducedMotion]);
    
    // Memoize class names
    const buttonClassName = React.useMemo(() => 
      cn(
        brandButtonVariants({ variant, size }),
        animationClasses,
        // State-specific classes
        success && 'ring-2 ring-hunks-green/20',
        error && 'ring-2 ring-destructive/20',
        className
      ), 
      [variant, size, className, animationClasses, success, error]
    );

    // Combine refs
    const combinedRef = React.useCallback((node: HTMLButtonElement | null) => {
      buttonRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);
    
    return (
      <>
        <Comp
          ref={combinedRef}
          className={buttonClassName}
          disabled={isDisabled}
          onKeyDown={handleKeyDown}
          {...accessibilityProps}
          {...props}
        >
          {loading ? (
            <>
              <Loader2 className={cn(
                "animate-spin",
                respectReducedMotion && motionUtils.prefersReducedMotion() && "animate-none"
              )} />
              {children}
            </>
          ) : (
            <>
              {Icon && <Icon />}
              {children}
            </>
          )}
        </Comp>
        
        {/* Hidden description for keyboard shortcut */}
        {shortcut && (
          <span id={descriptionId.current} className="sr-only">
            Keyboard shortcut: {shortcut}
          </span>
        )}
      </>
    )
  }
));
BrandButton.displayName = "BrandButton"

export { BrandButton, brandButtonVariants }