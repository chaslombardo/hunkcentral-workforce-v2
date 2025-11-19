'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, ReferenceLine } from 'recharts';
import { IconDownload } from '@tabler/icons-react';

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

interface CaptainMetrics {
  currentPayPeriodRevenue: number;
  currentPayPeriodTips: number;
  junkLaborBonus: number;
  moveLaborBonus: number;
  laborCostPercent?: number;
}

interface CaptainChartAreaInteractiveProps {
  metrics?: CaptainMetrics;
}

// Sample labor cost data for demonstration - TODO: Replace with real data from metrics
const generateSampleLaborData = (metrics?: CaptainMetrics) => {
  const baseJunkPercent = metrics?.laborCostPercent ?? 13.5;
  const baseMovePercent =
    metrics?.laborCostPercent !== undefined
      ? Math.min(Math.max(metrics.laborCostPercent + 10, 18), 30)
      : 23.2;
  const baseRevenue = metrics?.currentPayPeriodRevenue
    ? metrics.currentPayPeriodRevenue / 14
    : 2000;
  const baseTips = metrics?.currentPayPeriodTips
    ? metrics.currentPayPeriodTips / 14
    : 150;

  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));

    // Add some realistic variation
    const junkVariation = (Math.random() - 0.5) * 3;
    const moveVariation = (Math.random() - 0.5) * 4;

    return {
      date: date.toISOString().split('T')[0],
      junkLaborPercent: Math.max(
        8,
        Math.min(18, baseJunkPercent + junkVariation)
      ),
      moveLaborPercent: Math.max(
        18,
        Math.min(30, baseMovePercent + moveVariation)
      ),
      junkRevenue:
        Math.floor(Math.random() * (baseRevenue * 0.6)) + baseRevenue * 0.4,
      moveRevenue:
        Math.floor(Math.random() * (baseRevenue * 0.8)) + baseRevenue * 0.5,
      tips: Math.floor(Math.random() * (baseTips * 0.5)) + baseTips * 0.75,
    };
  });
};

const chartConfig = {
  laborPercent: {
    label: 'Labor Cost %',
  },
  junkLaborPercent: {
    label: 'Junk Labor %',
    color: 'var(--hunks-green)',
  },
  moveLaborPercent: {
    label: 'Move Labor %',
    color: 'var(--hunks-orange)',
  },
} satisfies ChartConfig;

export function CaptainChartAreaInteractive({
  metrics,
}: CaptainChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('14d');
  const [jobType, setJobType] = React.useState('both');

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('7d');
    }
  }, [isMobile]);

  const chartData = React.useMemo(
    () => generateSampleLaborData(metrics),
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

  return (
    <Card className="@container/card hunk-gradient-bg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-hunks-green">
              Labor Cost Trends
            </CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">
                Track your efficiency over time - Target: 14% Junk, 24% Move
              </span>
              <span className="@[540px]/card:hidden">
                Labor efficiency tracking
              </span>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">All Jobs</SelectItem>
                <SelectItem value="junk">Junk Only</SelectItem>
                <SelectItem value="move">Move Only</SelectItem>
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
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillJunk" x1="0" y1="0" x2="0" y2="1">
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
              <linearGradient id="fillMove" x1="0" y1="0" x2="0" y2="1">
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

            {/* Reference lines for goals */}
            <ReferenceLine
              y={14}
              stroke="var(--hunks-green)"
              strokeDasharray="5 5"
              label={{ value: 'Junk Goal (14%)', position: 'top' }}
            />
            <ReferenceLine
              y={24}
              stroke="var(--hunks-orange)"
              strokeDasharray="5 5"
              label={{ value: 'Move Goal (24%)', position: 'top' }}
            />

            {(jobType === 'both' || jobType === 'move') && (
              <Area
                dataKey="moveLaborPercent"
                type="natural"
                fill="url(#fillMove)"
                stroke="var(--hunks-orange)"
                stackId="a"
              />
            )}
            {(jobType === 'both' || jobType === 'junk') && (
              <Area
                dataKey="junkLaborPercent"
                type="natural"
                fill="url(#fillJunk)"
                stroke="var(--hunks-green)"
                stackId="a"
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
