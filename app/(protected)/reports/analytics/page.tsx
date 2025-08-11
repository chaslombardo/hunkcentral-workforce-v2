import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandButton } from '@/components/brand/brand-button';
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
import { getAnalyticsData, getPerformanceMetrics, getTrendAnalysis } from '@/lib/actions/analytics';

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

  // Get real analytics data from database
  const analyticsResult = await getAnalyticsData();
  
  if (!analyticsResult.success) {
    redirect('/dashboard');
  }

  const analyticsData = analyticsResult.data!;

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
        <BrandButton variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </BrandButton>
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
          <PerformanceTab />
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          <CommissionTab commissionStats={analyticsData.commissionStats} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendsTab />
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

// Performance Tab Component
async function PerformanceTab() {
  const performanceResult = await getPerformanceMetrics();
  
  if (!performanceResult.success || !performanceResult.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Detailed performance analysis and trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Unable to load performance data</p>
              <p className="text-sm mt-2">{performanceResult.error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { monthlyTrends, departmentPerformance } = performanceResult.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance Trends</CardTitle>
          <CardDescription>Revenue, jobs, and efficiency over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyTrends.map((trend, index) => (
              <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="font-medium">{trend.month}</div>
                  <Badge variant="outline">{trend.jobs} jobs</Badge>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="font-medium">${trend.revenue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                  <div>
                    <div className="font-medium">{trend.efficiency.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Labor Efficiency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Current month performance by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departmentPerformance.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <Badge className="capitalize">{dept.department}</Badge>
                  <div className="text-sm text-muted-foreground">{dept.hours} hours</div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <div className="font-medium">${dept.revenue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                  <div>
                    <div className="font-medium">{dept.efficiency.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Efficiency</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Commission Tab Component
function CommissionTab({ commissionStats }: { commissionStats: any }) {
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-[#026937]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(commissionStats.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Booking Accuracy</CardTitle>
            <Target className="h-4 w-4 text-[#ea7200]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(commissionStats.avgAccuracy)}</div>
            <p className="text-xs text-muted-foreground">Average accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Entries</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissionStats.pendingEntries}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matched Entries</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissionStats.matchedEntries}</div>
            <p className="text-xs text-muted-foreground">Successfully matched</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Analysis</CardTitle>
          <CardDescription>Commission performance and booking accuracy trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Commission Earned</span>
                  <DollarSign className="h-4 w-4 text-[#026937]" />
                </div>
                <div className="text-2xl font-bold">{formatCurrency(commissionStats.totalCommissions)}</div>
                <div className="text-sm text-muted-foreground">
                  From {commissionStats.matchedEntries} matched entries
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Booking Accuracy Rate</span>
                  <Target className="h-4 w-4 text-[#ea7200]" />
                </div>
                <div className="text-2xl font-bold">{formatPercentage(commissionStats.avgAccuracy)}</div>
                <div className="text-sm text-muted-foreground">
                  Estimates within 20% of actual revenue
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Commission Pipeline</span>
              </div>
              <div className="text-sm text-blue-700">
                {commissionStats.pendingEntries} commission entries are pending completion. 
                These will be matched automatically when corresponding logs are approved.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Trends Tab Component
async function TrendsTab() {
  const trendsResult = await getTrendAnalysis();
  
  if (!trendsResult.success || !trendsResult.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>Historical trends and forecasting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Unable to load trend data</p>
              <p className="text-sm mt-2">{trendsResult.error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { revenueGrowth, seasonalPatterns } = trendsResult.data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Growth Trend</CardTitle>
          <CardDescription>Month-over-month revenue growth over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueGrowth.slice(-6).map((period) => (
              <div key={period.period} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="font-medium">{period.period}</div>
                  <div className="flex items-center gap-1">
                    {period.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : period.growth < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : null}
                    <span className={`text-sm ${
                      period.growth > 0 ? 'text-green-600' : 
                      period.growth < 0 ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {period.growth > 0 ? '+' : ''}{period.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${period.revenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seasonal Patterns</CardTitle>
          <CardDescription>Average monthly performance patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasonalPatterns.map((pattern) => (
              <div key={pattern.month} className="p-4 border rounded-lg">
                <div className="font-medium mb-2">{pattern.month}</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Revenue</span>
                    <span className="text-sm font-medium">${pattern.avgRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Jobs</span>
                    <span className="text-sm font-medium">{Math.round(pattern.avgJobs)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}