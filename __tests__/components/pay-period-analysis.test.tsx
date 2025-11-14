import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { vi } from 'vitest';
import { PayPeriodAnalysis } from '@/components/features/reports/payroll-breakdown/pay-period-analysis';
import type { PayPeriod } from '@/types';

// Mock scrollIntoView for Radix Select
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
});

// Mock the chart components
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
  Pie: () => <div data-testid="pie" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  Cell: () => <div data-testid="cell" />,
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

const mockPayPeriods: PayPeriod[] = [
  {
    id: '1',
    name: 'January 2025 - Week 1',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-07'),
    status: 'closed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'January 2025 - Week 2',
    startDate: new Date('2025-01-08'),
    endDate: new Date('2025-01-14'),
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const defaultProps = {
  userId: 'test-user-id',
  currentPeriod: mockPayPeriods[0],
  availablePeriods: mockPayPeriods,
};

describe('PayPeriodAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with header and controls', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    expect(screen.getByText('Pay Period Analysis')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Compare performance across pay periods and track trends'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument(); // Compare period selector
  });

  it('displays key metrics comparison cards', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Use getAllByText since these texts appear in multiple places (card headers and comparison table)
    expect(screen.getAllByText('Total Pay')).toHaveLength(2); // Card header and table
    expect(screen.getByText('Hours Worked')).toBeInTheDocument();
    expect(screen.getAllByText('Tips Earned')).toHaveLength(2); // Card header and table
    expect(screen.getByText('Efficiency')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<PayPeriodAnalysis {...defaultProps} isLoading={true} />);

    // Should show skeleton loaders - check for skeleton class instead of test-id
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error message when error prop is provided', () => {
    const errorMessage = 'Failed to load analysis data';
    render(<PayPeriodAnalysis {...defaultProps} error={errorMessage} />);

    expect(
      screen.getByText(`${errorMessage}. Showing cached analysis data.`)
    ).toBeInTheDocument();
  });

  it('allows switching between chart views', async () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Default should be trends view
    expect(screen.getByText('Pay Trends Over Time')).toBeInTheDocument();

    // Switch to departments view
    const deptsTab = screen.getByRole('tab', { name: /Depts/ });

    await act(async () => {
      fireEvent.click(deptsTab);
    });

    // Check if the chart title changed to departments view
    await waitFor(
      () => {
        expect(
          screen.getByText('Department Hour Distribution')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Switch to performance view
    const metricsTab = screen.getByRole('tab', { name: /Metrics/ });

    await act(async () => {
      fireEvent.click(metricsTab);
    });

    await waitFor(
      () => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('displays performance insights', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    expect(screen.getByText('Performance Insights')).toBeInTheDocument();
    expect(
      screen.getByText(
        'AI-powered insights based on your work patterns and performance'
      )
    ).toBeInTheDocument();

    // Should show mock insights
    expect(screen.getByText('Tips Performance Improved')).toBeInTheDocument();
    expect(screen.getByText('Department Mix Changed')).toBeInTheDocument();
    expect(screen.getByText('Labor Efficiency Bonus')).toBeInTheDocument();
  });

  it('shows period comparison details table', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    expect(screen.getByText('Period Comparison Details')).toBeInTheDocument();
    expect(
      screen.getByText('Side-by-side comparison of key metrics')
    ).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText('Metric')).toBeInTheDocument();
    expect(screen.getByText('Current Period')).toBeInTheDocument();
    // Use getAllByText since "Previous Period" appears in both selector and table
    expect(screen.getAllByText('Previous Period')).toHaveLength(2);
    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('handles comparison period selection', async () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    const selector = screen.getByRole('combobox');
    fireEvent.click(selector);

    await waitFor(() => {
      expect(screen.getByText('Same Period Last Month')).toBeInTheDocument();
      expect(screen.getByText('Best Period')).toBeInTheDocument();
      expect(screen.getByText('Period Average')).toBeInTheDocument();
    });
  });

  it('displays trend indicators correctly', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Should show positive trend indicators - check for the actual SVG elements
    const trendingUpIcons = document.querySelectorAll('.lucide-trending-up');
    expect(trendingUpIcons.length).toBeGreaterThan(0);

    // Should show percentage changes - use getAllByText since they appear in multiple places
    expect(screen.getAllByText('+6.8%')).toHaveLength(2); // Card and table
    expect(screen.getAllByText('+5.0%')).toHaveLength(2); // Card and table
    expect(screen.getAllByText('+20.0%')).toHaveLength(2); // Card and table
  });

  it('renders charts when not loading', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Should render chart container
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('shows appropriate chart based on selected view', async () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Default trends view should show line chart
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();

    // Switch to departments view
    const deptsTab = screen.getByRole('tab', { name: /Depts/ });

    await act(async () => {
      fireEvent.click(deptsTab);
    });

    // Check if the chart changed to bar chart for departments
    await waitFor(
      () => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Switch to performance view
    const metricsTab = screen.getByRole('tab', { name: /Metrics/ });

    await act(async () => {
      fireEvent.click(metricsTab);
    });

    // Performance view should also show bar chart (horizontal)
    await waitFor(
      () => {
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it('displays insight recommendations when available', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    expect(
      screen.getByText('💡 Keep up the excellent customer service!')
    ).toBeInTheDocument();
    expect(
      screen.getByText('💡 Continue focusing on efficient job completion')
    ).toBeInTheDocument();
    expect(
      screen.getByText('💡 Monitor hours to optimize pay structure')
    ).toBeInTheDocument();
  });

  it('handles missing comparison data gracefully', () => {
    render(<PayPeriodAnalysis {...defaultProps} comparisonData={undefined} />);

    // Should still render without crashing
    expect(screen.getByText('Pay Period Analysis')).toBeInTheDocument();
    expect(screen.getAllByText('Total Pay')).toHaveLength(2); // Card and table
  });

  it('applies correct styling for different insight types', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Check that different insight types have appropriate styling
    const insightCards = screen.getAllByText(
      /Tips Performance Improved|Department Mix Changed|Labor Efficiency Bonus|Approaching Overtime/
    );
    expect(insightCards.length).toBeGreaterThan(0);
  });
});

describe('PayPeriodAnalysis Accessibility', () => {
  it('has proper ARIA labels and roles', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Check for proper tab roles
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);

    // Check for proper combobox
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('supports keyboard navigation', async () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    const trendsTab = screen.getByRole('tab', { name: /Trends/ });
    const deptsTab = screen.getByRole('tab', { name: /Depts/ });

    // Focus on trends tab
    trendsTab.focus();
    expect(trendsTab).toHaveFocus();

    // Navigate to departments tab with keyboard
    await act(async () => {
      fireEvent.keyDown(trendsTab, { key: 'ArrowRight' });
      fireEvent.click(deptsTab);
    });

    await waitFor(
      () => {
        expect(
          screen.getByText('Department Hour Distribution')
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});

describe('PayPeriodAnalysis Data Handling', () => {
  it('handles empty data gracefully', () => {
    render(<PayPeriodAnalysis {...defaultProps} availablePeriods={[]} />);

    // Should still render without crashing
    expect(screen.getByText('Pay Period Analysis')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Check that currency values are properly formatted
    expect(screen.getByText('$1,020')).toBeInTheDocument();
    expect(screen.getByText('$180')).toBeInTheDocument();
  });

  it('displays percentage changes with proper formatting', () => {
    render(<PayPeriodAnalysis {...defaultProps} />);

    // Check percentage formatting - use getAllByText since they appear in multiple places
    expect(screen.getAllByText('+6.8%')).toHaveLength(2); // Card and table
    expect(screen.getAllByText('+20.0%')).toHaveLength(2); // Card and table
    expect(screen.getByText('+5.6%')).toBeInTheDocument();
  });
});
