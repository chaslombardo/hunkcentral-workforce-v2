'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useMonitoring } from '@/hooks/useMonitoring';
import {
  IconActivity,
  IconDatabase,
  IconServer,
  IconRefresh,
  IconAlertTriangle,
  IconCircleCheck,
  IconClock,
} from '@tabler/icons-react';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  details?: Record<string, unknown>;
}

interface ServiceMetrics {
  database?: {
    totalUsers: number;
    dailyLogsLast24h: number;
    feedbackLast24h: number;
    connectionStatus: string;
  };
  application?: {
    memory: {
      percentage: number;
      heapUsed: number;
      heapTotal: number;
    };
    uptime: number;
    platform: string;
    nodeVersion: string;
  };
  external_services?: {
    supabase?: {
      status: string;
      responseTime: number;
    };
  };
}

export function MonitoringDashboard() {
  const { systemHealth, healthLoading, getSystemHealth } = useMonitoring();
  const [serviceMetrics, setServiceMetrics] = useState<ServiceMetrics>({});
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch detailed metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/health?metrics=true');
        const data = await response.json();

        if (data.serviceMetrics) {
          setServiceMetrics(data.serviceMetrics);
        }
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch service metrics:', error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <IconCircleCheck className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <IconAlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'unhealthy':
        return <IconAlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <IconClock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
          <p className="text-muted-foreground">
            Monitor system performance and service health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => getSystemHealth()}
            disabled={healthLoading}
          >
            <IconRefresh
              className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconActivity className="h-5 w-5" />
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {getStatusIcon(systemHealth?.status || 'unknown')}
            <div>
              <Badge
                className={getStatusColor(systemHealth?.status || 'unknown')}
              >
                {systemHealth?.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                System is {systemHealth?.status || 'unknown'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Status Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Database Service */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <IconDatabase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(
                systemHealth?.services?.database ? 'healthy' : 'unhealthy'
              )}
              <Badge
                variant="outline"
                className={getStatusColor(
                  systemHealth?.services?.database ? 'healthy' : 'unhealthy'
                )}
              >
                {systemHealth?.services?.database
                  ? 'Connected'
                  : 'Disconnected'}
              </Badge>
            </div>
            {serviceMetrics.database && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>Users: {serviceMetrics.database.totalUsers}</div>
                <div>
                  Daily Logs (24h): {serviceMetrics.database.dailyLogsLast24h}
                </div>
                <div>
                  Feedback (24h): {serviceMetrics.database.feedbackLast24h}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Service */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Application</CardTitle>
            <IconServer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(
                systemHealth?.services?.application ? 'healthy' : 'unhealthy'
              )}
              <Badge
                variant="outline"
                className={getStatusColor(
                  systemHealth?.services?.application ? 'healthy' : 'unhealthy'
                )}
              >
                {systemHealth?.services?.application ? 'Running' : 'Down'}
              </Badge>
            </div>
            {serviceMetrics.application && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Memory:{' '}
                  {serviceMetrics.application.memory.percentage.toFixed(1)}%
                </div>
                <div>
                  Uptime: {formatUptime(serviceMetrics.application.uptime)}
                </div>
                <div>Platform: {serviceMetrics.application.platform}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* External Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              External Services
            </CardTitle>
            <IconActivity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(
                systemHealth?.services?.external_services
                  ? 'healthy'
                  : 'unhealthy'
              )}
              <Badge
                variant="outline"
                className={getStatusColor(
                  systemHealth?.services?.external_services
                    ? 'healthy'
                    : 'unhealthy'
                )}
              >
                {systemHealth?.services?.external_services
                  ? 'Connected'
                  : 'Disconnected'}
              </Badge>
            </div>
            {serviceMetrics.external_services?.supabase && (
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Supabase: {serviceMetrics.external_services.supabase.status}
                </div>
                <div>
                  Response:{' '}
                  {serviceMetrics.external_services.supabase.responseTime}ms
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      {serviceMetrics.application && (
        <Card>
          <CardHeader>
            <CardTitle>Application Metrics</CardTitle>
            <CardDescription>
              Detailed performance metrics for the application server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Used:</span>
                    <span>
                      {formatBytes(serviceMetrics.application.memory.heapUsed)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span>
                      {formatBytes(serviceMetrics.application.memory.heapTotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Percentage:</span>
                    <span>
                      {serviceMetrics.application.memory.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${serviceMetrics.application.memory.percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">System Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span>
                      {formatUptime(serviceMetrics.application.uptime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform:</span>
                    <span>{serviceMetrics.application.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Node Version:</span>
                    <span>{serviceMetrics.application.nodeVersion}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
