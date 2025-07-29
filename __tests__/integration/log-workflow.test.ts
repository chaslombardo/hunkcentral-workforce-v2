/**
 * Integration tests for complete log workflow
 * Tests the end-to-end process from log creation to approval and commission matching
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/prisma';
import { saveDraftLog, submitLog, approveLog, loadLog } from '@/lib/actions/logs';
import { createCommissionEntry } from '@/lib/actions/commission';
import { calculatePayroll } from '@/lib/payCalculator';
import type { DailyLogFormData } from '@/lib/validations';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const { auth } = await import('@/lib/auth');

describe('Complete Log Workflow Integration', () => {
  // Test users
  const captainUser = {
    user: {
      id: 'captain-test-id',
      email: 'captain@test.com',
      fullName: 'Test Captain',
      roles: ['captain'],
    },
  };

  const managerUser = {
    user: {
      id: 'manager-test-id',
      email: 'manager@test.com',
      fullName: 'Test Manager',
      roles: ['manager'],
    },
  };

  const salesUser = {
    user: {
      id: 'sales-test-id',
      email: 'sales@test.com',
      fullName: 'Test Sales',
      roles: ['sales'],
    },
  };

  const wingmanUser = {
    user: {
      id: 'wingman-test-id',
      email: 'wingman@test.com',
      fullName: 'Test Wingman',
      roles: ['wingman'],
    },
  };

  beforeAll(async () => {
    // Create test users
    await prisma.user.createMany({
      data: [
        {
          id: 'captain-test-id',
          email: 'captain@test.com',
          password: 'hashedpassword',
          fullName: 'Test Captain',
          roles: ['captain'],
          rateJunkCaptain: 20.00,
          rateJunkWingman: 15.00,
          rateMoveCaptain: 22.00,
          rateMoveWingman: 17.00,
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
        },
        {
          id: 'manager-test-id',
          email: 'manager@test.com',
          password: 'hashedpassword',
          fullName: 'Test Manager',
          roles: ['manager'],
          rateAdmin: 25.00,
        },
        {
          id: 'sales-test-id',
          email: 'sales@test.com',
          password: 'hashedpassword',
          fullName: 'Test Sales',
          roles: ['sales'],
          commissionRate: 5.0,
          rateAdmin: 20.00,
        },
        {
          id: 'wingman-test-id',
          email: 'wingman@test.com',
          password: 'hashedpassword',
          fullName: 'Test Wingman',
          roles: ['wingman'],
          rateJunkWingman: 15.00,
          rateMoveWingman: 17.00,
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: {
        userId: {
          in: ['captain-test-id', 'manager-test-id', 'sales-test-id', 'wingman-test-id'],
        },
      },
    });
    await prisma.commissionEntry.deleteMany({
      where: {
        salesId: {
          in: ['sales-test-id'],
        },
      },
    });
    await prisma.logHour.deleteMany({
      where: {
        employeeId: {
          in: ['captain-test-id', 'wingman-test-id'],
        },
      },
    });
    await prisma.logJob.deleteMany({});
    await prisma.dailyLog.deleteMany({
      where: {
        captainId: {
          in: ['captain-test-id'],
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: ['captain-test-id', 'manager-test-id', 'sales-test-id', 'wingman-test-id'],
        },
      },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Log Creation to Approval Workflow', () => {
    it('should handle complete workflow: create → submit → approve → commission matching', async () => {
      // Step 1: Sales person creates commission entry
      vi.mocked(auth).mockResolvedValue(salesUser);
      
      const commissionResult = await createCommissionEntry({
        salesId: 'sales-test-id',
        jobId: 'WORKFLOW-001',
        clientName: 'Integration Test Client',
        jobType: 'junk',
        targetDate: new Date('2024-02-01'),
        estimatedRevenue: 800,
      });

      expect(commissionResult.success).toBe(true);
      const commissionId = commissionResult.data?.id;

      // Step 2: Captain creates draft log
      vi.mocked(auth).mockResolvedValue(captainUser);

      const logFormData: DailyLogFormData = {
        captainId: 'captain-test-id',
        logDate: new Date('2024-01-15'),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'WORKFLOW-001',
            clientName: 'Integration Test Client',
            revenue: 1000, // Higher than estimated for accuracy test
            tips: 150,
            disposalCost: 50,
          },
        ],
        disposalCost: 50,
        hours: [
          {
            employeeId: 'captain-test-id',
            department: 'junk',
            hours: 6,
            isCoCaptain: false,
          },
          {
            employeeId: 'wingman-test-id',
            department: 'junk',
            hours: 6,
            isCoCaptain: false,
          },
        ],
      };

      const draftResult = await saveDraftLog(null, logFormData);
      expect(draftResult.success).toBe(true);
      expect(draftResult.data?.status).toBe('draft');

      const logId = draftResult.data?.id;

      // Step 3: Captain submits log
      const submitResult = await submitLog(logId, logFormData);
      expect(submitResult.success).toBe(true);
      expect(submitResult.data?.status).toBe('submitted');

      // Step 4: Manager approves log
      vi.mocked(auth).mockResolvedValue(managerUser);

      const approveResult = await approveLog(logId, 'Integration test approval');
      expect(approveResult.success).toBe(true);
      expect(approveResult.data?.status).toBe('approved');

      // Verify commission matching occurred
      expect(approveResult.data?.commissionMatching.success).toBe(true);
      expect(approveResult.data?.commissionMatching.matchCount).toBe(1);

      // Step 5: Verify commission entry was updated
      const updatedCommission = await prisma.commissionEntry.findUnique({
        where: { id: commissionId },
      });

      expect(updatedCommission?.status).toBe('matched');
      expect(updatedCommission?.actualRevenue).toBe(1000);
      expect(updatedCommission?.commissionAmount).toBe(50); // 5% of 1000
      expect(updatedCommission?.matchedLogId).toBe(logId);

      // Step 6: Verify audit trail was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityId: logId,
          entityType: 'daily_log',
        },
        orderBy: { createdAt: 'asc' },
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(3); // create, submit, approve
      expect(auditLogs.some(log => log.action === 'create')).toBe(true);
      expect(auditLogs.some(log => log.action === 'submit')).toBe(true);
      expect(auditLogs.some(log => log.action === 'approve')).toBe(true);

      // Step 7: Verify payroll calculation includes this log
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: ['captain-test-id', 'wingman-test-id', 'sales-test-id'],
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

      const payPeriodStart = new Date('2024-01-01');
      const payPeriodEnd = new Date('2024-01-31');

      const payrollCalculations = calculatePayroll(
        users,
        approvedLogs,
        commissions,
        payPeriodStart,
        payPeriodEnd
      );

      // Verify captain payroll
      const captainPayroll = payrollCalculations.find(p => p.employeeId === 'captain-test-id');
      expect(captainPayroll).toBeDefined();
      expect(captainPayroll!.totalHours).toBe(6);
      expect(captainPayroll!.grossWages).toBe(120); // 6 hours * $20 captain rate
      expect(captainPayroll!.tips).toBe(75); // 150 tips / 2 employees
      expect(captainPayroll!.bonuses).toBeGreaterThan(0); // Should get bonus (12% actual vs 14% goal)

      // Verify wingman payroll
      const wingmanPayroll = payrollCalculations.find(p => p.employeeId === 'wingman-test-id');
      expect(wingmanPayroll).toBeDefined();
      expect(wingmanPayroll!.totalHours).toBe(6);
      expect(wingmanPayroll!.grossWages).toBe(90); // 6 hours * $15 wingman rate
      expect(wingmanPayroll!.tips).toBe(75); // 150 tips / 2 employees

      // Verify sales payroll
      const salesPayroll = payrollCalculations.find(p => p.employeeId === 'sales-test-id');
      expect(salesPayroll).toBeDefined();
      expect(salesPayroll!.commission).toBe(50); // 5% of $1000
    });

    it('should handle auto-save during log creation', async () => {
      vi.mocked(auth).mockResolvedValue(captainUser);

      const initialFormData: DailyLogFormData = {
        captainId: 'captain-test-id',
        logDate: new Date('2024-01-16'),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'AUTOSAVE-001',
            clientName: 'Auto Save Test',
            revenue: 500,
            tips: 50,
          },
        ],
        hours: [],
      };

      // Create initial draft (simulating auto-save)
      const initialSave = await saveDraftLog(null, initialFormData);
      expect(initialSave.success).toBe(true);

      const logId = initialSave.data?.id;

      // Update draft with additional data (simulating continued editing)
      const updatedFormData: DailyLogFormData = {
        ...initialFormData,
        hours: [
          {
            employeeId: 'captain-test-id',
            department: 'junk',
            hours: 4,
            isCoCaptain: false,
          },
        ],
      };

      const updateSave = await saveDraftLog(logId, updatedFormData);
      expect(updateSave.success).toBe(true);
      expect(updateSave.data?.id).toBe(logId); // Same log ID

      // Verify final state
      const loadResult = await loadLog(logId);
      expect(loadResult.success).toBe(true);
      expect(loadResult.data?.jobs).toHaveLength(1);
      expect(loadResult.data?.hours).toHaveLength(1);
    });

    it('should handle commission conflicts during approval', async () => {
      // Create two commission entries for the same job ID
      vi.mocked(auth).mockResolvedValue(salesUser);

      const commission1Result = await createCommissionEntry({
        salesId: 'sales-test-id',
        jobId: 'CONFLICT-001',
        clientName: 'Conflict Test Client',
        jobType: 'junk',
        targetDate: new Date('2024-02-01'),
        estimatedRevenue: 600,
      });

      expect(commission1Result.success).toBe(true);

      // Create second user for conflict
      await prisma.user.create({
        data: {
          id: 'sales2-test-id',
          email: 'sales2@test.com',
          password: 'hashedpassword',
          fullName: 'Test Sales 2',
          roles: ['sales'],
          commissionRate: 4.0,
        },
      });

      const sales2User = {
        user: {
          id: 'sales2-test-id',
          email: 'sales2@test.com',
          fullName: 'Test Sales 2',
          roles: ['sales'],
        },
      };

      vi.mocked(auth).mockResolvedValue(sales2User);

      const commission2Result = await createCommissionEntry({
        salesId: 'sales2-test-id',
        jobId: 'CONFLICT-001', // Same job ID
        clientName: 'Conflict Test Client',
        jobType: 'junk',
        targetDate: new Date('2024-02-01'),
        estimatedRevenue: 700,
      });

      expect(commission2Result.success).toBe(true);

      // Create and submit log
      vi.mocked(auth).mockResolvedValue(captainUser);

      const logFormData: DailyLogFormData = {
        captainId: 'captain-test-id',
        logDate: new Date('2024-01-17'),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'CONFLICT-001',
            clientName: 'Conflict Test Client',
            revenue: 650,
            tips: 65,
          },
        ],
        hours: [
          {
            employeeId: 'captain-test-id',
            department: 'junk',
            hours: 5,
            isCoCaptain: false,
          },
        ],
      };

      const submitResult = await submitLog(null, logFormData);
      expect(submitResult.success).toBe(true);

      const logId = submitResult.data?.id;

      // Approve log - should detect conflict
      vi.mocked(auth).mockResolvedValue(managerUser);

      const approveResult = await approveLog(logId, 'Testing conflict handling');
      expect(approveResult.success).toBe(true);
      expect(approveResult.data?.commissionMatching.conflictCount).toBe(1);

      // Verify neither commission was matched due to conflict
      const commission1 = await prisma.commissionEntry.findUnique({
        where: { id: commission1Result.data?.id },
      });
      const commission2 = await prisma.commissionEntry.findUnique({
        where: { id: commission2Result.data?.id },
      });

      expect(commission1?.status).toBe('pending'); // Still pending due to conflict
      expect(commission2?.status).toBe('pending'); // Still pending due to conflict

      // Clean up
      await prisma.user.delete({ where: { id: 'sales2-test-id' } });
    });
  });

  describe('Error Handling in Workflow', () => {
    it('should handle validation errors during submission', async () => {
      vi.mocked(auth).mockResolvedValue(captainUser);

      const invalidFormData: DailyLogFormData = {
        captainId: '', // Invalid: empty captain ID
        logDate: new Date('2024-01-18'),
        sections: {
          junk: false,
          move: false,
          otherHours: false,
        },
        jobs: [],
        hours: [],
      };

      const result = await submitLog(null, invalidFormData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Captain selection is required');
    });

    it('should prevent submission of empty logs', async () => {
      vi.mocked(auth).mockResolvedValue(captainUser);

      const emptyFormData: DailyLogFormData = {
        captainId: 'captain-test-id',
        logDate: new Date('2024-01-19'),
        sections: {
          junk: false,
          move: false,
          otherHours: false,
        },
        jobs: [],
        hours: [],
      };

      const result = await submitLog(null, emptyFormData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot submit empty log');
    });

    it('should handle permission errors', async () => {
      // Create log as captain
      vi.mocked(auth).mockResolvedValue(captainUser);

      const logFormData: DailyLogFormData = {
        captainId: 'captain-test-id',
        logDate: new Date('2024-01-20'),
        sections: {
          junk: true,
          move: false,
          otherHours: false,
        },
        jobs: [
          {
            jobType: 'junk',
            jobId: 'PERM-001',
            clientName: 'Permission Test',
            revenue: 400,
            tips: 40,
          },
        ],
        hours: [
          {
            employeeId: 'captain-test-id',
            department: 'junk',
            hours: 3,
            isCoCaptain: false,
          },
        ],
      };

      const submitResult = await submitLog(null, logFormData);
      expect(submitResult.success).toBe(true);

      const logId = submitResult.data?.id;

      // Try to approve as wingman (should fail)
      vi.mocked(auth).mockResolvedValue(wingmanUser);

      const approveResult = await approveLog(logId, 'Unauthorized approval attempt');
      expect(approveResult.success).toBe(false);
      expect(approveResult.error).toBe('Manager access required');
    });
  });
});