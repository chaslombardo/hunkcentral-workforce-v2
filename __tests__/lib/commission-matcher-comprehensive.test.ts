import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  findCommissionMatches,
  calculateBookingAccuracy,
  calculateCommissionAmount,
  matchCommissions,
  processCommissionMatching,
  type CommissionEntry,
  type DailyLog,
  type LogJob,
  type CommissionMatch,
  type MatchResult,
  type CommissionConflict,
} from '@/lib/commissionMatcher';
import type { User } from '@/types';

// Mock Prisma
const mockPrisma = {
  dailyLog: {
    findUnique: vi.fn(),
  },
  commissionEntry: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock data helpers
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['sales'],
  commissionRate: 5.0,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockCommissionEntry = (
  overrides: Partial<CommissionEntry> = {}
): CommissionEntry => ({
  id: 'comm-1',
  salesId: 'sales-1',
  sales: createMockUser({ id: 'sales-1', roles: ['sales'] }),
  jobId: 'JOB001',
  clientName: 'Test Client',
  jobType: 'junk',
  targetDate: new Date('2024-12-31'),
  estimatedRevenue: 500,
  actualRevenue: null,
  commissionAmount: null,
  status: 'pending',
  matchedLogId: null,
  matchedLog: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockLogJob = (overrides: Partial<LogJob> = {}): LogJob => ({
  id: 'job-1',
  logId: 'log-1',
  log: {} as DailyLog,
  jobType: 'junk',
  jobId: 'JOB001',
  clientName: 'Test Client',
  revenue: 600,
  tips: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockDailyLog = (
  jobs: LogJob[] = [],
  overrides: Partial<DailyLog> = {}
): DailyLog => ({
  id: 'log-1',
  captainId: 'captain-1',
  captain: createMockUser({ id: 'captain-1', roles: ['captain'] }),
  logDate: new Date('2024-12-01'),
  status: 'approved',
  submittedAt: new Date(),
  approvedAt: new Date(),
  approvedById: 'manager-1',
  createdById: 'captain-1',
  createdBy: createMockUser({ id: 'captain-1', roles: ['captain'] }),
  createdAt: new Date(),
  updatedAt: new Date(),
  jobs,
  hours: [],
  ...overrides,
});

describe('Commission Matcher - Comprehensive Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findCommissionMatches', () => {
    it('should find exact job ID matches', () => {
      const commissionEntries = [
        createMockCommissionEntry({ jobId: 'JOB001', status: 'pending' }),
        createMockCommissionEntry({
          id: 'comm-2',
          jobId: 'JOB002',
          status: 'pending',
        }),
        createMockCommissionEntry({
          id: 'comm-3',
          jobId: 'JOB001',
          status: 'matched',
        }),
      ];

      const matches = findCommissionMatches('JOB001', commissionEntries);

      expect(matches).toHaveLength(1);
      expect(matches[0].jobId).toBe('JOB001');
      expect(matches[0].status).toBe('pending');
    });

    it('should only return pending entries', () => {
      const commissionEntries = [
        createMockCommissionEntry({ jobId: 'JOB001', status: 'pending' }),
        createMockCommissionEntry({
          id: 'comm-2',
          jobId: 'JOB001',
          status: 'matched',
        }),
        createMockCommissionEntry({
          id: 'comm-3',
          jobId: 'JOB001',
          status: 'approved',
        }),
      ];

      const matches = findCommissionMatches('JOB001', commissionEntries);

      expect(matches).toHaveLength(1);
      expect(matches[0].status).toBe('pending');
    });

    it('should return empty array for no matches', () => {
      const commissionEntries = [
        createMockCommissionEntry({ jobId: 'JOB002', status: 'pending' }),
      ];

      const matches = findCommissionMatches('JOB001', commissionEntries);

      expect(matches).toHaveLength(0);
    });

    it('should handle case-sensitive job IDs', () => {
      const commissionEntries = [
        createMockCommissionEntry({ jobId: 'job001', status: 'pending' }),
        createMockCommissionEntry({
          id: 'comm-2',
          jobId: 'JOB001',
          status: 'pending',
        }),
      ];

      const matches = findCommissionMatches('JOB001', commissionEntries);

      expect(matches).toHaveLength(1);
      expect(matches[0].jobId).toBe('JOB001');
    });

    it('should handle special characters in job IDs', () => {
      const commissionEntries = [
        createMockCommissionEntry({
          jobId: 'JOB-001_A',
          status: 'pending',
        }),
        createMockCommissionEntry({
          id: 'comm-2',
          jobId: 'JOB.001.B',
          status: 'pending',
        }),
      ];

      const matches1 = findCommissionMatches('JOB-001_A', commissionEntries);
      const matches2 = findCommissionMatches('JOB.001.B', commissionEntries);

      expect(matches1).toHaveLength(1);
      expect(matches1[0].jobId).toBe('JOB-001_A');
      expect(matches2).toHaveLength(1);
      expect(matches2[0].jobId).toBe('JOB.001.B');
    });

    it('should handle empty commission entries array', () => {
      const matches = findCommissionMatches('JOB001', []);
      expect(matches).toHaveLength(0);
    });

    it('should handle null/undefined job IDs gracefully', () => {
      const commissionEntries = [
        createMockCommissionEntry({ jobId: '', status: 'pending' }),
        createMockCommissionEntry({
          id: 'comm-2',
          jobId: 'JOB001',
          status: 'pending',
        }),
      ];

      const matches = findCommissionMatches('', commissionEntries);
      expect(matches).toHaveLength(1);
      expect(matches[0].jobId).toBe('');
    });
  });

  describe('calculateBookingAccuracy', () => {
    it('should calculate 100% accuracy for exact match', () => {
      expect(calculateBookingAccuracy(500, 500)).toBe(100);
      expect(calculateBookingAccuracy(1000, 1000)).toBe(100);
      expect(calculateBookingAccuracy(0, 0)).toBe(0); // Special case
    });

    it('should calculate accuracy for underestimates', () => {
      expect(calculateBookingAccuracy(500, 600)).toBeCloseTo(83.33, 2);
      expect(calculateBookingAccuracy(1000, 1200)).toBeCloseTo(83.33, 2);
      expect(calculateBookingAccuracy(100, 150)).toBeCloseTo(66.67, 2);
    });

    it('should calculate accuracy for overestimates', () => {
      expect(calculateBookingAccuracy(600, 500)).toBeCloseTo(83.33, 2);
      expect(calculateBookingAccuracy(1200, 1000)).toBeCloseTo(83.33, 2);
      expect(calculateBookingAccuracy(150, 100)).toBeCloseTo(66.67, 2);
    });

    it('should handle zero estimated revenue', () => {
      expect(calculateBookingAccuracy(0, 500)).toBe(0);
      expect(calculateBookingAccuracy(0, 1000)).toBe(0);
    });

    it('should handle zero actual revenue', () => {
      expect(calculateBookingAccuracy(500, 0)).toBe(0);
      expect(calculateBookingAccuracy(1000, 0)).toBe(0);
    });

    it('should handle very small differences', () => {
      expect(calculateBookingAccuracy(1000, 1001)).toBeCloseTo(99.9, 1);
      expect(calculateBookingAccuracy(1000, 999)).toBeCloseTo(99.9, 1);
    });

    it('should handle very large differences', () => {
      expect(calculateBookingAccuracy(100, 1000)).toBeCloseTo(10, 1);
      expect(calculateBookingAccuracy(1000, 100)).toBeCloseTo(10, 1);
    });

    it('should handle decimal values', () => {
      expect(calculateBookingAccuracy(123.45, 123.45)).toBe(100);
      expect(calculateBookingAccuracy(100.5, 110.5)).toBeCloseTo(90.95, 1);
    });

    it('should handle negative values (edge case)', () => {
      // While negative revenue shouldn't happen in practice, test robustness
      expect(calculateBookingAccuracy(-100, 100)).toBe(0);
      expect(calculateBookingAccuracy(100, -100)).toBe(0);
    });

    it('should handle very large numbers', () => {
      expect(calculateBookingAccuracy(1000000, 1100000)).toBeCloseTo(90.91, 2);
      expect(calculateBookingAccuracy(1100000, 1000000)).toBeCloseTo(90.91, 2);
    });
  });

  describe('calculateCommissionAmount', () => {
    it('should calculate commission correctly', () => {
      expect(calculateCommissionAmount(1000, 5)).toBe(50);
      expect(calculateCommissionAmount(2000, 10)).toBe(200);
      expect(calculateCommissionAmount(500, 2.5)).toBe(12.5);
    });

    it('should handle zero revenue', () => {
      expect(calculateCommissionAmount(0, 5)).toBe(0);
      expect(calculateCommissionAmount(0, 10)).toBe(0);
    });

    it('should handle zero commission rate', () => {
      expect(calculateCommissionAmount(1000, 0)).toBe(0);
      expect(calculateCommissionAmount(5000, 0)).toBe(0);
    });

    it('should handle decimal rates', () => {
      expect(calculateCommissionAmount(1000, 2.5)).toBe(25);
      expect(calculateCommissionAmount(1000, 7.75)).toBe(77.5);
      expect(calculateCommissionAmount(1000, 0.5)).toBe(5);
    });

    it('should handle decimal revenue', () => {
      expect(calculateCommissionAmount(1234.56, 5)).toBeCloseTo(61.73, 2);
      expect(calculateCommissionAmount(999.99, 10)).toBeCloseTo(100, 2);
    });

    it('should handle high commission rates', () => {
      expect(calculateCommissionAmount(1000, 15)).toBe(150);
      expect(calculateCommissionAmount(1000, 25)).toBe(250);
      expect(calculateCommissionAmount(1000, 100)).toBe(1000);
    });

    it('should handle very small amounts', () => {
      expect(calculateCommissionAmount(0.01, 5)).toBeCloseTo(0.0005, 4);
      expect(calculateCommissionAmount(1, 0.1)).toBeCloseTo(0.001, 3);
    });

    it('should handle very large amounts', () => {
      expect(calculateCommissionAmount(1000000, 5)).toBe(50000);
      expect(calculateCommissionAmount(10000000, 2.5)).toBe(250000);
    });

    it('should handle fractional percentages', () => {
      expect(calculateCommissionAmount(1000, 1.25)).toBe(12.5);
      expect(calculateCommissionAmount(1000, 3.33)).toBeCloseTo(33.3, 1);
    });
  });

  describe('matchCommissions', () => {
    let approvedLog: DailyLog;
    let commissionEntries: CommissionEntry[];

    beforeEach(() => {
      approvedLog = createMockDailyLog([
        createMockLogJob({ jobId: 'JOB001', revenue: 600 }),
        createMockLogJob({ id: 'job-2', jobId: 'JOB002', revenue: 800 }),
      ]);

      commissionEntries = [
        createMockCommissionEntry({ jobId: 'JOB001', estimatedRevenue: 500 }),
        createMockCommissionEntry({
          id: 'comm-2',
          jobId: 'JOB002',
          estimatedRevenue: 750,
          sales: createMockUser({ id: 'sales-2', fullName: 'Jane Smith' }),
        }),
      ];
    });

    it('should match single commission entries to jobs', () => {
      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);

      const match1 = result.matches.find((m) => m.logJob.jobId === 'JOB001');
      expect(match1).toBeDefined();
      expect(match1!.commissionEntry.jobId).toBe('JOB001');
      expect(match1!.accuracyPercentage).toBeCloseTo(83.33, 2);

      const match2 = result.matches.find((m) => m.logJob.jobId === 'JOB002');
      expect(match2).toBeDefined();
      expect(match2!.commissionEntry.jobId).toBe('JOB002');
      expect(match2!.accuracyPercentage).toBeCloseTo(93.75, 2);
    });

    it('should handle jobs with no commission entries', () => {
      approvedLog.jobs.push(
        createMockLogJob({
          id: 'job-3',
          jobId: 'JOB003',
          revenue: 400,
        })
      );

      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it('should detect conflicts with multiple commission entries', () => {
      commissionEntries.push(
        createMockCommissionEntry({
          id: 'comm-3',
          jobId: 'JOB001',
          estimatedRevenue: 550,
          sales: createMockUser({ id: 'sales-3', fullName: 'Bob Wilson' }),
        })
      );

      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(1); // Only JOB002 should match
      expect(result.conflicts).toHaveLength(1);
      expect(result.unmatched).toHaveLength(0);

      const conflict = result.conflicts[0];
      expect(conflict.jobId).toBe('JOB001');
      expect(conflict.commissionEntries).toHaveLength(2);
      expect(conflict.reason).toContain('Multiple commission entries found');
    });

    it('should identify unmatched commission entries', () => {
      commissionEntries.push(
        createMockCommissionEntry({
          id: 'comm-3',
          jobId: 'JOB999',
          estimatedRevenue: 300,
          sales: createMockUser({ id: 'sales-3', fullName: 'Bob Wilson' }),
        })
      );

      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(1);
      expect(result.unmatched[0].jobId).toBe('JOB999');
    });

    it('should handle duplicate job IDs in the same log', () => {
      approvedLog.jobs.push(
        createMockLogJob({
          id: 'job-3',
          jobId: 'JOB001', // Duplicate
          revenue: 700,
        })
      );

      const result = matchCommissions(approvedLog, commissionEntries);

      // Should only process JOB001 once
      expect(result.matches).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it('should handle empty commission entries', () => {
      const result = matchCommissions(approvedLog, []);

      expect(result.matches).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it('should handle empty log jobs', () => {
      const emptyLog = createMockDailyLog([]);

      const result = matchCommissions(emptyLog, commissionEntries);

      expect(result.matches).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(2);
    });

    it('should only match pending commission entries', () => {
      commissionEntries[0].status = 'matched';
      commissionEntries[1].status = 'approved';

      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it('should calculate accuracy correctly for all matches', () => {
      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(2);

      const match1 = result.matches.find((m) => m.logJob.jobId === 'JOB001');
      expect(match1!.accuracyPercentage).toBeCloseTo(83.33, 2);

      const match2 = result.matches.find((m) => m.logJob.jobId === 'JOB002');
      expect(match2!.accuracyPercentage).toBeCloseTo(93.75, 2);
    });

    it('should handle complex conflict scenarios', () => {
      // Add multiple conflicts
      commissionEntries.push(
        createMockCommissionEntry({
          id: 'comm-3',
          jobId: 'JOB001',
          estimatedRevenue: 550,
          sales: createMockUser({ id: 'sales-3' }),
        }),
        createMockCommissionEntry({
          id: 'comm-4',
          jobId: 'JOB001',
          estimatedRevenue: 580,
          sales: createMockUser({ id: 'sales-4' }),
        }),
        createMockCommissionEntry({
          id: 'comm-5',
          jobId: 'JOB002',
          estimatedRevenue: 780,
          sales: createMockUser({ id: 'sales-5' }),
        })
      );

      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(0); // No clean matches
      expect(result.conflicts).toHaveLength(2); // Both jobs have conflicts
      expect(result.unmatched).toHaveLength(0);

      const job001Conflict = result.conflicts.find((c) => c.jobId === 'JOB001');
      const job002Conflict = result.conflicts.find((c) => c.jobId === 'JOB002');

      expect(job001Conflict!.commissionEntries).toHaveLength(3);
      expect(job002Conflict!.commissionEntries).toHaveLength(2);
    });

    it('should preserve all match data correctly', () => {
      const result = matchCommissions(approvedLog, commissionEntries);

      const match = result.matches[0];
      expect(match.commissionEntry).toBeDefined();
      expect(match.logJob).toBeDefined();
      expect(match.dailyLog).toBe(approvedLog);
      expect(match.accuracyPercentage).toBeGreaterThan(0);
      expect(match.accuracyPercentage).toBeLessThanOrEqual(100);
    });
  });

  describe('processCommissionMatching', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should process commission matching successfully', async () => {
      const mockLogData = {
        id: 'log-1',
        captainId: 'captain-1',
        captain: {
          id: 'captain-1',
          fullName: 'Captain Test',
          email: 'captain@test.com',
          roles: ['captain'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdBy: {
          id: 'captain-1',
          fullName: 'Captain Test',
          email: 'captain@test.com',
          roles: ['captain'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        logDate: new Date('2024-12-01'),
        status: 'approved',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: 'manager-1',
        createdById: 'captain-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        jobs: [
          {
            id: 'job-1',
            logId: 'log-1',
            jobType: 'junk',
            jobId: 'JOB001',
            clientName: 'Test Client',
            revenue: 600,
            tips: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        hours: [],
      };

      const mockCommissionData = [
        {
          id: 'comm-1',
          salesId: 'sales-1',
          sales: {
            id: 'sales-1',
            fullName: 'Sales Person',
            email: 'sales@test.com',
            roles: ['sales'],
            commissionRate: 5,
            junkBonusGoal: 0.14,
            moveBonusGoal: 0.24,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          jobId: 'JOB001',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 500,
          actualRevenue: null,
          commissionAmount: null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLogData);
      mockPrisma.commissionEntry.findMany.mockResolvedValue(mockCommissionData);
      mockPrisma.commissionEntry.update.mockResolvedValue({});

      const result = await processCommissionMatching('log-1');

      expect(result.matches).toHaveLength(1);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);

      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: {
          status: 'matched',
          actualRevenue: 600,
          commissionAmount: 30, // 600 * 0.05
          matchedLogId: 'log-1',
        },
      });
    });

    it('should handle log not found', async () => {
      mockPrisma.dailyLog.findUnique.mockResolvedValue(null);

      await expect(processCommissionMatching('invalid-log')).rejects.toThrow(
        'Approved log not found'
      );
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.dailyLog.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await expect(processCommissionMatching('log-1')).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle commission entries with null commission rate', async () => {
      const mockLogData = {
        id: 'log-1',
        captainId: 'captain-1',
        captain: {
          id: 'captain-1',
          fullName: 'Captain Test',
          email: 'captain@test.com',
          roles: ['captain'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdBy: {
          id: 'captain-1',
          fullName: 'Captain Test',
          email: 'captain@test.com',
          roles: ['captain'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        jobs: [
          {
            id: 'job-1',
            logId: 'log-1',
            jobType: 'junk',
            jobId: 'JOB001',
            clientName: 'Test Client',
            revenue: 600,
            tips: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        hours: [],
        logDate: new Date(),
        status: 'approved',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: 'manager-1',
        createdById: 'captain-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCommissionData = [
        {
          id: 'comm-1',
          salesId: 'sales-1',
          sales: {
            id: 'sales-1',
            fullName: 'Sales Person',
            email: 'sales@test.com',
            roles: ['sales'],
            commissionRate: null,
            junkBonusGoal: 0.14,
            moveBonusGoal: 0.24,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          jobId: 'JOB001',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 500,
          actualRevenue: null,
          commissionAmount: null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLogData);
      mockPrisma.commissionEntry.findMany.mockResolvedValue(mockCommissionData);
      mockPrisma.commissionEntry.update.mockResolvedValue({});

      const result = await processCommissionMatching('log-1');

      expect(result.matches).toHaveLength(1);
      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: {
          status: 'matched',
          actualRevenue: 600,
          commissionAmount: 0, // null rate = 0 commission
          matchedLogId: 'log-1',
        },
      });
    });

    it('should process multiple matches correctly', async () => {
      const mockLogData = {
        id: 'log-1',
        captainId: 'captain-1',
        captain: {
          id: 'captain-1',
          fullName: 'Captain Test',
          email: 'captain@test.com',
          roles: ['captain'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        createdBy: {
          id: 'captain-1',
          fullName: 'Captain Test',
          email: 'captain@test.com',
          roles: ['captain'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        jobs: [
          {
            id: 'job-1',
            logId: 'log-1',
            jobType: 'junk',
            jobId: 'JOB001',
            clientName: 'Test Client 1',
            revenue: 600,
            tips: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'job-2',
            logId: 'log-1',
            jobType: 'move',
            jobId: 'JOB002',
            clientName: 'Test Client 2',
            revenue: 800,
            tips: 75,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        hours: [],
        logDate: new Date(),
        status: 'approved',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: 'manager-1',
        createdById: 'captain-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCommissionData = [
        {
          id: 'comm-1',
          salesId: 'sales-1',
          sales: {
            id: 'sales-1',
            fullName: 'Sales Person 1',
            email: 'sales1@test.com',
            roles: ['sales'],
            commissionRate: 5,
            junkBonusGoal: 0.14,
            moveBonusGoal: 0.24,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          jobId: 'JOB001',
          clientName: 'Test Client 1',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 500,
          actualRevenue: null,
          commissionAmount: null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'comm-2',
          salesId: 'sales-2',
          sales: {
            id: 'sales-2',
            fullName: 'Sales Person 2',
            email: 'sales2@test.com',
            roles: ['sales'],
            commissionRate: 7,
            junkBonusGoal: 0.14,
            moveBonusGoal: 0.24,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          jobId: 'JOB002',
          clientName: 'Test Client 2',
          jobType: 'move',
          targetDate: new Date(),
          estimatedRevenue: 750,
          actualRevenue: null,
          commissionAmount: null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.dailyLog.findUnique.mockResolvedValue(mockLogData);
      mockPrisma.commissionEntry.findMany.mockResolvedValue(mockCommissionData);
      mockPrisma.commissionEntry.update.mockResolvedValue({});

      const result = await processCommissionMatching('log-1');

      expect(result.matches).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);

      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: {
          status: 'matched',
          actualRevenue: 600,
          commissionAmount: 30, // 600 * 0.05
          matchedLogId: 'log-1',
        },
      });
      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'comm-2' },
        data: {
          status: 'matched',
          actualRevenue: 800,
          commissionAmount: expect.closeTo(56, 2), // 800 * 0.07
          matchedLogId: 'log-1',
        },
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very large revenue amounts', () => {
      const commission = calculateCommissionAmount(10000000, 5);
      expect(commission).toBe(500000);

      const accuracy = calculateBookingAccuracy(10000000, 10500000);
      expect(accuracy).toBeCloseTo(95.24, 2);
    });

    it('should handle very small revenue amounts', () => {
      const commission = calculateCommissionAmount(0.01, 5);
      expect(commission).toBeCloseTo(0.0005, 4);

      const accuracy = calculateBookingAccuracy(0.01, 0.011);
      expect(accuracy).toBeCloseTo(90.91, 2);
    });

    it('should handle fractional commission rates', () => {
      expect(calculateCommissionAmount(1000, 2.75)).toBe(27.5);
      expect(calculateCommissionAmount(1000, 0.25)).toBe(2.5);
    });

    it('should handle job IDs with various formats', () => {
      const testJobIds = [
        'JOB001',
        'job-001',
        'JOB_001_A',
        'JOB.001.B',
        '1234567890',
        'ABC123XYZ',
        'job with spaces', // Edge case
      ];

      testJobIds.forEach((jobId) => {
        const commissionEntries = [
          createMockCommissionEntry({ jobId, status: 'pending' }),
        ];

        const matches = findCommissionMatches(jobId, commissionEntries);
        expect(matches).toHaveLength(1);
        expect(matches[0].jobId).toBe(jobId);
      });
    });

    it('should handle commission entries with missing sales data', () => {
      const commissionEntry = createMockCommissionEntry({
        sales: createMockUser({ commissionRate: undefined }),
      });

      const approvedLog = createMockDailyLog([
        createMockLogJob({ jobId: 'JOB001', revenue: 600 }),
      ]);

      const result = matchCommissions(approvedLog, [commissionEntry]);

      expect(result.matches).toHaveLength(1);
      expect(
        result.matches[0].commissionEntry.sales.commissionRate
      ).toBeUndefined();
    });

    it('should handle logs with jobs but no commission entries', () => {
      const approvedLog = createMockDailyLog([
        createMockLogJob({ jobId: 'JOB001', revenue: 600 }),
        createMockLogJob({ jobId: 'JOB002', revenue: 800 }),
        createMockLogJob({ jobId: 'JOB003', revenue: 400 }),
      ]);

      const result = matchCommissions(approvedLog, []);

      expect(result.matches).toHaveLength(0);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it('should handle commission entries with zero estimated revenue', () => {
      const commissionEntry = createMockCommissionEntry({
        estimatedRevenue: 0,
      });

      const approvedLog = createMockDailyLog([
        createMockLogJob({ jobId: 'JOB001', revenue: 600 }),
      ]);

      const result = matchCommissions(approvedLog, [commissionEntry]);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].accuracyPercentage).toBe(0);
    });

    it('should handle logs with zero revenue jobs', () => {
      const commissionEntry = createMockCommissionEntry({
        estimatedRevenue: 500,
      });

      const approvedLog = createMockDailyLog([
        createMockLogJob({ jobId: 'JOB001', revenue: 0 }),
      ]);

      const result = matchCommissions(approvedLog, [commissionEntry]);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].accuracyPercentage).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of commission entries efficiently', () => {
      const startTime = Date.now();

      // Create 1000 commission entries
      const largeCommissionList: CommissionEntry[] = [];
      for (let i = 0; i < 1000; i++) {
        largeCommissionList.push(
          createMockCommissionEntry({
            id: `comm-${i}`,
            jobId: `JOB${i.toString().padStart(3, '0')}`,
          })
        );
      }

      // Create log with 100 jobs
      const largeJobList: LogJob[] = [];
      for (let i = 0; i < 100; i++) {
        largeJobList.push(
          createMockLogJob({
            id: `job-${i}`,
            jobId: `JOB${i.toString().padStart(3, '0')}`,
          })
        );
      }

      const approvedLog = createMockDailyLog(largeJobList);
      const result = matchCommissions(approvedLog, largeCommissionList);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.matches).toHaveLength(100);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(900);
      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle complex matching scenarios efficiently', () => {
      const startTime = Date.now();

      // Create scenario with many conflicts
      const commissionEntries: CommissionEntry[] = [];
      const jobs: LogJob[] = [];

      // Create 50 jobs, each with 3 commission entries (conflicts)
      for (let i = 0; i < 50; i++) {
        const jobId = `JOB${i.toString().padStart(3, '0')}`;

        jobs.push(
          createMockLogJob({
            id: `job-${i}`,
            jobId,
            revenue: 1000 + i * 10,
          })
        );

        // Add 3 commission entries for each job (creating conflicts)
        for (let j = 0; j < 3; j++) {
          commissionEntries.push(
            createMockCommissionEntry({
              id: `comm-${i}-${j}`,
              jobId,
              estimatedRevenue: 900 + i * 10 + j * 5,
              sales: createMockUser({ id: `sales-${i}-${j}` }),
            })
          );
        }
      }

      const approvedLog = createMockDailyLog(jobs);
      const result = matchCommissions(approvedLog, commissionEntries);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(result.matches).toHaveLength(0); // All should be conflicts
      expect(result.conflicts).toHaveLength(50); // One conflict per job
      expect(result.unmatched).toHaveLength(0);
      expect(executionTime).toBeLessThan(1000); // Should still be fast
    });
  });
});
