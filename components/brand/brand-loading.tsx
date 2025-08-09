"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { usePerformanceMonitor, bundleAnalysis } from "@/lib/performance-monitor"
import { ariaLabels, motionUtils } from "@/lib/accessibility-utils"

const brandLoadingVariants = cva(
  "inline-flex items-center justify-center",
  {
    variants: {
      variant: {
        spinner: "animate-spin",
        dots: "gap-1",
        pulse: "animate-pulse",
      },
      size: {
        sm: "w-4 h-4",
        md: "w-6 h-6", 
        lg: "w-8 h-8",
      },
      color: {
        primary: "text-hunks-green",
        secondary: "text-hunks-orange",
        white: "text-white",
        muted: "text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "spinner",
      size: "md",
      color: "primary",
    },
  }
)

const dotVariants = cva(
  "rounded-full animate-bounce",
  {
    variants: {
      size: {
        sm: "w-1 h-1",
        md: "w-1.5 h-1.5",
        lg: "w-2 h-2",
      },
      color: {
        primary: "bg-hunks-green",
        secondary: "bg-hunks-orange", 
        white: "bg-white",
        muted: "bg-muted-foreground",
      },
    },
    defaultVariants: {
      size: "md",
      color: "primary",
    },
  }
)

const pulseVariants = cva(
  "rounded-full",
  {
    variants: {
      size: {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
      },
      color: {
        primary: "bg-hunks-green/20",
        secondary: "bg-hunks-orange/20",
        white: "bg-white/20", 
        muted: "bg-muted-foreground/20",
      },
    },
    defaultVariants: {
      size: "md",
      color: "primary",
    },
  }
)

interface BrandLoadingProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
    VariantProps<typeof brandLoadingVariants> {
  /**
   * Optional text to display alongside the loading indicator
   */
  text?: string
  /**
   * Whether to respect user's reduced motion preference
   * @default true
   */
  respectReducedMotion?: boolean
  /**
   * Custom aria-label for the loading indicator
   */
  'aria-label'?: string
  /**
   * Whether to announce loading state changes to screen readers
   */
  announceChanges?: boolean
}

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const BrandLoading = React.memo(React.forwardRef<HTMLDivElement, BrandLoadingProps>(
  ({ 
    className, 
    variant, 
    size, 
    color, 
    text, 
    respectReducedMotion = true,
    'aria-label': ariaLabel,
    announceChanges = false,
    ...props 
  }, ref) => {
    const monitor = usePerformanceMonitor('BrandLoading');
    const startMarkRef = React.useRef<string>('');

    // Performance monitoring
    React.useLayoutEffect(() => {
      startMarkRef.current = monitor.startRender();
    });

    React.useLayoutEffect(() => {
      monitor.endRender(startMarkRef.current);
    });

    // Warn about large props in development and track bundle usage
    React.useEffect(() => {
      bundleAnalysis.warnLargeProps('BrandLoading', props, 200);
      bundleAnalysis.trackRender('BrandLoading', variant || undefined, props);
    }, [props, variant]);

    // Check for reduced motion preference - memoized
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(() => 
      respectReducedMotion ? motionUtils.prefersReducedMotion() : false
    )
    
    React.useEffect(() => {
      if (respectReducedMotion && typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mediaQuery.matches)
        
        const handleChange = (e: MediaQueryListEvent) => {
          setPrefersReducedMotion(e.matches)
        }
        
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
      }
    }, [respectReducedMotion])

    // Announce loading state changes to screen readers
    React.useEffect(() => {
      if (announceChanges && text) {
        const message = `${ariaLabels.status.loading}: ${text}`;
        // Use a timeout to ensure the announcement happens after render
        const timer = setTimeout(() => {
          const announcer = document.createElement('div');
          announcer.setAttribute('aria-live', 'polite');
          announcer.setAttribute('aria-atomic', 'true');
          announcer.className = 'sr-only';
          announcer.textContent = message;
          
          document.body.appendChild(announcer);
          
          // Remove after announcement
          setTimeout(() => {
            if (document.body.contains(announcer)) {
              document.body.removeChild(announcer);
            }
          }, 1000);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [announceChanges, text])

    // Memoize the loading indicator to prevent unnecessary re-renders
    const renderLoadingIndicator = React.useMemo(() => {
      // If user prefers reduced motion, show static version
      if (prefersReducedMotion && respectReducedMotion) {
        return (
          <div className={cn(brandLoadingVariants({ variant: "pulse", size, color, className }))}>
            <div className={cn(pulseVariants({ size, color }), "animate-none opacity-60")} />
          </div>
        )
      }

      switch (variant) {
        case "spinner":
          return (
            <div className={cn(brandLoadingVariants({ variant, size, color, className }))}>
              <SpinnerIcon className="w-full h-full" />
            </div>
          )
        
        case "dots":
          return (
            <div className={cn(brandLoadingVariants({ variant, size, color, className }))}>
              <div 
                className={cn(dotVariants({ size, color }), "animation-delay-0")}
                style={{ animationDelay: '0ms' }}
              />
              <div 
                className={cn(dotVariants({ size, color }), "animation-delay-150")}
                style={{ animationDelay: '150ms' }}
              />
              <div 
                className={cn(dotVariants({ size, color }), "animation-delay-300")}
                style={{ animationDelay: '300ms' }}
              />
            </div>
          )
        
        case "pulse":
          return (
            <div className={cn(brandLoadingVariants({ variant, size, color, className }))}>
              <div className={cn(pulseVariants({ size, color }))} />
            </div>
          )
        
        default:
          return (
            <div className={cn(brandLoadingVariants({ variant, size, color, className }))}>
              <SpinnerIcon className="w-full h-full" />
            </div>
          )
      }
    }, [prefersReducedMotion, respectReducedMotion, variant, size, color, className])

    // Memoize text color class
    const textColorClass = React.useMemo(() => 
      cn("text-sm", color === "white" ? "text-white" : "text-muted-foreground"),
      [color]
    );

    // Memoize accessibility attributes
    const accessibilityProps = React.useMemo(() => ({
      role: "status",
      "aria-label": ariaLabel || (text ? `${ariaLabels.status.loading}: ${text}` : ariaLabels.status.loading),
      "aria-live": announceChanges ? "polite" as const : undefined,
      "aria-atomic": announceChanges ? true : undefined,
    }), [ariaLabel, text, announceChanges]);

    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center gap-2", className)}
        {...accessibilityProps}
        {...props}
      >
        {renderLoadingIndicator}
        {text && (
          <span className={textColorClass} aria-hidden="true">
            {text}
          </span>
        )}
        {/* Screen reader only text for better context */}
        <span className="sr-only">
          {text ? `Loading ${text}` : "Loading, please wait"}
        </span>
      </div>
    )
  }
));

BrandLoading.displayName = "BrandLoading"

export { BrandLoading, brandLoadingVariants, type BrandLoadingProps }