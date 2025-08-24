'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Database,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Zap,
  Loader2,
} from 'lucide-react';
import { RealTimePerformance } from './real-time-performance';
import {
  getPerformanceDashboard,
  getPerformanceTrends,
  generatePerformanceReport,
  getPerformanceAlerts,
  clearPerformanceAlerts,
  getDatabaseAlerts,
  resolveDatabaseAlert,
  triggerDatabaseMonitoring,
} from '@/lib/actions/performance';

interface PerformanceData {
  performance: {
    pageLoad: {
      average: number;
      p95: number;
      slowPages: Array<{ page: string; averageTime: number }>;
    };
    interactions: {
      average: number;
      p95: number;
      slowInteractions: Array<{
        component: string;
        action: string;
        averageTime: number;
      }>;
    };
    database: {
      average: number;
      slowQueries: number;
      totalQueries: number;
    };
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      metrics: any[];
    };
    alerts: any[];
  };
  database: any;
  cache: any;
  backgroundJobs: any;
  recommendations: string[];
  databaseHealth?: {
    health: 'good' | 'warning' | 'critical';
    activeAlerts: number;
    recommendations: string[];
    queryStats: {
      totalQueries: number;
      averageTime: number;
      slowQueries: number;
    };
  };
  timestamp: string;
}

export function PerformanceMonitor() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch performance data
  const fetchData = async () => {
    try {
      setError(null);
      const [dashboardResult, trendsResult] = await Promise.all([
        getPerformanceDashboard(),
        getPerformanceTrends(7),
      ]);

      if (dashboardResult.success) {
        setData(dashboardResult.data);
      } else {
        setError(dashboardResult.error || 'Failed to fetch dashboard data');
      }

      if (trendsResult.success) {
        setTrends(trendsResult.data);
      }

      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle actions
  const handleAction = async (action: string, actionFn: () => Promise<any>) => {
    setActionLoading(action);
    setError(null);

    try {
      const result = await actionFn();
      if (!result.success) {
        setError(result.error || `Failed to ${action}`);
      } else {
        // Refresh data after action
        setTimeout(fetchData, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'healthy':
        return { color: 'text-green-500', icon: CheckCircle, badge: 'default' };
      case 'warning':
        return {
          color: 'text-yellow-500',
          icon: AlertTriangle,
          badge: 'secondary',
        };
      case 'critical':
        return { color: 'text-red-500', icon: XCircle, badge: 'destructive' };
      default:
        return { color: 'text-gray-500', icon: Activity, badge: 'outline' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading performance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance Monitor
              </CardTitle>
              <CardDescription>
                Real-time system performance monitoring and optimization
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>

        {error && (
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {data && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="real-time">Real-Time</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {data.performance.alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {data.performance.alerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Page Load Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Page Load
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(data.performance.pageLoad.average)}ms
                  </div>
                  <div className="text-xs text-muted-foreground">
                    P95: {Math.round(data.performance.pageLoad.p95)}ms
                  </div>
                  <Progress
                    value={Math.min(
                      (data.performance.pageLoad.average / 3000) * 100,
                      100
                    )}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* Interaction Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Interactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(data.performance.interactions.average)}ms
                  </div>
                  <div className="text-xs text-muted-foreground">
                    P95: {Math.round(data.performance.interactions.p95)}ms
                  </div>
                  <Progress
                    value={Math.min(
                      (data.performance.interactions.average / 500) * 100,
                      100
                    )}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* Database Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(data.performance.database.average)}ms
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data.performance.database.slowQueries} slow queries
                  </div>
                  <Progress
                    value={Math.min(
                      (data.performance.database.average / 1000) * 100,
                      100
                    )}
                    className="mt-2"
                  />
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const status = getStatusDisplay(
                        data.performance.systemHealth.status
                      );
                      const StatusIcon = status.icon;
                      return (
                        <>
                          <StatusIcon className={`h-6 w-6 ${status.color}`} />
                          <Badge variant={status.badge as any}>
                            {data.performance.systemHealth.status}
                          </Badge>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleAction('generate-report', generatePerformanceReport)
                    }
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === 'generate-report' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Generate Report
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() =>
                      handleAction('clear-alerts', clearPerformanceAlerts)
                    }
                    disabled={
                      actionLoading !== null ||
                      data.performance.alerts.length === 0
                    }
                  >
                    {actionLoading === 'clear-alerts' ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Clear Alerts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-Time Tab */}
          <TabsContent value="real-time" className="space-y-4">
            <RealTimePerformance />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Slow Pages */}
              <Card>
                <CardHeader>
                  <CardTitle>Slow Pages</CardTitle>
                  <CardDescription>
                    Pages with load times above threshold
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.performance.pageLoad.slowPages.length > 0 ? (
                    <div className="space-y-2">
                      {data.performance.pageLoad.slowPages.map(
                        (page, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <span className="font-medium">{page.page}</span>
                            <Badge variant="outline">
                              {Math.round(page.averageTime)}ms
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No slow pages detected
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Slow Interactions */}
              <Card>
                <CardHeader>
                  <CardTitle>Slow Interactions</CardTitle>
                  <CardDescription>
                    Components with slow response times
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.performance.interactions.slowInteractions.length > 0 ? (
                    <div className="space-y-2">
                      {data.performance.interactions.slowInteractions.map(
                        (interaction, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div>
                              <div className="font-medium">
                                {interaction.component}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {interaction.action}
                              </div>
                            </div>
                            <Badge variant="outline">
                              {Math.round(interaction.averageTime)}ms
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No slow interactions detected
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.performance.database.totalQueries}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Queries
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {data.performance.database.slowQueries}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Slow Queries
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(data.performance.database.average)}ms
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Average Time
                    </div>
                  </div>
                </div>

                {data.recommendations.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="font-medium mb-2">
                        Optimization Recommendations
                      </h3>
                      <div className="space-y-2">
                        {data.recommendations.map((rec, index) => (
                          <Alert key={index}>
                            <Zap className="h-4 w-4" />
                            <AlertDescription>{rec}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.cache.totalMetrics}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cached Metrics
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {data.cache.expiredMetrics}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expired Cache
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.backgroundJobs.initialized ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Background Jobs
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.keys(data.cache.metricsByType).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Metric Types
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Alerts</CardTitle>
                <CardDescription>
                  Recent performance issues and warnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.performance.alerts.length > 0 ? (
                  <div className="space-y-2">
                    {data.performance.alerts.map((alert, index) => (
                      <Alert
                        key={index}
                        variant={
                          alert.severity === 'critical'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <span>{alert.message}</span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  alert.severity === 'critical'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {alert.severity}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No performance alerts</p>
                    <p className="text-sm">System is running smoothly</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Database Health Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Health
                </CardTitle>
                <CardDescription>
                  Database performance monitoring and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Database Health Summary */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          data.databaseHealth?.health === 'good'
                            ? 'bg-green-500'
                            : data.databaseHealth?.health === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      />
                      <span className="font-medium">
                        Database Status:{' '}
                        {data.databaseHealth?.health || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleAction(
                            'trigger-db-monitoring',
                            triggerDatabaseMonitoring
                          )
                        }
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === 'trigger-db-monitoring' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Monitor
                      </Button>
                    </div>
                  </div>

                  {/* Database Performance Metrics */}
                  {data.databaseHealth?.queryStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {data.databaseHealth.queryStats.totalQueries}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Queries
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {Math.round(
                            data.databaseHealth.queryStats.averageTime
                          )}
                          ms
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Avg Response
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-destructive">
                          {data.databaseHealth.queryStats.slowQueries}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Slow Queries
                        </div>
                      </div>
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {data.databaseHealth?.activeAlerts || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Active Alerts
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Database Recommendations */}
                  {data.databaseHealth?.recommendations &&
                    data.databaseHealth.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Recommendations</h4>
                        {data.databaseHealth.recommendations.map(
                          (recommendation, index) => (
                            <Alert key={index}>
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                {recommendation}
                              </AlertDescription>
                            </Alert>
                          )
                        )}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
