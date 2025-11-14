import { getUsers, getUserById } from '@/lib/actions/users';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { vi } from 'vitest';

// Mock the auth session
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

const mockGetSession = vi.mocked(getSession);
const mockPrisma = vi.mocked(prisma);

describe('Manager User Access Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should filter users for managers to only show captains and wingmen', async () => {
      // Mock manager session
      mockGetSession.mockResolvedValue({
        user: {
          id: 'manager1',
          email: 'manager@test.com',
          fullName: 'Test Manager',
          roles: ['manager'],
        },
      } as any);

      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'captain1',
          email: 'captain@test.com',
          fullName: 'Test Captain',
          roles: ['captain'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'wingman1',
          email: 'wingman@test.com',
          fullName: 'Test Wingman',
          roles: ['wingman'],
          junkBonusGoal: 0.14,
          moveBonusGoal: 0.24,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as any);

      const result = await getUsers();

      expect(result.success).toBe(true);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            roles: { hasSome: ['captain', 'wingman'] },
          }),
        })
      );
    });

    it('should not filter users for admins', async () => {
      // Mock admin session
      mockGetSession.mockResolvedValue({
        user: {
          id: 'admin1',
          email: 'admin@test.com',
          fullName: 'Test Admin',
          roles: ['admin'],
        },
      } as any);

      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await getUsers();

      expect(result.success).toBe(true);
      // Should not have manager filtering condition
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    it('should reject unauthorized users', async () => {
      // Mock unauthorized session
      mockGetSession.mockResolvedValue({
        user: {
          id: 'captain1',
          email: 'captain@test.com',
          fullName: 'Test Captain',
          roles: ['captain'],
        },
      } as any);

      const result = await getUsers();

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Unauthorized: Admin or Manager access required'
      );
    });
  });

  describe('getUserById', () => {
    it('should allow manager to access captain user and log access', async () => {
      // Mock manager session
      mockGetSession.mockResolvedValue({
        user: {
          id: 'manager1',
          email: 'manager@test.com',
          fullName: 'Test Manager',
          roles: ['manager'],
        },
      } as any);

      const mockCaptainUser = {
        id: 'captain1',
        email: 'captain@test.com',
        fullName: 'Test Captain',
        roles: ['captain'],
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockCaptainUser as any);
      mockPrisma.auditLog.create.mockResolvedValue({} as any);

      const result = await getUserById('captain1');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockCaptainUser);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'user_access',
          entityId: 'captain1',
          action: 'manager_view_user',
          userId: 'manager1',
          changes: expect.objectContaining({
            action: 'manager_access',
            targetUserId: 'captain1',
            targetUserRoles: ['captain'],
            accessType: 'view_user_profile',
          }),
        }),
      });
    });

    it('should deny manager access to sales user', async () => {
      // Mock manager session
      mockGetSession.mockResolvedValue({
        user: {
          id: 'manager1',
          email: 'manager@test.com',
          fullName: 'Test Manager',
          roles: ['manager'],
        },
      } as any);

      const mockSalesUser = {
        id: 'sales1',
        email: 'sales@test.com',
        fullName: 'Test Sales',
        roles: ['sales'],
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockSalesUser as any);

      const result = await getUserById('sales1');

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Access denied: Managers can only view captain and wingman users'
      );
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should allow admin to access any user without logging', async () => {
      // Mock admin session
      mockGetSession.mockResolvedValue({
        user: {
          id: 'admin1',
          email: 'admin@test.com',
          fullName: 'Test Admin',
          roles: ['admin'],
        },
      } as any);

      const mockSalesUser = {
        id: 'sales1',
        email: 'sales@test.com',
        fullName: 'Test Sales',
        roles: ['sales'],
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockSalesUser as any);

      const result = await getUserById('sales1');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockSalesUser);
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });
  });
});
