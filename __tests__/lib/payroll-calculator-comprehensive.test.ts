import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateHourlyWage,
  calculateLaborCostPercentage,
  calculateLaborBonus,
  calculateTipsPerHunk,
  calculateTipDistribution,
  calculateCommissionTotals,
  calculateLaborBonusesTotals,
  convertSalaryToWeekly,
  applySalaryRules,
  calculatePayroll,
  calculateEnhancedPayroll,
  calculateCaptainPerformanceMetrics,
  calculateJunkPerformanceMetrics,
  calculateMovePerformanceMetrics,
} from '@/lib/payCalculator';
import type {
  User,
  DailyLog,
  LogJob,
  LogHour,
  CommissionEntry,
  Department,
  SalaryType,
  SalaryFrequency,
} from '@/types';

// Mock data helpers
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['wingman'],
  rateJunkCaptain: 20,
  rateJunkWingman: 15,
  rateMoveCaptain: 22,
  rateMoveWingman: 17,
  rateZigma: 18,
  rateTraining: 16,
  rateEstimating: 25,
  rateWarehouse: 14,
  rateAdmin: 20,
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
  jobId: 'JOB123',
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
  sales: createMockUser({
    id: 'sales-1',
    roles: ['sales'],
    commissionRate: 10,
  }),
  jobId: 'JOB123',
  clientName: 'Test Client',
  jobType: 'junk',
  targetDate: new Date('2024-01-15'),
  estimatedRevenue: 1000,
  actualRevenue: 1200,
  commissionAmount: 120,
  status: 'matched',
  matchedLogId: 'log-1',
  matchedLog: createMockLog(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Payroll Calculator - Comprehensive Unit Tests', () => {
  describe('calculateHourlyWage', () => {
    it('should calculate correct rates for all departments', () => {
      const user = createMockUser({
        rateJunkCaptain: 25,
        rateJunkWingman: 20,
        rateMoveCaptain: 27,
        rateMoveWingman: 22,
        rateZigma: 18,
        rateTraining: 16,
        rateEstimating: 30,
        rateWarehouse: 14,
        rateAdmin: 24,
      });

      // Test all departments with wingman rates
      expect(calculateHourlyWage(user, 'junk', false)).toBe(20);
      expect(calculateHourlyWage(user, 'move', false)).toBe(22);
      expect(calculateHourlyWage(user, 'zigma', false)).toBe(18);
      expect(calculateHourlyWage(user, 'training', false)).toBe(16);
      expect(calculateHourlyWage(user, 'estimating', false)).toBe(30);
      expect(calculateHourlyWage(user, 'warehouse', false)).toBe(14);
      expect(calculateHourlyWage(user, 'admin', false)).toBe(24);
    });

    it('should use captain rates for captains', () => {
      const captain = createMockUser({
        roles: ['captain'],
        rateJunkCaptain: 25,
        rateMoveCaptain: 27,
      });

      expect(calculateHourlyWage(captain, 'junk', false)).toBe(25);
      expect(calculateHourlyWage(captain, 'move', false)).toBe(27);
    });

    it('should use captain rates for co-captains regardless of role', () => {
      const wingman = createMockUser({
        roles: ['wingman'],
        rateJunkCaptain: 25,
        rateMoveCaptain: 27,
      });

      expect(calculateHourlyWage(wingman, 'junk', true)).toBe(25);
      expect(calculateHourlyWage(wingman, 'move', true)).toBe(27);
    });

    it('should handle missing rates gracefully', () => {
      const user = createMockUser({
        rateJunkCaptain: undefined,
        rateJunkWingman: undefined,
      });

      expect(calculateHourlyWage(user, 'junk', false)).toBe(0);
      expect(calculateHourlyWage(user, 'junk', true)).toBe(0);
    });

    it('should handle invalid department', () => {
      const user = createMockUser();
      expect(calculateHourlyWage(user, 'invalid' as Department, false)).toBe(0);
    });
  });

  describe('calculateLaborCostPercentage', () => {
    it('should calculate correct labor cost percentage', () => {
      const result = calculateLaborCostPercentage(200, 1000, 'junk');

      expect(result.totalRevenue).toBe(1000);
      expect(result.totalLaborCost).toBe(200);
      expect(result.laborCostPercentage).toBe(0.2);
      expect(result.goal).toBe(0.14); // Junk goal
      expect(result.isUnderGoal).toBe(false);
    });

    it('should handle zero revenue', () => {
      const result = calculateLaborCostPercentage(200, 0, 'junk');

      expect(result.laborCostPercentage).toBe(0);
      expect(result.isUnderGoal).toBe(true); // 0 is under goal
    });

    it('should use correct goals for different job types', () => {
      const junkResult = calculateLaborCostPercentage(100, 1000, 'junk');
      const moveResult = calculateLaborCostPercentage(100, 1000, 'move');

      expect(junkResult.goal).toBe(0.14);
      expect(moveResult.goal).toBe(0.24);
    });

    it('should correctly identify under goal performance', () => {
      const underGoal = calculateLaborCostPercentage(100, 1000, 'junk'); // 10% vs 14% goal
      const overGoal = calculateLaborCostPercentage(200, 1000, 'junk'); // 20% vs 14% goal

      expect(underGoal.isUnderGoal).toBe(true);
      expect(overGoal.isUnderGoal).toBe(false);
    });
  });

  describe('calculateLaborBonus', () => {
    it('should calculate bonus for captain under goal', () => {
      const captain = createMockUser({ roles: ['captain'] });
      const bonus = calculateLaborBonus(captain, 0.12, 0.14, 1000);

      expect(bonus).toBeCloseTo(20, 2); // (14% - 12%) * 1000 = 20
    });

    it('should return zero bonus when over goal', () => {
      const captain = createMockUser({ roles: ['captain'] });
      const bonus = calculateLaborBonus(captain, 0.16, 0.14, 1000);

      expect(bonus).toBe(0);
    });

    it('should return zero bonus for non-captains', () => {
      const wingman = createMockUser({ roles: ['wingman'] });
      const bonus = calculateLaborBonus(wingman, 0.12, 0.14, 1000);

      expect(bonus).toBe(0);
    });

    it('should handle edge case where actual equals goal', () => {
      const captain = createMockUser({ roles: ['captain'] });
      const bonus = calculateLaborBonus(captain, 0.14, 0.14, 1000);

      expect(bonus).toBe(0);
    });

    it('should handle large revenue amounts', () => {
      const captain = createMockUser({ roles: ['captain'] });
      const bonus = calculateLaborBonus(captain, 0.1, 0.14, 100000);

      expect(bonus).toBeCloseTo(4000, 2); // (14% - 10%) * 100000 = 4000
    });
  });

  describe('calculateTipsPerHunk', () => {
    it('should calculate tips per HUNK correctly', () => {
      expect(calculateTipsPerHunk(200, 4)).toBe(50);
      expect(calculateTipsPerHunk(150, 3)).toBe(50);
      expect(calculateTipsPerHunk(100, 2)).toBe(50);
    });

    it('should handle zero HUNKs', () => {
      expect(calculateTipsPerHunk(200, 0)).toBe(0);
    });

    it('should handle zero tips', () => {
      expect(calculateTipsPerHunk(0, 4)).toBe(0);
    });

    it('should handle decimal results', () => {
      expect(calculateTipsPerHunk(100, 3)).toBeCloseTo(33.33, 2);
    });
  });

  describe('calculateTipDistribution', () => {
    it('should distribute tips equally within sections', () => {
      const employee1 = createMockUser({ id: 'emp-1' });
      const employee2 = createMockUser({ id: 'emp-2' });

      const log = createMockLog({
        jobs: [
          createMockJob({ jobType: 'junk', tips: 200 }),
          createMockJob({ jobType: 'junk', tips: 100 }),
        ],
        hours: [
          createMockHour({ employeeId: 'emp-1', department: 'junk' }),
          createMockHour({ employeeId: 'emp-2', department: 'junk' }),
        ],
      });

      const tipDistribution = calculateTipDistribution([log]);

      expect(tipDistribution.get('emp-1')).toBe(150);
      expect(tipDistribution.get('emp-2')).toBe(150);
    });

    it('should handle employees working multiple sections', () => {
      const employee1 = createMockUser({ id: 'emp-1' });

      const log = createMockLog({
        jobs: [
          createMockJob({ jobType: 'junk', tips: 100 }),
          createMockJob({ jobType: 'move', tips: 200 }),
        ],
        hours: [
          createMockHour({ employeeId: 'emp-1', department: 'junk' }),
          createMockHour({ employeeId: 'emp-1', department: 'move' }),
        ],
      });

      const tipDistribution = calculateTipDistribution([log]);

      expect(tipDistribution.get('emp-1')).toBe(300);
    });

    it('should handle multiple logs', () => {
      const employee1 = createMockUser({ id: 'emp-1' });

      const log1 = createMockLog({
        id: 'log-1',
        jobs: [createMockJob({ jobType: 'junk', tips: 100 })],
        hours: [createMockHour({ employeeId: 'emp-1', department: 'junk' })],
      });

      const log2 = createMockLog({
        id: 'log-2',
        jobs: [createMockJob({ jobType: 'junk', tips: 200 })],
        hours: [createMockHour({ employeeId: 'emp-1', department: 'junk' })],
      });

      const tipDistribution = calculateTipDistribution([log1, log2]);

      expect(tipDistribution.get('emp-1')).toBe(300);
    });

    it('should handle sections with no jobs', () => {
      const employee1 = createMockUser({ id: 'emp-1' });

      const log = createMockLog({
        jobs: [], // No jobs
        hours: [createMockHour({ employeeId: 'emp-1', department: 'junk' })],
      });

      const tipDistribution = calculateTipDistribution([log]);

      expect(tipDistribution.get('emp-1')).toBeUndefined();
    });

    it('should handle sections with no hours', () => {
      const log = createMockLog({
        jobs: [createMockJob({ jobType: 'junk', tips: 100 })],
        hours: [], // No hours
      });

      const tipDistribution = calculateTipDistribution([log]);

      expect(tipDistribution.size).toBe(0);
    });
  });

  describe('convertSalaryToWeekly', () => {
    it('should convert weekly salary correctly', () => {
      expect(convertSalaryToWeekly(1000, 'weekly')).toBe(1000);
    });

    it('should convert bi-weekly salary correctly', () => {
      expect(convertSalaryToWeekly(2000, 'bi-weekly')).toBe(1000);
    });

    it('should convert monthly salary correctly', () => {
      expect(convertSalaryToWeekly(4330, 'monthly')).toBeCloseTo(1000, 0);
    });

    it('should handle zero salary', () => {
      expect(convertSalaryToWeekly(0, 'weekly')).toBe(0);
      expect(convertSalaryToWeekly(0, 'bi-weekly')).toBe(0);
      expect(convertSalaryToWeekly(0, 'monthly')).toBe(0);
    });

    it('should handle invalid frequency', () => {
      expect(convertSalaryToWeekly(1000, 'invalid' as SalaryFrequency)).toBe(0);
    });
  });

  describe('applySalaryRules', () => {
    const baseUser = createMockUser();

    it('should handle no salary (hourly only)', () => {
      const result = applySalaryRules(baseUser, 800, 100, 50, 25);

      expect(result.finalPay).toBe(975);
      expect(result.hourlyWages).toBe(800);
      expect(result.salaryAmount).toBe(0);
      expect(result.salaryType).toBeNull();
      expect(result.tips).toBe(100);
      expect(result.commission).toBe(50);
      expect(result.laborBonuses).toBe(25);
    });

    it('should handle base salary', () => {
      const user = createMockUser({
        salaryAmount: 1000,
        salaryFrequency: 'weekly',
        salaryType: 'base',
      });

      const result = applySalaryRules(user, 800, 100, 50, 25);

      expect(result.finalPay).toBe(1175); // 1000 + 100 + 50 + 25
      expect(result.hourlyWages).toBe(0); // Base salary replaces hourly
      expect(result.salaryAmount).toBe(1000);
      expect(result.salaryType).toBe('base');
    });

    it('should handle guaranteed salary when guarantee is higher', () => {
      const user = createMockUser({
        salaryAmount: 1200,
        salaryFrequency: 'weekly',
        salaryType: 'guaranteed',
      });

      const result = applySalaryRules(user, 800, 100, 50, 25);

      expect(result.finalPay).toBe(1200);
      expect(result.hourlyWages).toBe(800);
      expect(result.salaryAmount).toBe(1200);
    });

    it('should handle guaranteed salary when calculated is higher', () => {
      const user = createMockUser({
        salaryAmount: 900,
        salaryFrequency: 'weekly',
        salaryType: 'guaranteed',
      });

      const result = applySalaryRules(user, 800, 100, 50, 25);

      expect(result.finalPay).toBe(975);
      expect(result.salaryAmount).toBe(0);
    });

    it('should handle supplemental salary', () => {
      const user = createMockUser({
        salaryAmount: 200,
        salaryFrequency: 'weekly',
        salaryType: 'supplemental',
      });

      const result = applySalaryRules(user, 800, 100, 50, 25);

      expect(result.finalPay).toBe(1175); // 975 + 200
      expect(result.salaryAmount).toBe(200);
      expect(result.salaryType).toBe('supplemental');
    });

    it('should handle bi-weekly salary conversion', () => {
      const user = createMockUser({
        salaryAmount: 2000,
        salaryFrequency: 'bi-weekly',
        salaryType: 'base',
      });

      const result = applySalaryRules(user, 800, 100, 50, 25);

      expect(result.finalPay).toBe(1175); // 1000 + 100 + 50 + 25
      expect(result.salaryAmount).toBe(1000); // 2000 / 2
    });

    it('should handle monthly salary conversion', () => {
      const user = createMockUser({
        salaryAmount: 4330,
        salaryFrequency: 'monthly',
        salaryType: 'base',
      });

      const result = applySalaryRules(user, 800, 100, 50, 25);

      expect(result.finalPay).toBeCloseTo(1175, 0);
      expect(result.salaryAmount).toBeCloseTo(1000, 0);
    });
  });

  describe('calculateCommissionTotals', () => {
    it('should sum matched commissions in pay period', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const matchedLog = createMockLog({
        approvedAt: new Date('2024-01-15T12:00:00Z'),
      });

      const commissions = [
        createMockCommission({
          salesId: 'sales-1',
          commissionAmount: 100,
          status: 'matched',
          matchedLog,
        }),
        createMockCommission({
          id: 'commission-2',
          salesId: 'sales-1',
          commissionAmount: 150,
          status: 'matched',
          matchedLog,
        }),
        createMockCommission({
          id: 'commission-3',
          salesId: 'sales-2',
          commissionAmount: 200,
          status: 'matched',
          matchedLog,
        }),
      ];

      const totals = calculateCommissionTotals(
        commissions,
        payPeriodStart,
        payPeriodEnd
      );

      expect(totals.get('sales-1')).toBe(250);
      expect(totals.get('sales-2')).toBe(200);
    });

    it('should exclude commissions outside pay period', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const outsideLog = createMockLog({
        approvedAt: new Date('2024-02-15T12:00:00Z'),
      });

      const commissions = [
        createMockCommission({
          salesId: 'sales-1',
          commissionAmount: 100,
          status: 'matched',
          matchedLog: outsideLog,
        }),
      ];

      const totals = calculateCommissionTotals(
        commissions,
        payPeriodStart,
        payPeriodEnd
      );

      expect(totals.get('sales-1')).toBeUndefined();
    });

    it('should exclude non-matched commissions', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const commissions = [
        createMockCommission({
          salesId: 'sales-1',
          commissionAmount: 100,
          status: 'pending',
        }),
      ];

      const totals = calculateCommissionTotals(
        commissions,
        payPeriodStart,
        payPeriodEnd
      );

      expect(totals.get('sales-1')).toBeUndefined();
    });

    it('should handle commissions without matched log', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const commissions = [
        createMockCommission({
          salesId: 'sales-1',
          commissionAmount: 100,
          status: 'matched',
          matchedLog: null,
        }),
      ];

      const totals = calculateCommissionTotals(
        commissions,
        payPeriodStart,
        payPeriodEnd
      );

      expect(totals.get('sales-1')).toBeUndefined();
    });
  });

  describe('calculateLaborBonusesTotals', () => {
    it('should calculate bonus for captain under goal', () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        junkBonusGoal: 0.2,
      });

      const employee = createMockUser({ id: 'emp-1', rateJunkWingman: 15 });

      const log = createMockLog({
        captain,
        jobs: [createMockJob({ jobType: 'junk', revenue: 1000 })],
        hours: [
          createMockHour({
            employeeId: 'emp-1',
            employee,
            department: 'junk',
            hours: 8,
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([log]);

      expect(bonuses.get('captain-1')).toBeCloseTo(80, 2);
    });

    it('should handle both junk and move bonuses', () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        junkBonusGoal: 0.2,
        moveBonusGoal: 0.3,
      });

      const employee = createMockUser({ id: 'emp-1' });

      const log = createMockLog({
        captain,
        jobs: [
          createMockJob({ jobType: 'junk', revenue: 1000 }),
          createMockJob({ jobType: 'move', revenue: 2000 }),
        ],
        hours: [
          createMockHour({
            employeeId: 'emp-1',
            employee,
            department: 'junk',
            hours: 8,
          }),
          createMockHour({
            employeeId: 'emp-1',
            employee,
            department: 'move',
            hours: 20,
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([log]);

      expect(bonuses.get('captain-1')).toBeCloseTo(340, 2);
    });

    it('should not give bonus to non-captains', () => {
      const wingman = createMockUser({
        id: 'wingman-1',
        roles: ['wingman'],
      });

      const log = createMockLog({
        captain: wingman,
        jobs: [createMockJob({ jobType: 'junk', revenue: 1000 })],
        hours: [
          createMockHour({
            employeeId: 'wingman-1',
            department: 'junk',
            hours: 5,
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([log]);

      expect(bonuses.get('wingman-1')).toBeUndefined();
    });

    it('should not give bonus when over goal', () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        junkBonusGoal: 0.1,
      });

      const employee = createMockUser({ id: 'emp-1', rateJunkWingman: 15 });

      const log = createMockLog({
        captain,
        jobs: [createMockJob({ jobType: 'junk', revenue: 1000 })],
        hours: [
          createMockHour({
            employeeId: 'emp-1',
            employee,
            department: 'junk',
            hours: 10,
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([log]);

      expect(bonuses.get('captain-1')).toBeUndefined();
    });
  });

  describe('calculatePayroll - Integration', () => {
    it('should calculate comprehensive payroll for multiple employees', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        rateJunkCaptain: 20,
        junkBonusGoal: 0.3,
      });

      const wingman = createMockUser({
        id: 'wingman-1',
        roles: ['wingman'],
        rateJunkWingman: 15,
      });

      const salesPerson = createMockUser({
        id: 'sales-1',
        roles: ['sales'],
        commissionRate: 10,
      });

      const users = [captain, wingman, salesPerson];

      const log = createMockLog({
        captain,
        approvedAt: new Date('2024-01-15T12:00:00Z'),
        jobs: [createMockJob({ jobType: 'junk', revenue: 1000, tips: 200 })],
        hours: [
          createMockHour({
            employeeId: 'captain-1',
            employee: captain,
            department: 'junk',
            hours: 8,
          }),
          createMockHour({
            employeeId: 'wingman-1',
            employee: wingman,
            department: 'junk',
            hours: 8,
          }),
        ],
      });

      const matchedLog = createMockLog({
        approvedAt: new Date('2024-01-15T12:00:00Z'),
      });

      const commissions = [
        createMockCommission({
          salesId: 'sales-1',
          commissionAmount: 100,
          status: 'matched',
          matchedLog,
        }),
      ];

      const payroll = calculatePayroll(
        users,
        [log],
        commissions,
        payPeriodStart,
        payPeriodEnd
      );

      expect(payroll).toHaveLength(3);

      const captainPayroll = payroll.find((p) => p.employeeId === 'captain-1')!;
      const wingmanPayroll = payroll.find((p) => p.employeeId === 'wingman-1')!;
      const salesPayroll = payroll.find((p) => p.employeeId === 'sales-1')!;

      expect(captainPayroll.totalHours).toBe(8);
      expect(captainPayroll.grossWages).toBe(160);
      expect(captainPayroll.tips).toBe(100);
      expect(captainPayroll.bonuses).toBeCloseTo(20, 2);

      expect(wingmanPayroll.totalHours).toBe(8);
      expect(wingmanPayroll.grossWages).toBe(120);
      expect(wingmanPayroll.tips).toBe(100);
      expect(wingmanPayroll.bonuses).toBe(0);

      expect(salesPayroll.totalHours).toBe(0);
      expect(salesPayroll.grossWages).toBe(0);
      expect(salesPayroll.tips).toBe(0);
      expect(salesPayroll.commission).toBe(100);
    });

    it('should handle salary employees correctly', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const salaryEmployee = createMockUser({
        id: 'salary-1',
        roles: ['admin'],
        rateAdmin: 20,
        salaryAmount: 1000,
        salaryFrequency: 'weekly',
        salaryType: 'base',
      });

      const log = createMockLog({
        approvedAt: new Date('2024-01-15T12:00:00Z'),
        jobs: [],
        hours: [
          createMockHour({
            employeeId: 'salary-1',
            employee: salaryEmployee,
            department: 'admin',
            hours: 40,
          }),
        ],
      });

      const payroll = calculatePayroll(
        [salaryEmployee],
        [log],
        [],
        payPeriodStart,
        payPeriodEnd
      );

      const salaryPayroll = payroll[0];

      expect(salaryPayroll.totalHours).toBe(40);
      expect(salaryPayroll.grossWages).toBe(0);
      expect(salaryPayroll.breakdown.salaryAmount).toBe(1000);
      expect(salaryPayroll.breakdown.salaryType).toBe('base');
      expect(salaryPayroll.totalPay).toBe(1000);
    });

    it('should filter logs by pay period correctly', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const user = createMockUser({ id: 'user-1' });

      const logInPeriod = createMockLog({
        id: 'log-in',
        approvedAt: new Date('2024-01-15T12:00:00Z'),
        hours: [
          createMockHour({
            employeeId: 'user-1',
            employee: user,
            hours: 8,
          }),
        ],
      });

      const logOutsidePeriod = createMockLog({
        id: 'log-out',
        approvedAt: new Date('2024-02-15T12:00:00Z'),
        hours: [
          createMockHour({
            employeeId: 'user-1',
            employee: user,
            hours: 8,
          }),
        ],
      });

      const logNotApproved = createMockLog({
        id: 'log-not-approved',
        approvedAt: null,
        hours: [
          createMockHour({
            employeeId: 'user-1',
            employee: user,
            hours: 8,
          }),
        ],
      });

      const payroll = calculatePayroll(
        [user],
        [logInPeriod, logOutsidePeriod, logNotApproved],
        [],
        payPeriodStart,
        payPeriodEnd
      );

      expect(payroll[0].totalHours).toBe(8); // Only the log in period
    });
  });

  describe('Performance Metrics', () => {
    describe('calculateJunkPerformanceMetrics', () => {
      it('should calculate comprehensive junk metrics', () => {
        const captain = createMockUser({
          id: 'captain-1',
          roles: ['captain'],
        });

        const employee = createMockUser({ id: 'emp-1', rateJunkWingman: 15 });

        const logs = [
          createMockLog({
            captainId: 'captain-1',
            captain,
            jobs: [
              createMockJob({
                jobType: 'junk',
                revenue: 1000,
                disposalCost: 100,
              }),
              createMockJob({
                jobType: 'junk',
                revenue: 1500,
                disposalCost: 200,
              }),
            ],
            hours: [
              createMockHour({
                employeeId: 'emp-1',
                employee,
                department: 'junk',
                hours: 8,
              }),
              createMockHour({
                employeeId: 'captain-1',
                employee: captain,
                department: 'junk',
                hours: 8,
              }),
            ],
          }),
        ];

        const metrics = calculateJunkPerformanceMetrics(captain, logs);

        expect(metrics.jobCount).toBe(2);
        expect(metrics.totalRevenue).toBe(2500);
        expect(metrics.averageJobSize).toBe(1250);
        expect(metrics.laborPercentage).toBeCloseTo(0.112, 3);
        expect(metrics.disposalPercentage).toBeCloseTo(0.12, 3);
      });

      it('should handle zero revenue gracefully', () => {
        const captain = createMockUser({
          id: 'captain-1',
          roles: ['captain'],
        });

        const logs = [
          createMockLog({
            captainId: 'captain-1',
            captain,
            jobs: [],
            hours: [],
          }),
        ];

        const metrics = calculateJunkPerformanceMetrics(captain, logs);

        expect(metrics.jobCount).toBe(0);
        expect(metrics.totalRevenue).toBe(0);
        expect(metrics.averageJobSize).toBe(0);
        expect(metrics.laborPercentage).toBe(0);
        expect(metrics.disposalPercentage).toBe(0);
      });
    });

    describe('calculateMovePerformanceMetrics', () => {
      it('should calculate comprehensive move metrics', () => {
        const captain = createMockUser({
          id: 'captain-1',
          roles: ['captain'],
        });

        const employee = createMockUser({ id: 'emp-1', rateMoveWingman: 17 });

        const logs = [
          createMockLog({
            captainId: 'captain-1',
            captain,
            jobs: [
              createMockJob({
                jobType: 'move',
                revenue: 2000,
                valuation: 500,
                junkOnMove: 300,
                materials: 200,
              }),
              createMockJob({
                jobType: 'move',
                revenue: 1500,
                valuation: 400,
                junkOnMove: 200,
                materials: 100,
              }),
            ],
            hours: [
              createMockHour({
                employeeId: 'emp-1',
                employee,
                department: 'move',
                hours: 10,
              }),
              createMockHour({
                employeeId: 'captain-1',
                employee: captain,
                department: 'move',
                hours: 10,
              }),
            ],
          }),
        ];

        const metrics = calculateMovePerformanceMetrics(captain, logs);

        expect(metrics.jobCount).toBe(2);
        expect(metrics.totalRevenue).toBe(3500);
        expect(metrics.averageJobSize).toBe(1750);
        expect(metrics.laborPercentage).toBeCloseTo(0.111, 3);
        expect(metrics.upsellRevenue).toBe(1800);
        expect(metrics.upsellPercentage).toBeCloseTo(0.514, 3);
        expect(metrics.valuationRevenue).toBe(900);
        expect(metrics.junkOnMoveRevenue).toBe(500);
        expect(metrics.materialsRevenue).toBe(300);
      });
    });

    describe('calculateCaptainPerformanceMetrics', () => {
      it('should calculate comprehensive captain performance', () => {
        const captain = createMockUser({
          id: 'captain-1',
          roles: ['captain'],
          fullName: 'Captain Test',
        });

        const employee = createMockUser({ id: 'emp-1' });

        const logs = [
          createMockLog({
            captainId: 'captain-1',
            captain,
            logDate: new Date('2024-01-15'),
            jobs: [
              createMockJob({
                jobType: 'junk',
                revenue: 1000,
                disposalCost: 100,
              }),
              createMockJob({
                jobType: 'move',
                revenue: 2000,
                valuation: 500,
                junkOnMove: 300,
                materials: 200,
              }),
            ],
            hours: [
              createMockHour({
                employeeId: 'emp-1',
                employee,
                department: 'junk',
                hours: 8,
              }),
              createMockHour({
                employeeId: 'emp-1',
                employee,
                department: 'move',
                hours: 10,
              }),
            ],
          }),
        ];

        const performance = calculateCaptainPerformanceMetrics(captain, logs);

        expect(performance.captainId).toBe('captain-1');
        expect(performance.captainName).toBe('Captain Test');
        expect(performance.junkMetrics.jobCount).toBe(1);
        expect(performance.junkMetrics.totalRevenue).toBe(1000);
        expect(performance.moveMetrics.jobCount).toBe(1);
        expect(performance.moveMetrics.totalRevenue).toBe(2000);
      });

      it('should filter by date range when provided', () => {
        const captain = createMockUser({
          id: 'captain-1',
          roles: ['captain'],
        });

        const logs = [
          createMockLog({
            captainId: 'captain-1',
            captain,
            logDate: new Date('2024-01-10'),
            jobs: [createMockJob({ jobType: 'junk', revenue: 1000 })],
            hours: [],
          }),
          createMockLog({
            captainId: 'captain-1',
            captain,
            logDate: new Date('2024-01-20'),
            jobs: [createMockJob({ jobType: 'junk', revenue: 2000 })],
            hours: [],
          }),
          createMockLog({
            captainId: 'captain-1',
            captain,
            logDate: new Date('2024-02-10'),
            jobs: [createMockJob({ jobType: 'junk', revenue: 3000 })],
            hours: [],
          }),
        ];

        const filters = {
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-31'),
        };

        const performance = calculateCaptainPerformanceMetrics(
          captain,
          logs,
          filters
        );

        expect(performance.junkMetrics.jobCount).toBe(1);
        expect(performance.junkMetrics.totalRevenue).toBe(2000);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null/undefined values gracefully', () => {
      const user = createMockUser({
        rateJunkCaptain: undefined,
        rateJunkWingman: null as any,
        salaryAmount: undefined,
      });

      expect(calculateHourlyWage(user, 'junk', false)).toBe(0);
      expect(calculateHourlyWage(user, 'junk', true)).toBe(0);

      const result = applySalaryRules(user, 800, 100, 50, 25);
      expect(result.finalPay).toBe(975);
      expect(result.salaryAmount).toBe(0);
    });

    it('should handle empty arrays', () => {
      const tipDistribution = calculateTipDistribution([]);
      expect(tipDistribution.size).toBe(0);

      const commissionTotals = calculateCommissionTotals(
        [],
        new Date(),
        new Date()
      );
      expect(commissionTotals.size).toBe(0);

      const bonusTotals = calculateLaborBonusesTotals([]);
      expect(bonusTotals.size).toBe(0);
    });

    it('should handle very large numbers', () => {
      const bonus = calculateLaborBonus(
        createMockUser({ roles: ['captain'] }),
        0.1,
        0.2,
        1000000
      );
      expect(bonus).toBe(100000);

      const tipsPerHunk = calculateTipsPerHunk(1000000, 100);
      expect(tipsPerHunk).toBe(10000);
    });

    it('should handle very small numbers', () => {
      const bonus = calculateLaborBonus(
        createMockUser({ roles: ['captain'] }),
        0.001,
        0.002,
        0.01
      );
      expect(bonus).toBeCloseTo(0.00001, 5);
    });
  });
});
