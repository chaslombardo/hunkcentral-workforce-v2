'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Award,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { PayPeriod, Department } from '@/types';

// Types for pay period analysis
export interface PayPeriodComparison {
  currentPeriod: PayrollPeriodData;
  previousPeriod?: PayrollPeriodData;
  trends: PayrollTrends;
  insights: PayrollInsight[];
}

export interface PayrollPeriodData {
  payPeriod: PayPeriod;
  totalPay: number;
  totalHours: number;
  tips: number;
  bonuses: number;
  commission: number;
  departmentBreakdown: {
    [key in Department]: {
      hours: number;
      pay: number;
      percentage: number;
    };
  };
  dailyAverages: {
    pay: number;
    hours: number;
    tips: number;
  };
  laborEfficiency: {
    junkPercentage: number;
    movePercentage: number;
    overallEfficiency: number;
  };
}

export interface PayrollTrends {
  totalPay: TrendData;
  totalHours: TrendData;
  tips: TrendData;
  bonuses: TrendData;
  laborEfficiency: TrendData;
  tipsPerHour: TrendData;
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  isPositive: boolean;
  isSignificant: boolean; // > 10% change
}

export interface PayrollInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
}

interface PayPeriodAnalysisProps {
  userId: string;
  currentPeriod: PayPeriod;
  availablePeriods: PayPeriod[];
  comparisonData?: PayPeriodComparison;
  isLoading?: boolean;
  error?: string;
}

// Mock data for demonstration
const mockHistoricalData = [
  { period: 'Dec W3', totalPay: 850, hours: 36, tips: 110, efficiency: 85 },
  { period: 'Dec W4', totalPay: 890, hours: 38, tips: 120, efficiency: 88 },
  { period: 'Jan W1', totalPay: 955, hours: 40, tips: 150, efficiency: 92 },
  { period: 'Jan W2', totalPay: 1020, hours: 42, tips: 180, efficiency: 95 },
  { period: 'Jan W3', totalPay: 980, hours: 41, tips: 165, efficiency: 90 },
];

const mockDepartmentTrends = [
  { department: 'Junk', current: 30, previous: 28, change: 2 },
  { department: 'Move', current: 8, previous: 10, change: -2 },
  { department: 'Zigma', current: 2, previous: 1, change: 1 },
  { department: 'Admin', current: 0, previous: 1, change: -1 },
];

const mockPerformanceMetrics = [
  { metric: 'Tips per Hour', current: 3.75, previous: 3.16, target: 4.0 },
  { metric: 'Labor Efficiency', current: 90, previous: 88, target: 85 },
  { metric: 'Jobs per Day', current: 5.6, previous: 5.2, target: 6.0 },
  { metric: 'Bonus Rate', current: 15, previous: 12, target: 20 },
];

const chartConfig = {
  totalPay: {
    label: 'Total Pay',
    color: '#026937',
  },
  hours: {
    label: 'Hours',
    color: '#ea7200',
  },
  tips: {
    label: 'Tips',
    color: '#10b981',
  },
  efficiency: {
    label: 'Efficiency %',
    color: '#8b5cf6',
  },
};

export function PayPeriodAnalysis({
  isLoading = false,
  error,
}: PayPeriodAnalysisProps) {
  const [selectedComparePeriod, setSelectedComparePeriod] = React.useState<string>('previous');
  const [chartView, setChartView] = React.useState<'trends' | 'departments' | 'performance'>('trends');

  const handleChartViewChange = (value: string) => {
    setChartView(value as 'trends' | 'departments' | 'performance');
  };

  // Generate mock insights based on data
  const mockInsights: PayrollInsight[] = [
    {
      type: 'positive',
      title: 'Tips Performance Improved',
      description: 'Your tips increased by 25% compared to last period',
      metric: '+$30 in tips',
      recommendation: 'Keep up the excellent customer service!',
    },
    {
      type: 'neutral',
      title: 'Department Mix Changed',
      description: 'You worked more junk hours and fewer move hours this period',
      metric: '+2h junk, -2h move',
    },
    {
      type: 'positive',
      title: 'Labor Efficiency Bonus',
      description: 'Your efficiency improved, earning additional bonuses',
      metric: '+2% efficiency',
      recommendation: 'Continue focusing on efficient job completion',
    },
    {
      type: 'warning',
      title: 'Approaching Overtime',
      description: 'You worked 42 hours this period, close to overtime threshold',
      metric: '42 hours worked',
      recommendation: 'Monitor hours to optimize pay structure',
    },
  ];

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}. Showing cached analysis data.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Pay Period Analysis</h3>
          <p className="text-sm text-muted-foreground">
            Compare performance across pay periods and track trends
          </p>
        </div>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={selectedComparePeriod} onValueChange={setSelectedComparePeriod}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Compare to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous">Previous Period</SelectItem>
              <SelectItem value="same-last-month">Same Period Last Month</SelectItem>
              <SelectItem value="best-period">Best Period</SelectItem>
              <SelectItem value="average">Period Average</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground grid w-full grid-cols-3" role="tablist">
            <Button
              variant={chartView === 'trends' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
              onClick={() => handleChartViewChange('trends')}
              role="tab"
              aria-selected={chartView === 'trends'}
              aria-controls="chart-content"
            >
              <LineChartIcon className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Trends</span>
            </Button>
            <Button
              variant={chartView === 'departments' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
              onClick={() => handleChartViewChange('departments')}
              role="tab"
              aria-selected={chartView === 'departments'}
              aria-controls="chart-content"
            >
              <PieChartIcon className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Depts</span>
            </Button>
            <Button
              variant={chartView === 'performance' ? 'default' : 'ghost'}
              size="sm"
              className="text-xs"
              onClick={() => handleChartViewChange('performance')}
              role="tab"
              aria-selected={chartView === 'performance'}
              aria-controls="chart-content"
            >
              <BarChart3 className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Metrics</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Comparison Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton data-testid="skeleton" className="h-4 w-20" />
                <Skeleton data-testid="skeleton" className="h-6 w-16" />
              </CardHeader>
              <CardContent>
                <Skeleton data-testid="skeleton" className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Total Pay Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Total Pay
              </CardDescription>
              <CardTitle className="text-xl">
                {formatCurrency(1020)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp data-testid="trending-up" className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+6.8%</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>

          {/* Hours Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hours Worked
              </CardDescription>
              <CardTitle className="text-xl">42h</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp data-testid="trending-up" className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+5.0%</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>

          {/* Tips Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                Tips Earned
              </CardDescription>
              <CardTitle className="text-xl">
                {formatCurrency(180)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp data-testid="trending-up" className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+20.0%</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Efficiency
              </CardDescription>
              <CardTitle className="text-xl">95%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp data-testid="trending-up" className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+5.6%</span>
                <span className="text-muted-foreground">vs target</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            {chartView === 'trends' && <LineChartIcon className="h-5 w-5" />}
            {chartView === 'departments' && <PieChartIcon className="h-5 w-5" />}
            {chartView === 'performance' && <BarChart3 className="h-5 w-5" />}
            {chartView === 'trends' && 'Pay Trends Over Time'}
            {chartView === 'departments' && 'Department Hour Distribution'}
            {chartView === 'performance' && 'Performance Metrics'}
          </CardTitle>
          <CardDescription>
            {chartView === 'trends' && 'Track your compensation trends across recent pay periods'}
            {chartView === 'departments' && 'See how your work hours are distributed across departments'}
            {chartView === 'performance' && 'Monitor key performance indicators and targets'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <Skeleton className="h-[350px] w-full" />
          ) : (
            <div id="chart-content" className="w-full">
              {chartView === 'trends' && (
                <div className="h-[350px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <LineChart data={mockHistoricalData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis yAxisId="pay" orientation="left" />
                      <YAxis yAxisId="hours" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line
                        yAxisId="pay"
                        type="monotone"
                        dataKey="totalPay"
                        stroke="var(--color-totalPay)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-totalPay)' }}
                      />
                      <Line
                        yAxisId="hours"
                        type="monotone"
                        dataKey="hours"
                        stroke="var(--color-hours)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-hours)' }}
                      />
                      <Line
                        yAxisId="pay"
                        type="monotone"
                        dataKey="tips"
                        stroke="var(--color-tips)"
                        strokeWidth={2}
                        dot={{ fill: 'var(--color-tips)' }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              )}

              {chartView === 'departments' && (
                <div className="h-[350px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <BarChart data={mockDepartmentTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="current" fill="#026937" name="Current Period" />
                      <Bar dataKey="previous" fill="#ea7200" name="Previous Period" />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}

              {chartView === 'performance' && (
                <div className="h-[350px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <BarChart data={mockPerformanceMetrics} layout="horizontal" margin={{ top: 20, right: 30, left: 120, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="metric" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="current" fill="#026937" name="Current" />
                      <Bar dataKey="target" fill="#ea7200" name="Target" />
                    </BarChart>
                  </ChartContainer>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            AI-powered insights based on your work patterns and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {mockInsights.map((insight, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-lg border">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    insight.type === 'positive' ? 'bg-green-100 text-green-600' :
                    insight.type === 'negative' ? 'bg-red-100 text-red-600' :
                    insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {insight.type === 'positive' && <TrendingUp className="h-4 w-4" />}
                    {insight.type === 'negative' && <TrendingDown className="h-4 w-4" />}
                    {insight.type === 'warning' && <AlertCircle className="h-4 w-4" />}
                    {insight.type === 'neutral' && <Info className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{insight.title}</h4>
                      {insight.metric && (
                        <Badge variant="outline" className="text-xs">
                          {insight.metric}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {insight.description}
                    </p>
                    {insight.recommendation && (
                      <p className="text-xs text-blue-600 font-medium">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Comparison Table */}
      <Card className="mt-6">
        <CardHeader className="pb-4">
          <CardTitle>Period Comparison Details</CardTitle>
          <CardDescription>
            Side-by-side comparison of key metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-4 pb-2 border-b font-medium text-sm">
                <div>Metric</div>
                <div className="text-center">Current Period</div>
                <div className="text-center">Previous Period</div>
                <div className="text-center">Change</div>
              </div>
              
              {[
                { metric: 'Total Pay', current: '$1,020', previous: '$955', change: '+6.8%', positive: true },
                { metric: 'Total Hours', current: '42h', previous: '40h', change: '+5.0%', positive: true },
                { metric: 'Tips Earned', current: '$180', previous: '$150', change: '+20.0%', positive: true },
                { metric: 'Bonuses', current: '$95', previous: '$85', change: '+11.8%', positive: true },
                { metric: 'Tips per Hour', current: '$4.29', previous: '$3.75', change: '+14.4%', positive: true },
                { metric: 'Labor Efficiency', current: '95%', previous: '92%', change: '+3.3%', positive: true },
                { metric: 'Jobs Completed', current: '24', previous: '22', change: '+9.1%', positive: true },
              ].map((row, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 py-2 text-sm">
                  <div className="font-medium">{row.metric}</div>
                  <div className="text-center">{row.current}</div>
                  <div className="text-center text-muted-foreground">{row.previous}</div>
                  <div className={`text-center font-medium ${
                    row.positive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {row.change}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}