'use client';

import {
  DollarSign,
  Users,
  ShoppingCart,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react';

import { MetricCard, METRIC_PRESETS } from './metric-card';

export function MetricCardDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Revenue Card - Green theme */}
      <MetricCard
        {...METRIC_PRESETS.revenue}
        value="$45,231"
        icon={DollarSign}
        change={{
          value: 12.5,
          type: 'increase',
          period: 'last 30 days',
          label: 'Up',
        }}
        footer={{
          primary: 'Strong revenue growth',
          secondary: 'Exceeding monthly targets',
        }}
      />

      {/* Customers Card - Blue theme */}
      <MetricCard
        {...METRIC_PRESETS.customers}
        value={1234}
        icon={Users}
        change={{
          value: -5.2,
          type: 'decrease',
          period: 'this month',
          label: 'Down',
        }}
        footer={{
          primary: 'Customer acquisition needs attention',
          secondary: 'Focus on marketing campaigns',
        }}
      />

      {/* Orders Card - Orange theme */}
      <MetricCard
        {...METRIC_PRESETS.orders}
        value={89}
        icon={ShoppingCart}
        change={{
          value: 8.1,
          type: 'increase',
          period: 'this week',
          label: 'Up',
        }}
        footer={{
          primary: 'Order volume increasing',
          secondary: 'Peak season performance',
        }}
      />

      {/* Growth Card - Purple theme */}
      <MetricCard
        {...METRIC_PRESETS.growth}
        value="4.5%"
        icon={TrendingUp}
        change={{
          value: 0,
          type: 'neutral',
          period: 'this quarter',
          label: 'Stable',
        }}
        footer={{
          primary: 'Steady growth maintained',
          secondary: 'Meeting growth projections',
        }}
      />

      {/* Loading State Example */}
      <MetricCard
        title="Loading Metric"
        value=""
        color="green"
        loading={true}
      />

      {/* Custom Metric - Labor Cost */}
      <MetricCard
        title="Labor Cost %"
        description="Current period"
        value="14.2%"
        color="green"
        icon={Target}
        change={{
          value: -2.1,
          type: 'decrease',
          period: 'vs target (16%)',
          label: 'Below target',
        }}
        footer={{
          primary: 'Under labor cost goal',
          secondary: 'Bonus eligible performance',
        }}
      />

      {/* Time-based Metric */}
      <MetricCard
        title="Avg Response Time"
        description="Customer support"
        value="2.3 min"
        color="blue"
        icon={Clock}
        change={{
          value: 15.7,
          type: 'increase',
          period: 'last 7 days',
          label: 'Slower',
        }}
        footer={{
          primary: 'Response time increased',
          secondary: 'Need to optimize support flow',
        }}
      />

      {/* Neutral Metric */}
      <MetricCard
        title="System Status"
        description="Uptime"
        value="99.9%"
        color="neutral"
        footer={{
          primary: 'All systems operational',
          secondary: 'No incidents reported',
        }}
      />
    </div>
  );
}
