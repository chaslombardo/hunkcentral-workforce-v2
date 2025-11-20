'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import type { RoleSpecificMetrics } from '@/lib/actions/dashboard';
import { ROUTES } from '@/lib/routes';
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
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
export interface AdminSectionCardsProps {
  metrics?: RoleSpecificMetrics['admin'];
}
type ActionButton = {
  label: string;
  href: string;
  variant?: ButtonProps['variant'];
  disabled?: boolean;
};

type SectionCard = {
  title: string;
  description: string;
  value: string;
  trend?: {
    value: string;
    type: 'increase' | 'decrease';
  };
  footer: {
    primary: string;
    secondary: string;
  };
  icon: ComponentType<{ className?: string }>;
  actionButton?: ActionButton;
};

export function AdminSectionCards({ metrics }: AdminSectionCardsProps) {
  const systemHealth = metrics?.systemHealth ?? 95;
  const userActivity = metrics?.userActivity ?? 0;
  const errorRate = metrics?.errorRate ?? 0;
  const activeUsers = metrics?.activeUsers ?? 0;
  const pendingTasks = metrics?.pendingTasks ?? 0;
  const tasksTrend = pendingTasks - 5;
  const databaseHealth = metrics?.databaseHealth ?? 94;
  const uptime = metrics?.uptime ?? 100;
  const activeAlerts = metrics?.activeAlerts ?? 0;

  const history = metrics?.performanceHistory ?? [];
  const firstSnapshot = history[0];
  const lastSnapshot = history[history.length - 1];
  const healthTrendValue =
    firstSnapshot && lastSnapshot
      ? lastSnapshot.systemHealth - firstSnapshot.systemHealth
      : 0;
  const usersTrend =
    firstSnapshot && lastSnapshot
      ? lastSnapshot.activeUsers - firstSnapshot.activeUsers
      : 0;
  const activityTrend =
    firstSnapshot && lastSnapshot
      ? lastSnapshot.userActivity - firstSnapshot.userActivity
      : 0;
  const sectionCardsData: SectionCard[] = [
    {
      title: 'System Health',
      description: 'Overall status',
      value: `${systemHealth}%`,
      trend: {
        value: Math.abs(healthTrendValue).toFixed(1),
        type:
          healthTrendValue >= 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary:
          systemHealth > 95 ? 'All systems operational' : 'Attention required',
        secondary: `${uptime}% uptime • ${errorRate}% error rate`,
      },
      icon: IconServer,
      actionButton: {
        label: systemHealth < 95 ? 'View Issues' : 'Open Monitoring',
        variant: 'outline',
        href: ROUTES.ADMIN_MONITORING,
      },
    },
    {
      title: 'Active Users',
      description: 'System users',
      value: activeUsers.toString(),
      trend: {
        value: Math.abs(usersTrend).toFixed(0),
        type: usersTrend >= 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary: 'Unique users last 24h',
        secondary: `${userActivity.toLocaleString()} interactions tracked`,
      },
      icon: IconUsers,
      actionButton: {
        label: 'Manage Users',
        variant: 'outline',
        href: ROUTES.MANAGE_USERS,
      },
    },
    {
      title: 'User Activity',
      description: 'Last 24 hours',
      value: userActivity.toString(),
      trend: {
        value: Math.abs(activityTrend).toFixed(0),
        type:
          activityTrend >= 0 ? ('increase' as const) : ('decrease' as const),
      },
      footer: {
        primary: 'Telemetry events captured',
        secondary: `${(userActivity / (activeUsers || 1)).toFixed(1)} avg events per user`,
      },
      icon: IconActivity,
      actionButton: {
        label: 'Open Analytics',
        variant: 'outline',
        href: ROUTES.ANALYTICS_SETTINGS,
      },
    },
    {
      title: 'Admin Tasks',
      description: 'Pending actions',
      value: pendingTasks.toString(),
      trend:
        pendingTasks > 0
          ? {
              value: Math.abs(tasksTrend).toFixed(0),
              type:
                tasksTrend >= 0 ? ('increase' as const) : ('decrease' as const),
            }
          : undefined,
      footer: {
        primary: pendingTasks > 0 ? 'Requires attention' : 'All tasks complete',
        secondary: pendingTasks > 0 ? 'Administrative queue' : 'Great work!',
      },
      icon: IconSettings,
      actionButton: {
        label: 'View Tasks',
        variant: 'default',
        href: ROUTES.REVIEW_LOGS,
        disabled: pendingTasks === 0,
      },
    },
  ];
  // Additional system metrics cards
  const systemCardsData: SectionCard[] = [
    {
      title: 'Database Health',
      description: 'Performance status',
      value: `${databaseHealth}%`,
      trend: {
        value: Math.max(0, databaseHealth - 90).toFixed(1),
        type: 'increase' as const,
      },
      footer: {
        primary:
          databaseHealth > 95 ? 'Optimal performance' : 'Investigate queries',
        secondary: 'Monitoring transactions + caches',
      },
      icon: IconDatabase,
      actionButton: {
        label: 'Database Insights',
        variant: 'outline',
        href: `${ROUTES.ANALYTICS_SETTINGS}?focus=database`,
      },
    },
    {
      title: 'Security Status',
      description: 'System security',
      value: activeAlerts === 0 ? 'Secure' : `${activeAlerts} alert(s)`,
      footer: {
        primary:
          activeAlerts === 0 ? 'No open alerts' : 'Alerts need attention',
        secondary: 'Real-time monitoring',
      },
      icon: IconShield,
      actionButton: {
        label: 'Security Center',
        variant: 'outline',
        href: ROUTES.ADMIN_AUDIT,
      },
    },
  ];
  const insightButtons: ActionButton[] = [
    {
      label: 'Performance Studio',
      href: ROUTES.PERFORMANCE_STUDIO,
      variant: 'outline',
    },
    {
      label: 'Monitoring Rules',
      href: ROUTES.MONITORING_RULES,
      variant: 'outline',
    },
    {
      label: 'Customize Analytics',
      href: ROUTES.ANALYTICS_SETTINGS,
      variant: 'outline',
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
                      {Number(item.trend.value) > 0 ? '+' : ''}
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
                  disabled={item.actionButton.disabled}
                  asChild
                >
                  <Link href={item.actionButton.href}>
                    {item.actionButton.label}
                  </Link>
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
              {item.actionButton && (
                <Button
                  size="sm"
                  variant={item.actionButton.variant}
                  className="w-full mt-2"
                  asChild
                >
                  <Link href={item.actionButton.href}>
                    {item.actionButton.label}
                  </Link>
                </Button>
              )}
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
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href={ROUTES.PAY_PERIODS}>Manage Pay Periods</Link>
            </Button>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href={ROUTES.MONITORING_RULES}>System Backup Rules</Link>
            </Button>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <Link href={ROUTES.ADMIN_AUDIT}>View Audit Logs</Link>
            </Button>
          </CardFooter>
        </Card>
        {/* Insights Controls Card */}
        <Card className="@container/card border-l-4 border-l-hunks-orange">
          <CardHeader>
            <CardDescription className="text-hunks-orange/80 flex items-center gap-2">
              <IconActivity className="w-4 h-4" />
              Insights & Controls
            </CardDescription>
            <CardTitle className="text-xl font-semibold text-hunks-orange">
              Customization Lab
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            {insightButtons.map((button) => (
              <Button
                key={button.href}
                size="sm"
                variant={button.variant}
                className="w-full"
                asChild
              >
                <Link href={button.href}>{button.label}</Link>
              </Button>
            ))}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
