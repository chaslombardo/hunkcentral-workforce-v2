import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  handleLogApprovalCommissionMatching,
  resolveCommissionConflict,
  getCommissionConflicts,
  getCommissionMatchingStats,
  type MatchingNotification,
} from '@/lib/commissionMatchingService';

// Mock the dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    dailyLog: {
      findUnique: vi.fn(),
    },
    commissionEntry: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    logJob: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/commissionMatcher', () => ({
  processCommissionMatching: vi.fn(),
}));

vi.mock('@/lib/auditLogger', () => ({
  logCommissionChange: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { processCommissionMatching } from '@/lib/commissionMatcher';
import { logCommissionChange } from '@/lib/auditLogger';

const mockPrisma = prisma as any;
const mockProcessCommissionMatching = processCommissionMatching as any;
const mockLogCommissionChange = logCommissionChange as any;

describe('Commission Matching Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('handleLogApprovalCommissionMatching', () => {
    const mockMatchResult = {
      matches: [
        {
          commissionEntry: {
            id: 'comm-1',
            jobId: 'JOB-001',
            estimatedRevenue: 500,
            sales: {
              id: 'user-1',
              fullName: 'John Doe',
              commissionRate: 5.0,
            },
          },
          logJob: {
            id: 'job-1',
            jobId: 'JOB-001',
            revenue: 600,
          },
          dailyLog: {
            id: 'log-1',
          },
          accuracyPercentage: 83.33,
        },
      ],
      conflicts: [
        {
          jobId: 'JOB-002',
          commissionEntries: [
            {
              id: 'comm-2',
              sales: { fullName: 'Jane Smith' },
              estimatedRevenue: 400,
              targetDate: new Date(),
            },
            {
              id: 'comm-3',
              sales: { fullName: 'Bob Wilson' },
              estimatedRevenue: 450,
              targetDate: new Date(),
            },
          ],
          logJob: {
            jobId: 'JOB-002',
            revenue: 500,
          },
          reason: 'Multiple commission entries found',
        },
      ],
      unmatched: [],
    };

    it('should handle successful commission matching', async () => {
      mockProcessCommissionMatching.mockResolvedValue(mockMatchResult);

      const result = await handleLogApprovalCommissionMatching('log-1', 'user-manager');

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(3); // 1 match + 1 conflict + 1 summary
      
      // Check success notification
      const successNotifications = result.notifications.filter(n => n.type === 'success');
      expect(successNotifications).toHaveLength(2); // 1 match + 1 summary
      expect(successNotifications[0].title).toBe('Commission Matched');
      expect(successNotifications[0].message).toContain('JOB-001');
      expect(successNotifications[0].message).toContain('John Doe');
      expect(successNotifications[0].message).toContain('83.3%');

      // Check conflict notification
      const conflictNotifications = result.notifications.filter(n => n.type === 'conflict');
      expect(conflictNotifications).toHaveLength(1);
      expect(conflictNotifications[0].title).toBe('Commission Conflict Detected');
      expect(conflictNotifications[0].message).toContain('JOB-002');

      // Check summary notification
      expect(successNotifications[1].title).toBe('Commission Matching Complete');
      expect(successNotifications[1].message).toContain('1 commission(s) matched');

      expect(mockLogCommissionChange).toHaveBeenCalledWith(
        'match',
        'comm-1',
        'user-manager',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle no matches', async () => {
      mockProcessCommissionMatching.mockResolvedValue({
        matches: [],
        conflicts: [],
        unmatched: [],
      });

      const result = await handleLogApprovalCommissionMatching('log-1', 'user-manager');

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(0);
      expect(mockLogCommissionChange).not.toHaveBeenCalled();
    });

    it('should handle processing errors', async () => {
      mockProcessCommissionMatching.mockRejectedValue(new Error('Database error'));

      const result = await handleLogApprovalCommissionMatching('log-1', 'user-manager');

      expect(result.success).toBe(false);
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].type).toBe('error');
      expect(result.notifications[0].title).toBe('Commission Matching Failed');
      expect(result.error).toBe('Database error');
    });

    it('should calculate commission amounts correctly', async () => {
      const matchWithCommission = {
        ...mockMatchResult,
        matches: [
          {
            ...mockMatchResult.matches[0],
            logJob: { ...mockMatchResult.matches[0].logJob, revenue: 1000 },
            commissionEntry: {
              ...mockMatchResult.matches[0].commissionEntry,
              sales: {
                ...mockMatchResult.matches[0].commissionEntry.sales,
                commissionRate: 10.0,
              },
            },
          },
        ],
        conflicts: [],
      };

      mockProcessCommissionMatching.mockResolvedValue(matchWithCommission);

      const result = await handleLogApprovalCommissionMatching('log-1', 'user-manager');

      expect(result.success).toBe(true);
      const successNotification = result.notifications.find(n => n.type === 'success' && n.title === 'Commission Matched');
      expect(successNotification?.data.commissionAmount).toBe(100); // 1000 * 0.10
    });

    it('should handle zero commission rate', async () => {
      const matchWithZeroCommission = {
        ...mockMatchResult,
        matches: [
          {
            ...mockMatchResult.matches[0],
            commissionEntry: {
              ...mockMatchResult.matches[0].commissionEntry,
              sales: {
                ...mockMatchResult.matches[0].commissionEntry.sales,
                commissionRate: 0,
              },
            },
          },
        ],
        conflicts: [],
      };

      mockProcessCommissionMatching.mockResolvedValue(matchWithZeroCommission);

      const result = await handleLogApprovalCommissionMatching('log-1', 'user-manager');

      expect(result.success).toBe(true);
      const successNotification = result.notifications.find(n => n.type === 'success' && n.title === 'Commission Matched');
      expect(successNotification?.data.commissionAmount).toBe(0);
    });
  });

  describe('resolveCommissionConflict', () => {
    const mockCommissionEntry = {
      id: 'comm-1',
      jobId: 'JOB-001',
      sales: {
        id: 'user-1',
        fullName: 'John Doe',
        commissionRate: 5.0,
      },
    };

    const mockLogJob = {
      jobId: 'JOB-001',
      revenue: 600,
      log: {
        id: 'log-1',
        status: 'approved',
      },
    };

    const mockConflictingEntries = [
      mockCommissionEntry,
      {
        id: 'comm-2',
        jobId: 'JOB-001',
        sales: {
          id: 'user-2',
          fullName: 'Jane Smith',
        },
      },
    ];

    beforeEach(() => {
      mockPrisma.commissionEntry.findUnique.mockResolvedValue(mockCommissionEntry);
      mockPrisma.logJob.findFirst.mockResolvedValue(mockLogJob);
      mockPrisma.commissionEntry.findMany.mockResolvedValue(mockConflictingEntries);
      mockPrisma.commissionEntry.update.mockResolvedValue(mockCommissionEntry);
      mockPrisma.commissionEntry.delete.mockResolvedValue({});
    });

    it('should resolve conflict successfully', async () => {
      const result = await resolveCommissionConflict('JOB-001', 'comm-1', 'user-manager');

      expect(result.success).toBe(true);
      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].type).toBe('success');
      expect(result.notifications[0].title).toBe('Conflict Resolved');
      expect(result.notifications[0].message).toContain('JOB-001');
      expect(result.notifications[0].message).toContain('John Doe');

      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: {
          status: 'matched',
          actualRevenue: 600,
          commissionAmount: 30, // 600 * 0.05
          matchedLogId: 'log-1',
        },
      });

      expect(mockPrisma.commissionEntry.delete).toHaveBeenCalledWith({
        where: { id: 'comm-2' },
      });

      expect(mockLogCommissionChange).toHaveBeenCalledTimes(2); // 1 match + 1 delete
    });

    it('should handle commission entry not found', async () => {
      mockPrisma.commissionEntry.findUnique.mockResolvedValue(null);

      const result = await resolveCommissionConflict('JOB-001', 'comm-1', 'user-manager');

      expect(result.success).toBe(false);
      expect(result.notifications[0].type).toBe('error');
      expect(result.error).toBe('Selected commission entry not found');
    });

    it('should handle log job not found', async () => {
      mockPrisma.logJob.findFirst.mockResolvedValue(null);

      const result = await resolveCommissionConflict('JOB-001', 'comm-1', 'user-manager');

      expect(result.success).toBe(false);
      expect(result.notifications[0].type).toBe('error');
      expect(result.error).toBe('Approved log job not found');
    });

    it('should handle unapproved log', async () => {
      mockPrisma.logJob.findFirst.mockResolvedValue({
        ...mockLogJob,
        log: { ...mockLogJob.log, status: 'submitted' },
      });

      const result = await resolveCommissionConflict('JOB-001', 'comm-1', 'user-manager');

      expect(result.success).toBe(false);
      expect(result.notifications[0].type).toBe('error');
      expect(result.error).toBe('Approved log job not found');
    });

    it('should calculate commission correctly with different rates', async () => {
      const highRateEntry = {
        ...mockCommissionEntry,
        sales: {
          ...mockCommissionEntry.sales,
          commissionRate: 15.0,
        },
      };
      mockPrisma.commissionEntry.findUnique.mockResolvedValue(highRateEntry);

      const result = await resolveCommissionConflict('JOB-001', 'comm-1', 'user-manager');

      expect(result.success).toBe(true);
      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: {
          status: 'matched',
          actualRevenue: 600,
          commissionAmount: 90, // 600 * 0.15
          matchedLogId: 'log-1',
        },
      });
    });
  });

  describe('getCommissionConflicts', () => {
    it('should return conflicts correctly', async () => {
      const mockGroupBy = [
        { jobId: 'JOB-001' },
        { jobId: 'JOB-002' },
      ];

      const mockCommissionEntries = [
        {
          id: 'comm-1',
          jobId: 'JOB-001',
          sales: { id: 'user-1', fullName: 'John Doe', commissionRate: 5.0 },
        },
        {
          id: 'comm-2',
          jobId: 'JOB-001',
          sales: { id: 'user-2', fullName: 'Jane Smith', commissionRate: 6.0 },
        },
      ];

      const mockLogJob = {
        jobId: 'JOB-001',
        revenue: 500,
        log: {
          id: 'log-1',
          status: 'approved',
          logDate: new Date(),
          captain: { fullName: 'Captain America' },
        },
      };

      mockPrisma.commissionEntry.groupBy.mockResolvedValue(mockGroupBy);
      mockPrisma.commissionEntry.findMany.mockResolvedValue(mockCommissionEntries);
      mockPrisma.logJob.findFirst
        .mockResolvedValueOnce(mockLogJob)
        .mockResolvedValueOnce(null); // Second job has no approved log

      const result = await getCommissionConflicts();

      expect(result.success).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].jobId).toBe('JOB-001');
      expect(result.conflicts[0].commissionEntries).toHaveLength(2);
    });

    it('should handle database errors', async () => {
      mockPrisma.commissionEntry.groupBy.mockRejectedValue(new Error('Database error'));

      const result = await getCommissionConflicts();

      expect(result.success).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.error).toBe('Database error');
    });
  });

  describe('getCommissionMatchingStats', () => {
    it('should calculate stats correctly', async () => {
      const mockMatchedEntries = [
        {
          estimatedRevenue: 500,
          actualRevenue: 600,
          commissionAmount: 30,
        },
        {
          estimatedRevenue: 800,
          actualRevenue: 750,
          commissionAmount: 37.5,
        },
      ];

      mockPrisma.commissionEntry.count.mockResolvedValue(5);
      mockPrisma.commissionEntry.findMany.mockResolvedValue(mockMatchedEntries);

      // Mock getCommissionConflicts
      const mockGetConflicts = vi.fn().mockResolvedValue({
        success: true,
        conflicts: [{ jobId: 'JOB-001' }],
      });
      
      // Replace the import with our mock
      vi.doMock('@/lib/commissionMatchingService', async () => {
        const actual = await vi.importActual('@/lib/commissionMatchingService');
        return {
          ...actual,
          getCommissionConflicts: mockGetConflicts,
        };
      });

      const result = await getCommissionMatchingStats();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats!.totalPending).toBe(5);
      expect(result.stats!.totalMatched).toBe(2);
      expect(result.stats!.totalCommissionValue).toBe(67.5);
      
      // Average accuracy: ((83.33 + 93.75) / 2) = 88.54
      expect(result.stats!.averageAccuracy).toBeCloseTo(88.54, 1);
    });

    it('should handle empty results', async () => {
      mockPrisma.commissionEntry.count.mockResolvedValue(0);
      mockPrisma.commissionEntry.findMany.mockResolvedValue([]);

      const result = await getCommissionMatchingStats();

      expect(result.success).toBe(true);
      expect(result.stats!.totalPending).toBe(0);
      expect(result.stats!.totalMatched).toBe(0);
      expect(result.stats!.averageAccuracy).toBe(0);
      expect(result.stats!.totalCommissionValue).toBe(0);
    });

    it('should handle database errors', async () => {
      mockPrisma.commissionEntry.count.mockRejectedValue(new Error('Database error'));

      const result = await getCommissionMatchingStats();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});