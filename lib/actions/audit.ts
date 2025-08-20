'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { AuditLog } from '@/types';

interface AuditFilters {
  entityType?: string;
  action?: string;
  userId?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAuditLogs(
  filters: AuditFilters = {},
  page: number = 1,
  limit: number = 50
): Promise<{
  success: boolean;
  data: { logs: AuditLog[]; total: number };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        data: { logs: [], total: 0 },
        error: 'Unauthorized',
      };
    }

    // Check if user has manager or admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.some((role) => ['manager', 'admin'].includes(role))) {
      return {
        success: false,
        data: { logs: [], total: 0 },
        error: 'Insufficient permissions',
      };
    }

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.startDate || filters.endDate) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (filters.startDate) {
        createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        createdAt.lte = new Date(filters.endDate);
      }
      where.createdAt = createdAt;
    }

    // Get total count
    const total = await prisma.auditLog.count({ where });

    // Get paginated results
    const logs = await prisma.auditLog.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: {
        logs: logs as AuditLog[],
        total,
      },
    };
  } catch (error) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch audit logs:', error);
    }
    return {
      success: false,
      data: { logs: [], total: 0 },
      error: 'Failed to fetch audit logs',
    };
  }
}

export async function getEntityAuditHistory(
  entityType: string,
  entityId: string
): Promise<{
  success: boolean;
  data: AuditLog[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, data: [], error: 'Unauthorized' };
    }

    // Check if user has manager or admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.some((role) => ['manager', 'admin'].includes(role))) {
      return { success: false, data: [], error: 'Insufficient permissions' };
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
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
    });

    return {
      success: true,
      data: logs as AuditLog[],
    };
  } catch (error) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch entity audit history:', error);
    }
    return {
      success: false,
      data: [],
      error: 'Failed to fetch audit history',
    };
  }
}

export async function getUserActivitySummary(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  success: boolean;
  data: {
    totalActions: number;
    actionBreakdown: Record<string, number>;
    entityBreakdown: Record<string, number>;
    recentActivity: AuditLog[];
  };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        data: {
          totalActions: 0,
          actionBreakdown: {},
          entityBreakdown: {},
          recentActivity: [],
        },
        error: 'Unauthorized',
      };
    }

    // Check if user has manager or admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    if (!user?.roles.some((role) => ['manager', 'admin'].includes(role))) {
      return {
        success: false,
        data: {
          totalActions: 0,
          actionBreakdown: {},
          entityBreakdown: {},
          recentActivity: [],
        },
        error: 'Insufficient permissions',
      };
    }

    const where: Record<string, unknown> = { userId };

    if (startDate || endDate) {
      const createdAt: { gte?: Date; lte?: Date } = {};
      if (startDate) createdAt.gte = startDate;
      if (endDate) createdAt.lte = endDate;
      where.createdAt = createdAt;
    }

    // Get total actions
    const totalActions = await prisma.auditLog.count({ where });

    // Get action breakdown
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: { action: true },
    });

    const actionBreakdown = actionCounts.reduce(
      (acc, item) => {
        acc[item.action] = item._count.action;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get entity breakdown
    const entityCounts = await prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: { entityType: true },
    });

    const entityBreakdown = entityCounts.reduce(
      (acc, item) => {
        acc[item.entityType] = item._count.entityType;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      where,
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
      take: 10,
    });

    return {
      success: true,
      data: {
        totalActions,
        actionBreakdown,
        entityBreakdown,
        recentActivity: recentActivity as AuditLog[],
      },
    };
  } catch (error) {
    // Failed to fetch user activity summary
    console.error('Failed to fetch user activity summary:', error);
    return {
      success: false,
      data: {
        totalActions: 0,
        actionBreakdown: {},
        entityBreakdown: {},
        recentActivity: [],
      },
      error: 'Failed to fetch activity summary',
    };
  }
}
