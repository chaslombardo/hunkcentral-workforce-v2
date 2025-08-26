'use client';

import { useState, useMemo } from 'react';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
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
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
    commissionRate?: number;
  };
}

interface CommissionProjectionsProps {
  entries: CommissionEntry[];
  currentUserId?: string;
}

export function CommissionProjections({
  entries,
  currentUserId,
}: CommissionProjectionsProps) {
  const [projectionPeriod, setProjectionPeriod] = useState('thisMonth');
  const [confidenceLevel, setConfidenceLevel] = useState('medium');

  // Filter entries for current user if specified
  const userEntries = currentUserId
    ? entries.filter((entry) => entry.sales.id === currentUserId)
    : entries;

  // Calculate historical performance metrics
  const historicalMetrics = useMemo(() => {
    const completedEntries = userEntries.filter(
      (entry) => entry.status === 'approved' && entry.actualRevenue !== null
    );

    if (completedEntries.length === 0) {
      return {
        avgConversionRate: 0.7, // Default assumption
        avgAccuracy: 0.85, // Default assumption
        avgCommissionRate: 0.05, // Default 5%
        avgTimeToClosure: 14, // Default 14 days
      };
    }

    const totalEntries = userEntries.length;
    const conversionRate = completedEntries.length / totalEntries;

    const accuracySum = completedEntries.reduce((sum, entry) => {
      const accuracy =
        Math.min(entry.estimatedRevenue, entry.actualRevenue!) /
        Math.max(entry.estimatedRevenue, entry.actualRevenue!);
      return sum + accuracy;
    }, 0);
    const avgAccuracy = accuracySum / completedEntries.length;

    const commissionSum = completedEntries.reduce((sum, entry) => {
      const rate = entry.commissionAmount! / entry.actualRevenue!;
      return sum + rate;
    }, 0);
    const avgCommissionRate = commissionSum / completedEntries.length;

    // Calculate average time to closure
    const closureTimes = completedEntries.map((entry) => {
      const created = new Date(entry.createdAt);
      const target = new Date(entry.targetDate);
      return (
        Math.abs(target.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      );
    });
    const avgTimeToClosure =
      closureTimes.reduce((sum, time) => sum + time, 0) / closureTimes.length;

    return {
      avgConversionRate: conversionRate,
      avgAccuracy,
      avgCommissionRate,
      avgTimeToClosure,
    };
  }, [userEntries]);

  // Get projection period dates
  const getProjectionPeriod = () => {
    const now = new Date();
    switch (projectionPeriod) {
      case 'thisWeek':
        return {
          start: now,
          end: addWeeks(now, 1),
          label: 'This Week',
        };
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month',
        };
      case 'nextMonth':
        return {
          start: startOfMonth(addMonths(now, 1)),
          end: endOfMonth(addMonths(now, 1)),
          label: 'Next Month',
        };
      case 'next3Months':
        return {
          start: now,
          end: addMonths(now, 3),
          label: 'Next 3 Months',
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
          label: 'This Month',
        };
    }
  };

  const period = getProjectionPeriod();

  // Calculate projections
  const projections = useMemo(() => {
    const pendingEntries = userEntries.filter(
      (entry) =>
        entry.status === 'pending' &&
        new Date(entry.targetDate) >= period.start &&
        new Date(entry.targetDate) <= period.end
    );

    const matchedEntries = userEntries.filter(
      (entry) =>
        entry.status === 'matched' &&
        new Date(entry.targetDate) >= period.start &&
        new Date(entry.targetDate) <= period.end
    );

    // Confidence multipliers
    const confidenceMultipliers = {
      conservative: 0.7,
      medium: 0.85,
      optimistic: 1.0,
    };

    const multiplier =
      confidenceMultipliers[
        confidenceLevel as keyof typeof confidenceMultipliers
      ];

    // Calculate projected revenue and commission
    const pendingProjectedRevenue = pendingEntries.reduce((sum, entry) => {
      const adjustedRevenue =
        entry.estimatedRevenue * historicalMetrics.avgAccuracy * multiplier;
      return sum + adjustedRevenue * historicalMetrics.avgConversionRate;
    }, 0);

    const matchedProjectedRevenue = matchedEntries.reduce((sum, entry) => {
      const adjustedRevenue =
        entry.estimatedRevenue * historicalMetrics.avgAccuracy * multiplier;
      return sum + adjustedRevenue; // Matched entries have higher probability
    }, 0);

    const totalProjectedRevenue =
      pendingProjectedRevenue + matchedProjectedRevenue;
    const totalProjectedCommission =
      totalProjectedRevenue * historicalMetrics.avgCommissionRate;

    // Calculate current period actuals
    const currentActualRevenue = userEntries
      .filter(
        (entry) =>
          entry.status === 'approved' &&
          entry.actualRevenue !== null &&
          new Date(entry.targetDate) >= period.start &&
          new Date(entry.targetDate) <= period.end
      )
      .reduce((sum, entry) => sum + entry.actualRevenue!, 0);

    const currentActualCommission = userEntries
      .filter(
        (entry) =>
          entry.status === 'approved' &&
          entry.commissionAmount !== null &&
          new Date(entry.targetDate) >= period.start &&
          new Date(entry.targetDate) <= period.end
      )
      .reduce((sum, entry) => sum + entry.commissionAmount!, 0);

    return {
      pendingEntries: pendingEntries.length,
      matchedEntries: matchedEntries.length,
      pendingProjectedRevenue,
      matchedProjectedRevenue,
      totalProjectedRevenue,
      totalProjectedCommission,
      currentActualRevenue,
      currentActualCommission,
      totalProjectedEarnings:
        currentActualCommission + totalProjectedCommission,
      confidenceScore: Math.round(multiplier * 100),
    };
  }, [userEntries, period, historicalMetrics, confidenceLevel]);

  // Generate daily projection chart data
  const chartData = useMemo(() => {
    const days = [];
    const dayCount = Math.ceil(
      (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)
    );

    for (let i = 0; i <= dayCount; i++) {
      const date = addDays(period.start, i);
      const dateStr = format(date, 'MMM dd');

      // Get entries for this date
      const dayEntries = userEntries.filter(
        (entry) => format(new Date(entry.targetDate), 'MMM dd') === dateStr
      );

      const actualRevenue = dayEntries
        .filter(
          (entry) => entry.status === 'approved' && entry.actualRevenue !== null
        )
        .reduce((sum, entry) => sum + entry.actualRevenue!, 0);

      const projectedRevenue = dayEntries
        .filter((entry) => ['pending', 'matched'].includes(entry.status))
        .reduce((sum, entry) => {
          const adjustedRevenue =
            entry.estimatedRevenue * historicalMetrics.avgAccuracy;
          const probability =
            entry.status === 'matched'
              ? 0.9
              : historicalMetrics.avgConversionRate;
          return sum + adjustedRevenue * probability;
        }, 0);

      const actualCommission =
        actualRevenue * historicalMetrics.avgCommissionRate;
      const projectedCommission =
        projectedRevenue * historicalMetrics.avgCommissionRate;

      days.push({
        date: dateStr,
        actualRevenue,
        projectedRevenue,
        actualCommission,
        projectedCommission,
        totalCommission: actualCommission + projectedCommission,
      });
    }

    return days;
  }, [period, userEntries, historicalMetrics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (current: number, projected: number) => {
    if (projected > current * 1.1)
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (projected < current * 0.9)
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">
            Commission Earnings Projections
          </h3>
          <p className="text-sm text-muted-foreground">
            Projected earnings based on historical performance and current
            pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={projectionPeriod} onValueChange={setProjectionPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="nextMonth">Next Month</SelectItem>
              <SelectItem value="next3Months">Next 3 Months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={confidenceLevel} onValueChange={setConfidenceLevel}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conservative">Conservative</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="optimistic">Optimistic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projection Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-hunks-green bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.02] hover:border-l-hunks-green/90 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-green transition-all duration-300 group-hover:font-semibold">
              Current Earnings
            </CardTitle>
            <div className="p-2 rounded-full bg-hunks-green/10 group-hover:bg-hunks-green/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <DollarSign className="h-4 w-4 text-hunks-green" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-hunks-green tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-green/90">
              {formatCurrency(projections.currentActualCommission)}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-hunks-green/70 transition-all duration-300 group-hover:translate-x-1">
              Earned this {period.label.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-hunks-orange bg-gradient-to-br from-white via-white to-hunks-orange/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-orange/20 hover:scale-[1.02] hover:border-l-hunks-orange/90 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-orange transition-all duration-300 group-hover:font-semibold">
              Projected Earnings
            </CardTitle>
            <div className="p-2 rounded-full bg-hunks-orange/10 group-hover:bg-hunks-orange/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <TrendingUp className="h-4 w-4 text-hunks-orange" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-hunks-orange tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-orange/90">
              {formatCurrency(projections.totalProjectedCommission)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {getTrendIcon(
                projections.currentActualCommission,
                projections.totalProjectedCommission
              )}
              <p className="text-xs text-muted-foreground group-hover:text-hunks-orange/70 transition-all duration-300 group-hover:translate-x-1">
                From pipeline
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-white via-white to-purple-50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] hover:border-l-purple-600 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-all duration-300 group-hover:font-semibold">
              Total Projected
            </CardTitle>
            <div className="p-2 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Target className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-purple-600 tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-purple-700">
              {formatCurrency(projections.totalProjectedEarnings)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className="text-xs transition-all duration-300 group-hover:border-purple-500 group-hover:text-purple-600"
              >
                {projections.confidenceScore}% confidence
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-white via-white to-blue-50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:border-l-blue-600 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-all duration-300 group-hover:font-semibold">
              Pipeline Value
            </CardTitle>
            <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-600 tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-blue-700">
              {formatCurrency(projections.totalProjectedRevenue)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground group-hover:text-blue-600/70 transition-colors duration-300">
                {projections.pendingEntries + projections.matchedEntries} jobs
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.01] group backdrop-blur-sm border-hunks-green/20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 group-hover:text-hunks-green transition-colors duration-300">
            <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Calendar className="h-5 w-5 text-hunks-green" />
            </div>
            Commission Earnings Timeline - {period.label}
          </CardTitle>
          <CardDescription className="group-hover:text-hunks-green/70 transition-colors duration-300">
            Daily breakdown of actual and projected commission earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(Number(value)),
                  name === 'actualCommission'
                    ? 'Actual Commission'
                    : name === 'projectedCommission'
                      ? 'Projected Commission'
                      : name === 'totalCommission'
                        ? 'Total Commission'
                        : name,
                ]}
              />
              <Area
                type="monotone"
                dataKey="actualCommission"
                stackId="1"
                stroke="#026937"
                fill="#026937"
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="projectedCommission"
                stackId="1"
                stroke="#ea7200"
                fill="#ea7200"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Assumptions */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-hunks-green/10 via-white to-hunks-orange/10 border-hunks-green/30 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.01] group backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-hunks-green/5 via-transparent to-hunks-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
        <CardHeader className="relative">
          <CardTitle className="text-hunks-green group-hover:text-hunks-green/90 transition-colors duration-300 group-hover:font-bold">
            Projection Assumptions
          </CardTitle>
          <CardDescription className="group-hover:text-hunks-green/70 transition-colors duration-300">
            Based on your historical performance data
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-xl font-bold text-hunks-green transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-hunks-green/90">
                {formatPercentage(historicalMetrics.avgConversionRate * 100)}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-hunks-green/70 transition-colors duration-300">
                Conversion Rate
              </div>
            </div>
            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-xl font-bold text-hunks-orange transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-hunks-orange/90">
                {formatPercentage(historicalMetrics.avgAccuracy * 100)}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-hunks-orange/70 transition-colors duration-300">
                Booking Accuracy
              </div>
            </div>
            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-xl font-bold text-purple-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-purple-700">
                {formatPercentage(historicalMetrics.avgCommissionRate * 100)}
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-purple-600/70 transition-colors duration-300">
                Commission Rate
              </div>
            </div>
            <div className="text-center p-4 bg-white/70 rounded-lg transition-all duration-300 hover:bg-white/90 hover:scale-105 hover:shadow-lg group/item">
              <div className="text-xl font-bold text-blue-600 transition-all duration-300 group-hover/item:scale-110 group-hover/item:text-blue-700">
                {Math.round(historicalMetrics.avgTimeToClosure)} days
              </div>
              <div className="text-sm text-muted-foreground group-hover/item:text-blue-600/70 transition-colors duration-300">
                Avg. Time to Close
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
