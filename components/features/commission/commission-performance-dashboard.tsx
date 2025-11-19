'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  format as formatDate,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  TrendingUp,
  DollarSign,
  Target,
  BarChart3,
  Download,
  RefreshCw,
  Award,
  Activity,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BrandLoader } from '@/components/ui/brand-loader';

import { BrandButton } from '@/components/brand/brand-button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { toast } from 'sonner';
import {
  exportCommissionData,
  getCommissionAnalyticsData,
} from '@/lib/actions/commission-export';

interface CommissionPerformanceDashboardProps {
  currentUserId?: string;
  userRole?: string[];
}

interface AnalyticsData {
  totalEntries: number;
  pendingEntries: number;
  matchedEntries: number;
  approvedEntries: number;
  rejectedEntries: number;
  totalEstimatedRevenue: number;
  totalActualRevenue: number;
  totalCommissionEarned: number;
  conversionRate: number;
  avgBookingAccuracy: number;
  topPerformers: Array<{
    salesId: string;
    name: string;
    email: string;
    totalCommission: number;
    totalRevenue: number;
    jobCount: number;
    avgCommissionPerJob: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    entries: number;
    commission: number;
    revenue: number;
    matched: number;
  }>;
}

export function CommissionPerformanceDashboard({
  userRole = [],
}: CommissionPerformanceDashboardProps) {
  const [timeRange, setTimeRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );

  // Check if user can view all data or just their own
  const canViewAllData =
    userRole.includes('admin') || userRole.includes('manager');

  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (timeRange) {
      case '7days':
        return { start: subDays(now, 7), end: now };
      case '30days':
        return { start: subDays(now, 30), end: now };
      case '90days':
        return { start: subDays(now, 90), end: now };
      case 'thisMonth':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'lastMonth':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1)),
        };
      default:
        return { start: subDays(now, 30), end: now };
    }
  }, [timeRange]);

  // Load analytics data
  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateRange = getDateRange();
      const result = await getCommissionAnalyticsData(dateRange);

      if (result.success) {
        setAnalyticsData(result.data!);
      } else {
        toast.error('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Analytics load error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, loadAnalyticsData]);

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const dateRange = getDateRange();
      const result = await exportCommissionData({
        format,
        dateRange,
        includeCalculations: true,
        includeProjections: true,
      });

      if (result.success) {
        // Create and download file
        const filename = `commission-report-${formatDate(new Date(), 'yyyy-MM-dd')}.${format}`;
        console.warn('Generated filename:', filename);
        // Implementation would depend on the specific export format
        toast.success(`Commission report exported successfully`);
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
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

  if (isLoading || !analyticsData) {
    return (
      <BrandLoader
        label="Loading commission analytics..."
        fullScreen
        size="lg"
      />
    );
  }

  // Status distribution for pie chart
  const statusData = [
    { name: 'Pending', value: analyticsData.pendingEntries, color: '#f59e0b' },
    { name: 'Matched', value: analyticsData.matchedEntries, color: '#026937' },
    {
      name: 'Approved',
      value: analyticsData.approvedEntries,
      color: '#10b981',
    },
    {
      name: 'Rejected',
      value: analyticsData.rejectedEntries,
      color: '#ef4444',
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-hunks-green">
            Commission Performance Dashboard
          </h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for commission tracking
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="thisMonth">This month</SelectItem>
              <SelectItem value="lastMonth">Last month</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="transition-all duration-300 hover:scale-105"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <BrandButton
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={isExporting}
            className="transition-all duration-300 hover:scale-105"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </BrandButton>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-hunks-green bg-gradient-to-br from-background via-background to-hunks-green/5 dark:from-muted dark:via-muted transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.02] hover:border-l-hunks-green/90 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-green transition-all duration-300 group-hover:font-semibold">
              Total Commission Earned
            </CardTitle>
            <div className="p-2 rounded-full bg-hunks-green/10 group-hover:bg-hunks-green/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <DollarSign className="h-4 w-4 text-hunks-green" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-hunks-green tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-green/90">
              {formatCurrency(analyticsData.totalCommissionEarned)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress
                value={Math.min(
                  (analyticsData.totalCommissionEarned /
                    (analyticsData.totalEstimatedRevenue * 0.05)) *
                    100,
                  100
                )}
                className="flex-1 transition-all duration-300 group-hover:scale-105"
              />
              <span className="text-xs text-muted-foreground group-hover:text-hunks-green/70 transition-colors duration-300">
                {analyticsData.approvedEntries} jobs
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-hunks-green/70 transition-all duration-300 group-hover:translate-x-1">
              From {formatCurrency(analyticsData.totalActualRevenue)} revenue
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-hunks-orange bg-gradient-to-br from-background via-background to-hunks-orange/5 dark:from-muted dark:via-muted transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-orange/20 hover:scale-[1.02] hover:border-l-hunks-orange/90 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-orange transition-all duration-300 group-hover:font-semibold">
              Conversion Rate
            </CardTitle>
            <div className="p-2 rounded-full bg-hunks-orange/10 group-hover:bg-hunks-orange/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Target className="h-4 w-4 text-hunks-orange" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-hunks-orange tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-orange/90">
              {formatPercentage(analyticsData.conversionRate)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress
                value={analyticsData.conversionRate}
                className="flex-1 transition-all duration-300 group-hover:scale-105"
              />
              <span className="text-xs text-muted-foreground group-hover:text-hunks-orange/70 transition-colors duration-300">
                {analyticsData.matchedEntries + analyticsData.approvedEntries}/
                {analyticsData.totalEntries}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-hunks-orange/70 transition-all duration-300 group-hover:translate-x-1">
              Bookings converted to jobs
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-background via-background to-blue-50/40 dark:from-muted dark:via-muted transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:border-l-blue-600 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-all duration-300 group-hover:font-semibold">
              Booking Accuracy
            </CardTitle>
            <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-600 tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-blue-700">
              {formatPercentage(analyticsData.avgBookingAccuracy)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress
                value={analyticsData.avgBookingAccuracy}
                className="flex-1 transition-all duration-300 group-hover:scale-105"
              />
              <Badge
                variant="outline"
                className="text-xs transition-all duration-300 group-hover:border-blue-500 group-hover:text-blue-600"
              >
                {analyticsData.avgBookingAccuracy > 85
                  ? 'Excellent'
                  : analyticsData.avgBookingAccuracy > 70
                    ? 'Good'
                    : 'Needs Improvement'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-blue-600/70 transition-all duration-300 group-hover:translate-x-1">
              Average estimation accuracy
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-background via-background to-purple-50/40 dark:from-muted dark:via-muted transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] hover:border-l-purple-600 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-all duration-300 group-hover:font-semibold">
              Pipeline Value
            </CardTitle>
            <div className="p-2 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-purple-600 tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-purple-700">
              {formatCurrency(analyticsData.totalEstimatedRevenue)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground group-hover:text-purple-600/70 transition-colors duration-300">
                {analyticsData.pendingEntries} pending entries
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-purple-600/70 transition-all duration-300 group-hover:translate-x-1">
              Estimated total pipeline value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.01] group backdrop-blur-sm border-hunks-green/20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 group-hover:text-hunks-green transition-colors duration-300">
              <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                <TrendingUp className="h-5 w-5 text-hunks-green" />
              </div>
              Commission Trends
            </CardTitle>
            <CardDescription className="group-hover:text-hunks-green/70 transition-colors duration-300">
              Monthly commission earnings and conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.monthlyTrends}>
                <defs>
                  <linearGradient
                    id="commissionGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#026937" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#026937" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#ea7200" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ea7200" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(Number(value)),
                    name === 'commission' ? 'Commission' : 'Revenue',
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="#026937"
                  fillOpacity={1}
                  fill="url(#commissionGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ea7200"
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-hunks-orange/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-orange/20 hover:scale-[1.01] group backdrop-blur-sm border-hunks-orange/20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 group-hover:text-hunks-orange transition-colors duration-300">
              <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                <BarChart3 className="h-5 w-5 text-hunks-orange" />
              </div>
              Status Distribution
            </CardTitle>
            <CardDescription className="group-hover:text-hunks-orange/70 transition-colors duration-300">
              Current status breakdown of commission entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {item.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      {canViewAllData && analyticsData.topPerformers.length > 0 && (
        <Card className="relative overflow-hidden bg-gradient-to-r from-hunks-green/10 via-white to-hunks-orange/10 border-hunks-green/30 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.01] group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-hunks-green/5 via-transparent to-hunks-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-hunks-green group-hover:text-hunks-green/90 transition-colors duration-300 group-hover:font-bold">
              <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                <Award className="h-5 w-5 text-hunks-green" />
              </div>
              Top Commission Performers
            </CardTitle>
            <CardDescription className="group-hover:text-hunks-green/70 transition-colors duration-300">
              Highest earning sales consultants this period
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="space-y-4">
              {analyticsData.topPerformers
                .slice(0, 5)
                .map((performer, index) => (
                  <div
                    key={performer.salesId}
                    className="flex items-center justify-between p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-hunks-green to-hunks-orange text-white text-sm font-bold transition-all duration-300 group-hover/item:scale-110">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-hunks-green transition-all duration-300 group-hover/item:text-hunks-green/90">
                          {performer.name}
                        </div>
                        <div className="text-sm text-muted-foreground group-hover/item:text-hunks-green/70 transition-colors duration-300">
                          {performer.jobCount} jobs •{' '}
                          {formatCurrency(performer.avgCommissionPerJob)} avg
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-hunks-orange transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-hunks-orange/90">
                        {formatCurrency(performer.totalCommission)}
                      </div>
                      <div className="text-sm text-muted-foreground group-hover/item:text-hunks-orange/70 transition-colors duration-300">
                        {formatCurrency(performer.totalRevenue)} revenue
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-purple-50 via-white to-blue-50 border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.01] group backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 via-transparent to-blue-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 text-purple-600 group-hover:text-purple-700 transition-colors duration-300 group-hover:font-bold">
            <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Zap className="h-5 w-5 text-purple-500" />
            </div>
            Performance Insights
          </CardTitle>
          <CardDescription className="group-hover:text-purple-600/70 transition-colors duration-300">
            Key insights and recommendations based on your commission data
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-2xl font-bold text-hunks-green transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-hunks-green/90">
                {formatCurrency(
                  analyticsData.totalActualRevenue -
                    analyticsData.totalEstimatedRevenue
                )}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-hunks-green/70 transition-colors duration-300">
                Revenue Variance
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {analyticsData.totalActualRevenue >
                analyticsData.totalEstimatedRevenue
                  ? 'Above'
                  : 'Below'}{' '}
                estimates
              </div>
            </div>

            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-2xl font-bold text-hunks-orange transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-hunks-orange/90">
                {analyticsData.totalEstimatedRevenue > 0
                  ? formatPercentage(
                      (analyticsData.totalCommissionEarned /
                        analyticsData.totalActualRevenue) *
                        100
                    )
                  : '0.0%'}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-hunks-orange/70 transition-colors duration-300">
                Effective Commission Rate
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Actual commission percentage
              </div>
            </div>

            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-2xl font-bold text-purple-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-purple-700">
                {analyticsData.totalEntries > 0
                  ? Math.round(
                      analyticsData.totalActualRevenue /
                        (analyticsData.matchedEntries +
                          analyticsData.approvedEntries || 1)
                    )
                  : 0}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-purple-600/70 transition-colors duration-300">
                Avg Job Value
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Per completed job
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
