'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useDashboardData } from '@/hooks/useDashboardData';
import { MetricCard, MetricCardSkeleton } from '@/components/brand/metric-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BrandButton } from '@/components/brand/brand-button';
import { ArrowLeft, TrendingUp, Users, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function MetricCardsExamplePage() {
  const { metrics, loading, error, refetch } = useDashboardData();

  const cards = metrics
    ? [
        {
          title: 'Pending Logs',
          value: metrics.pendingLogs.count,
          description: 'Logs awaiting manager review',
          change: metrics.pendingLogs.change,
          icon: ClipboardCheck,
          color:
            metrics.pendingLogs.count === 0
              ? 'green'
              : metrics.pendingLogs.count > 10
                ? 'orange'
                : 'blue',
          footer: {
            primary:
              metrics.pendingLogs.count === 0
                ? 'All caught up'
                : `${metrics.pendingLogs.count} in queue`,
            secondary: metrics.pendingLogs.change?.period,
          },
        },
        {
          title: 'Weekly Commissions',
          value: metrics.commissionEntries.count,
          description: 'Entries created this week',
          change: metrics.commissionEntries.change,
          icon: TrendingUp,
          color: 'orange',
          footer: {
            primary: 'Matches the CRM feed',
            secondary: metrics.commissionEntries.change?.period,
          },
        },
        {
          title: 'Active Users',
          value: metrics.activeUsers.count,
          description: 'Employees with access',
          change: metrics.activeUsers.change,
          icon: Users,
          color: 'purple',
          footer: {
            primary: `${metrics.activeUsers.count} active in the last month`,
            secondary: metrics.activeUsers.change?.period,
          },
        },
      ]
    : [];

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <BrandButton variant="outline" size="sm" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </BrandButton>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
              Live Metric Cards
            </h1>
            <p className="text-muted-foreground">
              These cards are powered by the production dashboard metrics
              service. Refresh the data anytime to validate totals.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Component Features</CardTitle>
                <CardDescription>
                  Memoized layout, branded colors, skeletons, and change
                  indicators backed by real data.
                </CardDescription>
              </div>
              <BrandButton size="sm" onClick={refetch}>
                Refresh Metrics
              </BrandButton>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-hunks-green rounded-full" />
                Uses the same cached dashboard query as the main app
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-hunks-green rounded-full" />
                Change badges highlight week-over-week trends
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-hunks-green rounded-full" />
                Accessible focus states and keyboard shortcuts for interactive
                cards
              </li>
            </ul>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">
                Failed to load metrics
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading &&
            [0, 1, 2].map((index) => (
              <MetricCardSkeleton key={`metric-skeleton-${index}`} />
            ))}
          {!loading &&
            cards.map((card) => (
              <MetricCard
                key={card.title}
                title={card.title}
                value={card.value}
                description={card.description}
                change={card.change}
                icon={card.icon}
                color={card.color as 'green' | 'orange' | 'blue' | 'purple'}
                footer={card.footer}
              />
            ))}
        </div>
      </div>
    </ProtectedRoute>
  );
}
