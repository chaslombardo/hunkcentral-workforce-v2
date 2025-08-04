import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateEnhancedPayroll,
  calculateHourlyWage
} from '@/lib/payCalculator';
import { 
  getDetailedPayrollBreakdown,
  validateEnhancedPayrollBreakdown,
  validateEnhancedPayrollBreakdownSync as validatePayrollAction
} from '@/lib/actions/payroll';
import type { User, DailyLog, CommissionEntry, Department } from '@/types';

// Mock user data
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['captain'],
  rateJunkCaptain: 20,
  rateJunkWingman: 18,
  rateMoveCaptain: 22,
  rateMoveWingman: 20,
  rateZigma: 25,
  rateTraining: 15,
  rateEstimating: 30,
  rateWarehouse: 16,
  rateAdmin: 18,
  salaryAmount: null,
  salaryFrequency: null,
  salaryType: null,
  commissionRate: 0.05,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
  password: 'hashed',
};

// Mock daily log data
const mockDailyLog: DailyLog = {
  id: 'log-1',
  captainId: 'user-1',
  captain: mockUser,
  logDate: new Date('2025-01-15'),
  status: 'approved',
  submittedAt: new Date('2025-01-15T18:00:00Z'),
  approvedAt: new Date('2025-01-15T20:00:00Z'),
  approvedById: 'manager-1',
  createdById: 'user-1',
  lastEditedById: null,
  createdAt: new Date('2025-01-15T16:00:00Z'),
  updatedAt: new Date('2025-01-15T20:00:00Z'),
  jobs: [
    {
      id: 'job-1',
      logId: 'log-1',
      jobType: 'junk',
      jobId: 'J12345',
      clientName: 'John Smith',
      revenue: 500,
      tips: 60,
      junkOnMove: null,
      valuation: null,
      materials: null,
      disposalCost: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'job-2',
      logId: 'log-1',
      jobType: 'move',
      jobId: 'M67890',
      clientName: 'Jane Doe',
      revenue: 800,
      tips: 80,
      junkOnMove: 100,
      valuation: 5000,
      materials: 50,
      disposalCost: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  hours: [
    {
      id: 'hour-1',
      logId: 'log-1',
      employeeId: 'user-1',
      employee: mockUser,
      department: 'junk',
      hours: 4,
      isCoCaptain: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'hour-2',
      logId: 'log-1',
      employeeId: 'user-1',
      employee: mockUser,
      department: 'move',
      hours: 4,
      isCoCaptain: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'hour-3',
      logId: 'log-1',
      employeeId: 'user-2',
      employee: {
        ...mockUser,
        id: 'user-2',
        roles: ['wingman'],
      },
      department: 'junk',
      hours: 4,
      isCoCaptain: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'hour-4',
      logId: 'log-1',
      employeeId: 'user-2',
      employee: {
        ...mockUser,
        id: 'user-2',
        roles: ['wingman'],
      },
      department: 'move',
      hours: 4,
      isCoCaptain: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
};

const mockCommissionEntries: CommissionEntry[] = [
  {
    id: 'comm-1',
    salesId: 'user-1',
    jobId: 'J12345',
    clientName: 'John Smith',
    jobType: 'junk',
    targetDate: new Date('2025-01-15'),
    estimatedRevenue: 450,
    actualRevenue: 500,
    commissionAmount: 25,
    status: 'matched',
    matchedLogId: 'log-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('Enhanced Payroll Calculations', () => {
  const payPeriodStart = new Date('2025-01-13');
  const payPeriodEnd = new Date('2025-01-19');

  describe('calculateHourlyWage', () => {
    it('should calculate correct captain rate for junk department', () => {
      const rate = calculateHourlyWage(mockUser, 'junk', false);
      expect(rate).toBe(20); // Captain rate since user has captain role
    });

    it('should calculate correct wingman rate for wingman user', () => {
      const wingmanUser = { ...mockUser, roles: ['wingman'] };
      const rate = calculateHourlyWage(wingmanUser, 'junk', false);
      expect(rate).toBe(18); // Wingman rate
    });

    it('should calculate correct co-captain rate', () => {
      const wingmanUser = { ...mockUser, roles: ['wingman'] };
      const rate = calculateHourlyWage(wingmanUser, 'junk', true);
      expect(rate).toBe(20); // Captain rate due to co-captain status
    });

    it('should handle departments without captain/wingman rates', () => {
      const rate = calculateHourlyWage(mockUser, 'admin', false);
      expect(rate).toBe(18); // Admin rate
    });
  });

  describe('calculateEnhancedPayroll', () => {
    it('should calculate department breakdown correctly', () => {
      const result = calculateEnhancedPayroll(
        mockUser,
        [mockDailyLog as any],
        mockCommissionEntries as any,
        payPeriodStart,
        payPeriodEnd
      );

      expect(result.departmentBreakdown.junk.hours).toBe(4);
      expect(result.departmentBreakdown.move.hours).toBe(4);
      expect(result.departmentBreakdown.junk.rate).toBe(20); // Captain rate
      expect(result.departmentBreakdown.move.rate).toBe(22); // Captain rate
      expect(result.departmentBreakdown.junk.grossPay).toBe(80); // 4 hours * $20
      expect(result.departmentBreakdown.move.grossPay).toBe(88); // 4 hours * $22
    });

    it('should calculate daily breakdown correctly', () => {
      const result = calculateEnhancedPayroll(
        mockUser,
        [mockDailyLog as any],
        mockCommissionEntries as any,
        payPeriodStart,
        payPeriodEnd
      );

      const dateKey = '2025-01-15';
      expect(result.dailyBreakdown[dateKey]).toBeDefined();
      expect(result.dailyBreakdown[dateKey].departments.junk).toBe(4);
      expect(result.dailyBreakdown[dateKey].departments.move).toBe(4);
      expect(result.dailyBreakdown[dateKey].totalHours).toBe(8);
      expect(result.dailyBreakdown[dateKey].tips).toBe(70); // (60/2) + (80/2) = 30 + 40
    });

    it('should calculate tips breakdown correctly', () => {
      const result = calculateEnhancedPayroll(
        mockUser,
        [mockDailyLog as any],
        mockCommissionEntries as any,
        payPeriodStart,
        payPeriodEnd
      );

      expect(result.tipsBreakdown).toHaveLength(2);
      
      const junkTip = result.tipsBreakdown.find(tip => tip.jobType === 'junk');
      expect(junkTip).toBeDefined();
      expect(junkTip!.totalJobTips).toBe(60);
      expect(junkTip!.teamMembers).toBe(2);
      expect(junkTip!.myShare).toBe(30);

      const moveTip = result.tipsBreakdown.find(tip => tip.jobType === 'move');
      expect(moveTip).toBeDefined();
      expect(moveTip!.totalJobTips).toBe(80);
      expect(moveTip!.teamMembers).toBe(2);
      expect(moveTip!.myShare).toBe(40);
    });

    it('should calculate rate schedule correctly', () => {
      const result = calculateEnhancedPayroll(
        mockUser,
        [mockDailyLog as any],
        mockCommissionEntries as any,
        payPeriodStart,
        payPeriodEnd
      );

      expect(result.rateSchedule.junk.captainRate).toBe(20);
      expect(result.rateSchedule.junk.wingmanRate).toBe(18);
      expect(result.rateSchedule.junk.currentRate).toBe(20); // Captain rate

      expect(result.rateSchedule.move.captainRate).toBe(22);
      expect(result.rateSchedule.move.wingmanRate).toBe(20);
      expect(result.rateSchedule.move.currentRate).toBe(22); // Captain rate

      expect(result.rateSchedule.admin.currentRate).toBe(18);
      expect(result.rateSchedule.admin.captainRate).toBeUndefined();
      expect(result.rateSchedule.admin.wingmanRate).toBeUndefined();
    });

    it('should calculate percentages correctly', () => {
      const result = calculateEnhancedPayroll(
        mockUser,
        [mockDailyLog as any],
        mockCommissionEntries as any,
        payPeriodStart,
        payPeriodEnd
      );

      expect(result.departmentBreakdown.junk.percentage).toBe(50); // 4/8 hours
      expect(result.departmentBreakdown.move.percentage).toBe(50); // 4/8 hours
      expect(result.departmentBreakdown.admin.percentage).toBe(0); // 0/8 hours
    });
  });

  describe('validateEnhancedPayrollBreakdownSync', () => {
    it('should validate correct payroll breakdown', () => {
      const mockData = {
        employeeId: 'user-1',
        employee: mockUser,
        totalHours: 8,
        totalPay: 263, // 168 wages + 70 tips + 25 commission + 0 bonuses
        grossWages: 168, // 80 + 88
        tips: 70,
        commission: 25,
        bonuses: 0,
        departmentBreakdown: [
          {
            department: 'junk' as Department,
            hours: 4,
            rate: 20,
            grossPay: 80,
            percentage: 50,
            isPrimary: false,
          },
          {
            department: 'move' as Department,
            hours: 4,
            rate: 22,
            grossPay: 88,
            percentage: 50,
            isPrimary: false,
          },
        ],
        dailyWorkHistory: [
          {
            date: new Date('2025-01-15'),
            departments: [
              { department: 'junk' as Department, hours: 4, rate: 20 },
              { department: 'move' as Department, hours: 4, rate: 22 },
            ],
            tips: 70,
            logIds: ['log-1'],
            role: 'captain' as const,
          },
        ],
        tipsDetails: [
          {
            date: new Date('2025-01-15'),
            jobId: 'J12345',
            clientName: 'John Smith',
            totalJobTips: 60,
            teamMembers: 2,
            myShare: 30,
            jobType: 'junk' as const,
            logId: 'log-1',
          },
          {
            date: new Date('2025-01-15'),
            jobId: 'M67890',
            clientName: 'Jane Doe',
            totalJobTips: 80,
            teamMembers: 2,
            myShare: 40,
            jobType: 'move' as const,
            logId: 'log-1',
          },
        ],
        rateInformation: {
          junk: { captainRate: 20, wingmanRate: 18, currentRate: 20 },
          move: { captainRate: 22, wingmanRate: 20, currentRate: 22 },
          admin: { currentRate: 18 },
        },
      };

      const validation = validatePayrollAction(mockData);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect department hours mismatch', () => {
      const mockData = {
        employeeId: 'user-1',
        employee: mockUser,
        totalHours: 10, // Incorrect total
        totalPay: 193,
        grossWages: 168,
        tips: 70,
        commission: 25,
        bonuses: 0,
        departmentBreakdown: [
          {
            department: 'junk' as Department,
            hours: 4,
            rate: 20,
            grossPay: 80,
            percentage: 50,
            isPrimary: false,
          },
          {
            department: 'move' as Department,
            hours: 4,
            rate: 22,
            grossPay: 88,
            percentage: 50,
            isPrimary: false,
          },
        ],
        dailyWorkHistory: [],
        tipsDetails: [],
        rateInformation: {},
      };

      const validation = validatePayrollAction(mockData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Department hours do not match total hours');
    });

    it('should detect tips breakdown mismatch', () => {
      const mockData = {
        employeeId: 'user-1',
        employee: mockUser,
        totalHours: 8,
        totalPay: 193,
        grossWages: 168,
        tips: 100, // Incorrect total
        commission: 25,
        bonuses: 0,
        departmentBreakdown: [
          {
            department: 'junk' as Department,
            hours: 4,
            rate: 20,
            grossPay: 80,
            percentage: 50,
            isPrimary: false,
          },
          {
            department: 'move' as Department,
            hours: 4,
            rate: 22,
            grossPay: 88,
            percentage: 50,
            isPrimary: false,
          },
        ],
        dailyWorkHistory: [],
        tipsDetails: [
          {
            date: new Date('2025-01-15'),
            jobId: 'J12345',
            clientName: 'John Smith',
            totalJobTips: 60,
            teamMembers: 2,
            myShare: 30,
            jobType: 'junk' as const,
            logId: 'log-1',
          },
          {
            date: new Date('2025-01-15'),
            jobId: 'M67890',
            clientName: 'Jane Doe',
            totalJobTips: 80,
            teamMembers: 2,
            myShare: 40,
            jobType: 'move' as const,
            logId: 'log-1',
          },
        ],
        rateInformation: {},
      };

      const validation = validatePayrollAction(mockData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Tips breakdown does not match total tips');
    });
  });
});