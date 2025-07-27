import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createUser, updateUser, deleteUser, getUsers, getUserById, copyUserSettings } from '@/lib/actions/users';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockPrisma = prisma as any;
const mockGetSession = getSession as any;
const mockBcrypt = bcrypt as any;

describe('User Management Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    const mockAdminSession = {
      user: { id: 'admin-id', roles: ['admin'] },
    };

    const validUserData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      roles: ['captain'] as const,
      rateJunkCaptain: 25.00,
      junkBonusGoal: 0.14,
      moveBonusGoal: 0.24,
    };

    it('should create a user successfully', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique.mockResolvedValue(null); // User doesn't exist
      mockBcrypt.hash.mockResolvedValue('hashed-password');
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user-id',
        email: validUserData.email,
        fullName: validUserData.fullName,
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await createUser(validUserData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: 'new-user-id',
        email: validUserData.email,
        fullName: validUserData.fullName,
      });
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          ...validUserData,
          password: 'hashed-password',
        },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should reject unauthorized users', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-id', roles: ['captain'] },
      });

      const result = await createUser(validUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });

    it('should reject duplicate email addresses', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      const result = await createUser(validUserData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');
    });

    it('should validate required fields', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);

      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        fullName: '',
        roles: [],
      };

      const result = await createUser(invalidData as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Please enter a valid email address');
    });
  });

  describe('updateUser', () => {
    const mockAdminSession = {
      user: { id: 'admin-id', roles: ['admin'] },
    };

    const existingUser = {
      id: 'user-id',
      email: 'old@example.com',
      fullName: 'Old Name',
      roles: ['wingman'],
    };

    const updateData = {
      id: 'user-id',
      email: 'new@example.com',
      fullName: 'New Name',
      roles: ['captain'] as const,
      rateJunkCaptain: 30.00,
    };

    it('should update a user successfully', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        id: updateData.id,
        email: updateData.email,
        fullName: updateData.fullName,
        roles: updateData.roles,
      });
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await updateUser(updateData);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          email: updateData.email,
          fullName: updateData.fullName,
          roles: updateData.roles,
          rateJunkCaptain: updateData.rateJunkCaptain,
        }),
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should hash password when provided', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockBcrypt.hash.mockResolvedValue('new-hashed-password');
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const dataWithPassword = { ...updateData, password: 'newpassword123' };
      await updateUser(dataWithPassword);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          password: 'new-hashed-password',
        }),
      });
    });

    it('should reject unauthorized users', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-id', roles: ['captain'] },
      });

      const result = await updateUser(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });

    it('should handle non-existent user', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await updateUser(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('deleteUser', () => {
    const mockAdminSession = {
      user: { id: 'admin-id', roles: ['admin'] },
    };

    const existingUser = {
      id: 'user-id',
      email: 'test@example.com',
      fullName: 'Test User',
      roles: ['wingman'],
      dailyLogs: [],
      logHours: [],
      commissionEntries: [],
    };

    it('should delete a user successfully', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser) // First call for existence check
        .mockResolvedValueOnce(existingUser); // Second call for related data check
      mockPrisma.user.delete.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await deleteUser('user-id');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should reject unauthorized users', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-id', roles: ['manager'] },
      });

      const result = await deleteUser('user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });

    it('should prevent deletion of users with related data', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce({
          ...existingUser,
          dailyLogs: [{ id: 'log-1' }], // Has related data
        });

      const result = await deleteUser('user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot delete user with existing logs, hours, or commission entries');
    });

    it('should handle non-existent user', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await deleteUser('user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('getUsers', () => {
    const mockManagerSession = {
      user: { id: 'manager-id', roles: ['manager'] },
    };

    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        fullName: 'User One',
        roles: ['captain'],
        createdAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        fullName: 'User Two',
        roles: ['wingman'],
        createdAt: new Date(),
      },
    ];

    it('should return users with pagination', async () => {
      mockGetSession.mockResolvedValue(mockManagerSession);
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await getUsers({
        page: 1,
        limit: 10,
        sortBy: 'fullName',
        sortOrder: 'asc',
      });

      expect(result.success).toBe(true);
      expect(result.data?.users).toEqual(mockUsers);
      expect(result.data?.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });

    it('should filter by search term', async () => {
      mockGetSession.mockResolvedValue(mockManagerSession);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue([mockUsers[0]]);

      await getUsers({
        search: 'User One',
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { fullName: { contains: 'User One', mode: 'insensitive' } },
            { email: { contains: 'User One', mode: 'insensitive' } },
          ],
        },
        select: expect.any(Object),
        orderBy: { fullName: 'asc' },
        skip: 0,
        take: 10,
      });
    });

    it('should filter by roles', async () => {
      mockGetSession.mockResolvedValue(mockManagerSession);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue([mockUsers[0]]);

      await getUsers({
        roles: ['captain'],
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          roles: { hasSome: ['captain'] },
        },
        select: expect.any(Object),
        orderBy: { fullName: 'asc' },
        skip: 0,
        take: 10,
      });
    });

    it('should reject unauthorized users', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-id', roles: ['captain'] },
      });

      const result = await getUsers();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin or Manager access required');
    });
  });

  describe('getUserById', () => {
    const mockManagerSession = {
      user: { id: 'manager-id', roles: ['manager'] },
    };

    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      fullName: 'Test User',
      roles: ['captain'],
    };

    it('should return user by ID', async () => {
      mockGetSession.mockResolvedValue(mockManagerSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserById('user-id');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        select: expect.any(Object),
      });
    });

    it('should handle non-existent user', async () => {
      mockGetSession.mockResolvedValue(mockManagerSession);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await getUserById('user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should reject unauthorized users', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-id', roles: ['captain'] },
      });

      const result = await getUserById('user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin or Manager access required');
    });
  });

  describe('copyUserSettings', () => {
    const mockAdminSession = {
      user: { id: 'admin-id', roles: ['admin'] },
    };

    const sourceUserSettings = {
      rateJunkCaptain: 25.00,
      rateJunkWingman: 20.00,
      salaryAmount: 50000,
      commissionRate: 5.0,
      junkBonusGoal: 0.14,
      moveBonusGoal: 0.24,
    };

    it('should copy user settings successfully', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique.mockResolvedValue(sourceUserSettings);
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await copyUserSettings('source-user-id', 'target-user-id');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'target-user-id' },
        data: sourceUserSettings,
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should reject unauthorized users', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-id', roles: ['manager'] },
      });

      const result = await copyUserSettings('source-id', 'target-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });

    it('should handle non-existent source user', async () => {
      mockGetSession.mockResolvedValue(mockAdminSession);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await copyUserSettings('source-id', 'target-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Source user not found');
    });
  });

  describe('Enhanced Search and Filtering', () => {
    const mockManagerSession = {
      user: { id: 'manager-id', roles: ['manager'] },
    };

    it('should filter by multiple roles', async () => {
      mockGetSession.mockResolvedValue(mockManagerSession);
      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.user.findMany.mockResolvedValue([]);

      await getUsers({
        roles: ['captain', 'manager'],
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          roles: { hasSome: ['captain', 'manager'] },
        },
        select: expect.any(Object),
        orderBy: { fullName: 'asc' },
        skip: 0,
        take: 10,
      });
    });

    it('should combine search and role filters', async () => {
      mockGetSession.mockResolvedValue(mockManagerSession);
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue([]);

      await getUsers({
        search: 'John',
        roles: ['captain'],
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              OR: [
                { fullName: { contains: 'John', mode: 'insensitive' } },
                { email: { contains: 'John', mode: 'insensitive' } },
              ],
            },
            {
              roles: { hasSome: ['captain'] },
            },
          ],
        },
        select: expect.any(Object),
        orderBy: { fullName: 'asc' },
        skip: 0,
        take: 10,
      });
    });

    it('should handle empty search and role filters', async () => {
      mockGetSession.mockResolvedValue(mockManagerSession);
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.user.findMany.mockResolvedValue([]);

      await getUsers({
        search: '',
        roles: [],
        page: 1,
        limit: 10,
      });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { fullName: 'asc' },
        skip: 0,
        take: 10,
      });
    });
  });
});