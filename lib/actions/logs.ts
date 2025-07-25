'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { DailyLogFormSchema, type DailyLogFormData } from '@/lib/validations';
import { auth } from '@/lib/auth';

export type LogActionResult = {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    status: string;
    updatedAt?: Date;
    submittedAt?: Date;
    approvedAt?: Date;
    createdAt?: Date;
    jobs?: unknown[];
    hours?: unknown[];
    captainId?: string;
    logDate?: Date;
  };
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