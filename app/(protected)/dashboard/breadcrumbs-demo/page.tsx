import { SmartBreadcrumbs } from '@/components/layout/smart-breadcrumbs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuditTrailService } from '@/lib/audit-trail';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

const NAVIGATION_ACTIONS = ['navigate', 'view', 'open'];

export default async function BreadcrumbsPage() {
  const stats = await AuditTrailService.getAuditStatistics();
  const navigationEvents = stats.recentActivity
    .filter((entry) => {
      const action = entry.action?.toLowerCase?.() || '';
      return (
        entry.entityType === 'navigation' ||
        NAVIGATION_ACTIONS.some((token) => action.includes(token))
      );
    })
    .slice(0, 8);

  const totalTrackedEvents = navigationEvents.length;
  const uniqueUsers = new Set(
    navigationEvents.map((entry) => entry.user?.fullName || entry.userId)
  ).size;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Navigation
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
          Live Breadcrumbs
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Breadcrumbs are now powered by production data. The component below
          renders the same navigation structure used across the app, including
          dynamic labels for logs, payroll, commissions, and user detail views.
        </p>
      </div>

      <Card className="border-hunks-green/20 bg-gradient-to-br from-hunks-green/5 to-background">
        <CardHeader>
          <CardDescription>Current Location</CardDescription>
          <CardTitle className="text-2xl">Smart Breadcrumbs</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartBreadcrumbs className="px-2 py-1" />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Activity Overview</CardDescription>
            <CardTitle>Navigation Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracked Events</p>
                <p className="text-2xl font-semibold">{totalTrackedEvents}</p>
              </div>
              <Badge variant="outline" className="text-hunks-green">
                Live data
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-semibold">{uniqueUsers}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {uniqueUsers === 1 ? 'user' : 'users'} in last 20 events
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Navigation telemetry is sourced from the audit log so dashboard
              breadcrumbs stay consistent with actual workflows.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardDescription>Recent Activity</CardDescription>
            <CardTitle>Last navigation events</CardTitle>
          </CardHeader>
          <CardContent>
            {navigationEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No navigation activity has been recorded yet. Events will start
                appearing automatically as users traverse the app.
              </p>
            ) : (
              <div className="space-y-4">
                {navigationEvents.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-1 rounded-md border border-border/60 bg-card/40 p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {entry.user?.fullName || 'System'}
                      </span>
                      <span className="text-muted-foreground">
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(entry.createdAt, {
                          addSuffix: true,
                        })}
                      </span>
                      <span>• Entity: {entry.entityType}</span>
                      {entry.entityId && <span>ID: {entry.entityId}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
