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
      where: { status: 'submitted' },
    });

    // Get pending logs from last week for comparison
    const pendingLogsLastWeek = await prisma.dailyLog.count({
      where: {
        status: 'submitted',
        submittedAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo,
        },
      },
    });

    // Calculate pending logs change
    const pendingLogsChange =
      pendingLogsLastWeek > 0
        ? ((pendingLogsCount - pendingLogsLastWeek) / pendingLogsLastWeek) * 100
        : pendingLogsCount > 0
          ? 100
          : 0;

    // Fetch commission entries count (this week)
    const commissionEntriesCount = await prisma.commissionEntry.count({
      where: {
        createdAt: { gte: oneWeekAgo },
      },
    });

    // Get commission entries from previous week for comparison
    const commissionEntriesLastWeek = await prisma.commissionEntry.count({
      where: {
        createdAt: {
          gte: twoWeeksAgo,
          lt: oneWeekAgo,
        },
      },
    });

    // Calculate commission entries change
    const commissionEntriesChange =
      commissionEntriesLastWeek > 0
        ? ((commissionEntriesCount - commissionEntriesLastWeek) /
            commissionEntriesLastWeek) *
          100
        : commissionEntriesCount > 0
          ? 100
          : 0;

    // Fetch active users count
    const activeUsersCount = await prisma.user.count();

    // Get users from last month for comparison (assuming relatively stable)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const usersLastMonth = await prisma.user.count({
      where: {
        createdAt: { lt: oneMonthAgo },
      },
    });

    // Calculate active users change
    const activeUsersChange =
      usersLastMonth > 0
        ? ((activeUsersCount - usersLastMonth) / usersLastMonth) * 100
        : activeUsersCount > 0
          ? 100
          : 0;

    // Fetch current pay period
    const currentPayPeriod = await prisma.payPeriod.findFirst({
      where: {
        AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }],
      },
      orderBy: { startDate: 'desc' },
    });

    // Calculate days remaining in current pay period
    const daysRemaining = currentPayPeriod
      ? Math.ceil(
          (currentPayPeriod.endDate.getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000)
        )
      : undefined;

    // Fetch recent activity (last 10 items)
    const recentLogs = await prisma.dailyLog.findMany({
      where: {
        updatedAt: { gte: oneWeekAgo },
      },
      include: {
        captain: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    const recentCommissions = await prisma.commissionEntry.findMany({
      where: {
        updatedAt: { gte: oneWeekAgo },
      },
      include: {
        sales: { select: { fullName: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    // Combine and format recent activity
    const recentActivity = [
      ...recentLogs.map((log) => ({
        id: log.id,
        type: 'log' as const,
        description: `Log ${log.status} by ${log.captain.fullName}${log.approvedBy ? ` (approved by ${log.approvedBy.fullName})` : ''}`,
        timestamp: log.updatedAt,
        user: log.captain.fullName,
      })),
      ...recentCommissions.map((commission) => ({
        id: commission.id,
        type: 'commission' as const,
        description: `Commission entry ${commission.status} for job ${commission.jobId}`,
        timestamp: commission.updatedAt,
        user: commission.sales.fullName,
      })),
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    const metrics: DashboardMetrics = {
      pendingLogs: {
        count: pendingLogsCount,
        change: {
          value: Math.round(pendingLogsChange * 10) / 10, // Round to 1 decimal
          type:
            pendingLogsChange > 0
              ? 'increase'
              : pendingLogsChange < 0
                ? 'decrease'
                : 'neutral',
          period: 'vs last week',
        },
      },
      commissionEntries: {
        count: commissionEntriesCount,
        change: {
          value: Math.round(commissionEntriesChange * 10) / 10,
          type:
            commissionEntriesChange > 0
              ? 'increase'
              : commissionEntriesChange < 0
                ? 'decrease'
                : 'neutral',
          period: 'vs last week',
        },
      },
      activeUsers: {
        count: activeUsersCount,
        change: {
          value: Math.round(activeUsersChange * 10) / 10,
          type:
            activeUsersChange > 0
              ? 'increase'
              : activeUsersChange < 0
                ? 'decrease'
                : 'neutral',
          period: 'vs last month',
        },
      },
      currentPayPeriod: {
        status: currentPayPeriod?.status || 'No active period',
        name: currentPayPeriod?.name,
        daysRemaining,
      },
      recentActivity,
    };

    return { success: true, data: metrics };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard metrics',
    };
  }
}

export interface RoleSpecificMetrics {
  captain?: {
    draftLogs: number;
    submittedLogs: number;
    // Enhanced stats for captain dashboard
    currentPayPeriodRevenue: number;
    currentPayPeriodTips: number;
    junkLaborBonus: number; // Weekly average
    moveLaborBonus: number; // Weekly average
    averageHourlyRate: number; // Including gross hourly + tips + bonuses per hour
    currentPayPeriodHours: number;
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
      // Get current pay period
      const now = new Date();
      const currentPayPeriod = await prisma.payPeriod.findFirst({
        where: {
          AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }],
        },
        orderBy: { startDate: 'desc' },
      });

      const myDraftLogs = await prisma.dailyLog.count({
        where: {
          captainId: session.user.id,
          status: 'draft',
        },
      });

      const mySubmittedLogs = await prisma.dailyLog.count({
        where: {
          captainId: session.user.id,
          status: 'submitted',
        },
      });

      // Get captain's approved logs in current pay period
      const payPeriodStart =
        currentPayPeriod?.startDate ||
        new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const payPeriodEnd = currentPayPeriod?.endDate || now;

      const approvedLogs = await prisma.dailyLog.findMany({
        where: {
          captainId: session.user.id,
          status: 'approved',
          approvedAt: {
            gte: payPeriodStart,
            lte: payPeriodEnd,
          },
        },
        include: {
          jobs: true,
          hours: {
            include: {
              employee: {
                select: {
                  id: true,
                  rateJunkCaptain: true,
                  rateJunkWingman: true,
                  rateMoveCaptain: true,
                  rateMoveWingman: true,
                  rateZigma: true,
                  rateTraining: true,
                  rateEstimating: true,
                  rateWarehouse: true,
                  rateAdmin: true,
                },
              },
            },
          },
          captain: {
            select: {
              junkBonusGoal: true,
              moveBonusGoal: true,
            },
          },
        },
      });

      // Calculate current pay period revenue and tips
      let currentPayPeriodRevenue = 0;
      let currentPayPeriodTips = 0;
      let totalHours = 0;
      let totalGrossWages = 0;

      // Weekly aggregation for bonus calculations
      let totalJunkRevenue = 0;
      let totalJunkLaborCost = 0;
      let totalMoveRevenue = 0;
      let totalMoveLaborCost = 0;
      let junkBonusGoal = 0.14; // Default
      let moveBonusGoal = 0.24; // Default

      for (const log of approvedLogs) {
        // Update bonus goal from captain settings (use first log's settings)
        if (approvedLogs.indexOf(log) === 0) {
          junkBonusGoal = Number(log.captain.junkBonusGoal) || 0.14;
          moveBonusGoal = Number(log.captain.moveBonusGoal) || 0.24;
        }

        // Calculate revenue and tips
        for (const job of log.jobs) {
          currentPayPeriodRevenue += Number(job.revenue);
          currentPayPeriodTips += Number(job.tips);

          // Aggregate revenue by job type for bonus calculation
          if (job.jobType === 'junk') {
            totalJunkRevenue += Number(job.revenue);
          } else if (job.jobType === 'move') {
            totalMoveRevenue += Number(job.revenue);
          }
        }

        // Aggregate labor costs by department for bonus calculation
        for (const hour of log.hours) {
          if (hour.department === 'junk') {
            const rate =
              log.captainId === hour.employeeId || hour.isCoCaptain
                ? Number(hour.employee.rateJunkCaptain || 0)
                : Number(hour.employee.rateJunkWingman || 0);
            totalJunkLaborCost += Number(hour.hours) * rate;
          } else if (hour.department === 'move') {
            const rate =
              log.captainId === hour.employeeId || hour.isCoCaptain
                ? Number(hour.employee.rateMoveCaptain || 0)
                : Number(hour.employee.rateMoveWingman || 0);
            totalMoveLaborCost += Number(hour.hours) * rate;
          }

          // Calculate captain's hours and wages
          if (hour.employeeId === session.user.id) {
            totalHours += Number(hour.hours);

            // Calculate hourly rate based on department
            let rate = 0;
            switch (hour.department) {
              case 'junk':
                rate = Number(hour.employee.rateJunkCaptain || 0);
                break;
              case 'move':
                rate = Number(hour.employee.rateMoveCaptain || 0);
                break;
              case 'zigma':
                rate = Number(hour.employee.rateZigma || 0);
                break;
              case 'training':
                rate = Number(hour.employee.rateTraining || 0);
                break;
              case 'estimating':
                rate = Number(hour.employee.rateEstimating || 0);
                break;
              case 'warehouse':
                rate = Number(hour.employee.rateWarehouse || 0);
                break;
              case 'admin':
                rate = Number(hour.employee.rateAdmin || 0);
                break;
            }

            totalGrossWages += Number(hour.hours) * rate;
          }
        }
      }

      // Calculate weekly aggregated bonuses
      let totalJunkBonus = 0;
      let totalMoveBonus = 0;

      // Junk section bonus (weekly aggregate)
      if (totalJunkRevenue > 0) {
        const junkLaborPercentage = totalJunkLaborCost / totalJunkRevenue;
        if (junkLaborPercentage < junkBonusGoal) {
          totalJunkBonus =
            (junkBonusGoal - junkLaborPercentage) * totalJunkRevenue;
        }
      }

      // Move section bonus (weekly aggregate)
      if (totalMoveRevenue > 0) {
        const moveLaborPercentage = totalMoveLaborCost / totalMoveRevenue;
        if (moveLaborPercentage < moveBonusGoal) {
          totalMoveBonus =
            (moveBonusGoal - moveLaborPercentage) * totalMoveRevenue;
        }
      }

      // Calculate weekly averages for bonuses (assuming 2-week pay periods)
      const payPeriodDays = currentPayPeriod
        ? Math.ceil(
            (payPeriodEnd.getTime() - payPeriodStart.getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : 14;
      const weeksInPeriod = payPeriodDays / 7;

      const junkLaborBonusWeekly =
        weeksInPeriod > 0 ? totalJunkBonus / weeksInPeriod : totalJunkBonus;
      const moveLaborBonusWeekly =
        weeksInPeriod > 0 ? totalMoveBonus / weeksInPeriod : totalMoveBonus;

      // Calculate average hourly rate including gross wages, tips, and bonuses
      const totalCompensation =
        totalGrossWages +
        currentPayPeriodTips +
        totalJunkBonus +
        totalMoveBonus;
      const averageHourlyRate =
        totalHours > 0 ? totalCompensation / totalHours : 0;

      metrics.captain = {
        draftLogs: myDraftLogs,
        submittedLogs: mySubmittedLogs,
        currentPayPeriodRevenue:
          Math.round(currentPayPeriodRevenue * 100) / 100,
        currentPayPeriodTips: Math.round(currentPayPeriodTips * 100) / 100,
        junkLaborBonus: Math.round(junkLaborBonusWeekly * 100) / 100,
        moveLaborBonus: Math.round(moveLaborBonusWeekly * 100) / 100,
        averageHourlyRate: Math.round(averageHourlyRate * 100) / 100,
        currentPayPeriodHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
      };
    }

    // Sales-specific metrics
    if (userRoles.includes('sales')) {
      const myPendingCommissions = await prisma.commissionEntry.count({
        where: {
          salesId: session.user.id,
          status: 'pending',
        },
      });

      const myMatchedCommissions = await prisma.commissionEntry.count({
        where: {
          salesId: session.user.id,
          status: 'matched',
        },
      });

      metrics.sales = {
        pendingCommissions: myPendingCommissions,
        matchedCommissions: myMatchedCommissions,
      };
    }

    // Manager-specific metrics
    if (userRoles.includes('manager')) {
      const logsAwaitingReview = await prisma.dailyLog.count({
        where: { status: 'submitted' },
      });

      const recentApprovals = await prisma.dailyLog.count({
        where: {
          status: 'approved',
          approvedById: session.user.id,
          approvedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      });

      metrics.manager = {
        logsAwaitingReview,
        recentApprovals,
      };
    }

    return { success: true, data: metrics };
  } catch (error) {
    console.error('Error fetching role-specific metrics:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch role-specific metrics',
    };
  }
}
