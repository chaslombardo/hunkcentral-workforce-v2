'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  BarChart3,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CommissionEntry {
  id: string;
  jobId: string;
  clientName: string;
  jobType: string;
  estimatedRevenue: number;
  actualRevenue: number | null;
  commissionAmount: number | null;
  status: string;
  createdAt: Date;
  targetDate: Date;
  approvedAt: Date | null;
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

interface CommissionCalculationBreakdownProps {
  entries: CommissionEntry[];
  showDetailed?: boolean;
}

export function CommissionCalculationBreakdown({
  entries,
  showDetailed = false,
}: CommissionCalculationBreakdownProps) {
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  );

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'matched':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'matched':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateBookingAccuracy = (
    estimated: number,
    actual: number | null
  ) => {
    if (!actual || estimated === 0) return null;
    return (Math.min(estimated, actual) / Math.max(estimated, actual)) * 100;
  };

  const calculateVariance = (estimated: number, actual: number | null) => {
    if (!actual) return null;
    return actual - estimated;
  };

  const calculateVariancePercentage = (
    estimated: number,
    actual: number | null
  ) => {
    if (!actual || estimated === 0) return null;
    return ((actual - estimated) / estimated) * 100;
  };

  const getCommissionRate = (entry: CommissionEntry) => {
    // If we have actual commission and revenue, calculate the rate
    if (entry.commissionAmount && entry.actualRevenue) {
      return (entry.commissionAmount / entry.actualRevenue) * 100;
    }
    // Default commission rate assumption
    return 5; // 5% default
  };

  // Calculate summary statistics
  const summary = {
    totalEntries: entries.length,
    pendingEntries: entries.filter((e) => e.status === 'pending').length,
    matchedEntries: entries.filter((e) => e.status === 'matched').length,
    approvedEntries: entries.filter((e) => e.status === 'approved').length,
    rejectedEntries: entries.filter((e) => e.status === 'rejected').length,

    totalEstimatedRevenue: entries.reduce(
      (sum, e) => sum + e.estimatedRevenue,
      0
    ),
    totalActualRevenue: entries.reduce(
      (sum, e) => sum + (e.actualRevenue || 0),
      0
    ),
    totalEstimatedCommission: entries.reduce(
      (sum, e) => sum + e.estimatedRevenue * (getCommissionRate(e) / 100),
      0
    ),
    totalActualCommission: entries.reduce(
      (sum, e) => sum + (e.commissionAmount || 0),
      0
    ),

    avgBookingAccuracy: entries
      .filter((e) => e.actualRevenue && e.estimatedRevenue > 0)
      .reduce((sum, e, _, arr) => {
        const accuracy = calculateBookingAccuracy(
          e.estimatedRevenue,
          e.actualRevenue
        );
        return sum + (accuracy || 0) / arr.length;
      }, 0),
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border-l-4 border-l-hunks-green bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.02] hover:border-l-hunks-green/90 group backdrop-blur-sm">
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
              {formatCurrency(summary.totalActualCommission)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground group-hover:text-hunks-green/70 transition-colors duration-300">
                vs {formatCurrency(summary.totalEstimatedCommission)} projected
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {summary.totalActualCommission >
              summary.totalEstimatedCommission ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : summary.totalActualCommission <
                summary.totalEstimatedCommission ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <span
                className={`text-xs ${
                  summary.totalActualCommission >
                  summary.totalEstimatedCommission
                    ? 'text-green-600'
                    : summary.totalActualCommission <
                        summary.totalEstimatedCommission
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {summary.totalEstimatedCommission > 0
                  ? formatPercentage(
                      ((summary.totalActualCommission -
                        summary.totalEstimatedCommission) /
                        summary.totalEstimatedCommission) *
                        100
                    )
                  : '0.00%'}{' '}
                variance
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-hunks-orange bg-gradient-to-br from-white via-white to-hunks-orange/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-orange/20 hover:scale-[1.02] hover:border-l-hunks-orange/90 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-orange transition-all duration-300 group-hover:font-semibold">
              Revenue Accuracy
            </CardTitle>
            <div className="p-2 rounded-full bg-hunks-orange/10 group-hover:bg-hunks-orange/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Target className="h-4 w-4 text-hunks-orange" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-hunks-orange tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-orange/90">
              {formatPercentage(summary.avgBookingAccuracy)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Progress
                value={summary.avgBookingAccuracy}
                className="flex-1 transition-all duration-300 group-hover:scale-105"
              />
              <Badge
                variant="outline"
                className="text-xs transition-all duration-300 group-hover:border-hunks-orange group-hover:text-hunks-orange"
              >
                {summary.avgBookingAccuracy > 85
                  ? 'Excellent'
                  : summary.avgBookingAccuracy > 70
                    ? 'Good'
                    : 'Needs Work'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-hunks-orange/70 transition-all duration-300 group-hover:translate-x-1">
              Average booking accuracy
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-white via-white to-blue-50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] hover:border-l-blue-600 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-all duration-300 group-hover:font-semibold">
              Revenue Variance
            </CardTitle>
            <div className="p-2 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-blue-600 tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-blue-700">
              {formatCurrency(
                summary.totalActualRevenue - summary.totalEstimatedRevenue
              )}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {summary.totalActualRevenue > summary.totalEstimatedRevenue ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : summary.totalActualRevenue < summary.totalEstimatedRevenue ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <span
                className={`text-xs ${
                  summary.totalActualRevenue > summary.totalEstimatedRevenue
                    ? 'text-green-600'
                    : summary.totalActualRevenue < summary.totalEstimatedRevenue
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {summary.totalEstimatedRevenue > 0
                  ? formatPercentage(
                      ((summary.totalActualRevenue -
                        summary.totalEstimatedRevenue) /
                        summary.totalEstimatedRevenue) *
                        100
                    )
                  : '0.00%'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-blue-600/70 transition-all duration-300 group-hover:translate-x-1">
              {summary.totalActualRevenue > summary.totalEstimatedRevenue
                ? 'Above'
                : 'Below'}{' '}
              estimates
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-white via-white to-purple-50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] hover:border-l-purple-600 group backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-all duration-300 group-hover:font-semibold">
              Conversion Rate
            </CardTitle>
            <div className="p-2 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Calculator className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-purple-600 tabular-nums transition-all duration-500 group-hover:scale-110 group-hover:text-purple-700">
              {summary.totalEntries > 0
                ? formatPercentage(
                    ((summary.matchedEntries + summary.approvedEntries) /
                      summary.totalEntries) *
                      100
                  )
                : '0.00%'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground group-hover:text-purple-600/70 transition-colors duration-300">
                {summary.matchedEntries + summary.approvedEntries} of{' '}
                {summary.totalEntries} entries
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 group-hover:text-purple-600/70 transition-all duration-300 group-hover:translate-x-1">
              Bookings converted to jobs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Table */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.01] group backdrop-blur-sm border-hunks-green/20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2 group-hover:text-hunks-green transition-colors duration-300">
            <div className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Calculator className="h-5 w-5 text-hunks-green" />
            </div>
            Commission Calculation Breakdown
          </CardTitle>
          <CardDescription className="group-hover:text-hunks-green/70 transition-colors duration-300">
            Detailed analysis of commission calculations and variances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Job ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Sales Rep</TableHead>
                  <TableHead className="text-right">Estimated</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-center">Accuracy</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  {showDetailed && (
                    <TableHead className="text-center">Details</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const bookingAccuracy = calculateBookingAccuracy(
                    entry.estimatedRevenue,
                    entry.actualRevenue
                  );
                  const variance = calculateVariance(
                    entry.estimatedRevenue,
                    entry.actualRevenue
                  );
                  const variancePercentage = calculateVariancePercentage(
                    entry.estimatedRevenue,
                    entry.actualRevenue
                  );
                  const isExpanded = expandedEntries.has(entry.id);

                  return (
                    <>
                      <TableRow
                        key={entry.id}
                        className="transition-all duration-300 hover:bg-hunks-green/5"
                      >
                        <TableCell className="font-mono font-medium text-hunks-green">
                          {entry.jobId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {entry.clientName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.jobType}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {entry.sales.fullName}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(entry.estimatedRevenue)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.actualRevenue
                            ? formatCurrency(entry.actualRevenue)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {variance !== null ? (
                            <div className="flex items-center justify-end gap-1">
                              {variance > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : variance < 0 ? (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              ) : null}
                              <span
                                className={`font-mono text-sm ${
                                  variance > 0
                                    ? 'text-green-600'
                                    : variance < 0
                                      ? 'text-red-600'
                                      : 'text-gray-600'
                                }`}
                              >
                                {formatCurrency(Math.abs(variance))}
                              </span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {entry.commissionAmount
                            ? formatCurrency(entry.commissionAmount)
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {bookingAccuracy !== null ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge
                                    variant="outline"
                                    className={`transition-all duration-300 ${
                                      bookingAccuracy > 85
                                        ? 'border-green-500 text-green-700 hover:bg-green-50'
                                        : bookingAccuracy > 70
                                          ? 'border-yellow-500 text-yellow-700 hover:bg-yellow-50'
                                          : 'border-red-500 text-red-700 hover:bg-red-50'
                                    }`}
                                  >
                                    {formatPercentage(bookingAccuracy)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Booking accuracy:{' '}
                                    {formatPercentage(bookingAccuracy)}
                                  </p>
                                  <p>
                                    Variance:{' '}
                                    {variancePercentage
                                      ? formatPercentage(variancePercentage)
                                      : 'N/A'}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getStatusIcon(entry.status)}
                            <Badge
                              className={`text-xs ${getStatusColor(entry.status)}`}
                            >
                              {entry.status}
                            </Badge>
                          </div>
                        </TableCell>
                        {showDetailed && (
                          <TableCell className="text-center">
                            <Collapsible>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpanded(entry.id)}
                                  className="transition-all duration-300 hover:scale-105"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            </Collapsible>
                          </TableCell>
                        )}
                      </TableRow>

                      {showDetailed && isExpanded && (
                        <TableRow>
                          <TableCell
                            colSpan={showDetailed ? 10 : 9}
                            className="p-0"
                          >
                            <Collapsible open={isExpanded}>
                              <CollapsibleContent className="p-4 bg-gray-50 border-t">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-hunks-green">
                                      Booking Details
                                    </h4>
                                    <div className="text-sm space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Created:
                                        </span>
                                        <span>
                                          {format(
                                            entry.createdAt,
                                            'MMM dd, yyyy'
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Target Date:
                                        </span>
                                        <span>
                                          {format(
                                            entry.targetDate,
                                            'MMM dd, yyyy'
                                          )}
                                        </span>
                                      </div>
                                      {entry.approvedAt && (
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">
                                            Approved:
                                          </span>
                                          <span>
                                            {format(
                                              entry.approvedAt,
                                              'MMM dd, yyyy'
                                            )}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-hunks-orange">
                                      Commission Calculation
                                    </h4>
                                    <div className="text-sm space-y-1">
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Rate:
                                        </span>
                                        <span>
                                          {formatPercentage(
                                            getCommissionRate(entry)
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Projected:
                                        </span>
                                        <span>
                                          {formatCurrency(
                                            entry.estimatedRevenue *
                                              (getCommissionRate(entry) / 100)
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                          Actual:
                                        </span>
                                        <span>
                                          {entry.commissionAmount
                                            ? formatCurrency(
                                                entry.commissionAmount
                                              )
                                            : 'Pending'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {entry.matchedLog && (
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm text-blue-600">
                                        Matched Job
                                      </h4>
                                      <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">
                                            Captain:
                                          </span>
                                          <span>
                                            {entry.matchedLog.captain.fullName}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">
                                            Job Date:
                                          </span>
                                          <span>
                                            {format(
                                              entry.matchedLog.logDate,
                                              'MMM dd, yyyy'
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {variance !== null && (
                                  <>
                                    <Separator className="my-4" />
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm text-purple-600">
                                        Performance Analysis
                                      </h4>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">
                                            Revenue Variance:
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              variance > 0
                                                ? 'text-green-600'
                                                : variance < 0
                                                  ? 'text-red-600'
                                                  : 'text-gray-600'
                                            }`}
                                          >
                                            {variance > 0 ? '+' : ''}
                                            {formatCurrency(variance)}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">
                                            Variance %:
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              (variancePercentage || 0) > 0
                                                ? 'text-green-600'
                                                : (variancePercentage || 0) < 0
                                                  ? 'text-red-600'
                                                  : 'text-gray-600'
                                            }`}
                                          >
                                            {variancePercentage
                                              ? `${variancePercentage > 0 ? '+' : ''}${formatPercentage(variancePercentage)}`
                                              : 'N/A'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">
                                            Accuracy Grade:
                                          </span>
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${
                                              (bookingAccuracy || 0) > 85
                                                ? 'border-green-500 text-green-700'
                                                : (bookingAccuracy || 0) > 70
                                                  ? 'border-yellow-500 text-yellow-700'
                                                  : 'border-red-500 text-red-700'
                                            }`}
                                          >
                                            {(bookingAccuracy || 0) > 85
                                              ? 'Excellent'
                                              : (bookingAccuracy || 0) > 70
                                                ? 'Good'
                                                : 'Needs Improvement'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
