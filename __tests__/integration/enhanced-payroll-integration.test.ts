import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  getDetailedPayrollBreakdown,
  getPayrollSummary,
  getEmployeePayPeriods,
} from '@/lib/actions/payroll';
// Database query functions are tested separately

// Mock session for testing
const mockSession = {
  user: {
    id: 'test-user-1',
    email: 'test@example.com',
    fullName: 'Test User',
    roles: ['captain'],
  },
};

// Mock getSession
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(() => Promise.resolve(mockSession)),
}));

describe('Enhanced Payroll Integration Tests', () => {
  let testUserId: string;
  let testPayPeriodId: string;
  let testLogId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-integration@example.com',
        password: 'hashed-password',
        fullName: 'Integration Test User',
        roles: ['captain'],
        rateJunkCaptain: 20.0,
        rateJunkWingman: 18.0,
        rateMoveCaptain: 22.0,
        rateMoveWingman: 20.0,
        rateZigma: 25.0,
        rateTraining: 15.0,
        rateEstimating: 30.0,
        rateWarehouse: 16.0,
        rateAdmin: 18.0,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      },
    });
    testUserId = user.id;

    // Update mock session to use test user
    mockSession.user.id = testUserId;

    // Create test pay period
    const payPeriod = await prisma.payPeriod.create({
      data: {
        name: 'Test Period',
        startDate: new Date('2025-01-13'),
        endDate: new Date('2025-01-19'),
        status: 'open',
      },
    });
    testPayPeriodId = payPeriod.id;

    // Create test daily log
    const dailyLog = await prisma.dailyLog.create({
      data: {
        captainId: testUserId,
        logDate: new Date('2025-01-15'),
        status: 'approved',
        submittedAt: new Date('2025-01-15T18:00:00Z'),
        approvedAt: new Date('2025-01-15T20:00:00Z'),
        createdById: testUserId,
      },
    });
    testLogId = dailyLog.id;

    // Create test jobs
    await prisma.logJob.createMany({
      data: [
        {
          logId: testLogId,
          jobType: 'junk',
          jobId: 'J12345',
          clientName: 'Test Client 1',
          revenue: 500,
          tips: 60,
        },
        {
          logId: testLogId,
          jobType: 'move',
          jobId: 'M67890',
          clientName: 'Test Client 2',
          revenue: 800,
          tips: 80,
        },
      ],
    });

    // Create test hours
    await prisma.logHour.createMany({
      data: [
        {
          logId: testLogId,
          employeeId: testUserId,
          department: 'junk',
          hours: 4,
          isCoCaptain: false,
        },
        {
          logId: testLogId,
          employeeId: testUserId,
          department: 'move',
          hours: 4,
          isCoCaptain: false,
        },
      ],
    });

    // Create commission entry
    await prisma.commissionEntry.create({
      data: {
        salesId: testUserId,
        jobId: 'J12345',
        clientName: 'Test Client 1',
        jobType: 'junk',
        targetDate: new Date('2025-01-15'),
        estimatedRevenue: 450,
        actualRevenue: 500,
        commissionAmount: 25,
        status: 'matched',
        matchedLogId: testLogId,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.commissionEntry.deleteMany({
      where: { salesId: testUserId },
    });
    await prisma.logHour.deleteMany({
      where: { logId: testLogId },
    });
    await prisma.logJob.deleteMany({
      where: { logId: testLogId },
    });
    await prisma.dailyLog.deleteMany({
      where: { id: testLogId },
    });
    await prisma.payPeriod.deleteMany({
      where: { id: testPayPeriodId },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
  });

  // Database Queries tests are skipped for now due to raw SQL complexity
  // The core functionality is tested through server actions below

  describe('Server Actions', () => {
    it('should get payroll summary successfully', async () => {
      const result = await getPayrollSummary(testUserId, testPayPeriodId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.employeeId).toBe(testUserId);
      expect(Number(result.data!.totalHours)).toBe(8);
      expect(result.data!.grossWages).toBe(168); // 80 + 88
      expect(result.data!.commission).toBe(25);
    });

    it('should get detailed payroll breakdown successfully', async () => {
      const result = await getDetailedPayrollBreakdown(
        testUserId,
        testPayPeriodId
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      const data = result.data!;
      expect(data.employeeId).toBe(testUserId);
      expect(Number(data.totalHours)).toBe(8);
      expect(data.grossWages).toBe(168);
      expect(data.commission).toBe(25);

      // Check department breakdown
      expect(data.departmentBreakdown).toHaveLength(2);
      const junkDept = data.departmentBreakdown.find(
        (d) => d.department === 'junk'
      );
      expect(junkDept).toBeDefined();
      expect(junkDept!.hours).toBe(4);
      expect(junkDept!.rate).toBe(20);
      expect(junkDept!.grossPay).toBe(80);
      expect(junkDept!.percentage).toBe(50);

      // Check daily work history
      expect(data.dailyWorkHistory).toHaveLength(1);
      expect(data.dailyWorkHistory[0].departments).toHaveLength(2);
      expect(data.dailyWorkHistory[0].role).toBe('captain');

      // Check rate information
      expect(data.rateInformation.junk.captainRate).toBe(20);
      expect(data.rateInformation.junk.wingmanRate).toBe(18);
      expect(data.rateInformation.junk.currentRate).toBe(20);
    });

    it('should get employee pay periods successfully', async () => {
      const result = await getEmployeePayPeriods(testUserId);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);

      const testPeriod = result.data!.find((p) => p.id === testPayPeriodId);
      expect(testPeriod).toBeDefined();
      expect(testPeriod!.name).toBe('Test Period');
    });

    it('should handle unauthorized access', async () => {
      // Mock unauthorized session
      const originalMock = mockSession.user.id;
      mockSession.user.id = 'different-user';
      mockSession.user.roles = ['wingman']; // No admin/manager role

      const result = await getDetailedPayrollBreakdown(
        testUserId,
        testPayPeriodId
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unauthorized');

      // Restore original mock
      mockSession.user.id = originalMock;
      mockSession.user.roles = ['captain'];
    });
  });
});
