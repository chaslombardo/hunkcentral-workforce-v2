'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, ReferenceLine } from 'recharts';

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
import { IconDownload } from '@tabler/icons-react';

interface ChartAreaInteractiveProps {
  title: string;
  description: string;
  data: Array<{
    date: string;
    junkLaborPercent: number;
    moveLaborPercent: number;
    junkRevenue?: number;
    moveRevenue?: number;
  }>;
}

// Sample data for demonstration - TODO: Replace with real data
const sampleChartData = [
  {
    date: '2024-01-01',
    junkLaborPercent: 12.5,
    moveLaborPercent: 22.1,
    junkRevenue: 2400,
    moveRevenue: 1800,
  },
  {
    date: '2024-01-02',
    junkLaborPercent: 13.2,
    moveLaborPercent: 23.8,
    junkRevenue: 2100,
    moveRevenue: 2200,
  },
  {
    date: '2024-01-03',
    junkLaborPercent: 11.8,
    moveLaborPercent: 21.5,
    junkRevenue: 2800,
    moveRevenue: 1900,
  },
  {
    date: '2024-01-04',
    junkLaborPercent: 14.1,
    moveLaborPercent: 25.2,
    junkRevenue: 1900,
    moveRevenue: 1600,
  },
  {
    date: '2024-01-05',
    junkLaborPercent: 13.7,
    moveLaborPercent: 23.9,
    junkRevenue: 2300,
    moveRevenue: 2100,
  },
  {
    date: '2024-01-06',
    junkLaborPercent: 12.9,
    moveLaborPercent: 22.7,
    junkRevenue: 2600,
    moveRevenue: 2000,
  },
  {
    date: '2024-01-07',
    junkLaborPercent: 13.5,
    moveLaborPercent: 24.1,
    junkRevenue: 2200,
    moveRevenue: 1800,
  },
];

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

export function ChartAreaInteractive({
  title,
  description,
  data = sampleChartData,
}: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('7d');
  const [jobType, setJobType] = React.useState('both');

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('7d');
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    // Filter by time range
    const now = new Date();
    let daysToSubtract = 7;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '14d') {
      daysToSubtract = 14;
    }

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [data, timeRange]);

  return (
    <Card className="@container/card hunk-gradient-bg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-hunks-green">{title}</CardTitle>
            <CardDescription>
              <span className="hidden @[540px]/card:block">{description}</span>
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
              <SelectValue placeholder="Last 7 days" />
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
