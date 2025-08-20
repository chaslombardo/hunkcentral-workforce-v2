// Commission matching algorithms
import type { CommissionEntry, DailyLog, LogJob } from '@/types';

export interface CommissionMatch {
  commissionEntry: CommissionEntry;
  logJob: LogJob;
  dailyLog: DailyLog;
  accuracyPercentage: number;
}

export interface MatchResult {
  matches: CommissionMatch[];
  conflicts: CommissionConflict[];
  unmatched: CommissionEntry[];
}

export interface CommissionConflict {
  jobId: string;
  commissionEntries: CommissionEntry[];
  logJob: LogJob;
  reason: string;
}

/**
 * Find commission entries that match a job ID
 */
export function findCommissionMatches(
  jobId: string,
  commissionEntries: CommissionEntry[]
): CommissionEntry[] {
  return commissionEntries.filter(
    (entry) => entry.jobId === jobId && entry.status === 'pending'
  );
}

/**
 * Calculate booking accuracy percentage
 */
export function calculateBookingAccuracy(
  estimatedRevenue: number,
  actualRevenue: number
): number {
  if (estimatedRevenue === 0) return 0;

  const difference = Math.abs(estimatedRevenue - actualRevenue);
  const accuracy = 1 - difference / Math.max(estimatedRevenue, actualRevenue);
  return Math.max(0, accuracy * 100);
}

/**
 * Calculate commission amount
 */
export function calculateCommissionAmount(
  actualRevenue: number,
  commissionRate: number
): number {
  return actualRevenue * (commissionRate / 100);
}

/**
 * Match commission entries to approved log jobs
 */
export function matchCommissions(
  approvedLog: DailyLog,
  allCommissionEntries: CommissionEntry[]
): MatchResult {
  const matches: CommissionMatch[] = [];
  const conflicts: CommissionConflict[] = [];
  const processedJobIds = new Set<string>();

  // Process each job in the approved log
  for (const logJob of approvedLog.jobs) {
    if (processedJobIds.has(logJob.jobId)) continue;
    processedJobIds.add(logJob.jobId);

    const matchingEntries = findCommissionMatches(
      logJob.jobId,
      allCommissionEntries
    );

    if (matchingEntries.length === 0) {
      // No commission entries for this job - this is normal
      continue;
    } else if (matchingEntries.length === 1) {
      // Perfect match - one commission entry for one job
      const commissionEntry = matchingEntries[0];
      const accuracyPercentage = calculateBookingAccuracy(
        commissionEntry.estimatedRevenue,
        logJob.revenue
      );

      matches.push({
        commissionEntry,
        logJob,
        dailyLog: approvedLog,
        accuracyPercentage,
      });
    } else {
      // Conflict - multiple commission entries for the same job ID
      conflicts.push({
        jobId: logJob.jobId,
        commissionEntries: matchingEntries,
        logJob,
        reason: `Multiple commission entries found for job ID ${logJob.jobId}`,
      });
    }
  }

  // Find unmatched commission entries
  const matchedEntryIds = new Set(matches.map((m) => m.commissionEntry.id));
  const conflictEntryIds = new Set(
    conflicts.flatMap((c) => c.commissionEntries.map((e) => e.id))
  );

  const unmatched = allCommissionEntries.filter(
    (entry) =>
      entry.status === 'pending' &&
      !matchedEntryIds.has(entry.id) &&
      !conflictEntryIds.has(entry.id)
  );

  return {
    matches,
    conflicts,
    unmatched,
  };
}

/**
 * Process commission matching for an approved log
 * This is the main function called when a log is approved
 */
export async function processCommissionMatching(
  approvedLogId: string
): Promise<MatchResult> {
  const { prisma } = await import('@/lib/prisma');

  // Get the approved log with its jobs
  const approvedLogData = await prisma.dailyLog.findUnique({
    where: { id: approvedLogId },
    include: {
      jobs: true,
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
      createdBy: {
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
      hours: true,
    },
  });

  if (!approvedLogData) {
    throw new Error('Approved log not found');
  }

  // Transform to match DailyLog type - use type assertion for database compatibility
  const approvedLog = {
    ...approvedLogData,
    captain: approvedLogData.captain
      ? {
          ...approvedLogData.captain,
          junkBonusGoal: Number(approvedLogData.captain.junkBonusGoal || 0.14),
          moveBonusGoal: Number(approvedLogData.captain.moveBonusGoal || 0.24),
          roles: approvedLogData.captain.roles as (
            | 'admin'
            | 'manager'
            | 'captain'
            | 'sales'
            | 'wingman'
          )[],
        }
      : null,
    createdBy: approvedLogData.createdBy
      ? {
          ...approvedLogData.createdBy,
          junkBonusGoal: Number(
            approvedLogData.createdBy.junkBonusGoal || 0.14
          ),
          moveBonusGoal: Number(
            approvedLogData.createdBy.moveBonusGoal || 0.24
          ),
          roles: approvedLogData.createdBy.roles as (
            | 'admin'
            | 'manager'
            | 'captain'
            | 'sales'
            | 'wingman'
          )[],
        }
      : null,
    jobs: (approvedLogData.jobs || []).map((job) => ({
      ...job,
      revenue: Number(job.revenue),
      tips: Number(job.tips),
      junkOnMove: job.junkOnMove ? Number(job.junkOnMove) : undefined,
      valuation: job.valuation ? Number(job.valuation) : undefined,
      materials: job.materials ? Number(job.materials) : undefined,
      disposalCost: job.disposalCost ? Number(job.disposalCost) : undefined,
      jobType: job.jobType as 'junk' | 'move',
      log: {} as DailyLog, // Will be set after creation
    })),
    hours: (approvedLogData.hours || []).map((hour) => ({
      ...hour,
      hours: Number(hour.hours),
      department: hour.department as
        | 'junk'
        | 'move'
        | 'zigma'
        | 'training'
        | 'estimating'
        | 'warehouse'
        | 'admin',
      log: {} as DailyLog, // Will be set after creation
      employee: approvedLogData.captain
        ? {
            ...approvedLogData.captain,
            junkBonusGoal: Number(
              approvedLogData.captain.junkBonusGoal || 0.14
            ),
            moveBonusGoal: Number(
              approvedLogData.captain.moveBonusGoal || 0.24
            ),
            roles: approvedLogData.captain.roles as (
              | 'admin'
              | 'manager'
              | 'captain'
              | 'sales'
              | 'wingman'
            )[],
          }
        : {
            id: 'unknown',
            email: 'unknown@example.com',
            fullName: 'Unknown User',
            roles: ['wingman'] as (
              | 'admin'
              | 'manager'
              | 'captain'
              | 'sales'
              | 'wingman'
            )[],
            junkBonusGoal: 0.14,
            moveBonusGoal: 0.24,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
    })),
  } as DailyLog;

  // Set circular references
  approvedLog.jobs.forEach((job) => {
    job.log = approvedLog;
  });
  approvedLog.hours.forEach((hour) => {
    hour.log = approvedLog;
  });

  // Get all pending commission entries
  const allCommissionEntriesData = await prisma.commissionEntry.findMany({
    where: { status: 'pending' },
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

  // Transform to match CommissionEntry type
  const allCommissionEntries = allCommissionEntriesData.map((entry) => ({
    ...entry,
    estimatedRevenue: Number(entry.estimatedRevenue),
    actualRevenue: entry.actualRevenue ? Number(entry.actualRevenue) : null,
    commissionAmount: entry.commissionAmount
      ? Number(entry.commissionAmount)
      : null,
    status: entry.status as 'pending' | 'matched' | 'approved',
    jobType: entry.jobType as 'junk' | 'move',
    sales: entry.sales
      ? {
          ...entry.sales,
          junkBonusGoal: Number(entry.sales.junkBonusGoal || 0.14),
          moveBonusGoal: Number(entry.sales.moveBonusGoal || 0.24),
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
        }
      : {
          id: 'unknown',
          email: 'unknown@example.com',
          fullName: 'Unknown Sales',
          roles: ['sales'] as (
            | 'admin'
            | 'manager'
            | 'captain'
            | 'sales'
            | 'wingman'
          )[],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
  })) as CommissionEntry[];

  // Match commissions using the existing logic
  const matchResult = matchCommissions(approvedLog, allCommissionEntries);

  // Process successful matches
  for (const match of matchResult.matches) {
    const commissionRate = Number(
      match.commissionEntry.sales.commissionRate || 0
    );
    const commissionAmount = calculateCommissionAmount(
      Number(match.logJob.revenue),
      commissionRate
    );

    await prisma.commissionEntry.update({
      where: { id: match.commissionEntry.id },
      data: {
        status: 'matched',
        actualRevenue: Number(match.logJob.revenue),
        commissionAmount: commissionAmount,
        matchedLogId: approvedLogId,
      },
    });
  }

  return matchResult;
}
