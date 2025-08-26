'use client';

import { useState } from 'react';
import { format, subDays, subMonths, startOfMonth } from 'date-fns';
import {
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface CommissionEntry {
  id: string;
  jobId: string;
  clientName: string;
  jobType: string;
  targetDate: Date;
  estimatedRevenue: number;
  actualRevenue: number | null;
  commissionAmount: number | null;
  status: string;
  createdAt: Date;
  sales: {
    id: string;
    fullName: string;
    email: string;
  };
  matchedLog?: {
    id: string;
    logDate: Date;
    captain: {
      fullName: string;
    };
  } | null;
}

interface CommissionAnalyticsProps {
  entries: CommissionEntry[];
}

export function CommissionAnalytics({ entries }: CommissionAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30days');

  // Filter entries based on time range
  const getFilteredEntries = () => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case '90days':
        startDate = subDays(now, 90);
        break;
      case 'thisMonth':
        startDate = startOfMonth(now);
        break;
      case 'lastMonth':
        startDate = startOfMonth(subMonths(now, 1));
        break;
      default:
        startDate = subDays(now, 30);
    }

    return entries.filter((entry) => new Date(entry.createdAt) >= startDate);
  };

  const filteredEntries = getFilteredEntries();

  // Calculate analytics
  const totalEntries = filteredEntries.length;
  const pendingEntries = filteredEntries.filter((e) => e.status === 'pending');
  const matchedEntries = filteredEntries.filter((e) => e.status === 'matched');
  const approvedEntries = filteredEntries.filter(
    (e) => e.status === 'approved'
  );
  const rejectedEntries = filteredEntries.filter(
    (e) => e.status === 'rejected'
  );

  // Conversion rates
  const conversionRate =
    totalEntries > 0 ? (matchedEntries.length / totalEntries) * 100 : 0;
  const approvalRate =
    matchedEntries.length > 0
      ? (approvedEntries.length / matchedEntries.length) * 100
      : 0;

  // Booking accuracy
  const entriesWithAccuracy = filteredEntries.filter(
    (e) => e.actualRevenue !== null && e.estimatedRevenue > 0
  );
  const avgBookingAccuracy =
    entriesWithAccuracy.length > 0
      ? entriesWithAccuracy.reduce((sum, entry) => {
          const accuracy = Math.min(
            (Math.min(entry.estimatedRevenue, entry.actualRevenue!) /
              Math.max(entry.estimatedRevenue, entry.actualRevenue!)) *
              100,
            100
          );
          return sum + accuracy;
        }, 0) / entriesWithAccuracy.length
      : 0;

  // Revenue metrics
  const totalEstimatedRevenue = filteredEntries.reduce(
    (sum, e) => sum + e.estimatedRevenue,
    0
  );
  const totalActualRevenue = filteredEntries.reduce(
    (sum, e) => sum + (e.actualRevenue || 0),
    0
  );
  const totalCommissionEarned = filteredEntries.reduce(
    (sum, e) => sum + (e.commissionAmount || 0),
    0
  );

  // Trends data for charts
  const getTrendsData = () => {
    const days = 30;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayEntries = filteredEntries.filter(
        (e) =>
          format(new Date(e.createdAt), 'yyyy-MM-dd') ===
          format(date, 'yyyy-MM-dd')
      );

      data.push({
        date: format(date, 'MMM dd'),
        entries: dayEntries.length,
        matched: dayEntries.filter((e) => e.status === 'matched').length,
        revenue: dayEntries.reduce((sum, e) => sum + (e.actualRevenue || 0), 0),
        commission: dayEntries.reduce(
          (sum, e) => sum + (e.commissionAmount || 0),
          0
        ),
      });
    }

    return data;
  };

  const trendsData = getTrendsData();

  // Status distribution for pie chart
  const statusData = [
    { name: 'Pending', value: pendingEntries.length, color: '#f59e0b' },
    { name: 'Matched', value: matchedEntries.length, color: '#026937' },
    { name: 'Approved', value: approvedEntries.length, color: '#10b981' },
    { name: 'Rejected', value: rejectedEntries.length, color: '#ef4444' },
  ].filter((item) => item.value > 0);

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
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Commission Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Performance metrics and trends for commission tracking
          </p>
        </div>
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
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-white via-white to-blue-50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:border-l-blue-600 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-all duration-300 group-hover:font-semibold">
              Conversion Rate
            </CardTitle>
            <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Target className="h-4 w-4 text-blue-500 group-hover:text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-600 transition-all duration-500 group-hover:scale-110 group-hover:text-blue-700">
              {formatPercentage(conversionRate)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress
                value={conversionRate}
                className="flex-1 transition-all duration-300 group-hover:scale-105"
              />
              <span className="text-xs text-muted-foreground group-hover:text-blue-600/70 transition-colors duration-300">
                {matchedEntries.length}/{totalEntries}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-blue-600/70 transition-all duration-300 group-hover:translate-x-1">
              Bookings matched to completed jobs
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-hunks-green bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.02] hover:border-l-hunks-green/90 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-green transition-all duration-300 group-hover:font-semibold">
              Approval Rate
            </CardTitle>
            <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <TrendingUp className="h-4 w-4 text-hunks-green group-hover:text-hunks-green/90" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-hunks-green transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-green/90">
              {formatPercentage(approvalRate)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress
                value={approvalRate}
                className="flex-1 transition-all duration-300 group-hover:scale-105"
              />
              <span className="text-xs text-muted-foreground group-hover:text-hunks-green/70 transition-colors duration-300">
                {approvedEntries.length}/{matchedEntries.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-hunks-green/70 transition-all duration-300 group-hover:translate-x-1">
              Matched entries approved
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-hunks-orange bg-gradient-to-br from-white via-white to-hunks-orange/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-orange/20 hover:scale-[1.02] hover:border-l-hunks-orange/90 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-orange transition-all duration-300 group-hover:font-semibold">
              Booking Accuracy
            </CardTitle>
            <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Activity className="h-4 w-4 text-hunks-orange group-hover:text-hunks-orange/90" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-hunks-orange transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-orange/90">
              {formatPercentage(avgBookingAccuracy)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress
                value={avgBookingAccuracy}
                className="flex-1 transition-all duration-300 group-hover:scale-105"
              />
              <Badge
                variant="outline"
                className="text-xs transition-all duration-300 group-hover:border-hunks-orange group-hover:text-hunks-orange group-hover:scale-105"
              >
                {entriesWithAccuracy.length} jobs
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-hunks-orange/70 transition-all duration-300 group-hover:translate-x-1">
              Average estimation accuracy
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-white via-white to-purple-50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] hover:border-l-purple-600 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-all duration-300 group-hover:font-semibold">
              Commission Earned
            </CardTitle>
            <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <DollarSign className="h-4 w-4 text-purple-500 group-hover:text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-purple-600 transition-all duration-500 group-hover:scale-110 group-hover:text-purple-700">
              {formatCurrency(totalCommissionEarned)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground group-hover:text-purple-600/70 transition-colors duration-300">
                From {formatCurrency(totalActualRevenue)} revenue
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-purple-600/70 transition-all duration-300 group-hover:translate-x-1">
              Total commission this period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.01] group backdrop-blur-sm border-hunks-green/20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 group-hover:text-hunks-green transition-colors duration-300">
              <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
                <BarChart3 className="h-5 w-5 text-hunks-green" />
              </div>
              Commission Trends
            </CardTitle>
            <CardDescription className="group-hover:text-hunks-green/70 transition-colors duration-300">
              Daily commission entries and matches over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'commission'
                      ? formatCurrency(Number(value))
                      : value,
                    name === 'entries'
                      ? 'Entries'
                      : name === 'matched'
                        ? 'Matched'
                        : name === 'commission'
                          ? 'Commission'
                          : name,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="entries"
                  stackId="1"
                  stroke="#026937"
                  fill="#026937"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="matched"
                  stackId="1"
                  stroke="#ea7200"
                  fill="#ea7200"
                  fillOpacity={0.6}
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
                <PieChart className="h-5 w-5 text-hunks-orange" />
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
                <RechartsPieChart>
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
                </RechartsPieChart>
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

      {/* Revenue vs Commission Chart */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-purple-50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.01] group backdrop-blur-sm border-purple-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 group-hover:text-purple-600 transition-colors duration-300">
            <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            Revenue vs Commission Trends
          </CardTitle>
          <CardDescription className="group-hover:text-purple-600/70 transition-colors duration-300">
            Daily revenue and commission earnings comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === 'revenue' ? 'Revenue' : 'Commission',
                ]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#026937"
                strokeWidth={3}
                dot={{ fill: '#026937', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#026937', strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="commission"
                stroke="#ea7200"
                strokeWidth={3}
                dot={{ fill: '#ea7200', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ea7200', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-hunks-green/10 via-white to-hunks-orange/10 border-hunks-green/30 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.01] group backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-hunks-green/5 via-transparent to-hunks-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
        <CardHeader className="relative">
          <CardTitle className="text-hunks-green group-hover:text-hunks-green/90 transition-colors duration-300 group-hover:font-bold">
            Performance Summary
          </CardTitle>
          <CardDescription className="group-hover:text-hunks-green/70 transition-colors duration-300">
            Key insights from your commission tracking performance
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-2xl font-bold text-hunks-green transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-hunks-green/90">
                {formatCurrency(totalEstimatedRevenue)}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-hunks-green/70 transition-colors duration-300">
                Total Estimated
              </div>
            </div>
            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-2xl font-bold text-hunks-orange transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-hunks-orange/90">
                {formatCurrency(totalActualRevenue)}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-hunks-orange/70 transition-colors duration-300">
                Total Actual
              </div>
            </div>
            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-2xl font-bold text-purple-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-purple-700">
                {totalActualRevenue > 0
                  ? formatPercentage(
                      (totalCommissionEarned / totalActualRevenue) * 100
                    )
                  : '0.0%'}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-purple-600/70 transition-colors duration-300">
                Avg Commission Rate
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
