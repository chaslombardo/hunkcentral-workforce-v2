/**
 * Integration tests for payroll calculation workflow
 * Tests complete payroll generation with mixed compensation models
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { calculatePayroll } from '@/lib/payCalculator';
import { submitLog, approveLog } from '@/lib/actions/logs';
import { createCommissionEntry } from '@/lib/actions/commission';
import type { DailyLogFormData } from '@/lib/validations';
import type { User, DailyLog, CommissionEntry } from '@/types';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const { auth } = await import('@/lib/auth');

describe('Payroll Workflow Integration', () => {
  const managerUser = {
    user: {
      id: 'payroll-manager-id',
      email: 'payroll-manager@test.com',
      fullName: 'Payroll Manager',
      roles: ['manager'],
    },
  };

  const salesUser = {
    user: {
      id: 'payroll-sales-id',
      email: 'payroll-sales@test.com',
      fullName: 'Payroll Sales',
      roles: ['sales'],
    },
  };

  beforeAll(async () => {
    // Create test users with different compensation models
    await prisma.user.createMany({
      data: [
        // Hourly captain with bonuses
        {
          id: 'payroll-captain-id',
          email: 'payroll-captain@test.com',
          password: 'hashedpassword',
          fullName: 'Payroll Captain',
          roles: ['captain'],
          rateJunkCaptain: 22.00,
          rateJunkWingman: 16.00,
          rateMoveCaptain: 25.00,
          rateMoveWingman: 18.00,
          junkBonusGoal: 0.15, // 15% goal for bonus testing
          moveBonusGoal: 0.25, // 25% goal for bonus testing
        },
        // Hourly wingman
        {
          id: 'payroll-wingman-id',
          email: 'payroll-wingman@test.com',
          password: 'hashedpassword',
          fullName: 'Payroll Wingman',
          roles: ['wingman'],
          rateJunkWingman: 16.00,
          rateMoveWingman: 18.00,
        },
        // Base salary employee
        {
          id: 'payroll-salary-base-id',
          email: 'payroll-salary-base@test.com',
          password: 'hashedpassword',
          fullName: 'Base Salary Employee',
          roles: ['admin'],
          rateAdmin: 20.00,
          salaryAmount: 1000.00,
          salaryFrequency: 'weekly',
          salaryType: 'base',
        },
        // Guaranteed salary employee
        {
          id: 'payroll-salary-guaranteed-id',
          email: 'payroll-salary-guaranteed@test.com',
          password: 'hashedpassword',
          fullName: 'Guaranteed Salary Employee',
          roles: ['estimating'],
          rateEstimating: 25.00,
          salaryAmount: 800.00,
          salaryFrequency: 'weekly',
          salaryType: 'guaranteed',
        },
        // Supplemental salary employee
        {
          id: 'payroll-salary-supplemental-id',
          email: 'payroll-salary-supplemental@test.com',
          password: 'hashedpassword',
          fullName: 'Supplemental Salary Employee',
          roles: ['warehouse'],
          rateWarehouse: 18.00,
          salaryAmount: 200.00,
          salaryFrequency: 'weekly',
          salaryType: 'supplemental',
        },
        // Sales with commission
        {
          id: 'payroll-sales-id',
          email: 'payroll-sales@test.com',
          password: 'hashedpassword',
          fullName: 'Payroll Sales',
          roles: ['sales'],
          commissionRate: 6.0,
          rateAdmin: 15.00,
        },
        // Manager
        {
          id: 'payroll-manager-id',
          email: 'payroll-manager@test.com',
          password: 'hashedpassword',
          fullName: 'Payroll Manager',
          roles: ['manager'],
          rateAdmin: 30.00,
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: {
        userId: {
          in: [
            'payroll-captain-id',
            'payroll-wingman-id',
            'payroll-salary-base-id',
            'payroll-salary-guaranteed-id',
            'payroll-salary-supplemental-id',
            'payroll-sales-id',
            'payroll-manager-id',
          ],
        },
      },
    });
    await prisma.commissionEntry.deleteMany({
      where: { salesId: 'payroll-sales-id' },
    });
    await prisma.logHour.deleteMany({
      where: {
        employeeId: {
          in: [
            'payroll-captain-id',
            'payroll-wingman-id',
            'payroll-salary-base-id',
            'payroll-salary-guaranteed-id',
            'payroll-salary-supplemental-id',
            'payroll-sales-id',
          ],
        },
      },
    });
    await prisma.logJob.deleteMany({});
    await prisma.dailyLog.deleteMany({
      where: {
        captainId: {
          in: ['payroll-captain-id'],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            'payroll-captain-id',
            'payroll-wingman-id',
            'payroll-salary-base-id',
            'payroll-salary-guaranteed-id',
            'payroll-salary-supplemental-id',
            'payroll-sales-id',
            'payroll-manager-id',
          ],
        },
      },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Mixed Compensation Model Payroll', () => {
    it('should calculate payroll correctly for all compensation types', async () => {
      // Step 1: Create commission entries
      vi.mocked(auth).mockResolvedValue(salesUser);

      const commission1Result = await createCommissionEntry({
        salesId: 'payroll-sales-id',
        jobId: 'PAYROLL-JOB-001',
        clientName: 'Payroll Test Client 1',
        jobType: 'junk',
        targetDate: new Date('2024-03-01'),
        estimatedRevenue: 1200,
      });

      const commission2Result = await createCommissionEntry({
        salesId: 'payroll-sales-id',
        jobId: 'PAYROLL-JOB-002',
        clientName: 'Payroll Test Client 2',
        jobType: 'move',
        targetDate: new Date('2024-03-01'),
        estimatedRevenue: 2000,
      });

      expect(commission1Result.success).toBe(true);
      expect(commission2Result.success).toBe(true);

      // Step 2: Create and approve multiple logs with different scenarios
      const captainUser = {
        user: {
          id: 'payroll-captain-id',
          email: 'payroll-captain@test.com',
          fullName: 'Payroll Captain',
          roles: ['captain'],
        },
      };

      vi.mocked(auth).mockResolvedValue(captainUser);

      // Log 1: Junk job with bonus opportunity (low labor cost)
      const log1FormData: DailyLogFormData = {
        captainId: 'payroll-captain-id',
        logDate: new Date('2024-02-01'),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'PAYROLL-JOB-001',
            clientName: 'Payroll Test Client 1',
            revenue: 1500, // Higher than estimated
            tips: 200,
            disposalCost: 75,
          },
        ],
        disposalCost: 75,
        hours: [
          {
            employeeId: 'payroll-captain-id',
            department: 'junk',
            hours: 6, // 6 * 22 = 132
            isCoCaptain: false,
          },
          {
            employeeId: 'payroll-wingman-id',
            department: 'junk',
            hours: 6, // 6 * 16 = 96
            isCoCaptain: false,
          },
          // Total labor cost: 228, Revenue: 1500, Labor %: 15.2% (above 15% goal, no bonus)
        ],
      };

      const log1Result = await submitLog(null, log1FormData);
      expect(log1Result.success).toBe(true);

      // Log 2: Move job with bonus opportunity (low labor cost)
      const log2FormData: DailyLogFormData = {
        captainId: 'payroll-captain-id',
        logDate: new Date('2024-02-02'),
        sections: {
          junk: false,
          move: true,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'move',
            jobId: 'PAYROLL-JOB-002',
            clientName: 'Payroll Test Client 2',
            revenue: 2500, // Higher than estimated
            tips: 300,
            junkOnMove: 150,
            valuation: 100,
            materials: 50,
          },
        ],
        hours: [
          {
            employeeId: 'payroll-captain-id',
            department: 'move',
            hours: 8, // 8 * 25 = 200
            isCoCaptain: false,
          },
          {
            employeeId: 'payroll-wingman-id',
            department: 'move',
            hours: 8, // 8 * 18 = 144
            isCoCaptain: false,
          },
          {
            employeeId: 'payroll-salary-guaranteed-id',
            department: 'move',
            hours: 4, // 4 * 25 = 100 (uses move captain rate as co-captain)
            isCoCaptain: true,
          },
          // Total labor cost: 444, Revenue: 2500, Labor %: 17.76% (below 25% goal, bonus!)
        ],
      };

      const log2Result = await submitLog(null, log2FormData);
      expect(log2Result.success).toBe(true);

      // Log 3: Mixed departments for salary employees
      const log3FormData: DailyLogFormData = {
        captainId: 'payroll-captain-id',
        logDate: new Date('2024-02-03'),
        sections: {
          junk: false,
          move: false,
          otherHours: true,
        },
        jobs: [],
        hours: [
          {
            employeeId: 'payroll-salary-base-id',
            department: 'admin',
            hours: 40, // Base salary employee - hours tracked but salary replaces wages
            isCoCaptain: false,
          },
          {
            employeeId: 'payroll-salary-supplemental-id',
            department: 'warehouse',
            hours: 35, // 35 * 18 = 630 + 200 supplemental = 830
            isCoCaptain: false,
          },
          {
            employeeId: 'payroll-sales-id',
            department: 'admin',
            hours: 20, // 20 * 15 = 300 + commission
            isCoCaptain: false,
          },
        ],
      };

      const log3Result = await submitLog(null, log3FormData);
      expect(log3Result.success).toBe(true);

      // Step 3: Approve all logs
      vi.mocked(auth).mockResolvedValue(managerUser);

      const approve1Result = await approveLog(log1Result.data?.id, 'Payroll test approval 1');
      const approve2Result = await approveLog(log2Result.data?.id, 'Payroll test approval 2');
      const approve3Result = await approveLog(log3Result.data?.id, 'Payroll test approval 3');

      expect(approve1Result.success).toBe(true);
      expect(approve2Result.success).toBe(true);
      expect(approve3Result.success).toBe(true);

      // Verify commission matching
      expect(approve1Result.data?.commissionMatching.matchCount).toBe(1);
      expect(approve2Result.data?.commissionMatching.matchCount).toBe(1);

      // Step 4: Calculate comprehensive payroll
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: [
              'payroll-captain-id',
              'payroll-wingman-id',
              'payroll-salary-base-id',
              'payroll-salary-guaranteed-id',
              'payroll-salary-supplemental-id',
              'payroll-sales-id',
            ],
          },
        },
      });

      const approvedLogs = await prisma.dailyLog.findMany({
        where: { status: 'approved' },
        include: {
          jobs: true,
          hours: {
            include: { employee: true },
          },
          captain: true,
        },
      });

      const commissions = await prisma.commissionEntry.findMany({
        where: { status: 'matched' },
        include: {
          sales: true,
          matchedLog: true,
        },
      });

      const payPeriodStart = new Date('2024-02-01');
      const payPeriodEnd = new Date('2024-02-29');

      const payrollCalculations = calculatePayroll(
        users as User[],
        approvedLogs as DailyLog[],
        commissions as CommissionEntry[],
        payPeriodStart,
        payPeriodEnd
      );

      expect(payrollCalculations).toHaveLength(6);

      // Verify captain payroll (hourly + tips + bonus)
      const captainPayroll = payrollCalculations.find(p => p.employeeId === 'payroll-captain-id');
      expect(captainPayroll).toBeDefined();
      expect(captainPayroll!.totalHours).toBe(14); // 6 + 8 hours
      expect(captainPayroll!.grossWages).toBe(332); // (6 * 22) + (8 * 25)
      expect(captainPayroll!.tips).toBe(250); // (200/2) + (300/3)
      expect(captainPayroll!.bonuses).toBeGreaterThan(0); // Should get move bonus
      expect(captainPayroll!.breakdown.salaryType).toBeNull(); // No salary

      // Verify wingman payroll (hourly + tips)
      const wingmanPayroll = payrollCalculations.find(p => p.employeeId === 'payroll-wingman-id');
      expect(wingmanPayroll).toBeDefined();
      expect(wingmanPayroll!.totalHours).toBe(14); // 6 + 8 hours
      expect(wingmanPayroll!.grossWages).toBe(240); // (6 * 16) + (8 * 18)
      expect(wingmanPayroll!.tips).toBe(250); // (200/2) + (300/3)
      expect(wingmanPayroll!.bonuses).toBe(0); // No bonuses for wingman

      // Verify base salary employee (salary replaces wages)
      const baseSalaryPayroll = payrollCalculations.find(p => p.employeeId === 'payroll-salary-base-id');
      expect(baseSalaryPayroll).toBeDefined();
      expect(baseSalaryPayroll!.totalHours).toBe(40);
      expect(baseSalaryPayroll!.grossWages).toBe(0); // Base salary replaces hourly wages
      expect(baseSalaryPayroll!.breakdown.salaryAmount).toBe(1000);
      expect(baseSalaryPayroll!.breakdown.salaryType).toBe('base');
      expect(baseSalaryPayroll!.totalPay).toBe(1000); // Just salary

      // Verify guaranteed salary employee (higher of wages vs guarantee)
      const guaranteedSalaryPayroll = payrollCalculations.find(p => p.employeeId === 'payroll-salary-guaranteed-id');
      expect(guaranteedSalaryPayroll).toBeDefined();
      expect(guaranteedSalaryPayroll!.totalHours).toBe(4);
      expect(guaranteedSalaryPayroll!.grossWages).toBe(100); // 4 * 25 (co-captain rate)
      expect(guaranteedSalaryPayroll!.tips).toBe(100); // 300/3
      // Total calculated: 200, Guarantee: 800, so should get guarantee
      expect(guaranteedSalaryPayroll!.breakdown.salaryAmount).toBe(800);
      expect(guaranteedSalaryPayroll!.totalPay).toBe(800);

      // Verify supplemental salary employee (wages + supplemental)
      const supplementalSalaryPayroll = payrollCalculations.find(p => p.employeeId === 'payroll-salary-supplemental-id');
      expect(supplementalSalaryPayroll).toBeDefined();
      expect(supplementalSalaryPayroll!.totalHours).toBe(35);
      expect(supplementalSalaryPayroll!.grossWages).toBe(630); // 35 * 18
      expect(supplementalSalaryPayroll!.breakdown.salaryAmount).toBe(200);
      expect(supplementalSalaryPayroll!.totalPay).toBe(830); // 630 + 200

      // Verify sales employee (wages + commission)
      const salesPayroll = payrollCalculations.find(p => p.employeeId === 'payroll-sales-id');
      expect(salesPayroll).toBeDefined();
      expect(salesPayroll!.totalHours).toBe(20);
      expect(salesPayroll!.grossWages).toBe(300); // 20 * 15
      expect(salesPayroll!.commission).toBe(240); // 6% of (1500 + 2500)
      expect(salesPayroll!.totalPay).toBe(540); // 300 + 240

      // Step 5: Verify total payroll calculations
      const totalPayroll = payrollCalculations.reduce((sum, p) => sum + p.totalPay, 0);
      const totalHours = payrollCalculations.reduce((sum, p) => sum + p.totalHours, 0);
      const totalTips = payrollCalculations.reduce((sum, p) => sum + p.tips, 0);
      const totalCommission = payrollCalculations.reduce((sum, p) => sum + p.commission, 0);

      expect(totalHours).toBe(127); // Sum of all hours worked
      expect(totalTips).toBe(500); // 200 + 300 distributed
      expect(totalCommission).toBe(240); // 6% of 4000 total revenue
      expect(totalPayroll).toBeGreaterThan(3000); // Reasonable total for all employees
    });

    it('should handle bi-weekly and monthly salary conversions', async () => {
      // Create employees with different salary frequencies
      await prisma.user.createMany({
        data: [
          {
            id: 'biweekly-salary-id',
            email: 'biweekly@test.com',
            password: 'hashedpassword',
            fullName: 'Bi-weekly Salary Employee',
            roles: ['admin'],
            rateAdmin: 20.00,
            salaryAmount: 2000.00, // Bi-weekly
            salaryFrequency: 'bi-weekly',
            salaryType: 'base',
          },
          {
            id: 'monthly-salary-id',
            email: 'monthly@test.com',
            password: 'hashedpassword',
            fullName: 'Monthly Salary Employee',
            roles: ['admin'],
            rateAdmin: 20.00,
            salaryAmount: 4330.00, // Monthly
            salaryFrequency: 'monthly',
            salaryType: 'base',
          },
        ],
      });

      const users = await prisma.user.findMany({
        where: {
          id: {
            in: ['biweekly-salary-id', 'monthly-salary-id'],
          },
        },
      });

      const payrollCalculations = calculatePayroll(
        users as User[],
        [], // No logs needed for salary-only test
        [],
        new Date('2024-02-01'),
        new Date('2024-02-29')
      );

      // Verify bi-weekly conversion (2000 / 2 = 1000 weekly)
      const biweeklyPayroll = payrollCalculations.find(p => p.employeeId === 'biweekly-salary-id');
      expect(biweeklyPayroll!.breakdown.salaryAmount).toBe(1000);

      // Verify monthly conversion (4330 / 4.33 ≈ 1000 weekly)
      const monthlyPayroll = payrollCalculations.find(p => p.employeeId === 'monthly-salary-id');
      expect(monthlyPayroll!.breakdown.salaryAmount).toBeCloseTo(1000, 0);

      // Clean up
      await prisma.user.deleteMany({
        where: {
          id: {
            in: ['biweekly-salary-id', 'monthly-salary-id'],
          },
        },
      });
    });
  });

  describe('Payroll Edge Cases', () => {
    it('should handle employees with zero hours but commission', async () => {
      // Sales person with commission but no hourly work
      const users = await prisma.user.findMany({
        where: { id: 'payroll-sales-id' },
      });

      // Create commission without corresponding hourly work
      const commissions = [{
        id: 'test-commission-id',
        salesId: 'payroll-sales-id',
        sales: users[0],
        jobId: 'ZERO-HOURS-JOB',
        clientName: 'Zero Hours Client',
        jobType: 'junk' as const,
        targetDate: new Date('2024-02-01'),
        estimatedRevenue: 500,
        actualRevenue: 600,
        commissionAmount: 36, // 6% of 600
        status: 'matched' as const,
        matchedLogId: 'fake-log-id',
        matchedLog: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }];

      const payrollCalculations = calculatePayroll(
        users as User[],
        [], // No logs with hours
        commissions as CommissionEntry[],
        new Date('2024-02-01'),
        new Date('2024-02-29')
      );

      const salesPayroll = payrollCalculations.find(p => p.employeeId === 'payroll-sales-id');
      expect(salesPayroll!.totalHours).toBe(0);
      expect(salesPayroll!.grossWages).toBe(0);
      expect(salesPayroll!.commission).toBe(36);
      expect(salesPayroll!.totalPay).toBe(36);
    });

    it('should handle guaranteed salary when calculated pay exceeds guarantee', async () => {
      const users = await prisma.user.findMany({
        where: { id: 'payroll-salary-guaranteed-id' },
      });

      // Create a high-hour scenario where calculated pay exceeds guarantee
      const highHourLog = {
        id: 'high-hour-log-id',
        captainId: 'payroll-captain-id',
        captain: users[0],
        logDate: new Date('2024-02-01'),
        status: 'approved' as const,
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: 'payroll-manager-id',
        createdById: 'payroll-captain-id',
        createdBy: users[0],
        lastEditedById: null,
        lastEditedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        jobs: [{
          id: 'high-tip-job-id',
          logId: 'high-hour-log-id',
          log: {} as DailyLog,
          jobType: 'junk' as const,
          jobId: 'HIGH-TIP-JOB',
          clientName: 'High Tip Client',
          revenue: 1000,
          tips: 500, // High tips
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
        hours: [{
          id: 'high-hour-entry-id',
          logId: 'high-hour-log-id',
          log: {} as DailyLog,
          employeeId: 'payroll-salary-guaranteed-id',
          employee: users[0],
          department: 'estimating' as const,
          hours: 40, // 40 * 25 = 1000 wages + 500 tips = 1500 total
          isCoCaptain: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      };

      const payrollCalculations = calculatePayroll(
        users as User[],
        [highHourLog] as DailyLog[],
        [],
        new Date('2024-02-01'),
        new Date('2024-02-29')
      );

      const guaranteedPayroll = payrollCalculations.find(p => p.employeeId === 'payroll-salary-guaranteed-id');
      expect(guaranteedPayroll!.grossWages).toBe(1000); // 40 * 25
      expect(guaranteedPayroll!.tips).toBe(500);
      expect(guaranteedPayroll!.breakdown.salaryAmount).toBe(0); // No salary supplement needed
      expect(guaranteedPayroll!.totalPay).toBe(1500); // Calculated pay exceeds guarantee
    });
  });
});