'use server';

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  calculatePayroll,
  calculateEnhancedPayroll,
  calculateHourlyWage,
} from '@/lib/payCalculator';
import {
  convertUserDecimalFields,
  convertCommissionDecimalFields,
} from '@/lib/decimal-utils';
import { getCachedMetrics, areMetricsFresh } from '@/lib/metricsCalculator';
import { triggerPayrollMetricsComputation } from '@/lib/backgroundJobs';
// Note: Query optimization functionality integrated directly into payroll action functions
import type {
  User,
  Department,
  PayPeriod,
  PayPeriodStatus,
  DailyLog,
  LogJob,
  CommissionEntry,
} from '@/types';

// Enhanced payroll data types
export interface DepartmentBreakdown {
  department: Department;
  hours: number;
  rate: number;
  grossPay: number;
  percentage: number;
  isPrimary: boolean;
}

export interface DailyWorkEntry {
  date: Date;
  departments: {
    department: Department;
    hours: number;
    rate: number;
  }[];
  tips: number;
  logIds: string[];
  role: 'captain' | 'co-captain' | 'wingman';
}

export interface TipEntry {
  date: Date;
  jobId: string;
  clientName: string;
  totalJobTips: number;
  teamMembers: number;
  myShare: number;
  jobType: 'junk' | 'move';
  logId: string;
}

export interface RateInfo {
  [key: string]: {
    captainRate?: number;
    wingmanRate?: number;
    currentRate: number;
  };
}

export interface EnhancedPayrollData {
  employeeId: string;
  employee: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
  };
  totalHours: number;
  totalPay: number;
  grossWages: number;
  tips: number;
  commission: number;
  bonuses: number;
  departmentBreakdown: DepartmentBreakdown[];
  dailyWorkHistory: DailyWorkEntry[];
  tipsDetails: TipEntry[];
  rateInformation: RateInfo;
}

const isEnhancedPayrollData = (value: unknown): value is EnhancedPayrollData =>
  typeof value === 'object' &&
  value !== null &&
  'employeeId' in value &&
  'totalHours' in value;

/**
 * Get detailed payroll breakdown for a specific employee and pay period
 */
export async function getDetailedPayrollBreakdown(
  employeeId: string,
  payPeriodId: string
): Promise<{ success: boolean; data?: EnhancedPayrollData; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized: Login required');
    }

    // Check if user can access this payroll data
    if (
      session.user.id !== employeeId &&
      !session.user.roles?.some((role) => ['admin', 'manager'].includes(role))
    ) {
      throw new Error('Unauthorized: Can only view your own payroll data');
    }

    // Try to get cached payroll metrics first
    const cachedPayroll = await getCachedMetrics(
      'payroll_detailed',
      'user',
      employeeId,
      payPeriodId
    );

    // For closed pay periods, use cached data if available
    const payPeriod = await prisma.payPeriod.findUnique({
      where: { id: payPeriodId },
    });

    if (!payPeriod) {
      throw new Error('Pay period not found');
    }

    // Use cached data for closed pay periods or fresh data (within 1 hour)
    if (
      cachedPayroll &&
      (payPeriod.status === 'closed' ||
        areMetricsFresh(new Date(cachedPayroll.computedAt), 60)) &&
      isEnhancedPayrollData(cachedPayroll.data)
    ) {
      return { success: true, data: cachedPayroll.data };
    }

    // If no fresh cached data, trigger background computation for next time
    if (payPeriod.status !== 'closed') {
      triggerPayrollMetricsComputation(payPeriodId, employeeId, 'high').catch(
        console.error
      );
    }

    // Get employee data
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        email: true,
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
        salaryAmount: true,
        salaryFrequency: true,
        salaryType: true,
        commissionRate: true,
        junkBonusGoal: true,
        moveBonusGoal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Convert Decimal values to numbers for calculation functions using utility
    const employeeForCalculation: User = {
      ...convertUserDecimalFields(employee),
      roles: employee.roles as User['roles'],
      salaryFrequency: employee.salaryFrequency as User['salaryFrequency'],
      salaryType: employee.salaryType as User['salaryType'],
      moveBonusGoal: Number(employee.moveBonusGoal),
    };

    const detailedData = await getEnhancedPayrollData(employeeForCalculation, {
      ...payPeriod,
      status: payPeriod.status as PayPeriodStatus,
    });

    return { success: true, data: detailedData };
  } catch (error) {
    // Error fetching detailed payroll breakdown
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch payroll breakdown',
    };
  }
}

/**
 * Get enhanced payroll data with department breakdowns, daily history, and tips details
 */
async function getEnhancedPayrollData(
  employee: User,
  payPeriod: PayPeriod
): Promise<EnhancedPayrollData> {
  // Get all approved logs for the pay period
  const approvedLogs = await prisma.dailyLog.findMany({
    where: {
      approvedAt: {
        gte: payPeriod.startDate,
        lte: payPeriod.endDate,
      },
      status: 'approved',
    },
    include: {
      captain: {
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
          salaryAmount: true,
          salaryFrequency: true,
          salaryType: true,
          commissionRate: true,
          junkBonusGoal: true,
          moveBonusGoal: true,
          createdAt: true,
          updatedAt: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          fullName: true,
          roles: true,
          email: true,
          rateJunkCaptain: true,
          rateJunkWingman: true,
          rateMoveCaptain: true,
          rateMoveWingman: true,
          rateZigma: true,
          rateTraining: true,
          rateEstimating: true,
          rateWarehouse: true,
          rateAdmin: true,
          salaryAmount: true,
          salaryFrequency: true,
          salaryType: true,
          commissionRate: true,
          junkBonusGoal: true,
          moveBonusGoal: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          fullName: true,
          roles: true,
          email: true,
          rateJunkCaptain: true,
          rateJunkWingman: true,
          rateMoveCaptain: true,
          rateMoveWingman: true,
          rateZigma: true,
          rateTraining: true,
          rateEstimating: true,
          rateWarehouse: true,
          rateAdmin: true,
          salaryAmount: true,
          salaryFrequency: true,
          salaryType: true,
          commissionRate: true,
          junkBonusGoal: true,
          moveBonusGoal: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      lastEditedBy: {
        select: {
          id: true,
          fullName: true,
          roles: true,
          email: true,
          rateJunkCaptain: true,
          rateJunkWingman: true,
          rateMoveCaptain: true,
          rateMoveWingman: true,
          rateZigma: true,
          rateTraining: true,
          rateEstimating: true,
          rateWarehouse: true,
          rateAdmin: true,
          salaryAmount: true,
          salaryFrequency: true,
          salaryType: true,
          commissionRate: true,
          junkBonusGoal: true,
          moveBonusGoal: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      jobs: true,
      hours: {
        include: {
          employee: {
            select: {
              id: true,
              fullName: true,
              roles: true,
              email: true,
              rateJunkCaptain: true,
              rateJunkWingman: true,
              rateMoveCaptain: true,
              rateMoveWingman: true,
              rateZigma: true,
              rateTraining: true,
              rateEstimating: true,
              rateWarehouse: true,
              rateAdmin: true,
              salaryAmount: true,
              salaryFrequency: true,
              salaryType: true,
              commissionRate: true,
              junkBonusGoal: true,
              moveBonusGoal: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  // Get commission entries for the employee
  const commissionEntries = await prisma.commissionEntry.findMany({
    where: {
      salesId: employee.id,
      status: 'matched',
      matchedLog: {
        approvedAt: {
          gte: payPeriod.startDate,
          lte: payPeriod.endDate,
        },
      },
    },
    include: {
      matchedLog: true,
      sales: true,
    },
  });

  // Convert Prisma data to proper types
  const logsForCalculation: DailyLog[] = approvedLogs.map((log) => ({
    ...log,
    status: log.status as DailyLog['status'],
    submittedAt: log.submittedAt || undefined,
    approvedAt: log.approvedAt || undefined,
    approvedById: log.approvedById || undefined,
    lastEditedById: log.lastEditedById || undefined,
    captain: {
      ...log.captain,
      roles: log.captain.roles as User['roles'],
      rateJunkCaptain: log.captain.rateJunkCaptain
        ? Number(log.captain.rateJunkCaptain)
        : undefined,
      rateJunkWingman: log.captain.rateJunkWingman
        ? Number(log.captain.rateJunkWingman)
        : undefined,
      rateMoveCaptain: log.captain.rateMoveCaptain
        ? Number(log.captain.rateMoveCaptain)
        : undefined,
      rateMoveWingman: log.captain.rateMoveWingman
        ? Number(log.captain.rateMoveWingman)
        : undefined,
      rateZigma: log.captain.rateZigma
        ? Number(log.captain.rateZigma)
        : undefined,
      rateTraining: log.captain.rateTraining
        ? Number(log.captain.rateTraining)
        : undefined,
      rateEstimating: log.captain.rateEstimating
        ? Number(log.captain.rateEstimating)
        : undefined,
      rateWarehouse: log.captain.rateWarehouse
        ? Number(log.captain.rateWarehouse)
        : undefined,
      rateAdmin: log.captain.rateAdmin
        ? Number(log.captain.rateAdmin)
        : undefined,
      salaryAmount: log.captain.salaryAmount
        ? Number(log.captain.salaryAmount)
        : undefined,
      salaryFrequency: log.captain.salaryFrequency as User['salaryFrequency'],
      salaryType: log.captain.salaryType as User['salaryType'],
      commissionRate: log.captain.commissionRate
        ? Number(log.captain.commissionRate)
        : undefined,
      junkBonusGoal: Number(log.captain.junkBonusGoal),
      moveBonusGoal: Number(log.captain.moveBonusGoal),
    },
    createdBy: {
      ...log.createdBy,
      roles: log.createdBy.roles as User['roles'],
      rateJunkCaptain: log.createdBy.rateJunkCaptain
        ? Number(log.createdBy.rateJunkCaptain)
        : undefined,
      rateJunkWingman: log.createdBy.rateJunkWingman
        ? Number(log.createdBy.rateJunkWingman)
        : undefined,
      rateMoveCaptain: log.createdBy.rateMoveCaptain
        ? Number(log.createdBy.rateMoveCaptain)
        : undefined,
      rateMoveWingman: log.createdBy.rateMoveWingman
        ? Number(log.createdBy.rateMoveWingman)
        : undefined,
      rateZigma: log.createdBy.rateZigma
        ? Number(log.createdBy.rateZigma)
        : undefined,
      rateTraining: log.createdBy.rateTraining
        ? Number(log.createdBy.rateTraining)
        : undefined,
      rateEstimating: log.createdBy.rateEstimating
        ? Number(log.createdBy.rateEstimating)
        : undefined,
      rateWarehouse: log.createdBy.rateWarehouse
        ? Number(log.createdBy.rateWarehouse)
        : undefined,
      rateAdmin: log.createdBy.rateAdmin
        ? Number(log.createdBy.rateAdmin)
        : undefined,
      salaryAmount: log.createdBy.salaryAmount
        ? Number(log.createdBy.salaryAmount)
        : undefined,
      salaryFrequency: log.createdBy.salaryFrequency as User['salaryFrequency'],
      salaryType: log.createdBy.salaryType as User['salaryType'],
      commissionRate: log.createdBy.commissionRate
        ? Number(log.createdBy.commissionRate)
        : undefined,
      junkBonusGoal: Number(log.createdBy.junkBonusGoal),
      moveBonusGoal: Number(log.createdBy.moveBonusGoal),
    },
    approvedBy: log.approvedBy
      ? {
          ...log.approvedBy,
          roles: log.approvedBy.roles as User['roles'],
          rateJunkCaptain: log.approvedBy.rateJunkCaptain
            ? Number(log.approvedBy.rateJunkCaptain)
            : undefined,
          rateJunkWingman: log.approvedBy.rateJunkWingman
            ? Number(log.approvedBy.rateJunkWingman)
            : undefined,
          rateMoveCaptain: log.approvedBy.rateMoveCaptain
            ? Number(log.approvedBy.rateMoveCaptain)
            : undefined,
          rateMoveWingman: log.approvedBy.rateMoveWingman
            ? Number(log.approvedBy.rateMoveWingman)
            : undefined,
          rateZigma: log.approvedBy.rateZigma
            ? Number(log.approvedBy.rateZigma)
            : undefined,
          rateTraining: log.approvedBy.rateTraining
            ? Number(log.approvedBy.rateTraining)
            : undefined,
          rateEstimating: log.approvedBy.rateEstimating
            ? Number(log.approvedBy.rateEstimating)
            : undefined,
          rateWarehouse: log.approvedBy.rateWarehouse
            ? Number(log.approvedBy.rateWarehouse)
            : undefined,
          rateAdmin: log.approvedBy.rateAdmin
            ? Number(log.approvedBy.rateAdmin)
            : undefined,
          salaryAmount: log.approvedBy.salaryAmount
            ? Number(log.approvedBy.salaryAmount)
            : undefined,
          salaryFrequency: log.approvedBy
            .salaryFrequency as User['salaryFrequency'],
          salaryType: log.approvedBy.salaryType as User['salaryType'],
          commissionRate: log.approvedBy.commissionRate
            ? Number(log.approvedBy.commissionRate)
            : undefined,
          junkBonusGoal: Number(log.approvedBy.junkBonusGoal),
          moveBonusGoal: Number(log.approvedBy.moveBonusGoal),
        }
      : undefined,
    lastEditedBy: log.lastEditedBy
      ? {
          ...log.lastEditedBy,
          roles: log.lastEditedBy.roles as User['roles'],
          rateJunkCaptain: log.lastEditedBy.rateJunkCaptain
            ? Number(log.lastEditedBy.rateJunkCaptain)
            : undefined,
          rateJunkWingman: log.lastEditedBy.rateJunkWingman
            ? Number(log.lastEditedBy.rateJunkWingman)
            : undefined,
          rateMoveCaptain: log.lastEditedBy.rateMoveCaptain
            ? Number(log.lastEditedBy.rateMoveCaptain)
            : undefined,
          rateMoveWingman: log.lastEditedBy.rateMoveWingman
            ? Number(log.lastEditedBy.rateMoveWingman)
            : undefined,
          rateZigma: log.lastEditedBy.rateZigma
            ? Number(log.lastEditedBy.rateZigma)
            : undefined,
          rateTraining: log.lastEditedBy.rateTraining
            ? Number(log.lastEditedBy.rateTraining)
            : undefined,
          rateEstimating: log.lastEditedBy.rateEstimating
            ? Number(log.lastEditedBy.rateEstimating)
            : undefined,
          rateWarehouse: log.lastEditedBy.rateWarehouse
            ? Number(log.lastEditedBy.rateWarehouse)
            : undefined,
          rateAdmin: log.lastEditedBy.rateAdmin
            ? Number(log.lastEditedBy.rateAdmin)
            : undefined,
          salaryAmount: log.lastEditedBy.salaryAmount
            ? Number(log.lastEditedBy.salaryAmount)
            : undefined,
          salaryFrequency: log.lastEditedBy
            .salaryFrequency as User['salaryFrequency'],
          salaryType: log.lastEditedBy.salaryType as User['salaryType'],
          commissionRate: log.lastEditedBy.commissionRate
            ? Number(log.lastEditedBy.commissionRate)
            : undefined,
          junkBonusGoal: Number(log.lastEditedBy.junkBonusGoal),
          moveBonusGoal: Number(log.lastEditedBy.moveBonusGoal),
        }
      : undefined,
    hours: log.hours.map((hour) => ({
      ...hour,
      log: {} as DailyLog, // Circular reference - will be set by parent
      department: hour.department as Department,
      hours: Number(hour.hours),
      employee: {
        ...hour.employee,
        roles: hour.employee.roles as User['roles'],
        rateJunkCaptain: hour.employee.rateJunkCaptain
          ? Number(hour.employee.rateJunkCaptain)
          : undefined,
        rateJunkWingman: hour.employee.rateJunkWingman
          ? Number(hour.employee.rateJunkWingman)
          : undefined,
        rateMoveCaptain: hour.employee.rateMoveCaptain
          ? Number(hour.employee.rateMoveCaptain)
          : undefined,
        rateMoveWingman: hour.employee.rateMoveWingman
          ? Number(hour.employee.rateMoveWingman)
          : undefined,
        rateZigma: hour.employee.rateZigma
          ? Number(hour.employee.rateZigma)
          : undefined,
        rateTraining: hour.employee.rateTraining
          ? Number(hour.employee.rateTraining)
          : undefined,
        rateEstimating: hour.employee.rateEstimating
          ? Number(hour.employee.rateEstimating)
          : undefined,
        rateWarehouse: hour.employee.rateWarehouse
          ? Number(hour.employee.rateWarehouse)
          : undefined,
        rateAdmin: hour.employee.rateAdmin
          ? Number(hour.employee.rateAdmin)
          : undefined,
        salaryAmount: hour.employee.salaryAmount
          ? Number(hour.employee.salaryAmount)
          : undefined,
        salaryFrequency: hour.employee
          .salaryFrequency as User['salaryFrequency'],
        salaryType: hour.employee.salaryType as User['salaryType'],
        commissionRate: hour.employee.commissionRate
          ? Number(hour.employee.commissionRate)
          : undefined,
        junkBonusGoal: Number(hour.employee.junkBonusGoal),
        moveBonusGoal: Number(hour.employee.moveBonusGoal),
      },
    })),
    jobs: log.jobs.map((job) => ({
      ...job,
      jobType: job.jobType as LogJob['jobType'],
      revenue: Number(job.revenue),
      tips: Number(job.tips),
      junkOnMove: job.junkOnMove ? Number(job.junkOnMove) : undefined,
      valuation: job.valuation ? Number(job.valuation) : undefined,
      materials: job.materials ? Number(job.materials) : undefined,
      disposalCost: job.disposalCost ? Number(job.disposalCost) : undefined,
      log: {} as DailyLog, // Circular reference - will be set by parent
    })),
  }));

  const commissionsForCalculation: CommissionEntry[] = commissionEntries.map(
    (commission) => ({
      ...commission,
      ...convertCommissionDecimalFields(commission),
      jobType: commission.jobType as CommissionEntry['jobType'],
      status: commission.status as CommissionEntry['status'],
      matchedLogId: commission.matchedLogId || undefined,
      matchedLog: commission.matchedLog
        ? ({
            ...commission.matchedLog,
            status: commission.matchedLog.status as DailyLog['status'],
            submittedAt: commission.matchedLog.submittedAt || undefined,
            approvedAt: commission.matchedLog.approvedAt || undefined,
            approvedById: commission.matchedLog.approvedById || undefined,
            lastEditedById: commission.matchedLog.lastEditedById || undefined,
          } as DailyLog)
        : undefined,
      sales: {
        ...commission.sales,
        roles: commission.sales.roles as User['roles'],
        rateJunkCaptain: commission.sales.rateJunkCaptain
          ? Number(commission.sales.rateJunkCaptain)
          : undefined,
        rateJunkWingman: commission.sales.rateJunkWingman
          ? Number(commission.sales.rateJunkWingman)
          : undefined,
        rateMoveCaptain: commission.sales.rateMoveCaptain
          ? Number(commission.sales.rateMoveCaptain)
          : undefined,
        rateMoveWingman: commission.sales.rateMoveWingman
          ? Number(commission.sales.rateMoveWingman)
          : undefined,
        rateZigma: commission.sales.rateZigma
          ? Number(commission.sales.rateZigma)
          : undefined,
        rateTraining: commission.sales.rateTraining
          ? Number(commission.sales.rateTraining)
          : undefined,
        rateEstimating: commission.sales.rateEstimating
          ? Number(commission.sales.rateEstimating)
          : undefined,
        rateWarehouse: commission.sales.rateWarehouse
          ? Number(commission.sales.rateWarehouse)
          : undefined,
        rateAdmin: commission.sales.rateAdmin
          ? Number(commission.sales.rateAdmin)
          : undefined,
        salaryAmount: commission.sales.salaryAmount
          ? Number(commission.sales.salaryAmount)
          : undefined,
        salaryFrequency: commission.sales
          .salaryFrequency as User['salaryFrequency'],
        salaryType: commission.sales.salaryType as User['salaryType'],
        commissionRate: commission.sales.commissionRate
          ? Number(commission.sales.commissionRate)
          : undefined,
        junkBonusGoal: Number(commission.sales.junkBonusGoal),
        moveBonusGoal: Number(commission.sales.moveBonusGoal),
      },
    })
  );

  // Calculate enhanced payroll using existing logic
  const enhancedPayroll = calculateEnhancedPayroll(
    employee,
    logsForCalculation,
    commissionsForCalculation,
    payPeriod.startDate,
    payPeriod.endDate
  );

  // Convert enhanced payroll to our interface format
  const departmentBreakdown: DepartmentBreakdown[] = Object.entries(
    enhancedPayroll.departmentBreakdown
  )
    .filter(([, data]) => data.hours > 0)
    .map(([dept, data]) => ({
      department: dept as Department,
      hours: data.hours,
      rate: data.rate,
      grossPay: data.grossPay,
      percentage: data.percentage,
      isPrimary: false, // Will be set below
    }))
    .sort((a, b) => b.hours - a.hours);

  // Mark primary department (most hours)
  if (departmentBreakdown.length > 0) {
    departmentBreakdown[0].isPrimary = true;
  }

  const dailyWorkHistory: DailyWorkEntry[] = Object.entries(
    enhancedPayroll.dailyBreakdown
  )
    .map(([dateStr, data]) => {
      // Determine role based on log data for this date
      const dateObj = new Date(dateStr);
      const logsForDate = approvedLogs.filter(
        (log) => log.logDate.toDateString() === dateObj.toDateString()
      );

      let role: 'captain' | 'co-captain' | 'wingman' = 'wingman';

      // Check if employee was captain on any log for this date
      if (logsForDate.some((log) => log.captainId === employee.id)) {
        role = 'captain';
      } else {
        // Check if employee was co-captain on any hours for this date
        const hoursForDate = logsForDate.flatMap((log) => log.hours || []);
        if (
          hoursForDate.some(
            (hour) => hour.employeeId === employee.id && hour.isCoCaptain
          )
        ) {
          role = 'co-captain';
        }
      }

      return {
        date: dateObj,
        departments: Object.entries(data.departments)
          .filter(([, hours]) => hours > 0)
          .map(([dept, hours]) => ({
            department: dept as Department,
            hours,
            rate: calculateHourlyWage(
              employee,
              dept as Department,
              role === 'captain' || role === 'co-captain'
            ),
          })),
        tips: data.tips,
        logIds: logsForDate.map((log) => log.id),
        role,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const tipsDetails: TipEntry[] = enhancedPayroll.tipsBreakdown;

  const rateInformation: RateInfo = Object.fromEntries(
    Object.entries(enhancedPayroll.rateSchedule).map(([dept, rates]) => [
      dept,
      {
        captainRate: rates.captainRate,
        wingmanRate: rates.wingmanRate,
        currentRate: rates.currentRate,
      },
    ])
  );

  return {
    employeeId: employee.id,
    employee: {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      roles: employee.roles,
    },
    totalHours: enhancedPayroll.totalHours,
    totalPay: enhancedPayroll.totalPay,
    grossWages: enhancedPayroll.grossWages,
    tips: enhancedPayroll.tips,
    commission: enhancedPayroll.commission,
    bonuses: enhancedPayroll.bonuses,
    departmentBreakdown,
    dailyWorkHistory,
    tipsDetails,
    rateInformation,
  };
}

/**
 * Get cached detailed payroll breakdown (for closed pay periods)
 */
export async function getCachedDetailedPayrollBreakdown(
  employeeId: string,
  payPeriodId: string
) {
  const payPeriod = await prisma.payPeriod.findUnique({
    where: { id: payPeriodId },
  });

  if (!payPeriod) {
    throw new Error('Pay period not found');
  }

  const cacheKey = `payroll-breakdown-${employeeId}-${payPeriodId}`;

  // For closed pay periods, cache indefinitely
  if (payPeriod.status === 'closed') {
    return unstable_cache(
      () => getDetailedPayrollBreakdown(employeeId, payPeriodId),
      [cacheKey],
      { revalidate: false }
    )();
  }

  // For open periods, cache for 1 hour
  return unstable_cache(
    () => getDetailedPayrollBreakdown(employeeId, payPeriodId),
    [cacheKey],
    { revalidate: 3600 }
  )();
}

/**
 * Get payroll summary (lighter weight for initial loading)
 */
export async function getPayrollSummary(
  employeeId: string,
  payPeriodId: string
): Promise<{
  success: boolean;
  data?: {
    employeeId: string;
    employee: {
      id: string;
      fullName: string;
      email: string;
      roles: string[];
    };
    payPeriod: PayPeriod;
    totalHours: number;
    totalPay: number;
    grossWages: number;
    tips: number;
    commission: number;
    bonuses: number;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized: Login required');
    }

    // Check if user can access this payroll data
    if (
      session.user.id !== employeeId &&
      !session.user.roles?.some((role) => ['admin', 'manager'].includes(role))
    ) {
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
        email: true,
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
        salaryAmount: true,
        salaryFrequency: true,
        salaryType: true,
        commissionRate: true,
        junkBonusGoal: true,
        moveBonusGoal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get basic payroll totals using existing calculation
    const approvedLogs = await prisma.dailyLog.findMany({
      where: {
        approvedAt: {
          gte: payPeriod.startDate,
          lte: payPeriod.endDate,
        },
        status: 'approved',
      },
      include: {
        captain: true,
        createdBy: true,
        approvedBy: true,
        lastEditedBy: true,
        jobs: true,
        hours: {
          include: {
            employee: true,
          },
        },
      },
    });

    const commissionEntries = await prisma.commissionEntry.findMany({
      where: {
        salesId: employeeId,
        status: 'matched',
        matchedLog: {
          approvedAt: {
            gte: payPeriod.startDate,
            lte: payPeriod.endDate,
          },
        },
      },
      include: {
        matchedLog: true,
        sales: true,
      },
    });

    // Convert employee data for calculation
    const employeeForCalculation: User = {
      ...employee,
      roles: employee.roles as User['roles'],
      rateJunkCaptain: employee.rateJunkCaptain
        ? Number(employee.rateJunkCaptain)
        : undefined,
      rateJunkWingman: employee.rateJunkWingman
        ? Number(employee.rateJunkWingman)
        : undefined,
      rateMoveCaptain: employee.rateMoveCaptain
        ? Number(employee.rateMoveCaptain)
        : undefined,
      rateMoveWingman: employee.rateMoveWingman
        ? Number(employee.rateMoveWingman)
        : undefined,
      rateZigma: employee.rateZigma ? Number(employee.rateZigma) : undefined,
      rateTraining: employee.rateTraining
        ? Number(employee.rateTraining)
        : undefined,
      rateEstimating: employee.rateEstimating
        ? Number(employee.rateEstimating)
        : undefined,
      rateWarehouse: employee.rateWarehouse
        ? Number(employee.rateWarehouse)
        : undefined,
      rateAdmin: employee.rateAdmin ? Number(employee.rateAdmin) : undefined,
      salaryAmount: employee.salaryAmount
        ? Number(employee.salaryAmount)
        : undefined,
      salaryFrequency: employee.salaryFrequency as User['salaryFrequency'],
      salaryType: employee.salaryType as User['salaryType'],
      commissionRate: employee.commissionRate
        ? Number(employee.commissionRate)
        : undefined,
      junkBonusGoal: Number(employee.junkBonusGoal),
      moveBonusGoal: Number(employee.moveBonusGoal),
    };

    // Convert Prisma data to proper types (simplified for summary)
    const logsForCalculation: DailyLog[] = approvedLogs.map((log) => ({
      ...log,
      status: log.status as DailyLog['status'],
      submittedAt: log.submittedAt || undefined,
      approvedAt: log.approvedAt || undefined,
      approvedById: log.approvedById || undefined,
      lastEditedById: log.lastEditedById || undefined,
      captain: {
        ...log.captain,
        roles: log.captain.roles as User['roles'],
        rateJunkCaptain: log.captain.rateJunkCaptain
          ? Number(log.captain.rateJunkCaptain)
          : undefined,
        rateJunkWingman: log.captain.rateJunkWingman
          ? Number(log.captain.rateJunkWingman)
          : undefined,
        rateMoveCaptain: log.captain.rateMoveCaptain
          ? Number(log.captain.rateMoveCaptain)
          : undefined,
        rateMoveWingman: log.captain.rateMoveWingman
          ? Number(log.captain.rateMoveWingman)
          : undefined,
        rateZigma: log.captain.rateZigma
          ? Number(log.captain.rateZigma)
          : undefined,
        rateTraining: log.captain.rateTraining
          ? Number(log.captain.rateTraining)
          : undefined,
        rateEstimating: log.captain.rateEstimating
          ? Number(log.captain.rateEstimating)
          : undefined,
        rateWarehouse: log.captain.rateWarehouse
          ? Number(log.captain.rateWarehouse)
          : undefined,
        rateAdmin: log.captain.rateAdmin
          ? Number(log.captain.rateAdmin)
          : undefined,
        salaryAmount: log.captain.salaryAmount
          ? Number(log.captain.salaryAmount)
          : undefined,
        salaryFrequency: log.captain.salaryFrequency as User['salaryFrequency'],
        salaryType: log.captain.salaryType as User['salaryType'],
        commissionRate: log.captain.commissionRate
          ? Number(log.captain.commissionRate)
          : undefined,
        junkBonusGoal: Number(log.captain.junkBonusGoal),
        moveBonusGoal: Number(log.captain.moveBonusGoal),
      },
      createdBy: {
        ...log.createdBy,
        roles: log.createdBy.roles as User['roles'],
        rateJunkCaptain: log.createdBy.rateJunkCaptain
          ? Number(log.createdBy.rateJunkCaptain)
          : undefined,
        rateJunkWingman: log.createdBy.rateJunkWingman
          ? Number(log.createdBy.rateJunkWingman)
          : undefined,
        rateMoveCaptain: log.createdBy.rateMoveCaptain
          ? Number(log.createdBy.rateMoveCaptain)
          : undefined,
        rateMoveWingman: log.createdBy.rateMoveWingman
          ? Number(log.createdBy.rateMoveWingman)
          : undefined,
        rateZigma: log.createdBy.rateZigma
          ? Number(log.createdBy.rateZigma)
          : undefined,
        rateTraining: log.createdBy.rateTraining
          ? Number(log.createdBy.rateTraining)
          : undefined,
        rateEstimating: log.createdBy.rateEstimating
          ? Number(log.createdBy.rateEstimating)
          : undefined,
        rateWarehouse: log.createdBy.rateWarehouse
          ? Number(log.createdBy.rateWarehouse)
          : undefined,
        rateAdmin: log.createdBy.rateAdmin
          ? Number(log.createdBy.rateAdmin)
          : undefined,
        salaryAmount: log.createdBy.salaryAmount
          ? Number(log.createdBy.salaryAmount)
          : undefined,
        salaryFrequency: log.createdBy
          .salaryFrequency as User['salaryFrequency'],
        salaryType: log.createdBy.salaryType as User['salaryType'],
        commissionRate: log.createdBy.commissionRate
          ? Number(log.createdBy.commissionRate)
          : undefined,
        junkBonusGoal: Number(log.createdBy.junkBonusGoal),
        moveBonusGoal: Number(log.createdBy.moveBonusGoal),
      },
      approvedBy: log.approvedBy
        ? {
            ...log.approvedBy,
            roles: log.approvedBy.roles as User['roles'],
            rateJunkCaptain: log.approvedBy.rateJunkCaptain
              ? Number(log.approvedBy.rateJunkCaptain)
              : undefined,
            rateJunkWingman: log.approvedBy.rateJunkWingman
              ? Number(log.approvedBy.rateJunkWingman)
              : undefined,
            rateMoveCaptain: log.approvedBy.rateMoveCaptain
              ? Number(log.approvedBy.rateMoveCaptain)
              : undefined,
            rateMoveWingman: log.approvedBy.rateMoveWingman
              ? Number(log.approvedBy.rateMoveWingman)
              : undefined,
            rateZigma: log.approvedBy.rateZigma
              ? Number(log.approvedBy.rateZigma)
              : undefined,
            rateTraining: log.approvedBy.rateTraining
              ? Number(log.approvedBy.rateTraining)
              : undefined,
            rateEstimating: log.approvedBy.rateEstimating
              ? Number(log.approvedBy.rateEstimating)
              : undefined,
            rateWarehouse: log.approvedBy.rateWarehouse
              ? Number(log.approvedBy.rateWarehouse)
              : undefined,
            rateAdmin: log.approvedBy.rateAdmin
              ? Number(log.approvedBy.rateAdmin)
              : undefined,
            salaryAmount: log.approvedBy.salaryAmount
              ? Number(log.approvedBy.salaryAmount)
              : undefined,
            salaryFrequency: log.approvedBy
              .salaryFrequency as User['salaryFrequency'],
            salaryType: log.approvedBy.salaryType as User['salaryType'],
            commissionRate: log.approvedBy.commissionRate
              ? Number(log.approvedBy.commissionRate)
              : undefined,
            junkBonusGoal: Number(log.approvedBy.junkBonusGoal),
            moveBonusGoal: Number(log.approvedBy.moveBonusGoal),
          }
        : undefined,
      lastEditedBy: log.lastEditedBy
        ? {
            ...log.lastEditedBy,
            roles: log.lastEditedBy.roles as User['roles'],
            rateJunkCaptain: log.lastEditedBy.rateJunkCaptain
              ? Number(log.lastEditedBy.rateJunkCaptain)
              : undefined,
            rateJunkWingman: log.lastEditedBy.rateJunkWingman
              ? Number(log.lastEditedBy.rateJunkWingman)
              : undefined,
            rateMoveCaptain: log.lastEditedBy.rateMoveCaptain
              ? Number(log.lastEditedBy.rateMoveCaptain)
              : undefined,
            rateMoveWingman: log.lastEditedBy.rateMoveWingman
              ? Number(log.lastEditedBy.rateMoveWingman)
              : undefined,
            rateZigma: log.lastEditedBy.rateZigma
              ? Number(log.lastEditedBy.rateZigma)
              : undefined,
            rateTraining: log.lastEditedBy.rateTraining
              ? Number(log.lastEditedBy.rateTraining)
              : undefined,
            rateEstimating: log.lastEditedBy.rateEstimating
              ? Number(log.lastEditedBy.rateEstimating)
              : undefined,
            rateWarehouse: log.lastEditedBy.rateWarehouse
              ? Number(log.lastEditedBy.rateWarehouse)
              : undefined,
            rateAdmin: log.lastEditedBy.rateAdmin
              ? Number(log.lastEditedBy.rateAdmin)
              : undefined,
            salaryAmount: log.lastEditedBy.salaryAmount
              ? Number(log.lastEditedBy.salaryAmount)
              : undefined,
            salaryFrequency: log.lastEditedBy
              .salaryFrequency as User['salaryFrequency'],
            salaryType: log.lastEditedBy.salaryType as User['salaryType'],
            commissionRate: log.lastEditedBy.commissionRate
              ? Number(log.lastEditedBy.commissionRate)
              : undefined,
            junkBonusGoal: Number(log.lastEditedBy.junkBonusGoal),
            moveBonusGoal: Number(log.lastEditedBy.moveBonusGoal),
          }
        : undefined,
      hours: log.hours.map((hour) => ({
        ...hour,
        log: {} as DailyLog, // Circular reference - will be set by parent
        department: hour.department as Department,
        hours: Number(hour.hours),
        employee: {
          ...hour.employee,
          roles: hour.employee.roles as User['roles'],
          rateJunkCaptain: hour.employee.rateJunkCaptain
            ? Number(hour.employee.rateJunkCaptain)
            : undefined,
          rateJunkWingman: hour.employee.rateJunkWingman
            ? Number(hour.employee.rateJunkWingman)
            : undefined,
          rateMoveCaptain: hour.employee.rateMoveCaptain
            ? Number(hour.employee.rateMoveCaptain)
            : undefined,
          rateMoveWingman: hour.employee.rateMoveWingman
            ? Number(hour.employee.rateMoveWingman)
            : undefined,
          rateZigma: hour.employee.rateZigma
            ? Number(hour.employee.rateZigma)
            : undefined,
          rateTraining: hour.employee.rateTraining
            ? Number(hour.employee.rateTraining)
            : undefined,
          rateEstimating: hour.employee.rateEstimating
            ? Number(hour.employee.rateEstimating)
            : undefined,
          rateWarehouse: hour.employee.rateWarehouse
            ? Number(hour.employee.rateWarehouse)
            : undefined,
          rateAdmin: hour.employee.rateAdmin
            ? Number(hour.employee.rateAdmin)
            : undefined,
          salaryAmount: hour.employee.salaryAmount
            ? Number(hour.employee.salaryAmount)
            : undefined,
          salaryFrequency: hour.employee
            .salaryFrequency as User['salaryFrequency'],
          salaryType: hour.employee.salaryType as User['salaryType'],
          commissionRate: hour.employee.commissionRate
            ? Number(hour.employee.commissionRate)
            : undefined,
          junkBonusGoal: Number(hour.employee.junkBonusGoal),
          moveBonusGoal: Number(hour.employee.moveBonusGoal),
        },
      })),
      jobs: log.jobs.map((job) => ({
        ...job,
        jobType: job.jobType as LogJob['jobType'],
        revenue: Number(job.revenue),
        tips: Number(job.tips),
        junkOnMove: job.junkOnMove ? Number(job.junkOnMove) : undefined,
        valuation: job.valuation ? Number(job.valuation) : undefined,
        materials: job.materials ? Number(job.materials) : undefined,
        disposalCost: job.disposalCost ? Number(job.disposalCost) : undefined,
        log: {} as DailyLog, // Circular reference - will be set by parent
      })),
    }));

    const commissionsForCalculation: CommissionEntry[] = commissionEntries.map(
      (commission) => ({
        ...commission,
        ...convertCommissionDecimalFields(commission),
        jobType: commission.jobType as CommissionEntry['jobType'],
        status: commission.status as CommissionEntry['status'],
        matchedLogId: commission.matchedLogId || undefined,
        matchedLog: commission.matchedLog
          ? ({
              ...commission.matchedLog,
              status: commission.matchedLog.status as DailyLog['status'],
              submittedAt: commission.matchedLog.submittedAt || undefined,
              approvedAt: commission.matchedLog.approvedAt || undefined,
              approvedById: commission.matchedLog.approvedById || undefined,
              lastEditedById: commission.matchedLog.lastEditedById || undefined,
            } as DailyLog)
          : undefined,
        sales: {
          ...commission.sales,
          roles: commission.sales.roles as User['roles'],
          rateJunkCaptain: commission.sales.rateJunkCaptain
            ? Number(commission.sales.rateJunkCaptain)
            : undefined,
          rateJunkWingman: commission.sales.rateJunkWingman
            ? Number(commission.sales.rateJunkWingman)
            : undefined,
          rateMoveCaptain: commission.sales.rateMoveCaptain
            ? Number(commission.sales.rateMoveCaptain)
            : undefined,
          rateMoveWingman: commission.sales.rateMoveWingman
            ? Number(commission.sales.rateMoveWingman)
            : undefined,
          rateZigma: commission.sales.rateZigma
            ? Number(commission.sales.rateZigma)
            : undefined,
          rateTraining: commission.sales.rateTraining
            ? Number(commission.sales.rateTraining)
            : undefined,
          rateEstimating: commission.sales.rateEstimating
            ? Number(commission.sales.rateEstimating)
            : undefined,
          rateWarehouse: commission.sales.rateWarehouse
            ? Number(commission.sales.rateWarehouse)
            : undefined,
          rateAdmin: commission.sales.rateAdmin
            ? Number(commission.sales.rateAdmin)
            : undefined,
          salaryAmount: commission.sales.salaryAmount
            ? Number(commission.sales.salaryAmount)
            : undefined,
          salaryFrequency: commission.sales
            .salaryFrequency as User['salaryFrequency'],
          salaryType: commission.sales.salaryType as User['salaryType'],
          commissionRate: commission.sales.commissionRate
            ? Number(commission.sales.commissionRate)
            : undefined,
          junkBonusGoal: Number(commission.sales.junkBonusGoal),
          moveBonusGoal: Number(commission.sales.moveBonusGoal),
        },
      })
    );

    const basicPayroll = calculatePayroll(
      [employeeForCalculation],
      logsForCalculation,
      commissionsForCalculation,
      payPeriod.startDate,
      payPeriod.endDate
    )[0];

    return {
      success: true,
      data: {
        employeeId: employee.id,
        employee,
        payPeriod: {
          ...payPeriod,
          status: payPeriod.status as PayPeriodStatus,
        },
        totalHours: basicPayroll.totalHours,
        totalPay: basicPayroll.totalPay,
        grossWages: basicPayroll.grossWages,
        tips: basicPayroll.tips,
        commission: basicPayroll.commission,
        bonuses: basicPayroll.bonuses,
      },
    };
  } catch (error) {
    // Error fetching payroll summary
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch payroll summary',
    };
  }
}

/**
 * Get available pay periods for an employee
 */
export async function getEmployeePayPeriods(employeeId?: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized: Login required');
    }

    const targetEmployeeId = employeeId || session.user.id;

    // Check if user can access this data
    if (
      session.user.id !== targetEmployeeId &&
      !session.user.roles?.some((role) => ['admin', 'manager'].includes(role))
    ) {
      throw new Error('Unauthorized: Can only view your own pay periods');
    }

    const payPeriods = await prisma.payPeriod.findMany({
      orderBy: { startDate: 'desc' },
      take: 12, // Last 12 pay periods
    });

    return { success: true, data: payPeriods };
  } catch (error) {
    // Error fetching employee pay periods
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch pay periods',
    };
  }
}

/**
 * Validate enhanced payroll breakdown for accuracy
 */
export async function validateEnhancedPayrollBreakdown(
  data: EnhancedPayrollData
): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate department totals match overall totals
  const departmentHoursSum = data.departmentBreakdown.reduce(
    (sum, dept) => sum + dept.hours,
    0
  );

  if (Math.abs(departmentHoursSum - data.totalHours) > 0.01) {
    errors.push('Department hours do not match total hours');
  }

  const departmentPaySum = data.departmentBreakdown.reduce(
    (sum, dept) => sum + dept.grossPay,
    0
  );

  if (Math.abs(departmentPaySum - data.grossWages) > 0.01) {
    errors.push('Department pay does not match total gross wages');
  }

  // Validate tips breakdown matches total tips
  const tipsSum = data.tipsDetails.reduce((sum, tip) => sum + tip.myShare, 0);
  if (Math.abs(tipsSum - data.tips) > 0.01) {
    errors.push('Tips breakdown does not match total tips');
  }

  // Validate daily work history totals
  const dailyHoursSum = data.dailyWorkHistory.reduce((sum, day) => {
    return (
      sum + day.departments.reduce((daySum, dept) => daySum + dept.hours, 0)
    );
  }, 0);

  if (Math.abs(dailyHoursSum - data.totalHours) > 0.01) {
    errors.push('Daily work history hours do not match total hours');
  }

  // Validate percentages add up to 100% (allowing for rounding)
  const percentageSum = data.departmentBreakdown.reduce(
    (sum, dept) => sum + dept.percentage,
    0
  );
  if (Math.abs(percentageSum - 100) > 0.1 && data.totalHours > 0) {
    errors.push('Department percentages do not add up to 100%');
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate enhanced payroll breakdown data (synchronous version)
 */
export async function validateEnhancedPayrollBreakdownSync(
  data: unknown
): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (!data) {
    errors.push('Payroll data is required');
    return { isValid: false, errors };
  }

  // Type guard for data structure
  const typedData = data as {
    employee?: { id?: string };
    totalHours?: number;
    tips?: number;
    totalPay?: number;
    grossWages?: number;
    commission?: number;
    bonuses?: number;
    departmentBreakdown?: Array<{ hours?: number }>;
    tipsDetails?: Array<{ myShare?: number }>;
  };

  // Validate employee data
  if (!typedData.employee || !typedData.employee.id) {
    errors.push('Employee information is required');
  }

  // Validate department breakdown
  if (
    typedData.departmentBreakdown &&
    Array.isArray(typedData.departmentBreakdown)
  ) {
    const totalDepartmentHours = typedData.departmentBreakdown.reduce(
      (sum: number, dept: { hours?: number }) => sum + (dept.hours || 0),
      0
    );
    if (Math.abs(totalDepartmentHours - (typedData.totalHours || 0)) > 0.01) {
      errors.push('Department hours do not match total hours');
    }
  }

  // Validate tips breakdown
  if (typedData.tipsDetails && Array.isArray(typedData.tipsDetails)) {
    const totalTipsFromBreakdown = typedData.tipsDetails.reduce(
      (sum: number, tip: { myShare?: number }) => sum + (tip.myShare || 0),
      0
    );
    if (Math.abs(totalTipsFromBreakdown - (typedData.tips || 0)) > 0.01) {
      errors.push('Tips breakdown does not match total tips');
    }
  }

  // Validate pay calculations
  if (
    typeof typedData.totalPay === 'number' &&
    typeof typedData.grossWages === 'number' &&
    typeof typedData.tips === 'number' &&
    typeof typedData.commission === 'number' &&
    typeof typedData.bonuses === 'number'
  ) {
    const calculatedTotal =
      typedData.grossWages +
      typedData.tips +
      typedData.commission +
      typedData.bonuses;
    if (Math.abs(calculatedTotal - typedData.totalPay) > 0.01) {
      errors.push('Total pay calculation does not match component sum');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
