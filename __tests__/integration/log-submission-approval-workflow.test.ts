import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculatePayroll,
  calculateLaborBonusesTotals,
} from '@/lib/payCalculator';
import {
  matchCommissions,
  processCommissionMatching,
} from '@/lib/commissionMatcher';
import type { User, DailyLog, LogJob, LogHour, CommissionEntry } from '@/types';

// Mock Prisma
const mockPrisma = {
  dailyLog: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  commissionEntry: {
    findMany: vi.fn(),
    update: vi.fn(),
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
  roles: ['captain'],
  rateJunkCaptain: 25,
  rateJunkWingman: 20,
  rateMoveCaptain: 27,
  rateMoveWingman: 22,
  rateZigma: 18,
  rateTraining: 16,
  rateEstimating: 30,
  rateWarehouse: 14,
  rateAdmin: 24,
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

const createMockHour = (overrides: Partial<LogHour> = {}): LogHour => ({
  id: 'hour-1',
  logId: 'log-1',
  log: createMockLog(),
  employeeId: 'employee-1',
  employee: createMockUser({ id: 'employee-1' }),
  department: 'junk',
  hours: 8,
  isCoCaptain: false,
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

describe('Log Submission and Approval Workflow - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Log Workflow', () => {
    it('should handle complete log submission to payroll workflow', async () => {
      // Setup: Create captain, wingman, and sales person
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        fullName: 'Captain Smith',
        rateJunkCaptain: 25,
        junkBonusGoal: 0.15, // 15% goal
      });

      const wingman = createMockUser({
        id: 'wingman-1',
        roles: ['wingman'],
        fullName: 'Wingman Jones',
        rateJunkWingman: 20,
      });

      const salesPerson = createMockUser({
        id: 'sales-1',
        roles: ['sales'],
        fullName: 'Sales Rep',
        commissionRate: 5,
      });

      // Step 1: Captain submits log
      const submittedLog = createMockLog({
        id: 'log-1',
        captain,
        status: 'submitted',
        approvedAt: null,
        jobs: [
          createMockJob({
            jobType: 'junk',
            jobId: 'JOB123456',
            revenue: 1000,
            tips: 200,
          }),
        ],
        hours: [
          createMockHour({
            employeeId: 'captain-1',
            employee: captain,
            department: 'junk',
            hours: 8,
            isCoCaptain: false,
          }),
          createMockHour({
            id: 'hour-2',
            employeeId: 'wingman-1',
            employee: wingman,
            department: 'junk',
            hours: 8,
            isCoCaptain: false,
          }),
        ],
      });

      // Step 2: Sales person creates commission entry
      const commissionEntry = createMockCommission({
        salesId: 'sales-1',
        jobId: 'JOB123456',
        estimatedRevenue: 900,
        status: 'pending',
      });

      // Step 3: Manager approves log
      const approvedLog = {
        ...submittedLog,
        status: 'approved' as const,
        approvedAt: new Date('2024-01-15T12:00:00Z'),
        approvedById: 'manager-1',
      };

      // Mock database responses for commission matching
      mockPrisma.dailyLog.findUnique.mockResolvedValue({
        ...approvedLog,
        captain: {
          ...captain,
          junkBonusGoal: captain.junkBonusGoal,
          moveBonusGoal: captain.moveBonusGoal,
        },
        createdBy: {
          ...captain,
          junkBonusGoal: captain.junkBonusGoal,
          moveBonusGoal: captain.moveBonusGoal,
        },
        jobs: approvedLog.jobs.map((job) => ({
          ...job,
          revenue: job.revenue,
          tips: job.tips,
        })),
        hours: [],
      });

      mockPrisma.commissionEntry.findMany.mockResolvedValue([
        {
          ...commissionEntry,
          sales: {
            ...salesPerson,
            commissionRate: salesPerson.commissionRate,
          },
          estimatedRevenue: commissionEntry.estimatedRevenue,
        },
      ]);

      mockPrisma.commissionEntry.update.mockResolvedValue({});

      // Step 4: Process commission matching
      const matchResult = await processCommissionMatching('log-1');

      // Verify commission matching worked
      expect(matchResult.matches).toHaveLength(1);
      expect(matchResult.conflicts).toHaveLength(0);
      expect(matchResult.unmatched).toHaveLength(0);

      const match = matchResult.matches[0];
      expect(match.commissionEntry.jobId).toBe('JOB123456');
      expect(match.logJob.revenue).toBe(1000);
      expect(match.accuracyPercentage).toBeCloseTo(90, 0); // 900 vs 1000

      // Verify commission was updated
      expect(mockPrisma.commissionEntry.update).toHaveBeenCalledWith({
        where: { id: 'commission-1' },
        data: {
          status: 'matched',
          actualRevenue: 1000,
          commissionAmount: 50, // 1000 * 0.05
          matchedLogId: 'log-1',
        },
      });

      // Step 5: Calculate payroll for pay period
      const users = [captain, wingman, salesPerson];
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      // Update commission entry to matched status for payroll calculation
      const matchedCommission = {
        ...commissionEntry,
        status: 'matched' as const,
        actualRevenue: 1000,
        commissionAmount: 50,
        matchedLog: approvedLog,
      };

      const payroll = calculatePayroll(
        users,
        [approvedLog],
        [matchedCommission],
        payPeriodStart,
        payPeriodEnd
      );

      // Verify payroll calculations
      expect(payroll).toHaveLength(3);

      const captainPayroll = payroll.find((p) => p.employeeId === 'captain-1')!;
      const wingmanPayroll = payroll.find((p) => p.employeeId === 'wingman-1')!;
      const salesPayroll = payroll.find((p) => p.employeeId === 'sales-1')!;

      // Captain payroll verification
      expect(captainPayroll.totalHours).toBe(8);
      expect(captainPayroll.grossWages).toBe(200); // 8 hours * $25/hour
      expect(captainPayroll.tips).toBe(100); // 200 tips / 2 employees

      // Labor cost: (8 * 25) + (8 * 20) = 360, Revenue: 1000, Actual %: 36%, Goal: 15%
      // No bonus because over goal (36% > 15%)
      expect(captainPayroll.bonuses).toBe(0);

      // Wingman payroll verification
      expect(wingmanPayroll.totalHours).toBe(8);
      expect(wingmanPayroll.grossWages).toBe(160); // 8 hours * $20/hour
      expect(wingmanPayroll.tips).toBe(100); // 200 tips / 2 employees
      expect(wingmanPayroll.bonuses).toBe(0); // Wingmen don't get bonuses

      // Sales person payroll verification
      expect(salesPayroll.totalHours).toBe(0);
      expect(salesPayroll.grossWages).toBe(0);
      expect(salesPayroll.tips).toBe(0);
      expect(salesPayroll.commission).toBe(50); // Commission from matched job
    });

    it('should handle log with labor bonus calculation', async () => {
      // Setup: Captain with achievable bonus goal
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        rateJunkCaptain: 20,
        junkBonusGoal: 0.25, // 25% goal (achievable)
      });

      const wingman = createMockUser({
        id: 'wingman-1',
        roles: ['wingman'],
        rateJunkWingman: 15,
      });

      // Create log with good labor efficiency
      const approvedLog = createMockLog({
        captain,
        jobs: [
          createMockJob({
            jobType: 'junk',
            revenue: 1000,
            tips: 100,
          }),
        ],
        hours: [
          createMockHour({
            employeeId: 'captain-1',
            employee: captain,
            department: 'junk',
            hours: 6, // Lower hours for better efficiency
          }),
          createMockHour({
            id: 'hour-2',
            employeeId: 'wingman-1',
            employee: wingman,
            department: 'junk',
            hours: 6,
          }),
        ],
      });

      // Calculate labor bonuses
      const bonuses = calculateLaborBonusesTotals([approvedLog]);

      // Labor cost: (6 * 20) + (6 * 15) = 210
      // Labor %: 210 / 1000 = 21%
      // Goal: 25%
      // Bonus: (25% - 21%) * 1000 = 40
      expect(bonuses.get('captain-1')).toBeCloseTo(40, 2);
      expect(bonuses.get('wingman-1')).toBeUndefined(); // No bonus for wingman

      // Calculate full payroll
      const payroll = calculatePayroll(
        [captain, wingman],
        [approvedLog],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const captainPayroll = payroll.find((p) => p.employeeId === 'captain-1')!;
      expect(captainPayroll.bonuses).toBeCloseTo(40, 2);
      expect(captainPayroll.totalPay).toBeCloseTo(210, 2); // 120 wages + 50 tips + 40 bonus
    });

    it('should handle multiple job types in single log', async () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        rateJunkCaptain: 25,
        rateMoveCaptain: 27,
        junkBonusGoal: 0.2,
        moveBonusGoal: 0.3,
      });

      const wingman = createMockUser({
        id: 'wingman-1',
        roles: ['wingman'],
        rateJunkWingman: 20,
        rateMoveWingman: 22,
      });

      // Create log with both junk and move jobs
      const approvedLog = createMockLog({
        captain,
        jobs: [
          createMockJob({
            id: 'job-1',
            jobType: 'junk',
            jobId: 'JOB001',
            revenue: 800,
            tips: 80,
          }),
          createMockJob({
            id: 'job-2',
            jobType: 'move',
            jobId: 'JOB002',
            revenue: 1200,
            tips: 120,
          }),
        ],
        hours: [
          // Junk hours
          createMockHour({
            id: 'hour-1',
            employeeId: 'captain-1',
            employee: captain,
            department: 'junk',
            hours: 4,
          }),
          createMockHour({
            id: 'hour-2',
            employeeId: 'wingman-1',
            employee: wingman,
            department: 'junk',
            hours: 4,
          }),
          // Move hours
          createMockHour({
            id: 'hour-3',
            employeeId: 'captain-1',
            employee: captain,
            department: 'move',
            hours: 6,
          }),
          createMockHour({
            id: 'hour-4',
            employeeId: 'wingman-1',
            employee: wingman,
            department: 'move',
            hours: 6,
          }),
        ],
      });

      // Calculate bonuses
      const bonuses = calculateLaborBonusesTotals([approvedLog]);

      // Junk: Labor cost = (4 * 25) + (4 * 20) = 180, Revenue = 800, % = 22.5%
      // Goal = 20%, so 22.5% > 20% = no bonus

      // Move: Labor cost = (6 * 27) + (6 * 22) = 294, Revenue = 1200, % = 24.5%
      // Goal = 30%, so bonus = (30% - 24.5%) * 1200 = 66

      expect(bonuses.get('captain-1')).toBeCloseTo(66, 2);

      // Calculate full payroll
      const payroll = calculatePayroll(
        [captain, wingman],
        [approvedLog],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const captainPayroll = payroll.find((p) => p.employeeId === 'captain-1')!;
      const wingmanPayroll = payroll.find((p) => p.employeeId === 'wingman-1')!;

      // Captain: 10 total hours, mixed departments
      expect(captainPayroll.totalHours).toBe(10);
      expect(captainPayroll.hoursByDepartment.junk).toBe(4);
      expect(captainPayroll.hoursByDepartment.move).toBe(6);
      expect(captainPayroll.grossWages).toBe(262); // (4 * 25) + (6 * 27)
      expect(captainPayroll.tips).toBe(100); // (80 + 120) / 2
      expect(captainPayroll.bonuses).toBeCloseTo(66, 2);

      // Wingman: 10 total hours, mixed departments
      expect(wingmanPayroll.totalHours).toBe(10);
      expect(wingmanPayroll.hoursByDepartment.junk).toBe(4);
      expect(wingmanPayroll.hoursByDepartment.move).toBe(6);
      expect(wingmanPayroll.grossWages).toBe(212); // (4 * 20) + (6 * 22)
      expect(wingmanPayroll.tips).toBe(100);
      expect(wingmanPayroll.bonuses).toBe(0);
    });

    it('should handle commission conflicts and resolution', async () => {
      // Setup: Multiple sales people booking same job
      const salesPerson1 = createMockUser({
        id: 'sales-1',
        roles: ['sales'],
        commissionRate: 5,
      });

      const salesPerson2 = createMockUser({
        id: 'sales-2',
        roles: ['sales'],
        commissionRate: 6,
      });

      const approvedLog = createMockLog({
        jobs: [
          createMockJob({
            jobId: 'JOB123456',
            revenue: 1000,
          }),
        ],
      });

      // Two commission entries for same job
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

      // Test commission matching
      const matchResult = matchCommissions(approvedLog, commissionEntries);

      // Should detect conflict
      expect(matchResult.matches).toHaveLength(0);
      expect(matchResult.conflicts).toHaveLength(1);
      expect(matchResult.unmatched).toHaveLength(0);

      const conflict = matchResult.conflicts[0];
      expect(conflict.jobId).toBe('JOB123456');
      expect(conflict.commissionEntries).toHaveLength(2);
      expect(conflict.reason).toContain('Multiple commission entries found');

      // Verify both sales people are in conflict
      const salesIds = conflict.commissionEntries.map((e) => e.salesId);
      expect(salesIds).toContain('sales-1');
      expect(salesIds).toContain('sales-2');
    });

    it('should handle salary employees in payroll calculation', async () => {
      // Setup: Mix of hourly and salary employees
      const hourlyEmployee = createMockUser({
        id: 'hourly-1',
        roles: ['captain'],
        rateJunkCaptain: 25,
      });

      const salaryEmployee = createMockUser({
        id: 'salary-1',
        roles: ['admin'],
        rateAdmin: 20,
        salaryAmount: 1000,
        salaryFrequency: 'weekly',
        salaryType: 'base',
      });

      const guaranteedEmployee = createMockUser({
        id: 'guaranteed-1',
        roles: ['manager'],
        rateJunkCaptain: 20, // Use a rate that exists in the mock
        salaryAmount: 800,
        salaryFrequency: 'weekly',
        salaryType: 'guaranteed',
      });

      const approvedLog = createMockLog({
        jobs: [
          createMockJob({
            revenue: 1000,
            tips: 150,
          }),
        ],
        hours: [
          createMockHour({
            employeeId: 'hourly-1',
            employee: hourlyEmployee,
            department: 'junk',
            hours: 8,
          }),
          createMockHour({
            id: 'hour-2',
            employeeId: 'salary-1',
            employee: salaryEmployee,
            department: 'admin',
            hours: 40,
          }),
          createMockHour({
            id: 'hour-3',
            employeeId: 'guaranteed-1',
            employee: guaranteedEmployee,
            department: 'junk',
            hours: 10,
          }),
        ],
      });

      const payroll = calculatePayroll(
        [hourlyEmployee, salaryEmployee, guaranteedEmployee],
        [approvedLog],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      // Hourly employee
      const hourlyPayroll = payroll.find((p) => p.employeeId === 'hourly-1')!;
      expect(hourlyPayroll.grossWages).toBe(200); // 8 * 25
      expect(hourlyPayroll.breakdown.salaryType).toBeNull();
      expect(hourlyPayroll.totalPay).toBe(275); // 200 + 75 tips (150/2 employees working junk)

      // Base salary employee
      const salaryPayroll = payroll.find((p) => p.employeeId === 'salary-1')!;
      expect(salaryPayroll.grossWages).toBe(0); // Base salary replaces hourly
      expect(salaryPayroll.breakdown.salaryAmount).toBe(1000);
      expect(salaryPayroll.breakdown.salaryType).toBe('base');
      expect(salaryPayroll.totalPay).toBe(1000); // 1000 salary (admin doesn't work junk section, no tips)

      // Guaranteed salary employee (hourly is higher)
      const guaranteedPayroll = payroll.find(
        (p) => p.employeeId === 'guaranteed-1'
      )!;
      expect(guaranteedPayroll.grossWages).toBe(200); // 10 * 20
      expect(guaranteedPayroll.breakdown.salaryAmount).toBe(800); // Guaranteed is higher than 200 + 75 = 275
      expect(guaranteedPayroll.totalPay).toBe(800); // Guaranteed salary (tips may not be added to guaranteed salary)
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle logs with no jobs', async () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
      });

      const approvedLog = createMockLog({
        captain,
        jobs: [], // No jobs
        hours: [
          createMockHour({
            employeeId: 'captain-1',
            employee: captain,
            department: 'admin',
            hours: 8,
          }),
        ],
      });

      const payroll = calculatePayroll(
        [captain],
        [approvedLog],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const captainPayroll = payroll[0];
      expect(captainPayroll.totalHours).toBe(8);
      expect(captainPayroll.tips).toBe(0); // No tips without jobs
      expect(captainPayroll.bonuses).toBe(0); // No bonuses without revenue
    });

    it('should handle logs with zero revenue jobs', async () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        junkBonusGoal: 0.15,
      });

      const approvedLog = createMockLog({
        captain,
        jobs: [
          createMockJob({
            revenue: 0, // Zero revenue
            tips: 50,
          }),
        ],
        hours: [
          createMockHour({
            employeeId: 'captain-1',
            employee: captain,
            department: 'junk',
            hours: 8,
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([approvedLog]);
      expect(bonuses.get('captain-1')).toBeUndefined(); // No bonus with zero revenue

      const payroll = calculatePayroll(
        [captain],
        [approvedLog],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const captainPayroll = payroll[0];
      expect(captainPayroll.tips).toBe(50);
      expect(captainPayroll.bonuses).toBe(0);
    });

    it('should handle commission matching with no pending entries', async () => {
      const approvedLog = createMockLog({
        jobs: [
          createMockJob({
            jobId: 'JOB123456',
            revenue: 1000,
          }),
        ],
      });

      const matchResult = matchCommissions(approvedLog, []); // No commission entries

      expect(matchResult.matches).toHaveLength(0);
      expect(matchResult.conflicts).toHaveLength(0);
      expect(matchResult.unmatched).toHaveLength(0);
    });

    it('should handle payroll calculation with no approved logs', async () => {
      const users = [
        createMockUser({ id: 'user-1' }),
        createMockUser({ id: 'user-2' }),
      ];

      const payroll = calculatePayroll(
        users,
        [], // No logs
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(payroll).toHaveLength(2);
      payroll.forEach((p) => {
        expect(p.totalHours).toBe(0);
        expect(p.grossWages).toBe(0);
        expect(p.tips).toBe(0);
        expect(p.commission).toBe(0);
        expect(p.bonuses).toBe(0);
        expect(p.totalPay).toBe(0);
      });
    });
  });

  describe('Performance and Scale Tests', () => {
    it('should handle large payroll calculation efficiently', () => {
      const startTime = Date.now();

      // Create 100 users
      const users = Array.from({ length: 100 }, (_, i) =>
        createMockUser({
          id: `user-${i}`,
          roles: i % 2 === 0 ? ['captain'] : ['wingman'],
        })
      );

      // Create 50 logs with multiple jobs and hours each
      const logs = Array.from({ length: 50 }, (_, i) =>
        createMockLog({
          id: `log-${i}`,
          jobs: [
            createMockJob({
              id: `job-${i}-1`,
              revenue: 1000 + i * 10,
              tips: 100 + i,
            }),
            createMockJob({
              id: `job-${i}-2`,
              revenue: 800 + i * 5,
              tips: 80 + i,
            }),
          ],
          hours: users.slice(0, 10).map((user, j) =>
            createMockHour({
              id: `hour-${i}-${j}`,
              employeeId: user.id,
              employee: user,
              hours: 8,
            })
          ),
        })
      );

      const payroll = calculatePayroll(
        users,
        logs,
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(payroll).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second

      // Verify some calculations are correct
      const firstUserPayroll = payroll[0];
      expect(firstUserPayroll.totalHours).toBeGreaterThan(0);
      expect(firstUserPayroll.tips).toBeGreaterThan(0);
    });

    it('should handle commission matching with many entries efficiently', () => {
      const startTime = Date.now();

      // Create log with 100 jobs
      const jobs = Array.from({ length: 100 }, (_, i) =>
        createMockJob({
          id: `job-${i}`,
          jobId: `JOB${i.toString().padStart(6, '0')}`,
          revenue: 1000 + i * 10,
        })
      );

      const approvedLog = createMockLog({ jobs });

      // Create 500 commission entries (some matching, some not)
      const commissionEntries = Array.from({ length: 500 }, (_, i) => {
        const jobIndex = i < 100 ? i : Math.floor(Math.random() * 1000) + 100;
        return createMockCommission({
          id: `comm-${i}`,
          jobId: `JOB${jobIndex.toString().padStart(6, '0')}`,
          estimatedRevenue: 900 + i * 5,
        });
      });

      const matchResult = matchCommissions(approvedLog, commissionEntries);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(matchResult.matches).toHaveLength(100); // First 100 should match
      expect(matchResult.unmatched).toHaveLength(400); // Rest should be unmatched
      expect(executionTime).toBeLessThan(500); // Should be fast
    });
  });
});
