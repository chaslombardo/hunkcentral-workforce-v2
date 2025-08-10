'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, ActivityIcon, TrendingUpIcon } from 'lucide-react';
import { format } from 'date-fns';
import { AuditLog } from '@/types';
import { getUserActivitySummary } from '@/lib/actions/audit';
import { cn } from '@/lib/utils';

interface UserActivityMonitorProps {
  userId: string;
  userName: string;
}

export function UserActivityMonitor({ userId, userName }: UserActivityMonitorProps) {
  const [activityData, setActivityData] = useState<{
    totalActions: number;
    actionBreakdown: Record<string, number>;
    entityBreakdown: Record<string, number>;
    recentActivity: AuditLog[];
  }>({
    totalActions: 0,
    actionBreakdown: {},
    entityBreakdown: {},
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const fetchActivityData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUserActivitySummary(userId, startDate, endDate);
      if (result.success) {
        setActivityData(result.data);
      }
    } catch (err) {
      // Only log in development, show user-friendly message in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch user activity:', err);
      }
      // Set error state for user feedback instead of just logging
      setError('Unable to load user activity. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [userId, startDate, endDate]);

  useEffect(() => {
    fetchActivityData();
  }, [fetchActivityData]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-blue-500';
      case 'update':
        return 'bg-yellow-500';
      case 'delete':
        return 'bg-red-500';
      case 'approve':
        return 'bg-green-500';
      case 'submit':
        return 'bg-purple-500';
      case 'reject':
        return 'bg-orange-500';
      case 'match':
        return 'bg-teal-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'daily_log':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'commission_entry':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'user':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pay_period':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatEntityType = (entityType: string) => {
    return entityType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            User Activity Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading activity data...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            User Activity Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Activity Monitor - {userName}
          </CardTitle>
          <CardDescription>
            Track user activity and system interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={fetchActivityData}>
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUpIcon className="h-4 w-4" />
                  Total Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activityData.totalActions}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Action Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(activityData.actionBreakdown).map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getActionColor(action)}`} />
                        <span className="text-sm capitalize">{action}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Entity Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(activityData.entityBreakdown).map(([entityType, count]) => (
                    <div key={entityType} className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={getEntityTypeColor(entityType)}
                      >
                        {formatEntityType(entityType)}
                      </Badge>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest 10 actions performed by this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activityData.recentActivity.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activityData.recentActivity.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${getActionColor(log.action)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={getEntityTypeColor(log.entityType)}
                      >
                        {formatEntityType(log.entityType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {log.entityId ? `${log.entityId.slice(0, 8)}...` : 'N/A'}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss') : 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}