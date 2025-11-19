'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Legend,
} from 'recharts';
import type { CategoricalChartFunc } from 'recharts/types/chart/generateCategoricalChart';
import {
  IconDownload,
  IconFilter,
  IconMaximize,
  IconZoomIn,
  IconZoomOut,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'scatter';

export interface ChartDataPoint {
  [key: string]: unknown;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

export interface ChartFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface UniversalChartProps {
  data: ChartDataPoint[];
  type: ChartType;
  config: ChartConfig;

  // Chart configuration
  title?: string;
  description?: string;
  xAxisKey?: string;
  yAxisKey?: string;

  // Interactive features
  interactive?: boolean;
  zoomable?: boolean;
  brushable?: boolean;

  // Filtering
  filters?: ChartFilter[];
  dateRangeFilter?: boolean;
  categoryFilter?: boolean;
  valueFilter?: boolean;

  // Export
  exportOptions?: ('png' | 'svg' | 'pdf')[];

  // Drill-down capability
  drillDown?: boolean;
  onDrillDown?: (data: ChartDataPoint) => void;

  // Styling
  className?: string;
  height?: number;
  branded?: boolean;

  // Loading state
  loading?: boolean;
}

// College Hunks brand colors
const BRAND_COLORS = {
  primary: '#026937',
  secondary: '#ea7200',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  muted: '#6b7280',
};

const DEFAULT_COLORS = [
  BRAND_COLORS.primary,
  BRAND_COLORS.secondary,
  BRAND_COLORS.success,
  BRAND_COLORS.warning,
  BRAND_COLORS.error,
  BRAND_COLORS.muted,
];

const createDrilldownHandler = (
  onDrillDown?: (data: ChartDataPoint) => void
): CategoricalChartFunc | undefined => {
  if (!onDrillDown) return undefined;
  type DrilldownChartState = {
    activePayload?: Array<{ payload?: ChartDataPoint }>;
  };
  return (chartState) => {
    const typedState = chartState as DrilldownChartState;
    const payload = typedState?.activePayload?.[0]?.payload;
    if (payload && typeof payload === 'object') {
      onDrillDown(payload as ChartDataPoint);
    }
  };
};

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
  config,
}: {
  active?: boolean;
  payload?: { value: unknown; dataKey: string; color?: string }[];
  label?: string;
  config: ChartConfig;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium">{label}</p>
      {payload.map((entry, index) => {
        const configItem = config[entry.dataKey];
        return (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {configItem?.label || entry.dataKey}:
            </span>
            <span className="font-medium">
              {typeof entry.value === 'number'
                ? entry.value.toLocaleString()
                : String(entry.value ?? '')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Chart export functionality
function ChartExportMenu({
  onExport,
  exportOptions = ['png', 'svg', 'pdf'],
}: {
  onExport: (format: string) => void;
  exportOptions?: string[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <IconDownload className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {exportOptions.map((format) => (
          <DropdownMenuItem key={format} onClick={() => onExport(format)}>
            Export as {format.toUpperCase()}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Chart filter controls
function ChartFilters({
  filters,
  values,
  onChange,
}: {
  filters: ChartFilter[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center space-x-2">
      <IconFilter className="h-4 w-4 text-muted-foreground" />
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={values[filter.key] || ''}
          onValueChange={(value) => onChange(filter.key, value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All {filter.label}</SelectItem>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}

// Individual chart components
function LineChartComponent({
  data,
  config,
  xAxisKey,
  onDrillDown,
  branded,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
  xAxisKey?: string;
  onDrillDown?: (data: ChartDataPoint) => void;
  branded?: boolean;
}) {
  const dataKeys = Object.keys(config);
  const drilldownHandler = createDrilldownHandler(onDrillDown);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} onClick={drilldownHandler}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <XAxis
          dataKey={xAxisKey || 'name'}
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <YAxis stroke={branded ? BRAND_COLORS.muted : undefined} />
        <Tooltip content={<CustomTooltip config={config} />} />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={
              config[key].color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
            strokeWidth={2}
            dot={{
              fill:
                config[key].color ||
                DEFAULT_COLORS[index % DEFAULT_COLORS.length],
            }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function BarChartComponent({
  data,
  config,
  xAxisKey,
  onDrillDown,
  branded,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
  xAxisKey?: string;
  onDrillDown?: (data: ChartDataPoint) => void;
  branded?: boolean;
}) {
  const dataKeys = Object.keys(config);
  const drilldownHandler = createDrilldownHandler(onDrillDown);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} onClick={drilldownHandler}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <XAxis
          dataKey={xAxisKey || 'name'}
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <YAxis stroke={branded ? BRAND_COLORS.muted : undefined} />
        <Tooltip content={<CustomTooltip config={config} />} />
        <Legend />
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={
              config[key].color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function AreaChartComponent({
  data,
  config,
  xAxisKey,
  onDrillDown,
  branded,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
  xAxisKey?: string;
  onDrillDown?: (data: ChartDataPoint) => void;
  branded?: boolean;
}) {
  const dataKeys = Object.keys(config);
  const drilldownHandler = createDrilldownHandler(onDrillDown);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} onClick={drilldownHandler}>
        <defs>
          {dataKeys.map((key, index) => (
            <linearGradient
              key={key}
              id={`gradient-${key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={
                  config[key].color ||
                  DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={
                  config[key].color ||
                  DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                }
                stopOpacity={0.1}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <XAxis
          dataKey={xAxisKey || 'name'}
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <YAxis stroke={branded ? BRAND_COLORS.muted : undefined} />
        <Tooltip content={<CustomTooltip config={config} />} />
        <Legend />
        {dataKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={
              config[key].color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
            fill={`url(#gradient-${key})`}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PieChartComponent({
  data,
  config,
  onDrillDown,
  branded,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
  onDrillDown?: (data: ChartDataPoint) => void;
  branded?: boolean;
}) {
  const dataKey = Object.keys(config)[0] || 'value';
  const pieColors = branded
    ? [BRAND_COLORS.primary, BRAND_COLORS.secondary, '#059669', '#f97316']
    : DEFAULT_COLORS;
  const drilldownHandler = createDrilldownHandler(onDrillDown);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart onClick={drilldownHandler}>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={pieColors[index % pieColors.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip config={config} />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function ScatterChartComponent({
  data,
  config,
  xAxisKey,
  yAxisKey,
  onDrillDown,
  branded,
}: {
  data: ChartDataPoint[];
  config: ChartConfig;
  xAxisKey?: string;
  yAxisKey?: string;
  onDrillDown?: (data: ChartDataPoint) => void;
  branded?: boolean;
}) {
  const dataKeys = Object.keys(config);
  const drilldownHandler = createDrilldownHandler(onDrillDown);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart data={data} onClick={drilldownHandler}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <XAxis
          dataKey={xAxisKey || 'x'}
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <YAxis
          dataKey={yAxisKey || 'y'}
          stroke={branded ? BRAND_COLORS.muted : undefined}
        />
        <Tooltip content={<CustomTooltip config={config} />} />
        <Legend />
        {dataKeys.map((key, index) => (
          <Scatter
            key={key}
            dataKey={key}
            fill={
              config[key].color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]
            }
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export function UniversalChart({
  data,
  type,
  config,
  title,
  description,
  xAxisKey,
  yAxisKey,
  interactive = true,
  zoomable = false,
  filters = [],
  exportOptions = ['png', 'svg', 'pdf'],
  drillDown = false,
  onDrillDown,
  className,
  height = 400,
  branded = true,
  loading = false,
}: UniversalChartProps) {
  const [filterValues, setFilterValues] = React.useState<
    Record<string, string>
  >({});
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Filter data based on current filter values
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filterValues).every(([key, value]) => {
        if (!value) return true;
        return item[key] === value;
      });
    });
  }, [data, filterValues]);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = (format: string) => {
    // Implementation would depend on the specific export library
    console.warn(`Exporting chart as ${format}`);
  };

  const handleDrillDown = (data: ChartDataPoint) => {
    if (drillDown && onDrillDown) {
      onDrillDown(data);
    }
  };

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading chart...</div>
        </div>
      );
    }

    switch (type) {
      case 'line':
        return (
          <LineChartComponent
            data={filteredData}
            config={config}
            xAxisKey={xAxisKey}
            onDrillDown={handleDrillDown}
            branded={branded}
          />
        );
      case 'bar':
        return (
          <BarChartComponent
            data={filteredData}
            config={config}
            xAxisKey={xAxisKey}
            onDrillDown={handleDrillDown}
            branded={branded}
          />
        );
      case 'area':
        return (
          <AreaChartComponent
            data={filteredData}
            config={config}
            xAxisKey={xAxisKey}
            onDrillDown={handleDrillDown}
            branded={branded}
          />
        );
      case 'pie':
        return (
          <PieChartComponent
            data={filteredData}
            config={config}
            onDrillDown={handleDrillDown}
            branded={branded}
          />
        );
      case 'scatter':
        return (
          <ScatterChartComponent
            data={filteredData}
            config={config}
            xAxisKey={xAxisKey}
            yAxisKey={yAxisKey}
            onDrillDown={handleDrillDown}
            branded={branded}
          />
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <Card
      className={cn(
        'w-full',
        branded && 'border-hunks-green-200',
        isFullscreen && 'fixed inset-0 z-50 rounded-none',
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          {title && (
            <CardTitle
              className={cn(
                'text-lg font-semibold',
                branded && 'text-hunks-green-800'
              )}
            >
              {title}
            </CardTitle>
          )}
          {description && <CardDescription>{description}</CardDescription>}
        </div>

        <div className="flex items-center space-x-2">
          {filters.length > 0 && (
            <ChartFilters
              filters={filters}
              values={filterValues}
              onChange={handleFilterChange}
            />
          )}

          {interactive && (
            <>
              {zoomable && (
                <>
                  <Button variant="outline" size="sm">
                    <IconZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <IconZoomOut className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <IconMaximize className="h-4 w-4" />
              </Button>
            </>
          )}

          {exportOptions.length > 0 && (
            <ChartExportMenu
              onExport={handleExport}
              exportOptions={exportOptions}
            />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
}
