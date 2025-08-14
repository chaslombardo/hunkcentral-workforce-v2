'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { convertUserDecimalFields } from '@/lib/decimal-utils';
import { safeFormatDate } from '@/lib/date-utils';

export interface AnalyticsOverview {
  totalRevenue: number;
  revenueChange: number;
  totalJobs: number;
  jobsChange: number;
  avgJobValue: number;
  avgJobValueChange: number;
  laborEfficiency: number;
  laborEfficiencyChange: number;
}

export interface JobTypeBreakdown {
  junk: { count: number; revenue: number; avgValue: number };
  move: { count: number; revenue: number; avgValue: number };
}

export interface TopPerformer {
  name: string;
  jobs: number;
  revenue: number;
  efficiency: number;
}

export interface CommissionStats {
  totalCommissions: number;
  avgAccuracy: number;
  pendingEntries: number;
  matchedEntries: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  jobTypes: JobTypeBreakdown;
  topPerformers: TopPerformer[];
  commissionStats: CommissionStats;
}

/**
 * Get comprehensive analytics data for the current month
 */
export async function getAnalyticsData(): Promise<{
  success: boolean;
  data?: AnalyticsData;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check if user has permission to view analytics
    const canViewAnalytics = 
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('admin');

    if (!canViewAnalytics) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Get current month and last month date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month data
    const currentMonthLogs = await prisma.dailyLog.findMany({
      where: {
        status: 'approved',
        approvedAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      include: {
        jobs: true,
        hours: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                rateJunkCaptain: true,
                rateJunkWingman: true,
                rateMoveCaptain: true,
                rateMoveWingman: true,
                rateZigma: true,
                rateTraining: true,
                rateEstimating: true,
                rateWarehouse: true,
                rateAdmin: true,
                junkBonusGoal: true,
                moveBonusGoal: true,
              },
            },
          },
        },
        captain: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Get last month data for comparison
    const lastMonthLogs = await prisma.dailyLog.findMany({
      where: {
        status: 'approved',
        approvedAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      include: {
        jobs: true,
        hours: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                rateJunkCaptain: true,
                rateJunkWingman: true,
                rateMoveCaptain: true,
                rateMoveWingman: true,
                rateZigma: true,
                rateTraining: true,
                rateEstimating: true,
                rateWarehouse: true,
                rateAdmin: true,
                junkBonusGoal: true,
                moveBonusGoal: true,
              },
            },
          },
        },
      },
    });

    // Calculate overview metrics
    const currentRevenue = currentMonthLogs.reduce((sum, log) => 
      sum + log.jobs.reduce((jobSum, job) => jobSum + Number(job.revenue), 0), 0
    );
    
    const lastRevenue = lastMonthLogs.reduce((sum, log) => 
      sum + log.jobs.reduce((jobSum, job) => jobSum + Number(job.revenue), 0), 0
    );

    const currentJobs = currentMonthLogs.reduce((sum, log) => sum + log.jobs.length, 0);
    const lastJobs = lastMonthLogs.reduce((sum, log) => sum + log.jobs.length, 0);

    const currentAvgJobValue = currentJobs > 0 ? currentRevenue / currentJobs : 0;
    const lastAvgJobValue = lastJobs > 0 ? lastRevenue / lastJobs : 0;

    // Calculate labor efficiency
    const currentLaborCost = currentMonthLogs.reduce((sum, log) => {
      return sum + log.hours.reduce((hourSum, hour) => {
        const employee = convertUserDecimalFields(hour.employee);
        let rate = 0;
        
        switch (hour.department) {
          case 'junk':
            rate = (log.captainId === hour.employeeId || hour.isCoCaptain) 
              ? (employee.rateJunkCaptain || 0) 
              : (employee.rateJunkWingman || 0);
            break;
          case 'move':
            rate = (log.captainId === hour.employeeId || hour.isCoCaptain) 
              ? (employee.rateMoveCaptain || 0) 
              : (employee.rateMoveWingman || 0);
            break;
          case 'zigma':
            rate = employee.rateZigma || 0;
            break;
          case 'training':
            rate = employee.rateTraining || 0;
            break;
          case 'estimating':
            rate = employee.rateEstimating || 0;
            break;
          case 'warehouse':
            rate = employee.rateWarehouse || 0;
            break;
          case 'admin':
            rate = employee.rateAdmin || 0;
            break;
        }
        
        return hourSum + (Number(hour.hours) * rate);
      }, 0);
    }, 0);

    const lastLaborCost = lastMonthLogs.reduce((sum, log) => {
      return sum + log.hours.reduce((hourSum, hour) => {
        const employee = convertUserDecimalFields(hour.employee);
        let rate = 0;
        
        switch (hour.department) {
          case 'junk':
            rate = (log.captainId === hour.employeeId || hour.isCoCaptain) 
              ? (employee.rateJunkCaptain || 0) 
              : (employee.rateJunkWingman || 0);
            break;
          case 'move':
            rate = (log.captainId === hour.employeeId || hour.isCoCaptain) 
              ? (employee.rateMoveCaptain || 0) 
              : (employee.rateMoveWingman || 0);
            break;
          case 'zigma':
            rate = employee.rateZigma || 0;
            break;
          case 'training':
            rate = employee.rateTraining || 0;
            break;
          case 'estimating':
            rate = employee.rateEstimating || 0;
            break;
          case 'warehouse':
            rate = employee.rateWarehouse || 0;
            break;
          case 'admin':
            rate = employee.rateAdmin || 0;
            break;
        }
        
        return hourSum + (Number(hour.hours) * rate);
      }, 0);
    }, 0);

    const currentLaborEfficiency = currentRevenue > 0 ? (currentLaborCost / currentRevenue) * 100 : 0;
    const lastLaborEfficiency = lastRevenue > 0 ? (lastLaborCost / lastRevenue) * 100 : 0;

    // Calculate job type breakdown
    const junkJobs = currentMonthLogs.flatMap(log => log.jobs.filter(job => job.jobType === 'junk'));
    const moveJobs = currentMonthLogs.flatMap(log => log.jobs.filter(job => job.jobType === 'move'));

    const junkRevenue = junkJobs.reduce((sum, job) => sum + Number(job.revenue), 0);
    const moveRevenue = moveJobs.reduce((sum, job) => sum + Number(job.revenue), 0);

    // Calculate top performers
    const captainPerformance = new Map<string, { name: string; jobs: number; revenue: number; laborCost: number }>();

    currentMonthLogs.forEach(log => {
      const captainId = log.captainId;
      const captainName = log.captain.fullName;
      
      if (!captainPerformance.has(captainId)) {
        captainPerformance.set(captainId, { name: captainName, jobs: 0, revenue: 0, laborCost: 0 });
      }
      
      const performance = captainPerformance.get(captainId)!;
      performance.jobs += log.jobs.length;
      performance.revenue += log.jobs.reduce((sum, job) => sum + Number(job.revenue), 0);
      
      // Calculate labor cost for this captain's logs
      const logLaborCost = log.hours.reduce((sum, hour) => {
        const employee = convertUserDecimalFields(hour.employee);
        let rate = 0;
        
        switch (hour.department) {
          case 'junk':
            rate = (log.captainId === hour.employeeId || hour.isCoCaptain) 
              ? (employee.rateJunkCaptain || 0) 
              : (employee.rateJunkWingman || 0);
            break;
          case 'move':
            rate = (log.captainId === hour.employeeId || hour.isCoCaptain) 
              ? (employee.rateMoveCaptain || 0) 
              : (employee.rateMoveWingman || 0);
            break;
          case 'zigma':
            rate = employee.rateZigma || 0;
            break;
          case 'training':
            rate = employee.rateTraining || 0;
            break;
          case 'estimating':
            rate = employee.rateEstimating || 0;
            break;
          case 'warehouse':
            rate = employee.rateWarehouse || 0;
            break;
          case 'admin':
            rate = employee.rateAdmin || 0;
            break;
        }
        
        return sum + (Number(hour.hours) * rate);
      }, 0);
      
      performance.laborCost += logLaborCost;
    });

    const topPerformers: TopPerformer[] = Array.from(captainPerformance.values())
      .map(performance => ({
        name: performance.name,
        jobs: performance.jobs,
        revenue: performance.revenue,
        efficiency: performance.revenue > 0 ? (performance.laborCost / performance.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    // Get commission stats
    const commissionEntries = await prisma.commissionEntry.findMany({
      where: {
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    const totalCommissions = commissionEntries
      .filter(entry => entry.status === 'matched')
      .reduce((sum, entry) => sum + Number(entry.commissionAmount || 0), 0);

    const matchedEntries = commissionEntries.filter(entry => entry.status === 'matched').length;
    const pendingEntries = commissionEntries.filter(entry => entry.status === 'pending').length;

    // Calculate booking accuracy (matched entries with actual revenue close to estimated)
    const accurateBookings = commissionEntries
      .filter(entry => entry.status === 'matched' && entry.actualRevenue && entry.estimatedRevenue)
      .filter(entry => {
        const accuracy = Math.abs(Number(entry.actualRevenue) - Number(entry.estimatedRevenue)) / Number(entry.estimatedRevenue);
        return accuracy <= 0.2; // Within 20% is considered accurate
      }).length;

    const avgAccuracy = matchedEntries > 0 ? (accurateBookings / matchedEntries) * 100 : 0;

    // Calculate percentage changes
    const revenueChange = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const jobsChange = lastJobs > 0 ? ((currentJobs - lastJobs) / lastJobs) * 100 : 0;
    const avgJobValueChange = lastAvgJobValue > 0 ? ((currentAvgJobValue - lastAvgJobValue) / lastAvgJobValue) * 100 : 0;
    const laborEfficiencyChange = lastLaborEfficiency > 0 ? ((currentLaborEfficiency - lastLaborEfficiency) / lastLaborEfficiency) * 100 : 0;

    const analyticsData: AnalyticsData = {
      overview: {
        totalRevenue: currentRevenue,
        revenueChange,
        totalJobs: currentJobs,
        jobsChange,
        avgJobValue: currentAvgJobValue,
        avgJobValueChange,
        laborEfficiency: currentLaborEfficiency,
        laborEfficiencyChange,
      },
      jobTypes: {
        junk: {
          count: junkJobs.length,
          revenue: junkRevenue,
          avgValue: junkJobs.length > 0 ? junkRevenue / junkJobs.length : 0,
        },
        move: {
          count: moveJobs.length,
          revenue: moveRevenue,
          avgValue: moveJobs.length > 0 ? moveRevenue / moveJobs.length : 0,
        },
      },
      topPerformers,
      commissionStats: {
        totalCommissions,
        avgAccuracy,
        pendingEntries,
        matchedEntries,
      },
    };

    return { success: true, data: analyticsData };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
    };
  }
}

/**
 * Get performance metrics for the performance tab
 */
export async function getPerformanceMetrics(): Promise<{
  success: boolean;
  data?: {
    monthlyTrends: Array<{
      month: string;
      revenue: number;
      jobs: number;
      efficiency: number;
    }>;
    departmentPerformance: Array<{
      department: string;
      revenue: number;
      hours: number;
      efficiency: number;
    }>;
  };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check permissions
    const canViewAnalytics = 
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('admin');

    if (!canViewAnalytics) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Get last 6 months of data
    const now = new Date();
    const monthlyTrends = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const logs = await prisma.dailyLog.findMany({
        where: {
          status: 'approved',
          approvedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          jobs: true,
          hours: {
            include: {
              employee: {
                select: {
                  rateJunkCaptain: true,
                  rateJunkWingman: true,
                  rateMoveCaptain: true,
                  rateMoveWingman: true,
                  rateZigma: true,
                  rateTraining: true,
                  rateEstimating: true,
                  rateWarehouse: true,
                  rateAdmin: true,
                  junkBonusGoal: true,
                  moveBonusGoal: true,
                },
              },
            },
          },
        },
      });

      const revenue = logs.reduce((sum, log) => 
        sum + log.jobs.reduce((jobSum, job) => jobSum + Number(job.revenue), 0), 0
      );
      
      const jobs = logs.reduce((sum, log) => sum + log.jobs.length, 0);
      
      const laborCost = logs.reduce((sum, log) => {
        return sum + log.hours.reduce((hourSum, hour) => {
          const employee = convertUserDecimalFields(hour.employee);
          let rate = 0;
          
          switch (hour.department) {
            case 'junk':
              rate = (log.captainId === hour.employeeId || hour.isCoCaptain) 
                ? (employee.rateJunkCaptain || 0) 
                : (employee.rateJunkWingman || 0);
              break;
            case 'move':
              rate = (log.captainId === hour.employeeId || hour.isCoCaptain) 
                ? (employee.rateMoveCaptain || 0) 
                : (employee.rateMoveWingman || 0);
              break;
            case 'zigma':
              rate = employee.rateZigma || 0;
              break;
            case 'training':
              rate = employee.rateTraining || 0;
              break;
            case 'estimating':
              rate = employee.rateEstimating || 0;
              break;
            case 'warehouse':
              rate = employee.rateWarehouse || 0;
              break;
            case 'admin':
              rate = employee.rateAdmin || 0;
              break;
          }
          
          return hourSum + (Number(hour.hours) * rate);
        }, 0);
      }, 0);

      const efficiency = revenue > 0 ? (laborCost / revenue) * 100 : 0;

      monthlyTrends.push({
        month: safeFormatDate(monthStart, { month: 'short', year: 'numeric' }),
        revenue,
        jobs,
        efficiency,
      });
    }

    // Get department performance for current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const departmentStats = await prisma.$queryRaw<Array<{
      department: string;
      total_revenue: bigint;
      total_hours: bigint;
      labor_cost: bigint;
    }>>`
      SELECT 
        lh.department,
        SUM(lj.revenue) as total_revenue,
        SUM(lh.hours) as total_hours,
        SUM(
          lh.hours * 
          CASE 
            WHEN lh.department = 'junk' THEN 
              CASE WHEN dl."captainId" = lh."employeeId" OR lh."isCoCaptain" THEN u."rateJunkCaptain" 
              ELSE u."rateJunkWingman" END
            WHEN lh.department = 'move' THEN
              CASE WHEN dl."captainId" = lh."employeeId" OR lh."isCoCaptain" THEN u."rateMoveCaptain" 
              ELSE u."rateMoveWingman" END
            WHEN lh.department = 'zigma' THEN u."rateZigma"
            WHEN lh.department = 'training' THEN u."rateTraining"
            WHEN lh.department = 'estimating' THEN u."rateEstimating"
            WHEN lh.department = 'warehouse' THEN u."rateWarehouse"
            WHEN lh.department = 'admin' THEN u."rateAdmin"
            ELSE 0
          END
        ) as labor_cost
      FROM "LogHour" lh
      JOIN "DailyLog" dl ON lh."logId" = dl.id
      JOIN "User" u ON lh."employeeId" = u.id
      LEFT JOIN "LogJob" lj ON lj."logId" = dl.id AND lj."jobType" = lh.department
      WHERE dl.status = 'approved'
        AND dl."approvedAt" >= ${currentMonthStart}
        AND dl."approvedAt" <= ${currentMonthEnd}
      GROUP BY lh.department
      ORDER BY total_revenue DESC
    `;

    const departmentPerformance = departmentStats.map(stat => ({
      department: stat.department,
      revenue: Number(stat.total_revenue),
      hours: Number(stat.total_hours),
      efficiency: Number(stat.total_revenue) > 0 ? (Number(stat.labor_cost) / Number(stat.total_revenue)) * 100 : 0,
    }));

    return {
      success: true,
      data: {
        monthlyTrends,
        departmentPerformance,
      },
    };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch performance metrics',
    };
  }
}

/**
 * Get trend analysis data
 */
export async function getTrendAnalysis(): Promise<{
  success: boolean;
  data?: {
    revenueGrowth: Array<{
      period: string;
      revenue: number;
      growth: number;
    }>;
    seasonalPatterns: Array<{
      month: string;
      avgRevenue: number;
      avgJobs: number;
    }>;
  };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Authentication required' };
    }

    // Check permissions
    const canViewAnalytics = 
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('admin');

    if (!canViewAnalytics) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Get last 12 months for trend analysis
    const now = new Date();
    const revenueGrowth = [];
    let previousRevenue = 0;

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const logs = await prisma.dailyLog.findMany({
        where: {
          status: 'approved',
          approvedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          jobs: true,
        },
      });

      const revenue = logs.reduce((sum, log) => 
        sum + log.jobs.reduce((jobSum, job) => jobSum + Number(job.revenue), 0), 0
      );

      const growth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

      revenueGrowth.push({
        period: safeFormatDate(monthStart, { month: 'short', year: 'numeric' }),
        revenue,
        growth,
      });

      previousRevenue = revenue;
    }

    // Calculate seasonal patterns (average by month across available data)
    const seasonalData = new Map<number, { revenue: number; jobs: number; count: number }>();

    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthNumber = monthStart.getMonth();
      
      const logs = await prisma.dailyLog.findMany({
        where: {
          status: 'approved',
          approvedAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          jobs: true,
        },
      });

      const revenue = logs.reduce((sum, log) => 
        sum + log.jobs.reduce((jobSum, job) => jobSum + Number(job.revenue), 0), 0
      );
      
      const jobs = logs.reduce((sum, log) => sum + log.jobs.length, 0);

      if (!seasonalData.has(monthNumber)) {
        seasonalData.set(monthNumber, { revenue: 0, jobs: 0, count: 0 });
      }

      const data = seasonalData.get(monthNumber)!;
      data.revenue += revenue;
      data.jobs += jobs;
      data.count += 1;
    }

    const seasonalPatterns = Array.from(seasonalData.entries())
      .map(([monthNumber, data]) => ({
        month: safeFormatDate(new Date(2024, monthNumber, 1), { month: 'long' }),
        avgRevenue: data.count > 0 ? data.revenue / data.count : 0,
        avgJobs: data.count > 0 ? data.jobs / data.count : 0,
      }))
      .sort((a, b) => {
        const monthA = new Date(Date.parse(a.month + " 1, 2024")).getMonth();
        const monthB = new Date(Date.parse(b.month + " 1, 2024")).getMonth();
        return monthA - monthB;
      });

    return {
      success: true,
      data: {
        revenueGrowth,
        seasonalPatterns,
      },
    };
  } catch (error) {
    console.error('Error fetching trend analysis:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trend analysis',
    };
  }
}