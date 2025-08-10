'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export interface DashboardMetrics {
  pendingLogs: {
    count: number;
    change?: {
      value: number;
      type: 'increase' | 'decrease' | 'neutral';
      period: string;
    };
  };
  commissionEntries: {
    count: number;
    change?: {
      value: number;
      type: 'increase' | 'decrease' | 'neutral';
      period: string;
    };
  };
  activeUsers: {
    count: number;
    change?: {
      value: number;
      type: 'increase' | 'decrease' | 'neutral';
      period: string;
    };
  };
  currentPayPeriod: {
    status: string;
    name?: string;
    daysRemaining?: number;
  };
  recentActivity: Array<{
    id: string;
    type: 'log' | 'commission' | 'user';
    description: string;
    timestamp: Date;
    user: string;
  }>;
}

export async function getDashboardMetrics(): Promise<{
  success: boolean;
  data?: DashboardMetrics;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    // Get current date for comparisons
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch pending logs count
    const pendingLogsCount = await prisma.dailyLog.count({
      where: { status: 'submitted' }
    });

    // Get pending logs from last week for comparison
    const pendingLogsLastWeek = await prisma.dailyLog.count({
      where: {
        status: 'submitted',
        submittedAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo
        }
      }
    });

    // Calculate pending logs change
    const pendingLogsChange = pendingLogsLastWeek > 0 
      ? ((pendingLogsCount - pendingLogsLastWeek) / pendingLogsLastWeek) * 100
      : pendingLogsCount > 0 ? 100 : 0;

    // Fetch commission entries count (this week)
    const commissionEntriesCount = await prisma.commissionEntry.count({
      where: {
        createdAt: { gte: oneWeekAgo }
      }
    });

    // Get commission entries from previous week for comparison
    const commissionEntriesLastWeek = await prisma.commissionEntry.count({
      where: {
        createdAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo
        }
      }
    });

    // Calculate commission entries change
    const commissionEntriesChange = commissionEntriesLastWeek > 0
      ? ((commissionEntriesCount - commissionEntriesLastWeek) / commissionEntriesLastWeek) * 100
      : commissionEntriesCount > 0 ? 100 : 0;

    // Fetch active users count
    const activeUsersCount = await prisma.user.count();

    // Get users from last month for comparison (assuming relatively stable)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const usersLastMonth = await prisma.user.count({
      where: {
        createdAt: { lt: oneMonthAgo }
      }
    });

    // Calculate active users change
    const activeUsersChange = usersLastMonth > 0
      ? ((activeUsersCount - usersLastMonth) / usersLastMonth) * 100
      : activeUsersCount > 0 ? 100 : 0;

    // Fetch current pay period
    const currentPayPeriod = await prisma.payPeriod.findFirst({
      where: {
        AND: [
          { startDate: { lte: now } },
          { endDate: { gte: now } }
        ]
      },
      orderBy: { startDate: 'desc' }
    });

    // Calculate days remaining in current pay period
    const daysRemaining = currentPayPeriod 
      ? Math.ceil((currentPayPeriod.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : undefined;

    // Fetch recent activity (last 10 items)
    const recentLogs = await prisma.dailyLog.findMany({
      where: {
        updatedAt: { gte: oneWeekAgo }
      },
      include: {
        captain: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const recentCommissions = await prisma.commissionEntry.findMany({
      where: {
        updatedAt: { gte: oneWeekAgo }
      },
      include: {
        sales: { select: { fullName: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    // Combine and format recent activity
    const recentActivity = [
      ...recentLogs.map(log => ({
        id: log.id,
        type: 'log' as const,
        description: `Log ${log.status} by ${log.captain.fullName}${log.approvedBy ? ` (approved by ${log.approvedBy.fullName})` : ''}`,
        timestamp: log.updatedAt,
        user: log.captain.fullName
      })),
      ...recentCommissions.map(commission => ({
        id: commission.id,
        type: 'commission' as const,
        description: `Commission entry ${commission.status} for job ${commission.jobId}`,
        timestamp: commission.updatedAt,
        user: commission.sales.fullName
      }))
    ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

    const metrics: DashboardMetrics = {
      pendingLogs: {
        count: pendingLogsCount,
        change: {
          value: Math.round(pendingLogsChange * 10) / 10, // Round to 1 decimal
          type: pendingLogsChange > 0 ? 'increase' : pendingLogsChange < 0 ? 'decrease' : 'neutral',
          period: 'vs last week'
        }
      },
      commissionEntries: {
        count: commissionEntriesCount,
        change: {
          value: Math.round(commissionEntriesChange * 10) / 10,
          type: commissionEntriesChange > 0 ? 'increase' : commissionEntriesChange < 0 ? 'decrease' : 'neutral',
          period: 'vs last week'
        }
      },
      activeUsers: {
        count: activeUsersCount,
        change: {
          value: Math.round(activeUsersChange * 10) / 10,
          type: activeUsersChange > 0 ? 'increase' : activeUsersChange < 0 ? 'decrease' : 'neutral',
          period: 'vs last month'
        }
      },
      currentPayPeriod: {
        status: currentPayPeriod?.status || 'No active period',
        name: currentPayPeriod?.name,
        daysRemaining
      },
      recentActivity
    };

    return { success: true, data: metrics };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard metrics' 
    };
  }
}

export interface RoleSpecificMetrics {
  captain?: {
    draftLogs: number;
    submittedLogs: number;
  };
  sales?: {
    pendingCommissions: number;
    matchedCommissions: number;
  };
  manager?: {
    logsAwaitingReview: number;
    recentApprovals: number;
  };
}

// Get role-specific metrics for different user types
export async function getRoleSpecificMetrics(userRoles: string[]): Promise<{
  success: boolean;
  data?: RoleSpecificMetrics;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const metrics: RoleSpecificMetrics = {};

    // Captain-specific metrics
    if (userRoles.includes('captain')) {
      const myDraftLogs = await prisma.dailyLog.count({
        where: {
          captainId: session.user.id,
          status: 'draft'
        }
      });

      const mySubmittedLogs = await prisma.dailyLog.count({
        where: {
          captainId: session.user.id,
          status: 'submitted'
        }
      });

      metrics.captain = {
        draftLogs: myDraftLogs,
        submittedLogs: mySubmittedLogs
      };
    }

    // Sales-specific metrics
    if (userRoles.includes('sales')) {
      const myPendingCommissions = await prisma.commissionEntry.count({
        where: {
          salesId: session.user.id,
          status: 'pending'
        }
      });

      const myMatchedCommissions = await prisma.commissionEntry.count({
        where: {
          salesId: session.user.id,
          status: 'matched'
        }
      });

      metrics.sales = {
        pendingCommissions: myPendingCommissions,
        matchedCommissions: myMatchedCommissions
      };
    }

    // Manager-specific metrics
    if (userRoles.includes('manager')) {
      const logsAwaitingReview = await prisma.dailyLog.count({
        where: { status: 'submitted' }
      });

      const recentApprovals = await prisma.dailyLog.count({
        where: {
          status: 'approved',
          approvedById: session.user.id,
          approvedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      metrics.manager = {
        logsAwaitingReview,
        recentApprovals
      };
    }

    return { success: true, data: metrics };
  } catch (error) {
    console.error('Error fetching role-specific metrics:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch role-specific metrics' 
    };
  }
}