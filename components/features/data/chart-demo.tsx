'use client';

import * as React from 'react';
import {
  UniversalChart,
  type ChartConfig,
  type ChartDataPoint,
  type ChartFilter,
} from './universal-chart';

// Sample data for different chart types
const laborCostData: ChartDataPoint[] = [
  { date: '2024-01-01', junkLabor: 12.5, moveLabor: 22.0, target: 14 },
  { date: '2024-01-02', junkLabor: 15.2, moveLabor: 25.5, target: 14 },
  { date: '2024-01-03', junkLabor: 11.8, moveLabor: 21.2, target: 14 },
  { date: '2024-01-04', junkLabor: 13.9, moveLabor: 23.8, target: 14 },
  { date: '2024-01-05', junkLabor: 10.5, moveLabor: 19.5, target: 14 },
  { date: '2024-01-06', junkLabor: 14.2, moveLabor: 24.1, target: 14 },
  { date: '2024-01-07', junkLabor: 12.1, moveLabor: 20.8, target: 14 },
];

const revenueData: ChartDataPoint[] = [
  { month: 'Jan', junk: 45000, move: 32000, tips: 8500 },
  { month: 'Feb', junk: 52000, move: 38000, tips: 9200 },
  { month: 'Mar', junk: 48000, move: 35000, tips: 8800 },
  { month: 'Apr', junk: 58000, move: 42000, tips: 10500 },
  { month: 'May', junk: 62000, move: 45000, tips: 11200 },
  { month: 'Jun', junk: 55000, move: 40000, tips: 9800 },
];

const performanceData: ChartDataPoint[] = [
  { captain: 'John S.', efficiency: 85, revenue: 12500, jobs: 24 },
  { captain: 'Sarah J.', efficiency: 92, revenue: 15200, jobs: 28 },
  { captain: 'Mike W.', efficiency: 78, revenue: 11800, jobs: 22 },
  { captain: 'Emily D.', efficiency: 88, revenue: 13900, jobs: 26 },
  { captain: 'David B.', efficiency: 95, revenue: 16800, jobs: 32 },
];

const departmentData: ChartDataPoint[] = [
  { name: 'Junk Removal', value: 65, revenue: 285000 },
  { name: 'Moving', value: 30, revenue: 132000 },
  { name: 'Other Services', value: 5, revenue: 22000 },
];

// Chart configurations
const laborCostConfig: ChartConfig = {
  junkLabor: {
    label: 'Junk Labor %',
    color: '#026937',
  },
  moveLabor: {
    label: 'Move Labor %',
    color: '#ea7200',
  },
  target: {
    label: 'Target',
    color: '#6b7280',
  },
};

const revenueConfig: ChartConfig = {
  junk: {
    label: 'Junk Revenue',
    color: '#026937',
  },
  move: {
    label: 'Move Revenue',
    color: '#ea7200',
  },
  tips: {
    label: 'Tips',
    color: '#10b981',
  },
};

const performanceConfig: ChartConfig = {
  efficiency: {
    label: 'Efficiency Score',
    color: '#026937',
  },
  revenue: {
    label: 'Revenue',
    color: '#ea7200',
  },
};

const departmentConfig: ChartConfig = {
  value: {
    label: 'Percentage',
    color: '#026937',
  },
};

// Chart filters
const timeFilters: ChartFilter[] = [
  {
    key: 'period',
    label: 'Time Period',
    options: [
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: 'quarter', label: 'This Quarter' },
      { value: 'year', label: 'This Year' },
    ],
  },
];

const departmentFilters: ChartFilter[] = [
  {
    key: 'department',
    label: 'Department',
    options: [
      { value: 'junk', label: 'Junk Removal' },
      { value: 'move', label: 'Moving' },
      { value: 'other', label: 'Other Services' },
    ],
  },
];

export function ChartDemo() {
  const handleDrillDown = (data: ChartDataPoint) => {
    console.log('Drill down data:', data);
    // In a real app, this would navigate to a detailed view
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-hunks-green-800 mb-2">
          Interactive Charts Demo
        </h2>
        <p className="text-muted-foreground">
          Examples of the Universal Chart component with different chart types
          and interactive features
        </p>
      </div>

      {/* Labor Cost Trend - Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UniversalChart
          data={laborCostData}
          type="line"
          config={laborCostConfig}
          title="Labor Cost Trends"
          description="Track labor cost percentages over time"
          xAxisKey="date"
          interactive={true}
          zoomable={true}
          filters={timeFilters}
          exportOptions={['png', 'svg', 'pdf']}
          drillDown={true}
          onDrillDown={handleDrillDown}
          height={300}
          branded={true}
        />

        {/* Revenue by Month - Bar Chart */}
        <UniversalChart
          data={revenueData}
          type="bar"
          config={revenueConfig}
          title="Monthly Revenue"
          description="Revenue breakdown by service type"
          xAxisKey="month"
          interactive={true}
          filters={timeFilters}
          exportOptions={['png', 'svg', 'pdf']}
          drillDown={true}
          onDrillDown={handleDrillDown}
          height={300}
          branded={true}
        />
      </div>

      {/* Revenue Area Chart */}
      <UniversalChart
        data={revenueData}
        type="area"
        config={revenueConfig}
        title="Revenue Trends"
        description="Cumulative revenue trends over time"
        xAxisKey="month"
        interactive={true}
        zoomable={true}
        brushable={true}
        filters={timeFilters}
        exportOptions={['png', 'svg', 'pdf']}
        drillDown={true}
        onDrillDown={handleDrillDown}
        height={400}
        branded={true}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution - Pie Chart */}
        <UniversalChart
          data={departmentData}
          type="pie"
          config={departmentConfig}
          title="Revenue by Department"
          description="Distribution of revenue across departments"
          interactive={true}
          filters={departmentFilters}
          exportOptions={['png', 'svg', 'pdf']}
          drillDown={true}
          onDrillDown={handleDrillDown}
          height={350}
          branded={true}
        />

        {/* Performance Scatter Plot */}
        <UniversalChart
          data={performanceData}
          type="scatter"
          config={performanceConfig}
          title="Captain Performance"
          description="Efficiency vs Revenue correlation"
          xAxisKey="efficiency"
          yAxisKey="revenue"
          interactive={true}
          filters={[
            {
              key: 'minEfficiency',
              label: 'Min Efficiency',
              options: [
                { value: '70', label: '70%+' },
                { value: '80', label: '80%+' },
                { value: '90', label: '90%+' },
              ],
            },
          ]}
          exportOptions={['png', 'svg', 'pdf']}
          drillDown={true}
          onDrillDown={handleDrillDown}
          height={350}
          branded={true}
        />
      </div>

      {/* Chart Usage Examples */}
      <div className="mt-12 p-6 bg-hunks-green-50 rounded-lg border border-hunks-green-200">
        <h3 className="text-lg font-semibold text-hunks-green-800 mb-4">
          Chart Features Demonstrated
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-hunks-green-700 mb-2">
              Interactive Features
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Zoom and pan controls</li>
              <li>• Hover tooltips</li>
              <li>• Click-to-drill-down</li>
              <li>• Fullscreen mode</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-hunks-green-700 mb-2">Filtering</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Time period filters</li>
              <li>• Department filters</li>
              <li>• Performance thresholds</li>
              <li>• Dynamic data updates</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-hunks-green-700 mb-2">
              Export Options
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• PNG image export</li>
              <li>• SVG vector export</li>
              <li>• PDF document export</li>
              <li>• Print-friendly layouts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
