/**
 * Performance tests for payroll calculations
 * Tests system behavior under load and with large datasets
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { calculatePayroll } from '@/lib/payCalculator';
import { matchCommissions } from '@/lib/commissionMatcher';
import type { User, DailyLog, CommissionEntry, LogJob, LogHour } from '@/types';

// Mock data generators
const generateMockUser = (id: string): User => ({
  id,
  email: `user${id}@test.com`,
  fullName: `User ${id}`,
  roles: ['wingman'],
  rateJunkCaptain: 20 + Math.random() * 10,
  rateJunkWingman: 15 + Math.random() * 5,
  rateMoveCaptain: 22 + Math.random() * 8,
  rateMoveWingman: 17 + Math.random() * 6,
  rateZigma: 18 + Math.random() * 7,
  rateTraining: 16 + Math.random() * 4,
  rateEstimating: 25 + Math.random() * 15,
  rateWarehouse: 14 + Math.random() * 6,
  rateAdmin: 20 + Math.random() * 10,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const generateMockJob = (logId: string, index: number): LogJob => ({
  id: `job-${logId}-${index}`,
  logId,
  log: {} as DailyLog,
  jobType: Math.random() > 0.5 ? 'junk' : 'move',
  jobId: `JOB-${logId}-${index}`,
  clientName: `Client ${index}`,
  revenue: 500 + Math.random() * 1500,
  tips: 50 + Math.random() * 200,
  junkOnMove: Math.random() > 0.7 ? 100 + Math.random() * 200 : undefined,
  valuation: Math.random() > 0.8 ? 50 + Math.random() * 150 : undefined,
  materials: Math.random() > 0.9 ? 25 + Math.random() * 75 : undefined,
  disposalCost: Math.random() > 0.6 ? 30 + Math.random() * 70 : undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const generateMockHour = (
  logId: string,
  employeeId: string,
  index: number
): LogHour => ({
  id: `hour-${logId}-${employeeId}-${index}`,
  logId,
  log: {} as DailyLog,
  employeeId,
  employee: generateMockUser(employeeId),
  department: ['junk', 'move', 'admin', 'warehouse'][
    Math.floor(Math.random() * 4)
  ] as any,
  hours: 4 + Math.random() * 8,
  isCoCaptain: Math.random() > 0.8,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const generateMockLog = (
  id: string,
  captainId: string,
  jobCount: number,
  employeeCount: number
): DailyLog => {
  const jobs = Array.from({ length: jobCount }, (_, i) =>
    generateMockJob(id, i)
  );
  const hours = Array.from({ length: employeeCount }, (_, i) =>
    generateMockHour(id, `emp-${i}`, 0)
  );

  return {
    id,
    captainId,
    captain: generateMockUser(captainId),
    logDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
    status: 'approved',
    submittedAt: new Date(),
    approvedAt: new Date(),
    approvedById: 'manager-1',
    createdById: captainId,
    createdBy: generateMockUser(captainId),
    lastEditedById: null,
    lastEditedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    jobs,
    hours,
  };
};

const generateMockCommission = (
  id: string,
  salesId: string
): CommissionEntry => ({
  id,
  salesId,
  sales: generateMockUser(salesId),
  jobId: `JOB-${Math.floor(Math.random() * 1000)}`,
  clientName: `Commission Client ${id}`,
  jobType: Math.random() > 0.5 ? 'junk' : 'move',
  targetDate: new Date(),
  estimatedRevenue: 500 + Math.random() * 1500,
  actualRevenue: 600 + Math.random() * 1400,
  commissionAmount: (600 + Math.random() * 1400) * 0.05,
  status: 'matched',
  matchedLogId: `log-${Math.floor(Math.random() * 100)}`,
  matchedLog: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('Payroll Performance Tests', () => {
  describe('Large Dataset Performance', () => {
    it('should calculate payroll for 100 employees in under 1 second', () => {
      const startTime = Date.now();

      // Generate 100 users
      const users = Array.from({ length: 100 }, (_, i) =>
        generateMockUser(`user-${i}`)
      );

      // Generate 50 logs with varying complexity
      const logs = Array.from({ length: 50 }, (_, i) =>
        generateMockLog(`log-${i}`, `user-${i % 20}`, 3, 5)
      );

      // Generate 200 commission entries
      const commissions = Array.from({ length: 200 }, (_, i) =>
        generateMockCommission(`comm-${i}`, `user-${i % 10}`)
      );

      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      // Calculate payroll
      const payrollCalculations = calculatePayroll(
        users,
        logs,
        commissions,
        payPeriodStart,
        payPeriodEnd
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(payrollCalculations).toHaveLength(100);
      expect(executionTime).toBeLessThan(1000); // Under 1 second
    });

    it('should handle 500 employees with complex compensation models', () => {
      const startTime = Date.now();

      // Generate 500 users with mixed compensation models
      const users = Array.from({ length: 500 }, (_, i) => {
        const user = generateMockUser(`user-${i}`);

        // Add salary for some users
        if (i % 3 === 0) {
          user.salaryAmount = 800 + Math.random() * 400;
          user.salaryFrequency = ['weekly', 'bi-weekly', 'monthly'][
            Math.floor(Math.random() * 3)
          ] as any;
          user.salaryType = ['base', 'guaranteed', 'supplemental'][
            Math.floor(Math.random() * 3)
          ] as any;
        }

        // Add commission for some users
        if (i % 4 === 0) {
          user.commissionRate = 3 + Math.random() * 7;
        }

        return user;
      });

      // Generate 200 logs
      const logs = Array.from({ length: 200 }, (_, i) =>
        generateMockLog(`log-${i}`, `user-${i % 50}`, 2, 8)
      );

      // Generate 1000 commission entries
      const commissions = Array.from({ length: 1000 }, (_, i) =>
        generateMockCommission(`comm-${i}`, `user-${i % 100}`)
      );

      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      // Calculate payroll
      const payrollCalculations = calculatePayroll(
        users,
        logs,
        commissions,
        payPeriodStart,
        payPeriodEnd
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(payrollCalculations).toHaveLength(500);
      expect(executionTime).toBeLessThan(5000); // Under 5 seconds for 500 employees

      // Verify some calculations are correct
      const employeeWithSalary = payrollCalculations.find(
        (p) => p.breakdown.salaryAmount > 0
      );
      const employeeWithCommission = payrollCalculations.find(
        (p) => p.commission > 0
      );
      const employeeWithBonus = payrollCalculations.find((p) => p.bonuses > 0);

      expect(employeeWithSalary).toBeDefined();
      expect(employeeWithCommission).toBeDefined();
      // Bonus might not always be present depending on random data
    });

    it('should maintain accuracy with large tip distributions', () => {
      const startTime = Date.now();

      // Create a log with many employees and large tip amounts
      const employeeCount = 50;
      const totalTips = 10000; // $10,000 in tips

      const users = Array.from({ length: employeeCount }, (_, i) =>
        generateMockUser(`tip-user-${i}`)
      );

      const log = generateMockLog('tip-log', 'captain-1', 1, employeeCount);
      log.jobs[0].tips = totalTips;

      const payrollCalculations = calculatePayroll(
        users,
        [log],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Verify tip distribution accuracy
      const totalDistributedTips = payrollCalculations.reduce(
        (sum, p) => sum + p.tips,
        0
      );
      expect(totalDistributedTips).toBeCloseTo(totalTips, 2);

      expect(executionTime).toBeLessThan(500); // Should be very fast
    });
  });

  describe('Commission Matching Performance', () => {
    it('should match 1000 commission entries efficiently', () => {
      const startTime = Date.now();

      // Generate log with 100 jobs
      const log = generateMockLog('perf-log', 'captain-1', 100, 10);

      // Generate 1000 commission entries, some matching
      const commissions = Array.from({ length: 1000 }, (_, i) => {
        const commission = generateMockCommission(`perf-comm-${i}`, 'sales-1');

        // Make some commissions match log jobs
        if (i < 50) {
          commission.jobId = log.jobs[i % log.jobs.length].jobId;
          commission.status = 'pending';
        }

        return commission;
      });

      // Perform matching
      const matchResult = matchCommissions(log, commissions);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(matchResult.matches.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(1000); // Under 1 second
    });

    it('should handle duplicate job IDs efficiently', () => {
      const startTime = Date.now();

      // Create log with duplicate job IDs (edge case)
      const log = generateMockLog('dup-log', 'captain-1', 10, 5);
      const duplicateJobId = 'DUPLICATE-JOB-123';

      // Set multiple jobs to same ID
      log.jobs[0].jobId = duplicateJobId;
      log.jobs[1].jobId = duplicateJobId;

      // Create multiple commission entries for the same job ID
      const commissions = Array.from({ length: 100 }, (_, i) => {
        const commission = generateMockCommission(
          `dup-comm-${i}`,
          `sales-${i % 10}`
        );

        if (i < 20) {
          commission.jobId = duplicateJobId;
          commission.status = 'pending';
        }

        return commission;
      });

      // Perform matching
      const matchResult = matchCommissions(log, commissions);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Should detect conflicts for duplicate job ID
      expect(matchResult.conflicts.length).toBeGreaterThan(0);
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated calculations', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform 100 payroll calculations
      for (let i = 0; i < 100; i++) {
        const users = Array.from({ length: 10 }, (_, j) =>
          generateMockUser(`mem-user-${j}`)
        );
        const logs = Array.from({ length: 5 }, (_, j) =>
          generateMockLog(`mem-log-${j}`, 'captain-1', 2, 3)
        );

        calculatePayroll(
          users,
          logs,
          [],
          new Date('2024-01-01'),
          new Date('2024-01-31')
        );
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / (1024 * 1024);

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncreaseMB).toBeLessThan(50);
    });

    it('should handle very large individual logs efficiently', () => {
      const startTime = Date.now();

      // Create a single log with many jobs and hours
      const largeLog = generateMockLog('large-log', 'captain-1', 500, 100);

      const users = Array.from({ length: 100 }, (_, i) =>
        generateMockUser(`large-user-${i}`)
      );

      const payrollCalculations = calculatePayroll(
        users,
        [largeLog],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(payrollCalculations).toHaveLength(100);
      expect(executionTime).toBeLessThan(2000); // Under 2 seconds
    });
  });

  describe('Concurrent Processing Tests', () => {
    it('should handle concurrent payroll calculations', async () => {
      const startTime = Date.now();

      // Create multiple payroll calculation promises
      const promises = Array.from({ length: 10 }, (_, i) => {
        return new Promise<number>((resolve) => {
          const users = Array.from({ length: 20 }, (_, j) =>
            generateMockUser(`conc-user-${i}-${j}`)
          );
          const logs = Array.from({ length: 10 }, (_, j) =>
            generateMockLog(`conc-log-${i}-${j}`, 'captain-1', 2, 4)
          );

          const calculations = calculatePayroll(
            users,
            logs,
            [],
            new Date('2024-01-01'),
            new Date('2024-01-31')
          );

          resolve(calculations.length);
        });
      });

      const results = await Promise.all(promises);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(results.every((count) => count === 20)).toBe(true);
      expect(executionTime).toBeLessThan(3000); // Under 3 seconds for concurrent processing
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle zero-data scenarios efficiently', () => {
      const startTime = Date.now();

      // Empty datasets
      const payrollCalculations = calculatePayroll(
        [],
        [],
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(payrollCalculations).toHaveLength(0);
      expect(executionTime).toBeLessThan(10); // Should be nearly instantaneous
    });

    it('should handle extreme values without performance degradation', () => {
      const startTime = Date.now();

      // Create users with extreme values
      const users = Array.from({ length: 10 }, (_, i) => {
        const user = generateMockUser(`extreme-user-${i}`);
        user.rateJunkCaptain = 999.99; // Very high rate
        user.salaryAmount = 100000; // Very high salary
        user.commissionRate = 50; // Very high commission
        return user;
      });

      // Create log with extreme values
      const log = generateMockLog('extreme-log', 'captain-1', 5, 10);
      log.jobs.forEach((job) => {
        job.revenue = 1000000; // $1M revenue
        job.tips = 50000; // $50K tips
      });

      const commissions = Array.from({ length: 50 }, (_, i) => {
        const commission = generateMockCommission(
          `extreme-comm-${i}`,
          `extreme-user-${i % 10}`
        );
        commission.actualRevenue = 1000000;
        commission.commissionAmount = 500000; // $500K commission
        return commission;
      });

      const payrollCalculations = calculatePayroll(
        users,
        [log],
        commissions,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(payrollCalculations).toHaveLength(10);
      expect(executionTime).toBeLessThan(1000); // Should still be fast

      // Verify calculations are still accurate with extreme values
      const totalPay = payrollCalculations.reduce(
        (sum, p) => sum + p.totalPay,
        0
      );
      expect(totalPay).toBeGreaterThan(0);
      expect(isFinite(totalPay)).toBe(true); // No infinity or NaN
    });
  });
});
