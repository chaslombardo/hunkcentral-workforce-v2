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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  CheckCircle,
  Clock,
  Database,
  Globe,
  MemoryStick,
  RefreshCw,
  Server,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface MonitoringData {
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

export function ComprehensiveMonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch from multiple endpoints
      const [healthResponse, performanceResponse, uptimeResponse] =
        await Promise.all([
          fetch('/api/health?detailed=true&metrics=true'),
          fetch('/api/performance/metrics'),
          fetch('/api/uptime/status').catch(() => null), // Optional uptime endpoint
        ]);

      const healthData = await healthResponse.json();
      const performanceData = performanceResponse.ok
        ? await performanceResponse.json()
        : null;
      const uptimeData = uptimeResponse?.ok
        ? await uptimeResponse.json()
        : null;

      // Combine data from different sources
      const combinedData: MonitoringData = {
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

  if (loading) {
    return (
      <div className="space-y-6">
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
      <Alert variant="destructive">
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

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle
              className={`h-4 w-4 ${getStatusColor(data.system.status)}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {data.system.status}
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {Math.floor(data.system.uptime / 3600)}h{' '}
              {Math.floor((data.system.uptime % 3600) / 60)}m
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
              {data.system.memory.percentage.toFixed(1)}%
            </div>
            <Progress value={data.system.memory.percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(data.system.memory.used / 1024 / 1024)} MB used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.system.responseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Uptime
            </CardTitle>
            <Globe className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.uptime.overall.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Service availability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Monitoring */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="uptime">Uptime Checks</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Page Load Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average</span>
                    <span className="font-medium">
                      {Math.round(data.performance.pageLoad.average)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">95th Percentile</span>
                    <span className="font-medium">
                      {Math.round(data.performance.pageLoad.p95)}ms
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      (data.performance.pageLoad.average / 3000) * 100,
                      100
                    )}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Target: &lt; 1000ms
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Database Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Query Time</span>
                    <span className="font-medium">
                      {Math.round(data.performance.database.average)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Connections</span>
                    <span className="font-medium">
                      {data.performance.database.connections}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      (data.performance.database.average / 1000) * 100,
                      100
                    )}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Target: &lt; 500ms
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Error Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Error Count</span>
                    <span className="font-medium">
                      {data.performance.errors.count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-medium">
                      {data.performance.errors.rate.toFixed(2)}%
                    </span>
                  </div>
                  <Progress
                    value={Math.min(data.performance.errors.rate * 10, 100)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    Target: &lt; 1%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="uptime" className="space-y-4">
          <div className="grid gap-4">
            {data.uptime.checks.length > 0 ? (
              data.uptime.checks.map((check, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{check.name}</CardTitle>
                      <Badge variant={getStatusBadge(check.status) as any}>
                        {check.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Uptime</div>
                        <div className="font-medium">
                          {check.uptime.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          Response Time
                        </div>
                        <div className="font-medium">
                          {check.responseTime}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <div
                          className={`font-medium ${getStatusColor(check.status)}`}
                        >
                          {check.status.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Health</div>
                        <Progress value={check.uptime} className="mt-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Uptime Checks</h3>
                    <p className="text-muted-foreground">
                      Uptime monitoring is not configured
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={getStatusBadge(data.system.status) as any}>
                      {data.system.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-medium">
                      {Math.floor(data.system.uptime / 3600)}h{' '}
                      {Math.floor((data.system.uptime % 3600) / 60)}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Memory Usage</span>
                    <span className="font-medium">
                      {data.system.memory.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Response Time</span>
                    <span className="font-medium">
                      {data.system.responseTime}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Health Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Health</span>
                    <div
                      className={`font-medium ${getStatusColor(data.system.status)}`}
                    >
                      {data.system.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Service Availability</span>
                    <div className="font-medium text-green-600">
                      {data.uptime.overall.toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <div
                      className={`font-medium ${data.performance.errors.rate > 1 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {data.performance.errors.rate.toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Performance</span>
                    <div
                      className={`font-medium ${data.performance.pageLoad.average > 1000 ? 'text-yellow-600' : 'text-green-600'}`}
                    >
                      {data.performance.pageLoad.average > 1000
                        ? 'Needs Attention'
                        : 'Good'}
                    </div>
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
