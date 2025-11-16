'use client';

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
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ManagerDesktopDashboardProps {
  metrics?: any;
  roleMetrics?: any;
  loading?: boolean;
  error?: string | null;
  user?: any;
}

export function ManagerDesktopDashboard({
  metrics,
  roleMetrics,
  loading,
  user,
}: ManagerDesktopDashboardProps) {
  // Manager-specific KPIs
  const kpis = {
    teamSize: roleMetrics?.manager?.teamSize || 0,
    pendingLogs: roleMetrics?.manager?.pendingLogs || 0,
    weeklyRevenue: roleMetrics?.manager?.weeklyRevenue || 0,
    teamEfficiency: roleMetrics?.manager?.efficiency || 0,
  };

  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">
              <span className="text-hunks-green">HUNK</span>
              <span className="text-hunks-orange">Central</span> Management
            </h1>
            <Badge variant="outline">Manager</Badge>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 grid-rows-[auto,1fr] gap-4 p-4 h-[calc(100vh-3.5rem)]">
        {/* KPI Cards */}
        <div className="col-span-12">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.teamSize}</div>
                <p className="text-xs text-muted-foreground">
                  Active this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Logs
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.pendingLogs}</div>
                <p className="text-xs text-muted-foreground">
                  {kpis.pendingLogs > 10 ? (
                    <span className="text-orange-600">⚠️ Review required</span>
                  ) : (
                    '✅ Good'
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Weekly Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${kpis.weeklyRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">↑ 8.3%</span> from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Efficiency
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.teamEfficiency}%</div>
                <p className="text-xs text-muted-foreground">
                  {kpis.teamEfficiency >= 85
                    ? '🎯 Above target'
                    : '📈 Room to improve'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 grid grid-cols-12 gap-4">
          {/* Main Panel - Team Management */}
          <div className="col-span-8">
            <Tabs defaultValue="logs" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="logs">Daily Logs</TabsTrigger>
                <TabsTrigger value="team">Team Performance</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="logs" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>Team Daily Logs</CardTitle>
                    <CardDescription>
                      Review and approve crew daily logs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)] overflow-auto">
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Pending logs will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>
                      Crew efficiency and productivity metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)]">
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <p>Team analytics coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>Crew Schedule</CardTitle>
                    <CardDescription>
                      Manage team schedules and assignments
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)]">
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4" />
                      <p>Calendar view coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Quick Actions & Alerts */}
          <div className="col-span-4 space-y-4">
            {/* Priority Alerts */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-sm">Priority Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {kpis.pendingLogs > 10 && (
                  <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {kpis.pendingLogs} logs pending
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requires immediate review
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Payroll deadline</p>
                    <p className="text-xs text-muted-foreground">
                      2 days remaining
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Review Logs ({kpis.pendingLogs})
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Team Roster
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Approve Payroll
                </Button>
              </CardContent>
            </Card>

            {/* Team Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Team Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">On shift</span>
                    <Badge variant="outline" className="text-green-600">
                      8
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Available</span>
                    <Badge variant="outline" className="text-blue-600">
                      4
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Off today</span>
                    <Badge variant="outline">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
