'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import type { Department } from '@/types';

export interface DailyWorkEntry {
  date: Date;
  logId: string;
  departments: Array<{
    department: Department;
    hours: number;
    rate: number;
    role: 'captain' | 'co-captain' | 'wingman';
  }>;
  tips: number;
  totalHours: number;
  grossPay: number;
  jobsCompleted: number;
}

export interface WorkPatternStats {
  totalDaysWorked: number;
  avgHoursPerDay: number;
  mostCommonDepartment: Department;
  totalJobsCompleted: number;
  avgTipsPerDay: number;
  busiestDay: Date;
  highestTipDay: Date;
  highestPayDay: Date;
}

/**
 * Get daily work breakdown with enhanced data for calendar component
 */
export async function getDailyWorkBreakdown(
  employeeId: string,
  payPeriodId: string
): Promise<{ 
  success: boolean; 
  data?: {
    workEntries: DailyWorkEntry[];
    workPatternStats: WorkPatternStats;
  }; 
  error?: string 
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized: Login required');
    }

    // Check if user can access this payroll data
    if (session.user.id !== employeeId && 
        !session.user.roles?.some(role => ['admin', 'manager'].includes(role))) {
      throw new Error('Unauthorized: Can only view your own payroll data');
    }

    // Get pay period
    const payPeriod = await prisma.payPeriod.findUnique({
      where: { id: payPeriodId },
    });

    if (!payPeriod) {
      throw new Error('Pay period not found');
    }

    // Get employee data
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        roles: true,
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
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get all approved logs for the pay period where employee worked
    const approvedLogs = await prisma.dailyLog.findMany({
      where: {
        approvedAt: {
          gte: payPeriod.startDate,
          lte: payPeriod.endDate,
        },
        status: 'approved',
        hours: {
          some: {
            employeeId: employeeId,
          },
        },
      },
      include: {
        captain: {
          select: {
            id: true,
            fullName: true,
          },
        },
        jobs: true,
        hours: {
          where: {
            employeeId: employeeId,
          },
        },
      },
      orderBy: {
        logDate: 'desc',
      },
    });

    // Process work entries
    const workEntries: DailyWorkEntry[] = approvedLogs.map(log => {
      const departments = log.hours.map(hour => {
        const department = hour.department as Department;
        const isCaptain = log.captainId === employeeId;
        const isCoCaptain = hour.isCoCaptain;
        
        let role: 'captain' | 'co-captain' | 'wingman' = 'wingman';
        if (isCaptain) role = 'captain';
        else if (isCoCaptain) role = 'co-captain';

        // Calculate rate based on role and department
        let rate = 0;
        switch (department) {
          case 'junk':
            rate = (isCaptain || isCoCaptain) 
              ? Number(employee.rateJunkCaptain || 0)
              : Number(employee.rateJunkWingman || 0);
            break;
          case 'move':
            rate = (isCaptain || isCoCaptain)
              ? Number(employee.rateMoveCaptain || 0)
              : Number(employee.rateMoveWingman || 0);
            break;
          case 'zigma':
            rate = Number(employee.rateZigma || 0);
            break;
          case 'training':
            rate = Number(employee.rateTraining || 0);
            break;
          case 'estimating':
            rate = Number(employee.rateEstimating || 0);
            break;
          case 'warehouse':
            rate = Number(employee.rateWarehouse || 0);
            break;
          case 'admin':
            rate = Number(employee.rateAdmin || 0);
            break;
        }

        return {
          department,
          hours: Number(hour.hours),
          rate,
          role,
        };
      });

      const totalHours = departments.reduce((sum, dept) => sum + dept.hours, 0);
      const grossPay = departments.reduce((sum, dept) => sum + (dept.hours * dept.rate), 0);

      // Calculate tips for this employee on this day
      let tips = 0;
      const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
      const moveJobs = log.jobs.filter(job => job.jobType === 'move');

      // Get all employees who worked each section to calculate tip sharing
      const allHours = log.hours || [];
      const junkEmployees = [...new Set(allHours
        .filter(h => h.department === 'junk')
        .map(h => h.employeeId))];
      const moveEmployees = [...new Set(allHours
        .filter(h => h.department === 'move')
        .map(h => h.employeeId))];

      // Calculate junk tips
      if (departments.some(d => d.department === 'junk') && junkEmployees.length > 0) {
        const junkTips = junkJobs.reduce((sum, job) => sum + Number(job.tips), 0);
        tips += junkTips / junkEmployees.length;
      }

      // Calculate move tips
      if (departments.some(d => d.department === 'move') && moveEmployees.length > 0) {
        const moveTips = moveJobs.reduce((sum, job) => sum + Number(job.tips), 0);
        tips += moveTips / moveEmployees.length;
      }

      return {
        date: log.logDate,
        logId: log.id,
        departments,
        tips,
        totalHours,
        grossPay,
        jobsCompleted: log.jobs.length,
      };
    });

    // Calculate work pattern statistics
    const totalDaysWorked = workEntries.length;
    const totalHours = workEntries.reduce((sum, entry) => sum + entry.totalHours, 0);
    const totalTips = workEntries.reduce((sum, entry) => sum + entry.tips, 0);
    const totalJobs = workEntries.reduce((sum, entry) => sum + entry.jobsCompleted, 0);

    const avgHoursPerDay = totalDaysWorked > 0 ? totalHours / totalDaysWorked : 0;
    const avgTipsPerDay = totalDaysWorked > 0 ? totalTips / totalDaysWorked : 0;

    // Find most common department
    const departmentHours: Record<string, number> = {};
    workEntries.forEach(entry => {
      entry.departments.forEach(dept => {
        departmentHours[dept.department] = (departmentHours[dept.department] || 0) + dept.hours;
      });
    });
    
    const mostCommonDepartment = Object.entries(departmentHours)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as Department || 'admin';

    // Find notable days
    const busiestDay = workEntries.reduce((max, entry) => 
      entry.totalHours > max.totalHours ? entry : max, workEntries[0] || { totalHours: 0, date: new Date() });
    
    const highestTipDay = workEntries.reduce((max, entry) => 
      entry.tips > max.tips ? entry : max, workEntries[0] || { tips: 0, date: new Date() });
    
    const highestPayDay = workEntries.reduce((max, entry) => 
      entry.grossPay > max.grossPay ? entry : max, workEntries[0] || { grossPay: 0, date: new Date() });

    const workPatternStats: WorkPatternStats = {
      totalDaysWorked,
      avgHoursPerDay,
      mostCommonDepartment,
      totalJobsCompleted: totalJobs,
      avgTipsPerDay,
      busiestDay: busiestDay.date,
      highestTipDay: highestTipDay.date,
      highestPayDay: highestPayDay.date,
    };

    return {
      success: true,
      data: {
        workEntries,
        workPatternStats,
      },
    };
  } catch (error) {
    // Error fetching daily work breakdown
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch daily work breakdown',
    };
  }
}