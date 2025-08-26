'use client';

import {
  IconTrendingDown,
  IconTrendingUp,
  IconMinus,
  IconCurrencyDollar,
  IconTarget,
  IconCalendar,
  IconClock,
} from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';

interface SalesMetrics {
  pendingCommissions: number;
  matchedCommissions: number;
}

interface SalesSectionCardsProps {
  metrics?: SalesMetrics;
}

export function SalesSectionCards({ metrics }: SalesSectionCardsProps) {
  // Calculate derived metrics and trends
  const pendingCommissions = metrics?.pendingCommissions || 8;
  const matchedCommissions = metrics?.matchedCommissions || 12;

  // Mock data for display purposes
  const totalCommissionValue = 3450;
  const monthlyTarget = 5000;
  const bookingsPipeline = 24;
  const conversionRate = 68;

  // Calculate performance vs target
  const targetPerformance = (totalCommissionValue / monthlyTarget) * 100;

  // Mock trend data - TODO: Replace with real trend calculations
  const pendingTrend = pendingCommissions > 10 ? 8.5 : -3.2;
  const matchedTrend = matchedCommissions > 8 ? 15.2 : 5.1;
  const pipelineTrend = bookingsPipeline > 20 ? 12.1 : -2.3;
  const targetTrend = targetPerformance > 80 ? 6.3 : -4.1;

  const sectionCardsData = [
    {
      title: 'Commission Earnings',
      description: 'Current pay period',
      value: formatCurrency(totalCommissionValue),
      trend: {
        value: Math.abs(matchedTrend),
        type: matchedTrend > 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary: `${matchedCommissions} matched commissions`,
        secondary: `${pendingCommissions} pending completion`,
      },
      icon: IconCurrencyDollar,
      actionButton: {
        label: 'View Details',
        variant: 'outline' as const,
      },
    },
    {
      title: 'Target Progress',
      description: 'Monthly goal',
      value: `${targetPerformance.toFixed(0)}%`,
      trend: {
        value: Math.abs(targetTrend),
        type: targetTrend > 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary:
          targetPerformance >= 100
            ? 'Target exceeded!'
            : targetPerformance >= 80
              ? 'On track'
              : 'Needs attention',
        secondary: `${formatCurrency(monthlyTarget - totalCommissionValue)} to goal`,
      },
      icon: IconTarget,
    },
    {
      title: 'Booking Pipeline',
      description: 'Active bookings',
      value: bookingsPipeline.toString(),
      trend: {
        value: Math.abs(pipelineTrend),
        type: pipelineTrend > 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary: 'Active opportunities',
        secondary: `${conversionRate}% conversion rate`,
      },
      icon: IconCalendar,
      actionButton: {
        label: 'Add Booking',
        variant: 'default' as const,
      },
    },
    {
      title: 'Pending Commissions',
      description: 'Awaiting job completion',
      value: pendingCommissions.toString(),
      trend:
        pendingCommissions > 0
          ? {
              value: Math.abs(pendingTrend),
              type:
                pendingTrend > 0
                  ? ('increase' as const)
                  : ('decrease' as const),
            }
          : undefined,
      footer: {
        primary:
          pendingCommissions > 0
            ? 'Waiting for job logs'
            : 'All commissions matched',
        secondary:
          pendingCommissions > 0 ? 'Commission tracking' : 'Great work!',
      },
      icon: IconClock,
    },
  ];

  return (
    <div className="*:data-[slot=card]:from-hunks-green/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {sectionCardsData.map((item, index) => (
        <Card
          key={index}
          className="@container/card border-l-4 border-l-hunks-green"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription className="text-hunks-green/80 flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                {item.description}
              </CardDescription>
              {item.trend && (
                <CardAction>
                  <Badge
                    variant="outline"
                    className={
                      item.trend.type === 'increase'
                        ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950'
                        : 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950'
                    }
                  >
                    {item.trend.type === 'increase' && (
                      <IconTrendingUp className="w-3 h-3" />
                    )}
                    {item.trend.type === 'decrease' && (
                      <IconTrendingDown className="w-3 h-3" />
                    )}
                    {item.trend.value > 0 ? '+' : ''}
                    {item.trend.value}%
                  </Badge>
                </CardAction>
              )}
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-hunks-green">
              {item.value}
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-3 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium w-full">
              {item.footer.primary}
              {item.trend && (
                <>
                  {item.trend.type === 'increase' && (
                    <IconTrendingUp className="size-4 text-green-600" />
                  )}
                  {item.trend.type === 'decrease' && (
                    <IconTrendingDown className="size-4 text-red-600" />
                  )}
                </>
              )}
            </div>
            <div className="text-muted-foreground text-xs">
              {item.footer.secondary}
            </div>
            {item.actionButton && (
              <Button
                size="sm"
                variant={item.actionButton.variant}
                className="w-full mt-2"
              >
                {item.actionButton.label}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
