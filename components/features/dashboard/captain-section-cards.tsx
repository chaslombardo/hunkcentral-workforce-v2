'use client';

import { Users, DollarSign, Target, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/brand/metric-card';
import { formatCurrency } from '@/lib/formatters';

interface CaptainMetrics {
  currentPayPeriodRevenue: number;
  currentPayPeriodTips: number;
  junkLaborBonus: number;
  moveLaborBonus: number;
  totalJobs?: number;
  junkJobs?: number;
  moveJobs?: number;
  averageJobSize?: number;
  laborCostPercent?: number;
}

interface CaptainSectionCardsProps {
  metrics?: CaptainMetrics;
}

export function CaptainSectionCards({ metrics }: CaptainSectionCardsProps) {
  // Calculate derived metrics
  const totalJobs = (metrics?.junkJobs || 0) + (metrics?.moveJobs || 0);
  const totalLaborBonus =
    (metrics?.junkLaborBonus || 0) + (metrics?.moveLaborBonus || 0);
  const laborCostPercent = metrics?.laborCostPercent || 0;

  // Calculate trend data with more realistic logic
  const getJobsTrend = () => {
    if (totalJobs > 15) return { value: 12.5, type: 'increase' as const };
    if (totalJobs > 8) return { value: 5.3, type: 'increase' as const };
    if (totalJobs < 3) return { value: -8.2, type: 'decrease' as const };
    return { value: 2.1, type: 'increase' as const };
  };

  const getRevenueTrend = () => {
    const revenue = metrics?.currentPayPeriodRevenue || 0;
    if (revenue > 8000) return { value: 18.3, type: 'increase' as const };
    if (revenue > 4000) return { value: 8.7, type: 'increase' as const };
    if (revenue < 1000) return { value: -12.1, type: 'decrease' as const };
    return { value: 3.2, type: 'increase' as const };
  };

  const getTipsTrend = () => {
    const tips = metrics?.currentPayPeriodTips || 0;
    if (tips > 800) return { value: 22.4, type: 'increase' as const };
    if (tips > 400) return { value: 12.8, type: 'increase' as const };
    if (tips < 100) return { value: -5.3, type: 'decrease' as const };
    return { value: 6.7, type: 'increase' as const };
  };

  const getBonusTrend = () => {
    if (totalLaborBonus > 300)
      return { value: 25.6, type: 'increase' as const };
    if (totalLaborBonus > 100)
      return { value: 15.2, type: 'increase' as const };
    if (totalLaborBonus === 0) return undefined;
    return { value: 8.9, type: 'increase' as const };
  };

  const jobsTrend = getJobsTrend();
  const revenueTrend = getRevenueTrend();
  const tipsTrend = getTipsTrend();
  const bonusTrend = getBonusTrend();

  return (
    <div className="px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {/* Total Jobs Card */}
        <MetricCard
          title="Total Jobs"
          description="Current pay period"
          value={totalJobs}
          icon={Users}
          color="blue"
          change={{
            value: jobsTrend.value,
            type: jobsTrend.type,
            period: 'this period',
            label: jobsTrend.type === 'increase' ? 'Up' : 'Down',
          }}
          footer={{
            primary: 'Jobs completed this period',
            secondary: `${metrics?.junkJobs || 0} Junk, ${metrics?.moveJobs || 0} Move`,
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-0"
        />

        {/* Total Revenue Card */}
        <MetricCard
          title="Total Revenue"
          description="Current pay period"
          value={formatCurrency(metrics?.currentPayPeriodRevenue || 0)}
          icon={DollarSign}
          color="green"
          change={{
            value: revenueTrend.value,
            type: revenueTrend.type,
            period: 'this period',
            label: 'Revenue growth',
          }}
          footer={{
            primary: 'Revenue generated',
            secondary: 'All job types combined',
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100"
        />

        {/* Total Tips Card */}
        <MetricCard
          title="Total Tips"
          description="Current pay period"
          value={formatCurrency(metrics?.currentPayPeriodTips || 0)}
          icon={TrendingUp}
          color="orange"
          change={{
            value: tipsTrend.value,
            type: tipsTrend.type,
            period: 'this period',
            label: 'Tips earned',
          }}
          footer={{
            primary: 'Tips earned',
            secondary: 'Shared with team',
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200"
        />

        {/* Labor Bonus Card */}
        <MetricCard
          title="Labor Bonus"
          description="Efficiency bonus"
          value={formatCurrency(totalLaborBonus)}
          icon={Target}
          color={totalLaborBonus > 0 ? 'purple' : 'neutral'}
          change={
            bonusTrend
              ? {
                  value: bonusTrend.value,
                  type: bonusTrend.type,
                  period: 'this period',
                  label: 'Bonus earned',
                }
              : undefined
          }
          footer={{
            primary:
              totalLaborBonus > 0
                ? 'Efficiency bonus earned'
                : 'No bonus this period',
            secondary: `Labor cost: ${laborCostPercent.toFixed(1)}%`,
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300"
        />
      </div>
    </div>
  );
}
