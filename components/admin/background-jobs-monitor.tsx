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
import {
  Play,
  Square,
  RefreshCw,
  Trash2,
  Activity,
  Database,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import {
  getBackgroundJobSystemStatus,
  initializeBackgroundJobSystem,
  shutdownBackgroundJobSystem,
  triggerSystemMetricsRefresh,
  triggerSystemCacheCleanup,
} from '@/lib/actions/background-jobs';

interface SystemStatus {
  system: {
    initialized: boolean;
    enabled: boolean;
    intervals: {
      cleanup: boolean;
      healthCheck: boolean;
      metricsRefresh: boolean;
    };
  };
  cache: {
    totalMetrics: number;
    expiredMetrics: number;
    metricsByType: Record<string, number>;
    oldestMetric: Date | null;
    newestMetric: Date | null;
  };
  timestamp: string;
}

export function BackgroundJobsMonitor() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch system status
  const fetchStatus = async () => {
    try {
      setError(null);
      const result = await getBackgroundJobSystemStatus();

      if (result.success) {
        setStatus(result.data);
        setLastRefresh(new Date());
      } else {
        setError(result.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh status every 30 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle system actions
  const handleAction = async (action: string, actionFn: () => Promise<any>) => {
    setActionLoading(action);
    setError(null);

    try {
      const result = await actionFn();
      if (!result.success) {
        setError(result.error || `Failed to ${action}`);
      } else {
        // Refresh status after action
        setTimeout(fetchStatus, 1000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Background Jobs Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Background Jobs Monitor
              </CardTitle>
              <CardDescription>
                Monitor and manage the background job processing system
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatus}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {status && (
            <>
              {/* System Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {status.system.initialized ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">System Status</span>
                  </div>
                  <Badge
                    variant={
                      status.system.initialized ? 'default' : 'destructive'
                    }
                  >
                    {status.system.initialized ? 'Running' : 'Stopped'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {status.system.enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="font-medium">Enabled</span>
                  </div>
                  <Badge
                    variant={status.system.enabled ? 'default' : 'secondary'}
                  >
                    {status.system.enabled ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Intervals Active</span>
                  <Badge variant="outline">
                    {
                      Object.values(status.system.intervals).filter(Boolean)
                        .length
                    }
                    /3
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Cache Health */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Cache Health
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {status.cache.totalMetrics}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Metrics
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {status.cache.expiredMetrics}
                    </div>
                    <div className="text-sm text-muted-foreground">Expired</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Object.keys(status.cache.metricsByType).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Metric Types
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {status.cache.newestMetric
                        ? Math.round(
                            (new Date().getTime() -
                              new Date(status.cache.newestMetric).getTime()) /
                              (1000 * 60)
                          )
                        : 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {status.cache.newestMetric ? 'Minutes Ago' : 'No Metrics'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric Types Breakdown */}
              {Object.keys(status.cache.metricsByType).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-3">Metric Types</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {Object.entries(status.cache.metricsByType).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <span className="text-sm font-medium">{type}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Control Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>System Controls</CardTitle>
          <CardDescription>
            Manage the background job processing system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant={status?.system.initialized ? 'destructive' : 'default'}
              onClick={() =>
                status?.system.initialized
                  ? handleAction('shutdown', shutdownBackgroundJobSystem)
                  : handleAction('initialize', initializeBackgroundJobSystem)
              }
              disabled={actionLoading !== null}
              className="w-full"
            >
              {actionLoading ===
              (status?.system.initialized ? 'shutdown' : 'initialize') ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : status?.system.initialized ? (
                <Square className="h-4 w-4 mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {status?.system.initialized ? 'Stop System' : 'Start System'}
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                handleAction('refresh', triggerSystemMetricsRefresh)
              }
              disabled={actionLoading !== null}
              className="w-full"
            >
              {actionLoading === 'refresh' ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Metrics
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction('cleanup', triggerSystemCacheCleanup)}
              disabled={actionLoading !== null}
              className="w-full"
            >
              {actionLoading === 'cleanup' ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clean Cache
            </Button>

            <Button
              variant="outline"
              onClick={fetchStatus}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
