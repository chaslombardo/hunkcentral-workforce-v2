'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
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
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

import type { PayPeriod } from '@/types';
import { formatDateForChart } from '@/lib/formatters';

interface PayrollChartProps {
  selectedPeriod: PayPeriod | null;
}

// Mock chart data - replace with actual payroll data transformation
const chartData = [
  { date: '2025-01-01', totalPay: 45000, hours: 1200, bonuses: 3500 },
  { date: '2025-01-08', totalPay: 48000, hours: 1280, bonuses: 4200 },
  { date: '2025-01-15', totalPay: 52000, hours: 1350, bonuses: 4800 },
  { date: '2025-01-22', totalPay: 49000, hours: 1300, bonuses: 4100 },
  { date: '2025-01-29', totalPay: 51000, hours: 1320, bonuses: 4600 },
];

const chartConfig = {
  totalPay: {
    label: 'Total Pay',
    color: 'var(--primary)',
  },
  hours: {
    label: 'Hours',
    color: 'var(--primary)',
  },
  bonuses: {
    label: 'Bonuses',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;



export function PayrollChart({ selectedPeriod }: PayrollChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState('4w');
  const [chartType, setChartType] = React.useState('totalPay');

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('2w');
    }
  }, [isMobile]);

  const filteredData = React.useMemo(() => {
    // In real implementation, filter based on timeRange and selectedPeriod
    return chartData;
  }, []);

  const formatChartCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatHours = (value: number) => {
    return `${value.toLocaleString()}h`;
  };

  const getChartTitle = () => {
    switch (chartType) {
      case 'totalPay':
        return 'Total Payroll';
      case 'hours':
        return 'Total Hours';
      case 'bonuses':
        return 'Bonuses & Tips';
      default:
        return 'Payroll Analytics';
    }
  };

  const getChartDescription = () => {
    const periodText = selectedPeriod ? selectedPeriod.name : 'Current period';
    return `${getChartTitle()} trends for ${periodText}`;
  };

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{getChartTitle()}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {getChartDescription()}
          </span>
          <span className="@[540px]/card:hidden">Payroll trends</span>
        </CardDescription>
        <CardAction>
          <div className="flex flex-col gap-2 @[767px]/card:flex-row @[767px]/card:items-center">
            {/* Chart Type Selector */}
            <ToggleGroup
              type="single"
              value={chartType}
              onValueChange={setChartType}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-3 @[600px]/card:flex"
            >
              <ToggleGroupItem value="totalPay">Payroll</ToggleGroupItem>
              <ToggleGroupItem value="hours">Hours</ToggleGroupItem>
              <ToggleGroupItem value="bonuses">Bonuses</ToggleGroupItem>
            </ToggleGroup>

            {/* Mobile Chart Type Selector */}
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger
                className="flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[600px]/card:hidden"
                aria-label="Select chart type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="totalPay" className="rounded-lg">
                  Payroll
                </SelectItem>
                <SelectItem value="hours" className="rounded-lg">
                  Hours
                </SelectItem>
                <SelectItem value="bonuses" className="rounded-lg">
                  Bonuses
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Time Range Selector */}
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-3 @[767px]/card:flex"
            >
              <ToggleGroupItem value="4w">4 weeks</ToggleGroupItem>
              <ToggleGroupItem value="2w">2 weeks</ToggleGroupItem>
              <ToggleGroupItem value="1w">1 week</ToggleGroupItem>
            </ToggleGroup>

            {/* Mobile Time Range Selector */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-28 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                aria-label="Select time range"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="4w" className="rounded-lg">
                  4 weeks
                </SelectItem>
                <SelectItem value="2w" className="rounded-lg">
                  2 weeks
                </SelectItem>
                <SelectItem value="1w" className="rounded-lg">
                  1 week
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillTotalPay" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-totalPay)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-totalPay)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-hours)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-hours)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillBonuses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-bonuses)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-bonuses)"
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
                return formatDateForChart(value);
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return formatDateForChart(value);
                  }}
                  indicator="dot"
                  formatter={(value, name) => {
                    if (name === 'totalPay') {
                      return formatChartCurrency(value as number);
                    } else if (name === 'hours') {
                      return formatHours(value as number);
                    } else if (name === 'bonuses') {
                      return formatChartCurrency(value as number);
                    }
                    return value;
                  }}
                />
              }
            />
            {chartType === 'totalPay' && (
              <Area
                dataKey="totalPay"
                type="natural"
                fill="url(#fillTotalPay)"
                stroke="var(--color-totalPay)"
                stackId="a"
              />
            )}
            {chartType === 'hours' && (
              <Area
                dataKey="hours"
                type="natural"
                fill="url(#fillHours)"
                stroke="var(--color-hours)"
                stackId="a"
              />
            )}
            {chartType === 'bonuses' && (
              <Area
                dataKey="bonuses"
                type="natural"
                fill="url(#fillBonuses)"
                stroke="var(--color-bonuses)"
                stackId="a"
              />
            )}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}