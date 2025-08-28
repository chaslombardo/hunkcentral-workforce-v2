'use client';

/**
 * StatusIndicator Component
 *
 * Enhanced status indicator system built on shadcn/ui Badge component with brand theming.
 * Provides consistent status visualization across the HUNKCentral application with
 * appropriate brand colors, animations, and accessibility features.
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Archive,
  Lock,
  Unlock,
  Loader2,
  Info,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Status type definitions based on common application statuses
export type StatusType =
  | 'pending'
  | 'approved'
  | 'matched'
  | 'rejected'
  | 'open'
  | 'locked'
  | 'closed'
  | 'active'
  | 'inactive'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'processing'
  | 'draft'
  | 'submitted'
  | 'completed';

// Status indicator variants using brand colors and shadcn/ui design tokens
const statusIndicatorVariants = cva(
  'inline-flex items-center gap-1.5 font-medium transition-all duration-200',
  {
    variants: {
      status: {
        // Success states - using brand green
        pending:
          'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
        approved:
          'bg-hunks-green-50 text-hunks-green-700 border-hunks-green-200 dark:bg-hunks-green-950 dark:text-hunks-green-300 dark:border-hunks-green-800',
        matched:
          'bg-hunks-green-50 text-hunks-green-700 border-hunks-green-200 dark:bg-hunks-green-950 dark:text-hunks-green-300 dark:border-hunks-green-800',
        success:
          'bg-hunks-green-50 text-hunks-green-700 border-hunks-green-200 dark:bg-hunks-green-950 dark:text-hunks-green-300 dark:border-hunks-green-800',
        completed:
          'bg-hunks-green-50 text-hunks-green-700 border-hunks-green-200 dark:bg-hunks-green-950 dark:text-hunks-green-300 dark:border-hunks-green-800',
        active:
          'bg-hunks-green-50 text-hunks-green-700 border-hunks-green-200 dark:bg-hunks-green-950 dark:text-hunks-green-300 dark:border-hunks-green-800',
        open: 'bg-hunks-green-50 text-hunks-green-700 border-hunks-green-200 dark:bg-hunks-green-950 dark:text-hunks-green-300 dark:border-hunks-green-800',

        // Warning states - using brand orange
        warning:
          'bg-hunks-orange-50 text-hunks-orange-700 border-hunks-orange-200 dark:bg-hunks-orange-950 dark:text-hunks-orange-300 dark:border-hunks-orange-800',
        processing:
          'bg-hunks-orange-50 text-hunks-orange-700 border-hunks-orange-200 dark:bg-hunks-orange-950 dark:text-hunks-orange-300 dark:border-hunks-orange-800',
        locked:
          'bg-hunks-orange-50 text-hunks-orange-700 border-hunks-orange-200 dark:bg-hunks-orange-950 dark:text-hunks-orange-300 dark:border-hunks-orange-800',
        submitted:
          'bg-hunks-orange-50 text-hunks-orange-700 border-hunks-orange-200 dark:bg-hunks-orange-950 dark:text-hunks-orange-300 dark:border-hunks-orange-800',

        // Error states - using destructive colors
        rejected:
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
        error:
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
        inactive:
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',

        // Neutral states
        draft:
          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
        closed:
          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
        info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
      },
      size: {
        sm: 'text-xs px-2 py-0.5 h-5',
        md: 'text-sm px-2.5 py-1 h-6',
        lg: 'text-sm px-3 py-1.5 h-8',
      },
      animated: {
        true: '',
        false: '',
      },
    },
    defaultVariants: {
      status: 'info',
      size: 'md',
      animated: false,
    },
  }
);

// Icon mapping for different status types
const statusIcons: Record<
  StatusType,
  React.ComponentType<{ className?: string }>
> = {
  pending: Clock,
  approved: CheckCircle,
  matched: CheckCircle2,
  rejected: XCircle,
  open: Unlock,
  locked: Lock,
  closed: Archive,
  active: CheckCircle,
  inactive: XCircle,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
  processing: Loader2,
  draft: Info,
  submitted: CheckCircle,
  completed: CheckCircle2,
};

export interface StatusIndicatorProps
  extends React.ComponentProps<typeof Badge>,
    VariantProps<typeof statusIndicatorVariants> {
  /**
   * The status type to display
   */
  status: StatusType;
  /**
   * Custom text to display (defaults to status value)
   */
  text?: string;
  /**
   * Whether to show an icon
   */
  showIcon?: boolean;
  /**
   * Whether to animate pending/processing states
   */
  animated?: boolean;
  /**
   * Custom icon to override the default
   */
  icon?: React.ComponentType<{ className?: string }>;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * StatusIndicator component that extends shadcn/ui Badge with brand theming
 * and consistent status visualization patterns.
 */
export const StatusIndicator = React.memo(function StatusIndicator({
  status,
  text,
  showIcon = true,
  animated = false,
  icon: CustomIcon,
  size = 'md',
  className,
  ...props
}: StatusIndicatorProps) {

  // Memoize icon component selection
  const IconComponent = React.useMemo(
    () => CustomIcon || statusIcons[status],
    [CustomIcon, status]
  );

  // Memoize display text
  const displayText = React.useMemo(
    () => text || status.charAt(0).toUpperCase() + status.slice(1),
    [text, status]
  );

  // Memoize animation state
  const shouldAnimate = React.useMemo(
    () => animated && (status === 'processing' || status === 'pending'),
    [animated, status]
  );

  // Memoize icon size classes
  const iconSizeClass = React.useMemo(
    () =>
      cn(
        'flex-shrink-0',
        size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5',
        shouldAnimate && 'animate-spin'
      ),
    [size, shouldAnimate]
  );

  // Memoize badge classes
  const badgeClassName = React.useMemo(
    () =>
      cn(
        statusIndicatorVariants({ status, size, animated: shouldAnimate }),
        'border',
        className
      ),
    [status, size, shouldAnimate, className]
  );

  // Memoize accessibility attributes
  const accessibilityProps = React.useMemo(
    () => ({
      'aria-label': `Status: ${displayText}`,
      role: 'status',
      'aria-live': shouldAnimate ? ('polite' as const) : undefined,
    }),
    [displayText, shouldAnimate]
  );

  return (
    <Badge
      className={badgeClassName}
      data-testid="status-indicator"
      {...accessibilityProps}
      {...props}
    >
      {showIcon && IconComponent && (
        <IconComponent className={iconSizeClass} aria-hidden="true" />
      )}
      <span className="truncate">{displayText}</span>
    </Badge>
  );
});

/**
 * Utility function to get appropriate status type from string values
 */
export function getStatusType(status: string): StatusType {
  const normalizedStatus = status.toLowerCase() as StatusType;

  // Map common status variations to our standard types
  const statusMap: Record<string, StatusType> = {
    in_progress: 'processing',
    'in-progress': 'processing',
    inprogress: 'processing',
    review: 'pending',
    reviewing: 'pending',
    under_review: 'pending',
    'under-review': 'pending',
    cancelled: 'rejected',
    canceled: 'rejected',
    failed: 'error',
    failure: 'error',
    done: 'completed',
    finished: 'completed',
    complete: 'completed',
  };

  return (
    statusMap[normalizedStatus] ||
    (normalizedStatus in statusIcons ? normalizedStatus : 'info')
  );
}

/**
 * Pre-configured status indicators for common use cases
 */
export const StatusIndicators = {
  Pending: (props: Omit<StatusIndicatorProps, 'status'>) => (
    <StatusIndicator status="pending" animated {...props} />
  ),
  Approved: (props: Omit<StatusIndicatorProps, 'status'>) => (
    <StatusIndicator status="approved" {...props} />
  ),
  Matched: (props: Omit<StatusIndicatorProps, 'status'>) => (
    <StatusIndicator status="matched" {...props} />
  ),
  Rejected: (props: Omit<StatusIndicatorProps, 'status'>) => (
    <StatusIndicator status="rejected" {...props} />
  ),
  Processing: (props: Omit<StatusIndicatorProps, 'status'>) => (
    <StatusIndicator status="processing" animated {...props} />
  ),
  Success: (props: Omit<StatusIndicatorProps, 'status'>) => (
    <StatusIndicator status="success" {...props} />
  ),
  Warning: (props: Omit<StatusIndicatorProps, 'status'>) => (
    <StatusIndicator status="warning" {...props} />
  ),
  Error: (props: Omit<StatusIndicatorProps, 'status'>) => (
    <StatusIndicator status="error" {...props} />
  ),
};

export default StatusIndicator;
