// Performance Monitoring System for HUNKCentral
// Tracks page load times, database performance, user interactions, and system health

import { prisma } from './prisma';
import { queryMonitor } from './queryOptimization';

// Performance metric types
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

// Performance monitoring service
class PerformanceMonitoringService {
  private pageLoadMetrics: PageLoadMetric[] = [];
  private interactionMetrics: InteractionMetric[] = [];
  private systemHealthMetrics: SystemHealthMetric[] = [];
  private alerts: PerformanceAlert[] = [];
  private readonly maxMetrics = 10000;

  // Performance thresholds
  private readonly thresholds = {
    pageLoad: {
      good: 1000, // 1 second
      warning: 3000, // 3 seconds
      critical: 5000, // 5 seconds
    },
    interaction: {
      good: 100, // 100ms
      warning: 500, // 500ms
      critical: 1000, // 1 second
    },
    database: {
      good: 100, // 100ms
      warning: 500, // 500ms
      critical: 1000, // 1 second
    },
    errorRate: {
      warning: 0.05, // 5%
      critical: 0.1, // 10%
    },
  };

  /**
   * Track page load performance
   */
  trackPageLoad(metric: Omit<PageLoadMetric, 'timestamp'>): void {
    const fullMetric: PageLoadMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.pageLoadMetrics.push(fullMetric);
    this.trimMetrics(this.pageLoadMetrics);

    // Check for performance issues
    this.checkPageLoadPerformance(fullMetric);

    // Store in database for long-term analysis
    this.storePerformanceMetric(
      'page_load',
      fullMetric.loadTime,
      fullMetric.page,
      {
        userId: fullMetric.userId,
        userAgent: fullMetric.userAgent,
      }
    );
  }

  /**
   * Track user interaction performance
   */
  trackInteraction(metric: Omit<InteractionMetric, 'timestamp'>): void {
    const fullMetric: InteractionMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.interactionMetrics.push(fullMetric);
    this.trimMetrics(this.interactionMetrics);

    // Check for interaction performance issues
    this.checkInteractionPerformance(fullMetric);

    // Store in database
    this.storePerformanceMetric(
      'interaction_delay',
      fullMetric.duration,
      fullMetric.component,
      {
        action: fullMetric.action,
        userId: fullMetric.userId,
        metadata: fullMetric.metadata,
      }
    );
  }

  /**
   * Track system health metrics
   */
  trackSystemHealth(metric: Omit<SystemHealthMetric, 'timestamp'>): void {
    const fullMetric: SystemHealthMetric = {
      ...metric,
      timestamp: new Date(),
    };

    this.systemHealthMetrics.push(fullMetric);
    this.trimMetrics(this.systemHealthMetrics);

    // Check for system health issues
    this.checkSystemHealth(fullMetric);
  }

  /**
   * Get performance dashboard data
   */
  getPerformanceDashboard(): {
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
      metrics: SystemHealthMetric[];
    };
    alerts: PerformanceAlert[];
  } {
    const pageLoadTimes = this.pageLoadMetrics.map((m) => m.loadTime);
    const interactionTimes = this.interactionMetrics.map((m) => m.duration);
    const dbStats = queryMonitor.getQueryStats();

    return {
      pageLoad: {
        average: this.calculateAverage(pageLoadTimes),
        p95: this.calculatePercentile(pageLoadTimes, 95),
        slowPages: this.getSlowPages(),
      },
      interactions: {
        average: this.calculateAverage(interactionTimes),
        p95: this.calculatePercentile(interactionTimes, 95),
        slowInteractions: this.getSlowInteractions(),
      },
      database: {
        average: dbStats.averageTime,
        slowQueries: dbStats.slowQueries,
        totalQueries: dbStats.totalQueries,
      },
      systemHealth: {
        status: this.getOverallSystemStatus(),
        metrics: this.systemHealthMetrics.slice(-10),
      },
      alerts: this.alerts.slice(-20),
    };
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(days = 7): Promise<{
    pageLoadTrend: Array<{ date: string; average: number; p95: number }>;
    errorRateTrend: Array<{ date: string; rate: number }>;
    systemHealthTrend: Array<{ date: string; status: string }>;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get performance metrics from database
    const metrics = await prisma.performanceMetric.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group by date and calculate trends
    const dailyMetrics = this.groupMetricsByDate(metrics);

    return {
      pageLoadTrend: dailyMetrics.map((day) => ({
        date: day.date,
        average: day.pageLoad.average,
        p95: day.pageLoad.p95,
      })),
      errorRateTrend: dailyMetrics.map((day) => ({
        date: day.date,
        rate: day.errorRate,
      })),
      systemHealthTrend: dailyMetrics.map((day) => ({
        date: day.date,
        status: day.systemStatus,
      })),
    };
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(): Promise<{
    summary: {
      averagePageLoad: number;
      slowPagesCount: number;
      databasePerformance: string;
      systemStatus: string;
      alertsCount: number;
    };
    recommendations: string[];
    criticalIssues: PerformanceAlert[];
  }> {
    const dashboard = this.getPerformanceDashboard();
    const recommendations: string[] = [];
    const criticalIssues = this.alerts.filter((a) => a.severity === 'critical');

    // Generate recommendations based on performance data
    if (dashboard.pageLoad.average > this.thresholds.pageLoad.warning) {
      recommendations.push(
        'Page load times are above optimal threshold. Consider implementing caching strategies.'
      );
    }

    if (dashboard.database.slowQueries > 10) {
      recommendations.push(
        'Multiple slow database queries detected. Review query optimization and indexing.'
      );
    }

    if (dashboard.interactions.average > this.thresholds.interaction.warning) {
      recommendations.push(
        'User interactions are slow. Consider optimizing component rendering and state management.'
      );
    }

    if (dashboard.systemHealth.status !== 'healthy') {
      recommendations.push(
        'System health issues detected. Review system resources and error logs.'
      );
    }

    return {
      summary: {
        averagePageLoad: Math.round(dashboard.pageLoad.average),
        slowPagesCount: dashboard.pageLoad.slowPages.length,
        databasePerformance:
          dashboard.database.average < this.thresholds.database.good
            ? 'Good'
            : dashboard.database.average < this.thresholds.database.warning
              ? 'Warning'
              : 'Critical',
        systemStatus: dashboard.systemHealth.status,
        alertsCount: dashboard.alerts.length,
      },
      recommendations,
      criticalIssues,
    };
  }

  // Private helper methods

  private trimMetrics<T>(metrics: T[]): void {
    if (metrics.length > this.maxMetrics) {
      metrics.splice(0, metrics.length - this.maxMetrics);
    }
  }

  private checkPageLoadPerformance(metric: PageLoadMetric): void {
    if (metric.loadTime > this.thresholds.pageLoad.critical) {
      this.createAlert(
        'slow_page',
        'critical',
        `Critical page load time: ${metric.page} took ${metric.loadTime}ms`,
        metric
      );
    } else if (metric.loadTime > this.thresholds.pageLoad.warning) {
      this.createAlert(
        'slow_page',
        'medium',
        `Slow page load: ${metric.page} took ${metric.loadTime}ms`,
        metric
      );
    }
  }

  private checkInteractionPerformance(metric: InteractionMetric): void {
    if (metric.duration > this.thresholds.interaction.critical) {
      this.createAlert(
        'slow_page',
        'high',
        `Slow interaction: ${metric.component}.${metric.action} took ${metric.duration}ms`,
        metric
      );
    }
  }

  private checkSystemHealth(metric: SystemHealthMetric): void {
    if (metric.status === 'critical') {
      this.createAlert(
        'system_health',
        'critical',
        `Critical system health: ${metric.metricType} = ${metric.value}`,
        metric
      );
    } else if (metric.status === 'warning') {
      this.createAlert(
        'system_health',
        'medium',
        `System health warning: ${metric.metricType} = ${metric.value}`,
        metric
      );
    }
  }

  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    data: any
  ): void {
    const alert: PerformanceAlert = {
      type,
      severity,
      message,
      data,
      timestamp: new Date(),
    };

    this.alerts.push(alert);
    this.trimMetrics(this.alerts);

    // Log critical alerts
    if (severity === 'critical') {
      console.error('Performance Alert:', message, data);
    }
  }

  private async storePerformanceMetric(
    metricType: string,
    value: number,
    page: string,
    metadata: any
  ): Promise<void> {
    try {
      await prisma.performanceMetric.create({
        data: {
          metricType,
          value,
          page,
          metadata,
        },
      });
    } catch (error) {
      console.error('Failed to store performance metric:', error);
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private getSlowPages(): Array<{ page: string; averageTime: number }> {
    const pageGroups = new Map<string, number[]>();

    for (const metric of this.pageLoadMetrics) {
      if (!pageGroups.has(metric.page)) {
        pageGroups.set(metric.page, []);
      }
      pageGroups.get(metric.page)!.push(metric.loadTime);
    }

    return Array.from(pageGroups.entries())
      .map(([page, times]) => ({
        page,
        averageTime: this.calculateAverage(times),
      }))
      .filter((item) => item.averageTime > this.thresholds.pageLoad.warning)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);
  }

  private getSlowInteractions(): Array<{
    component: string;
    action: string;
    averageTime: number;
  }> {
    const interactionGroups = new Map<string, number[]>();

    for (const metric of this.interactionMetrics) {
      const key = `${metric.component}.${metric.action}`;
      if (!interactionGroups.has(key)) {
        interactionGroups.set(key, []);
      }
      interactionGroups.get(key)!.push(metric.duration);
    }

    return Array.from(interactionGroups.entries())
      .map(([key, times]) => {
        const [component, action] = key.split('.');
        return {
          component,
          action,
          averageTime: this.calculateAverage(times),
        };
      })
      .filter((item) => item.averageTime > this.thresholds.interaction.warning)
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);
  }

  private getOverallSystemStatus(): 'healthy' | 'warning' | 'critical' {
    const recentMetrics = this.systemHealthMetrics.slice(-10);

    if (recentMetrics.some((m) => m.status === 'critical')) {
      return 'critical';
    }

    if (recentMetrics.some((m) => m.status === 'warning')) {
      return 'warning';
    }

    return 'healthy';
  }

  private groupMetricsByDate(metrics: any[]): Array<{
    date: string;
    pageLoad: { average: number; p95: number };
    errorRate: number;
    systemStatus: string;
  }> {
    const groups = new Map<string, any[]>();

    for (const metric of metrics) {
      const date = metric.timestamp.toISOString().split('T')[0];
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)!.push(metric);
    }

    return Array.from(groups.entries()).map(([date, dayMetrics]) => {
      const pageLoadMetrics = dayMetrics.filter(
        (m) => m.metricType === 'page_load'
      );
      const pageLoadTimes = pageLoadMetrics.map((m) => m.value);

      return {
        date,
        pageLoad: {
          average: this.calculateAverage(pageLoadTimes),
          p95: this.calculatePercentile(pageLoadTimes, 95),
        },
        errorRate: 0, // TODO: Calculate from error metrics
        systemStatus: 'healthy', // TODO: Calculate from system health metrics
      };
    });
  }
}

// Global performance monitoring instance
export const performanceMonitor = new PerformanceMonitoringService();

// Client-side performance tracking utilities
export function trackPageLoad(
  page: string,
  loadTime: number,
  userId?: string
): void {
  performanceMonitor.trackPageLoad({
    page,
    loadTime,
    userId,
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  });
}

export function trackInteraction(
  component: string,
  action: string,
  duration: number,
  userId?: string,
  metadata?: Record<string, any>
): void {
  performanceMonitor.trackInteraction({
    component,
    action,
    duration,
    userId,
    metadata,
  });
}

export function trackSystemHealth(
  metricType: SystemHealthMetric['metricType'],
  value: number,
  threshold?: number
): void {
  const status: SystemHealthMetric['status'] = threshold
    ? value > threshold
      ? 'critical'
      : 'healthy'
    : 'healthy';

  performanceMonitor.trackSystemHealth({
    metricType,
    value,
    threshold,
    status,
  });
}

// Performance monitoring hooks for React components
export function usePerformanceTracking(componentName: string) {
  const trackRender = (duration: number) => {
    trackInteraction(componentName, 'render', duration);
  };

  const trackAction = (
    action: string,
    duration: number,
    metadata?: Record<string, any>
  ) => {
    trackInteraction(componentName, action, duration, undefined, metadata);
  };

  return { trackRender, trackAction };
}

// Automatic performance monitoring setup
export function initializePerformanceMonitoring(): void {
  // Track page load performance
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      trackPageLoad(window.location.pathname, loadTime);
    });

    // Track navigation performance
    if ('navigation' in performance) {
      const nav = performance.navigation as any;
      if (nav.loadEventEnd && nav.navigationStart) {
        const loadTime = nav.loadEventEnd - nav.navigationStart;
        trackPageLoad(window.location.pathname, loadTime);
      }
    }
  }

  console.log('Performance monitoring initialized');
}

// Export the monitoring service for external use
export { performanceMonitor as default };
