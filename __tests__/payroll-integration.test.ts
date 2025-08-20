import { calculatePayroll } from '@/lib/payCalculator';
import type { User, DailyLog, CommissionEntry } from '@/types';

describe('Payroll Integration Tests', () => {
  it('should integrate with existing system types and data structures', () => {
    // Test that the payroll calculation function works with real data structures
    const users: User[] = [
      {
        id: 'user-1',
        email: 'captain@example.com',
        fullName: 'Captain Test',
        roles: ['captain'],
        rateJunkCaptain: 25,
        rateJunkWingman: 18,
        rateMoveCaptain: 27,
        rateMoveWingman: 20,
        rateZigma: 22,
        rateTraining: 19,
        rateEstimating: 30,
        rateWarehouse: 16,
        rateAdmin: 24,
        junkBonusGoal: 0.15,
        moveBonusGoal: 0.25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'sales@example.com',
        fullName: 'Sales Test',
        roles: ['sales'],
        rateJunkCaptain: 25,
        rateJunkWingman: 18,
        rateMoveCaptain: 27,
        rateMoveWingman: 20,
        rateZigma: 22,
        rateTraining: 19,
        rateEstimating: 30,
        rateWarehouse: 16,
        rateAdmin: 24,
        commissionRate: 0.08,
        salaryAmount: 800,
        salaryFrequency: 'weekly',
        salaryType: 'supplemental',
        junkBonusGoal: 0.15,
        moveBonusGoal: 0.25,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const approvedLogs: DailyLog[] = [
      {
        id: 'log-1',
        captainId: 'user-1',
        captain: users[0],
        logDate: new Date('2024-01-15'),
        status: 'approved',
        submittedAt: new Date('2024-01-15T10:00:00Z'),
        approvedAt: new Date('2024-01-15T12:00:00Z'),
        approvedById: 'manager-1',
        createdById: 'user-1',
        createdBy: users[0],
        createdAt: new Date('2024-01-15T08:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'),
        jobs: [
          {
            id: 'job-1',
            logId: 'log-1',
            log: {} as DailyLog, // Circular reference placeholder
            jobType: 'junk',
            jobId: 'JOB123',
            clientName: 'Test Client',
            revenue: 2000,
            tips: 300,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        hours: [
          {
            id: 'hour-1',
            logId: 'log-1',
            log: {} as DailyLog, // Circular reference placeholder
            employeeId: 'user-1',
            employee: users[0],
            department: 'junk',
            hours: 8,
            isCoCaptain: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ];

    const commissions: CommissionEntry[] = [
      {
        id: 'commission-1',
        salesId: 'user-2',
        sales: users[1],
        jobId: 'JOB123',
        clientName: 'Test Client',
        jobType: 'junk',
        targetDate: new Date('2024-01-15'),
        estimatedRevenue: 1800,
        actualRevenue: 2000,
        commissionAmount: 160, // 2000 * 0.08
        status: 'matched',
        matchedLogId: 'log-1',
        matchedLog: approvedLogs[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const payPeriodStart = new Date('2024-01-01');
    const payPeriodEnd = new Date('2024-01-31');

    const payroll = calculatePayroll(
      users,
      approvedLogs,
      commissions,
      payPeriodStart,
      payPeriodEnd
    );

    expect(payroll).toHaveLength(2);

    // Captain should have wages, tips, and bonus
    const captainPayroll = payroll.find((p) => p.employeeId === 'user-1')!;
    expect(captainPayroll).toBeDefined();
    expect(captainPayroll.totalHours).toBe(8);
    expect(captainPayroll.grossWages).toBe(200); // 8 hours * $25 captain rate
    expect(captainPayroll.tips).toBe(300); // All tips go to captain (only employee)
    expect(captainPayroll.bonuses).toBeGreaterThan(0); // Should have bonus (low labor %)
    expect(captainPayroll.commission).toBe(0);

    // Sales person should have commission and supplemental salary
    const salesPayroll = payroll.find((p) => p.employeeId === 'user-2')!;
    expect(salesPayroll).toBeDefined();
    expect(salesPayroll.totalHours).toBe(0);
    expect(salesPayroll.grossWages).toBe(0);
    expect(salesPayroll.tips).toBe(0);
    expect(salesPayroll.bonuses).toBe(0);
    expect(salesPayroll.commission).toBe(160);
    expect(salesPayroll.breakdown.salaryAmount).toBe(800); // Supplemental salary
    expect(salesPayroll.breakdown.salaryType).toBe('supplemental');
    expect(salesPayroll.totalPay).toBe(960); // 160 commission + 800 salary
  });

  it('should handle edge cases and empty data', () => {
    const payroll = calculatePayroll([], [], [], new Date(), new Date());
    expect(payroll).toEqual([]);
  });

  it('should handle users with no activity', () => {
    const users: User[] = [
      {
        id: 'inactive-user',
        email: 'inactive@example.com',
        fullName: 'Inactive User',
        roles: ['wingman'],
        rateJunkWingman: 15,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const payroll = calculatePayroll(users, [], [], new Date(), new Date());

    expect(payroll).toHaveLength(1);
    expect(payroll[0].totalHours).toBe(0);
    expect(payroll[0].totalPay).toBe(0);
  });
});
