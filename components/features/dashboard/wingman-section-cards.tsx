'use client';

import {
  Clock,
  DollarSign,
  TrendingUp,
  Zap,
  Banknote,
  Timer,
} from 'lucide-react';
import { MetricCard } from '@/components/brand/metric-card';
import { formatCurrency } from '@/lib/formatters';

interface WingmanMetrics {
  currentPayPeriodHours: number;
  currentPayPeriodBasePay: number;
  currentPayPeriodTips: number;
  currentPayPeriodOvertimePay: number;
  effectiveHourlyRate: number;
  totalCompensation: number;
  regularHours: number;
  overtimeHours: number;
  averageBaseRate: number;
  tipsPerHour: number;
}

interface WingmanSectionCardsProps {
  metrics?: WingmanMetrics;
}

export function WingmanSectionCards({ metrics }: WingmanSectionCardsProps) {
  // Calculate trends based on metrics
  const getTipsTrend = () => {
    const tips = metrics?.currentPayPeriodTips || 0;
    if (tips > 600) return { value: 28.5, type: 'increase' as const };
    if (tips > 300) return { value: 15.2, type: 'increase' as const };
    if (tips < 50) return { value: -8.3, type: 'decrease' as const };
    return { value: 8.7, type: 'increase' as const };
  };

  const getHoursTrend = () => {
    const hours = metrics?.currentPayPeriodHours || 0;
    if (hours > 70) return { value: 12.3, type: 'increase' as const };
    if (hours > 50) return { value: 6.5, type: 'increase' as const };
    if (hours < 20) return { value: -15.2, type: 'decrease' as const };
    return { value: 3.8, type: 'increase' as const };
  };

  const getCompensationTrend = () => {
    const comp = metrics?.totalCompensation || 0;
    if (comp > 2000) return { value: 18.9, type: 'increase' as const };
    if (comp > 1000) return { value: 10.4, type: 'increase' as const };
    if (comp < 300) return { value: -5.7, type: 'decrease' as const };
    return { value: 7.2, type: 'increase' as const };
  };

  const tipsTrend = getTipsTrend();
  const hoursTrend = getHoursTrend();
  const compensationTrend = getCompensationTrend();

  return (
    <div className="px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {/* HERO CARD: Effective Hourly Rate */}
        <div className="@xl/main:col-span-2 @5xl/main:col-span-1">
          <MetricCard
            title="💰 Effective Hourly Rate"
            description="Base + Tips + Overtime"
            value={formatCurrency(metrics?.effectiveHourlyRate || 0)}
            icon={Zap}
            color="green"
            change={{
              value: 15.3,
              type: 'increase',
              period: 'this period',
              label: 'Total earnings boost',
            }}
            footer={{
              primary: 'Your true earning power',
              secondary: `${formatCurrency(metrics?.averageBaseRate || 0)}/hr base + ${formatCurrency(metrics?.tipsPerHour || 0)}/hr tips`,
            }}
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-0 border-2 border-hunks-green/30 shadow-lg shadow-hunks-green/10"
          />
        </div>

        {/* Total Hours Card */}
        <MetricCard
          title="Total Hours"
          description="Current pay period"
          value={metrics?.currentPayPeriodHours || 0}
          icon={Clock}
          color="blue"
          change={{
            value: hoursTrend.value,
            type: hoursTrend.type,
            period: 'this period',
            label: 'Hours worked',
          }}
          footer={{
            primary: `${metrics?.regularHours || 0} regular`,
            secondary: `${metrics?.overtimeHours || 0} overtime hrs`,
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
            primary: 'Your share of tips',
            secondary: `${formatCurrency(metrics?.tipsPerHour || 0)}/hr avg`,
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200"
        />

        {/* Base Pay Card */}
        <MetricCard
          title="Base Pay"
          description="Current pay period"
          value={formatCurrency(metrics?.currentPayPeriodBasePay || 0)}
          icon={DollarSign}
          color="purple"
          footer={{
            primary: 'Regular hourly wages',
            secondary: `${formatCurrency(metrics?.averageBaseRate || 0)}/hr average`,
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300"
        />

        {/* Overtime Pay Card */}
        <MetricCard
          title="Overtime Pay"
          description="1.5x pay rate"
          value={formatCurrency(metrics?.currentPayPeriodOvertimePay || 0)}
          icon={Timer}
          color={
            (metrics?.currentPayPeriodOvertimePay || 0) > 0
              ? 'green'
              : 'neutral'
          }
          footer={{
            primary:
              (metrics?.overtimeHours || 0) > 0
                ? `${metrics?.overtimeHours} OT hours`
                : 'No overtime',
            secondary: 'Time and a half',
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-400"
        />

        {/* Total Compensation Card */}
        <MetricCard
          title="Total Compensation"
          description="All earnings combined"
          value={formatCurrency(metrics?.totalCompensation || 0)}
          icon={Banknote}
          color="green"
          change={{
            value: compensationTrend.value,
            type: compensationTrend.type,
            period: 'this period',
            label: 'Total earnings',
          }}
          footer={{
            primary: 'Base + Tips + Overtime',
            secondary: 'Current pay period total',
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-500"
        />
      </div>
    </div>
  );
}
