'use client';

import {
  IconTrendingDown,
  IconTrendingUp,
  IconMinus,
  IconAlertTriangle,
  IconUsers,
  IconCircleCheck,
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

interface ManagerMetrics {
  logsAwaitingReview: number;
  recentApprovals: number;
}

interface ManagerSectionCardsProps {
  metrics?: ManagerMetrics;
}

export function ManagerSectionCards({ metrics }: ManagerSectionCardsProps) {
  // Calculate derived metrics and trends
  const pendingLogs = metrics?.logsAwaitingReview || 0;
  const recentApprovals = metrics?.recentApprovals || 0;

  // Mock data for display purposes
  const teamEfficiency = 87;
  const exceptionAlerts = 3;

  // Mock trend data - TODO: Replace with real trend calculations
  const pendingTrend = pendingLogs > 10 ? -8.2 : pendingLogs > 5 ? 3.1 : -2.1;
  const approvalsTrend = recentApprovals > 20 ? 12.5 : 5.3;
  const efficiencyTrend = teamEfficiency > 85 ? 3.1 : -1.2;
  const alertsTrend = exceptionAlerts < 5 ? -15.2 : 8.7;

  const sectionCardsData = [
    {
      title: 'Pending Approvals',
      description: 'Logs awaiting review',
      value: pendingLogs.toString(),
      trend:
        pendingLogs > 0
          ? {
              value: Math.abs(pendingTrend),
              type:
                pendingTrend > 0
                  ? ('increase' as const)
                  : ('decrease' as const),
            }
          : undefined,
      footer: {
        primary: pendingLogs > 0 ? 'Requires your attention' : 'All caught up!',
        secondary: `${recentApprovals} approved this week`,
      },
      icon: IconClock,
      actionButton:
        pendingLogs > 0
          ? {
              label: 'Review Now',
              variant: 'default' as const,
            }
          : undefined,
    },
    {
      title: 'Team Performance',
      description: 'Average efficiency',
      value: `${teamEfficiency}%`,
      trend: {
        value: Math.abs(efficiencyTrend),
        type:
          efficiencyTrend > 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary: teamEfficiency > 85 ? 'Above target' : 'Needs attention',
        secondary: `12 team members`,
      },
      icon: IconUsers,
    },
    {
      title: 'Recent Approvals',
      description: 'Last 7 days',
      value: recentApprovals.toString(),
      trend: {
        value: approvalsTrend,
        type: 'increase' as const,
      },
      footer: {
        primary: 'Logs processed',
        secondary: `Avg 45s per review`,
      },
      icon: IconCircleCheck,
    },
    {
      title: 'Exception Alerts',
      description: 'Requires attention',
      value: exceptionAlerts.toString(),
      trend:
        exceptionAlerts > 0
          ? {
              value: Math.abs(alertsTrend),
              type:
                alertsTrend > 0 ? ('increase' as const) : ('decrease' as const),
            }
          : undefined,
      footer: {
        primary: exceptionAlerts > 0 ? 'Active alerts' : 'No alerts',
        secondary:
          exceptionAlerts > 0 ? 'System notifications' : 'All systems normal',
      },
      icon: IconAlertTriangle,
      actionButton:
        exceptionAlerts > 0
          ? {
              label: 'View Alerts',
              variant: 'outline' as const,
            }
          : undefined,
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
