import {
  calculatePayroll,
  calculateTipDistribution,
  calculateCommissionTotals,
  calculateLaborBonusesTotals,
  applySalaryRules,
  convertSalaryToWeekly,
  calculateHourlyWage,
} from '@/lib/payCalculator';
import type { User, DailyLog, LogJob, LogHour, CommissionEntry, Department } from '@/types';

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

const createMockCommission = (overrides: Partial<CommissionEntry> = {}): CommissionEntry => ({
  id: 'commission-1',
  salesId: 'sales-1',
  sales: createMockUser({ id: 'sales-1', roles: ['sales'] }),
  jobId: 'JOB123',
  clientName: 'Test Client',
  jobType: 'junk',
  targetDate: new Date('2024-01-15'),
  estimatedRevenue: 1000,
  actualRevenue: 1200,
  commissionAmount: 120,
  status: 'matched',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('Payroll Calculation Engine', () => {
  describe('calculateHourlyWage', () => {
    it('should use wingman rate for regular employees', () => {
      const user = createMockUser({ roles: ['wingman'] });
      expect(calculateHourlyWage(user, 'junk', false)).toBe(15);
      expect(calculateHourlyWage(user, 'move', false)).toBe(17);
    });

    it('should use captain rate for captains', () => {
      const user = createMockUser({ roles: ['captain'] });
      expect(calculateHourlyWage(user, 'junk', false)).toBe(20);
      expect(calculateHourlyWage(user, 'move', false)).toBe(22);
    });

    it('should use captain rate for co-captains', () => {
      const user = createMockUser({ roles: ['wingman'] });
      expect(calculateHourlyWage(user, 'junk', true)).toBe(20);
      expect(calculateHourlyWage(user, 'move', true)).toBe(22);
    });

    it('should handle all department types', () => {
      const user = createMockUser();
      expect(calculateHourlyWage(user, 'zigma', false)).toBe(18);
      expect(calculateHourlyWage(user, 'training', false)).toBe(16);
      expect(calculateHourlyWage(user, 'estimating', false)).toBe(25);
      expect(calculateHourlyWage(user, 'warehouse', false)).toBe(14);
      expect(calculateHourlyWage(user, 'admin', false)).toBe(20);
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
  });

  describe('applySalaryRules', () => {
    const baseUser = createMockUser();

    it('should handle no salary (hourly only)', () => {
      const result = applySalaryRules(baseUser, 800, 100, 50, 25);
      
      expect(result.finalPay).toBe(975); // 800 + 100 + 50 + 25
      expect(result.hourlyWages).toBe(800);
      expect(result.salaryAmount).toBe(0);
      expect(result.salaryType).toBeNull();
    });

    it('should handle base salary', () => {
      const user = createMockUser({
        salaryAmount: 1000,
        salaryFrequency: 'weekly',
        salaryType: 'base',
      });
      
      const result = applySalaryRules(user, 800, 100, 50, 25);
      
      expect(result.finalPay).toBe(1175); // 1000 + 100 + 50 + 25 (no hourly wages)
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
      
      const result = applySalaryRules(user, 800, 100, 50, 25); // Total: 975
      
      expect(result.finalPay).toBe(1200); // Guaranteed amount is higher
      expect(result.hourlyWages).toBe(800);
      expect(result.salaryAmount).toBe(1200);
      expect(result.salaryType).toBe('guaranteed');
    });

    it('should handle guaranteed salary when calculated is higher', () => {
      const user = createMockUser({
        salaryAmount: 900,
        salaryFrequency: 'weekly',
        salaryType: 'guaranteed',
      });
      
      const result = applySalaryRules(user, 800, 100, 50, 25); // Total: 975
      
      expect(result.finalPay).toBe(975); // Calculated amount is higher
      expect(result.hourlyWages).toBe(800);
      expect(result.salaryAmount).toBe(0); // No salary supplement needed
      expect(result.salaryType).toBe('guaranteed');
    });

    it('should handle supplemental salary', () => {
      const user = createMockUser({
        salaryAmount: 200,
        salaryFrequency: 'weekly',
        salaryType: 'supplemental',
      });
      
      const result = applySalaryRules(user, 800, 100, 50, 25);
      
      expect(result.finalPay).toBe(1175); // 975 + 200
      expect(result.hourlyWages).toBe(800);
      expect(result.salaryAmount).toBe(200);
      expect(result.salaryType).toBe('supplemental');
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
      
      expect(tipDistribution.get('emp-1')).toBe(150); // 300 total / 2 employees
      expect(tipDistribution.get('emp-2')).toBe(150);
    });

    it('should handle multiple sections per employee', () => {
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
      
      expect(tipDistribution.get('emp-1')).toBe(300); // 100 from junk + 200 from move
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
      
      expect(tipDistribution.get('emp-1')).toBe(300); // 100 + 200
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
          salesId: 'sales-1',
          commissionAmount: 150,
          status: 'matched',
          matchedLog,
        }),
        createMockCommission({
          salesId: 'sales-2',
          commissionAmount: 200,
          status: 'matched',
          matchedLog,
        }),
      ];

      const totals = calculateCommissionTotals(commissions, payPeriodStart, payPeriodEnd);
      
      expect(totals.get('sales-1')).toBe(250); // 100 + 150
      expect(totals.get('sales-2')).toBe(200);
    });

    it('should exclude commissions outside pay period', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');
      
      const outsideLog = createMockLog({
        approvedAt: new Date('2024-02-15T12:00:00Z'), // Outside period
      });

      const commissions = [
        createMockCommission({
          salesId: 'sales-1',
          commissionAmount: 100,
          status: 'matched',
          matchedLog: outsideLog,
        }),
      ];

      const totals = calculateCommissionTotals(commissions, payPeriodStart, payPeriodEnd);
      
      expect(totals.get('sales-1')).toBeUndefined();
    });

    it('should exclude non-matched commissions', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');
      
      const commissions = [
        createMockCommission({
          salesId: 'sales-1',
          commissionAmount: 100,
          status: 'pending', // Not matched
        }),
      ];

      const totals = calculateCommissionTotals(commissions, payPeriodStart, payPeriodEnd);
      
      expect(totals.get('sales-1')).toBeUndefined();
    });
  });

  describe('calculateLaborBonusesTotals', () => {
    it('should calculate bonus for captain under goal', () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        junkBonusGoal: 0.20, // 20% goal
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
            hours: 8, // 8 * 15 = 120 labor cost
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([log]);
      
      // Labor cost: 120, Revenue: 1000, Actual %: 12%, Goal: 20%
      // Bonus: (20% - 12%) * 1000 = 80
      expect(bonuses.get('captain-1')).toBeCloseTo(80, 2);
    });

    it('should not give bonus when over goal', () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        junkBonusGoal: 0.10, // 10% goal
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
            hours: 10, // 10 * 15 = 150 labor cost = 15%
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([log]);
      
      // Labor cost: 150, Revenue: 1000, Actual %: 15%, Goal: 10%
      // No bonus because over goal
      expect(bonuses.get('captain-1')).toBeUndefined();
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
            hours: 5, // Low labor cost
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([log]);
      
      expect(bonuses.get('wingman-1')).toBeUndefined();
    });

    it('should handle both junk and move bonuses', () => {
      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        junkBonusGoal: 0.20,
        moveBonusGoal: 0.30,
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
            hours: 8, // 8 * 15 = 120 = 12%
          }),
          createMockHour({
            employeeId: 'emp-1',
            employee,
            department: 'move',
            hours: 20, // 20 * 17 = 340 = 17%
          }),
        ],
      });

      const bonuses = calculateLaborBonusesTotals([log]);
      
      // Junk bonus: (20% - 12%) * 1000 = 80
      // Move bonus: (30% - 17%) * 2000 = 260
      // Total: 340
      expect(bonuses.get('captain-1')).toBeCloseTo(340, 2);
    });
  });

  describe('calculatePayroll', () => {
    it('should calculate comprehensive payroll for multiple employees', () => {
      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const captain = createMockUser({
        id: 'captain-1',
        roles: ['captain'],
        rateJunkCaptain: 20,
        junkBonusGoal: 0.30, // 30% goal to ensure bonus (actual will be 28%)
      });

      const wingman = createMockUser({
        id: 'wingman-1',
        roles: ['wingman'],
        rateJunkWingman: 15,
      });

      const salesPerson = createMockUser({
        id: 'sales-1',
        roles: ['sales'],
        commissionRate: 0.10,
      });

      const users = [captain, wingman, salesPerson];

      const log = createMockLog({
        captain,
        approvedAt: new Date('2024-01-15T12:00:00Z'),
        jobs: [
          createMockJob({ jobType: 'junk', revenue: 1000, tips: 200 }),
        ],
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

      // Find each employee's payroll
      const captainPayroll = payroll.find(p => p.employeeId === 'captain-1')!;
      const wingmanPayroll = payroll.find(p => p.employeeId === 'wingman-1')!;
      const salesPayroll = payroll.find(p => p.employeeId === 'sales-1')!;

      // Captain: 8 hours * $20 = $160 wages + $100 tips + bonus
      expect(captainPayroll.totalHours).toBe(8);
      expect(captainPayroll.grossWages).toBe(160);
      expect(captainPayroll.tips).toBe(100); // 200 tips / 2 employees
      
      // Labor cost: 280 (160 + 120), Revenue: 1000, Actual %: 28%, Goal: 30%
      // Bonus: (30% - 28%) * 1000 = 20
      expect(captainPayroll.bonuses).toBeCloseTo(20, 2);

      // Wingman: 8 hours * $15 = $120 wages + $100 tips
      expect(wingmanPayroll.totalHours).toBe(8);
      expect(wingmanPayroll.grossWages).toBe(120);
      expect(wingmanPayroll.tips).toBe(100);
      expect(wingmanPayroll.bonuses).toBe(0); // No bonus for wingman

      // Sales person: $0 wages + $0 tips + $100 commission
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
      expect(salaryPayroll.grossWages).toBe(0); // Base salary replaces hourly
      expect(salaryPayroll.breakdown.salaryAmount).toBe(1000);
      expect(salaryPayroll.breakdown.salaryType).toBe('base');
      expect(salaryPayroll.totalPay).toBe(1000); // Just salary, no tips/commission
    });
  });
});