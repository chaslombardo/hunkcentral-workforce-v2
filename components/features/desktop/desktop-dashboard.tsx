'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { AdminChartAreaInteractive } from '../dashboard/admin-chart-area-interactive';
import { AdminDataTable } from '../dashboard/admin-data-table';

interface DesktopDashboardProps {
  metrics?: any; // DashboardMetrics
  roleMetrics?: any; // RoleSpecificMetrics
  loading?: boolean;
  error?: string | null;
  user?: {
    id: string;
    fullName: string;
    roles: string[];
  };
}

export function DesktopDashboard({
  metrics,
  roleMetrics,
  loading,
  error,
  user,
}: DesktopDashboardProps) {
  const [activeFilter, setActiveFilter] = useState('today');

  // Quick KPI calculations
  const kpis = {
    revenue: roleMetrics?.admin?.totalRevenue || 0,
    logs: roleMetrics?.admin?.pendingLogs || 0,
    users: roleMetrics?.admin?.activeUsers || 0,
    tips: roleMetrics?.admin?.dailyTips || 0,
  };

  if (loading && !metrics && !roleMetrics) {
    return (
      <div className="h-screen w-full bg-background">
        <div className="grid grid-cols-12 grid-rows-[auto,1fr] gap-4 p-4 h-full">
          <div className="col-span-12 grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="col-span-12 grid grid-cols-12 gap-4">
            <div className="col-span-8 h-96 bg-muted rounded-lg animate-pulse" />
            <div className="col-span-4 space-y-4">
              <div className="h-48 bg-muted rounded-lg animate-pulse" />
              <div className="h-48 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      {/* Header with Controls */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">
              <span className="text-hunks-green">HUNK</span>
              <span className="text-hunks-orange">Central</span> Dashboard
            </h1>
            <Badge variant="outline" className="hidden sm:flex">
              {user?.roles?.[0] || 'User'}
            </Badge>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            {/* Quick Date Filters */}
            <div className="flex items-center space-x-1">
              <Button
                variant={activeFilter === 'today' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('today')}
              >
                Today
              </Button>
              <Button
                variant={activeFilter === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('week')}
              >
                This Week
              </Button>
              <Button
                variant={activeFilter === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter('month')}
              >
                This Month
              </Button>
            </div>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid Layout */}
      <div className="grid grid-cols-12 grid-rows-[auto,1fr,auto] gap-4 p-4 h-[calc(100vh-3.5rem)]">
        {/* KPI Cards Row - Always Visible */}
        <div className="col-span-12">
          <div className="grid grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Daily Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${kpis.revenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +12.5% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Logs
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.logs}</div>
                <p className="text-xs text-muted-foreground">
                  {kpis.logs > 5 ? '⚠️ High priority' : '✅ On track'}
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.users}</div>
                <p className="text-xs text-muted-foreground">+2 this week</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Daily Tips
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${kpis.tips.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +8.3% from average
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="col-span-12 grid grid-cols-12 gap-4 overflow-hidden">
          {/* Charts and Analytics - Left Side (8 columns) */}
          <div className="col-span-8 space-y-4">
            <Tabs defaultValue="overview" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="logs">Daily Logs</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>Business Overview</CardTitle>
                    <CardDescription>
                      Key metrics and performance trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)]">
                    <AdminChartAreaInteractive metrics={roleMetrics?.admin} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>Daily Logs Review</CardTitle>
                    <CardDescription>
                      Review and approve submitted daily logs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)] overflow-auto">
                    <AdminDataTable metrics={roleMetrics?.admin} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payroll" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>Payroll Summary</CardTitle>
                    <CardDescription>
                      Current pay period overview and approvals
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)]">
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-4" />
                        <p>Payroll dashboard coming soon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Right Side (4 columns) */}
          <div className="col-span-4 space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Logs
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Payroll
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {/* Placeholder for activity feed */}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">New commission entry submitted</p>
                      <p className="text-xs text-muted-foreground">
                        2 minutes ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Daily log approved</p>
                      <p className="text-xs text-muted-foreground">
                        15 minutes ago
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">New user registered</p>
                      <p className="text-xs text-muted-foreground">
                        1 hour ago
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <Badge variant="outline" className="text-green-600">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">API Response</span>
                    <Badge variant="outline" className="text-green-600">
                      245ms
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Backup</span>
                    <Badge variant="outline" className="text-blue-600">
                      2h ago
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="col-span-12 border-t">
          <div className="flex items-center justify-between px-2 py-2">
            <div className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="text-xs text-muted-foreground">
              HUNKCentral v2.0 • Production
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
