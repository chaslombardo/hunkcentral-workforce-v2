/**
 * Unified Admin Monitoring Dashboard
 * Consolidates functionality from:
 * - comprehensive-monitoring-dashboard.tsx
 * - monitoring-dashboard.tsx
 * - error-monitoring-dashboard.tsx
 * - performance-monitor.tsx
 * - real-time-performance.tsx
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  CheckCircle,
  Database,
  MemoryStick,
  RefreshCw,
  Server,
  Zap,
  XCircle,
  Bug,
  Shield,
  Smartphone,
} from 'lucide-react';

// Unified monitoring data interface
interface UnifiedMonitoringData {
  system: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    responseTime: number;
  };
  performance: {
    pageLoad: {
      average: number;
      p95: number;
    };
    database: {
      average: number;
      connections: number;
    };
    errors: {
      count: number;
      rate: number;
    };
  };
  errors: Array<{
    id: string;
    level: 'critical' | 'high' | 'medium' | 'low';
    type: 'server' | 'database' | 'auth' | 'api' | 'client' | 'component';
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  uptime: {
    overall: number;
    checks: Array<{
      name: string;
      status: 'up' | 'down' | 'degraded';
      uptime: number;
      responseTime: number;
    }>;
  };
  timestamp: string;
}

interface UnifiedMonitoringDashboardProps {
  className?: string;
}

export function UnifiedMonitoringDashboard({
  className,
}: UnifiedMonitoringDashboardProps) {
  const [data, setData] = useState<UnifiedMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch from multiple endpoints and combine data
      const [
        healthResponse,
        performanceResponse,
        errorsResponse,
        uptimeResponse,
      ] = await Promise.all([
        fetch('/api/health?detailed=true&metrics=true'),
        fetch('/api/performance/metrics').catch(() => null),
        fetch('/api/admin/errors').catch(() => null),
        fetch('/api/uptime/status').catch(() => null),
      ]);

      const healthData = await healthResponse.json();
      const performanceData = performanceResponse?.ok
        ? await performanceResponse.json()
        : null;
      const errorsData = errorsResponse?.ok
        ? await errorsResponse.json()
        : { errors: [], stats: {} };
      const uptimeData = uptimeResponse?.ok
        ? await uptimeResponse.json()
        : null;

      // Combine data into unified structure
      const combinedData: UnifiedMonitoringData = {
        system: {
          status: healthData.status || 'healthy',
          uptime: healthData.uptime || 0,
          memory: healthData.metrics?.memory || {
            used: 0,
            total: 0,
            percentage: 0,
          },
          responseTime: healthData.metrics?.http?.avgResponseTime || 0,
        },
        performance: {
          pageLoad: {
            average: performanceData?.pageLoad?.average || 0,
            p95: performanceData?.pageLoad?.p95 || 0,
          },
          database: {
            average: healthData.metrics?.database?.avgResponseTime || 0,
            connections: healthData.metrics?.database?.connections || 0,
          },
          errors: {
            count: healthData.metrics?.errors?.count || 0,
            rate: healthData.metrics?.http?.errorRate || 0,
          },
        },
        errors: errorsData.errors || [],
        uptime: {
          overall: uptimeData?.overall?.uptime || 100,
          checks: uptimeData?.checks || [],
        },
        timestamp: new Date().toISOString(),
      };

      setData(combinedData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch monitoring data'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'unhealthy':
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'unhealthy':
      case 'down':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      case 'client':
        return <Smartphone className="h-4 w-4" />;
      case 'component':
        return <Bug className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
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
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Monitoring Error</AlertTitle>
        <AlertDescription>
          {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={fetchData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const errorStats = {
    total: data.errors.length,
    critical: data.errors.filter((e) => e.level === 'critical').length,
    high: data.errors.filter((e) => e.level === 'high').length,
    unresolved: data.errors.filter((e) => !e.resolved).length,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className={getStatusColor(data.system.status)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={getStatusBadge(data.system.status)}>
                {data.system.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {Math.round(data.system.uptime / 3600)}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.system.memory.percentage.toFixed(1)}%
            </div>
            <Progress
              value={data.system.memory.percentage}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              {Math.round(data.system.memory.used / 1024 / 1024)} MB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.system.responseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              DB: {data.performance.database.average}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {errorStats.unresolved}
            </div>
            <p className="text-xs text-muted-foreground">
              {errorStats.critical} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="uptime">Uptime</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Page Load Average:</span>
                  <span>{data.performance.pageLoad.average}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Page Load P95:</span>
                  <span>{data.performance.pageLoad.p95}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Average:</span>
                  <span>{data.performance.database.average}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Connections:</span>
                  <span>{data.performance.database.connections}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Errors:</span>
                  <span>{errorStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Critical:</span>
                  <span className="text-destructive">
                    {errorStats.critical}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>High Priority:</span>
                  <span className="text-orange-500">{errorStats.high}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unresolved:</span>
                  <span>{errorStats.unresolved}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Details</CardTitle>
              <CardDescription>
                Real-time performance metrics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.performance.pageLoad.average}ms
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Avg Page Load
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.performance.database.average}ms
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Avg DB Response
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {data.performance.errors.rate.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Latest errors requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.errors.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent errors</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.errors.slice(0, 10).map((error) => (
                      <TableRow key={error.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(error.type)}
                            <span className="capitalize">{error.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getLevelColor(error.level)}>
                            {error.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {error.message}
                        </TableCell>
                        <TableCell>
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          {error.resolved ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Open
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="uptime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Uptime</CardTitle>
              <CardDescription>
                Availability status of critical services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    {data.uptime.overall.toFixed(2)}%
                  </div>
                  <p className="text-muted-foreground">Overall Uptime</p>
                </div>

                {data.uptime.checks.length > 0 && (
                  <div className="space-y-2">
                    {data.uptime.checks.map((check, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              check.status === 'up'
                                ? 'bg-green-500'
                                : check.status === 'degraded'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                          />
                          <span>{check.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {check.uptime.toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {check.responseTime}ms
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
