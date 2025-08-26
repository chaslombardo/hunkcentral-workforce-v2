'use client';

import {
  IconTrendingDown,
  IconTrendingUp,
  IconMinus,
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
import { formatCurrency } from '@/lib/formatters';

interface CaptainMetrics {
  currentPayPeriodRevenue: number;
  currentPayPeriodTips: number;
  junkLaborBonus: number;
  moveLaborBonus: number;
  totalJobs?: number;
  junkJobs?: number;
  moveJobs?: number;
  averageJobSize?: number;
  laborCostPercent?: number;
}

interface CaptainSectionCardsProps {
  metrics?: CaptainMetrics;
}

export function CaptainSectionCards({ metrics }: CaptainSectionCardsProps) {
  // Calculate derived metrics
  const totalJobs = (metrics?.junkJobs || 0) + (metrics?.moveJobs || 0);
  const totalLaborBonus =
    (metrics?.junkLaborBonus || 0) + (metrics?.moveLaborBonus || 0);
  const laborCostPercent = metrics?.laborCostPercent || 0;

  // Mock trend data - TODO: Replace with real trend calculations
  const jobsTrend = totalJobs > 10 ? 8.2 : totalJobs > 5 ? 3.1 : -2.1;
  const revenueTrend =
    (metrics?.currentPayPeriodRevenue || 0) > 5000 ? 12.5 : 5.3;
  const tipsTrend = (metrics?.currentPayPeriodTips || 0) > 500 ? 15.2 : 8.7;
  const bonusTrend = totalLaborBonus > 0 ? 18.3 : 0;

  const sectionCardsData = [
    {
      title: 'Total Jobs',
      description: 'Current pay period',
      value: totalJobs.toString(),
      trend: {
        value: Math.abs(jobsTrend),
        type:
          jobsTrend > 0
            ? ('increase' as const)
            : jobsTrend < 0
              ? ('decrease' as const)
              : ('neutral' as const),
      },
      footer: {
        primary: 'Jobs completed this period',
        secondary: `${metrics?.junkJobs || 0} Junk, ${metrics?.moveJobs || 0} Move`,
      },
    },
    {
      title: 'Total Revenue',
      description: 'Current pay period',
      value: formatCurrency(metrics?.currentPayPeriodRevenue || 0),
      trend: {
        value: revenueTrend,
        type: 'increase' as const,
      },
      footer: {
        primary: 'Revenue generated',
        secondary: 'All job types combined',
      },
    },
    {
      title: 'Total Tips',
      description: 'Current pay period',
      value: formatCurrency(metrics?.currentPayPeriodTips || 0),
      trend: {
        value: tipsTrend,
        type: 'increase' as const,
      },
      footer: {
        primary: 'Tips earned',
        secondary: 'Shared with team',
      },
    },
    {
      title: 'Labor Bonus',
      description: 'Efficiency bonus',
      value: formatCurrency(totalLaborBonus),
      trend:
        totalLaborBonus > 0
          ? {
              value: bonusTrend,
              type: 'increase' as const,
            }
          : undefined,
      footer: {
        primary:
          totalLaborBonus > 0
            ? 'Efficiency bonus earned'
            : 'No bonus this period',
        secondary: `Labor cost: ${laborCostPercent.toFixed(1)}%`,
      },
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
            <CardDescription className="text-hunks-green/80">
              {item.description}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-hunks-green">
              {item.value}
            </CardTitle>
            {item.trend && (
              <CardAction>
                <Badge
                  variant="outline"
                  className={
                    item.trend.type === 'increase'
                      ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950'
                      : item.trend.type === 'decrease'
                        ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950'
                        : 'border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-gray-950'
                  }
                >
                  {item.trend.type === 'increase' && (
                    <IconTrendingUp className="w-3 h-3" />
                  )}
                  {item.trend.type === 'decrease' && (
                    <IconTrendingDown className="w-3 h-3" />
                  )}
                  {item.trend.type === 'neutral' && (
                    <IconMinus className="w-3 h-3" />
                  )}
                  {item.trend.value > 0 ? '+' : ''}
                  {item.trend.value}%
                </Badge>
              </CardAction>
            )}
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {item.footer.primary}
              {item.trend && (
                <>
                  {item.trend.type === 'increase' && (
                    <IconTrendingUp className="size-4 text-green-600" />
                  )}
                  {item.trend.type === 'decrease' && (
                    <IconTrendingDown className="size-4 text-red-600" />
                  )}
                  {item.trend.type === 'neutral' && (
                    <IconMinus className="size-4 text-gray-600" />
                  )}
                </>
              )}
            </div>
            <div className="text-muted-foreground">{item.footer.secondary}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
