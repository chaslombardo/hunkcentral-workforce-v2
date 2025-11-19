'use client';

import { Clock, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { MetricCard } from '@/components/brand/metric-card';

interface ManagerMetrics {
  logsAwaitingReview: number;
  recentApprovals: number;
}

interface ManagerSectionCardsProps {
  metrics?: ManagerMetrics;
}

export function ManagerSectionCards({ metrics }: ManagerSectionCardsProps) {
  // Calculate derived metrics and trends
  const pendingLogs = metrics?.logsAwaitingReview || 0;
  const recentApprovals = metrics?.recentApprovals || 0;

  // Mock data for display purposes
  const teamEfficiency = 87;
  const exceptionAlerts = 3;

  // Enhanced trend calculations
  const getPendingTrend = () => {
    if (pendingLogs > 15) return { value: 18.2, type: 'increase' as const };
    if (pendingLogs > 8) return { value: 8.3, type: 'increase' as const };
    if (pendingLogs === 0) return { value: -100, type: 'decrease' as const };
    return { value: -12.1, type: 'decrease' as const };
  };

  const getApprovalsTrend = () => {
    if (recentApprovals > 30) return { value: 25.5, type: 'increase' as const };
    if (recentApprovals > 15) return { value: 12.8, type: 'increase' as const };
    if (recentApprovals < 5) return { value: -15.2, type: 'decrease' as const };
    return { value: 5.3, type: 'increase' as const };
  };

  const getEfficiencyTrend = () => {
    if (teamEfficiency > 90) return { value: 8.1, type: 'increase' as const };
    if (teamEfficiency > 85) return { value: 3.2, type: 'increase' as const };
    if (teamEfficiency < 75) return { value: -6.8, type: 'decrease' as const };
    return { value: 1.4, type: 'increase' as const };
  };

  const getAlertsTrend = () => {
    if (exceptionAlerts > 8) return { value: 35.6, type: 'increase' as const };
    if (exceptionAlerts > 3) return { value: 12.4, type: 'increase' as const };
    if (exceptionAlerts <= 0) return { value: -100, type: 'decrease' as const };
    return { value: -25.3, type: 'decrease' as const };
  };

  const pendingTrend = getPendingTrend();
  const approvalsTrend = getApprovalsTrend();
  const efficiencyTrend = getEfficiencyTrend();
  const alertsTrend = getAlertsTrend();

  return (
    <div className="px-4 lg:px-6">
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {/* Pending Approvals Card */}
        <MetricCard
          title="Pending Approvals"
          description="Logs awaiting review"
          value={pendingLogs}
          icon={Clock}
          color={
            pendingLogs > 10 ? 'orange' : pendingLogs > 0 ? 'blue' : 'green'
          }
          change={{
            value: pendingTrend.value,
            type: pendingTrend.type,
            period: 'this week',
            label: pendingTrend.type === 'decrease' ? 'Resolved' : 'Pending',
          }}
          footer={{
            primary:
              pendingLogs > 0 ? 'Requires your attention' : 'All caught up!',
            secondary: `${recentApprovals} approved this week`,
          }}
          interactive={pendingLogs > 0}
          onCardClick={
            pendingLogs > 0
              ? () => (window.location.href = '/logs/review')
              : undefined
          }
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-0"
        />

        {/* Team Performance Card */}
        <MetricCard
          title="Team Performance"
          description="Average efficiency"
          value={`${teamEfficiency}%`}
          icon={Users}
          color={
            teamEfficiency > 85
              ? 'green'
              : teamEfficiency > 75
                ? 'orange'
                : 'neutral'
          }
          change={{
            value: efficiencyTrend.value,
            type: efficiencyTrend.type,
            period: 'this month',
            label: 'Efficiency trend',
          }}
          footer={{
            primary: teamEfficiency > 85 ? 'Above target' : 'Needs attention',
            secondary: '12 team members',
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-100"
        />

        {/* Recent Approvals Card */}
        <MetricCard
          title="Recent Approvals"
          description="Last 7 days"
          value={recentApprovals}
          icon={CheckCircle}
          color="blue"
          change={{
            value: approvalsTrend.value,
            type: approvalsTrend.type,
            period: 'last week',
            label: 'Processing trend',
          }}
          footer={{
            primary: 'Logs processed',
            secondary: 'Avg 45s per review',
          }}
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200"
        />

        {/* Exception Alerts Card */}
        <MetricCard
          title="Exception Alerts"
          description="Requires attention"
          value={exceptionAlerts}
          icon={AlertTriangle}
          color={
            exceptionAlerts > 5
              ? 'orange'
              : exceptionAlerts > 0
                ? 'blue'
                : 'green'
          }
          change={
            exceptionAlerts > 0
              ? {
                  value: alertsTrend.value,
                  type: alertsTrend.type,
                  period: 'this week',
                  label:
                    alertsTrend.type === 'decrease' ? 'Resolved' : 'New alerts',
                }
              : undefined
          }
          footer={{
            primary: exceptionAlerts > 0 ? 'Active alerts' : 'No alerts',
            secondary:
              exceptionAlerts > 0
                ? 'System notifications'
                : 'All systems normal',
          }}
          interactive={exceptionAlerts > 0}
          onCardClick={
            exceptionAlerts > 0
              ? () => (window.location.href = '/admin/alerts')
              : undefined
          }
          className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300"
        />
      </div>
    </div>
  );
}
