'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  ReferenceLine,
  Bar,
  BarChart,
  Line,
  LineChart,
} from 'recharts';
import {
  IconDownload,
  IconCurrencyDollar,
  IconTarget,
} from '@tabler/icons-react';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';

interface SalesMetrics {
  pendingCommissions: number;
  matchedCommissions: number;
}

interface SalesChartAreaInteractiveProps {
  metrics?: SalesMetrics;
}

// Sample sales performance data for demonstration - TODO: Replace with real data from metrics
const generateSampleSalesData = (metrics?: SalesMetrics) => {
  const monthlyTarget = metrics
    ? Math.max(metrics.matchedCommissions * 200, 4000)
    : 5000;
  const pendingFactor = metrics?.pendingCommissions ?? 10;

  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));

    // Generate realistic sales data with growth trend
    const dayOfMonth = date.getDate();
    const progressThroughMonth = dayOfMonth / 30;
    const baseCommission =
      monthlyTarget * progressThroughMonth + (Math.random() - 0.5) * 200;

    return {
      date: date.toISOString().split('T')[0],
      commissionEarned: Math.max(0, baseCommission),
      bookingsCreated:
        Math.floor(Math.random() * 2) + Math.max(pendingFactor / 5, 1),
      conversionRate: Math.min(95, Math.floor(Math.random() * 15) + 60),
      pipelineValue: Math.floor(Math.random() * 600) + pendingFactor * 40 + 400,
      target: (monthlyTarget / 30) * dayOfMonth, // Linear target progression
    };
  });
};

const chartConfig = {
  salesPerformance: {
    label: 'Sales Performance',
  },
  commissionEarned: {
    label: 'Commission Earned',
    color: 'var(--hunks-green)',
  },
  bookingsCreated: {
    label: 'Bookings Created',
    color: 'var(--hunks-orange)',
  },
  target: {
    label: 'Target',
    color: '#6b7280',
  },
} satisfies ChartConfig;

export function SalesChartAreaInteractive({
  metrics,
}: SalesChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('30d');
  const [chartType, setChartType] = React.useState('commission');

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('14d');
    }
  }, [isMobile]);

  const chartData = React.useMemo(
    () => generateSampleSalesData(metrics),
    [metrics]
  );

  const filteredData = React.useMemo(() => {
    // Filter by time range
    const now = new Date();
    let daysToSubtract = 30;
    if (timeRange === '14d') {
      daysToSubtract = 14;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return chartData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [chartData, timeRange]);

  // Calculate summary stats
  const totalCommission = filteredData.reduce(
    (sum, item) => sum + item.commissionEarned,
    0
  );
  const totalBookings = filteredData.reduce(
    (sum, item) => sum + item.bookingsCreated,
    0
  );
  const avgConversionRate =
    filteredData.reduce((sum, item) => sum + item.conversionRate, 0) /
    filteredData.length;
  const currentTarget = filteredData[filteredData.length - 1]?.target || 0;
  const targetProgress =
    currentTarget > 0 ? (totalCommission / currentTarget) * 100 : 0;

  return (
    <Card className="@container/card hunk-gradient-bg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-hunks-green flex items-center gap-2">
              <IconCurrencyDollar className="w-5 h-5" />
              Sales Performance Dashboard
            </CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                Track your commission earnings, booking pipeline, and
                performance against targets
              </span>
              <span className="@[540px]/card:hidden">
                Sales performance tracking
              </span>
            </CardDescription>

            {/* Summary Stats */}
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-hunks-green text-hunks-green bg-hunks-green/10"
                >
                  <IconCurrencyDollar className="w-3 h-3" />
                  {formatCurrency(totalCommission)} Earned
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-hunks-orange text-hunks-orange bg-hunks-orange/10"
                >
                  {totalBookings} Bookings Created
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-gray-500 text-gray-700 bg-gray-50"
                >
                  <IconTarget className="w-3 h-3" />
                  {targetProgress.toFixed(0)}% of Target
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-400 text-blue-700 bg-blue-50"
                >
                  Avg Conversion {avgConversionRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commission">Commission Earnings</SelectItem>
                <SelectItem value="bookings">Booking Pipeline</SelectItem>
                <SelectItem value="conversion">Conversion Rate</SelectItem>
                <SelectItem value="target">Target Progress</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <IconDownload className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            <ToggleGroupItem value="14d">Last 14 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 h-8 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
              <SelectItem value="14d" className="rounded-lg">
                Last 14 days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          {chartType === 'commission' ? (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--hunks-green)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--hunks-green)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    indicator="dot"
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      'Commission',
                    ]}
                  />
                }
              />

              {/* Target line */}
              <Line
                dataKey="target"
                type="monotone"
                stroke="#6b7280"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
              />

              <Area
                dataKey="commissionEarned"
                type="natural"
                fill="url(#fillCommission)"
                stroke="var(--hunks-green)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : chartType === 'bookings' ? (
            <BarChart data={filteredData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Bar
                dataKey="bookingsCreated"
                fill="var(--hunks-orange)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : chartType === 'conversion' ? (
            <LineChart data={filteredData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    indicator="dot"
                    formatter={(value) => [
                      `${Number(value).toFixed(1)}%`,
                      'Conversion Rate',
                    ]}
                  />
                }
              />

              {/* Target conversion rate line */}
              <ReferenceLine
                y={70}
                stroke="var(--hunks-green)"
                strokeDasharray="5 5"
                label={{ value: 'Target (70%)', position: 'top' }}
              />

              <Line
                dataKey="conversionRate"
                type="monotone"
                stroke="var(--hunks-orange)"
                strokeWidth={3}
                dot={{ fill: 'var(--hunks-orange)', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--hunks-green)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--hunks-green)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTargetLine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                    indicator="dot"
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      name === 'target' ? 'Target' : 'Actual',
                    ]}
                  />
                }
              />

              <Area
                dataKey="target"
                type="natural"
                fill="url(#fillTargetLine)"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
              />

              <Area
                dataKey="commissionEarned"
                type="natural"
                fill="url(#fillTarget)"
                stroke="var(--hunks-green)"
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
