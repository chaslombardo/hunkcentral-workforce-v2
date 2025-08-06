import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Clock,
  Target,
  AlertCircle,
  Download
} from 'lucide-react';

export default async function AnalyticsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check if user has permission to view analytics
  const canViewAnalytics = 
    session.user.roles?.includes('manager') ||
    session.user.roles?.includes('admin');

  if (!canViewAnalytics) {
    redirect('/dashboard');
  }

  // Mock data - in real implementation, this would come from database queries
  const analyticsData = {
    overview: {
      totalRevenue: 125000,
      revenueChange: 12.5,
      totalJobs: 342,
      jobsChange: 8.2,
      avgJobValue: 365,
      avgJobValueChange: -2.1,
      laborEfficiency: 16.8,
      laborEfficiencyChange: -1.2
    },
    jobTypes: {
      junk: { count: 198, revenue: 72000, avgValue: 364 },
      move: { count: 144, revenue: 53000, avgValue: 368 }
    },
    topPerformers: [
      { name: 'Mike Johnson', jobs: 45, revenue: 16500, efficiency: 14.2 },
      { name: 'Sarah Davis', jobs: 38, revenue: 14200, efficiency: 15.1 },
      { name: 'Tom Wilson', jobs: 42, revenue: 13800, efficiency: 16.8 }
    ],
    commissionStats: {
      totalCommissions: 8750,
      avgAccuracy: 87.3,
      pendingEntries: 12,
      matchedEntries: 156
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into operations, performance, and trends.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-[#026937]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalRevenue)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +{formatPercentage(analyticsData.overview.revenueChange)} from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                <BarChart3 className="h-4 w-4 text-[#ea7200]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalJobs}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  +{formatPercentage(analyticsData.overview.jobsChange)} from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Value</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.overview.avgJobValue)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  {formatPercentage(analyticsData.overview.avgJobValueChange)} from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Labor Efficiency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(analyticsData.overview.laborEfficiency)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  {formatPercentage(analyticsData.overview.laborEfficiencyChange)} from last month
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Type Breakdown */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Type Performance</CardTitle>
                <CardDescription>Revenue and job count by service type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#026937] hover:bg-[#026937]/90">Junk Removal</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(analyticsData.jobTypes.junk.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{analyticsData.jobTypes.junk.count} jobs</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-[#ea7200] hover:bg-[#ea7200]/90">Moving</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(analyticsData.jobTypes.move.revenue)}</div>
                      <div className="text-sm text-muted-foreground">{analyticsData.jobTypes.move.count} jobs</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest performing team members this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topPerformers.map((performer, index) => (
                    <div key={performer.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#026937] text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{performer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {performer.jobs} jobs • {formatPercentage(performer.efficiency)} efficiency
                          </div>
                        </div>
                      </div>
                      <div className="font-medium">{formatCurrency(performer.revenue)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed performance analysis and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Performance charts and detailed metrics will be displayed here.</p>
                  <p className="text-sm mt-2">This feature is coming soon.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
                <DollarSign className="h-4 w-4 text-[#026937]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(analyticsData.commissionStats.totalCommissions)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Booking Accuracy</CardTitle>
                <Target className="h-4 w-4 text-[#ea7200]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(analyticsData.commissionStats.avgAccuracy)}</div>
                <p className="text-xs text-muted-foreground">Average accuracy</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Entries</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.commissionStats.pendingEntries}</div>
                <p className="text-xs text-muted-foreground">Awaiting completion</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matched Entries</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.commissionStats.matchedEntries}</div>
                <p className="text-xs text-muted-foreground">Successfully matched</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Commission Analysis</CardTitle>
              <CardDescription>Detailed commission tracking and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Commission analysis charts and detailed breakdowns will be displayed here.</p>
                  <p className="text-sm mt-2">This feature is coming soon.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>Historical trends and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Trend analysis and forecasting charts will be displayed here.</p>
                  <p className="text-sm mt-2">This feature is coming soon.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert for data freshness */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-center gap-3 pt-6">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-blue-800 font-medium">Data Freshness</p>
            <p className="text-blue-700 text-sm">
              Analytics data is updated every hour. Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}