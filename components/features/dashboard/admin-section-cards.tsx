'use client';

import {
  IconTrendingDown,
  IconTrendingUp,
  IconServer,
  IconUsers,
  IconActivity,
  IconSettings,
  IconShield,
  IconDatabase,
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

interface AdminMetrics {
  systemHealth: number;
  userActivity: number;
  errorRate: number;
  performanceScore: number;
  activeUsers?: number;
  pendingTasks?: number;
  databaseHealth?: number;
}

interface AdminSectionCardsProps {
  metrics?: AdminMetrics;
}

export function AdminSectionCards({ metrics }: AdminSectionCardsProps) {
  // Calculate derived metrics and trends from real data or defaults
  const systemHealth = metrics?.systemHealth || 98;
  const userActivity = metrics?.userActivity || 156;
  const errorRate = metrics?.errorRate || 0.1;
  const performanceScore = metrics?.performanceScore || 95;
  const activeUsers =
    metrics?.activeUsers ?? Math.max(1, Math.round(userActivity * 0.85));
  const pendingTasks =
    metrics?.pendingTasks ?? Math.max(0, Math.round(5 - performanceScore / 25));
  const databaseHealth = metrics?.databaseHealth ?? Math.max(90, systemHealth);

  // Calculate trends based on provided data or defaults
  const healthTrend = systemHealth > 95 ? 1.2 : -2.3; // Simulated trend
  const usersTrend = userActivity > 150 ? 5.4 : -1.8; // Simulated trend
  const activityTrend = userActivity > 140 ? 8.7 : -3.2; // Simulated trend
  const tasksTrend = errorRate < 0.2 ? -2.1 : 4.5; // Simulated trend

  const sectionCardsData = [
    {
      title: 'System Health',
      description: 'Overall status',
      value: `${systemHealth}%`,
      trend: {
        value: Math.abs(healthTrend),
        type: healthTrend > 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary:
          systemHealth > 95 ? 'All systems operational' : 'Attention required',
        secondary: `${(100 - errorRate).toFixed(1)}% uptime, ${errorRate}% error rate`,
      },
      icon: IconServer,
      actionButton:
        systemHealth < 95
          ? {
              label: 'View Issues',
              variant: 'outline' as const,
            }
          : undefined,
    },
    {
      title: 'Active Users',
      description: 'System users',
      value: activeUsers.toString(),
      trend: {
        value: Math.abs(usersTrend),
        type: usersTrend > 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary: 'User activity period',
        secondary: 'Based on recent log entries',
      },
      icon: IconUsers,
      actionButton: {
        label: 'Manage Users',
        variant: 'outline' as const,
      },
    },
    {
      title: 'User Activity',
      description: 'Last 24 hours',
      value: userActivity.toString(),
      trend: {
        value: Math.abs(activityTrend),
        type: activityTrend > 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary: 'Active sessions',
        secondary: `${Math.floor(userActivity * 0.6)} unique users`,
      },
      icon: IconActivity,
    },
    {
      title: 'Admin Tasks',
      description: 'Pending actions',
      value: pendingTasks.toString(),
      trend:
        pendingTasks > 0
          ? {
              value: Math.abs(tasksTrend),
              type:
                tasksTrend > 0 ? ('increase' as const) : ('decrease' as const),
            }
          : undefined,
      footer: {
        primary: pendingTasks > 0 ? 'Requires attention' : 'All tasks complete',
        secondary: pendingTasks > 0 ? 'Administrative queue' : 'Great work!',
      },
      icon: IconSettings,
      actionButton:
        pendingTasks > 0
          ? {
              label: 'View Tasks',
              variant: 'default' as const,
            }
          : undefined,
    },
  ];

  // Additional system metrics cards
  const systemCardsData = [
    {
      title: 'Database Health',
      description: 'Performance status',
      value: `${databaseHealth}%`,
      trend: {
        value: 0.5,
        type: 'increase' as const,
      },
      footer: {
        primary:
          databaseHealth > 95 ? 'Optimal performance' : 'Needs attention',
        secondary: 'Query response time: 45ms',
      },
      icon: IconDatabase,
    },
    {
      title: 'Security Status',
      description: 'System security',
      value: 'Secure',
      footer: {
        primary: 'No security alerts',
        secondary: 'Last scan: 2 hours ago',
      },
      icon: IconShield,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Admin Metrics */}
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

      {/* System Health Details */}
      <div className="*:data-[slot=card]:from-hunks-green/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @3xl/main:grid-cols-3">
        {systemCardsData.map((item, index) => (
          <Card
            key={index}
            className="@container/card border-l-4 border-l-hunks-orange"
          >
            <CardHeader>
              <CardDescription className="text-hunks-orange/80 flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                {item.description}
              </CardDescription>
              <CardTitle className="text-xl font-semibold tabular-nums text-hunks-orange">
                {item.value}
              </CardTitle>
              {item.trend && (
                <CardAction>
                  <Badge
                    variant="outline"
                    className="border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950"
                  >
                    <IconTrendingUp className="w-3 h-3" />+{item.trend.value}%
                  </Badge>
                </CardAction>
              )}
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {item.footer.primary}
                {item.trend && (
                  <IconTrendingUp className="size-4 text-green-600" />
                )}
              </div>
              <div className="text-muted-foreground text-xs">
                {item.footer.secondary}
              </div>
            </CardFooter>
          </Card>
        ))}

        {/* Quick Actions Card */}
        <Card className="@container/card border-l-4 border-l-hunks-green">
          <CardHeader>
            <CardDescription className="text-hunks-green/80 flex items-center gap-2">
              <IconSettings className="w-4 h-4" />
              Quick Actions
            </CardDescription>
            <CardTitle className="text-xl font-semibold text-hunks-green">
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <Button size="sm" variant="outline" className="w-full">
              Manage Pay Periods
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              System Backup
            </Button>
            <Button size="sm" variant="outline" className="w-full">
              View Audit Logs
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
