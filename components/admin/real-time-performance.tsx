'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Zap,
  Users,
  Monitor,
} from 'lucide-react';

interface RealTimeMetrics {
  timestamp: string;
  pageLoad: Array<{
    page: string;
    loadTime: number;
    timestamp: Date;
  }>;
  interactions: Array<{
    component: string;
    action: string;
    duration: number;
    timestamp: Date;
  }>;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastCheck: Date;
    issues: string[];
  };
}

export function RealTimePerformance() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/performance/metrics?type=real-time');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Failed to load real-time metrics</p>
            <Button variant="outline" onClick={fetchMetrics} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const avgPageLoad =
    metrics.pageLoad.length > 0
      ? metrics.pageLoad.reduce((sum, metric) => sum + metric.loadTime, 0) /
        metrics.pageLoad.length
      : 0;

  const avgInteractionTime =
    metrics.interactions.length > 0
      ? metrics.interactions.reduce((sum, metric) => sum + metric.duration, 0) /
        metrics.interactions.length
      : 0;

  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Real-Time Performance
          </h2>
          <p className="text-muted-foreground">
            Live system performance metrics updated every 5 seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? 'default' : 'secondary'}>
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Pause' : 'Resume'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            System Health
          </CardTitle>
          <CardDescription>Overall system status and uptime</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div
                className={`h-3 w-3 rounded-full mx-auto mb-2 ${
                  metrics.systemHealth.status === 'healthy'
                    ? 'bg-green-500'
                    : metrics.systemHealth.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
              <div className="font-medium">
                {metrics.systemHealth.status.charAt(0).toUpperCase() +
                  metrics.systemHealth.status.slice(1)}
              </div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {formatUptime(metrics.systemHealth.uptime)}
              </div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {metrics.systemHealth.issues.length}
              </div>
              <div className="text-sm text-muted-foreground">Active Issues</div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {new Date(metrics.systemHealth.lastCheck).toLocaleTimeString()}
              </div>
              <div className="text-sm text-muted-foreground">Last Check</div>
            </div>
          </div>

          {metrics.systemHealth.issues.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Active Issues</h4>
              {metrics.systemHealth.issues.map((issue, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-destructive/10 rounded"
                >
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm">{issue}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Page Load Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Page Load Performance
            </CardTitle>
            <CardDescription>
              Recent page load times (last 5 minutes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Load Time</span>
                <Badge
                  variant={
                    avgPageLoad < 1000
                      ? 'default'
                      : avgPageLoad < 3000
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {Math.round(avgPageLoad)}ms
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Performance Score</span>
                  <span>
                    {Math.max(0, 100 - Math.floor(avgPageLoad / 50))}%
                  </span>
                </div>
                <Progress
                  value={Math.max(0, 100 - Math.floor(avgPageLoad / 50))}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Page Loads</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {metrics.pageLoad.slice(-5).map((load, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                    >
                      <span className="truncate">{load.page}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(load.loadTime)}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Interactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Interactions
            </CardTitle>
            <CardDescription>
              Recent user interactions (last 5 minutes)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Average Response Time
                </span>
                <Badge
                  variant={
                    avgInteractionTime < 100
                      ? 'default'
                      : avgInteractionTime < 300
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {Math.round(avgInteractionTime)}ms
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Interaction Count</span>
                  <span>{metrics.interactions.length}</span>
                </div>
                <Progress
                  value={Math.min(100, metrics.interactions.length * 2)}
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Interactions</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {metrics.interactions.slice(-5).map((interaction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-xs p-2 bg-muted rounded"
                    >
                      <span className="truncate">
                        {interaction.component} - {interaction.action}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(interaction.duration)}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Last updated: {new Date(metrics.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
