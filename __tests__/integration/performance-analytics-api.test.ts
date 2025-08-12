import { NextRequest } from 'next/server';
import { GET } from '@/app/api/analytics/performance/route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { PerformanceRankingsResponse } from '@/types';
import { vi } from 'vitest';

// Mock the auth function
vi.mock('@/lib/auth');
const mockAuth = vi.mocked(auth);

// Mock prisma
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

const mockPrisma = vi.mocked(prisma);

describe('/api/analytics/performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return 401 when not authenticated', async () => {
      mockAuth.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Authentication required');
    });

    it('should return performance analytics for authenticated user', async () => {
      // Mock authenticated session
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      } as any);

      // Mock users data
      const mockUsers = [
        {
          id: 'captain-1',
          email: 'captain1@example.com',
          fullName: 'Captain One',
          roles: ['captain'],
          rateJunkCaptain: 20,
          rateJunkWingman: 15,
          rateMoveCaptain: 22,
          rateMoveWingman: 17,
          rateZigma: null,
          rateTraining: null,
          rateEstimating: null,
          rateWarehouse: null,
          rateAdmin: null,
          salaryAmount: null,
          salaryFrequency: null,
          salaryType: null,
          commissionRate: null,
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'captain-2',
          email: 'captain2@example.com',
          fullName: 'Captain Two',
          roles: ['captain'],
          rateJunkCaptain: 21,
          rateJunkWingman: 16,
          rateMoveCaptain: 23,
          rateMoveWingman: 18,
          rateZigma: null,
          rateTraining: null,
          rateEstimating: null,
          rateWarehouse: null,
          rateAdmin: null,
          salaryAmount: null,
          salaryFrequency: null,
          salaryType: null,
          commissionRate: null,
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock logs data
      const mockLogs = [
        {
          id: 'log-1',
          captainId: 'captain-1',
          logDate: new Date('2024-01-15'),
          status: 'approved',
          submittedAt: new Date('2024-01-15T10:00:00Z'),
          approvedAt: new Date('2024-01-15T11:00:00Z'),
          approvedById: 'manager-1',
          createdById: 'captain-1',
          lastEditedById: null,
          createdAt: new Date('2024-01-15T09:00:00Z'),
          updatedAt: new Date('2024-01-15T11:00:00Z'),
          captain: mockUsers[0],
          createdBy: mockUsers[0],
          approvedBy: {
            id: 'manager-1',
            email: 'manager@example.com',
            fullName: 'Manager One',
            roles: ['manager'],
            rateJunkCaptain: null,
            rateJunkWingman: null,
            rateMoveCaptain: null,
            rateMoveWingman: null,
            rateZigma: null,
            rateTraining: null,
            rateEstimating: null,
            rateWarehouse: null,
            rateAdmin: null,
            salaryAmount: null,
            salaryFrequency: null,
            salaryType: null,
            commissionRate: null,
            junkBonusGoal: 0.14,
            moveBonusGoal: 0.24,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          lastEditedBy: null,
          jobs: [
            {
              id: 'job-1',
              logId: 'log-1',
              jobType: 'junk',
              jobId: 'JOB-001',
              clientName: 'Test Client',
              revenue: 1000,
              tips: 50,
              junkOnMove: null,
              valuation: null,
              materials: null,
              disposalCost: 200,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'job-2',
              logId: 'log-1',
              jobType: 'move',
              jobId: 'JOB-002',
              clientName: 'Test Client 2',
              revenue: 1500,
              tips: 75,
              junkOnMove: 100,
              valuation: 200,
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
              employeeId: 'captain-1',
              department: 'junk',
              hours: 4,
              isCoCaptain: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              employee: mockUsers[0],
            },
            {
              id: 'hour-2',
              logId: 'log-1',
              employeeId: 'captain-1',
              department: 'move',
              hours: 6,
              isCoCaptain: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              employee: mockUsers[0],
            },
          ],
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers as any);
      mockPrisma.dailyLog.findMany.mockResolvedValue(mockLogs as any);

      const request = new NextRequest('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data: PerformanceRankingsResponse = await response.json();

      expect(data.captains).toHaveLength(2);
      expect(data.totalCaptains).toBe(2);
      expect(data.dateRange).toBeDefined();
      expect(data.dateRange.startDate).toBeDefined();
      expect(data.dateRange.endDate).toBeDefined();

      // Check captain performance data structure
      const captain1Data = data.captains.find(c => c.captainId === 'captain-1');
      expect(captain1Data).toBeDefined();
      expect(captain1Data?.captainName).toBe('Captain One');
      expect(captain1Data?.junkMetrics).toBeDefined();
      expect(captain1Data?.moveMetrics).toBeDefined();

      // Check junk metrics
      expect(captain1Data?.junkMetrics.jobCount).toBe(1);
      expect(captain1Data?.junkMetrics.totalRevenue).toBe(1000);
      expect(captain1Data?.junkMetrics.averageJobSize).toBe(1000);
      expect(captain1Data?.junkMetrics.disposalPercentage).toBe(0.2); // 200/1000

      // Check move metrics
      expect(captain1Data?.moveMetrics.jobCount).toBe(1);
      expect(captain1Data?.moveMetrics.totalRevenue).toBe(1500);
      expect(captain1Data?.moveMetrics.averageJobSize).toBe(1500);
      expect(captain1Data?.moveMetrics.valuationRevenue).toBe(200);
      expect(captain1Data?.moveMetrics.junkOnMoveRevenue).toBe(100);
      expect(captain1Data?.moveMetrics.materialsRevenue).toBe(50);
    });

    it('should handle date range filters', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.dailyLog.findMany.mockResolvedValue([]);

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const request = new NextRequest(
        `http://localhost:3000/api/analytics/performance?startDate=${startDate}&endDate=${endDate}`
      );
      
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      // Verify that prisma was called with the correct date filters
      expect(mockPrisma.dailyLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            approvedAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
        })
      );
    });

    it('should handle captain ID filters', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      } as any);

      const mockUsers = [
        {
          id: 'captain-1',
          email: 'captain1@example.com',
          fullName: 'Captain One',
          roles: ['captain'],
          rateJunkCaptain: 20,
          rateJunkWingman: 15,
          rateMoveCaptain: 22,
          rateMoveWingman: 17,
          rateZigma: null,
          rateTraining: null,
          rateEstimating: null,
          rateWarehouse: null,
          rateAdmin: null,
          salaryAmount: null,
          salaryFrequency: null,
          salaryType: null,
          commissionRate: null,
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'captain-2',
          email: 'captain2@example.com',
          fullName: 'Captain Two',
          roles: ['captain'],
          rateJunkCaptain: 21,
          rateJunkWingman: 16,
          rateMoveCaptain: 23,
          rateMoveWingman: 18,
          rateZigma: null,
          rateTraining: null,
          rateEstimating: null,
          rateWarehouse: null,
          rateAdmin: null,
          salaryAmount: null,
          salaryFrequency: null,
          salaryType: null,
          commissionRate: null,
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers as any);
      mockPrisma.dailyLog.findMany.mockResolvedValue([]);

      const captainIds = 'captain-1';
      const request = new NextRequest(
        `http://localhost:3000/api/analytics/performance?captainIds=${captainIds}`
      );
      
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data: PerformanceRankingsResponse = await response.json();

      // Should only return data for captain-1
      expect(data.captains).toHaveLength(1);
      expect(data.captains[0].captainId).toBe('captain-1');
    });

    it('should handle job type filters', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      } as any);

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.dailyLog.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/performance?includeJunk=false&includeMove=true'
      );
      
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data: PerformanceRankingsResponse = await response.json();

      expect(data).toBeDefined();
      // The filtering logic is handled in the calculation functions
      // This test ensures the API accepts the parameters correctly
    });

    it('should handle server errors gracefully', async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          fullName: 'Test User',
          roles: ['captain'],
        },
      } as any);

      // Mock a database error
      mockPrisma.user.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/analytics/performance');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch performance analytics');
    });
  });
});