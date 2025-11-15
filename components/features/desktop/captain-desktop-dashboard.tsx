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
  FileText,
  DollarSign,
  Users,
  Plus,
  Truck,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface CaptainDesktopDashboardProps {
  metrics?: any;
  roleMetrics?: {
    captain?: {
      todayRevenue: number;
      jobsToday: number;
      teamSize: number;
      tipsToday: number;
      hasPendingLog: boolean;
    };
  };
  loading?: boolean;
  error?: string | null;
  user?: any;
}

export function CaptainDesktopDashboard({
  metrics,
  roleMetrics,
  loading,
  error,
  user,
}: CaptainDesktopDashboardProps) {
  // Captain-specific KPIs
  const kpis = {
    todayRevenue: roleMetrics?.captain?.todayRevenue || 0,
    jobsToday: roleMetrics?.captain?.jobsToday || 0,
    teamMembers: roleMetrics?.captain?.teamSize || 0,
    tipsToday: roleMetrics?.captain?.tipsToday || 0,
    pendingLog: roleMetrics?.captain?.hasPendingLog || false,
  };

  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">
              <span className="text-hunks-green">HUNK</span>
              <span className="text-hunks-orange">Central</span> Captain
            </h1>
            <Badge variant="outline">Captain</Badge>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            <Button className="bg-hunks-green hover:bg-hunks-green/90">
              <Plus className="h-4 w-4 mr-2" />
              New Daily Log
            </Button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-3.5rem)]">
        {/* KPI Cards */}
        <div className="col-span-12">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today&apos;s Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${kpis.todayRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {kpis.jobsToday} jobs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Jobs Today
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.jobsToday}</div>
                <p className="text-xs text-muted-foreground">
                  {kpis.jobsToday >= 3 ? '🎯 Productive day' : 'Keep it up!'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Team Members
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.teamMembers}</div>
                <p className="text-xs text-muted-foreground">
                  Working with you today
                </p>
              </CardContent>
            </Card>

            <Card
              className={
                kpis.pendingLog ? 'border-orange-200 bg-orange-50' : ''
              }
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Log</CardTitle>
                {kpis.pendingLog ? (
                  <Clock className="h-4 w-4 text-orange-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {kpis.pendingLog ? '⏳' : '✓'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpis.pendingLog ? 'Pending submission' : 'Submitted today'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 grid grid-cols-12 gap-4">
          {/* Main Panel - Job Management */}
          <div className="col-span-8">
            <Tabs defaultValue="log" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="log">Daily Log</TabsTrigger>
                <TabsTrigger value="jobs">Today&apos;s Jobs</TabsTrigger>
                <TabsTrigger value="team">My Team</TabsTrigger>
              </TabsList>

              <TabsContent value="log" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>Daily Log Entry</CardTitle>
                    <CardDescription>
                      Record today&apos;s completed jobs and crew hours
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)] overflow-auto">
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Daily log entry form</p>
                      <p className="text-sm">
                        Click &quot;New Daily Log&quot; to get started
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="jobs" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>Today&apos;s Jobs</CardTitle>
                    <CardDescription>
                      Summary of jobs completed today
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)]">
                    <div className="text-center py-8 text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-4" />
                      <p>No jobs recorded yet today</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="flex-1 mt-4">
                <Card className="h-[calc(100%-2rem)]">
                  <CardHeader>
                    <CardTitle>My Team</CardTitle>
                    <CardDescription>
                      Crew members and their performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-6rem)]">
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <p>Team roster and performance</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Quick Info & Actions */}
          <div className="col-span-4 space-y-4">
            {/* Today&apos;s Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Today&apos;s Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Jobs:</span>
                    <span className="ml-2 font-medium">{kpis.jobsToday}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Revenue:</span>
                    <span className="ml-2 font-medium">
                      ${kpis.todayRevenue}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tips:</span>
                    <span className="ml-2 font-medium">${kpis.tipsToday}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Team:</span>
                    <span className="ml-2 font-medium">{kpis.teamMembers}</span>
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
                <Button className="w-full justify-start text-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Daily Log
                </Button>
                <Button
                  className="w-full justify-start text-sm"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job
                </Button>
                <Button
                  className="w-full justify-start text-sm"
                  variant="outline"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Record Tips
                </Button>
              </CardContent>
            </Card>

            {/* Daily Checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">End of Day Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Submit daily log</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Record team hours</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Document tips received</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>Note any issues</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
