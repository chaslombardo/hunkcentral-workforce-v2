/**
 * Edge case tests for calculation logic
 * Tests boundary conditions and extreme scenarios
 */

import { describe, it, expect } from 'vitest';
import {
  calculateHourlyWage,
  calculateLaborBonus,
  calculateTipsPerHunk,
  calculateTipDistribution,
  calculateCommissionTotals,
  convertSalaryToWeekly,
  applySalaryRules,
  calculatePayroll,
} from '@/lib/payCalculator';
import {
  calculateBookingAccuracy,
  calculateCommissionAmount,
  findCommissionMatches,
} from '@/lib/commissionMatcher';
import type { User, DailyLog, CommissionEntry, Department } from '@/types';

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

describe('Calculation Edge Cases', () => {
  describe('Hourly Wage Calculations', () => {
    it('should handle null/undefined rates gracefully', () => {
      const user = createMockUser({
        rateJunkCaptain: undefined,
        rateJunkWingman: undefined,
      });

      expect(calculateHourlyWage(user, 'junk', false)).toBe(0);
      expect(calculateHourlyWage(user, 'junk', true)).toBe(0);
    });

    it('should handle zero rates', () => {
      const user = createMockUser({
        rateJunkCaptain: 0,
        rateJunkWingman: 0,
      });

      expect(calculateHourlyWage(user, 'junk', false)).toBe(0);
      expect(calculateHourlyWage(user, 'junk', true)).toBe(0);
    });

    it('should handle very high rates', () => {
      const user = createMockUser({
        rateJunkCaptain: 999.99,
        rateJunkWingman: 888.88,
      });

      expect(calculateHourlyWage(user, 'junk', false)).toBe(888.88);
      expect(calculateHourlyWage(user, 'junk', true)).toBe(999.99);
    });

    it('should handle invalid department gracefully', () => {
      const user = createMockUser();

      expect(calculateHourlyWage(user, 'invalid' as Department, false)).toBe(0);
    });
  });

  describe('Labor Bonus Calculations', () => {
    it('should handle exact goal percentage', () => {
      const captain = createMockUser({
        roles: ['captain'],
        junkBonusGoal: 0.14,
      });

      // Exactly at goal - no bonus
      expect(calculateLaborBonus(captain, 0.14, 0.14, 1000)).toBe(0);

      // Just under goal - should get bonus
      expect(calculateLaborBonus(captain, 0.139, 0.14, 1000)).toBeCloseTo(1, 2);

      // Just over goal - no bonus
      expect(calculateLaborBonus(captain, 0.141, 0.14, 1000)).toBe(0);
    });

    it('should handle zero revenue', () => {
      const captain = createMockUser({
        roles: ['captain'],
        junkBonusGoal: 0.14,
      });

      expect(calculateLaborBonus(captain, 0.1, 0.14, 0)).toBe(0);
    });

    it('should handle negative percentages', () => {
      const captain = createMockUser({
        roles: ['captain'],
        junkBonusGoal: 0.14,
      });

      // Negative actual percentage (shouldn't happen in practice)
      expect(calculateLaborBonus(captain, -0.05, 0.14, 1000)).toBe(190);
    });

    it('should handle very large revenue amounts', () => {
      const captain = createMockUser({
        roles: ['captain'],
        junkBonusGoal: 0.14,
      });

      const largeRevenue = 10000000; // $10 million
      const bonus = calculateLaborBonus(captain, 0.1, 0.14, largeRevenue);
      expect(bonus).toBeCloseTo(400000, 2); // 4% of 10M
    });

    it('should handle very small percentage differences', () => {
      const captain = createMockUser({
        roles: ['captain'],
        junkBonusGoal: 0.14,
      });

      const bonus = calculateLaborBonus(captain, 0.13999, 0.14, 1000);
      expect(bonus).toBeCloseTo(0.01, 4); // Very small bonus
    });
  });

  describe('Tips Per HUNK Calculations', () => {
    it('should handle zero tips', () => {
      expect(calculateTipsPerHunk(0, 5)).toBe(0);
    });

    it('should handle zero HUNKs', () => {
      expect(calculateTipsPerHunk(100, 0)).toBe(0);
    });

    it('should handle single HUNK', () => {
      expect(calculateTipsPerHunk(100, 1)).toBe(100);
    });

    it('should handle fractional results', () => {
      expect(calculateTipsPerHunk(100, 3)).toBeCloseTo(33.33, 2);
    });

    it('should handle very large tip amounts', () => {
      expect(calculateTipsPerHunk(1000000, 10)).toBe(100000);
    });

    it('should handle very small tip amounts', () => {
      expect(calculateTipsPerHunk(0.01, 2)).toBe(0.005);
    });
  });

  describe('Commission Calculations', () => {
    it('should handle zero commission rate', () => {
      expect(calculateCommissionAmount(1000, 0)).toBe(0);
    });

    it('should handle 100% commission rate', () => {
      expect(calculateCommissionAmount(1000, 100)).toBe(1000);
    });

    it('should handle rates over 100%', () => {
      expect(calculateCommissionAmount(1000, 150)).toBe(1500);
    });

    it('should handle very small revenue amounts', () => {
      expect(calculateCommissionAmount(0.01, 5)).toBeCloseTo(0.0005, 4);
    });

    it('should handle very large revenue amounts', () => {
      expect(calculateCommissionAmount(10000000, 5)).toBe(500000);
    });

    it('should handle fractional commission rates', () => {
      expect(calculateCommissionAmount(1000, 2.5)).toBe(25);
      expect(calculateCommissionAmount(1000, 0.1)).toBe(1);
    });
  });

  describe('Booking Accuracy Calculations', () => {
    it('should handle identical amounts', () => {
      expect(calculateBookingAccuracy(500, 500)).toBe(100);
    });

    it('should handle zero estimated revenue', () => {
      expect(calculateBookingAccuracy(0, 500)).toBe(0);
    });

    it('should handle zero actual revenue', () => {
      expect(calculateBookingAccuracy(500, 0)).toBe(0);
    });

    it('should handle both zero amounts', () => {
      expect(calculateBookingAccuracy(0, 0)).toBe(0);
    });

    it('should handle very small differences', () => {
      expect(calculateBookingAccuracy(1000, 1001)).toBeCloseTo(99.9, 1);
    });

    it('should handle very large differences', () => {
      expect(calculateBookingAccuracy(100, 10000)).toBeCloseTo(1, 1);
    });

    it('should handle underestimates correctly', () => {
      expect(calculateBookingAccuracy(500, 1000)).toBeCloseTo(50, 1);
    });

    it('should handle overestimates correctly', () => {
      expect(calculateBookingAccuracy(1000, 500)).toBeCloseTo(50, 1);
    });

    it('should handle fractional amounts', () => {
      expect(calculateBookingAccuracy(123.45, 123.46)).toBeCloseTo(99.99, 2);
    });
  });

  describe('Salary Conversion Edge Cases', () => {
    it('should handle zero salary amounts', () => {
      expect(convertSalaryToWeekly(0, 'weekly')).toBe(0);
      expect(convertSalaryToWeekly(0, 'bi-weekly')).toBe(0);
      expect(convertSalaryToWeekly(0, 'monthly')).toBe(0);
    });

    it('should handle very large salary amounts', () => {
      const largeSalary = 1000000;
      expect(convertSalaryToWeekly(largeSalary, 'weekly')).toBe(largeSalary);
      expect(convertSalaryToWeekly(largeSalary, 'bi-weekly')).toBe(
        largeSalary / 2
      );
      expect(convertSalaryToWeekly(largeSalary, 'monthly')).toBeCloseTo(
        largeSalary / 4.33,
        2
      );
    });

    it('should handle fractional salary amounts', () => {
      expect(convertSalaryToWeekly(1000.5, 'bi-weekly')).toBe(500.25);
      expect(convertSalaryToWeekly(4330.5, 'monthly')).toBeCloseTo(1000.12, 2);
    });

    it('should handle invalid frequency gracefully', () => {
      expect(convertSalaryToWeekly(1000, 'invalid' as any)).toBe(0);
    });
  });

  describe('Salary Rules Edge Cases', () => {
    it('should handle base salary with zero hourly wages', () => {
      const user = createMockUser({
        salaryAmount: 1000,
        salaryFrequency: 'weekly',
        salaryType: 'base',
      });

      const result = applySalaryRules(user, 0, 0, 0, 0);

      expect(result.hourlyWages).toBe(0);
      expect(result.salaryAmount).toBe(1000);
      expect(result.finalPay).toBe(1000);
    });

    it('should handle guaranteed salary at exact break-even point', () => {
      const user = createMockUser({
        salaryAmount: 1000,
        salaryFrequency: 'weekly',
        salaryType: 'guaranteed',
      });

      // Calculated pay exactly equals guarantee
      const result = applySalaryRules(user, 800, 100, 50, 50);

      expect(result.finalPay).toBe(1000); // Should use guarantee
      expect(result.salaryAmount).toBe(0); // No salary supplement needed when calculated equals guarantee
    });

    it('should handle supplemental salary with negative other earnings', () => {
      const user = createMockUser({
        salaryAmount: 200,
        salaryFrequency: 'weekly',
        salaryType: 'supplemental',
      });

      // This shouldn't happen in practice, but test robustness
      const result = applySalaryRules(user, -100, 0, 0, 0);

      expect(result.finalPay).toBe(100); // -100 + 200
      expect(result.salaryAmount).toBe(200);
    });

    it('should handle missing salary configuration', () => {
      const user = createMockUser({
        salaryAmount: undefined,
        salaryFrequency: undefined,
        salaryType: undefined,
      });

      const result = applySalaryRules(user, 800, 100, 50, 25);

      expect(result.hourlyWages).toBe(800);
      expect(result.salaryAmount).toBe(0);
      expect(result.salaryType).toBeNull();
      expect(result.finalPay).toBe(975);
    });
  });

  describe('Tip Distribution Edge Cases', () => {
    it('should handle logs with no jobs', () => {
      const log: DailyLog = {
        id: 'log-1',
        captainId: 'captain-1',
        captain: createMockUser(),
        logDate: new Date(),
        status: 'approved',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: 'manager-1',
        createdById: 'captain-1',
        createdBy: createMockUser(),
        lastEditedById: null,
        lastEditedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        jobs: [], // No jobs
        hours: [
          {
            id: 'hour-1',
            logId: 'log-1',
            log: {} as DailyLog,
            employeeId: 'emp-1',
            employee: createMockUser(),
            department: 'junk',
            hours: 8,
            isCoCaptain: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const tipDistribution = calculateTipDistribution([log]);
      expect(tipDistribution.size).toBe(0);
    });

    it('should handle logs with no hours', () => {
      const log: DailyLog = {
        id: 'log-1',
        captainId: 'captain-1',
        captain: createMockUser(),
        logDate: new Date(),
        status: 'approved',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: 'manager-1',
        createdById: 'captain-1',
        createdBy: createMockUser(),
        lastEditedById: null,
        lastEditedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        jobs: [
          {
            id: 'job-1',
            logId: 'log-1',
            log: {} as DailyLog,
            jobType: 'junk',
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: 1000,
            tips: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        hours: [], // No hours
      };

      const tipDistribution = calculateTipDistribution([log]);
      expect(tipDistribution.size).toBe(0);
    });

    it('should handle single employee getting all tips', () => {
      const log: DailyLog = {
        id: 'log-1',
        captainId: 'captain-1',
        captain: createMockUser(),
        logDate: new Date(),
        status: 'approved',
        submittedAt: new Date(),
        approvedAt: new Date(),
        approvedById: 'manager-1',
        createdById: 'captain-1',
        createdBy: createMockUser(),
        lastEditedById: null,
        lastEditedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        jobs: [
          {
            id: 'job-1',
            logId: 'log-1',
            log: {} as DailyLog,
            jobType: 'junk',
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: 1000,
            tips: 150,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        hours: [
          {
            id: 'hour-1',
            logId: 'log-1',
            log: {} as DailyLog,
            employeeId: 'emp-1',
            employee: createMockUser(),
            department: 'junk',
            hours: 8,
            isCoCaptain: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      const tipDistribution = calculateTipDistribution([log]);
      expect(tipDistribution.get('emp-1')).toBe(150);
    });
  });

  describe('Commission Matching Edge Cases', () => {
    it('should handle empty commission entries list', () => {
      const matches = findCommissionMatches('JOB123', []);
      expect(matches).toHaveLength(0);
    });

    it('should handle commission entries with different statuses', () => {
      const commissions: CommissionEntry[] = [
        {
          id: 'comm-1',
          salesId: 'sales-1',
          sales: createMockUser(),
          jobId: 'JOB123',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 500,
          actualRevenue: null,
          commissionAmount: null,
          status: 'pending',
          matchedLogId: null,
          matchedLog: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'comm-2',
          salesId: 'sales-2',
          sales: createMockUser(),
          jobId: 'JOB123',
          clientName: 'Test Client',
          jobType: 'junk',
          targetDate: new Date(),
          estimatedRevenue: 600,
          actualRevenue: 650,
          commissionAmount: 32.5,
          status: 'matched',
          matchedLogId: 'log-1',
          matchedLog: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const matches = findCommissionMatches('JOB123', commissions);
      expect(matches).toHaveLength(1); // Only pending should match
      expect(matches[0].status).toBe('pending');
    });
  });

  describe('Payroll Calculation Edge Cases', () => {
    it('should handle empty users list', () => {
      const payroll = calculatePayroll(
        [],
        [],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(payroll).toHaveLength(0);
    });

    it('should handle users with no activity', () => {
      const users = [createMockUser({ id: 'inactive-user' })];

      const payroll = calculatePayroll(
        users,
        [],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(payroll).toHaveLength(1);
      expect(payroll[0].totalHours).toBe(0);
      expect(payroll[0].totalPay).toBe(0);
    });

    it('should handle pay period with no approved logs', () => {
      const users = [createMockUser()];

      const payroll = calculatePayroll(
        users,
        [], // No logs
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(payroll).toHaveLength(1);
      expect(payroll[0].totalHours).toBe(0);
      expect(payroll[0].grossWages).toBe(0);
    });

    it('should handle very large payroll calculations', () => {
      // Create 100 users
      const users = Array.from({ length: 100 }, (_, i) =>
        createMockUser({
          id: `user-${i}`,
          email: `user${i}@test.com`,
          fullName: `User ${i}`,
        })
      );

      // This should complete without performance issues
      const startTime = Date.now();

      const payroll = calculatePayroll(
        users,
        [],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(payroll).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
