'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { DailyLogFormSchema, type DailyLogFormData } from '@/lib/validations';
import { auth } from '@/lib/auth';
import { logDailyLogChange } from '@/lib/auditLogger';
import { canModifyDataForDate } from '@/lib/actions/pay-periods';
import { Prisma } from '@prisma/client';

export type LogActionResult = {
  success: boolean;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any; // Allow flexible data types for different operations
};

// Enhanced error handling for database operations
function handleDatabaseError(error: unknown, operation: string): string {
  console.error(`Database error in ${operation}:`, error);
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return 'A record with this information already exists';
      case 'P2003':
        // Foreign key constraint violation - provide specific error messages
        if (error.message.includes('employeeId_fkey')) {
          return 'One or more selected employees are invalid. Please refresh the page and select valid employees.';
        }
        if (error.message.includes('captainId') || error.message.includes('captain')) {
          return 'Selected captain is invalid. Please refresh the page and select a valid captain.';
        }
        return 'Referenced record does not exist. Please refresh and try again';
      case 'P2025':
        return 'Record not found';
      case 'P2014':
        return 'Invalid data provided';
      case 'P2016':
        return 'Query interpretation error';
      case 'P2021':
        return 'Table does not exist';
      case 'P2022':
        return 'Column does not exist';
      default:
        return `Database constraint error: ${error.message}`;
    }
  }
  
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return 'Unknown database error occurred';
  }
  
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return 'Database connection error';
  }
  
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return 'Database initialization error';
  }
  
  if (error instanceof Prisma.PrismaClientValidationError) {
    return 'Invalid data format provided';
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return `Failed to ${operation}`;
}

// Validate database connection
async function validateDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection validation failed:', error);
    return false;
  }
}

// Validate user exists
async function validateUserExists(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    return !!user;
  } catch (error) {
    console.error('User validation failed:', error);
    return false;
  }
}

// Validate multiple employee IDs exist
async function validateEmployeeIds(employeeIds: string[]): Promise<{ valid: boolean; invalidIds: string[] }> {
  try {
    if (employeeIds.length === 0) {
      return { valid: true, invalidIds: [] };
    }

    const users = await prisma.user.findMany({
      where: { 
        id: { in: employeeIds }
      },
      select: { id: true }
    });

    const foundIds = users.map(user => user.id);
    const invalidIds = employeeIds.filter(id => !foundIds.includes(id));

    return {
      valid: invalidIds.length === 0,
      invalidIds
    };
  } catch (error) {
    console.error('Employee IDs validation failed:', error);
    return { valid: false, invalidIds: employeeIds };
  }
}

// Validate captain ID exists
async function validateCaptainId(captainId: string): Promise<boolean> {
  try {
    const captain = await prisma.user.findUnique({
      where: { id: captainId },
      select: { id: true, roles: true }
    });
    
    // Check if user exists and has captain role
    return !!captain && captain.roles.includes('captain');
  } catch (error) {
    console.error('Captain validation failed:', error);
    return false;
  }
}

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

    // Check if data can be modified for this date
    const canModify = await canModifyDataForDate(validatedData.logDate);
    if (!canModify) {
      return { 
        success: false, 
        error: 'Cannot modify data for this date - pay period is locked or closed' 
      };
    }

    // Validate database connection
    const dbConnected = await validateDatabaseConnection();
    if (!dbConnected) {
      return { success: false, error: 'Database connection unavailable. Please try again later.' };
    }

    // Validate captain ID exists
    const captainValid = await validateCaptainId(validatedData.captainId);
    if (!captainValid) {
      return { 
        success: false, 
        error: 'Selected captain is not valid. Please refresh the page and select a valid captain.' 
      };
    }

    // Validate employee IDs exist (if there are hours to save)
    if (validatedData.hours.length > 0) {
      const employeeIds = validatedData.hours.map(hour => hour.employeeId);
      const employeeValidation = await validateEmployeeIds(employeeIds);
      
      if (!employeeValidation.valid) {
        return { 
          success: false, 
          error: `Invalid employees selected: ${employeeValidation.invalidIds.join(', ')}. Please refresh the page and select valid employees.` 
        };
      }
    }

    const logData = {
      captainId: validatedData.captainId,
      logDate: validatedData.logDate,
      status: 'draft',
      createdById: session.user.id,
      lastEditedById: session.user.id,
    };

    let savedLog;

    let existingLog = null;
    
    if (logId) {
      // Get existing log for audit trail
      existingLog = await prisma.dailyLog.findUnique({
        where: { id: logId },
        include: { jobs: true, hours: true },
      });
      
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
    await logDailyLogChange(
      logId ? 'update' : 'create',
      savedLog.id,
      session.user.id,
      existingLog ? existingLog as Record<string, unknown> : undefined,
      savedLog as Record<string, unknown>,
      { formData: validatedData }
    );

    return { 
      success: true, 
      data: { 
        id: savedLog.id,
        status: savedLog.status,
        updatedAt: savedLog.updatedAt,
      } 
    };
  } catch (error) {
    // Error saving draft log
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

    // Validate database connection
    const dbConnected = await validateDatabaseConnection();
    if (!dbConnected) {
      return { success: false, error: 'Database connection unavailable. Please try again later.' };
    }

    // Validate captain ID exists
    const captainValid = await validateCaptainId(validatedData.captainId);
    if (!captainValid) {
      return { 
        success: false, 
        error: 'Selected captain is not valid. Please refresh the page and select a valid captain.' 
      };
    }

    // Validate employee IDs exist (if there are hours to submit)
    if (validatedData.hours.length > 0) {
      const employeeIds = validatedData.hours.map(hour => hour.employeeId);
      const employeeValidation = await validateEmployeeIds(employeeIds);
      
      if (!employeeValidation.valid) {
        return { 
          success: false, 
          error: `Invalid employees selected: ${employeeValidation.invalidIds.join(', ')}. Please refresh the page and select valid employees.` 
        };
      }
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
      await logDailyLogChange(
        'submit',
        submittedLog.id,
        session.user.id,
        { status: 'draft' },
        { status: 'submitted', submittedAt: submittedLog.submittedAt }
      );

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
    // Error submitting log
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
    // Validate input
    if (!logId || typeof logId !== 'string') {
      return { success: false, error: 'Invalid log ID provided' };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Validate database connection
    const dbConnected = await validateDatabaseConnection();
    if (!dbConnected) {
      return { success: false, error: 'Database connection unavailable. Please try again later.' };
    }

    // Validate user exists
    const userExists = await validateUserExists(session.user.id);
    if (!userExists) {
      return { success: false, error: 'User session invalid. Please log in again.' };
    }

    const log = await prisma.dailyLog.findUnique({
      where: { id: logId },
      include: {
        jobs: {
          orderBy: { createdAt: 'asc' }
        },
        hours: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' }
        },
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
      },
    });

    if (!log) {
      return { success: false, error: 'Log not found' };
    }

    // Validate captain exists
    if (!log.captain) {
      return { success: false, error: 'Log captain information is missing' };
    }

    // Check if user has permission to view this log
    const canView = 
      log.createdById === session.user.id || 
      log.captainId === session.user.id ||
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('admin');

    if (!canView) {
      return { success: false, error: 'Permission denied' };
    }

    // Validate and clean data
    const cleanedJobs = log.jobs.map(job => ({
      ...job,
      revenue: Number(job.revenue),
      tips: Number(job.tips),
      junkOnMove: job.junkOnMove ? Number(job.junkOnMove) : undefined,
      valuation: job.valuation ? Number(job.valuation) : undefined,
      materials: job.materials ? Number(job.materials) : undefined,
      disposalCost: job.disposalCost ? Number(job.disposalCost) : undefined,
    }));

    const cleanedHours = log.hours.map(hour => ({
      ...hour,
      hours: Number(hour.hours),
      employee: hour.employee || { id: hour.employeeId, fullName: 'Unknown Employee' }
    }));

    return { 
      success: true, 
      data: {
        id: log.id,
        captainId: log.captainId,
        captain: log.captain,
        logDate: log.logDate,
        status: log.status,
        jobs: cleanedJobs,
        hours: cleanedHours,
        submittedAt: log.submittedAt || undefined,
        approvedAt: log.approvedAt || undefined,
        approvedBy: log.approvedBy?.fullName || undefined,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleDatabaseError(error, 'load log')
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

    // Validate database connection
    const dbConnected = await validateDatabaseConnection();
    if (!dbConnected) {
      return { success: false, error: 'Database connection unavailable. Please try again later.' };
    }

    // Validate user exists
    const userExists = await validateUserExists(session.user.id);
    if (!userExists) {
      return { success: false, error: 'User session invalid. Please log in again.' };
    }

    const logs = await prisma.dailyLog.findMany({
      where: {
        status: {
          in: ['submitted', 'approved']
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
      orderBy: [
        { submittedAt: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    // Validate and clean data
    const reviewData = logs
      .filter(log => log.captain) // Filter out logs with missing captain data
      .map(log => {
        try {
          const totalRevenue = log.jobs.reduce((sum, job) => {
            const revenue = Number(job.revenue);
            return sum + (isNaN(revenue) ? 0 : revenue);
          }, 0);

          const totalHours = log.hours.reduce((sum, hour) => {
            const hours = Number(hour.hours);
            return sum + (isNaN(hours) ? 0 : hours);
          }, 0);

          return {
            id: log.id,
            captainName: log.captain?.fullName || 'Unknown Captain',
            logDate: log.logDate,
            status: log.status as 'submitted' | 'approved',
            totalRevenue,
            totalHours,
            jobCount: log.jobs.length,
            submittedAt: log.submittedAt || log.createdAt, // Fallback to createdAt if submittedAt is null
            approvedAt: log.approvedAt || undefined,
            approvedBy: log.approvedBy?.fullName || undefined,
          };
        } catch (error) {
          console.error(`Error processing log ${log.id}:`, error);
          // Return a safe fallback for this log
          return {
            id: log.id,
            captainName: log.captain?.fullName || 'Unknown Captain',
            logDate: log.logDate,
            status: log.status as 'submitted' | 'approved',
            totalRevenue: 0,
            totalHours: 0,
            jobCount: 0,
            submittedAt: log.submittedAt || log.createdAt,
            approvedAt: log.approvedAt || undefined,
            approvedBy: log.approvedBy?.fullName || undefined,
          };
        }
      });

    return { 
      success: true, 
      data: reviewData
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleDatabaseError(error, 'get logs for review')
    };
  }
}

/**
 * Approve a daily log
 */
export async function approveLog(logId: string, comments?: string): Promise<LogActionResult> {
  try {
    // Validate input
    if (!logId || typeof logId !== 'string') {
      return { success: false, error: 'Invalid log ID provided' };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has manager or admin role
    if (!session.user.roles?.includes('manager') && !session.user.roles?.includes('admin')) {
      return { success: false, error: 'Manager access required' };
    }

    // Validate database connection
    const dbConnected = await validateDatabaseConnection();
    if (!dbConnected) {
      return { success: false, error: 'Database connection unavailable. Please try again later.' };
    }

    // Validate user exists
    const userExists = await validateUserExists(session.user.id);
    if (!userExists) {
      return { success: false, error: 'User session invalid. Please log in again.' };
    }

    const log = await prisma.dailyLog.findUnique({
      where: { id: logId },
      include: {
        jobs: true,
        commissions: true,
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

    if (log.status !== 'submitted') {
      return { success: false, error: 'Only submitted logs can be approved' };
    }

    // Validate captain exists
    if (!log.captain) {
      return { success: false, error: 'Log captain information is missing' };
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Update log status to approved
      const approvedLog = await tx.dailyLog.update({
        where: { id: logId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedById: session.user.id,
        },
      });

      // Create audit log entry
      try {
        await logDailyLogChange(
          'approve',
          logId,
          session.user.id,
          { status: 'submitted' },
          { status: 'approved' },
          { comments, approvedAt: approvedLog.approvedAt }
        );
      } catch (auditError) {
        console.error('Audit log creation failed:', auditError);
        // Don't fail the transaction for audit log errors
      }

      return approvedLog;
    });

    // Auto-match commission entries (outside transaction to avoid blocking)
    let matchingResult: {
      success: boolean;
      notifications: Array<{ type: string; title: string; message: string; data?: Record<string, unknown> }>;
      matchResult?: { matches: Array<unknown>; conflicts: Array<unknown> };
    } = { success: true, notifications: [], matchResult: { matches: [], conflicts: [] } };
    
    try {
      const { handleLogApprovalCommissionMatching } = await import('@/lib/commissionMatchingService');
      matchingResult = await handleLogApprovalCommissionMatching(logId, session.user.id);
    } catch (matchingError) {
      console.error('Commission matching failed:', matchingError);
      // Don't fail the approval for commission matching errors
    }

    // Store matching notifications in the response data for UI feedback
    const matchingNotifications = matchingResult.notifications || [];

    revalidatePath('/logs/review');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      data: { 
        id: result.id,
        status: result.status,
        approvedAt: result.approvedAt || undefined,
        commissionMatching: {
          success: matchingResult.success,
          notifications: matchingNotifications,
          matchCount: matchingResult.matchResult?.matches.length || 0,
          conflictCount: matchingResult.matchResult?.conflicts.length || 0,
        },
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleDatabaseError(error, 'approve log')
    };
  }
}

/**
 * Delete a daily log
 */
export async function deleteLog(logId: string): Promise<LogActionResult> {
  try {
    // Validate input
    if (!logId || typeof logId !== 'string') {
      return { success: false, error: 'Invalid log ID provided' };
    }

    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has admin role (only system admins can delete)
    if (!session.user.roles?.includes('admin')) {
      return { success: false, error: 'System administrator access required to delete logs' };
    }

    // Validate database connection
    const dbConnected = await validateDatabaseConnection();
    if (!dbConnected) {
      return { success: false, error: 'Database connection unavailable. Please try again later.' };
    }

    // Validate user exists
    const userExists = await validateUserExists(session.user.id);
    if (!userExists) {
      return { success: false, error: 'User session invalid. Please log in again.' };
    }

    const log = await prisma.dailyLog.findUnique({
      where: { id: logId },
      include: {
        captain: {
          select: {
            id: true,
            fullName: true,
          },
        },
        jobs: true,
        hours: true,
      },
    });

    if (!log) {
      return { success: false, error: 'Log not found' };
    }

    // Only allow deletion of draft or submitted logs, not approved ones
    if (log.status === 'approved') {
      return { success: false, error: 'Cannot delete approved logs. Please contact an administrator.' };
    }

    // Validate captain exists
    if (!log.captain) {
      return { success: false, error: 'Log captain information is missing' };
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Delete related records first (foreign key constraints)
      await tx.logHour.deleteMany({
        where: { logId: logId },
      });

      await tx.logJob.deleteMany({
        where: { logId: logId },
      });

      // Delete audit logs related to this log
      await tx.auditLog.deleteMany({
        where: { dailyLogId: logId },
      });

      // Delete the log itself
      await tx.dailyLog.delete({
        where: { id: logId },
      });

      // Create audit log entry for deletion
      try {
        await logDailyLogChange(
          'delete',
          logId,
          session.user.id,
          log as Record<string, unknown>,
          undefined,
          { deletedAt: new Date() }
        );
      } catch (auditError) {
        console.error('Audit log creation failed:', auditError);
        // Don't fail the transaction for audit log errors
      }
    });

    revalidatePath('/logs/review');
    revalidatePath('/logs');
    revalidatePath('/dashboard');

    return { 
      success: true, 
      data: { 
        id: logId,
        deleted: true,
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: handleDatabaseError(error, 'delete log')
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
    // Error bulk approving logs
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk approve logs' 
    };
  }
}

/**
 * Bulk delete multiple logs
 */
export async function bulkDeleteLogs(logIds: string[]): Promise<LogActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has admin role (only system admins can delete)
    if (!session.user.roles?.includes('admin')) {
      return { success: false, error: 'System administrator access required to delete logs' };
    }

    const results = [];
    for (const logId of logIds) {
      const result = await deleteLog(logId);
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
    return { 
      success: false, 
      error: handleDatabaseError(error, 'bulk delete logs')
    };
  }
}