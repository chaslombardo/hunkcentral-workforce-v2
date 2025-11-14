// Unified Caching System for HUNKCentral
// Consolidates intelligent caching strategies with smart invalidation

import { prisma } from './prisma';
import {
  getCachedMetrics,
  areMetricsFresh,
  calculatePrecomputedMetrics,
} from './metricsCalculator';
import {
  triggerDashboardMetricsComputation,
  triggerPayrollMetricsComputation,
  triggerLaborCostMetricsComputation,
  triggerCommissionMetricsComputation,
  triggerUserPerformanceComputation,
  invalidateMetricsCache,
} from './backgroundJobs';

// Cache configuration
export interface CacheConfig {
  ttl: number;
  warmupThreshold: number;
  preloadEnabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
}

// Invalidation rules
export interface InvalidationRule {
  trigger: string;
  affectedMetrics: string[];
  scope: 'user' | 'global' | 'payPeriod' | 'department';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Cache configurations
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  dashboard_global: {
    ttl: 30,
    warmupThreshold: 10,
    preloadEnabled: true,
    priority: 'high',
    dependencies: ['payroll_summary'],
  },
  dashboard_captain: {
    ttl: 15,
    warmupThreshold: 5,
    preloadEnabled: true,
    priority: 'high',
    dependencies: ['payroll_summary'],
  },
  dashboard_manager: {
    ttl: 20,
    warmupThreshold: 7,
    preloadEnabled: true,
    priority: 'high',
    dependencies: ['dashboard_global'],
  },
  dashboard_sales: {
    ttl: 20,
    warmupThreshold: 7,
    preloadEnabled: true,
    priority: 'medium',
    dependencies: ['commission_summary'],
  },
  dashboard_admin: {
    ttl: 60,
    warmupThreshold: 20,
    preloadEnabled: true,
    priority: 'medium',
    dependencies: ['dashboard_global'],
  },
  payroll_summary: {
    ttl: 60,
    warmupThreshold: 20,
    preloadEnabled: false,
    priority: 'critical',
    dependencies: [],
  },
  payroll_detailed: {
    ttl: 120,
    warmupThreshold: 40,
    preloadEnabled: false,
    priority: 'critical',
    dependencies: ['payroll_summary'],
  },
  user_performance: {
    ttl: 240,
    warmupThreshold: 60,
    preloadEnabled: false,
    priority: 'medium',
    dependencies: [],
  },
  commission_summary: {
    ttl: 30,
    warmupThreshold: 10,
    preloadEnabled: true,
    priority: 'medium',
    dependencies: [],
  },
  labor_costs: {
    ttl: 60,
    warmupThreshold: 20,
    preloadEnabled: true,
    priority: 'medium',
    dependencies: ['payroll_summary'],
  },
};

// Invalidation rules
const INVALIDATION_RULES: InvalidationRule[] = [
  {
    trigger: 'dailyLog.created',
    affectedMetrics: [
      'dashboard_captain',
      'dashboard_manager',
      'payroll_summary',
    ],
    scope: 'user',
    priority: 'medium',
  },
  {
    trigger: 'dailyLog.updated',
    affectedMetrics: [
      'dashboard_captain',
      'dashboard_manager',
      'payroll_summary',
      'labor_costs',
    ],
    scope: 'user',
    priority: 'high',
  },
  {
    trigger: 'dailyLog.approved',
    affectedMetrics: [
      'dashboard_captain',
      'dashboard_manager',
      'payroll_summary',
      'labor_costs',
      'user_performance',
    ],
    scope: 'global',
    priority: 'high',
  },
  {
    trigger: 'commission.matched',
    affectedMetrics: [
      'dashboard_sales',
      'commission_summary',
      'payroll_summary',
    ],
    scope: 'user',
    priority: 'high',
  },
  {
    trigger: 'user.ratesUpdated',
    affectedMetrics: ['payroll_summary', 'labor_costs'],
    scope: 'global',
    priority: 'high',
  },
  {
    trigger: 'payPeriod.locked',
    affectedMetrics: ['payroll_summary', 'labor_costs'],
    scope: 'payPeriod',
    priority: 'critical',
  },
];

// Unified cache service
export class UnifiedCacheService {
  private warmupInProgress = new Set<string>();
  private preloadInProgress = new Set<string>();

  async getCachedData(
    metricType: string,
    entityType?: string,
    entityId?: string,
    payPeriodId?: string,
    department?: string
  ): Promise<any | null> {
    const config = CACHE_CONFIGS[metricType] || this.getDefaultConfig();
    const cachedData = await getCachedMetrics(
      metricType,
      entityType,
      entityId,
      payPeriodId,
      department
    );

    if (!cachedData) {
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

    if (areMetricsFresh(computedAt, config.ttl)) {
      if (ageMinutes >= config.ttl - config.warmupThreshold) {
        this.scheduleWarmup(
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

    this.triggerComputation(
      metricType,
      entityType,
      entityId,
      payPeriodId,
      department,
      'high'
    );
    return cachedData.data;
  }

  async handleDataChange(
    trigger: string,
    entityId: string,
    additionalData?: any
  ): Promise<void> {
    const applicableRules = INVALIDATION_RULES.filter(
      (rule) => rule.trigger === trigger
    );
    if (applicableRules.length === 0) return;

    const promises = applicableRules.map((rule) =>
      this.processInvalidationRule(rule, entityId, additionalData)
    );
    await Promise.all(promises);
  }

  async invalidateWithDependencies(
    metricType: string,
    entityId?: string
  ): Promise<void> {
    const config = CACHE_CONFIGS[metricType];
    if (!config) return;

    await this.invalidateCache(metricType, entityId);
    for (const dependentType of config.dependencies) {
      await this.invalidateCache(dependentType, entityId);
    }
    for (const [otherType, otherConfig] of Object.entries(CACHE_CONFIGS)) {
      if (otherConfig.dependencies.includes(metricType)) {
        await this.invalidateCache(otherType, entityId);
      }
    }
  }

  async preloadCache(): Promise<void> {
    console.log('Starting cache preloading...');
    const activeUsers = await prisma.user.findMany({
      where: {
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
      take: 20,
    });

    const currentPayPeriod = await prisma.payPeriod.findFirst({
      where: { status: 'open' },
      orderBy: { startDate: 'desc' },
    });

    const preloadTasks: Promise<void>[] = [];
    for (const [metricType, config] of Object.entries(CACHE_CONFIGS)) {
      if (config.preloadEnabled && metricType === 'dashboard_global') {
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

    await this.executeConcurrentTasks(preloadTasks, 5);
    console.log(`Cache preloading completed: ${preloadTasks.length} tasks`);
  }

  async warmupCache(): Promise<void> {
    console.log('Starting cache warmup...');
    const approachingExpiry = await this.getMetricsApproachingExpiry();
    const warmupTasks: Promise<void>[] = [];

    for (const metric of approachingExpiry) {
      const config =
        CACHE_CONFIGS[metric.metricType] || this.getDefaultConfig();
      const cacheKey = this.buildCacheKey(
        metric.metricType,
        metric.entityType,
        metric.entityId,
        metric.payPeriodId,
        metric.department
      );

      if (!this.warmupInProgress.has(cacheKey)) {
        warmupTasks.push(
          this.warmupMetric(
            cacheKey,
            metric.metricType,
            metric.entityType,
            metric.entityId,
            metric.payPeriodId,
            metric.department,
            config
          )
        );
      }
    }

    await this.executeConcurrentTasks(warmupTasks, 3);
    console.log(`Cache warmup completed: ${warmupTasks.length} tasks`);
  }

  async cleanupExpiredMetrics(): Promise<void> {
    const deletedCount = await prisma.precomputedMetric.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    console.log(`Cleaned up ${deletedCount.count} expired metrics`);
  }

  async getCacheHealthMetrics(): Promise<{
    totalMetrics: number;
    expiredMetrics: number;
    metricsByType: Record<string, number>;
    oldestMetric: Date | null;
    newestMetric: Date | null;
  }> {
    const totalMetrics = await prisma.precomputedMetric.count();

    const expiredMetrics = await prisma.precomputedMetric.count({
      where: { expiresAt: { lt: new Date() } },
    });

    const metricsByType = await prisma.precomputedMetric.groupBy({
      by: ['metricType'],
      _count: { metricType: true },
    });

    const oldestMetric = await prisma.precomputedMetric.findFirst({
      orderBy: { computedAt: 'asc' },
      select: { computedAt: true },
    });

    const newestMetric = await prisma.precomputedMetric.findFirst({
      orderBy: { computedAt: 'desc' },
      select: { computedAt: true },
    });

    return {
      totalMetrics,
      expiredMetrics,
      metricsByType: metricsByType.reduce(
        (acc, item) => {
          acc[item.metricType] = item._count.metricType;
          return acc;
        },
        {} as Record<string, number>
      ),
      oldestMetric: oldestMetric?.computedAt || null,
      newestMetric: newestMetric?.computedAt || null,
    };
  }

  // Private methods
  private getDefaultConfig(): CacheConfig {
    return {
      ttl: 60,
      warmupThreshold: 20,
      preloadEnabled: false,
      priority: 'medium',
      dependencies: [],
    };
  }

  private buildCacheKey(
    metricType: string,
    entityType?: string | null,
    entityId?: string | null,
    payPeriodId?: string | null,
    department?: string | null
  ): string {
    return `${metricType}-${entityType || 'null'}-${entityId || 'null'}-${payPeriodId || 'null'}-${department || 'null'}`;
  }

  private getUserMetricTypes(roles: string[]): string[] {
    const metricTypes: string[] = [];
    if (roles.includes('captain'))
      metricTypes.push('dashboard_captain', 'user_performance');
    if (roles.includes('manager')) metricTypes.push('dashboard_manager');
    if (roles.includes('sales'))
      metricTypes.push('dashboard_sales', 'commission_summary');
    if (roles.includes('admin')) metricTypes.push('dashboard_admin');
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
    if (this.preloadInProgress.has(cacheKey)) return;

    this.preloadInProgress.add(cacheKey);
    try {
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
      )
        return;
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

  private async scheduleWarmup(
    metricType: string,
    entityType?: string,
    entityId?: string,
    payPeriodId?: string,
    department?: string,
    config?: CacheConfig
  ): Promise<void> {
    const cacheKey = this.buildCacheKey(
      metricType,
      entityType,
      entityId,
      payPeriodId,
      department
    );
    if (this.warmupInProgress.has(cacheKey)) return;
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
    entityType?: string | null,
    entityId?: string | null,
    payPeriodId?: string | null,
    department?: string | null,
    config?: CacheConfig
  ): Promise<void> {
    if (this.warmupInProgress.has(cacheKey)) return;
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
    entityType?: string | null,
    entityId?: string | null,
    payPeriodId?: string | null,
    department?: string | null,
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
            entityId || undefined,
            payPeriodId || undefined,
            priority
          );
          break;
        case 'payroll_summary':
        case 'payroll_detailed':
          if (payPeriodId)
            await triggerPayrollMetricsComputation(
              payPeriodId,
              entityId || undefined,
              priority
            );
          break;
        case 'user_performance':
          if (entityId)
            await triggerUserPerformanceComputation(
              entityId,
              payPeriodId || undefined,
              priority
            );
          break;
        default:
          await calculatePrecomputedMetrics(metricType, {
            userId: entityId || undefined,
            payPeriodId: payPeriodId || undefined,
            department: department || undefined,
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to trigger computation for ${metricType}:`, error);
    }
  }

  private async processInvalidationRule(
    rule: InvalidationRule,
    entityId: string,
    additionalData?: any
  ): Promise<void> {
    for (const metricType of rule.affectedMetrics) {
      switch (rule.scope) {
        case 'user':
          await this.invalidateUserMetrics(metricType, entityId, rule.priority);
          break;
        case 'global':
          await this.invalidateGlobalMetrics(
            metricType,
            entityId,
            rule.priority
          );
          break;
        case 'payPeriod':
          await this.invalidatePayPeriodMetrics(
            metricType,
            entityId,
            rule.priority
          );
          break;
        case 'department':
          await this.invalidateDepartmentMetrics(
            metricType,
            additionalData?.department,
            rule.priority
          );
          break;
      }
    }
  }

  private async invalidateUserMetrics(
    metricType: string,
    userId: string,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    await invalidateMetricsCache(metricType, userId);
    switch (metricType) {
      case 'dashboard_captain':
      case 'dashboard_sales':
        await triggerDashboardMetricsComputation(userId, undefined, priority);
        break;
      case 'payroll_summary':
        const currentPayPeriod = await this.getCurrentPayPeriod();
        if (currentPayPeriod)
          await triggerPayrollMetricsComputation(
            currentPayPeriod.id,
            userId,
            priority
          );
        break;
      case 'commission_summary':
        await triggerCommissionMetricsComputation(userId, undefined, priority);
        break;
      case 'user_performance':
        await triggerUserPerformanceComputation(userId, undefined, priority);
        break;
    }
  }

  private async invalidateGlobalMetrics(
    metricType: string,
    triggerEntityId: string,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    await invalidateMetricsCache(metricType);
  }

  private async invalidatePayPeriodMetrics(
    metricType: string,
    payPeriodId: string,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    await prisma.precomputedMetric.deleteMany({
      where: { metricType, payPeriodId },
    });
  }

  private async invalidateDepartmentMetrics(
    metricType: string,
    department: string,
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    await prisma.precomputedMetric.deleteMany({
      where: { metricType, department },
    });
  }

  private async getCurrentPayPeriod() {
    return await prisma.payPeriod.findFirst({
      where: { status: 'open' },
      orderBy: { startDate: 'desc' },
    });
  }

  private async invalidateCache(
    metricType: string,
    entityId?: string
  ): Promise<void> {
    const whereClause: any = { metricType };
    if (entityId) whereClause.entityId = entityId;
    await prisma.precomputedMetric.deleteMany({ where: whereClause });
  }
}

// Global cache service instance
export const unifiedCache = new UnifiedCacheService();

// Export helper functions
export async function getCachedDataWithWarming(
  metricType: string,
  entityType?: string,
  entityId?: string,
  payPeriodId?: string,
  department?: string
): Promise<any | null> {
  return unifiedCache.getCachedData(
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
  return unifiedCache.invalidateWithDependencies(metricType, entityId);
}

export async function handleDataChange(
  trigger: string,
  entityId: string,
  additionalData?: any
): Promise<void> {
  return unifiedCache.handleDataChange(trigger, entityId, additionalData);
}

// Specific invalidation handlers
export async function onLogCreated(logId: string): Promise<void> {
  const log = await prisma.dailyLog.findUnique({
    where: { id: logId },
    select: { captainId: true },
  });
  if (log) await handleDataChange('dailyLog.created', log.captainId);
}

export async function onLogUpdated(logId: string): Promise<void> {
  const log = await prisma.dailyLog.findUnique({
    where: { id: logId },
    select: { captainId: true },
  });
  if (log) await handleDataChange('dailyLog.updated', log.captainId);
}

export async function onLogApproved(logId: string): Promise<void> {
  const log = await prisma.dailyLog.findUnique({
    where: { id: logId },
    select: { captainId: true },
  });
  if (log) await handleDataChange('dailyLog.approved', log.captainId);
}

export async function onCommissionMatched(commissionId: string): Promise<void> {
  const commission = await prisma.commissionEntry.findUnique({
    where: { id: commissionId },
    select: { salesId: true },
  });
  if (commission)
    await handleDataChange('commission.matched', commission.salesId);
}

export async function onCommissionCreated(commissionId: string): Promise<void> {
  const commission = await prisma.commissionEntry.findUnique({
    where: { id: commissionId },
    select: { salesId: true },
  });
  if (commission)
    await handleDataChange('commission.created', commission.salesId);
}

export async function onCommissionApproved(
  commissionId: string
): Promise<void> {
  const commission = await prisma.commissionEntry.findUnique({
    where: { id: commissionId },
    select: { salesId: true },
  });
  if (commission)
    await handleDataChange('commission.approved', commission.salesId);
}

export async function onLogDeleted(captainId: string): Promise<void> {
  await handleDataChange('dailyLog.deleted', captainId);
}

export async function onUserCreated(userId: string): Promise<void> {
  await handleDataChange('user.created', userId);
}

export async function onUserUpdated(userId: string): Promise<void> {
  await handleDataChange('user.updated', userId);
}

export async function onUserRatesUpdated(userId: string): Promise<void> {
  await handleDataChange('user.ratesUpdated', userId);
}

export async function onPayPeriodLocked(payPeriodId: string): Promise<void> {
  await handleDataChange('payPeriod.locked', payPeriodId);
}

// Batch invalidation
export async function batchInvalidate(
  changes: Array<{ trigger: string; entityId: string; additionalData?: any }>
): Promise<void> {
  const promises = changes.map((change) =>
    handleDataChange(change.trigger, change.entityId, change.additionalData)
  );
  await Promise.all(promises);
}

// Scheduled operations
export async function cleanupExpiredMetrics(): Promise<void> {
  await unifiedCache.cleanupExpiredMetrics();
}

export async function getCacheHealthMetrics(): Promise<{
  totalMetrics: number;
  expiredMetrics: number;
  metricsByType: Record<string, number>;
  oldestMetric: Date | null;
  newestMetric: Date | null;
}> {
  return unifiedCache.getCacheHealthMetrics();
}

export function startIntelligentCaching(): void {
  console.log('Starting unified caching system...');
  setTimeout(() => {
    unifiedCache.preloadCache().catch(console.error);
  }, 10000);
  setInterval(
    () => {
      unifiedCache.warmupCache().catch(console.error);
    },
    5 * 60 * 1000
  );
  setInterval(
    () => {
      unifiedCache.preloadCache().catch(console.error);
    },
    30 * 60 * 1000
  );
  setInterval(
    () => {
      cleanupExpiredMetrics().catch(console.error);
    },
    60 * 60 * 1000
  );
  console.log('Unified caching system started');
}
