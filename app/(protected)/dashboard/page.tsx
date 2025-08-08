"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useSession } from '@/hooks/useSession'
import { useDashboardData } from '@/hooks/useDashboardData'
import { MetricCard } from '@/components/brand/metric-card'
import { EmptyState } from '@/components/ui/empty-state'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ClipboardList, 
  DollarSign, 
  BarChart3, 
  Users,
  Calendar,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useSession()
  const { metrics, roleMetrics, loading, error, refetch } = useDashboardData(user?.roles)

  const getQuickActions = () => {
    const actions = []
    
    if (user?.roles?.includes('captain') || user?.roles?.includes('admin')) {
      actions.push({
        title: "Create Daily Log",
        description: "Record today's jobs and team hours",
        href: "/logs/create",
        icon: ClipboardList,
        color: "bg-[#026937] hover:bg-[#026937]/90",
      })
    }

    if (user?.roles?.includes('sales') || user?.roles?.includes('admin')) {
      actions.push({
        title: "Add Commission",
        description: "Track new job bookings",
        href: "/commission/create",
        icon: DollarSign,
        color: "bg-[#ea7200] hover:bg-[#ea7200]/90",
      })
    }

    if (user?.roles?.includes('manager') || user?.roles?.includes('admin')) {
      actions.push({
        title: "Review Logs",
        description: "Approve pending daily logs",
        href: "/logs/review",
        icon: BarChart3,
        color: "bg-blue-600 hover:bg-blue-700",
      })
    }

    if (user?.roles?.includes('admin')) {
      actions.push({
        title: "Manage Users",
        description: "Add and configure employees",
        href: "/admin/users",
        icon: Users,
        color: "bg-purple-600 hover:bg-purple-700",
      })
    }

    return actions
  }

  const quickActions = getQuickActions()

  // Format pay period status for display
  const formatPayPeriodStatus = (status: string) => {
    switch (status) {
      case 'open':
        return 'Open'
      case 'locked':
        return 'Locked'
      case 'closed':
        return 'Closed'
      default:
        return status
    }
  }

  // Format time ago for recent activity
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#026937]">
            Welcome back, {user?.fullName || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your workforce today.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={loading}
                className="ml-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Overview Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Pending Logs"
            description="Awaiting review"
            value={metrics?.pendingLogs.count ?? 0}
            icon={ClipboardList}
            color="orange"
            loading={loading}
            change={metrics?.pendingLogs.change}
            footer={{
              primary: `${metrics?.pendingLogs.count ?? 0} logs need attention`,
              secondary: "Manager review required"
            }}
          />
          
          <MetricCard
            title="Commission Entries"
            description="This week"
            value={metrics?.commissionEntries.count ?? 0}
            icon={DollarSign}
            color="green"
            loading={loading}
            change={metrics?.commissionEntries.change}
            footer={{
              primary: `${metrics?.commissionEntries.count ?? 0} new entries`,
              secondary: "Sales activity tracking"
            }}
          />
          
          <MetricCard
            title="Active Users"
            description="System users"
            value={metrics?.activeUsers.count ?? 0}
            icon={Users}
            color="blue"
            loading={loading}
            change={metrics?.activeUsers.change}
            footer={{
              primary: `${metrics?.activeUsers.count ?? 0} total users`,
              secondary: "Workforce management"
            }}
          />
          
          <MetricCard
            title="Current Pay Period"
            description={metrics?.currentPayPeriod.name || "Pay period status"}
            value={formatPayPeriodStatus(metrics?.currentPayPeriod.status || 'Unknown')}
            icon={Calendar}
            color={
              metrics?.currentPayPeriod.status === 'open' ? 'green' :
              metrics?.currentPayPeriod.status === 'locked' ? 'orange' : 'neutral'
            }
            loading={loading}
            footer={{
              primary: metrics?.currentPayPeriod.daysRemaining 
                ? `${metrics.currentPayPeriod.daysRemaining} days remaining`
                : 'No active period',
              secondary: metrics?.currentPayPeriod.name || 'Pay period tracking'
            }}
          />
        </div>

        {/* Role-specific metrics */}
        {roleMetrics && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Captain metrics */}
            {roleMetrics.captain && (
              <>
                <MetricCard
                  title="My Draft Logs"
                  description="Unsaved work"
                  value={roleMetrics.captain.draftLogs}
                  icon={ClipboardList}
                  color="neutral"
                  footer={{
                    primary: "Complete and submit",
                    secondary: "Draft logs need attention"
                  }}
                />
                <MetricCard
                  title="My Submitted Logs"
                  description="Awaiting approval"
                  value={roleMetrics.captain.submittedLogs}
                  icon={Clock}
                  color="orange"
                  footer={{
                    primary: "Under manager review",
                    secondary: "Pending approval"
                  }}
                />
              </>
            )}

            {/* Sales metrics */}
            {roleMetrics.sales && (
              <>
                <MetricCard
                  title="My Pending Commissions"
                  description="Awaiting job completion"
                  value={roleMetrics.sales.pendingCommissions}
                  icon={DollarSign}
                  color="orange"
                  footer={{
                    primary: "Waiting for job logs",
                    secondary: "Commission tracking"
                  }}
                />
                <MetricCard
                  title="My Matched Commissions"
                  description="Ready for payout"
                  value={roleMetrics.sales.matchedCommissions}
                  icon={DollarSign}
                  color="green"
                  footer={{
                    primary: "Successfully matched",
                    secondary: "Commission earned"
                  }}
                />
              </>
            )}

            {/* Manager metrics */}
            {roleMetrics.manager && (
              <>
                <MetricCard
                  title="Logs Awaiting Review"
                  description="Requires your approval"
                  value={roleMetrics.manager.logsAwaitingReview}
                  icon={BarChart3}
                  color="orange"
                  footer={{
                    primary: "Action required",
                    secondary: "Manager review needed"
                  }}
                />
                <MetricCard
                  title="Recent Approvals"
                  description="Last 7 days"
                  value={roleMetrics.manager.recentApprovals}
                  icon={BarChart3}
                  color="green"
                  footer={{
                    primary: "Logs processed",
                    secondary: "Your recent activity"
                  }}
                />
              </>
            )}
          </div>
        )}

        {/* Quick Actions and Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <Button 
                    key={action.title} 
                    asChild 
                    className={`w-full justify-start ${action.color} text-white`}
                  >
                    <Link href={action.href} className="flex items-center gap-2">
                      <action.icon className="h-4 w-4" />
                      {action.title}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activity</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                </div>
              ) : metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {metrics.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div className="flex-shrink-0 w-2 h-2 bg-[#026937] rounded-full mt-2" />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground">{activity.description}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatTimeAgo(activity.timestamp)} • {activity.user}
                        </p>
                      </div>
                    </div>
                  ))}
                  {metrics.recentActivity.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      And {metrics.recentActivity.length - 5} more activities...
                    </p>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No Recent Activity"
                  description="Activity will appear here as users interact with the system."
                  className="py-8"
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
