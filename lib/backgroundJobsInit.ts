// Background Jobs Initialization and Management
// Handles startup, scheduling, and monitoring of background job processing

import {
  jobQueue,
  startJobQueueCleanup,
  refreshAllMetrics,
} from './backgroundJobs';
import {
  cleanupExpiredMetrics,
  getCacheHealthMetrics,
} from './cacheInvalidation';
import { startIntelligentCaching } from './intelligentCache';

// Background job processing configuration
export interface BackgroundJobConfig {
  enabled: boolean;
  cleanupInterval: number; // milliseconds
  healthCheckInterval: number; // milliseconds
  metricsRefreshInterval: number; // milliseconds
  maxConcurrentJobs: number;
}

// Default configuration
const defaultConfig: BackgroundJobConfig = {
  enabled: process.env.NODE_ENV !== 'test',
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  healthCheckInterval: 10 * 60 * 1000, // 10 minutes
  metricsRefreshInterval: 60 * 60 * 1000, // 1 hour
  maxConcurrentJobs: 5,
};

// Global state for background job management
let isInitialized = false;
let cleanupIntervalId: NodeJS.Timeout | null = null;
let healthCheckIntervalId: NodeJS.Timeout | null = null;
let metricsRefreshIntervalId: NodeJS.Timeout | null = null;

/**
 * Initialize background job processing system
 */
export function initializeBackgroundJobs(
  config: Partial<BackgroundJobConfig> = {}
): void {
  if (isInitialized) {
    console.log('Background jobs already initialized');
    return;
  }

  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.enabled) {
    console.log('Background jobs disabled');
    return;
  }

  console.log('Initializing background job processing system...');

  // Start intelligent caching system
  startIntelligentCaching();

  // Start job queue cleanup
  if (finalConfig.cleanupInterval > 0) {
    startJobQueueCleanup(finalConfig.cleanupInterval);
    console.log(
      `Job queue cleanup scheduled every ${finalConfig.cleanupInterval / 1000}s`
    );
  }

  // Start cache cleanup
  if (finalConfig.cleanupInterval > 0) {
    cleanupIntervalId = setInterval(() => {
      cleanupExpiredMetrics().catch((error) => {
        console.error('Cache cleanup failed:', error);
      });
    }, finalConfig.cleanupInterval);
    console.log(
      `Cache cleanup scheduled every ${finalConfig.cleanupInterval / 1000}s`
    );
  }

  // Start health checks
  if (finalConfig.healthCheckInterval > 0) {
    healthCheckIntervalId = setInterval(() => {
      performHealthCheck().catch((error) => {
        console.error('Health check failed:', error);
      });
    }, finalConfig.healthCheckInterval);
    console.log(
      `Health checks scheduled every ${finalConfig.healthCheckInterval / 1000}s`
    );
  }

  // Start periodic metrics refresh (for critical system metrics)
  if (finalConfig.metricsRefreshInterval > 0) {
    metricsRefreshIntervalId = setInterval(() => {
      refreshCriticalMetrics().catch((error) => {
        console.error('Critical metrics refresh failed:', error);
      });
    }, finalConfig.metricsRefreshInterval);
    console.log(
      `Critical metrics refresh scheduled every ${finalConfig.metricsRefreshInterval / 1000}s`
    );
  }

  isInitialized = true;
  console.log('Background job processing system initialized successfully');
}

/**
 * Shutdown background job processing system
 */
export function shutdownBackgroundJobs(): void {
  if (!isInitialized) {
    return;
  }

  console.log('Shutting down background job processing system...');

  // Clear all intervals
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }

  if (healthCheckIntervalId) {
    clearInterval(healthCheckIntervalId);
    healthCheckIntervalId = null;
  }

  if (metricsRefreshIntervalId) {
    clearInterval(metricsRefreshIntervalId);
    metricsRefreshIntervalId = null;
  }

  isInitialized = false;
  console.log('Background job processing system shut down');
}

/**
 * Perform health check on the background job system
 */
async function performHealthCheck(): Promise<void> {
  try {
    // Get cache health metrics
    const cacheHealth = await getCacheHealthMetrics();

    // Log health status
    console.log('Background job system health check:', {
      totalMetrics: cacheHealth.totalMetrics,
      expiredMetrics: cacheHealth.expiredMetrics,
      metricTypes: Object.keys(cacheHealth.metricsByType).length,
      oldestMetric: cacheHealth.oldestMetric,
      newestMetric: cacheHealth.newestMetric,
    });

    // Alert if too many expired metrics
    if (cacheHealth.expiredMetrics > 100) {
      console.warn(
        `High number of expired metrics detected: ${cacheHealth.expiredMetrics}`
      );
    }

    // Alert if no recent metrics
    if (
      cacheHealth.newestMetric &&
      new Date().getTime() - cacheHealth.newestMetric.getTime() >
        2 * 60 * 60 * 1000
    ) {
      console.warn('No recent metrics computed in the last 2 hours');
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
}

/**
 * Refresh critical system metrics that should always be available
 */
async function refreshCriticalMetrics(): Promise<void> {
  try {
    console.log('Refreshing critical system metrics...');

    // This is a lightweight refresh - only refresh global dashboard metrics
    // User-specific metrics will be refreshed on-demand
    await refreshAllMetrics();

    console.log('Critical metrics refresh completed');
  } catch (error) {
    console.error('Critical metrics refresh failed:', error);
  }
}

/**
 * Get background job system status
 */
export function getBackgroundJobStatus(): {
  initialized: boolean;
  enabled: boolean;
  intervals: {
    cleanup: boolean;
    healthCheck: boolean;
    metricsRefresh: boolean;
  };
} {
  return {
    initialized: isInitialized,
    enabled: defaultConfig.enabled,
    intervals: {
      cleanup: cleanupIntervalId !== null,
      healthCheck: healthCheckIntervalId !== null,
      metricsRefresh: metricsRefreshIntervalId !== null,
    },
  };
}

/**
 * Manually trigger a full system metrics refresh
 */
export async function triggerFullMetricsRefresh(): Promise<void> {
  console.log('Triggering full system metrics refresh...');
  await refreshAllMetrics();
  console.log('Full system metrics refresh completed');
}

/**
 * Manually trigger cache cleanup
 */
export async function triggerCacheCleanup(): Promise<void> {
  console.log('Triggering cache cleanup...');
  await cleanupExpiredMetrics();
  console.log('Cache cleanup completed');
}

// Export for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).__backgroundJobs = {
    initialize: initializeBackgroundJobs,
    shutdown: shutdownBackgroundJobs,
    getStatus: getBackgroundJobStatus,
    triggerRefresh: triggerFullMetricsRefresh,
    triggerCleanup: triggerCacheCleanup,
    performHealthCheck,
  };
}

// Auto-initialize in production
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Initialize with a small delay to allow the application to start up
  setTimeout(() => {
    initializeBackgroundJobs();
  }, 5000);
}
