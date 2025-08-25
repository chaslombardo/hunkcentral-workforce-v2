/**
 * Production Monitoring and Alerting System
 * Comprehensive monitoring for application health, performance, and errors
 */

import { config, isMonitoringEnabled } from '@/lib/production-config';
import { logInfo, logWarning } from '@/lib/production-logger';

// Re-export types from the client-safe types file
export type { HealthCheck, SystemMetrics, Alert } from '@/lib/monitoring-types';

// Import types for internal use
import type { HealthCheck, SystemMetrics, Alert } from '@/lib/monitoring-types';

// Performance monitoring types (consolidated from performanceMonitoring.ts)
export interface PageLoadMetric {
  page: string;
  loadTime: number;
  userId?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface InteractionMetric {
  action: string;
  component: string;
  duration: number;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface SystemHealthMetric {
  metricType: 'cpu' | 'memory' | 'database' | 'cache' | 'errors';
  value: number;
  threshold?: number;
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
}

export interface PerformanceAlert {
  type: 'slow_page' | 'slow_query' | 'high_error_rate' | 'system_health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  data: any;
  timestamp: Date;
}

// Performance configuration (consolidated from performance-config.ts)
export interface PerformanceConfig {
  monitoring: {
    enabled: boolean;
    trackRenderTimes: boolean;
    trackBundleUsage: boolean;
    logInterval: number;
    maxStoredMeasurements: number;
  };
  thresholds: {
    renderTime: number;
    propSize: number;
    reRenderCount: number;
    memoryUsage: number;
    pageLoad: { good: number; warning: number; critical: number };
    interaction: { good: number; warning: number; critical: number };
    database: { good: number; warning: number; critical: number };
    errorRate: { warning: number; critical: number };
  };
  optimization: {
    enableMemoization: boolean;
    enableLazyLoading: boolean;
    enableTreeShaking: boolean;
    enableCodeSplitting: boolean;
  };
}

// Error logging types (consolidated from error logging files)
export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  userAgent?: string;
  url: string;
  timestamp: number;
  stack?: string;
  additionalData?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?:
    | 'server'
    | 'database'
    | 'auth'
    | 'api'
    | 'middleware'
    | 'component'
    | 'security';
}

export interface ErrorLog {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  context: ErrorContext;
  resolved: boolean;
  timestamp: string;
  fingerprint: string;
}

// Default performance configuration
export const performanceConfig: PerformanceConfig = {
  monitoring: {
    enabled: process.env.NODE_ENV === 'development',
    trackRenderTimes: true,
    trackBundleUsage: false, // Simplified
    logInterval: 30000,
    maxStoredMeasurements: 100,
  },
  thresholds: {
    renderTime: 16,
    propSize: 1000,
    reRenderCount: 10,
    memoryUsage: 50,
    pageLoad: { good: 1000, warning: 3000, critical: 5000 },
    interaction: { good: 100, warning: 500, critical: 1000 },
    database: { good: 100, warning: 500, critical: 1000 },
    errorRate: { warning: 0.05, critical: 0.1 },
  },
  optimization: {
    enableMemoization: true,
    enableLazyLoading: true,
    enableTreeShaking: true,
    enableCodeSplitting: true,
  },
};

class MonitoringSystem {
  // Performance monitoring properties (consolidated from PerformanceMonitoringService)
  private pageLoadMetrics: PageLoadMetric[] = [];
  private interactionMetrics: InteractionMetric[] = [];
  private systemHealthMetrics: SystemHealthMetric[] = [];
  private performanceAlerts: PerformanceAlert[] = [];
  private readonly maxMetrics = 1000; // Reduced from 10000 for simplification

  // Error logging properties (consolidated from error logging files)
  private errorLogs: ErrorLog[] = [];
  private readonly maxErrorLogs = 1000;
  private healthChecks: Map<string, HealthCheck> = new Map();
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private metricsInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (!isMonitoringEnabled('enablePerformanceMonitoring')) {
      return;
    }

    // Start collecting metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Run health checks every 60 seconds
    this.healthCheckInterval = setInterval(() => {
      this.runHealthChecks();
    }, 60000);

    // Initial health check
    this.runHealthChecks();

    logInfo('Monitoring system initialized', {
      component: 'monitoring',
      action: 'initialize',
      metadata: {
        environment: config.deployment.environment,
        region: config.deployment.region,
        version: config.deployment.version,
      },
    });
  }

  private async collectMetrics(): Promise<void> {
    // Only run on server-side
    if (typeof window !== 'undefined') return;

    try {
      const timestamp = new Date().toISOString();

      // Collect system metrics (Node.js specific)
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const metrics: SystemMetrics = {
        timestamp,
        cpu: {
          usage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
          loadAverage:
            typeof window === 'undefined' && process.platform !== 'win32'
              ? (await import('os')).loadavg()
              : [0, 0, 0],
        },
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        },
        database: {
          connections: await this.getDatabaseConnections(),
          activeQueries: await this.getActiveQueries(),
          avgResponseTime: await this.getDatabaseResponseTime(),
        },
        http: {
          requestsPerMinute: await this.getRequestsPerMinute(),
          avgResponseTime: await this.getAvgResponseTime(),
          errorRate: await this.getErrorRate(),
        },
        errors: {
          count: await this.getErrorCount(),
          criticalCount: await this.getCriticalErrorCount(),
          lastError: await this.getLastError(),
        },
      };

      this.metrics.push(metrics);

      // Keep only last 100 metrics (about 50 minutes of data)
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Check for alerts based on metrics
      await this.checkMetricAlerts(metrics);

      logInfo('System metrics collected', {
        component: 'monitoring',
        action: 'collect_metrics',
        metadata: {
          memoryUsage: metrics.memory.percentage,
          errorRate: metrics.http.errorRate,
          responseTime: metrics.http.avgResponseTime,
        },
      });
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  private async runHealthChecks(): Promise<void> {
    // Only run on server-side
    if (typeof window !== 'undefined') return;

    const checks = [
      this.checkDatabase(),
      this.checkExternalServices(),
      this.checkFileSystem(),
      this.checkMemoryUsage(),
    ];

    const results = await Promise.allSettled(checks);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.healthChecks.set(result.value.name, result.value);
      } else {
        const checkNames = [
          'database',
          'external_services',
          'filesystem',
          'memory',
        ];
        this.healthChecks.set(checkNames[index], {
          name: checkNames[index],
          status: 'unhealthy',
          responseTime: 0,
          timestamp: new Date().toISOString(),
          error:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
        });
      }
    });

    // Check for unhealthy services and create alerts
    for (const [, check] of this.healthChecks) {
      if (check.status === 'unhealthy') {
        await this.createAlert({
          type: 'uptime',
          severity: 'high',
          title: `Health Check Failed: ${check.name}`,
          message: `Health check for ${check.name} failed: ${check.error || 'Unknown error'}`,
          metadata: {
            healthCheck: check,
          },
        });
      }
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Import Prisma client dynamically to avoid circular dependencies
      const { prisma } = await import('@/lib/prisma');

      // Simple query to check database connectivity
      await prisma.$queryRaw`SELECT 1`;

      const responseTime = Date.now() - startTime;

      return {
        name: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          connectionPool: 'active',
          queryTime: responseTime,
        },
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check Supabase API if configured
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
          {
            method: 'HEAD',
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Supabase API returned ${response.status}`);
        }
      }

      const responseTime = Date.now() - startTime;

      return {
        name: 'external_services',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          supabase: 'connected',
        },
      };
    } catch (error) {
      return {
        name: 'external_services',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkFileSystem(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Only run on server-side
      if (typeof window !== 'undefined') {
        throw new Error('File system check not available on client-side');
      }

      const fs = await import('fs/promises');
      const path = await import('path');

      // Check if we can write to temp directory
      const tempFile = path.join(process.cwd(), '.tmp-health-check');
      await fs.writeFile(tempFile, 'health-check');
      await fs.unlink(tempFile);

      const responseTime = Date.now() - startTime;

      return {
        name: 'filesystem',
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          writeAccess: true,
          workingDirectory: process.cwd(),
        },
      };
    } catch (error) {
      return {
        name: 'filesystem',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memoryUsage = process.memoryUsage();
      const memoryPercentage =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      let status: HealthCheck['status'] = 'healthy';
      if (memoryPercentage > 90) {
        status = 'unhealthy';
      } else if (memoryPercentage > 75) {
        status = 'degraded';
      }

      const responseTime = Date.now() - startTime;

      return {
        name: 'memory',
        status,
        responseTime,
        timestamp: new Date().toISOString(),
        details: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          percentage: memoryPercentage,
          external: memoryUsage.external,
        },
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkMetricAlerts(metrics: SystemMetrics): Promise<void> {
    const alertsConfig = config.alerts;

    // Memory usage alert
    if (metrics.memory.percentage > 90) {
      await this.createAlert({
        type: 'performance',
        severity: 'critical',
        title: 'High Memory Usage',
        message: `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
        metadata: { metrics: metrics.memory },
      });
    } else if (metrics.memory.percentage > 75) {
      await this.createAlert({
        type: 'performance',
        severity: 'medium',
        title: 'Elevated Memory Usage',
        message: `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
        metadata: { metrics: metrics.memory },
      });
    }

    // Error rate alert
    if (metrics.http.errorRate > alertsConfig.errorThreshold) {
      await this.createAlert({
        type: 'error',
        severity: 'high',
        title: 'High Error Rate',
        message: `Error rate is ${metrics.http.errorRate.toFixed(1)}% (threshold: ${alertsConfig.errorThreshold}%)`,
        metadata: { metrics: metrics.http },
      });
    }

    // Response time alert
    if (metrics.http.avgResponseTime > alertsConfig.responseTimeThreshold) {
      await this.createAlert({
        type: 'performance',
        severity: 'medium',
        title: 'Slow Response Time',
        message: `Average response time is ${metrics.http.avgResponseTime}ms (threshold: ${alertsConfig.responseTimeThreshold}ms)`,
        metadata: { metrics: metrics.http },
      });
    }

    // Critical errors alert
    if (metrics.errors.criticalCount > 0) {
      await this.createAlert({
        type: 'error',
        severity: 'critical',
        title: 'Critical Errors Detected',
        message: `${metrics.errors.criticalCount} critical errors in the last period`,
        metadata: {
          metrics: metrics.errors,
          lastError: metrics.errors.lastError,
        },
      });
    }
  }

  private async createAlert(
    alertData: Omit<Alert, 'id' | 'timestamp' | 'resolved'>
  ): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...alertData,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Send notifications
    await this.sendAlertNotifications(alert);

    logWarning(`Alert created: ${alert.title}`, {
      component: 'monitoring',
      action: 'create_alert',
      metadata: {
        alertId: alert.id,
        type: alert.type,
        severity: alert.severity,
        ...alert.metadata,
      },
    });
  }

  private async sendAlertNotifications(alert: Alert): Promise<void> {
    const alertsConfig = config.alerts;

    try {
      // Send Slack notification
      if (
        alertsConfig.enableSlackNotifications &&
        alertsConfig.slackWebhookUrl
      ) {
        await this.sendSlackNotification(alert, alertsConfig.slackWebhookUrl);
      }

      // Send email notification
      if (alertsConfig.enableEmailNotifications && alertsConfig.alertEmail) {
        await this.sendEmailNotification(alert, alertsConfig.alertEmail);
      }

      // Log to stderr for external monitoring tools
      const alertLog = {
        timestamp: alert.timestamp,
        level: 'ALERT',
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        environment: config.deployment.environment,
        service: 'hunkcentral',
        alertId: alert.id,
        metadata: alert.metadata,
      };

      process.stderr.write(`MONITORING_ALERT: ${JSON.stringify(alertLog)}\n`);
    } catch (error) {
      await logProductionError(error, {
        component: 'monitoring',
        action: 'send_alert_notifications',
        url: 'system',
        userAgent: 'server',
        metadata: {
          alertId: alert.id,
          alertType: alert.type,
        },
      });
    }
  }

  private async sendSlackNotification(
    alert: Alert,
    webhookUrl: string
  ): Promise<void> {
    const color = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff0000',
      critical: '#8b0000',
    }[alert.severity];

    const payload = {
      text: `🚨 ${alert.title}`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Type',
              value: alert.type.toUpperCase(),
              short: true,
            },
            {
              title: 'Environment',
              value: config.deployment.environment.toUpperCase(),
              short: true,
            },
            {
              title: 'Time',
              value: new Date(alert.timestamp).toLocaleString(),
              short: true,
            },
            {
              title: 'Message',
              value: alert.message,
              short: false,
            },
          ],
          footer: 'HUNKCentral Monitoring',
          ts: Math.floor(Date.parse(alert.timestamp) / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Slack notification failed: ${response.status} ${response.statusText}`
      );
    }
  }

  private async sendEmailNotification(
    alert: Alert,
    email: string
  ): Promise<void> {
    // This would integrate with an email service like SendGrid, AWS SES, etc.
    // For now, we'll log the email that would be sent
    const emailContent = {
      to: email,
      subject: `🚨 HUNKCentral Alert: ${alert.title}`,
      body: `
        Alert Details:
        - Severity: ${alert.severity.toUpperCase()}
        - Type: ${alert.type.toUpperCase()}
        - Environment: ${config.deployment.environment.toUpperCase()}
        - Time: ${new Date(alert.timestamp).toLocaleString()}
        - Message: ${alert.message}
        
        Alert ID: ${alert.id}
        
        This is an automated alert from HUNKCentral monitoring system.
      `,
    };

    logInfo('Email alert notification prepared', {
      component: 'monitoring',
      action: 'prepare_email_alert',
      metadata: {
        alertId: alert.id,
        recipient: email,
        subject: emailContent.subject,
      },
    });

    // TODO: Implement actual email sending
    // Example: await sendEmail(emailContent);
  }

  // Helper methods for metrics collection
  private async getDatabaseConnections(): Promise<number> {
    try {
      // This would query the database for connection count
      // For now, return a placeholder
      return 5;
    } catch {
      return 0;
    }
  }

  private async getActiveQueries(): Promise<number> {
    try {
      // This would query the database for active queries
      // For now, return a placeholder
      return 2;
    } catch {
      return 0;
    }
  }

  private async getDatabaseResponseTime(): Promise<number> {
    try {
      const startTime = Date.now();
      const { prisma } = await import('@/lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      return Date.now() - startTime;
    } catch {
      return 0;
    }
  }

  private async getRequestsPerMinute(): Promise<number> {
    // This would be tracked by middleware
    // For now, return a placeholder
    return 50;
  }

  private async getAvgResponseTime(): Promise<number> {
    // This would be tracked by middleware
    // For now, return a placeholder
    return 250;
  }

  private async getErrorRate(): Promise<number> {
    // This would be calculated from error logs
    // For now, return a placeholder
    return 1.5;
  }

  private async getErrorCount(): Promise<number> {
    try {
      const { prisma } = await import('@/lib/prisma');
      const count = await prisma.auditLog.count({
        where: {
          entityType: 'system_error',
          createdAt: {
            gte: new Date(Date.now() - 60000), // Last minute
          },
        },
      });
      return count;
    } catch {
      return 0;
    }
  }

  private async getCriticalErrorCount(): Promise<number> {
    try {
      const { prisma } = await import('@/lib/prisma');
      const count = await prisma.auditLog.count({
        where: {
          entityType: 'system_error',
          createdAt: {
            gte: new Date(Date.now() - 60000), // Last minute
          },
          changes: {
            path: ['severity'],
            equals: 'critical',
          },
        },
      });
      return count;
    } catch {
      return 0;
    }
  }

  private async getLastError(): Promise<string | undefined> {
    try {
      const { prisma } = await import('@/lib/prisma');
      const lastError = await prisma.auditLog.findFirst({
        where: {
          entityType: 'system_error',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (lastError && lastError.changes) {
        const changes = lastError.changes as { message?: string };
        return changes.message;
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  // Public API methods
  public getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  public getMetrics(limit = 50): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  public getAlerts(limit = 50): Alert[] {
    return this.alerts.slice(-limit);
  }

  public async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;

      logInfo(`Alert resolved: ${alert.title}`, {
        component: 'monitoring',
        action: 'resolve_alert',
        metadata: {
          alertId,
          type: alert.type,
          severity: alert.severity,
        },
      });

      return true;
    }
    return false;
  }

  public async getSystemStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheck[];
    metrics: SystemMetrics | null;
    activeAlerts: number;
  }> {
    const checks = this.getHealthChecks();
    const metrics = this.metrics[this.metrics.length - 1] || null;
    const activeAlerts = this.alerts.filter((a) => !a.resolved).length;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Determine overall status based on health checks
    const unhealthyChecks = checks.filter((c) => c.status === 'unhealthy');
    const degradedChecks = checks.filter((c) => c.status === 'degraded');

    if (unhealthyChecks.length > 0) {
      status = 'unhealthy';
    } else if (degradedChecks.length > 0 || activeAlerts > 0) {
      status = 'degraded';
    }

    return {
      status,
      checks,
      metrics,
      activeAlerts,
    };
  }

  public destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    logInfo('Monitoring system destroyed', {
      component: 'monitoring',
      action: 'destroy',
    });
  }

  // Performance monitoring methods (consolidated from PerformanceMonitoringService)

  /**
   * Track page load performance
   */
  public trackPageLoad(
    pageOrMetric: string | Omit<PageLoadMetric, 'timestamp'>,
    loadTime?: number,
    metadata?: { userId?: string; userAgent?: string; [key: string]: any }
  ): void {
    if (!performanceConfig.monitoring.enabled) return;

    let metric: Omit<PageLoadMetric, 'timestamp'>;

    if (typeof pageOrMetric === 'string') {
      metric = {
        page: pageOrMetric,
        loadTime: loadTime!,
        userId: metadata?.userId,
        userAgent: metadata?.userAgent,
      };
    } else {
      metric = pageOrMetric;
    }

    const fullMetric: PageLoadMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.pageLoadMetrics.push(fullMetric);
    this.trimMetrics(this.pageLoadMetrics);

    // Check for performance issues
    this.checkPageLoadPerformance(fullMetric);
  }

  /**
   * Track user interaction performance
   */
  public trackInteraction(metric: Omit<InteractionMetric, 'timestamp'>): void {
    if (!performanceConfig.monitoring.enabled) return;

    const fullMetric: InteractionMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.interactionMetrics.push(fullMetric);
    this.trimMetrics(this.interactionMetrics);

    this.checkInteractionPerformance(fullMetric);
  }

  /**
   * Track system health metrics
   */
  public trackSystemHealth(
    metric: Omit<SystemHealthMetric, 'timestamp'>
  ): void {
    const fullMetric: SystemHealthMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.systemHealthMetrics.push(fullMetric);
    this.trimMetrics(this.systemHealthMetrics);

    this.checkSystemHealthMetric(fullMetric);
  }

  /**
   * Get performance dashboard data
   */
  public getPerformanceDashboard() {
    const pageLoadTimes = this.pageLoadMetrics.map((m) => m.loadTime);
    const interactionTimes = this.interactionMetrics.map((m) => m.duration);

    return {
      pageLoad: {
        average: this.calculateAverage(pageLoadTimes),
        p95: this.calculatePercentile(pageLoadTimes, 95),
        recent: pageLoadTimes.slice(-10),
      },
      interactions: {
        average: this.calculateAverage(interactionTimes),
        p95: this.calculatePercentile(interactionTimes, 95),
        recent: interactionTimes.slice(-10),
      },
      systemHealth: {
        status: this.getOverallHealthStatus(),
        metrics: this.systemHealthMetrics.slice(-10),
      },
      alerts: this.performanceAlerts.slice(-20),
    };
  }

  // Performance utility methods
  private trimMetrics(metrics: any[]): void {
    if (metrics.length > this.maxMetrics) {
      metrics.splice(0, metrics.length - this.maxMetrics);
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private checkPageLoadPerformance(metric: PageLoadMetric): void {
    const { thresholds } = performanceConfig;

    if (metric.loadTime > thresholds.pageLoad.critical) {
      this.createPerformanceAlert({
        type: 'slow_page',
        severity: 'critical',
        message: `Critical page load time: ${metric.page} took ${metric.loadTime}ms`,
        data: metric,
        timestamp: new Date(),
      });
    } else if (metric.loadTime > thresholds.pageLoad.warning) {
      this.createPerformanceAlert({
        type: 'slow_page',
        severity: 'medium',
        message: `Slow page load: ${metric.page} took ${metric.loadTime}ms`,
        data: metric,
        timestamp: new Date(),
      });
    }
  }

  private checkInteractionPerformance(metric: InteractionMetric): void {
    const { thresholds } = performanceConfig;

    if (metric.duration > thresholds.interaction.critical) {
      this.createPerformanceAlert({
        type: 'slow_query',
        severity: 'high',
        message: `Slow interaction: ${metric.action} on ${metric.component} took ${metric.duration}ms`,
        data: metric,
        timestamp: new Date(),
      });
    }
  }

  private checkSystemHealthMetric(metric: SystemHealthMetric): void {
    if (metric.status === 'critical') {
      this.createPerformanceAlert({
        type: 'system_health',
        severity: 'critical',
        message: `Critical system health: ${metric.metricType} at ${metric.value}`,
        data: metric,
        timestamp: new Date(),
      });
    }
  }

  private createPerformanceAlert(alert: PerformanceAlert): void {
    this.performanceAlerts.push(alert);

    // Keep only last 100 alerts
    if (this.performanceAlerts.length > 100) {
      this.performanceAlerts.splice(0, this.performanceAlerts.length - 100);
    }
  }

  private getOverallHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const recentMetrics = this.systemHealthMetrics.slice(-5);

    if (recentMetrics.some((m) => m.status === 'critical')) {
      return 'critical';
    }
    if (recentMetrics.some((m) => m.status === 'warning')) {
      return 'warning';
    }
    return 'healthy';
  }

  // Error logging methods (consolidated from error logging files)

  /**
   * Log server errors with comprehensive context
   */
  public async logError(
    error: Error | unknown,
    context: Omit<ErrorContext, 'timestamp'>
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const isServer = typeof window === 'undefined';

    const enhancedContext: ErrorContext = {
      ...context,
      timestamp: Date.now(),
      stack,
      severity:
        context.severity ||
        this.determineSeverity(errorMessage, context.component),
    };

    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fingerprint = this.createErrorFingerprint(
      errorMessage,
      enhancedContext
    );

    const errorLog: ErrorLog = {
      id: errorId,
      level: 'error',
      message: errorMessage,
      context: enhancedContext,
      resolved: false,
      timestamp: new Date().toISOString(),
      fingerprint,
    };

    this.errorLogs.push(errorLog);
    this.trimErrorLogs();

    // Store in database if on server and in production
    if (isServer && process.env.NODE_ENV === 'production') {
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.auditLog.create({
          data: {
            entityType: 'system_error',
            entityId: errorId,
            action: 'server_error',
            userId: context.userId || 'system',
            changes: {
              errorId,
              message: errorMessage,
              component: context.component,
              action: context.action,
              severity: enhancedContext.severity,
              stack: stack?.substring(0, 1000), // Limit stack trace size
              fingerprint,
            },
          },
        });
      } catch (dbError) {
        // Fallback to console logging if database fails
        console.error('Failed to log error to database:', dbError);
      }
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error logged:', {
        message: errorMessage,
        component: context.component,
        action: context.action,
        severity: enhancedContext.severity,
        stack: stack?.substring(0, 500),
      });
    }
  }

  /**
   * Get error logs with optional filtering
   */
  public getErrorLogs(options?: {
    limit?: number;
    severity?: ErrorContext['severity'];
    component?: string;
    resolved?: boolean;
  }): ErrorLog[] {
    let filtered = [...this.errorLogs];

    if (options?.severity) {
      filtered = filtered.filter(
        (log) => log.context.severity === options.severity
      );
    }

    if (options?.component) {
      filtered = filtered.filter(
        (log) => log.context.component === options.component
      );
    }

    if (options?.resolved !== undefined) {
      filtered = filtered.filter((log) => log.resolved === options.resolved);
    }

    const limit = options?.limit || 50;
    return filtered.slice(-limit);
  }

  /**
   * Mark an error as resolved
   */
  public resolveError(errorId: string): boolean {
    const error = this.errorLogs.find((log) => log.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  // Error utility methods
  private trimErrorLogs(): void {
    if (this.errorLogs.length > this.maxErrorLogs) {
      this.errorLogs.splice(0, this.errorLogs.length - this.maxErrorLogs);
    }
  }

  private createErrorFingerprint(
    message: string,
    context: ErrorContext
  ): string {
    const component = context.component;
    const action = context.action;
    const stackLines = context.stack?.split('\n').slice(0, 3).join('|') || '';

    const fingerprint = `${component}:${action}:${message}:${stackLines}`
      .replace(/\d+/g, 'N')
      .replace(/['"]/g, '')
      .toLowerCase();

    return Buffer.from(fingerprint).toString('base64').substring(0, 32);
  }

  private determineSeverity(
    message: string,
    component: string
  ): ErrorContext['severity'] {
    const msg = message.toLowerCase();
    const comp = component.toLowerCase();

    // Critical errors
    if (
      msg.includes('database') ||
      msg.includes('auth') ||
      msg.includes('security') ||
      msg.includes('payment') ||
      comp.includes('database') ||
      comp.includes('auth')
    ) {
      return 'critical';
    }

    // High priority errors
    if (
      msg.includes('server error') ||
      msg.includes('timeout') ||
      msg.includes('unauthorized')
    ) {
      return 'high';
    }

    // Medium priority errors
    if (
      msg.includes('not found') ||
      msg.includes('bad request') ||
      msg.includes('validation')
    ) {
      return 'medium';
    }

    return 'low';
  }
}

// Global monitoring instance
let globalMonitoring: MonitoringSystem | null = null;

export function initializeMonitoring(): MonitoringSystem {
  if (!globalMonitoring) {
    globalMonitoring = new MonitoringSystem();
  }
  return globalMonitoring;
}

export function getMonitoring(): MonitoringSystem | null {
  return globalMonitoring;
}

export function destroyMonitoring(): void {
  if (globalMonitoring) {
    globalMonitoring.destroy();
    globalMonitoring = null;
  }
}

// Initialize monitoring in production environments (server-side only)
if (
  typeof window === 'undefined' &&
  isMonitoringEnabled('enablePerformanceMonitoring')
) {
  initializeMonitoring();
}

export { MonitoringSystem };
