'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  TrendingUp,
  Shield,
  Download,
  RefreshCw,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { BrandLoading } from '@/components/brand/brand-loading';

interface SystemHealthMetrics {
  totalUsers: number;
  activeUsers: number;
  totalPayrollEntries: number;
  pendingApprovals: number;
  systemUptime: number;
  errorRate: number;
  avgResponseTime: number;
  dataIntegrityScore: number;
}

interface BusinessAnalytics {
  totalRevenue: number;
  totalLaborCost: number;
  avgLaborPercentage: number;
  totalTips: number;
  totalCommissions: number;
  totalBonuses: number;
  topPerformers: Array<{
    id: string;
    name: string;
    metric: string;
    value: number;
  }>;
}

export function AdminReportsDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealthMetrics | null>(
    null
  );
  const [businessAnalytics, setBusinessAnalytics] =
    useState<BusinessAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Load admin dashboard data
  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API calls - replace with actual API endpoints
        const [healthResponse, analyticsResponse] = await Promise.all([
          fetch(`/api/admin/system-health?range=${selectedTimeRange}`),
          fetch(`/api/admin/business-analytics?range=${selectedTimeRange}`),
        ]);

        if (healthResponse.ok && analyticsResponse.ok) {
          const healthData = await healthResponse.json();
          const analyticsData = await analyticsResponse.json();
          setSystemHealth(healthData);
          setBusinessAnalytics(analyticsData);
        } else {
          throw new Error('Failed to fetch admin dashboard data');
        }
      } catch (error) {
        console.error('Failed to load admin data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load admin data');
        // Don't set fallback data - let the error state show
      } finally {
        setIsLoading(false);
      }
    };

    loadAdminData();
  }, [selectedTimeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <BrandLoading variant="spinner" size="lg" />
                <div className="text-center">
                  <div className="text-lg font-medium">
                    Loading Admin Dashboard
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Gathering system metrics and analytics
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="text-center">
                  <div className="text-lg font-medium text-red-600">
                    Error Loading Admin Dashboard
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {error}
                  </div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    className="mt-4"
                    variant="outline"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Enhanced Header Section - Following dashboard-01 pattern */}
          <div className="px-4 lg:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Admin Reports & Analytics
                </h1>
                <p className="text-muted-foreground">
                  System health monitoring, business analytics, and
                  administrative insights
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Time Range Selector */}
                <Select
                  value={selectedTimeRange}
                  onValueChange={setSelectedTimeRange}
                >
                  <SelectTrigger className="w-full sm:w-[160px] transition-all duration-200 hover:bg-accent/50">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                    />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs for different admin views - Following dashboard-01 pattern */}
          <Tabs
            defaultValue="system-health"
            className="w-full flex-col justify-start gap-6"
          >
            <div className="flex items-center justify-between px-4 lg:px-6">
              <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
                <TabsTrigger
                  value="system-health"
                  className="transition-all duration-200"
                >
                  System Health
                </TabsTrigger>
                <TabsTrigger
                  value="business-analytics"
                  className="transition-all duration-200"
                >
                  Business Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="user-activity"
                  className="transition-all duration-200"
                >
                  User Activity
                </TabsTrigger>
                <TabsTrigger
                  value="compliance"
                  className="transition-all duration-200"
                >
                  Compliance
                </TabsTrigger>
              </TabsList>
            </div>

            {/* System Health Tab */}
            <TabsContent
              value="system-health"
              className="flex flex-col gap-4 overflow-auto"
            >
              {/* System Health Cards - Using dashboard-01 SectionCards pattern */}
              {systemHealth && (
                <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                  {/* System Uptime */}
                  <Card className="@container/card group hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02]">
                    <CardHeader>
                      <CardDescription>System Uptime</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-colors duration-200 group-hover:text-primary">
                        {systemHealth.systemUptime}%
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant="outline"
                          className="transition-all duration-200 group-hover:bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          Healthy
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        Excellent system reliability
                      </div>
                      <div className="text-muted-foreground">
                        Last 30 days performance
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Active Users */}
                  <Card className="@container/card group hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02]">
                    <CardHeader>
                      <CardDescription>Active Users</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-colors duration-200 group-hover:text-primary">
                        {systemHealth.activeUsers}
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant="outline"
                          className="transition-all duration-200 group-hover:bg-primary/10"
                        >
                          <Users className="h-3 w-3 mr-1" />
                          of {systemHealth.totalUsers}
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        High user engagement
                      </div>
                      <div className="text-muted-foreground">
                        {Math.round(
                          (systemHealth.activeUsers / systemHealth.totalUsers) *
                            100
                        )}
                        % active rate
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Pending Approvals */}
                  <Card className="@container/card group hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02]">
                    <CardHeader>
                      <CardDescription>Pending Approvals</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-colors duration-200 group-hover:text-primary">
                        {systemHealth.pendingApprovals}
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant="outline"
                          className={`transition-all duration-200 ${
                            systemHealth.pendingApprovals > 50
                              ? 'group-hover:bg-red-50 text-red-600'
                              : 'group-hover:bg-yellow-50 text-yellow-600'
                          }`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {systemHealth.pendingApprovals > 50
                            ? 'High'
                            : 'Normal'}
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        Requires attention
                      </div>
                      <div className="text-muted-foreground">
                        Awaiting manager review
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Data Integrity */}
                  <Card className="@container/card group hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02]">
                    <CardHeader>
                      <CardDescription>Data Integrity</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-colors duration-200 group-hover:text-primary">
                        {systemHealth.dataIntegrityScore}%
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant="outline"
                          className="transition-all duration-200 group-hover:bg-green-50"
                        >
                          <Shield className="h-3 w-3 mr-1 text-green-600" />
                          Excellent
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        High data quality
                      </div>
                      <div className="text-muted-foreground">
                        Validation score
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Business Analytics Tab */}
            <TabsContent
              value="business-analytics"
              className="flex flex-col gap-4 overflow-auto"
            >
              {/* Business Analytics Cards */}
              {businessAnalytics && (
                <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                  {/* Total Revenue */}
                  <Card className="@container/card group hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02]">
                    <CardHeader>
                      <CardDescription>Total Revenue</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-colors duration-200 group-hover:text-primary">
                        {formatCurrency(businessAnalytics.totalRevenue)}
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant="outline"
                          className="transition-all duration-200 group-hover:bg-green-50"
                        >
                          <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                          +12.5%
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        Strong performance
                      </div>
                      <div className="text-muted-foreground">
                        Across all departments
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Labor Cost Efficiency */}
                  <Card className="@container/card group hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02]">
                    <CardHeader>
                      <CardDescription>Avg Labor Cost</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-colors duration-200 group-hover:text-primary">
                        {businessAnalytics.avgLaborPercentage}%
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant="outline"
                          className="transition-all duration-200 group-hover:bg-green-50"
                        >
                          <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                          On Target
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        Efficient operations
                      </div>
                      <div className="text-muted-foreground">
                        Within target range
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Total Tips */}
                  <Card className="@container/card group hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02]">
                    <CardHeader>
                      <CardDescription>Total Tips</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-colors duration-200 group-hover:text-primary">
                        {formatCurrency(businessAnalytics.totalTips)}
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant="outline"
                          className="transition-all duration-200 group-hover:bg-primary/10"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Customer Satisfaction
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        Excellent service
                      </div>
                      <div className="text-muted-foreground">
                        High customer appreciation
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Performance Bonuses */}
                  <Card className="@container/card group hover:shadow-lg transition-all duration-300 ease-in-out hover:scale-[1.02]">
                    <CardHeader>
                      <CardDescription>Performance Bonuses</CardDescription>
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl transition-colors duration-200 group-hover:text-primary">
                        {formatCurrency(businessAnalytics.totalBonuses)}
                      </CardTitle>
                      <CardAction>
                        <Badge
                          variant="outline"
                          className="transition-all duration-200 group-hover:bg-primary/10"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Efficiency Rewards
                        </Badge>
                      </CardAction>
                    </CardHeader>
                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                      <div className="line-clamp-1 flex gap-2 font-medium">
                        Goal achievement
                      </div>
                      <div className="text-muted-foreground">
                        Labor efficiency bonuses
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* User Activity Tab */}
            <TabsContent
              value="user-activity"
              className="flex flex-col px-4 lg:px-6"
            >
              <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg font-medium">
                    User Activity Analytics
                  </div>
                  <div className="text-sm">
                    Login patterns, feature usage, and engagement metrics
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Compliance Tab */}
            <TabsContent
              value="compliance"
              className="flex flex-col px-4 lg:px-6"
            >
              <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg font-medium">
                    Compliance Dashboard
                  </div>
                  <div className="text-sm">
                    Audit trails, data retention, and regulatory compliance
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
