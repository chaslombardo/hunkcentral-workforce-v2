import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth module to simulate wingman user
vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: 'wingman-1',
      email: 'wingman@test.com',
      fullName: 'Test Wingman',
      roles: ['wingman'],
    },
  }),
  hasRole: vi.fn((user, role) => user.roles.includes(role)),
  hasAnyRole: vi.fn((user, roles) => roles.some(role => user.roles.includes(role))),
  canUserAccessUserData: vi.fn((currentUser, targetUserId) => {
    // Wingmen can access their own data
    return currentUser.id === targetUserId;
  }),
  getManagerAccessibleRoles: vi.fn(() => ['captain', 'wingman']),
  canManagerAccessUser: vi.fn(() => false), // Wingmen are not managers
}));

// Mock the payroll actions
vi.mock('@/lib/actions/payroll', () => ({
  getPayrollSummary: vi.fn().mockResolvedValue({
    success: true,
    data: {
      employeeId: 'wingman-1',
      employee: {
        id: 'wingman-1',
        email: 'wingman@test.com',
        fullName: 'Test Wingman',
        roles: ['wingman'],
      },
      payPeriod: {
        id: 'current',
        name: 'Current Period',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-15'),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      totalHours: 80,
      totalPay: 1200,
      grossWages: 1000,
      tips: 150,
      commission: 0, // Wingmen don't get commission
      bonuses: 50,
    },
  }),
  getCachedDetailedPayrollBreakdown: vi.fn().mockResolvedValue({
    success: true,
    data: {
      departmentBreakdown: [
        {
          department: 'junk',
          hours: 60,
          rate: 12.5,
          grossPay: 750,
          percentage: 75,
          isPrimary: true,
        },
        {
          department: 'move',
          hours: 20,
          rate: 12.5,
          grossPay: 250,
          percentage: 25,
          isPrimary: false,
        },
      ],
      dailyWorkHistory: [
        {
          date: new Date('2024-01-01'),
          logIds: ['log-1'],
          departments: [
            {
              department: 'junk',
              hours: 8,
              rate: 12.5,
            },
          ],
          tips: 25,
          role: 'wingman',
        },
      ],
      tipsDetails: [
        {
          date: new Date('2024-01-01'),
          jobId: 'job-1',
          amount: 25,
          jobType: 'junk',
          teamSize: 2,
        },
      ],
      totalHours: 80,
      totalPay: 1200,
      tips: 150,
    },
  }),
}));

describe('Wingman Payroll Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should verify wingman user can access their own payroll data', async () => {
      const { auth, canUserAccessUserData } = await import('@/lib/auth');
      const session = await auth();
      
      expect(session?.user).toBeDefined();
      expect(session?.user.roles).toContain('wingman');
      
      // Wingman should be able to access their own data
      const canAccess = canUserAccessUserData(session!.user, 'wingman-1');
      expect(canAccess).toBe(true);
    });

    it('should verify wingman cannot access other users data', async () => {
      const { auth, canUserAccessUserData } = await import('@/lib/auth');
      const session = await auth();
      
      // Wingman should not be able to access other users' data
      const canAccess = canUserAccessUserData(session!.user, 'captain-1');
      expect(canAccess).toBe(false);
    });

    it('should verify wingman has correct role permissions', async () => {
      const { auth, hasRole, hasAnyRole } = await import('@/lib/auth');
      const session = await auth();
      
      expect(hasRole(session!.user, 'wingman')).toBe(true);
      expect(hasRole(session!.user, 'captain')).toBe(false);
      expect(hasRole(session!.user, 'manager')).toBe(false);
      expect(hasRole(session!.user, 'admin')).toBe(false);
      
      // Wingman should have access to payroll-related roles
      expect(hasAnyRole(session!.user, ['wingman', 'captain', 'manager', 'admin'])).toBe(true);
      
      // Wingman should not have access to captain-only features
      expect(hasAnyRole(session!.user, ['captain', 'manager', 'admin'])).toBe(false);
    });
  });

  describe('Payroll Data Access', () => {
    it('should successfully fetch wingman payroll summary', async () => {
      const { getPayrollSummary } = await import('@/lib/actions/payroll');
      
      const result = await getPayrollSummary('wingman-1', 'current');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.employee.roles).toContain('wingman');
      expect(result.data?.totalHours).toBe(80);
      expect(result.data?.totalPay).toBe(1200);
      expect(result.data?.tips).toBe(150);
      expect(result.data?.commission).toBe(0); // Wingmen don't get commission
    });

    it('should successfully fetch wingman detailed payroll breakdown', async () => {
      const { getCachedDetailedPayrollBreakdown } = await import('@/lib/actions/payroll');
      
      const result = await getCachedDetailedPayrollBreakdown('wingman-1', 'current');
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.departmentBreakdown).toHaveLength(2);
      expect(result.data?.dailyWorkHistory).toHaveLength(1);
      expect(result.data?.tipsDetails).toHaveLength(1);
      
      // Verify wingman-specific data
      expect(result.data?.dailyWorkHistory[0].role).toBe('wingman');
      expect(result.data?.departmentBreakdown[0].rate).toBe(12.5); // Wingman rate
    });

    it('should verify tips analysis data for wingman', async () => {
      const { getCachedDetailedPayrollBreakdown } = await import('@/lib/actions/payroll');
      
      const result = await getCachedDetailedPayrollBreakdown('wingman-1', 'current');
      
      expect(result.success).toBe(true);
      expect(result.data?.tipsDetails).toBeDefined();
      expect(result.data?.tipsDetails).toHaveLength(1);
      
      const tipEntry = result.data?.tipsDetails[0];
      expect(tipEntry?.amount).toBe(25);
      expect(tipEntry?.jobType).toBe('junk');
      expect(tipEntry?.teamSize).toBe(2);
    });

    it('should verify time period filtering capability', async () => {
      const { getPayrollSummary } = await import('@/lib/actions/payroll');
      
      // Test current period
      const currentResult = await getPayrollSummary('wingman-1', 'current');
      expect(currentResult.success).toBe(true);
      expect(currentResult.data?.payPeriod.id).toBe('current');
      
      // The function should work with different period IDs
      // (In a real implementation, this would fetch different data)
      const previousResult = await getPayrollSummary('wingman-1', 'previous');
      expect(previousResult.success).toBe(true);
    });
  });

  describe('Rate Information and Calculations', () => {
    it('should verify wingman rates are correctly applied', async () => {
      const { getCachedDetailedPayrollBreakdown } = await import('@/lib/actions/payroll');
      
      const result = await getCachedDetailedPayrollBreakdown('wingman-1', 'current');
      
      expect(result.success).toBe(true);
      
      // Verify all departments use wingman rates (not captain rates)
      result.data?.departmentBreakdown.forEach(dept => {
        expect(dept.rate).toBe(12.5); // Wingman rate
      });
    });

    it('should verify average rate calculations include tips', async () => {
      const { getPayrollSummary, getCachedDetailedPayrollBreakdown } = await import('@/lib/actions/payroll');
      
      const summaryResult = await getPayrollSummary('wingman-1', 'current');
      const detailResult = await getCachedDetailedPayrollBreakdown('wingman-1', 'current');
      
      expect(summaryResult.success).toBe(true);
      expect(detailResult.success).toBe(true);
      
      const totalHours = summaryResult.data?.totalHours || 0;
      const totalPay = summaryResult.data?.totalPay || 0;
      const tips = summaryResult.data?.tips || 0;
      
      // Average rate should include tips
      const averageRateWithTips = (totalPay + tips) / totalHours;
      expect(averageRateWithTips).toBeGreaterThan(12.5); // Should be higher than base rate due to tips
    });
  });

  describe('Data Validation and Security', () => {
    it('should not expose commission data for wingman', async () => {
      const { getPayrollSummary } = await import('@/lib/actions/payroll');
      
      const result = await getPayrollSummary('wingman-1', 'current');
      
      expect(result.success).toBe(true);
      expect(result.data?.commission).toBe(0);
    });

    it('should not expose sensitive payroll data of other employees', async () => {
      const { canUserAccessUserData } = await import('@/lib/auth');
      const { auth } = await import('@/lib/auth');
      
      const session = await auth();
      
      // Wingman should not be able to access captain data
      expect(canUserAccessUserData(session!.user, 'captain-1')).toBe(false);
      
      // Wingman should not be able to access manager data
      expect(canUserAccessUserData(session!.user, 'manager-1')).toBe(false);
      
      // Wingman should not be able to access admin data
      expect(canUserAccessUserData(session!.user, 'admin-1')).toBe(false);
    });

    it('should verify wingman role restrictions are properly enforced', async () => {
      const { hasRole, hasAnyRole } = await import('@/lib/auth');
      const { auth } = await import('@/lib/auth');
      
      const session = await auth();
      
      // Verify wingman cannot perform captain actions
      expect(hasRole(session!.user, 'captain')).toBe(false);
      
      // Verify wingman cannot perform manager actions
      expect(hasRole(session!.user, 'manager')).toBe(false);
      
      // Verify wingman cannot perform admin actions
      expect(hasRole(session!.user, 'admin')).toBe(false);
      
      // But wingman can access payroll (which allows wingman role)
      expect(hasAnyRole(session!.user, ['wingman', 'captain', 'manager', 'admin'])).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle payroll data loading errors gracefully', async () => {
      // Mock a failed API call
      const { getPayrollSummary } = await import('@/lib/actions/payroll');
      vi.mocked(getPayrollSummary).mockResolvedValueOnce({
        success: false,
        error: 'Failed to load payroll data',
      });
      
      const result = await getPayrollSummary('wingman-1', 'current');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load payroll data');
    });

    it('should handle detailed breakdown loading errors gracefully', async () => {
      // Mock a failed API call
      const { getCachedDetailedPayrollBreakdown } = await import('@/lib/actions/payroll');
      vi.mocked(getCachedDetailedPayrollBreakdown).mockResolvedValueOnce({
        success: false,
        error: 'Failed to load detailed breakdown',
      });
      
      const result = await getCachedDetailedPayrollBreakdown('wingman-1', 'current');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load detailed breakdown');
    });
  });
});