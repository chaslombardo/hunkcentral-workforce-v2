/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import {
  UniversalDataTable,
  FilterPanel,
  UniversalChart,
} from '@/components/features/data';

// Mock the chart library
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  PieChart: ({ children }: any) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

// Mock the chart container
vi.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }: any) => (
    <div data-testid="chart-container">{children}</div>
  ),
  ChartTooltip: () => <div data-testid="chart-tooltip" />,
  ChartTooltipContent: () => <div data-testid="chart-tooltip-content" />,
  ChartLegend: () => <div data-testid="chart-legend" />,
  ChartLegendContent: () => <div data-testid="chart-legend-content" />,
}));

describe('Universal Data Components', () => {
  describe('UniversalDataTable', () => {
    const mockData = [
      { id: 1, name: 'John Doe', role: 'Captain', status: 'Active' },
      { id: 2, name: 'Jane Smith', role: 'Wingman', status: 'Active' },
    ];

    const mockColumns = [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'role', header: 'Role' },
      { accessorKey: 'status', header: 'Status' },
    ];

    it('renders without crashing', () => {
      render(
        <UniversalDataTable
          data={mockData}
          columns={mockColumns}
          title="Test Table"
        />
      );

      // Check that the table renders with data
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('displays data correctly', () => {
      render(
        <UniversalDataTable
          data={mockData}
          columns={mockColumns}
          title="Test Table"
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('FilterPanel', () => {
    const mockFilters = [
      {
        key: 'status',
        label: 'Status',
        type: 'select' as const,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    ];

    it('renders without crashing', () => {
      render(
        <FilterPanel filters={mockFilters} values={{}} onChange={() => {}} />
      );

      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  describe('UniversalChart', () => {
    const mockData = [
      { name: 'Jan', value: 100 },
      { name: 'Feb', value: 200 },
      { name: 'Mar', value: 150 },
    ];

    it('renders line chart without crashing', () => {
      render(
        <UniversalChart
          type="line"
          data={mockData}
          title="Test Chart"
          xAxisKey="name"
          yAxisKey="value"
          config={{
            value: {
              label: 'Value',
              color: '#026937',
            },
          }}
        />
      );

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders bar chart without crashing', () => {
      render(
        <UniversalChart
          type="bar"
          data={mockData}
          title="Test Bar Chart"
          xAxisKey="name"
          yAxisKey="value"
          config={{
            value: {
              label: 'Value',
              color: '#026937',
            },
          }}
        />
      );

      expect(screen.getByText('Test Bar Chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });
});
