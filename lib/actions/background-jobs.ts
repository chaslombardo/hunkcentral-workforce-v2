'use server';

import { auth } from '@/lib/auth';
import {
  initializeBackgroundJobs,
  shutdownBackgroundJobs,
  getBackgroundJobStatus,
  triggerFullMetricsRefresh,
  triggerCacheCleanup,
} from '@/lib/backgroundJobsInit';
import {
  triggerDashboardMetricsComputation,
  triggerPayrollMetricsComputation,
  triggerCommissionMetricsComputation,
  triggerUserPerformanceComputation,
  jobQueue,
} from '@/lib/backgroundJobs';
import { getCacheHealthMetrics } from '@/lib/cache';

export interface BackgroundJobActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Get background job system status (admin only)
 */
export async function getBackgroundJobSystemStatus(): Promise<BackgroundJobActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    const status = getBackgroundJobStatus();
    const cacheHealth = await getCacheHealthMetrics();

    return {
      success: true,
      data: {
        system: status,
        cache: cacheHealth,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get system status',
    };
  }
}

/**
 * Initialize background job system (admin only)
 */
export async function initializeBackgroundJobSystem(): Promise<BackgroundJobActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    initializeBackgroundJobs();

    return {
      success: true,
      data: { message: 'Background job system initialized' },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to initialize system',
    };
  }
}

/**
 * Shutdown background job system (admin only)
 */
export async function shutdownBackgroundJobSystem(): Promise<BackgroundJobActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    shutdownBackgroundJobs();

    return {
      success: true,
      data: { message: 'Background job system shut down' },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to shutdown system',
    };
  }
}

/**
 * Trigger full metrics refresh (admin only)
 */
export async function triggerSystemMetricsRefresh(): Promise<BackgroundJobActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    await triggerFullMetricsRefresh();

    return {
      success: true,
      data: { message: 'Full metrics refresh triggered' },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to trigger refresh',
    };
  }
}

/**
 * Trigger cache cleanup (admin only)
 */
export async function triggerSystemCacheCleanup(): Promise<BackgroundJobActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return { success: false, error: 'Admin access required' };
    }

    await triggerCacheCleanup();

    return {
      success: true,
      data: { message: 'Cache cleanup triggered' },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to trigger cleanup',
    };
  }
}

/**
 * Trigger user-specific metrics computation
 */
export async function triggerUserMetricsComputation(
  userId?: string,
  payPeriodId?: string
): Promise<BackgroundJobActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Users can only trigger their own metrics, admins can trigger any user's metrics
    const targetUserId = userId || session.user.id;
    if (
      targetUserId !== session.user.id &&
      !session.user.roles?.includes('admin')
    ) {
      return { success: false, error: 'Can only trigger your own metrics' };
    }

    // Trigger various metric computations
    const jobs = await Promise.all([
      triggerDashboardMetricsComputation(targetUserId, payPeriodId, 'high'),
      triggerUserPerformanceComputation(targetUserId, payPeriodId, 'medium'),
    ]);

    // If user has sales role, also trigger commission metrics
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { roles: true },
    });

    if (user?.roles.includes('sales')) {
      const commissionJob = await triggerCommissionMetricsComputation(
        targetUserId,
        payPeriodId,
        'medium'
      );
      jobs.push(commissionJob);
    }

    return {
      success: true,
      data: {
        message: 'User metrics computation triggered',
        jobIds: jobs,
        userId: targetUserId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to trigger user metrics',
    };
  }
}

/**
 * Trigger payroll metrics computation for a pay period
 */
export async function triggerPayPeriodMetricsComputation(
  payPeriodId: string,
  userId?: string
): Promise<BackgroundJobActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Only managers and admins can trigger pay period metrics for all users
    if (!userId) {
      if (
        !session.user.roles?.some((role) => ['admin', 'manager'].includes(role))
      ) {
        return { success: false, error: 'Manager or admin access required' };
      }
    } else {
      // Users can only trigger their own payroll metrics
      if (
        userId !== session.user.id &&
        !session.user.roles?.includes('admin')
      ) {
        return {
          success: false,
          error: 'Can only trigger your own payroll metrics',
        };
      }
    }

    const jobId = await triggerPayrollMetricsComputation(
      payPeriodId,
      userId,
      'high'
    );

    return {
      success: true,
      data: {
        message: 'Payroll metrics computation triggered',
        jobId,
        payPeriodId,
        userId,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to trigger payroll metrics',
    };
  }
}

/**
 * Get job status by ID
 */
export async function getJobStatus(
  jobId: string
): Promise<BackgroundJobActionResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    const jobStatus = jobQueue.getJobStatus(jobId);

    if (!jobStatus) {
      return { success: false, error: 'Job not found' };
    }

    return {
      success: true,
      data: jobStatus,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get job status',
    };
  }
}

// Import prisma for user role checking
import { prisma } from '@/lib/prisma';
