'use client';

import { DollarSign, Target, Calendar, Clock, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/brand/metric-card';
import { formatCurrency } from '@/lib/formatters';

interface SalesMetrics {
  pendingCommissions: number;
  matchedCommissions: number;
}

interface SalesSectionCardsProps {
  metrics?: SalesMetrics;
}

export function SalesSectionCards({ metrics }: SalesSectionCardsProps) {
  // Calculate derived metrics and trends
  const pendingCommissions = metrics?.pendingCommissions || 8;
  const matchedCommissions = metrics?.matchedCommissions || 12;

  // Mock data for display purposes
  const totalCommissionValue = 3450;
  const monthlyTarget = 5000;
  const bookingsPipeline = 24;
  const conversionRate = 68;

  // Calculate performance vs target
  const targetPerformance = (totalCommissionValue / monthlyTarget) * 100;

  // Enhanced trend calculations
  const getCommissionTrend = () => {
    if (totalCommissionValue > 4000)
      return { value: 22.5, type: 'increase' as const };
    if (totalCommissionValue > 2500)
      return { value: 15.2, type: 'increase' as const };
    if (totalCommissionValue < 1000)
      return { value: -18.3, type: 'decrease' as const };
    return { value: 8.7, type: 'increase' as const };
  };

  const getTargetTrend = () => {
    if (targetPerformance > 100)
      return { value: 12.4, type: 'increase' as const };
    if (targetPerformance > 80)
      return { value: 6.3, type: 'increase' as const };
    if (targetPerformance < 50)
      return { value: -15.2, type: 'decrease' as const };
    return { value: 2.1, type: 'increase' as const };
  };

  const getPipelineTrend = () => {
    if (bookingsPipeline > 30)
      return { value: 18.9, type: 'increase' as const };
    if (bookingsPipeline > 20)
      return { value: 12.1, type: 'increase' as const };
    if (bookingsPipeline < 10)
      return { value: -25.3, type: 'decrease' as const };
    return { value: 5.4, type: 'increase' as const };
  };

  const getPendingTrend = () => {
    if (pendingCommissions > 15)
      return { value: 28.3, type: 'increase' as const };
    if (pendingCommissions > 8)
      return { value: 8.5, type: 'increase' as const };
    if (pendingCommissions === 0)
      return { value: -100, type: 'decrease' as const };
    return { value: -12.7, type: 'decrease' as const };
  };

  const commissionTrend = getCommissionTrend();
  const targetTrend = getTargetTrend();
  const pipelineTrend = getPipelineTrend();
  const pendingTrend = getPendingTrend();

  return (
    <div className="px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {/* Commission Earnings Card */}
        <MetricCard
          title="Commission Earnings"
          description="Current pay period"
          value={formatCurrency(totalCommissionValue)}
          icon={DollarSign}
          color="green"
          change={{
            value: commissionTrend.value,
            type: commissionTrend.type,
            period: 'this period',
            label: 'Earnings growth',
          }}
          footer={{
            primary: `${matchedCommissions} matched commissions`,
            secondary: `${pendingCommissions} pending completion`,
          }}
          interactive={true}
          onCardClick={() => (window.location.href = '/commission/list')}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-0"
        />

        {/* Target Progress Card */}
        <MetricCard
          title="Target Progress"
          description="Monthly goal"
          value={`${targetPerformance.toFixed(0)}%`}
          icon={Target}
          color={
            targetPerformance >= 100
              ? 'green'
              : targetPerformance >= 80
                ? 'blue'
                : 'orange'
          }
          change={{
            value: targetTrend.value,
            type: targetTrend.type,
            period: 'vs last month',
            label: 'Progress trend',
          }}
          footer={{
            primary:
              targetPerformance >= 100
                ? 'Target exceeded!'
                : targetPerformance >= 80
                  ? 'On track'
                  : 'Needs attention',
            secondary: `${formatCurrency(monthlyTarget - totalCommissionValue)} to goal`,
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100"
        />

        {/* Booking Pipeline Card */}
        <MetricCard
          title="Booking Pipeline"
          description="Active bookings"
          value={bookingsPipeline}
          icon={Calendar}
          color="purple"
          change={{
            value: pipelineTrend.value,
            type: pipelineTrend.type,
            period: 'this week',
            label: 'Pipeline growth',
          }}
          footer={{
            primary: 'Active opportunities',
            secondary: `${conversionRate}% conversion rate`,
          }}
          interactive={true}
          onCardClick={() => (window.location.href = '/commission/create')}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200"
        />

        {/* Pending Commissions Card */}
        <MetricCard
          title="Pending Commissions"
          description="Awaiting job completion"
          value={pendingCommissions}
          icon={Clock}
          color={
            pendingCommissions > 10
              ? 'orange'
              : pendingCommissions > 0
                ? 'blue'
                : 'green'
          }
          change={
            pendingCommissions > 0
              ? {
                  value: pendingTrend.value,
                  type: pendingTrend.type,
                  period: 'this week',
                  label:
                    pendingTrend.type === 'decrease'
                      ? 'Completed'
                      : 'New pending',
                }
              : undefined
          }
          footer={{
            primary:
              pendingCommissions > 0
                ? 'Waiting for job logs'
                : 'All commissions matched',
            secondary:
              pendingCommissions > 0 ? 'Commission tracking' : 'Great work!',
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300"
        />
      </div>
    </div>
  );
}
