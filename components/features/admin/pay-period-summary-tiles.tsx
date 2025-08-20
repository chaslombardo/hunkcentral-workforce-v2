'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, FileText, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getPayPeriodStats } from '@/lib/actions/pay-periods';

interface PayPeriodStats {
  currentPeriod: {
    name: string;
    status: string;
    daysRemaining: number;
    pendingLogs: number;
  };
  totals: {
    total: number;
    open: number;
    locked: number;
    closed: number;
  };
}

export function PayPeriodSummaryTiles() {
  const [stats, setStats] = useState<PayPeriodStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getPayPeriodStats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Failed to load pay period stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </CardHeader>
            <CardContent>
              <div className="h-4 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'locked':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Current Period Status */}
      <Card className="from-primary/5 to-card bg-gradient-to-t shadow-xs">
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Current Period
          </CardDescription>
          <CardTitle className="text-xl font-semibold">
            {stats.currentPeriod.name}
          </CardTitle>
          <Badge
            className={`w-fit ${getStatusColor(stats.currentPeriod.status)}`}
          >
            {stats.currentPeriod.status === 'none'
              ? 'No Active Period'
              : stats.currentPeriod.status.charAt(0).toUpperCase() +
                stats.currentPeriod.status.slice(1)}
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {stats.currentPeriod.daysRemaining > 0
              ? `${stats.currentPeriod.daysRemaining} days remaining`
              : stats.currentPeriod.status === 'none'
                ? 'No active period'
                : 'Period ended'}
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card className="from-primary/5 to-card bg-gradient-to-t shadow-xs">
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pending Approvals
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.currentPeriod.pendingLogs}
          </CardTitle>
          <Badge variant="outline" className="w-fit">
            <TrendingUp className="h-3 w-3 mr-1" />
            Current Period
          </Badge>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            {stats.currentPeriod.pendingLogs === 0
              ? 'All logs approved'
              : `${stats.currentPeriod.pendingLogs} log${stats.currentPeriod.pendingLogs === 1 ? '' : 's'} awaiting review`}
          </div>
        </CardContent>
      </Card>

      {/* Total Pay Periods */}
      <Card className="from-primary/5 to-card bg-gradient-to-t shadow-xs">
        <CardHeader className="pb-3">
          <CardDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Total Periods
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            {stats.totals.total}
          </CardTitle>
          <div className="flex gap-1">
            <Badge variant="outline" className="text-xs">
              {stats.totals.open} Open
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.totals.locked} Locked
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.totals.closed} Closed
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            Manage payroll periods and data access
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
