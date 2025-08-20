// Cache Invalidation Strategies for Pre-computed Metrics
// Handles intelligent cache invalidation based on data changes

import { prisma } from './prisma';
import { 
  triggerDashboardMetricsComputation,
  triggerPayrollMetricsComputation,
  triggerLaborCostMetricsComputation,
  triggerCommissionMetricsComputation,
  triggerUserPerformanceComputation,
  invalidateMetricsCache,
} from './backgroundJobs';

// Cache invalidation rules based on data changes
export interface InvalidationRule {
  trigger: string; // What triggers the invalidation
  affectedMetrics: string[]; // Which metric types are affected
  scope: 'user' | 'global' | 'payPeriod' | 'department'; // Scope of invalidation
  priority: 'low' | 'medium' | 'high' | 'critical'; // Recomputation priority
}

// Define invalidation rules
const INVALIDATION_RULES: InvalidationRule[] = [
  // Daily log changes
  {
    trigger: 'dailyLog.created',
    affectedMetrics: ['dashboard_captain', 'dashboard_manager', 'payroll_summary'],
    scope: 'user',
    priority: 'medium',
  },
  {
    trigger: 'dailyLog.updated',
    affectedMetrics: ['dashboard_captain', 'dashboard_manager', 'payroll_summary', 'labor_costs'],
    scope: 'user',
    priority: 'high',
  },
  {
    trigger: 'dailyLog.approved',
    affectedMetrics: ['dashboard_captain', 'dashboard_manager', 'payroll_summary', 'labor_costs', 'user_performance'],
    scope: 'global',
    priority: 'high',
  },
  {
    trigger: 'dailyLog.deleted',
    affectedMetrics: ['dashboard_captain', 'dashboard_manager', 'payroll_summary', 'labor_costs'],
    scope: 'user',
    priority: 'high',
  },

  // Commission changes
  {
    trigger: 'commission.created',
    affectedMetrics: ['dashboard_sales', 'commission_summary'],
    scope: 'user',
    priority: 'medium',
  },
  {
    trigger: 'commission.matched',
    affectedMetrics: ['dashboard_sales', 'commission_summary', 'payroll_summary'],
    scope: 'user',
    priority: 'high',
  },
  {
    trigger: 'commission.approved',
    affectedMetrics: ['dashboard_sales', 'commission_summary', 'payroll_summary'],
    scope: 'user',
    priority: 'high',
  },

  // User changes
  {
    trigger: 'user.created',
    affectedMetrics: ['dashboard_admin', 'user_performance'],
    scope: 'global',
    priority: 'low',
  },
  {
    trigger: 'user.updated',
    affectedMetrics: ['dashboard_captain', 'dashboard_sales', 'payroll_summary', 'user_performance'],
    scope: 'user',
    priority: 'medium',
  },
  {
    trigger: 'user.ratesUpdated',
    affectedMetrics: ['payroll_summary', 'labor_costs'],
    scope: 'global',
    priority: 'high',
  },

  // Pay period changes
  {
    trigger: 'payPeriod.created',
    affectedMetrics: ['dashboard_manager', 'dashboard_admin'],
    scope: 'global',
    priority: 'medium',
  },
  {
    trigger: 'payPeriod.locked',
    affectedMetrics: ['payroll_summary', 'labor_costs'],
    scope: 'payPeriod',
    priority: 'critical',
  },
  {
    trigger: 'payPeriod.closed',
    affectedMetrics: ['payroll_summary', 'labor_costs', 'user_performance'],
    scope: 'payPeriod',
    priority: 'critical',
  },
];

// Main invalidation handler
export async function handleDataChange(
  trigger: string,
  entityId: string,
  additionalData?: any
): Promise<void> {
  console.log(`Handling data change: ${trigger} for entity: ${entityId}`);

  const applicableRules = INVALIDATION_RULES.filter(rule => rule.trigger === trigger);
  
  if (applicableRules.length === 0) {
    console.log(`No invalidation rules found for trigger: ${trigger}`);
    return;
  }

  const invalidationPromises: Promise<void>[] = [];

  for (const rule of applicableRules) {
    invalidationPromises.push(
      processInvalidationRule(rule, entityId, additionalData)
    );
  }

  await Promise.all(invalidationPromises);
  console.log(`Completed invalidation for trigger: ${trigger}`);
}

// Process individual invalidation rule
async function processInvalidationRule(
  rule: InvalidationRule,
  entityId: string,
  additionalData?: any
): Promise<void> {
  const { affectedMetrics, scope, priority } = rule;

  for (const metricType of affectedMetrics) {
    switch (scope) {
      case 'user':
        await invalidateUserMetrics(metricType, entityId, priority);
        break;
      
      case 'global':
        await invalidateGlobalMetrics(metricType, entityId, priority);
        break;
      
      case 'payPeriod':
        await invalidatePayPeriodMetrics(metricType, entityId, priority);
        break;
      
      case 'department':
        await invalidateDepartmentMetrics(metricType, additionalData?.department, priority);
        break;
    }
  }
}

// Invalidate user-specific metrics
async function invalidateUserMetrics(
  metricType: string,
  userId: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): Promise<void> {
  // Invalidate cached metrics
  await invalidateMetricsCache(metricType, userId);

  // Trigger recomputation based on metric type
  switch (metricType) {
    case 'dashboard_captain':
    case 'dashboard_sales':
      await triggerDashboardMetricsComputation(userId, undefined, priority);
      break;
    
    case 'payroll_summary':
      const currentPayPeriod = await getCurrentPayPeriod();
      if (currentPayPeriod) {
        await triggerPayrollMetricsComputation(currentPayPeriod.id, userId, priority);
      }
      break;
    
    case 'commission_summary':
      await triggerCommissionMetricsComputation(userId, undefined, priority);
      break;
    
    case 'user_performance':
      await triggerUserPerformanceComputation(userId, undefined, priority);
      break;
  }
}

// Invalidate global metrics
async function invalidateGlobalMetrics(
  metricType: string,
  triggerEntityId: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): Promise<void> {
  // Invalidate global cached metrics
  await invalidateMetricsCache(metricType);

  // Get affected entities based on the trigger
  const affectedEntities = await getAffectedEntities(metricType, triggerEntityId);

  // Trigger recomputation for affected entities
  const recomputationPromises: Promise<string>[] = [];

  for (const entity of affectedEntities) {
    switch (metricType) {
      case 'dashboard_manager':
      case 'dashboard_admin':
        recomputationPromises.push(
          triggerDashboardMetricsComputation(entity.id, undefined, priority)
        );
        break;
      
      case 'labor_costs':
        const currentPayPeriod = await getCurrentPayPeriod();
        if (currentPayPeriod) {
          recomputationPromises.push(
            triggerLaborCostMetricsComputation(currentPayPeriod.id, undefined, priority)
          );
        }
        break;
      
      case 'user_performance':
        recomputationPromises.push(
          triggerUserPerformanceComputation(entity.id, undefined, priority)
        );
        break;
    }
  }

  await Promise.all(recomputationPromises);
}

// Invalidate pay period specific metrics
async function invalidatePayPeriodMetrics(
  metricType: string,
  payPeriodId: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): Promise<void> {
  // Invalidate all metrics for the pay period
  await prisma.precomputedMetric.deleteMany({
    where: {
      metricType,
      payPeriodId,
    },
  });

  // Trigger recomputation for all users in the pay period
  const users = await prisma.user.findMany({
    select: { id: true, roles: true },
  });

  const recomputationPromises: Promise<string>[] = [];

  for (const user of users) {
    switch (metricType) {
      case 'payroll_summary':
        recomputationPromises.push(
          triggerPayrollMetricsComputation(payPeriodId, user.id, priority)
        );
        break;
      
      case 'labor_costs':
        recomputationPromises.push(
          triggerLaborCostMetricsComputation(payPeriodId, undefined, priority)
        );
        break;
      
      case 'user_performance':
        recomputationPromises.push(
          triggerUserPerformanceComputation(user.id, payPeriodId, priority)
        );
        break;
    }
  }

  await Promise.all(recomputationPromises);
}

// Invalidate department specific metrics
async function invalidateDepartmentMetrics(
  metricType: string,
  department: string,
  priority: 'low' | 'medium' | 'high' | 'critical'
): Promise<void> {
  // Invalidate department cached metrics
  await prisma.precomputedMetric.deleteMany({
    where: {
      metricType,
      department,
    },
  });

  // Trigger recomputation for department
  const currentPayPeriod = await getCurrentPayPeriod();
  if (currentPayPeriod && metricType === 'labor_costs') {
    await triggerLaborCostMetricsComputation(currentPayPeriod.id, department, priority);
  }
}

// Get entities affected by a change
async function getAffectedEntities(
  metricType: string,
  triggerEntityId: string
): Promise<Array<{ id: string; roles?: string[] }>> {
  switch (metricType) {
    case 'dashboard_manager':
      return await prisma.user.findMany({
        where: { roles: { has: 'manager' } },
        select: { id: true, roles: true },
      });
    
    case 'dashboard_admin':
      return await prisma.user.findMany({
        where: { roles: { has: 'admin' } },
        select: { id: true, roles: true },
      });
    
    case 'user_performance':
      return await prisma.user.findMany({
        where: { roles: { hasSome: ['captain', 'wingman'] } },
        select: { id: true, roles: true },
      });
    
    default:
      return [];
  }
}

// Helper to get current pay period
async function getCurrentPayPeriod() {
  return await prisma.payPeriod.findFirst({
    where: { status: 'open' },
    orderBy: { startDate: 'desc' },
  });
}

// Specific invalidation handlers for common scenarios

export async function onLogCreated(logId: string): Promise<void> {
  const log = await prisma.dailyLog.findUnique({
    where: { id: logId },
    select: { captainId: true },
  });

  if (log) {
    await handleDataChange('dailyLog.created', log.captainId);
  }
}

export async function onLogUpdated(logId: string): Promise<void> {
  const log = await prisma.dailyLog.findUnique({
    where: { id: logId },
    select: { captainId: true },
  });

  if (log) {
    await handleDataChange('dailyLog.updated', log.captainId);
  }
}

export async function onLogApproved(logId: string): Promise<void> {
  const log = await prisma.dailyLog.findUnique({
    where: { id: logId },
    select: { captainId: true },
  });

  if (log) {
    await handleDataChange('dailyLog.approved', log.captainId);
  }
}

export async function onLogDeleted(captainId: string): Promise<void> {
  await handleDataChange('dailyLog.deleted', captainId);
}

export async function onCommissionCreated(commissionId: string): Promise<void> {
  const commission = await prisma.commissionEntry.findUnique({
    where: { id: commissionId },
    select: { salesId: true },
  });

  if (commission) {
    await handleDataChange('commission.created', commission.salesId);
  }
}

export async function onCommissionMatched(commissionId: string): Promise<void> {
  const commission = await prisma.commissionEntry.findUnique({
    where: { id: commissionId },
    select: { salesId: true },
  });

  if (commission) {
    await handleDataChange('commission.matched', commission.salesId);
  }
}

export async function onCommissionApproved(commissionId: string): Promise<void> {
  const commission = await prisma.commissionEntry.findUnique({
    where: { id: commissionId },
    select: { salesId: true },
  });

  if (commission) {
    await handleDataChange('commission.approved', commission.salesId);
  }
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

export async function onPayPeriodCreated(payPeriodId: string): Promise<void> {
  await handleDataChange('payPeriod.created', payPeriodId);
}

export async function onPayPeriodLocked(payPeriodId: string): Promise<void> {
  await handleDataChange('payPeriod.locked', payPeriodId);
}

export async function onPayPeriodClosed(payPeriodId: string): Promise<void> {
  await handleDataChange('payPeriod.closed', payPeriodId);
}

// Batch invalidation for multiple changes
export async function batchInvalidate(
  changes: Array<{ trigger: string; entityId: string; additionalData?: any }>
): Promise<void> {
  const invalidationPromises = changes.map(change =>
    handleDataChange(change.trigger, change.entityId, change.additionalData)
  );

  await Promise.all(invalidationPromises);
}

// Scheduled cache cleanup (remove expired metrics)
export async function cleanupExpiredMetrics(): Promise<void> {
  const now = new Date();
  
  const deletedCount = await prisma.precomputedMetric.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  });

  console.log(`Cleaned up ${deletedCount.count} expired metrics`);
}

// Health check for cache system
export async function getCacheHealthMetrics(): Promise<{
  totalMetrics: number;
  expiredMetrics: number;
  metricsByType: Record<string, number>;
  oldestMetric: Date | null;
  newestMetric: Date | null;
}> {
  const totalMetrics = await prisma.precomputedMetric.count();
  
  const expiredMetrics = await prisma.precomputedMetric.count({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
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
    metricsByType: metricsByType.reduce((acc, item) => {
      acc[item.metricType] = item._count.metricType;
      return acc;
    }, {} as Record<string, number>),
    oldestMetric: oldestMetric?.computedAt || null,
    newestMetric: newestMetric?.computedAt || null,
  };
}