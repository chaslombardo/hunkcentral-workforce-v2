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
  IconServer,
  IconActivity,
  IconTrendingUp,
} from '@tabler/icons-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
interface AdminMetrics {
  systemHealth: number;
  userActivity: number;
  errorRate: number;
  performanceScore: number;
  activeUsers: number;
  performanceHistory: Array<{
    timestamp: string;
    systemHealth: number;
    activeUsers: number;
    userActivity: number;
    responseTime: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  }>;
}
interface AdminChartAreaInteractiveProps {
  metrics?: AdminMetrics;
}
const chartConfig = {
  systemPerformance: {
    label: 'System Performance',
  },
  systemHealth: {
    label: 'System Health %',
    color: 'var(--hunks-green)',
  },
  activeUsers: {
    label: 'Active Users',
    color: 'var(--hunks-orange)',
  },
  userActivity: {
    label: 'User Activity',
    color: '#3b82f6',
  },
  responseTime: {
    label: 'Response Time (ms)',
    color: '#8b5cf6',
  },
} satisfies ChartConfig;
export function AdminChartAreaInteractive({
  metrics,
}: AdminChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('24h');
  const [chartType, setChartType] = React.useState('health');
  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('12h');
    }
  }, [isMobile]);
  const chartData = React.useMemo(() => {
    if (metrics?.performanceHistory?.length) {
      return metrics.performanceHistory.map((snapshot) => ({
        time: snapshot.timestamp,
        systemHealth: snapshot.systemHealth,
        activeUsers: snapshot.activeUsers,
        userActivity: snapshot.userActivity,
        responseTime: snapshot.responseTime,
        errorRate: snapshot.errorRate / 100,
        cpuUsage: snapshot.cpuUsage,
        memoryUsage: snapshot.memoryUsage,
      }));
    }

    return Array.from({ length: 12 }, (_, index) => {
      const hoursAgo = 11 - index;
      return {
        time: new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString(),
        systemHealth: metrics?.systemHealth ?? 95,
        activeUsers: metrics?.activeUsers ?? 0,
        userActivity: metrics?.userActivity ?? 0,
        responseTime: 40 + hoursAgo,
        errorRate: (metrics?.errorRate ?? 0) / 100,
        cpuUsage: 60 + hoursAgo,
        memoryUsage: 55 + hoursAgo / 2,
      };
    });
  }, [metrics]);
  const filteredData = React.useMemo(() => {
    // Filter by time range
    const now = new Date();
    let hoursToSubtract = 24;
    if (timeRange === '12h') {
      hoursToSubtract = 12;
    } else if (timeRange === '6h') {
      hoursToSubtract = 6;
    }
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() - hoursToSubtract);
    return chartData.filter((item) => {
      const itemTime = new Date(item.time);
      return itemTime >= startTime;
    });
  }, [chartData, timeRange]);
  // Calculate summary stats
  const avgSystemHealth =
    filteredData.reduce((sum, item) => sum + item.systemHealth, 0) /
    filteredData.length;
  const avgActiveUsers =
    filteredData.reduce((sum, item) => sum + item.activeUsers, 0) /
    filteredData.length;
  const avgResponseTime =
    filteredData.reduce((sum, item) => sum + item.responseTime, 0) /
    filteredData.length;
  const avgErrorRate =
    filteredData.reduce((sum, item) => sum + item.errorRate, 0) /
    filteredData.length;
  const avgErrorRatePercent = avgErrorRate * 100;
  return (
    <Card className="@container/card hunk-gradient-bg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-hunks-green flex items-center gap-2">
              <IconServer className="w-5 h-5" />
              System Performance Monitor
            </CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                Real-time monitoring of system health, user activity, and
                performance metrics
              </span>
              <span className="@[540px]/card:hidden">
                System performance tracking
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
                  {avgSystemHealth.toFixed(1)}% Health
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-hunks-orange text-hunks-orange bg-hunks-orange/10"
                >
                  <IconActivity className="w-3 h-3" />
                  {Math.round(avgActiveUsers)} Avg Users
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-blue-500 text-blue-700 bg-blue-50"
                >
                  {Math.round(avgResponseTime)}ms Response
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    avgErrorRate < 0.1
                      ? 'border-green-200 text-green-700 bg-green-50'
                      : 'border-yellow-200 text-yellow-700 bg-yellow-50'
                  }
                >
                  {avgErrorRatePercent.toFixed(2)}% Errors
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
                <SelectItem value="health">System Health</SelectItem>
                <SelectItem value="users">User Activity</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
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
            <ToggleGroupItem value="6h">Last 6 hours</ToggleGroupItem>
            <ToggleGroupItem value="12h">Last 12 hours</ToggleGroupItem>
            <ToggleGroupItem value="24h">Last 24 hours</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 h-8 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              aria-label="Select a time range"
            >
              <SelectValue placeholder="Last 24 hours" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="6h" className="rounded-lg">
                Last 6 hours
              </SelectItem>
              <SelectItem value="12h" className="rounded-lg">
                Last 12 hours
              </SelectItem>
              <SelectItem value="24h" className="rounded-lg">
                Last 24 hours
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
          {chartType === 'health' ? (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillHealth" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                    }}
                    indicator="dot"
                    formatter={(value) => [
                      `${Number(value).toFixed(1)}%`,
                      'System Health',
                    ]}
                  />
                }
              />
              {/* Target health line */}
              <ReferenceLine
                y={95}
                stroke="var(--hunks-green)"
                strokeDasharray="5 5"
                label={{ value: 'Target (95%)', position: 'top' }}
              />
              <Area
                dataKey="systemHealth"
                type="natural"
                fill="url(#fillHealth)"
                stroke="var(--hunks-green)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : chartType === 'users' ? (
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
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
                <linearGradient id="fillActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="userActivity"
                type="natural"
                fill="url(#fillActivity)"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Area
                dataKey="activeUsers"
                type="natural"
                fill="url(#fillUsers)"
                stroke="var(--hunks-orange)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : chartType === 'performance' ? (
            <LineChart data={filteredData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                    }}
                    indicator="dot"
                    formatter={(value, name) => [
                      name === 'responseTime'
                        ? `${Number(value).toFixed(0)}ms`
                        : `${(Number(value) * 100).toFixed(2)}%`,
                      name === 'responseTime' ? 'Response Time' : 'Error Rate',
                    ]}
                  />
                }
              />
              {/* Target response time line */}
              <ReferenceLine
                y={50}
                stroke="#8b5cf6"
                strokeDasharray="5 5"
                label={{ value: 'Target (50ms)', position: 'top' }}
              />
              <Line
                dataKey="responseTime"
                type="monotone"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              />
              <Line
                dataKey="errorRate"
                type="monotone"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          ) : (
            <BarChart data={filteredData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      });
                    }}
                    indicator="dot"
                    formatter={(value, name) => [
                      `${Number(value).toFixed(0)}%`,
                      name === 'cpuUsage' ? 'CPU Usage' : 'Memory Usage',
                    ]}
                  />
                }
              />
              <Bar
                dataKey="cpuUsage"
                fill="var(--hunks-green)"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="memoryUsage"
                fill="var(--hunks-orange)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
