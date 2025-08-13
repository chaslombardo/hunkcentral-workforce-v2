import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/analytics/performance/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { User, CaptainPerformanceData } from '@/types';

// Mock dependencies
vi.mock('@/lib/auth');
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
    dailyLog: {
      findMany: vi.fn(),
    },
  },
}));

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe('Rankings Role Access Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock database responses
    mockPrisma.user.findMany.mockResolvedValue([
      {
        id: 'captain-1',
        email: 'captain1@test.com',
        fullName: 'Captain One',
        roles: ['captain'],
        rateJunkCaptain: 20,
        rateJunkWingman: 15,
        rateMoveCaptain: 22,
        rateMoveWingman: 17,
        rateZigma: 18,
        rateTraining: 16,
        rateEstimating: 19,
        rateWarehouse: 14,
        rateAdmin: 25,
        salaryAmount: 50000,
        salaryFrequency: 'yearly',
        salaryType: 'base',
        commissionRate: 0.05,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    mockPrisma.dailyLog.findMany.mockResolvedValue([]);
  });

  describe('Role-based access verification', () => {
    it('should allow sales consultant to access rankings without payroll data exposure', async () => {
      // Arrange: Mock sales consultant session
      mockAuth.mockResolvedValue({
        user: {
          id: 'sales-1',
          email: 'sales@test.com',
          fullName: 'Sales Consultant',
          roles: ['sales'],
        },
      });

      // Act: Call the API
      const request = new Request('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);
      const data = await response.json();

      // Assert: Sales consultant can access the endpoint
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('captains');
      expect(data).toHaveProperty('totalCaptains');
      expect(data).toHaveProperty('dateRange');

      // Verify no sensitive payroll data is exposed in response
      if (data.captains && data.captains.length > 0) {
        const captain = data.captains[0] as CaptainPerformanceData;
        
        // Should have performance metrics
        expect(captain).toHaveProperty('captainId');
        expect(captain).toHaveProperty('captainName');
        expect(captain).toHaveProperty('junkMetrics');
        expect(captain).toHaveProperty('moveMetrics');
        
        // Should NOT have sensitive payroll data
        expect(captain).not.toHaveProperty('rateJunkCaptain');
        expect(captain).not.toHaveProperty('rateJunkWingman');
        expect(captain).not.toHaveProperty('rateMoveCaptain');
        expect(captain).not.toHaveProperty('rateMoveWingman');
        expect(captain).not.toHaveProperty('salaryAmount');
        expect(captain).not.toHaveProperty('salaryFrequency');
        expect(captain).not.toHaveProperty('salaryType');
        expect(captain).not.toHaveProperty('commissionRate');
        expect(captain).not.toHaveProperty('junkBonusGoal');
        expect(captain).not.toHaveProperty('moveBonusGoal');
        
        // Verify metrics structure contains only performance data
        expect(captain.junkMetrics).toHaveProperty('jobCount');
        expect(captain.junkMetrics).toHaveProperty('totalRevenue');
        expect(captain.junkMetrics).toHaveProperty('averageJobSize');
        expect(captain.junkMetrics).toHaveProperty('laborPercentage');
        expect(captain.junkMetrics).toHaveProperty('disposalPercentage');
        
        expect(captain.moveMetrics).toHaveProperty('jobCount');
        expect(captain.moveMetrics).toHaveProperty('totalRevenue');
        expect(captain.moveMetrics).toHaveProperty('averageJobSize');
        expect(captain.moveMetrics).toHaveProperty('laborPercentage');
        expect(captain.moveMetrics).toHaveProperty('upsellRevenue');
        expect(captain.moveMetrics).toHaveProperty('upsellPercentage');
        expect(captain.moveMetrics).toHaveProperty('valuationRevenue');
        expect(captain.moveMetrics).toHaveProperty('valuationPercentage');
        expect(captain.moveMetrics).toHaveProperty('junkOnMoveRevenue');
        expect(captain.moveMetrics).toHaveProperty('junkOnMovePercentage');
        expect(captain.moveMetrics).toHaveProperty('materialsRevenue');
        expect(captain.moveMetrics).toHaveProperty('materialsPercentage');
      }
    });

    it('should allow wingman to access rankings without payroll data exposure', async () => {
      // Arrange: Mock wingman session
      mockAuth.mockResolvedValue({
        user: {
          id: 'wingman-1',
          email: 'wingman@test.com',
          fullName: 'Wingman User',
          roles: ['wingman'],
        },
      });

      // Act: Call the API
      const request = new Request('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);
      const data = await response.json();

      // Assert: Wingman can access the endpoint
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('captains');
      expect(data).toHaveProperty('totalCaptains');
      
      // Verify no sensitive compensation data is displayed
      if (data.captains && data.captains.length > 0) {
        const captain = data.captains[0] as CaptainPerformanceData;
        
        // Should NOT expose any rate or salary information
        expect(captain).not.toHaveProperty('rateJunkCaptain');
        expect(captain).not.toHaveProperty('salaryAmount');
        expect(captain).not.toHaveProperty('commissionRate');
        
        // Should only have performance metrics
        expect(captain.junkMetrics).toHaveProperty('jobCount');
        expect(captain.junkMetrics).toHaveProperty('totalRevenue');
        expect(captain.junkMetrics).toHaveProperty('laborPercentage');
        expect(captain.moveMetrics).toHaveProperty('jobCount');
        expect(captain.moveMetrics).toHaveProperty('totalRevenue');
        expect(captain.moveMetrics).toHaveProperty('laborPercentage');
      }
    });

    it('should allow captain to access rankings without payroll data exposure', async () => {
      // Arrange: Mock captain session
      mockAuth.mockResolvedValue({
        user: {
          id: 'captain-1',
          email: 'captain@test.com',
          fullName: 'Captain User',
          roles: ['captain'],
        },
      });

      // Act: Call the API
      const request = new Request('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);
      const data = await response.json();

      // Assert: Captain can access the endpoint
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('captains');
      
      // Verify no sensitive compensation data is displayed (even for their own data)
      if (data.captains && data.captains.length > 0) {
        const captain = data.captains[0] as CaptainPerformanceData;
        
        // Should NOT expose any payroll information
        expect(captain).not.toHaveProperty('rateJunkCaptain');
        expect(captain).not.toHaveProperty('salaryAmount');
        expect(captain).not.toHaveProperty('commissionRate');
        
        // Should only have performance metrics
        expect(captain.junkMetrics).toHaveProperty('jobCount');
        expect(captain.junkMetrics).toHaveProperty('totalRevenue');
        expect(captain.moveMetrics).toHaveProperty('jobCount');
        expect(captain.moveMetrics).toHaveProperty('totalRevenue');
      }
    });

    it('should allow manager to access rankings without payroll data exposure', async () => {
      // Arrange: Mock manager session
      mockAuth.mockResolvedValue({
        user: {
          id: 'manager-1',
          email: 'manager@test.com',
          fullName: 'Manager User',
          roles: ['manager'],
        },
      });

      // Act: Call the API
      const request = new Request('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);
      const data = await response.json();

      // Assert: Manager can access the endpoint
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('captains');
      
      // Verify no sensitive compensation data is displayed
      if (data.captains && data.captains.length > 0) {
        const captain = data.captains[0] as CaptainPerformanceData;
        
        // Should NOT expose any payroll information
        expect(captain).not.toHaveProperty('rateJunkCaptain');
        expect(captain).not.toHaveProperty('salaryAmount');
        expect(captain).not.toHaveProperty('commissionRate');
      }
    });

    it('should allow admin to access rankings without payroll data exposure', async () => {
      // Arrange: Mock admin session
      mockAuth.mockResolvedValue({
        user: {
          id: 'admin-1',
          email: 'admin@test.com',
          fullName: 'Admin User',
          roles: ['admin'],
        },
      });

      // Act: Call the API
      const request = new Request('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);
      const data = await response.json();

      // Assert: Admin can access the endpoint
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('captains');
      
      // Verify no sensitive compensation data is displayed (even for admin)
      if (data.captains && data.captains.length > 0) {
        const captain = data.captains[0] as CaptainPerformanceData;
        
        // Should NOT expose any payroll information in rankings API
        expect(captain).not.toHaveProperty('rateJunkCaptain');
        expect(captain).not.toHaveProperty('salaryAmount');
        expect(captain).not.toHaveProperty('commissionRate');
      }
    });

    it('should deny access to unauthenticated users', async () => {
      // Arrange: Mock no session
      mockAuth.mockResolvedValue(null);

      // Act: Call the API
      const request = new Request('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);

      // Assert: Unauthenticated users are denied
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Authentication required');
    });
  });

  describe('Data structure validation', () => {
    it('should return properly structured performance data without sensitive information', async () => {
      // Arrange: Mock authenticated user
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@test.com',
          fullName: 'Test User',
          roles: ['sales'],
        },
      });

      // Act: Call the API
      const request = new Request('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);
      const data = await response.json();

      // Assert: Response structure is correct
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('captains');
      expect(data).toHaveProperty('dateRange');
      expect(data).toHaveProperty('totalCaptains');
      
      expect(data.dateRange).toHaveProperty('startDate');
      expect(data.dateRange).toHaveProperty('endDate');
      expect(typeof data.totalCaptains).toBe('number');
      expect(Array.isArray(data.captains)).toBe(true);

      // Verify each captain object structure
      if (data.captains && data.captains.length > 0) {
        data.captains.forEach((captain: CaptainPerformanceData) => {
          // Required performance fields
          expect(captain).toHaveProperty('captainId');
          expect(captain).toHaveProperty('captainName');
          expect(captain).toHaveProperty('junkMetrics');
          expect(captain).toHaveProperty('moveMetrics');
          
          // Junk metrics structure
          expect(captain.junkMetrics).toHaveProperty('jobCount');
          expect(captain.junkMetrics).toHaveProperty('totalRevenue');
          expect(captain.junkMetrics).toHaveProperty('averageJobSize');
          expect(captain.junkMetrics).toHaveProperty('laborPercentage');
          expect(captain.junkMetrics).toHaveProperty('disposalPercentage');
          
          // Move metrics structure
          expect(captain.moveMetrics).toHaveProperty('jobCount');
          expect(captain.moveMetrics).toHaveProperty('totalRevenue');
          expect(captain.moveMetrics).toHaveProperty('averageJobSize');
          expect(captain.moveMetrics).toHaveProperty('laborPercentage');
          expect(captain.moveMetrics).toHaveProperty('upsellRevenue');
          expect(captain.moveMetrics).toHaveProperty('upsellPercentage');
          expect(captain.moveMetrics).toHaveProperty('valuationRevenue');
          expect(captain.moveMetrics).toHaveProperty('valuationPercentage');
          expect(captain.moveMetrics).toHaveProperty('junkOnMoveRevenue');
          expect(captain.moveMetrics).toHaveProperty('junkOnMovePercentage');
          expect(captain.moveMetrics).toHaveProperty('materialsRevenue');
          expect(captain.moveMetrics).toHaveProperty('materialsPercentage');
          
          // Ensure no sensitive data is present
          const sensitiveFields = [
            'rateJunkCaptain', 'rateJunkWingman', 'rateMoveCaptain', 'rateMoveWingman',
            'rateZigma', 'rateTraining', 'rateEstimating', 'rateWarehouse', 'rateAdmin',
            'salaryAmount', 'salaryFrequency', 'salaryType', 'commissionRate',
            'junkBonusGoal', 'moveBonusGoal'
          ];
          
          sensitiveFields.forEach(field => {
            expect(captain).not.toHaveProperty(field);
          });
        });
      }
    });
  });

  describe('Performance metrics validation', () => {
    it('should ensure labor percentages are displayed without exposing actual labor costs', async () => {
      // Arrange: Mock authenticated user
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'user@test.com',
          fullName: 'Test User',
          roles: ['sales'],
        },
      });

      // Act: Call the API
      const request = new Request('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);
      const data = await response.json();

      // Assert: Labor percentages are available but not labor costs
      if (data.captains && data.captains.length > 0) {
        data.captains.forEach((captain: CaptainPerformanceData) => {
          // Should have labor percentage (performance metric)
          expect(captain.junkMetrics).toHaveProperty('laborPercentage');
          expect(captain.moveMetrics).toHaveProperty('laborPercentage');
          
          // Should NOT have actual labor costs or rates
          expect(captain.junkMetrics).not.toHaveProperty('laborCost');
          expect(captain.junkMetrics).not.toHaveProperty('totalLaborCost');
          expect(captain.moveMetrics).not.toHaveProperty('laborCost');
          expect(captain.moveMetrics).not.toHaveProperty('totalLaborCost');
          
          // Labor percentages should be numbers
          expect(typeof captain.junkMetrics.laborPercentage).toBe('number');
          expect(typeof captain.moveMetrics.laborPercentage).toBe('number');
        });
      }
    });
  });
});