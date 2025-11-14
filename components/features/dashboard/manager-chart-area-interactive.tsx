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
} from 'recharts';
import { IconDownload, IconUsers, IconTrendingUp } from '@tabler/icons-react';

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

interface ManagerMetrics {
  logsAwaitingReview: number;
  recentApprovals: number;
}

interface ManagerChartAreaInteractiveProps {
  metrics?: ManagerMetrics;
}

// Sample team performance data for demonstration - TODO: Replace with real data from metrics
const generateSampleTeamData = (metrics?: ManagerMetrics) => {
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));

    // Generate realistic team performance data
    const baseEfficiency = 85;
    const variation = (Math.random() - 0.5) * 10;
    const efficiency = Math.max(70, Math.min(100, baseEfficiency + variation));

    return {
      date: date.toISOString().split('T')[0],
      teamEfficiency: efficiency,
      logsProcessed: Math.floor(Math.random() * 15) + 5,
      avgApprovalTime: Math.floor(Math.random() * 30) + 30, // 30-60 seconds
      exceptionsRaised: Math.floor(Math.random() * 3),
    };
  });
};

const chartConfig = {
  teamPerformance: {
    label: 'Team Performance',
  },
  teamEfficiency: {
    label: 'Team Efficiency %',
    color: 'var(--hunks-green)',
  },
  logsProcessed: {
    label: 'Logs Processed',
    color: 'var(--hunks-orange)',
  },
} satisfies ChartConfig;

export function ManagerChartAreaInteractive({
  metrics,
}: ManagerChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('14d');
  const [chartType, setChartType] = React.useState('efficiency');

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('7d');
    }
  }, [isMobile]);

  const chartData = React.useMemo(
    () => generateSampleTeamData(metrics),
    [metrics]
  );

  const filteredData = React.useMemo(() => {
    // Filter by time range
    const now = new Date();
    let daysToSubtract = 14;
    if (timeRange === '30d') {
      daysToSubtract = 30;
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
  const avgEfficiency =
    filteredData.reduce((sum, item) => sum + item.teamEfficiency, 0) /
    filteredData.length;
  const totalLogsProcessed = filteredData.reduce(
    (sum, item) => sum + item.logsProcessed,
    0
  );
  const avgApprovalTime =
    filteredData.reduce((sum, item) => sum + item.avgApprovalTime, 0) /
    filteredData.length;

  return (
    <Card className="@container/card hunk-gradient-bg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-hunks-green flex items-center gap-2">
              <IconUsers className="w-5 h-5" />
              Team Performance Overview
            </CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                Monitor your team&apos;s efficiency, approval rates, and
                performance trends
              </span>
              <span className="@[540px]/card:hidden">
                Team performance tracking
              </span>
            </CardDescription>

            {/* Summary Stats */}
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-hunks-green text-hunks-green bg-hunks-green/10"
                >
                  <IconTrendingUp className="w-3 h-3" />
                  {avgEfficiency.toFixed(1)}% Avg Efficiency
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-hunks-orange text-hunks-orange bg-hunks-orange/10"
                >
                  {totalLogsProcessed} Logs Processed
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-gray-500 text-gray-700 bg-gray-50"
                >
                  {avgApprovalTime.toFixed(0)}s Avg Review Time
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
                <SelectItem value="efficiency">Team Efficiency</SelectItem>
                <SelectItem value="logs">Logs Processed</SelectItem>
                <SelectItem value="approval">Approval Times</SelectItem>
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
              <SelectValue placeholder="Last 14 days" />
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
          {chartType === 'efficiency' ? (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillEfficiency" x1="0" y1="0" x2="0" y2="1">
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
                  />
                }
              />

              {/* Reference line for target efficiency */}
              <ReferenceLine
                y={85}
                stroke="var(--hunks-green)"
                strokeDasharray="5 5"
                label={{ value: 'Target (85%)', position: 'top' }}
              />

              <Area
                dataKey="teamEfficiency"
                type="natural"
                fill="url(#fillEfficiency)"
                stroke="var(--hunks-green)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : chartType === 'logs' ? (
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
                dataKey="logsProcessed"
                fill="var(--hunks-orange)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillApproval" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--hunks-orange)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--hunks-orange)"
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
                  />
                }
              />

              {/* Reference line for target approval time */}
              <ReferenceLine
                y={30}
                stroke="var(--hunks-orange)"
                strokeDasharray="5 5"
                label={{ value: 'Target (30s)', position: 'top' }}
              />

              <Area
                dataKey="avgApprovalTime"
                type="natural"
                fill="url(#fillApproval)"
                stroke="var(--hunks-orange)"
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
