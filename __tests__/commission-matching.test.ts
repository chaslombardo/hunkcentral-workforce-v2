import { describe, it, expect, beforeEach } from 'vitest';
import {
  findCommissionMatches,
  calculateBookingAccuracy,
  calculateCommissionAmount,
  matchCommissions,
  type CommissionEntry,
  type DailyLog,
  type LogJob,
} from '@/lib/commissionMatcher';

// Mock data types
const mockUser = {
  id: 'user-1',
  fullName: 'John Doe',
  email: 'john@example.com',
  commissionRate: 5.0,
};

const createMockCommissionEntry = (overrides: Partial<CommissionEntry> = {}): CommissionEntry => ({
  id: 'comm-1',
  salesId: 'user-1',
  sales: mockUser,
  jobId: 'JOB-001',
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
  jobId: 'JOB-001',
  clientName: 'Test Client',
  revenue: 600,
  tips: 50,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockDailyLog = (jobs: LogJob[] = []): DailyLog => ({
  id: 'log-1',
  captainId: 'captain-1',
  captain: mockUser,
  logDate: new Date('2024-12-01'),
  status: 'approved',
  submittedAt: new Date(),
  approvedAt: new Date(),
  approvedById: 'manager-1',
  approvedBy: mockUser,
  createdById: 'captain-1',
  createdBy: mockUser,
  lastEditedById: null,
  lastEditedBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  jobs,
  hours: [],
});

describe('Commission Matching Logic', () => {
  describe('findCommissionMatches', () => {
    it('should find matching commission entries by job ID', () => {
      const commissionEntries = [
        createMockCommissionEntry({ jobId: 'JOB-001', status: 'pending' }),
        createMockCommissionEntry({ id: 'comm-2', jobId: 'JOB-002', status: 'pending' }),
        createMockCommissionEntry({ id: 'comm-3', jobId: 'JOB-001', status: 'matched' }), // Should be excluded
      ];

      const matches = findCommissionMatches('JOB-001', commissionEntries);

      expect(matches).toHaveLength(1);
      expect(matches[0].jobId).toBe('JOB-001');
      expect(matches[0].status).toBe('pending');
    });

    it('should return empty array when no matches found', () => {
      const commissionEntries = [
        createMockCommissionEntry({ jobId: 'JOB-002', status: 'pending' }),
      ];

      const matches = findCommissionMatches('JOB-001', commissionEntries);

      expect(matches).toHaveLength(0);
    });

    it('should only return pending commission entries', () => {
      const commissionEntries = [
        createMockCommissionEntry({ jobId: 'JOB-001', status: 'pending' }),
        createMockCommissionEntry({ id: 'comm-2', jobId: 'JOB-001', status: 'matched' }),
        createMockCommissionEntry({ id: 'comm-3', jobId: 'JOB-001', status: 'approved' }),
      ];

      const matches = findCommissionMatches('JOB-001', commissionEntries);

      expect(matches).toHaveLength(1);
      expect(matches[0].status).toBe('pending');
    });
  });

  describe('calculateBookingAccuracy', () => {
    it('should calculate 100% accuracy for exact match', () => {
      const accuracy = calculateBookingAccuracy(500, 500);
      expect(accuracy).toBe(100);
    });

    it('should calculate accuracy for underestimate', () => {
      const accuracy = calculateBookingAccuracy(500, 600);
      expect(accuracy).toBeCloseTo(83.33, 2);
    });

    it('should calculate accuracy for overestimate', () => {
      const accuracy = calculateBookingAccuracy(600, 500);
      expect(accuracy).toBeCloseTo(83.33, 2);
    });

    it('should return 0 for zero estimated revenue', () => {
      const accuracy = calculateBookingAccuracy(0, 500);
      expect(accuracy).toBe(0);
    });

    it('should handle zero actual revenue', () => {
      const accuracy = calculateBookingAccuracy(500, 0);
      expect(accuracy).toBe(0);
    });

    it('should handle large differences', () => {
      const accuracy = calculateBookingAccuracy(100, 1000);
      expect(accuracy).toBeCloseTo(10, 1);
    });

    it('should handle small differences', () => {
      const accuracy = calculateBookingAccuracy(500, 505);
      expect(accuracy).toBeCloseTo(99.01, 2);
    });
  });

  describe('calculateCommissionAmount', () => {
    it('should calculate commission correctly', () => {
      const commission = calculateCommissionAmount(1000, 5);
      expect(commission).toBe(50);
    });

    it('should handle zero revenue', () => {
      const commission = calculateCommissionAmount(0, 5);
      expect(commission).toBe(0);
    });

    it('should handle zero commission rate', () => {
      const commission = calculateCommissionAmount(1000, 0);
      expect(commission).toBe(0);
    });

    it('should handle decimal rates', () => {
      const commission = calculateCommissionAmount(1000, 2.5);
      expect(commission).toBe(25);
    });

    it('should handle decimal revenue', () => {
      const commission = calculateCommissionAmount(1234.56, 5);
      expect(commission).toBeCloseTo(61.73, 2);
    });

    it('should handle high commission rates', () => {
      const commission = calculateCommissionAmount(1000, 15);
      expect(commission).toBe(150);
    });
  });

  describe('matchCommissions', () => {
    let approvedLog: DailyLog;
    let commissionEntries: CommissionEntry[];

    beforeEach(() => {
      approvedLog = createMockDailyLog([
        createMockLogJob({ jobId: 'JOB-001', revenue: 600 }),
        createMockLogJob({ id: 'job-2', jobId: 'JOB-002', revenue: 800 }),
      ]);

      commissionEntries = [
        createMockCommissionEntry({ jobId: 'JOB-001', estimatedRevenue: 500 }),
        createMockCommissionEntry({ 
          id: 'comm-2', 
          jobId: 'JOB-002', 
          estimatedRevenue: 750,
          sales: { ...mockUser, id: 'user-2', fullName: 'Jane Smith' },
        }),
      ];
    });

    it('should match single commission entries to jobs', () => {
      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);

      // Check first match
      const match1 = result.matches.find(m => m.logJob.jobId === 'JOB-001');
      expect(match1).toBeDefined();
      expect(match1!.commissionEntry.jobId).toBe('JOB-001');
      expect(match1!.accuracyPercentage).toBeCloseTo(83.33, 2);

      // Check second match
      const match2 = result.matches.find(m => m.logJob.jobId === 'JOB-002');
      expect(match2).toBeDefined();
      expect(match2!.commissionEntry.jobId).toBe('JOB-002');
      expect(match2!.accuracyPercentage).toBeCloseTo(93.75, 2);
    });

    it('should handle jobs with no commission entries', () => {
      approvedLog.jobs.push(createMockLogJob({ 
        id: 'job-3', 
        jobId: 'JOB-003', 
        revenue: 400 
      }));

      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(0);
    });

    it('should detect conflicts when multiple commission entries exist for same job', () => {
      // Add duplicate commission entry
      commissionEntries.push(createMockCommissionEntry({
        id: 'comm-3',
        jobId: 'JOB-001',
        estimatedRevenue: 550,
        sales: { ...mockUser, id: 'user-3', fullName: 'Bob Wilson' },
      }));

      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(1); // Only JOB-002 should match
      expect(result.conflicts).toHaveLength(1);
      expect(result.unmatched).toHaveLength(0);

      const conflict = result.conflicts[0];
      expect(conflict.jobId).toBe('JOB-001');
      expect(conflict.commissionEntries).toHaveLength(2);
      expect(conflict.reason).toContain('Multiple commission entries found');
    });

    it('should identify unmatched commission entries', () => {
      // Add commission entry for job that doesn't exist in log
      commissionEntries.push(createMockCommissionEntry({
        id: 'comm-3',
        jobId: 'JOB-999',
        estimatedRevenue: 300,
        sales: { ...mockUser, id: 'user-3', fullName: 'Bob Wilson' },
      }));

      const result = matchCommissions(approvedLog, commissionEntries);

      expect(result.matches).toHaveLength(2);
      expect(result.conflicts).toHaveLength(0);
      expect(result.unmatched).toHaveLength(1);
      expect(result.unmatched[0].jobId).toBe('JOB-999');
    });

    it('should handle duplicate job IDs in the same log', () => {
      // Add duplicate job ID in the log (edge case)
      approvedLog.jobs.push(createMockLogJob({ 
        id: 'job-3', 
        jobId: 'JOB-001', 
        revenue: 700 
      }));

      const result = matchCommissions(approvedLog, commissionEntries);

      // Should only process JOB-001 once
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
      expect(result.unmatched).toHaveLength(2); // All commission entries are unmatched
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

      const match1 = result.matches.find(m => m.logJob.jobId === 'JOB-001');
      expect(match1!.accuracyPercentage).toBeCloseTo(83.33, 2); // 500 vs 600

      const match2 = result.matches.find(m => m.logJob.jobId === 'JOB-002');
      expect(match2!.accuracyPercentage).toBeCloseTo(93.75, 2); // 750 vs 800
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large revenue amounts', () => {
      const commission = calculateCommissionAmount(1000000, 5);
      expect(commission).toBe(50000);
    });

    it('should handle very small revenue amounts', () => {
      const commission = calculateCommissionAmount(0.01, 5);
      expect(commission).toBeCloseTo(0.0005, 4);
    });

    it('should handle perfect accuracy with zero amounts', () => {
      const accuracy = calculateBookingAccuracy(0, 0);
      expect(accuracy).toBe(0);
    });

    it('should handle commission matching with zero commission rate', () => {
      const commissionEntry = createMockCommissionEntry({
        sales: { ...mockUser, commissionRate: 0 },
      });
      const approvedLog = createMockDailyLog([
        createMockLogJob({ jobId: 'JOB-001', revenue: 600 }),
      ]);

      const result = matchCommissions(approvedLog, [commissionEntry]);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].commissionEntry.sales.commissionRate).toBe(0);
    });

    it('should handle null commission rate', () => {
      const commissionEntry = createMockCommissionEntry({
        sales: { ...mockUser, commissionRate: null },
      });
      const approvedLog = createMockDailyLog([
        createMockLogJob({ jobId: 'JOB-001', revenue: 600 }),
      ]);

      const result = matchCommissions(approvedLog, [commissionEntry]);

      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].commissionEntry.sales.commissionRate).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('should handle large numbers of commission entries efficiently', () => {
      const startTime = Date.now();
      
      // Create 1000 commission entries
      const largeCommissionList: CommissionEntry[] = [];
      for (let i = 0; i < 1000; i++) {
        largeCommissionList.push(createMockCommissionEntry({
          id: `comm-${i}`,
          jobId: `JOB-${i.toString().padStart(3, '0')}`,
        }));
      }

      // Create log with 100 jobs
      const largeJobList: LogJob[] = [];
      for (let i = 0; i < 100; i++) {
        largeJobList.push(createMockLogJob({
          id: `job-${i}`,
          jobId: `JOB-${i.toString().padStart(3, '0')}`,
        }));
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
  });
});