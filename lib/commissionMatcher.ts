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

// Placeholder function - will be fully implemented in later tasks
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function processCommissionMatching(
  _approvedLogId: string
): Promise<MatchResult> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = _approvedLogId; // Acknowledge unused parameter

  // TODO: Implement database operations for commission matching
  return {
    matches: [],
    conflicts: [],
    unmatched: [],
  };
}
