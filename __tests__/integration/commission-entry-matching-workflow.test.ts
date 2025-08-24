import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommissionEntrySchema } from '@/lib/validations';
import {
  findCommissionMatches,
  matchCommissions,
  processCommissionMatching,
  calculateBookingAccuracy,
  calculateCommissionAmount,
} from '@/lib/commissionMatcher';
import type { User, DailyLog, LogJob, CommissionEntry } from '@/types';

// Mock Prisma
const mockPrisma = {
  commissionEntry: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
  },
  dailyLog: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
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
  commissionRate: 5,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockLog = (overrides: Partial<DailyLog> = {}): DailyLog => ({
  id: 'log-1',
  captainId: 'captain-1',
  captain: createMockUser({ id: 'captain-1', roles: ['captain'] }),
  logDate: new Date('2024-01-15'),
  status: 'approved',
  submittedAt: new Date('2024-01-15T10:00:00Z'),
  approvedAt: new Date('2024-01-15T12:00:00Z'),
  approvedById: 'manager-1',
  createdById: 'captain-1',
  createdBy: createMockUser({ id: 'captain-1', roles: ['captain'] }),
  createdAt: new Date('2024-01-15T08:00:00Z'),
  updatedAt: new Date('2024-01-15T12:00:00Z'),
  jobs: [],
  hours: [],
  ...overrides,
});

const createMockJob = (overrides: Partial<LogJob> = {}): LogJob => ({
  id: 'job-1',
  logId: 'log-1',
  log: createMockLog(),
  jobType: 'junk',
  jobId: 'JOB123456',
  clientName: 'Test Client',
  revenue: 1000,
  tips: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockCommission = (
  overrides: Partial<CommissionEntry> = {}
): CommissionEntry => ({
  id: 'commission-1',
  salesId: 'sales-1',
  sales: createMockUser({ id: 'sales-1', roles: ['sales'], commissionRate: 5 }),
  jobId: 'JOB123456',
  clientName: 'Test Client',
  jobType: 'junk',
  targetDate: new Date('2024-01-15'),
  estimatedRevenue: 900,
  actualRevenue: null,
  commissionAmount: null,
  status: 'pending',
  matchedLogId: null,
  matchedLog: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Commission Entry and Matching Workflow - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Commission Entry Creation and Validation', () => {
    it('should validate and create commission entry successfully', () => {
      const validCommissionData = {
        salesId: 'sales-1',
        jobId: '  1234567  ', // With whitespace
        clientName: 'Test Client Company',
        jobType: 'junk' as const,
        targetDate: new Date('2024-12-31'),
        estimatedRevenue: 1250.5,
      };

      // Validate with schema
      const validatedData = CommissionEntrySchema.parse(validCommissionData);

      expect(validatedData.jobId).toBe('1234567'); // Trimmed
      expect(validatedData.estimatedRevenue).toBe(1250.5);
      expect(validatedData.jobType).toBe('junk');
      expect(validatedData.clientName).toBe('Test Client Company');
    });

    it('should reject invalid commission entry data', () => {
      const invalidData = {
        salesId: '', // Empty
        jobId: '12345', // Too short
        clientName: 'A'.repeat(101), // Too long
        jobType: 'invalid',
        targetDate: new Date(),
        estimatedRevenue: 0, // Too low
      };

      expect(() => CommissionEntrySchema.parse(invalidData)).toThrow();
    });

    it('should handle edge cases in job ID validation', () => {
      const testCases = [
        { jobId: '1234567', valid: true },
        { jobId: '1234567890', valid: true },
        { jobId: '123456', valid: false }, // Too short
        { jobId: '12345678901', valid: false }, // Too long
        { jobId: 'ABC1234567', valid: false }, // Contains letters
        { jobId: '123-456-789', valid: false }, // Contains special chars
      ];

      testCases.forEach(({ jobId, valid }) => {
        const data = {
          salesId: 'sales-1',
          jobId,
          clientName: 'Test Client',
          jobType: 'junk' as const,
          targetDate: new Date(),
          estimatedRevenue: 1000,
        };

        if (valid) {
          expect(() => CommissionEntrySchema.parse(data)).not.toThrow();
        } else {
          expect(() => CommissionEntrySchema.parse(data)).toThrow();
        }
      });
    });
  });

  describe('Commission Matching Process', () => {
    it('should handle complete commission matching workflow', async () => {
      // Step 1: Sales person creates commission entry
      const salesPerson = createMockUser({
        id: 'sales-1',
        fullName: 'John Sales',
        commissionRate: 6,
      });

      const commissionEntry = createMockCommission({
        salesId: 'sales-1',
        jobId: 'JOB123456',
        clientName: 'ABC Company',
        estimatedRevenue: 1200,
        status: 'pending',
      });

      // Step 2: Captain completes job and submits log
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
      });

      const completedJob = createMockJob({
        jobId: 'JOB123456',
        clientName: 'ABC Company',
        revenue: 1350, // Actual revenue higher than estimate
        tips: 150,
      });

      const approvedLog = createMockLog({
        captain,
        status: 'approved',
        approvedAt: new Date('2024-01-15T14:00:00Z'),
        jobs: [completedJob],
      });

      // Step 3: Process commission matching
      const matchResult = matchCommissions(approvedLog, [commissionEntry]);

      expect(matchResult.matches).toHaveLength(1);
      expect(matchResult.conflicts).toHaveLength(0);
      expect(matchResult.unmatched).toHaveLength(0);

      const match = matchResult.matches[0];
      expect(match.commissionEntry.jobId).toBe('JOB123456');
      expect(match.logJob.revenue).toBe(1350);

      // Calculate booking accuracy: 1200 vs 1350
      const expectedAccuracy = calculateBookingAccuracy(1200, 1350);
      expect(match.accuracyPercentage).toBeCloseTo(expectedAccuracy, 2);

      // Step 4: Calculate commission amount
      const commissionAmount = calculateCommissionAmount(1350, 6);
      expect(commissionAmount).toBe(81); // 1350 * 0.06
    });

    it('should handle multiple sales people booking different jobs', async () => {
      const salesPerson1 = createMockUser({
        id: 'sales-1',
        commissionRate: 5,
      });

      const salesPerson2 = createMockUser({
        id: 'sales-2',
        commissionRate: 7,
      });

      const commissionEntries = [
        createMockCommission({
          id: 'comm-1',
          salesId: 'sales-1',
          jobId: 'JOB001',
          estimatedRevenue: 800,
        }),
        createMockCommission({
          id: 'comm-2',
          salesId: 'sales-2',
          jobId: 'JOB002',
          estimatedRevenue: 1200,
        }),
        createMockCommission({
          id: 'comm-3',
          salesId: 'sales-1',
          jobId: 'JOB003',
          estimatedRevenue: 600,
        }),
      ];

      const approvedLog = createMockLog({
        jobs: [
          createMockJob({
            id: 'job-1',
            jobId: 'JOB001',
            revenue: 850,
          }),
          createMockJob({
            id: 'job-2',
            jobId: 'JOB002',
            revenue: 1100,
          }),
          // JOB003 not completed yet
        ],
      });

      const matchResult = matchCommissions(approvedLog, commissionEntries);

      expect(matchResult.matches).toHaveLength(2);
      expect(matchResult.conflicts).toHaveLength(0);
      expect(matchResult.unmatched).toHaveLength(1);

      // Verify matches
      const job001Match = matchResult.matches.find(
        (m) => m.logJob.jobId === 'JOB001'
      );
      const job002Match = matchResult.matches.find(
        (m) => m.logJob.jobId === 'JOB002'
      );

      expect(job001Match?.commissionEntry.salesId).toBe('sales-1');
      expect(job002Match?.commissionEntry.salesId).toBe('sales-2');

      // Verify unmatched
      expect(matchResult.unmatched[0].jobId).toBe('JOB003');
    });

    it('should handle commission conflicts correctly', async () => {
      // Two sales people book the same job
      const commissionEntries = [
        createMockCommission({
          id: 'comm-1',
          salesId: 'sales-1',
          jobId: 'JOB123456',
          estimatedRevenue: 900,
        }),
        createMockCommission({
          id: 'comm-2',
          salesId: 'sales-2',
          jobId: 'JOB123456',
          estimatedRevenue: 950,
        }),
      ];

      const approvedLog = createMockLog({
        jobs: [
          createMockJob({
            jobId: 'JOB123456',
            revenue: 1000,
          }),
        ],
      });

      const matchResult = matchCommissions(approvedLog, commissionEntries);

      expect(matchResult.matches).toHaveLength(0);
      expect(matchResult.conflicts).toHaveLength(1);
      expect(matchResult.unmatched).toHaveLength(0);

      const conflict = matchResult.conflicts[0];
      expect(conflict.jobId).toBe('JOB123456');
      expect(conflict.commissionEntries).toHaveLength(2);
      expect(conflict.reason).toContain('Multiple commission entries found');

      // Both sales people should be in the conflict
      const salesIds = conflict.commissionEntries.map((e) => e.salesId);
      expect(salesIds).toContain('sales-1');
      expect(salesIds).toContain('sales-2');
    });

    it('should process commission matching with database integration', async () => {
      // Mock database responses
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
            jobId: 'JOB123456',
            clientName: 'Test Client',
            revenue: 1200,
            tips: 120,
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
            commissionRate: 8,
            junkBonusGoal: 0.14,
            moveBonusGoal: 0.24,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          jobId: 'JOB123456',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 1000,
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

      // Process commission matching
      const result = await processCommissionMatching('log-1');

      expect(result.matches).toHaveLength(1);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);

      // Verify database update was called
      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'comm-1' },
        data: {
          status: 'matched',
          actualRevenue: 1200,
          commissionAmount: 96, // 1200 * 0.08
          matchedLogId: 'log-1',
        },
      });
    });
  });

  describe('Commission Accuracy and Performance Tracking', () => {
    it('should calculate booking accuracy correctly for various scenarios', () => {
      const testCases = [
        { estimated: 1000, actual: 1000, expectedAccuracy: 100 },
        { estimated: 1000, actual: 1100, expectedAccuracy: 90.91 },
        { estimated: 1000, actual: 900, expectedAccuracy: 90 },
        { estimated: 500, actual: 750, expectedAccuracy: 66.67 },
        { estimated: 1500, actual: 1000, expectedAccuracy: 66.67 },
        { estimated: 0, actual: 1000, expectedAccuracy: 0 },
        { estimated: 1000, actual: 0, expectedAccuracy: 0 },
      ];

      testCases.forEach(({ estimated, actual, expectedAccuracy }) => {
        const accuracy = calculateBookingAccuracy(estimated, actual);
        expect(accuracy).toBeCloseTo(expectedAccuracy, 1);
      });
    });

    it('should track sales person performance over multiple bookings', () => {
      const salesPerson = createMockUser({
        id: 'sales-1',
        commissionRate: 6,
      });

      // Multiple commission entries with varying accuracy
      const commissionEntries = [
        createMockCommission({
          id: 'comm-1',
          salesId: 'sales-1',
          jobId: 'JOB001',
          estimatedRevenue: 1000,
        }),
        createMockCommission({
          id: 'comm-2',
          salesId: 'sales-1',
          jobId: 'JOB002',
          estimatedRevenue: 800,
        }),
        createMockCommission({
          id: 'comm-3',
          salesId: 'sales-1',
          jobId: 'JOB003',
          estimatedRevenue: 1200,
        }),
      ];

      const approvedLogs = [
        createMockLog({
          id: 'log-1',
          jobs: [
            createMockJob({
              jobId: 'JOB001',
              revenue: 1050, // 95.24% accuracy
            }),
          ],
        }),
        createMockLog({
          id: 'log-2',
          jobs: [
            createMockJob({
              jobId: 'JOB002',
              revenue: 750, // 93.75% accuracy
            }),
          ],
        }),
        createMockLog({
          id: 'log-3',
          jobs: [
            createMockJob({
              jobId: 'JOB003',
              revenue: 1100, // 91.67% accuracy
            }),
          ],
        }),
      ];

      // Process each log
      const allMatches: any[] = [];
      approvedLogs.forEach((log) => {
        const matchResult = matchCommissions(log, commissionEntries);
        allMatches.push(...matchResult.matches);
      });

      expect(allMatches).toHaveLength(3);

      // Calculate average accuracy
      const totalAccuracy = allMatches.reduce(
        (sum, match) => sum + match.accuracyPercentage,
        0
      );
      const averageAccuracy = totalAccuracy / allMatches.length;

      expect(averageAccuracy).toBeCloseTo(93.55, 1); // Average of the three accuracies

      // Calculate total commission
      const totalCommission = allMatches.reduce((sum, match) => {
        return sum + calculateCommissionAmount(match.logJob.revenue, 6);
      }, 0);

      expect(totalCommission).toBe(174); // (1050 + 750 + 1100) * 0.06
    });

    it('should handle commission rate variations', () => {
      const testRates = [0, 2.5, 5, 7.5, 10, 15];
      const revenue = 1000;

      testRates.forEach((rate) => {
        const commission = calculateCommissionAmount(revenue, rate);
        expect(commission).toBe(revenue * (rate / 100));
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle commission entries with zero estimated revenue', () => {
      const commissionEntry = createMockCommission({
        estimatedRevenue: 0,
      });

      const approvedLog = createMockLog({
        jobs: [
          createMockJob({
            jobId: 'JOB123456',
            revenue: 1000,
          }),
        ],
      });

      const matchResult = matchCommissions(approvedLog, [commissionEntry]);

      expect(matchResult.matches).toHaveLength(1);
      expect(matchResult.matches[0].accuracyPercentage).toBe(0);
    });

    it('should handle jobs with zero revenue', () => {
      const commissionEntry = createMockCommission({
        estimatedRevenue: 1000,
      });

      const approvedLog = createMockLog({
        jobs: [
          createMockJob({
            jobId: 'JOB123456',
            revenue: 0,
          }),
        ],
      });

      const matchResult = matchCommissions(approvedLog, [commissionEntry]);

      expect(matchResult.matches).toHaveLength(1);
      expect(matchResult.matches[0].accuracyPercentage).toBe(0);

      const commissionAmount = calculateCommissionAmount(0, 5);
      expect(commissionAmount).toBe(0);
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
            jobId: 'JOB123456',
            clientName: 'Test Client',
            revenue: 1000,
            tips: 100,
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
            commissionRate: null, // Null commission rate
            junkBonusGoal: 0.14,
            moveBonusGoal: 0.24,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          jobId: 'JOB123456',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 1000,
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
          actualRevenue: 1000,
          commissionAmount: 0, // Should be 0 with null rate
          matchedLogId: 'log-1',
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.dailyLog.findUnique.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(processCommissionMatching('log-1')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle missing log gracefully', async () => {
      mockPrisma.dailyLog.findUnique.mockResolvedValue(null);

      await expect(processCommissionMatching('invalid-log')).rejects.toThrow(
        'Approved log not found'
      );
    });
  });

  describe('Performance and Scale Tests', () => {
    it('should handle large-scale commission matching efficiently', () => {
      const startTime = Date.now();

      // Create 1000 commission entries
      const commissionEntries = Array.from({ length: 1000 }, (_, i) =>
        createMockCommission({
          id: `comm-${i}`,
          jobId: `JOB${i.toString().padStart(6, '0')}`,
          estimatedRevenue: 800 + i,
        })
      );

      // Create log with 200 jobs (20% match rate)
      const jobs = Array.from({ length: 200 }, (_, i) =>
        createMockJob({
          id: `job-${i}`,
          jobId: `JOB${i.toString().padStart(6, '0')}`,
          revenue: 900 + i * 2,
        })
      );

      const approvedLog = createMockLog({ jobs });

      const matchResult = matchCommissions(approvedLog, commissionEntries);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(matchResult.matches).toHaveLength(200);
      expect(matchResult.unmatched).toHaveLength(800);
      expect(matchResult.conflicts).toHaveLength(0);
      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle complex conflict scenarios efficiently', () => {
      const startTime = Date.now();

      // Create scenario where every job has 3 commission entries (conflicts)
      const commissionEntries: CommissionEntry[] = [];
      const jobs: LogJob[] = [];

      for (let i = 0; i < 100; i++) {
        const jobId = `JOB${i.toString().padStart(6, '0')}`;

        // Create job
        jobs.push(
          createMockJob({
            id: `job-${i}`,
            jobId,
            revenue: 1000 + i * 10,
          })
        );

        // Create 3 commission entries for each job (conflicts)
        for (let j = 0; j < 3; j++) {
          commissionEntries.push(
            createMockCommission({
              id: `comm-${i}-${j}`,
              salesId: `sales-${j}`,
              jobId,
              estimatedRevenue: 900 + i * 10 + j * 20,
            })
          );
        }
      }

      const approvedLog = createMockLog({ jobs });
      const matchResult = matchCommissions(approvedLog, commissionEntries);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(matchResult.matches).toHaveLength(0); // All should be conflicts
      expect(matchResult.conflicts).toHaveLength(100); // One conflict per job
      expect(matchResult.unmatched).toHaveLength(0);
      expect(executionTime).toBeLessThan(1000); // Should still be fast

      // Verify each conflict has 3 entries
      matchResult.conflicts.forEach((conflict) => {
        expect(conflict.commissionEntries).toHaveLength(3);
      });
    });
  });
});
