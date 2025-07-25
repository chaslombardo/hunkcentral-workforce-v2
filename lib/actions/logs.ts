'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { DailyLogFormSchema, type DailyLogFormData } from '@/lib/validations';
import { auth } from '@/lib/auth';

export type LogActionResult = {
  success: boolean;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // Allow flexible data types for different operations
};

/**
 * Save or update a daily log as draft
 */
export async function saveDraftLog(
  logId: string | null,
  formData: DailyLogFormData
): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate form data
    const validatedData = DailyLogFormSchema.parse(formData);

    const logData = {
      captainId: validatedData.captainId,
      logDate: validatedData.logDate,
      status: 'draft',
      createdById: session.user.id,
      lastEditedById: session.user.id,
    };

    let savedLog;

    if (logId) {
      // Update existing draft
      savedLog = await prisma.dailyLog.update({
        where: { id: logId },
        data: {
          ...logData,
          updatedAt: new Date(),
        },
      });

      // Delete existing jobs and hours to replace them
      await prisma.logJob.deleteMany({
        where: { logId: savedLog.id },
      });
      await prisma.logHour.deleteMany({
        where: { logId: savedLog.id },
      });
    } else {
      // Create new draft
      savedLog = await prisma.dailyLog.create({
        data: logData,
      });
    }

    // Save jobs
    if (validatedData.jobs.length > 0) {
      await prisma.logJob.createMany({
        data: validatedData.jobs.map((job) => ({
          logId: savedLog.id,
          jobType: job.jobType,
          jobId: job.jobId,
          clientName: job.clientName,
          revenue: job.revenue,
          tips: job.tips,
          junkOnMove: job.junkOnMove,
          valuation: job.valuation,
          materials: job.materials,
          disposalCost: job.disposalCost,
        })),
      });
    }

    // Save hours
    if (validatedData.hours.length > 0) {
      await prisma.logHour.createMany({
        data: validatedData.hours.map((hour) => ({
          logId: savedLog.id,
          employeeId: hour.employeeId,
          department: hour.department,
          hours: hour.hours,
          isCoCaptain: hour.isCoCaptain,
        })),
      });
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        entityType: 'daily_log',
        entityId: savedLog.id,
        action: logId ? 'update' : 'create',
        changes: {
          status: 'draft',
          formData: validatedData,
        },
        userId: session.user.id,
        dailyLogId: savedLog.id,
      },
    });

    return { 
      success: true, 
      data: { 
        id: savedLog.id,
        status: savedLog.status,
        updatedAt: savedLog.updatedAt,
      } 
    };
  } catch (error) {
    console.error('Error saving draft log:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save draft' 
    };
  }
}

/**
 * Submit a daily log for review
 */
export async function submitLog(
  logId: string | null,
  formData: DailyLogFormData
): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate form data
    const validatedData = DailyLogFormSchema.parse(formData);

    // Additional validation for submission
    if (validatedData.jobs.length === 0 && validatedData.hours.length === 0) {
      return { 
        success: false, 
        error: 'Cannot submit empty log. Please add at least one job or hour entry.' 
      };
    }

    // First save as draft to ensure data is persisted
    const draftResult = await saveDraftLog(logId, formData);
    if (!draftResult.success) {
      return draftResult;
    }

    const finalLogId = draftResult.data?.id || logId;

    // Update status to submitted
    if (finalLogId !== null) {
      const submittedLog = await prisma.dailyLog.update({
        where: { id: finalLogId },
        data: {
          status: 'submitted',
          submittedAt: new Date(),
          lastEditedById: session.user.id,
        },
      });

      // Create audit log entry for submission
      await prisma.auditLog.create({
        data: {
          entityType: 'daily_log',
          entityId: submittedLog.id,
          action: 'submit',
          changes: {
            status: { from: 'draft', to: 'submitted' },
            submittedAt: submittedLog.submittedAt,
          },
          userId: session.user.id,
          dailyLogId: submittedLog.id,
        },
      });

      revalidatePath('/logs');
      revalidatePath('/dashboard');

      return { 
        success: true, 
        data: { 
          id: submittedLog.id,
          status: submittedLog.status,
          submittedAt: submittedLog.submittedAt || undefined,
        }
      };
    } else {
      return { 
        success: false, 
        error: 'Failed to get log ID for submission' 
      };
    }
  } catch (error) {
    console.error('Error submitting log:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit log' 
    };
  }
}

/**
 * Load an existing log for editing
 */
export async function loadLog(logId: string): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const log = await prisma.dailyLog.findUnique({
      where: { id: logId },
      include: {
        jobs: true,
        hours: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        captain: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!log) {
      return { success: false, error: 'Log not found' };
    }

    // Check if user has permission to edit this log
    const canEdit = 
      log.createdById === session.user.id || 
      log.captainId === session.user.id ||
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('admin');

    if (!canEdit) {
      return { success: false, error: 'Permission denied' };
    }

    return { 
      success: true, 
      data: {
        id: log.id,
        captainId: log.captainId,
        logDate: log.logDate,
        status: log.status,
        jobs: log.jobs,
        hours: log.hours,
        submittedAt: log.submittedAt || undefined,
        approvedAt: log.approvedAt || undefined,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      }
    };
  } catch (error) {
    console.error('Error loading log:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to load log' 
    };
  }
}

/**
 * Get logs for manager review
 */
export async function getLogsForReview(): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has manager or admin role
    if (!session.user.roles?.includes('manager') && !session.user.roles?.includes('admin')) {
      return { success: false, error: 'Manager access required' };
    }

    const logs = await prisma.dailyLog.findMany({
      where: {
        status: {
          in: ['submitted', 'approved', 'rejected']
        }
      },
      include: {
        captain: {
          select: {
            id: true,
            fullName: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
        jobs: {
          select: {
            revenue: true,
            tips: true,
          },
        },
        hours: {
          select: {
            hours: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    const reviewData = logs.map(log => ({
      id: log.id,
      captainName: log.captain.fullName,
      logDate: log.logDate,
      status: log.status,
      totalRevenue: log.jobs.reduce((sum, job) => sum + Number(job.revenue), 0),
      totalHours: log.hours.reduce((sum, hour) => sum + Number(hour.hours), 0),
      jobCount: log.jobs.length,
      submittedAt: log.submittedAt,
      approvedAt: log.approvedAt,
      approvedBy: log.approvedBy?.fullName,
    }));

    return { 
      success: true, 
      data: reviewData
    };
  } catch (error) {
    console.error('Error getting logs for review:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get logs for review' 
    };
  }
}

/**
 * Approve a daily log
 */
export async function approveLog(logId: string, comments?: string): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has manager or admin role
    if (!session.user.roles?.includes('manager') && !session.user.roles?.includes('admin')) {
      return { success: false, error: 'Manager access required' };
    }

    const log = await prisma.dailyLog.findUnique({
      where: { id: logId },
      include: {
        jobs: true,
        commissions: true,
      },
    });

    if (!log) {
      return { success: false, error: 'Log not found' };
    }

    if (log.status !== 'submitted') {
      return { success: false, error: 'Only submitted logs can be approved' };
    }

    // Update log status to approved
    const approvedLog = await prisma.dailyLog.update({
      where: { id: logId },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedById: session.user.id,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        entityType: 'daily_log',
        entityId: logId,
        action: 'approve',
        changes: {
          status: { from: 'submitted', to: 'approved' },
          approvedAt: approvedLog.approvedAt,
          comments: comments,
        },
        userId: session.user.id,
        dailyLogId: logId,
      },
    });

    // Auto-match commission entries for jobs in this log
    for (const job of log.jobs) {
      const commissionEntry = await prisma.commissionEntry.findUnique({
        where: { jobId: job.jobId },
      });

      if (commissionEntry && commissionEntry.status === 'pending') {
        await prisma.commissionEntry.update({
          where: { id: commissionEntry.id },
          data: {
            status: 'matched',
            actualRevenue: job.revenue,
            commissionAmount: Number(job.revenue) * (Number(commissionEntry.estimatedRevenue) / 100), // Simplified calculation
            matchedLogId: logId,
          },
        });

        // Create audit log for commission matching
        await prisma.auditLog.create({
          data: {
            entityType: 'commission_entry',
            entityId: commissionEntry.id,
            action: 'match',
            changes: {
              status: { from: 'pending', to: 'matched' },
              actualRevenue: job.revenue,
              matchedLogId: logId,
            },
            userId: session.user.id,
          },
        });
      }
    }

    revalidatePath('/logs/review');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      data: { 
        id: approvedLog.id,
        status: approvedLog.status,
        approvedAt: approvedLog.approvedAt || undefined,
      }
    };
  } catch (error) {
    console.error('Error approving log:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to approve log' 
    };
  }
}

/**
 * Reject a daily log
 */
export async function rejectLog(logId: string, comments: string): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has manager or admin role
    if (!session.user.roles?.includes('manager') && !session.user.roles?.includes('admin')) {
      return { success: false, error: 'Manager access required' };
    }

    const log = await prisma.dailyLog.findUnique({
      where: { id: logId },
    });

    if (!log) {
      return { success: false, error: 'Log not found' };
    }

    if (log.status !== 'submitted') {
      return { success: false, error: 'Only submitted logs can be rejected' };
    }

    if (!comments.trim()) {
      return { success: false, error: 'Comments are required when rejecting a log' };
    }

    // Update log status to rejected
    const rejectedLog = await prisma.dailyLog.update({
      where: { id: logId },
      data: {
        status: 'rejected',
        approvedAt: new Date(), // Track when rejection occurred
        approvedById: session.user.id,
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        entityType: 'daily_log',
        entityId: logId,
        action: 'reject',
        changes: {
          status: { from: 'submitted', to: 'rejected' },
          rejectedAt: rejectedLog.approvedAt,
          comments: comments,
        },
        userId: session.user.id,
        dailyLogId: logId,
      },
    });

    revalidatePath('/logs/review');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      data: { 
        id: rejectedLog.id,
        status: rejectedLog.status,
        approvedAt: rejectedLog.approvedAt || undefined,
      }
    };
  } catch (error) {
    console.error('Error rejecting log:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reject log' 
    };
  }
}

/**
 * Bulk approve multiple logs
 */
export async function bulkApproveLogs(logIds: string[], comments?: string): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has manager or admin role
    if (!session.user.roles?.includes('manager') && !session.user.roles?.includes('admin')) {
      return { success: false, error: 'Manager access required' };
    }

    const results = [];
    for (const logId of logIds) {
      const result = await approveLog(logId, comments);
      results.push({ logId, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return { 
      success: failureCount === 0, 
      data: {
        successCount,
        failureCount,
        results,
      }
    };
  } catch (error) {
    console.error('Error bulk approving logs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk approve logs' 
    };
  }
}

/**
 * Bulk reject multiple logs
 */
export async function bulkRejectLogs(logIds: string[], comments: string): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has manager or admin role
    if (!session.user.roles?.includes('manager') && !session.user.roles?.includes('admin')) {
      return { success: false, error: 'Manager access required' };
    }

    if (!comments.trim()) {
      return { success: false, error: 'Comments are required when rejecting logs' };
    }

    const results = [];
    for (const logId of logIds) {
      const result = await rejectLog(logId, comments);
      results.push({ logId, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return { 
      success: failureCount === 0, 
      data: {
        successCount,
        failureCount,
        results,
      }
    };
  } catch (error) {
    console.error('Error bulk rejecting logs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk reject logs' 
    };
  }
}