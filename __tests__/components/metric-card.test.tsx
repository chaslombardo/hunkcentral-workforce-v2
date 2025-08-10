import { render, screen } from '@testing-library/react'
import { DollarSign, TrendingUp } from 'lucide-react'
import { MetricCard, MetricCardSkeleton, METRIC_PRESETS } from '@/components/brand/metric-card'

describe('MetricCard', () => {
  it('renders basic metric card with title and value', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="$1,234"
      />
    )
    
    expect(screen.getByText('Test Metric')).toBeInTheDocument()
    expect(screen.getByText('$1,234')).toBeInTheDocument()
  })

  it('renders metric card with change indicator', () => {
    render(
      <MetricCard
        title="Revenue"
        value="$45,231"
        change={{
          value: 12.5,
          type: 'increase',
          period: 'last 30 days'
        }}
      />
    )
    
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$45,231')).toBeInTheDocument()
    expect(screen.getByText('+12.5%')).toBeInTheDocument()
  })

  it('renders metric card with icon', () => {
    render(
      <MetricCard
        title="Revenue"
        value="$45,231"
        icon={DollarSign}
        data-testid="metric-card"
      />
    )
    
    const card = screen.getByTestId('metric-card')
    expect(card).toBeInTheDocument()
    expect(screen.getByText('Revenue')).toBeInTheDocument()
  })

  it('renders metric card with footer', () => {
    render(
      <MetricCard
        title="Revenue"
        value="$45,231"
        footer={{
          primary: 'Strong growth',
          secondary: 'Exceeding targets'
        }}
      />
    )
    
    expect(screen.getByText('Strong growth')).toBeInTheDocument()
    expect(screen.getByText('Exceeding targets')).toBeInTheDocument()
  })

  it('applies correct color variant classes', () => {
    const { container } = render(
      <MetricCard
        title="Revenue"
        value="$45,231"
        color="green"
      />
    )
    
    const card = container.querySelector('.border-l-hunks-green')
    expect(card).toBeInTheDocument()
  })

  it('renders loading skeleton when loading prop is true', () => {
    render(
      <MetricCard
        title="Revenue"
        value="$45,231"
        loading={true}
      />
    )
    
    // Should render skeleton elements instead of actual content
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('formats numeric values correctly', () => {
    render(
      <MetricCard
        title="Users"
        value={1234567}
      />
    )
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })

  it('handles negative change values', () => {
    render(
      <MetricCard
        title="Revenue"
        value="$45,231"
        change={{
          value: -5.2,
          type: 'decrease',
          period: 'this month'
        }}
      />
    )
    
    expect(screen.getByText('-5.2%')).toBeInTheDocument()
  })

  it('uses preset configurations correctly', () => {
    render(
      <MetricCard
        {...METRIC_PRESETS.revenue}
        value="$45,231"
      />
    )
    
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Monthly revenue')).toBeInTheDocument()
  })
})

describe('MetricCardSkeleton', () => {
  it('renders skeleton loading state', () => {
    render(<MetricCardSkeleton />)
    
    // Should render skeleton elements
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('applies custom className', () => {
    const { container } = render(
      <MetricCardSkeleton className="custom-class" />
    )
    
    const card = container.querySelector('.custom-class')
    expect(card).toBeInTheDocument()
  })
})