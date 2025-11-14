// Background Job Processing Framework for HUNKCentral
// Handles heavy calculations and metric pre-computation

import { prisma } from './prisma';
import { calculatePrecomputedMetrics } from './metricsCalculator';

export interface BackgroundJob {
  id: string;
  type: string;
  payload: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface JobProcessor {
  type: string;
  handler: (payload: any) => Promise<void>;
}

// Job types for metric computation
export const JOB_TYPES = {
  COMPUTE_DASHBOARD_METRICS: 'compute_dashboard_metrics',
  COMPUTE_PAYROLL_METRICS: 'compute_payroll_metrics',
  COMPUTE_LABOR_COST_METRICS: 'compute_labor_cost_metrics',
  COMPUTE_COMMISSION_METRICS: 'compute_commission_metrics',
  COMPUTE_USER_PERFORMANCE: 'compute_user_performance',
  INVALIDATE_CACHE: 'invalidate_cache',
  REFRESH_ALL_METRICS: 'refresh_all_metrics',
} as const;

// In-memory job queue (in production, use Redis or similar)
class JobQueue {
  private jobs: Map<string, BackgroundJob> = new Map();
  private processors: Map<string, JobProcessor> = new Map();
  private isProcessing = false;

  // Register job processors
  registerProcessor(processor: JobProcessor) {
    this.processors.set(processor.type, processor);
  }

  // Add job to queue
  async addJob(
    type: string,
    payload: any,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      delay?: number; // milliseconds
      maxAttempts?: number;
    } = {}
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const scheduledAt = new Date(Date.now() + (options.delay || 0));

    const job: BackgroundJob = {
      id: jobId,
      type,
      payload,
      priority: options.priority || 'medium',
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      scheduledAt,
    };

    this.jobs.set(jobId, job);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processJobs();
    }

    return jobId;
  }

  // Process jobs in queue
  private async processJobs() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.jobs.size > 0) {
        // Get next job by priority and schedule time
        const nextJob = this.getNextJob();
        if (!nextJob) break;

        await this.processJob(nextJob);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // Get next job to process
  private getNextJob(): BackgroundJob | null {
    const now = new Date();
    const pendingJobs = Array.from(this.jobs.values())
      .filter((job) => job.status === 'pending' && job.scheduledAt <= now)
      .sort((a, b) => {
        // Sort by priority first, then by scheduled time
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.scheduledAt.getTime() - b.scheduledAt.getTime();
      });

    return pendingJobs[0] || null;
  }

  // Process individual job
  private async processJob(job: BackgroundJob) {
    const processor = this.processors.get(job.type);
    if (!processor) {
      console.error(`No processor found for job type: ${job.type}`);
      job.status = 'failed';
      job.error = `No processor found for job type: ${job.type}`;
      return;
    }

    job.status = 'processing';
    job.processedAt = new Date();
    job.attempts++;

    try {
      await processor.handler(job.payload);
      job.status = 'completed';
      job.completedAt = new Date();
      this.jobs.delete(job.id);
      console.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      job.error = error instanceof Error ? error.message : 'Unknown error';

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
        console.error(
          `Job ${job.id} failed permanently after ${job.attempts} attempts`
        );
      } else {
        // Retry with exponential backoff
        job.status = 'pending';
        job.scheduledAt = new Date(
          Date.now() + Math.pow(2, job.attempts) * 1000
        );
        console.log(
          `Job ${job.id} will retry in ${Math.pow(2, job.attempts)} seconds`
        );
      }
    }
  }

  // Get job status
  getJobStatus(jobId: string): BackgroundJob | null {
    return this.jobs.get(jobId) || null;
  }

  // Clear completed jobs (cleanup)
  cleanup() {
    const completedJobs = Array.from(this.jobs.entries()).filter(
      ([_, job]) => job.status === 'completed' || job.status === 'failed'
    );

    completedJobs.forEach(([jobId]) => this.jobs.delete(jobId));
  }
}

// Global job queue instance
export const jobQueue = new JobQueue();

// Register metric computation processors
jobQueue.registerProcessor({
  type: JOB_TYPES.COMPUTE_DASHBOARD_METRICS,
  handler: async (payload: { userId?: string; payPeriodId?: string }) => {
    await calculatePrecomputedMetrics('dashboard', payload);
  },
});

jobQueue.registerProcessor({
  type: JOB_TYPES.COMPUTE_PAYROLL_METRICS,
  handler: async (payload: { payPeriodId: string; userId?: string }) => {
    await calculatePrecomputedMetrics('payroll', payload);
  },
});

jobQueue.registerProcessor({
  type: JOB_TYPES.COMPUTE_LABOR_COST_METRICS,
  handler: async (payload: { payPeriodId: string; department?: string }) => {
    await calculatePrecomputedMetrics('labor_costs', payload);
  },
});

jobQueue.registerProcessor({
  type: JOB_TYPES.COMPUTE_COMMISSION_METRICS,
  handler: async (payload: { userId?: string; payPeriodId?: string }) => {
    await calculatePrecomputedMetrics('commission', payload);
  },
});

jobQueue.registerProcessor({
  type: JOB_TYPES.COMPUTE_USER_PERFORMANCE,
  handler: async (payload: { userId: string; payPeriodId?: string }) => {
    await calculatePrecomputedMetrics('user_performance', payload);
  },
});

jobQueue.registerProcessor({
  type: JOB_TYPES.INVALIDATE_CACHE,
  handler: async (payload: { metricType?: string; entityId?: string }) => {
    await invalidateMetricsCache(payload.metricType, payload.entityId);
  },
});

jobQueue.registerProcessor({
  type: JOB_TYPES.REFRESH_ALL_METRICS,
  handler: async () => {
    await refreshAllMetrics();
  },
});

// Helper functions for triggering metric computations

export async function triggerDashboardMetricsComputation(
  userId?: string,
  payPeriodId?: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<string> {
  return jobQueue.addJob(
    JOB_TYPES.COMPUTE_DASHBOARD_METRICS,
    { userId, payPeriodId },
    { priority }
  );
}

export async function triggerPayrollMetricsComputation(
  payPeriodId: string,
  userId?: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'high'
): Promise<string> {
  return jobQueue.addJob(
    JOB_TYPES.COMPUTE_PAYROLL_METRICS,
    { payPeriodId, userId },
    { priority }
  );
}

export async function triggerLaborCostMetricsComputation(
  payPeriodId: string,
  department?: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<string> {
  return jobQueue.addJob(
    JOB_TYPES.COMPUTE_LABOR_COST_METRICS,
    { payPeriodId, department },
    { priority }
  );
}

export async function triggerCommissionMetricsComputation(
  userId?: string,
  payPeriodId?: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Promise<string> {
  return jobQueue.addJob(
    JOB_TYPES.COMPUTE_COMMISSION_METRICS,
    { userId, payPeriodId },
    { priority }
  );
}

export async function triggerUserPerformanceComputation(
  userId: string,
  payPeriodId?: string,
  priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<string> {
  return jobQueue.addJob(
    JOB_TYPES.COMPUTE_USER_PERFORMANCE,
    { userId, payPeriodId },
    { priority }
  );
}

// Cache invalidation
export async function invalidateMetricsCache(
  metricType?: string,
  entityId?: string
): Promise<void> {
  const whereClause: any = {};

  if (metricType) {
    whereClause.metricType = metricType;
  }

  if (entityId) {
    whereClause.entityId = entityId;
  }

  await prisma.precomputedMetric.deleteMany({
    where: whereClause,
  });

  console.log(
    `Invalidated metrics cache for type: ${metricType}, entity: ${entityId}`
  );
}

// Refresh all metrics (expensive operation)
export async function refreshAllMetrics(): Promise<void> {
  console.log('Starting full metrics refresh...');

  // Clear all existing metrics
  await prisma.precomputedMetric.deleteMany();

  // Get all active users and pay periods
  const users = await prisma.user.findMany({
    select: { id: true, roles: true },
  });

  const payPeriods = await prisma.payPeriod.findMany({
    where: { status: { in: ['open', 'locked'] } },
    select: { id: true },
  });

  // Trigger computation for all combinations
  const jobs: Promise<string>[] = [];

  for (const payPeriod of payPeriods) {
    // Global metrics for pay period
    jobs.push(
      triggerDashboardMetricsComputation(undefined, payPeriod.id, 'low')
    );
    jobs.push(triggerPayrollMetricsComputation(payPeriod.id, undefined, 'low'));
    jobs.push(
      triggerLaborCostMetricsComputation(payPeriod.id, undefined, 'low')
    );

    // User-specific metrics
    for (const user of users) {
      jobs.push(
        triggerUserPerformanceComputation(user.id, payPeriod.id, 'low')
      );

      if (user.roles.includes('sales')) {
        jobs.push(
          triggerCommissionMetricsComputation(user.id, payPeriod.id, 'low')
        );
      }
    }
  }

  await Promise.all(jobs);
  console.log(`Queued ${jobs.length} metric computation jobs`);
}

// Automatic cache invalidation triggers
export async function onLogApproved(logId: string): Promise<void> {
  const log = await prisma.dailyLog.findUnique({
    where: { id: logId },
    include: { captain: true },
  });

  if (!log) return;

  // Invalidate related metrics
  await Promise.all([
    invalidateMetricsCache('dashboard_captain', log.captainId),
    invalidateMetricsCache('dashboard_manager'),
    invalidateMetricsCache('payroll_summary', log.captainId),
    invalidateMetricsCache('labor_costs'),
    triggerDashboardMetricsComputation(log.captainId, undefined, 'high'),
    getCurrentPayPeriodId().then((payPeriodId) =>
      payPeriodId
        ? triggerPayrollMetricsComputation(payPeriodId, log.captainId, 'high')
        : Promise.resolve('')
    ),
  ]);
}

export async function onCommissionMatched(commissionId: string): Promise<void> {
  const commission = await prisma.commissionEntry.findUnique({
    where: { id: commissionId },
    select: { salesId: true },
  });

  if (!commission) return;

  // Invalidate commission-related metrics
  await Promise.all([
    invalidateMetricsCache('dashboard_sales', commission.salesId),
    invalidateMetricsCache('commission_summary', commission.salesId),
    triggerCommissionMetricsComputation(commission.salesId, undefined, 'high'),
  ]);
}

export async function onUserUpdated(userId: string): Promise<void> {
  // Invalidate user-specific metrics
  await Promise.all([
    invalidateMetricsCache('dashboard_captain', userId),
    invalidateMetricsCache('dashboard_sales', userId),
    invalidateMetricsCache('payroll_summary', userId),
    invalidateMetricsCache('user_performance', userId),
    triggerUserPerformanceComputation(userId, undefined, 'medium'),
  ]);
}

// Helper to get current pay period ID
async function getCurrentPayPeriodId(): Promise<string | undefined> {
  const currentPayPeriod = await prisma.payPeriod.findFirst({
    where: { status: 'open' },
    orderBy: { startDate: 'desc' },
  });

  return currentPayPeriod?.id;
}

// Cleanup function to run periodically
export function startJobQueueCleanup(intervalMs = 300000) {
  // 5 minutes
  setInterval(() => {
    jobQueue.cleanup();
  }, intervalMs);
}
