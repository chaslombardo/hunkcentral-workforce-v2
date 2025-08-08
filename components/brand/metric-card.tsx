"use client"

import * as React from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  type LucideIcon 
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { 
  Card, 
  CardAction, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePerformanceMonitor, bundleAnalysis } from "@/lib/performance-monitor"

// Types extending shadcn/ui component props
export interface MetricCardProps extends React.ComponentProps<typeof Card> {
  title: string
  value: string | number
  description?: string
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period: string
    label?: string
  }
  icon?: LucideIcon
  color?: 'green' | 'orange' | 'blue' | 'purple' | 'neutral'
  trend?: number[] // Future enhancement for mini charts
  loading?: boolean
  footer?: {
    primary: string
    secondary?: string
  }
}

// Color variant mappings using brand colors
const colorVariants = {
  green: {
    border: 'border-l-hunks-green',
    badge: 'bg-hunks-green/10 text-hunks-green border-hunks-green/20',
    icon: 'text-hunks-green'
  },
  orange: {
    border: 'border-l-hunks-orange',
    badge: 'bg-hunks-orange/10 text-hunks-orange border-hunks-orange/20',
    icon: 'text-hunks-orange'
  },
  blue: {
    border: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: 'text-blue-500'
  },
  purple: {
    border: 'border-l-purple-500',
    badge: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    icon: 'text-purple-500'
  },
  neutral: {
    border: 'border-l-muted-foreground',
    badge: 'bg-muted text-muted-foreground border-muted-foreground/20',
    icon: 'text-muted-foreground'
  }
} as const

// Trend icon mapping
const getTrendIcon = (type: 'increase' | 'decrease' | 'neutral') => {
  switch (type) {
    case 'increase':
      return TrendingUp
    case 'decrease':
      return TrendingDown
    case 'neutral':
      return Minus
    default:
      return Minus
  }
}

// Loading skeleton component - memoized for performance
const MetricCardSkeleton = React.memo(function MetricCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-l-4", className)}>
      <CardHeader>
        <CardDescription>
          <Skeleton className="h-4 w-24" />
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          <Skeleton className="h-8 w-20" />
        </CardTitle>
        <CardAction>
          <Skeleton className="h-6 w-16 rounded-full" />
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="text-muted-foreground">
          <Skeleton className="h-4 w-40" />
        </div>
      </CardFooter>
    </Card>
  )
})

const MetricCard = React.memo(function MetricCard({
  title,
  value,
  description,
  change,
  icon: Icon,
  color = 'neutral',
  trend: _trend, // Reserved for future mini-chart implementation
  loading = false,
  footer,
  className,
  ...props
}: MetricCardProps) {
  const monitor = usePerformanceMonitor('MetricCard');
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
    bundleAnalysis.warnLargeProps('MetricCard', props, 500);
  }, [props]);

  // Memoized calculations to prevent unnecessary re-computations
  const colorClasses = React.useMemo(() => colorVariants[color], [color]);
  const TrendIcon = React.useMemo(() => change ? getTrendIcon(change.type) : null, [change]);

  // Memoized formatters
  const formatChange = React.useCallback((changeValue: number) => {
    const sign = changeValue > 0 ? '+' : ''
    return `${sign}${changeValue}%`
  }, []);

  // Memoized display value calculation
  const displayValue = React.useMemo(() => {
    return typeof value === 'number' 
      ? value === 0 
        ? '0' 
        : value.toLocaleString()
      : value || '—'
  }, [value]);

  // Memoized empty state check
  const isEmpty = React.useMemo(() => {
    return (typeof value === 'number' && value === 0) || !value
  }, [value]);

  // Show loading skeleton
  if (loading) {
    return <MetricCardSkeleton className={cn(colorClasses.border, className)} />
  }

  return (
    <Card 
      className={cn(
        "@container/card border-l-4 from-primary/5 to-card bg-gradient-to-t shadow-xs",
        colorClasses.border,
        className
      )} 
      {...props}
    >
      <CardHeader>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardDescription className="text-sm font-medium">
              {title}
            </CardDescription>
            <CardTitle className={cn(
              "text-2xl font-semibold tabular-nums @[250px]/card:text-3xl",
              isEmpty && "text-muted-foreground"
            )}>
              {displayValue}
            </CardTitle>
          </div>
          {Icon && (
            <Icon className={cn("h-5 w-5 shrink-0", colorClasses.icon)} />
          )}
        </div>
        {change && (
          <CardAction>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1",
                colorClasses.badge
              )}
            >
              {TrendIcon && <TrendIcon className="h-3 w-3" />}
              {formatChange(change.value)}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      
      {footer && (
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {footer.primary}
            {TrendIcon && <TrendIcon className="h-4 w-4" />}
          </div>
          {footer.secondary && (
            <div className="text-muted-foreground">
              {footer.secondary}
            </div>
          )}
          {change?.period && (
            <div className="text-muted-foreground text-xs">
              {change.label || 'Change'} for {change.period}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
});

// Export the memoized component and skeleton
export { MetricCard, MetricCardSkeleton }

// Preset configurations for common metrics
export const METRIC_PRESETS = {
  revenue: {
    color: 'green' as const,
    title: 'Total Revenue',
    description: 'Monthly revenue'
  },
  customers: {
    color: 'blue' as const,
    title: 'New Customers',
    description: 'Customer acquisition'
  },
  orders: {
    color: 'orange' as const,
    title: 'Active Orders',
    description: 'Current orders'
  },
  growth: {
    color: 'purple' as const,
    title: 'Growth Rate',
    description: 'Monthly growth'
  }
} as const