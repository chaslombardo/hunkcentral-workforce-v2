'use server';

import { auth } from '@/lib/auth';
import { getMonitoring } from '@/lib/monitoring';
import {
  queryMonitor,
  getDatabasePerformanceStats,
  getIndexRecommendations,
} from '@/lib/queryOptimization';
import { databaseAlerting } from '@/lib/databasePerformanceAlerting';
import { getCacheHealthMetrics } from '@/lib/cacheInvalidation';
import { getBackgroundJobStatus } from '@/lib/backgroundJobsInit';

export interface PerformanceActionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Get comprehensive performance dashboard (admin only)
 */
export async function getPerformanceDashboard(): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    // Get performance data from all monitoring systems
    const [
      performanceDashboard,
      databaseStats,
      cacheHealth,
      backgroundJobStatus,
      indexRecommendations,
      databasePerformanceSummary,
    ] = await Promise.all([
      performanceMonitor.getPerformanceDashboard(),
      getDatabasePerformanceStats(),
      getCacheHealthMetrics(),
      Promise.resolve(getBackgroundJobStatus()),
      Promise.resolve(getIndexRecommendations()),
      databaseAlerting.getPerformanceSummary(),
    ]);

    return {
      success: true,
      data: {
        performance: performanceDashboard,
        database: databaseStats,
        cache: cacheHealth,
        backgroundJobs: backgroundJobStatus,
        recommendations: indexRecommendations,
        databaseHealth: databasePerformanceSummary,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get performance dashboard',
    };
  }
}

/**
 * Get performance trends over time (admin only)
 */
export async function getPerformanceTrends(
  days = 7
): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    const trends = await performanceMonitor.getPerformanceTrends(days);

    return {
      success: true,
      data: trends,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get performance trends',
    };
  }
}

/**
 * Generate performance report (admin only)
 */
export async function generatePerformanceReport(): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    const report = await performanceMonitor.generatePerformanceReport();

    return {
      success: true,
      data: report,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to generate performance report',
    };
  }
}

/**
 * Track page load performance (client-side)
 */
export async function trackPageLoadPerformance(
  page: string,
  loadTime: number,
  userAgent?: string
): Promise<PerformanceActionResult> {
  try {
    const session = await auth();

    performanceMonitor.trackPageLoad({
      page,
      loadTime,
      userId: session?.user?.id,
      userAgent,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to track page load',
    };
  }
}

/**
 * Track user interaction performance (client-side)
 */
export async function trackInteractionPerformance(
  component: string,
  action: string,
  duration: number,
  metadata?: Record<string, any>
): Promise<PerformanceActionResult> {
  try {
    const session = await auth();

    performanceMonitor.trackInteraction({
      component,
      action,
      duration,
      userId: session?.user?.id,
      metadata,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to track interaction',
    };
  }
}

/**
 * Get user-specific performance metrics
 */
export async function getUserPerformanceMetrics(): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Get basic performance metrics that don't require admin access
    const dashboard = performanceMonitor.getPerformanceDashboard();

    // Filter to only include non-sensitive data
    const userMetrics = {
      pageLoad: {
        average: dashboard.pageLoad.average,
        status:
          dashboard.pageLoad.average < 1000
            ? 'good'
            : dashboard.pageLoad.average < 3000
              ? 'warning'
              : 'slow',
      },
      interactions: {
        average: dashboard.interactions.average,
        status:
          dashboard.interactions.average < 100
            ? 'good'
            : dashboard.interactions.average < 500
              ? 'warning'
              : 'slow',
      },
      systemStatus: dashboard.systemHealth.status,
    };

    return {
      success: true,
      data: userMetrics,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get user performance metrics',
    };
  }
}

/**
 * Get performance alerts (admin only)
 */
export async function getPerformanceAlerts(): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    const dashboard = performanceMonitor.getPerformanceDashboard();

    return {
      success: true,
      data: {
        alerts: dashboard.alerts,
        criticalCount: dashboard.alerts.filter((a) => a.severity === 'critical')
          .length,
        warningCount: dashboard.alerts.filter(
          (a) => a.severity === 'medium' || a.severity === 'high'
        ).length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get performance alerts',
    };
  }
}

/**
 * Clear performance alerts (admin only)
 */
export async function clearPerformanceAlerts(): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    // Clear alerts by getting a fresh dashboard (alerts are trimmed automatically)
    performanceMonitor.getPerformanceDashboard();
    databaseAlerting.clearResolvedAlerts();

    return {
      success: true,
      data: { message: 'Performance alerts cleared' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear alerts',
    };
  }
}

/**
 * Get database alerts (admin only)
 */
export async function getDatabaseAlerts(): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    const activeAlerts = databaseAlerting.getActiveAlerts();
    const allAlerts = databaseAlerting.getAllAlerts();

    return {
      success: true,
      data: {
        activeAlerts,
        allAlerts,
        summary: await databaseAlerting.getPerformanceSummary(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get database alerts',
    };
  }
}

/**
 * Resolve database alert (admin only)
 */
export async function resolveDatabaseAlert(
  alertId: string
): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    const resolved = databaseAlerting.resolveAlert(alertId);

    return {
      success: resolved,
      data: { message: resolved ? 'Alert resolved' : 'Alert not found' },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to resolve database alert',
    };
  }
}

/**
 * Trigger database performance monitoring (admin only)
 */
export async function triggerDatabaseMonitoring(): Promise<PerformanceActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    await databaseAlerting.monitorPerformance();

    return {
      success: true,
      data: { message: 'Database monitoring triggered' },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to trigger database monitoring',
    };
  }
}
