import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createUser,
  updateUser,
  deleteUser,
  getUsers,
  getUserById,
  copyUserSettings,
} from '@/lib/actions/users';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
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

const mockSession = {
  user: {
    id: 'admin-user-id',
    roles: ['admin'],
  },
};

const mockUser = {
  id: 'user-1',
  email: 'john@example.com',
  fullName: 'John Doe',
  roles: ['captain'],
  rateJunkCaptain: 25.0,
  rateJunkWingman: 20.0,
  rateMoveCaptain: 30.0,
  rateMoveWingman: 25.0,
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
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('User Management Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getSession as any).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'john@example.com',
        fullName: 'John Doe',
        password: 'password123',
        roles: ['captain'] as any,
        rateJunkCaptain: 25.0,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      (prisma.user.findUnique as any).mockResolvedValue(null); // User doesn't exist
      (bcrypt.hash as any).mockResolvedValue('hashed-password');
      (prisma.user.create as any).mockResolvedValue(mockUser);
      (prisma.auditLog.create as any).mockResolvedValue({});

      const result = await createUser(userData);

      expect(result.success).toBe(true);
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: 'hashed-password',
        },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should fail if user already exists', async () => {
      const userData = {
        email: 'john@example.com',
        fullName: 'John Doe',
        password: 'password123',
        roles: ['captain'] as any,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser); // User exists

      const result = await createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User with this email already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should fail if user is not admin', async () => {
      (getSession as any).mockResolvedValue({
        user: { id: 'user-id', roles: ['captain'] },
      });

      const userData = {
        email: 'john@example.com',
        fullName: 'John Doe',
        password: 'password123',
        roles: ['captain'] as any,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      const result = await createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        id: 'user-1',
        email: 'john.updated@example.com',
        fullName: 'John Updated',
        roles: ['captain', 'manager'] as any,
        rateJunkCaptain: 30.0,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue({
        ...mockUser,
        ...updateData,
      });
      (prisma.auditLog.create as any).mockResolvedValue({});

      const result = await updateUser(updateData);

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          email: 'john.updated@example.com',
          fullName: 'John Updated',
          roles: ['captain', 'manager'],
          rateJunkCaptain: 30.0,
        }),
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should hash password if provided', async () => {
      const updateData = {
        id: 'user-1',
        email: 'john@example.com',
        fullName: 'John Doe',
        password: 'newpassword123',
        roles: ['captain'] as any,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.hash as any).mockResolvedValue('new-hashed-password');
      (prisma.user.update as any).mockResolvedValue(mockUser);
      (prisma.auditLog.create as any).mockResolvedValue({});

      const result = await updateUser(updateData);

      expect(result.success).toBe(true);
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          password: 'new-hashed-password',
        }),
      });
    });

    it('should fail if user not found', async () => {
      const updateData = {
        id: 'nonexistent-user',
        email: 'john@example.com',
        fullName: 'John Doe',
        roles: ['captain'] as any,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await updateUser(updateData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      (prisma.user.findUnique as any)
        .mockResolvedValueOnce(mockUser) // First call for existence check
        .mockResolvedValueOnce({
          // Second call for related data check
          ...mockUser,
          dailyLogs: [],
          logHours: [],
          commissionEntries: [],
        });
      (prisma.user.delete as any).mockResolvedValue(mockUser);
      (prisma.auditLog.create as any).mockResolvedValue({});

      const result = await deleteUser('user-1');

      expect(result.success).toBe(true);
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should fail if user has related data', async () => {
      (prisma.user.findUnique as any)
        .mockResolvedValueOnce(mockUser) // First call for existence check
        .mockResolvedValueOnce({
          // Second call for related data check
          ...mockUser,
          dailyLogs: [{ id: 'log-1' }],
          logHours: [],
          commissionEntries: [],
        });

      const result = await deleteUser('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Cannot delete user with existing logs, hours, or commission entries'
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('should fail if user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await deleteUser('nonexistent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('getUsers', () => {
    it('should return users with pagination', async () => {
      const mockUsers = [mockUser];
      (prisma.user.count as any).mockResolvedValue(1);
      (prisma.user.findMany as any).mockResolvedValue(mockUsers);

      const result = await getUsers({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        users: mockUsers,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      });
    });

    it('should filter by search term', async () => {
      (prisma.user.count as any).mockResolvedValue(1);
      (prisma.user.findMany as any).mockResolvedValue([mockUser]);

      const result = await getUsers({ search: 'john', page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { fullName: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
      });
    });

    it('should filter by roles', async () => {
      (prisma.user.count as any).mockResolvedValue(1);
      (prisma.user.findMany as any).mockResolvedValue([mockUser]);

      const result = await getUsers({ roles: ['captain'], page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: {
          roles: { hasSome: ['captain'] },
        },
      });
    });

    it('should fail if user is not admin or manager', async () => {
      (getSession as any).mockResolvedValue({
        user: { id: 'user-id', roles: ['captain'] },
      });

      const result = await getUsers();

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Unauthorized: Admin or Manager access required'
      );
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await getUserById('user-1');

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          id: true,
          email: true,
          fullName: true,
          roles: true,
        }),
      });
    });

    it('should fail if user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await getUserById('nonexistent-user');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });
  });

  describe('copyUserSettings', () => {
    it('should copy settings from source to target user', async () => {
      const sourceSettings = {
        rateJunkCaptain: 25.0,
        rateJunkWingman: 20.0,
        salaryAmount: 5000.0,
        salaryFrequency: 'monthly',
        salaryType: 'base',
        commissionRate: 5.0,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      (prisma.user.findUnique as any).mockResolvedValue(sourceSettings);
      (prisma.user.update as any).mockResolvedValue({});
      (prisma.auditLog.create as any).mockResolvedValue({});

      const result = await copyUserSettings('source-user-id', 'target-user-id');

      expect(result.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'target-user-id' },
        data: sourceSettings,
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'user',
          entityId: 'target-user-id',
          action: 'update',
          changes: {
            action: 'copy_settings',
            fromUserId: 'source-user-id',
            settings: sourceSettings,
          },
          userId: 'admin-user-id',
        }),
      });
    });

    it('should fail if source user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await copyUserSettings(
        'nonexistent-user',
        'target-user-id'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Source user not found');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should fail if user is not admin', async () => {
      (getSession as any).mockResolvedValue({
        user: { id: 'user-id', roles: ['manager'] },
      });

      const result = await copyUserSettings('source-user-id', 'target-user-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized: Admin access required');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as any).mockRejectedValue(
        new Error('Database error')
      );

      const result = await getUserById('user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle validation errors', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        fullName: '',
        password: '123', // Too short
        roles: [],
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      const result = await createUser(invalidUserData as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('email');
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate role assignments', async () => {
      const userData = {
        email: 'john@example.com',
        fullName: 'John Doe',
        password: 'password123',
        roles: ['invalid-role'] as any,
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      const result = await createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid option');
    });

    it('should validate bonus goal percentages', async () => {
      const userData = {
        email: 'john@example.com',
        fullName: 'John Doe',
        password: 'password123',
        roles: ['captain'] as any,
        junkBonusGoal: 1.5, // Invalid: > 1
        moveBonusGoal: -0.1, // Invalid: < 0
      };

      const result = await createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too big');
    });

    it('should validate hourly rates are non-negative', async () => {
      const userData = {
        email: 'john@example.com',
        fullName: 'John Doe',
        password: 'password123',
        roles: ['captain'] as any,
        rateJunkCaptain: -10.0, // Invalid: negative
        junkBonusGoal: 0.14,
        moveBonusGoal: 0.24,
      };

      const result = await createUser(userData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Too small');
    });
  });
});
