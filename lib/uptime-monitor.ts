/**
 * Uptime Monitoring System
 * Monitors application availability and external service dependencies
 */

import { config, isMonitoringEnabled } from '@/lib/production-config';
import { logInfo, logWarning } from '@/lib/production-logger';

export interface UptimeCheck {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'HEAD';
  expectedStatus: number;
  timeout: number;
  interval: number;
  enabled: boolean;
  headers?: Record<string, string>;
  body?: string;
}

export interface UptimeResult {
  checkId: string;
  timestamp: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  statusCode?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface UptimeStats {
  checkId: string;
  name: string;
  uptime: number; // Percentage
  avgResponseTime: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  lastCheck: UptimeResult | null;
  incidents: UptimeIncident[];
}

export interface UptimeIncident {
  id: string;
  checkId: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'ongoing' | 'resolved';
  description: string;
}

class UptimeMonitoringSystem {
  private checks: Map<string, UptimeCheck> = new Map();
  private results: Map<string, UptimeResult[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly maxResults = 1000; // Keep last 1000 results per check

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (
      !isMonitoringEnabled('enableUptimeMonitoring') ||
      typeof window !== 'undefined'
    ) {
      return;
    }

    // Set up default checks
    this.setupDefaultChecks();

    logInfo('Uptime monitoring system initialized', {
      component: 'uptime_monitor',
      action: 'initialize',
      metadata: {
        environment: config.deployment.environment,
        checksCount: this.checks.size,
      },
    });
  }

  private setupDefaultChecks(): void {
    // Ensure proper URL formatting
    const baseUrl = config.deployment.deploymentUrl.startsWith('http')
      ? config.deployment.deploymentUrl
      : `https://${config.deployment.deploymentUrl}`;

    // Application health check
    this.addCheck({
      id: 'app_health',
      name: 'Application Health',
      url: `${baseUrl}/api/health`,
      method: 'GET',
      expectedStatus: 200,
      timeout: 10000,
      interval: 60000, // 1 minute
      enabled: true,
    });

    // Database connectivity check
    this.addCheck({
      id: 'database_health',
      name: 'Database Health',
      url: `${baseUrl}/api/health?checks=true`,
      method: 'GET',
      expectedStatus: 200,
      timeout: 15000,
      interval: 120000, // 2 minutes
      enabled: true,
    });

    // External services check (if Supabase is configured)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      this.addCheck({
        id: 'supabase_api',
        name: 'Supabase API',
        url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
        method: 'HEAD',
        expectedStatus: 200,
        timeout: 10000,
        interval: 300000, // 5 minutes
        enabled: true,
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
      });
    }
  }

  public addCheck(check: UptimeCheck): void {
    this.checks.set(check.id, check);
    this.results.set(check.id, []);

    if (check.enabled) {
      this.startMonitoring(check.id);
    }

    logInfo(`Uptime check added: ${check.name}`, {
      component: 'uptime_monitor',
      action: 'add_check',
      metadata: {
        checkId: check.id,
        url: check.url,
        interval: check.interval,
      },
    });
  }

  public removeCheck(checkId: string): boolean {
    const check = this.checks.get(checkId);
    if (!check) return false;

    this.stopMonitoring(checkId);
    this.checks.delete(checkId);
    this.results.delete(checkId);

    logInfo(`Uptime check removed: ${check.name}`, {
      component: 'uptime_monitor',
      action: 'remove_check',
      metadata: { checkId },
    });

    return true;
  }

  public updateCheck(checkId: string, updates: Partial<UptimeCheck>): boolean {
    const check = this.checks.get(checkId);
    if (!check) return false;

    const updatedCheck = { ...check, ...updates };
    this.checks.set(checkId, updatedCheck);

    // Restart monitoring if interval changed or enabled status changed
    if (updates.interval || updates.enabled !== undefined) {
      this.stopMonitoring(checkId);
      if (updatedCheck.enabled) {
        this.startMonitoring(checkId);
      }
    }

    logInfo(`Uptime check updated: ${check.name}`, {
      component: 'uptime_monitor',
      action: 'update_check',
      metadata: { checkId, updates },
    });

    return true;
  }

  private startMonitoring(checkId: string): void {
    const check = this.checks.get(checkId);
    if (!check || !check.enabled) return;

    // Stop existing monitoring if any
    this.stopMonitoring(checkId);

    // Run initial check
    this.performCheck(checkId);

    // Set up interval
    const interval = setInterval(() => {
      this.performCheck(checkId);
    }, check.interval);

    this.intervals.set(checkId, interval);

    logInfo(`Started monitoring: ${check.name}`, {
      component: 'uptime_monitor',
      action: 'start_monitoring',
      metadata: {
        checkId,
        interval: check.interval,
      },
    });
  }

  private stopMonitoring(checkId: string): void {
    const interval = this.intervals.get(checkId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(checkId);

      const check = this.checks.get(checkId);
      logInfo(`Stopped monitoring: ${check?.name || checkId}`, {
        component: 'uptime_monitor',
        action: 'stop_monitoring',
        metadata: { checkId },
      });
    }
  }

  private async performCheck(checkId: string): Promise<void> {
    const check = this.checks.get(checkId);
    if (!check) return;

    const startTime = Date.now();
    let result: UptimeResult;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), check.timeout);

      const response = await fetch(check.url, {
        method: check.method,
        headers: check.headers,
        body: check.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const isSuccess = response.status === check.expectedStatus;

      result = {
        checkId,
        timestamp: new Date().toISOString(),
        status: isSuccess ? 'up' : 'degraded',
        responseTime,
        statusCode: response.status,
        metadata: {
          url: check.url,
          method: check.method,
          expectedStatus: check.expectedStatus,
          actualStatus: response.status,
        },
      };

      if (!isSuccess) {
        result.error = `Expected status ${check.expectedStatus}, got ${response.status}`;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;

      result = {
        checkId,
        timestamp: new Date().toISOString(),
        status: 'down',
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          url: check.url,
          method: check.method,
          timeout: check.timeout,
        },
      };
    }

    // Store result
    this.storeResult(result);

    // Log result
    if (result.status === 'down') {
      logWarning(`Uptime check failed: ${check.name}`, {
        component: 'uptime_monitor',
        action: 'check_failed',
        metadata: {
          checkId,
          error: result.error,
          responseTime: result.responseTime,
        },
      });
    } else {
      logInfo(`Uptime check successful: ${check.name}`, {
        component: 'uptime_monitor',
        action: 'check_success',
        metadata: {
          checkId,
          status: result.status,
          responseTime: result.responseTime,
        },
      });
    }
  }

  private storeResult(result: UptimeResult): void {
    const results = this.results.get(result.checkId) || [];
    results.push(result);

    // Keep only the last maxResults
    if (results.length > this.maxResults) {
      results.splice(0, results.length - this.maxResults);
    }

    this.results.set(result.checkId, results);
  }

  // Public API methods
  public getChecks(): UptimeCheck[] {
    return Array.from(this.checks.values());
  }

  public getCheck(checkId: string): UptimeCheck | undefined {
    return this.checks.get(checkId);
  }

  public getResults(checkId: string, limit = 100): UptimeResult[] {
    const results = this.results.get(checkId) || [];
    return results.slice(-limit);
  }

  public getStats(checkId: string): UptimeStats | null {
    const check = this.checks.get(checkId);
    const results = this.results.get(checkId) || [];

    if (!check || results.length === 0) return null;

    const successfulChecks = results.filter((r) => r.status === 'up').length;
    const failedChecks = results.filter((r) => r.status === 'down').length;
    const totalChecks = results.length;
    const uptime = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;

    const responseTimes = results
      .filter((r) => r.status !== 'down')
      .map((r) => r.responseTime);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) /
          responseTimes.length
        : 0;

    return {
      checkId,
      name: check.name,
      uptime,
      avgResponseTime,
      totalChecks,
      successfulChecks,
      failedChecks,
      lastCheck: results[results.length - 1] || null,
      incidents: [], // Simplified - no incident tracking
    };
  }

  public getAllStats(): UptimeStats[] {
    return Array.from(this.checks.keys())
      .map((checkId) => this.getStats(checkId))
      .filter((stats): stats is UptimeStats => stats !== null);
  }

  public getIncidents(_limit = 50): UptimeIncident[] {
    void _limit;
    return []; // Simplified - no incident tracking
  }

  public getActiveIncidents(): UptimeIncident[] {
    return []; // Simplified - no incident tracking
  }

  public async runCheck(checkId: string): Promise<UptimeResult | null> {
    const check = this.checks.get(checkId);
    if (!check) return null;

    await this.performCheck(checkId);
    const results = this.results.get(checkId) || [];
    return results[results.length - 1] || null;
  }

  public getOverallStatus(): {
    status: 'operational' | 'degraded' | 'major_outage';
    uptime: number;
    activeIncidents: number;
    totalChecks: number;
    operationalChecks: number;
  } {
    const allStats = this.getAllStats();

    if (allStats.length === 0) {
      return {
        status: 'operational',
        uptime: 100,
        activeIncidents: 0,
        totalChecks: 0,
        operationalChecks: 0,
      };
    }

    const totalUptime = allStats.reduce((sum, stats) => sum + stats.uptime, 0);
    const avgUptime = totalUptime / allStats.length;

    const operationalChecks = allStats.filter(
      (stats) => stats.lastCheck?.status === 'up'
    ).length;

    let status: 'operational' | 'degraded' | 'major_outage' = 'operational';

    if (avgUptime < 90) {
      status = 'major_outage';
    } else if (avgUptime < 99) {
      status = 'degraded';
    }

    return {
      status,
      uptime: avgUptime,
      activeIncidents: 0, // Simplified - no incident tracking
      totalChecks: allStats.length,
      operationalChecks,
    };
  }

  public destroy(): void {
    // Stop all monitoring intervals
    for (const [checkId] of this.intervals) {
      this.stopMonitoring(checkId);
    }

    this.checks.clear();
    this.results.clear();
    this.intervals.clear();

    logInfo('Uptime monitoring system destroyed', {
      component: 'uptime_monitor',
      action: 'destroy',
    });
  }
}

// Global uptime monitoring instance
let globalUptimeMonitor: UptimeMonitoringSystem | null = null;

export function initializeUptimeMonitoring(): UptimeMonitoringSystem {
  if (!globalUptimeMonitor) {
    globalUptimeMonitor = new UptimeMonitoringSystem();
  }
  return globalUptimeMonitor;
}

export function getUptimeMonitoring(): UptimeMonitoringSystem | null {
  return globalUptimeMonitor;
}

export function destroyUptimeMonitoring(): void {
  if (globalUptimeMonitor) {
    globalUptimeMonitor.destroy();
    globalUptimeMonitor = null;
  }
}

// Initialize uptime monitoring in production environments (server-side only)
if (
  typeof window === 'undefined' &&
  isMonitoringEnabled('enableUptimeMonitoring')
) {
  initializeUptimeMonitoring();
}

export { UptimeMonitoringSystem };
