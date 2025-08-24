// Intelligent Caching Strategies for HUNKCentral
// Provides advanced caching with warming, preloading, and smart invalidation

import { prisma } from './prisma';
import {
  getCachedMetrics,
  areMetricsFresh,
  calculatePrecomputedMetrics,
} from './metricsCalculator';
import {
  triggerDashboardMetricsComputation,
  triggerPayrollMetricsComputation,
  triggerUserPerformanceComputation,
} from './backgroundJobs';

// Cache configuration for different metric types
export interface CacheConfig {
  ttl: number; // Time to live in minutes
  warmupThreshold: number; // Minutes before expiry to trigger warmup
  preloadEnabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[]; // Other cache keys that affect this one
}

// Default cache configurations
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Dashboard metrics - high priority, frequent access
  dashboard_global: {
    ttl: 30, // 30 minutes
    warmupThreshold: 10, // Warm up 10 minutes before expiry
    preloadEnabled: true,
    priority: 'high',
    dependencies: ['payroll_summary', 'user_performance'],
  },

  dashboard_captain: {
    ttl: 15, // 15 minutes - more frequent updates for active users
    warmupThreshold: 5,
    preloadEnabled: true,
    priority: 'high',
    dependencies: ['payroll_summary'],
  },

  dashboard_manager: {
    ttl: 20, // 20 minutes
    warmupThreshold: 7,
    preloadEnabled: true,
    priority: 'high',
    dependencies: ['dashboard_global'],
  },

  dashboard_sales: {
    ttl: 20, // 20 minutes
    warmupThreshold: 7,
    preloadEnabled: true,
    priority: 'medium',
    dependencies: ['commission_summary'],
  },

  dashboard_admin: {
    ttl: 60, // 1 hour - less frequent changes
    warmupThreshold: 20,
    preloadEnabled: true,
    priority: 'medium',
    dependencies: ['dashboard_global'],
  },

  // Payroll metrics - critical for accuracy
  payroll_summary: {
    ttl: 60, // 1 hour
    warmupThreshold: 20,
    preloadEnabled: false, // On-demand only
    priority: 'critical',
    dependencies: [],
  },

  payroll_detailed: {
    ttl: 120, // 2 hours - expensive to compute
    warmupThreshold: 40,
    preloadEnabled: false,
    priority: 'critical',
    dependencies: ['payroll_summary'],
  },

  // Performance metrics
  user_performance: {
    ttl: 240, // 4 hours - relatively stable
    warmupThreshold: 60,
    preloadEnabled: false,
    priority: 'medium',
    dependencies: [],
  },

  // Commission metrics
  commission_summary: {
    ttl: 30, // 30 minutes
    warmupThreshold: 10,
    preloadEnabled: true,
    priority: 'medium',
    dependencies: [],
  },

  // Labor cost metrics
  labor_costs: {
    ttl: 60, // 1 hour
    warmupThreshold: 20,
    preloadEnabled: true,
    priority: 'medium',
    dependencies: ['payroll_summary'],
  },
};

// Cache warming and preloading service
export class IntelligentCacheService {
  private warmupInProgress = new Set<string>();
  private preloadInProgress = new Set<string>();

  /**
   * Get cached data with intelligent warming
   */
  async getCachedData(
    metricType: string,
    entityType?: string,
    entityId?: string,
    payPeriodId?: string,
    department?: string
  ): Promise<any | null> {
    const cacheKey = this.buildCacheKey(
      metricType,
      entityType,
      entityId,
      payPeriodId,
      department
    );
    const config = CACHE_CONFIGS[metricType] || this.getDefaultConfig();

    // Get cached data
    const cachedData = await getCachedMetrics(
      metricType,
      entityType,
      entityId,
      payPeriodId,
      department
    );

    if (!cachedData) {
      // No cached data - trigger computation and return null
      this.triggerComputation(
        metricType,
        entityType,
        entityId,
        payPeriodId,
        department,
        config.priority
      );
      return null;
    }

    const computedAt = new Date(cachedData.computedAt);
    const ageMinutes =
      (new Date().getTime() - computedAt.getTime()) / (1000 * 60);

    // Check if data is fresh
    if (areMetricsFresh(computedAt, config.ttl)) {
      // Data is fresh, but check if we should warm up
      if (ageMinutes >= config.ttl - config.warmupThreshold) {
        this.scheduleWarmup(
          cacheKey,
          metricType,
          entityType,
          entityId,
          payPeriodId,
          department,
          config
        );
      }
      return cachedData.data;
    }

    // Data is stale - trigger immediate computation and return stale data
    this.triggerComputation(
      metricType,
      entityType,
      entityId,
      payPeriodId,
      department,
      'high'
    );
    return cachedData.data; // Return stale data while fresh data is being computed
  }

  /**
   * Preload cache for frequently accessed data
   */
  async preloadCache(): Promise<void> {
    console.log('Starting intelligent cache preloading...');

    const preloadTasks: Promise<void>[] = [];

    // Get active users for preloading
    const activeUsers = await prisma.user.findMany({
      where: {
        // Users who have logged in recently or have recent activity
        OR: [
          {
            updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          {
            dailyLogs: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        ],
      },
      select: { id: true, roles: true },
      take: 20, // Limit to most active users
    });

    // Get current pay period
    const currentPayPeriod = await prisma.payPeriod.findFirst({
      where: { status: 'open' },
      orderBy: { startDate: 'desc' },
    });

    // Preload global dashboard metrics
    for (const [metricType, config] of Object.entries(CACHE_CONFIGS)) {
      if (!config.preloadEnabled) continue;

      if (metricType === 'dashboard_global') {
        preloadTasks.push(
          this.preloadMetric(
            metricType,
            'global',
            undefined,
            currentPayPeriod?.id
          )
        );
      }
    }

    // Preload user-specific metrics for active users
    for (const user of activeUsers) {
      const userMetricTypes = this.getUserMetricTypes(user.roles);

      for (const metricType of userMetricTypes) {
        const config = CACHE_CONFIGS[metricType];
        if (config?.preloadEnabled) {
          preloadTasks.push(
            this.preloadMetric(
              metricType,
              'user',
              user.id,
              currentPayPeriod?.id
            )
          );
        }
      }
    }

    // Execute preload tasks with concurrency limit
    await this.executeConcurrentTasks(preloadTasks, 5);
    console.log(`Cache preloading completed: ${preloadTasks.length} tasks`);
  }

  /**
   * Warm up cache entries that are approaching expiry
   */
  async warmupCache(): Promise<void> {
    console.log('Starting intelligent cache warmup...');

    // Get metrics that are approaching expiry
    const approachingExpiry = await this.getMetricsApproachingExpiry();

    const warmupTasks: Promise<void>[] = [];

    for (const metric of approachingExpiry) {
      const config =
        CACHE_CONFIGS[metric.metricType] || this.getDefaultConfig();
      const cacheKey = this.buildCacheKey(
        metric.metricType,
        metric.entityType || undefined,
        metric.entityId || undefined,
        metric.payPeriodId || undefined,
        metric.department || undefined
      );

      if (!this.warmupInProgress.has(cacheKey)) {
        warmupTasks.push(
          this.warmupMetric(
            cacheKey,
            metric.metricType,
            metric.entityType || undefined,
            metric.entityId || undefined,
            metric.payPeriodId || undefined,
            metric.department || undefined,
            config
          )
        );
      }
    }

    await this.executeConcurrentTasks(warmupTasks, 3);
    console.log(`Cache warmup completed: ${warmupTasks.length} tasks`);
  }

  /**
   * Invalidate cache and dependent caches
   */
  async invalidateWithDependencies(
    metricType: string,
    entityId?: string
  ): Promise<void> {
    const config = CACHE_CONFIGS[metricType];
    if (!config) return;

    // Invalidate the primary cache
    await this.invalidateCache(metricType, entityId);

    // Invalidate dependent caches
    for (const dependentType of config.dependencies) {
      await this.invalidateCache(dependentType, entityId);
    }

    // Find caches that depend on this one
    for (const [otherType, otherConfig] of Object.entries(CACHE_CONFIGS)) {
      if (otherConfig.dependencies.includes(metricType)) {
        await this.invalidateCache(otherType, entityId);
      }
    }
  }

  // Private helper methods

  private buildCacheKey(
    metricType: string,
    entityType?: string,
    entityId?: string,
    payPeriodId?: string,
    department?: string
  ): string {
    return `${metricType}-${entityType || 'null'}-${entityId || 'null'}-${payPeriodId || 'null'}-${department || 'null'}`;
  }

  private getDefaultConfig(): CacheConfig {
    return {
      ttl: 60,
      warmupThreshold: 20,
      preloadEnabled: false,
      priority: 'medium',
      dependencies: [],
    };
  }

  private getUserMetricTypes(roles: string[]): string[] {
    const metricTypes: string[] = [];

    if (roles.includes('captain')) {
      metricTypes.push('dashboard_captain', 'user_performance');
    }
    if (roles.includes('manager')) {
      metricTypes.push('dashboard_manager');
    }
    if (roles.includes('sales')) {
      metricTypes.push('dashboard_sales', 'commission_summary');
    }
    if (roles.includes('admin')) {
      metricTypes.push('dashboard_admin');
    }

    return metricTypes;
  }

  private async preloadMetric(
    metricType: string,
    entityType?: string,
    entityId?: string,
    payPeriodId?: string,
    department?: string
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(
      metricType,
      entityType,
      entityId,
      payPeriodId,
      department
    );

    if (this.preloadInProgress.has(cacheKey)) {
      return;
    }

    this.preloadInProgress.add(cacheKey);

    try {
      // Check if data already exists and is fresh
      const existing = await getCachedMetrics(
        metricType,
        entityType,
        entityId,
        payPeriodId,
        department
      );
      const config = CACHE_CONFIGS[metricType] || this.getDefaultConfig();

      if (
        existing &&
        areMetricsFresh(new Date(existing.computedAt), config.ttl)
      ) {
        return; // Already fresh
      }

      // Trigger computation
      await this.triggerComputation(
        metricType,
        entityType,
        entityId,
        payPeriodId,
        department,
        'low'
      );
    } finally {
      this.preloadInProgress.delete(cacheKey);
    }
  }

  private async scheduleWarmup(
    cacheKey: string,
    metricType: string,
    entityType?: string,
    entityId?: string,
    payPeriodId?: string,
    department?: string,
    config?: CacheConfig
  ): Promise<void> {
    if (this.warmupInProgress.has(cacheKey)) {
      return;
    }

    // Schedule warmup with a small delay to avoid immediate execution
    setTimeout(() => {
      this.warmupMetric(
        cacheKey,
        metricType,
        entityType,
        entityId,
        payPeriodId,
        department,
        config
      );
    }, 1000);
  }

  private async warmupMetric(
    cacheKey: string,
    metricType: string,
    entityType?: string,
    entityId?: string,
    payPeriodId?: string,
    department?: string,
    config?: CacheConfig
  ): Promise<void> {
    if (this.warmupInProgress.has(cacheKey)) {
      return;
    }

    this.warmupInProgress.add(cacheKey);

    try {
      const priority = config?.priority || 'medium';
      await this.triggerComputation(
        metricType,
        entityType,
        entityId,
        payPeriodId,
        department,
        priority
      );
    } finally {
      this.warmupInProgress.delete(cacheKey);
    }
  }

  private async triggerComputation(
    metricType: string,
    entityType?: string,
    entityId?: string,
    payPeriodId?: string,
    department?: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      switch (metricType) {
        case 'dashboard_global':
        case 'dashboard_captain':
        case 'dashboard_manager':
        case 'dashboard_sales':
        case 'dashboard_admin':
          await triggerDashboardMetricsComputation(
            entityId,
            payPeriodId,
            priority
          );
          break;

        case 'payroll_summary':
        case 'payroll_detailed':
          if (payPeriodId) {
            await triggerPayrollMetricsComputation(
              payPeriodId,
              entityId,
              priority
            );
          }
          break;

        case 'user_performance':
          if (entityId) {
            await triggerUserPerformanceComputation(
              entityId,
              payPeriodId,
              priority
            );
          }
          break;

        default:
          // For other metric types, use the generic calculation
          await calculatePrecomputedMetrics(metricType, {
            userId: entityId,
            payPeriodId,
            department,
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to trigger computation for ${metricType}:`, error);
    }
  }

  private async getMetricsApproachingExpiry(): Promise<
    Array<{
      metricType: string;
      entityType: string | null;
      entityId: string | null;
      payPeriodId: string | null;
      department: string | null;
      computedAt: Date;
    }>
  > {
    const now = new Date();
    const approaching: any[] = [];

    // Get all cached metrics
    const allMetrics = await prisma.precomputedMetric.findMany({
      select: {
        metricType: true,
        entityType: true,
        entityId: true,
        payPeriodId: true,
        department: true,
        computedAt: true,
      },
    });

    for (const metric of allMetrics) {
      const config = CACHE_CONFIGS[metric.metricType];
      if (!config) continue;

      const ageMinutes =
        (now.getTime() - metric.computedAt.getTime()) / (1000 * 60);
      const warmupThreshold = config.ttl - config.warmupThreshold;

      if (ageMinutes >= warmupThreshold && ageMinutes < config.ttl) {
        approaching.push(metric);
      }
    }

    return approaching;
  }

  private async invalidateCache(
    metricType: string,
    entityId?: string
  ): Promise<void> {
    const whereClause: any = { metricType };

    if (entityId) {
      whereClause.entityId = entityId;
    }

    await prisma.precomputedMetric.deleteMany({
      where: whereClause,
    });
  }

  private async executeConcurrentTasks(
    tasks: Promise<void>[],
    concurrency: number
  ): Promise<void> {
    const executing: Promise<void>[] = [];

    for (const task of tasks) {
      const promise = task.then(() => {
        executing.splice(executing.indexOf(promise), 1);
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
  }
}

// Global cache service instance
export const intelligentCache = new IntelligentCacheService();

// Scheduled cache operations
export function startIntelligentCaching(): void {
  console.log('Starting intelligent caching system...');

  // Preload cache on startup (with delay)
  setTimeout(() => {
    intelligentCache.preloadCache().catch(console.error);
  }, 10000); // 10 seconds after startup

  // Schedule regular warmup (every 5 minutes)
  setInterval(
    () => {
      intelligentCache.warmupCache().catch(console.error);
    },
    5 * 60 * 1000
  );

  // Schedule regular preload (every 30 minutes)
  setInterval(
    () => {
      intelligentCache.preloadCache().catch(console.error);
    },
    30 * 60 * 1000
  );

  console.log('Intelligent caching system started');
}

// Export helper functions for use in server actions
export async function getCachedDataWithWarming(
  metricType: string,
  entityType?: string,
  entityId?: string,
  payPeriodId?: string,
  department?: string
): Promise<any | null> {
  return intelligentCache.getCachedData(
    metricType,
    entityType,
    entityId,
    payPeriodId,
    department
  );
}

export async function invalidateCacheWithDependencies(
  metricType: string,
  entityId?: string
): Promise<void> {
  return intelligentCache.invalidateWithDependencies(metricType, entityId);
}
