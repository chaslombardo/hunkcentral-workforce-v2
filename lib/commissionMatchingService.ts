'use server';

import { prisma } from '@/lib/prisma';
import {
  processCommissionMatching,
  type MatchResult,
  type CommissionConflict,
} from '@/lib/commissionMatcher';
import type { CommissionEntry, DailyLog, LogJob } from '@/types';
import { logCommissionChange } from '@/lib/auditLogger';
import { onCommissionMatched } from '@/lib/cache';

export interface MatchingNotification {
  type: 'success' | 'conflict' | 'error';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface CommissionMatchingResult {
  success: boolean;
  notifications: MatchingNotification[];
  matchResult?: MatchResult;
  error?: string;
}

/**
 * Main service function to handle commission matching when a log is approved
 */
export async function handleLogApprovalCommissionMatching(
  approvedLogId: string,
  userId: string
): Promise<CommissionMatchingResult> {
  try {
    // Process the commission matching
    const matchResult = await processCommissionMatching(approvedLogId);

    const notifications: MatchingNotification[] = [];

    // Process successful matches
    for (const match of matchResult.matches) {
      await logCommissionChange(
        'match',
        match.commissionEntry.id,
        userId,
        {
          status: 'pending',
          actualRevenue: null,
          commissionAmount: null,
          matchedLogId: null,
        },
        {
          status: 'matched',
          actualRevenue: Number(match.logJob.revenue),
          commissionAmount: match.commissionEntry.sales.commissionRate
            ? Number(match.logJob.revenue) *
              (Number(match.commissionEntry.sales.commissionRate) / 100)
            : 0,
          matchedLogId: approvedLogId,
        }
      );

      // Trigger cache invalidation for performance optimization
      try {
        await onCommissionMatched(match.commissionEntry.id);
      } catch (cacheError) {
        // Don't fail the operation if cache invalidation fails
        console.error('Cache invalidation failed:', cacheError);
      }

      notifications.push({
        type: 'success',
        title: 'Commission Matched',
        message: `Job ${match.logJob.jobId} matched to ${match.commissionEntry.sales.fullName} (${match.accuracyPercentage.toFixed(1)}% accuracy)`,
        data: {
          jobId: match.logJob.jobId,
          salesPerson: match.commissionEntry.sales.fullName,
          accuracy: match.accuracyPercentage,
          estimatedRevenue: match.commissionEntry.estimatedRevenue,
          actualRevenue: Number(match.logJob.revenue),
          commissionAmount: match.commissionEntry.sales.commissionRate
            ? Number(match.logJob.revenue) *
              (Number(match.commissionEntry.sales.commissionRate) / 100)
            : 0,
        },
      });
    }

    // Handle conflicts
    for (const conflict of matchResult.conflicts) {
      notifications.push({
        type: 'conflict',
        title: 'Commission Conflict Detected',
        message: `Multiple commission entries found for job ${conflict.jobId}. Manual resolution required.`,
        data: {
          jobId: conflict.jobId,
          conflictingEntries: conflict.commissionEntries.map((entry) => ({
            id: entry.id,
            salesPerson: entry.sales.fullName,
            estimatedRevenue: entry.estimatedRevenue,
            targetDate: entry.targetDate,
          })),
          actualRevenue: Number(conflict.logJob.revenue),
        },
      });
    }

    // Add summary notification if there were matches
    if (matchResult.matches.length > 0) {
      const totalCommission = matchResult.matches.reduce((sum, match) => {
        const commissionRate = Number(
          match.commissionEntry.sales.commissionRate || 0
        );
        return sum + Number(match.logJob.revenue) * (commissionRate / 100);
      }, 0);

      notifications.push({
        type: 'success',
        title: 'Commission Matching Complete',
        message: `${matchResult.matches.length} commission(s) matched with total value of $${totalCommission.toFixed(2)}`,
        data: {
          matchCount: matchResult.matches.length,
          totalCommission,
          conflictCount: matchResult.conflicts.length,
        },
      });
    }

    return {
      success: true,
      notifications,
      matchResult,
    };
  } catch (error) {
    // Error in commission matching service

    return {
      success: false,
      notifications: [
        {
          type: 'error',
          title: 'Commission Matching Failed',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred during commission matching',
        },
      ],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Resolve a commission conflict by selecting the correct commission entry
 */
export async function resolveCommissionConflict(
  jobId: string,
  selectedCommissionEntryId: string,
  userId: string
): Promise<CommissionMatchingResult> {
  try {
    // Get the selected commission entry
    const selectedEntry = await prisma.commissionEntry.findUnique({
      where: { id: selectedCommissionEntryId },
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            commissionRate: true,
          },
        },
      },
    });

    if (!selectedEntry) {
      throw new Error('Selected commission entry not found');
    }

    // Get the log job
    const logJob = await prisma.logJob.findFirst({
      where: { jobId },
      include: {
        log: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!logJob || logJob.log.status !== 'approved') {
      throw new Error('Approved log job not found');
    }

    // Get all conflicting commission entries for this job ID
    const conflictingEntries = await prisma.commissionEntry.findMany({
      where: {
        jobId,
        status: 'pending',
      },
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Calculate commission amount
    const commissionRate = Number(selectedEntry.sales.commissionRate || 0);
    const commissionAmount = Number(logJob.revenue) * (commissionRate / 100);

    // Update the selected entry to matched
    await prisma.commissionEntry.update({
      where: { id: selectedCommissionEntryId },
      data: {
        status: 'matched',
        actualRevenue: Number(logJob.revenue),
        commissionAmount: commissionAmount,
        matchedLogId: logJob.log.id,
      },
    });

    // Mark other entries as conflicts (or optionally delete them)
    const otherEntries = conflictingEntries.filter(
      (entry) => entry.id !== selectedCommissionEntryId
    );
    for (const entry of otherEntries) {
      await prisma.commissionEntry.delete({
        where: { id: entry.id },
      });

      // Log the deletion
      await logCommissionChange('delete', entry.id, userId, entry, undefined, {
        reason: 'Conflict resolution - duplicate entry removed',
      });
    }

    // Log the successful match
    await logCommissionChange(
      'match',
      selectedCommissionEntryId,
      userId,
      {
        status: 'pending',
        actualRevenue: null,
        commissionAmount: null,
        matchedLogId: null,
      },
      {
        status: 'matched',
        actualRevenue: Number(logJob.revenue),
        commissionAmount: commissionAmount,
        matchedLogId: logJob.log.id,
      },
      { reason: 'Manual conflict resolution' }
    );

    // Trigger cache invalidation for performance optimization
    try {
      await onCommissionMatched(selectedCommissionEntryId);
    } catch (cacheError) {
      // Don't fail the operation if cache invalidation fails
      console.error('Cache invalidation failed:', cacheError);
    }

    const notifications: MatchingNotification[] = [
      {
        type: 'success',
        title: 'Conflict Resolved',
        message: `Commission for job ${jobId} assigned to ${selectedEntry.sales.fullName}. ${otherEntries.length} duplicate entries removed.`,
        data: {
          jobId,
          selectedSalesPerson: selectedEntry.sales.fullName,
          commissionAmount,
          removedEntries: otherEntries.length,
        },
      },
    ];

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    // Error resolving commission conflict

    return {
      success: false,
      notifications: [
        {
          type: 'error',
          title: 'Conflict Resolution Failed',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred during conflict resolution',
        },
      ],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get commission conflicts that need manual resolution
 */
export async function getCommissionConflicts(): Promise<{
  success: boolean;
  conflicts: CommissionConflict[];
  error?: string;
}> {
  try {
    // Find jobs that have multiple pending commission entries
    const duplicateJobIds = await prisma.commissionEntry.groupBy({
      by: ['jobId'],
      where: { status: 'pending' },
      having: {
        jobId: {
          _count: {
            gt: 1,
          },
        },
      },
    });

    const conflicts: CommissionConflict[] = [];

    for (const group of duplicateJobIds) {
      // Get the commission entries for this job ID
      const commissionEntries = await prisma.commissionEntry.findMany({
        where: {
          jobId: group.jobId,
          status: 'pending',
        },
        include: {
          sales: {
            select: {
              id: true,
              fullName: true,
              email: true,
              roles: true,
              commissionRate: true,
              junkBonusGoal: true,
              moveBonusGoal: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      // Check if there's a corresponding approved log job
      const logJob = await prisma.logJob.findFirst({
        where: { jobId: group.jobId },
        include: {
          log: {
            select: {
              id: true,
              status: true,
              logDate: true,
              captainId: true,
              createdById: true,
              createdAt: true,
              updatedAt: true,
              captain: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  roles: true,
                  junkBonusGoal: true,
                  moveBonusGoal: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
          },
        },
      });

      if (logJob && logJob.log.status === 'approved') {
        // Transform the database result to match our types
        const transformedLogJob = {
          ...logJob,
          revenue: Number(logJob.revenue),
          tips: Number(logJob.tips),
          junkOnMove: logJob.junkOnMove ? Number(logJob.junkOnMove) : undefined,
          valuation: logJob.valuation ? Number(logJob.valuation) : undefined,
          materials: logJob.materials ? Number(logJob.materials) : undefined,
          disposalCost: logJob.disposalCost
            ? Number(logJob.disposalCost)
            : undefined,
          jobType: logJob.jobType as 'junk' | 'move',
          log: {
            ...logJob.log,
            captain: {
              ...logJob.log.captain,
              junkBonusGoal: Number(logJob.log.captain.junkBonusGoal),
              moveBonusGoal: Number(logJob.log.captain.moveBonusGoal),
              roles: logJob.log.captain.roles as (
                | 'admin'
                | 'manager'
                | 'captain'
                | 'sales'
                | 'wingman'
              )[],
            },
            createdBy: {
              ...logJob.log.captain,
              junkBonusGoal: Number(logJob.log.captain.junkBonusGoal),
              moveBonusGoal: Number(logJob.log.captain.moveBonusGoal),
              roles: logJob.log.captain.roles as (
                | 'admin'
                | 'manager'
                | 'captain'
                | 'sales'
                | 'wingman'
              )[],
            },
            jobs: [],
            hours: [],
          } as DailyLog,
        } as LogJob;

        const transformedCommissionEntries = commissionEntries.map((entry) => ({
          ...entry,
          estimatedRevenue: Number(entry.estimatedRevenue),
          actualRevenue: entry.actualRevenue
            ? Number(entry.actualRevenue)
            : null,
          commissionAmount: entry.commissionAmount
            ? Number(entry.commissionAmount)
            : null,
          status: entry.status as 'pending' | 'matched' | 'approved',
          jobType: entry.jobType as 'junk' | 'move',
          sales: {
            ...entry.sales,
            junkBonusGoal: Number(entry.sales.junkBonusGoal),
            moveBonusGoal: Number(entry.sales.moveBonusGoal),
            roles: entry.sales.roles as (
              | 'admin'
              | 'manager'
              | 'captain'
              | 'sales'
              | 'wingman'
            )[],
            commissionRate: entry.sales.commissionRate
              ? Number(entry.sales.commissionRate)
              : undefined,
          },
        })) as CommissionEntry[];

        conflicts.push({
          jobId: group.jobId,
          commissionEntries: transformedCommissionEntries,
          logJob: transformedLogJob,
          reason: `Multiple commission entries found for approved job ${group.jobId}`,
        });
      }
    }

    return {
      success: true,
      conflicts,
    };
  } catch (error) {
    // Error getting commission conflicts

    return {
      success: false,
      conflicts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get commission matching statistics
 */
export async function getCommissionMatchingStats(): Promise<{
  success: boolean;
  stats?: {
    totalPending: number;
    totalMatched: number;
    totalConflicts: number;
    averageAccuracy: number;
    totalCommissionValue: number;
  };
  error?: string;
}> {
  try {
    const [pendingCount, matchedEntries, conflicts] = await Promise.all([
      prisma.commissionEntry.count({
        where: { status: 'pending' },
      }),
      prisma.commissionEntry.findMany({
        where: {
          status: 'matched',
          actualRevenue: { not: null },
          commissionAmount: { not: null },
        },
        select: {
          estimatedRevenue: true,
          actualRevenue: true,
          commissionAmount: true,
        },
      }),
      getCommissionConflicts(),
    ]);

    // Calculate average accuracy
    let totalAccuracy = 0;
    let accuracyCount = 0;
    let totalCommissionValue = 0;

    for (const entry of matchedEntries) {
      if (entry.actualRevenue && entry.commissionAmount) {
        const estimated = Number(entry.estimatedRevenue);
        const actual = Number(entry.actualRevenue);

        if (estimated > 0) {
          const accuracy = Math.min(
            (Math.min(estimated, actual) / Math.max(estimated, actual)) * 100,
            100
          );
          totalAccuracy += accuracy;
          accuracyCount++;
        }

        totalCommissionValue += Number(entry.commissionAmount);
      }
    }

    const averageAccuracy =
      accuracyCount > 0 ? totalAccuracy / accuracyCount : 0;

    return {
      success: true,
      stats: {
        totalPending: pendingCount,
        totalMatched: matchedEntries.length,
        totalConflicts: conflicts.success ? conflicts.conflicts.length : 0,
        averageAccuracy,
        totalCommissionValue,
      },
    };
  } catch (error) {
    // Error getting commission matching stats

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
