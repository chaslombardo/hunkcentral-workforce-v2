// Database Performance Alerting System for HUNKCentral
// Monitors database performance and triggers alerts for issues

import { prisma } from './prisma';
import { queryMonitor } from './queryOptimization';
import { performanceMonitor } from './performanceMonitoring';

export interface DatabaseAlert {
  id: string;
  type:
    | 'slow_query'
    | 'connection_pool'
    | 'deadlock'
    | 'high_cpu'
    | 'storage_full';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
}

class DatabasePerformanceAlerting {
  private alerts: DatabaseAlert[] = [];
  private readonly thresholds = {
    slowQuery: 2000, // 2 seconds
    connectionPoolUsage: 80, // 80% of pool
    deadlockCount: 5, // 5 deadlocks per hour
    cpuUsage: 85, // 85% CPU usage
    storageUsage: 90, // 90% storage usage
  };

  /**
   * Monitor database performance and trigger alerts
   */
  async monitorPerformance(): Promise<void> {
    try {
      await Promise.all([
        this.checkSlowQueries(),
        this.checkConnectionPool(),
        this.checkDatabaseHealth(),
        this.checkStorageUsage(),
      ]);
    } catch (error) {
      console.error('Database performance monitoring error:', error);
    }
  }

  /**
   * Check for slow queries and alert if threshold exceeded
   */
  private async checkSlowQueries(): Promise<void> {
    const queryStats = queryMonitor.getQueryStats();
    const slowQueries = queryStats.recentQueries.filter(
      (q) => q.duration > this.thresholds.slowQuery
    );

    if (slowQueries.length > 0) {
      const alert: DatabaseAlert = {
        id: `slow-query-${Date.now()}`,
        type: 'slow_query',
        severity: slowQueries.length > 5 ? 'critical' : 'high',
        message: `${slowQueries.length} slow queries detected`,
        details: {
          queries: slowQueries.map((q) => ({
            query: q.query,
            duration: q.duration,
            timestamp: q.timestamp,
          })),
          averageTime: queryStats.averageTime,
          threshold: this.thresholds.slowQuery,
        },
        timestamp: new Date(),
        resolved: false,
      };

      this.addAlert(alert);
    }
  }

  /**
   * Check connection pool usage
   */
  private async checkConnectionPool(): Promise<void> {
    try {
      // Get connection pool stats from database
      const poolStats = await prisma.$queryRaw<
        Array<{
          state: string;
          count: bigint;
        }>
      >`
        SELECT state, count(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;

      const totalConnections = poolStats.reduce(
        (sum, stat) => sum + Number(stat.count),
        0
      );
      const activeConnections = poolStats
        .filter((stat) => stat.state === 'active')
        .reduce((sum, stat) => sum + Number(stat.count), 0);

      // Estimate pool usage (assuming default pool size of 20)
      const poolSize = 20;
      const poolUsage = (totalConnections / poolSize) * 100;

      if (poolUsage > this.thresholds.connectionPoolUsage) {
        const alert: DatabaseAlert = {
          id: `connection-pool-${Date.now()}`,
          type: 'connection_pool',
          severity: poolUsage > 95 ? 'critical' : 'high',
          message: `High connection pool usage: ${poolUsage.toFixed(1)}%`,
          details: {
            totalConnections,
            activeConnections,
            poolUsage,
            threshold: this.thresholds.connectionPoolUsage,
            poolStats,
          },
          timestamp: new Date(),
          resolved: false,
        };

        this.addAlert(alert);
      }
    } catch (error) {
      console.error('Connection pool monitoring error:', error);
    }
  }

  /**
   * Check overall database health
   */
  private async checkDatabaseHealth(): Promise<void> {
    try {
      // Check for deadlocks
      const deadlocks = await prisma.$queryRaw<
        Array<{
          deadlocks: bigint;
        }>
      >`
        SELECT deadlocks 
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;

      if (
        deadlocks.length > 0 &&
        Number(deadlocks[0].deadlocks) > this.thresholds.deadlockCount
      ) {
        const alert: DatabaseAlert = {
          id: `deadlock-${Date.now()}`,
          type: 'deadlock',
          severity: 'high',
          message: `High deadlock count: ${deadlocks[0].deadlocks}`,
          details: {
            deadlockCount: Number(deadlocks[0].deadlocks),
            threshold: this.thresholds.deadlockCount,
          },
          timestamp: new Date(),
          resolved: false,
        };

        this.addAlert(alert);
      }
    } catch (error) {
      console.error('Database health monitoring error:', error);
    }
  }

  /**
   * Check database storage usage
   */
  private async checkStorageUsage(): Promise<void> {
    try {
      const storageStats = await prisma.$queryRaw<
        Array<{
          database_size: string;
          table_name: string;
          size: string;
        }>
      >`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          schemaname||'.'||tablename as table_name,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;

      // Note: This is a simplified check. In production, you'd want to check against actual storage limits
      const alert: DatabaseAlert = {
        id: `storage-info-${Date.now()}`,
        type: 'storage_full',
        severity: 'low',
        message: 'Database storage usage information',
        details: {
          storageStats,
          timestamp: new Date(),
        },
        timestamp: new Date(),
        resolved: true, // This is just informational
      };

      // Only add if we have significant storage usage (this is informational)
      if (storageStats.length > 0) {
        this.addAlert(alert);
      }
    } catch (error) {
      console.error('Storage monitoring error:', error);
    }
  }

  /**
   * Add alert to the system
   */
  private addAlert(alert: DatabaseAlert): void {
    this.alerts.push(alert);

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('CRITICAL DATABASE ALERT:', alert.message, alert.details);
    } else if (alert.severity === 'high') {
      console.warn('HIGH DATABASE ALERT:', alert.message, alert.details);
    }

    // Integrate with performance monitoring system
    performanceMonitor.trackInteraction({
      component: 'database_alert',
      action: alert.type,
      duration: 0,
      metadata: {
        severity: alert.severity,
        message: alert.message,
      },
    });
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): DatabaseAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(): DatabaseAlert[] {
    return [...this.alerts];
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Clear all resolved alerts
   */
  clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter((alert) => !alert.resolved);
  }

  /**
   * Get database performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    const activeAlerts = this.getActiveAlerts();

    // Analyze alerts and provide recommendations
    const slowQueryAlerts = activeAlerts.filter((a) => a.type === 'slow_query');
    if (slowQueryAlerts.length > 0) {
      recommendations.push(
        'Consider optimizing slow queries with better indexing'
      );
      recommendations.push(
        'Review query patterns and consider using pre-computed metrics'
      );
    }

    const connectionPoolAlerts = activeAlerts.filter(
      (a) => a.type === 'connection_pool'
    );
    if (connectionPoolAlerts.length > 0) {
      recommendations.push('Consider increasing connection pool size');
      recommendations.push(
        'Review connection usage patterns and implement connection pooling'
      );
    }

    const deadlockAlerts = activeAlerts.filter((a) => a.type === 'deadlock');
    if (deadlockAlerts.length > 0) {
      recommendations.push('Review transaction patterns to reduce deadlocks');
      recommendations.push(
        'Consider implementing retry logic for deadlock scenarios'
      );
    }

    return recommendations;
  }

  /**
   * Get database performance summary
   */
  async getPerformanceSummary(): Promise<{
    health: 'good' | 'warning' | 'critical';
    activeAlerts: number;
    recommendations: string[];
    queryStats: any;
  }> {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === 'critical'
    );
    const highAlerts = activeAlerts.filter((a) => a.severity === 'high');

    let health: 'good' | 'warning' | 'critical' = 'good';
    if (criticalAlerts.length > 0) {
      health = 'critical';
    } else if (highAlerts.length > 0) {
      health = 'warning';
    }

    return {
      health,
      activeAlerts: activeAlerts.length,
      recommendations: this.getPerformanceRecommendations(),
      queryStats: queryMonitor.getQueryStats(),
    };
  }
}

// Export singleton instance
export const databaseAlerting = new DatabasePerformanceAlerting();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  // Monitor every 5 minutes
  setInterval(
    () => {
      databaseAlerting.monitorPerformance();
    },
    5 * 60 * 1000
  );
}
