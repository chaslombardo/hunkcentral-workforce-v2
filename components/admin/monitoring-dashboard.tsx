/**
 * Monitoring Dashboard Component
 * Provides real-time system health and performance monitoring for administrators
 */

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
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  MemoryStick,
  Server,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';
import type {
  HealthCheck,
  SystemMetrics,
  Alert as MonitoringAlert,
} from '@/lib/monitoring';

interface MonitoringDashboardProps {
  className?: string;
}

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  metrics: SystemMetrics | null;
  activeAlerts: number;
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch monitoring data
  const fetchMonitoringData = async () => {
    try {
      const response = await fetch(
        '/api/health?detailed=true&metrics=true&alerts=true'
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setSystemStatus({
        status: data.status,
        checks: data.healthChecks || [],
        metrics: data.metrics || null,
        activeAlerts: data.activeAlerts || 0,
      });

      setRecentMetrics(data.recentMetrics || []);
      setAlerts(data.alerts || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch monitoring data'
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resolve_alert',
          alertId,
        }),
      });

      if (response.ok) {
        // Refresh data to show updated alert status
        fetchMonitoringData();
      }
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'text-green-600',
          bg: 'bg-green-100',
          icon: CheckCircle,
          label: 'Healthy',
        };
      case 'degraded':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-100',
          icon: AlertTriangle,
          label: 'Degraded',
        };
      case 'unhealthy':
        return {
          color: 'text-red-600',
          bg: 'bg-red-100',
          icon: XCircle,
          label: 'Unhealthy',
        };
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-100',
          icon: Clock,
          label: 'Unknown',
        };
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Loading...
                </CardTitle>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Monitoring Error</AlertTitle>
        <AlertDescription>
          Failed to load monitoring data: {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={fetchMonitoringData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!systemStatus) {
    return null;
  }

  const statusDisplay = getStatusDisplay(systemStatus.status);
  const StatusIcon = statusDisplay.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusDisplay.label}</div>
            <p className="text-xs text-muted-foreground">
              {systemStatus.checks.length} health checks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus.activeAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              {alerts.filter((a) => !a.resolved).length} unresolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus.metrics?.memory.percentage.toFixed(1)}%
            </div>
            <Progress
              value={systemStatus.metrics?.memory.percentage || 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemStatus.metrics?.http.avgResponseTime || 0}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Last updated: {lastUpdated?.toLocaleTimeString() || 'Never'}
        </p>
        <Button variant="outline" size="sm" onClick={fetchMonitoringData}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="health" className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health Checks</TabsTrigger>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Health Checks Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {systemStatus.checks.map((check) => {
              const checkStatus = getStatusDisplay(check.status);
              const CheckIcon = checkStatus.icon;

              return (
                <Card key={check.name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">
                      {check.name.replace('_', ' ')}
                    </CardTitle>
                    <CheckIcon className={`h-4 w-4 ${checkStatus.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          check.status === 'healthy' ? 'default' : 'destructive'
                        }
                      >
                        {check.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {check.responseTime}ms
                      </span>
                    </div>
                    {check.error && (
                      <p className="text-sm text-red-600 mt-2">{check.error}</p>
                    )}
                    {check.details && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {Object.entries(check.details).map(([key, value]) => (
                          <div key={key}>
                            {key}: {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* System Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {systemStatus.metrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MemoryStick className="h-4 w-4" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>
                        {(
                          systemStatus.metrics.memory.used /
                          1024 /
                          1024
                        ).toFixed(1)}{' '}
                        MB
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total</span>
                      <span>
                        {(
                          systemStatus.metrics.memory.total /
                          1024 /
                          1024
                        ).toFixed(1)}{' '}
                        MB
                      </span>
                    </div>
                    <Progress value={systemStatus.metrics.memory.percentage} />
                    <p className="text-xs text-muted-foreground">
                      {systemStatus.metrics.memory.percentage.toFixed(1)}% used
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Connections</span>
                      <span>{systemStatus.metrics.database.connections}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Active Queries</span>
                      <span>{systemStatus.metrics.database.activeQueries}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Response</span>
                      <span>
                        {systemStatus.metrics.database.avgResponseTime}ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    HTTP Requests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Requests/min</span>
                      <span>{systemStatus.metrics.http.requestsPerMinute}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Response</span>
                      <span>{systemStatus.metrics.http.avgResponseTime}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Error Rate</span>
                      <span>
                        {systemStatus.metrics.http.errorRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Alerts</h3>
                  <p className="text-muted-foreground">
                    System is running smoothly
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            alert.severity === 'critical'
                              ? 'text-red-600'
                              : alert.severity === 'high'
                                ? 'text-orange-600'
                                : alert.severity === 'medium'
                                  ? 'text-yellow-600'
                                  : 'text-blue-600'
                          }`}
                        />
                        {alert.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.severity === 'critical'
                              ? 'destructive'
                              : alert.severity === 'high'
                                ? 'destructive'
                                : alert.severity === 'medium'
                                  ? 'secondary'
                                  : 'outline'
                          }
                        >
                          {alert.severity}
                        </Badge>
                        {alert.resolved ? (
                          <Badge variant="outline">Resolved</Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription>
                      {new Date(alert.timestamp).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{alert.message}</p>
                    {alert.metadata &&
                      Object.keys(alert.metadata).length > 0 && (
                        <div className="mt-4">
                          <Separator className="mb-2" />
                          <div className="text-xs text-muted-foreground">
                            <strong>Details:</strong>
                            <pre className="mt-1 whitespace-pre-wrap">
                              {JSON.stringify(alert.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Recent system performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentMetrics.length > 0 ? (
                  <div className="space-y-4">
                    {recentMetrics.slice(-5).map((metric, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex gap-4">
                          <span>
                            Memory: {metric.memory.percentage.toFixed(1)}%
                          </span>
                          <span>Response: {metric.http.avgResponseTime}ms</span>
                          <span>Errors: {metric.errors.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No performance data available
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Environment</span>
                    <span className="font-mono">{process.env.NODE_ENV}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Node Version</span>
                    <span className="font-mono">{process.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform</span>
                    <span className="font-mono">{process.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Architecture</span>
                    <span className="font-mono">{process.arch}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
