import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAuditLogs,
  getEntityAuditHistory,
  getUserActivitySummary,
} from '@/lib/actions/audit';
import {
  createAuditLog,
  trackChanges,
  logDailyLogChange,
} from '@/lib/auditLogger';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

const mockPrisma = prisma as any;
const mockAuth = vi.mocked(await import('@/lib/auth')).auth;

describe('Audit Trail System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuditLogs', () => {
    it('should return audit logs for authorized users', async () => {
      const mockSession = {
        user: { id: 'admin-user-id' },
      };
      const mockUser = {
        roles: ['admin'],
      };
      const mockAuditLogs = [
        {
          id: 'audit-1',
          entityType: 'daily_log',
          entityId: 'log-1',
          action: 'create',
          changes: { status: 'draft' },
          userId: 'user-1',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            fullName: 'John Doe',
            email: 'john@example.com',
          },
          dailyLog: null,
        },
      ];

      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.auditLog.count.mockResolvedValue(1);
      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await getAuditLogs({}, 1, 10);

      expect(result.success).toBe(true);
      expect(result.data.logs).toEqual(mockAuditLogs);
      expect(result.data.total).toBe(1);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          dailyLog: {
            select: {
              id: true,
              logDate: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      });
    });

    it('should deny access to unauthorized users', async () => {
      const mockSession = {
        user: { id: 'regular-user-id' },
      };
      const mockUser = {
        roles: ['captain'],
      };

      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getAuditLogs();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });

    it('should apply filters correctly', async () => {
      const mockSession = {
        user: { id: 'admin-user-id' },
      };
      const mockUser = {
        roles: ['admin'],
      };

      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const filters = {
        entityType: 'daily_log',
        action: 'create',
        userId: 'user-1',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      await getAuditLogs(filters);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'daily_log',
          action: 'create',
          userId: 'user-1',
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
    });
  });

  describe('getEntityAuditHistory', () => {
    it('should return audit history for specific entity', async () => {
      const mockSession = {
        user: { id: 'manager-user-id' },
      };
      const mockUser = {
        roles: ['manager'],
      };
      const mockAuditLogs = [
        {
          id: 'audit-1',
          entityType: 'daily_log',
          entityId: 'log-1',
          action: 'create',
          changes: null,
          userId: 'user-1',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            fullName: 'John Doe',
            email: 'john@example.com',
          },
          dailyLog: null,
        },
      ];

      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditLogs);

      const result = await getEntityAuditHistory('daily_log', 'log-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAuditLogs);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'daily_log',
          entityId: 'log-1',
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getUserActivitySummary', () => {
    it('should return user activity summary', async () => {
      const mockSession = {
        user: { id: 'admin-user-id' },
      };
      const mockUser = {
        roles: ['admin'],
      };

      mockAuth.mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.auditLog.count.mockResolvedValue(10);
      mockPrisma.auditLog.groupBy
        .mockResolvedValueOnce([
          { action: 'create', _count: { action: 5 } },
          { action: 'update', _count: { action: 3 } },
          { action: 'approve', _count: { action: 2 } },
        ])
        .mockResolvedValueOnce([
          { entityType: 'daily_log', _count: { entityType: 8 } },
          { entityType: 'commission_entry', _count: { entityType: 2 } },
        ]);
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const result = await getUserActivitySummary('user-1');

      expect(result.success).toBe(true);
      expect(result.data.totalActions).toBe(10);
      expect(result.data.actionBreakdown).toEqual({
        create: 5,
        update: 3,
        approve: 2,
      });
      expect(result.data.entityBreakdown).toEqual({
        daily_log: 8,
        commission_entry: 2,
      });
    });
  });

  describe('Audit Logger Utilities', () => {
    describe('trackChanges', () => {
      it('should track simple field changes', () => {
        const before = { status: 'draft', amount: 100 };
        const after = { status: 'submitted', amount: 150 };

        const changes = trackChanges(before, after);

        expect(changes).toEqual({
          status: { from: 'draft', to: 'submitted' },
          amount: { from: 100, to: 150 },
        });
      });

      it('should track added fields', () => {
        const before = { status: 'draft' };
        const after = { status: 'draft', approvedBy: 'manager-1' };

        const changes = trackChanges(before, after);

        expect(changes).toEqual({
          approvedBy: { to: 'manager-1' },
        });
      });

      it('should track removed fields', () => {
        const before = { status: 'draft', notes: 'temp notes' };
        const after = { status: 'draft' };

        const changes = trackChanges(before, after);

        expect(changes).toEqual({
          notes: { from: 'temp notes' },
        });
      });

      it('should track array changes', () => {
        const before = { jobs: [{ id: 1 }, { id: 2 }] };
        const after = { jobs: [{ id: 1 }, { id: 2 }, { id: 3 }] };

        const changes = trackChanges(before, after);

        expect(changes).toEqual({
          jobs: { from: '2 items', to: '3 items' },
        });
      });

      it('should ignore system fields', () => {
        const before = {
          id: 'old-id',
          status: 'draft',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        };
        const after = {
          id: 'new-id',
          status: 'submitted',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        };

        const changes = trackChanges(before, after);

        expect(changes).toEqual({
          status: { from: 'draft', to: 'submitted' },
        });
      });
    });

    describe('createAuditLog', () => {
      it('should create audit log entry', async () => {
        mockPrisma.auditLog.create.mockResolvedValue({});

        await createAuditLog({
          entityType: 'daily_log',
          entityId: 'log-1',
          action: 'create',
          userId: 'user-1',
          changes: { status: 'draft' },
          dailyLogId: 'log-1',
        });

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: {
            entityType: 'daily_log',
            entityId: 'log-1',
            action: 'create',
            userId: 'user-1',
            changes: { status: 'draft' },
            dailyLogId: 'log-1',
          },
        });
      });

      it('should handle errors gracefully', async () => {
        mockPrisma.auditLog.create.mockRejectedValue(
          new Error('Database error')
        );

        // Should not throw error
        await expect(
          createAuditLog({
            entityType: 'daily_log',
            entityId: 'log-1',
            action: 'create',
            userId: 'user-1',
          })
        ).resolves.toBeUndefined();
      });
    });

    describe('logDailyLogChange', () => {
      it('should log daily log changes with tracking', async () => {
        mockPrisma.auditLog.create.mockResolvedValue({});

        const beforeData = { status: 'draft', revenue: 100 };
        const afterData = { status: 'submitted', revenue: 150 };

        await logDailyLogChange(
          'submit',
          'log-1',
          'user-1',
          beforeData,
          afterData,
          { submittedAt: new Date() }
        );

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: {
            entityType: 'daily_log',
            entityId: 'log-1',
            action: 'submit',
            userId: 'user-1',
            changes: expect.objectContaining({
              status: { from: 'draft', to: 'submitted' },
              revenue: { from: 100, to: 150 },
              submittedAt: expect.any(String),
            }),
            dailyLogId: 'log-1',
          },
        });
      });
    });
  });
});
