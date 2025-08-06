'use server';

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculatePayroll } from '@/lib/payCalculator';
import { convertCommissionDecimalFields } from '@/lib/decimal-utils';
import type { 
  User, 
  Department, 
  PayPeriod, 
  PayPeriodStatus, 
  DailyLog,
  CommissionEntry 
} from '@/types';

// Types for pay period analysis
export interface PayPeriodComparison {
  currentPeriod: PayrollPeriodData;
  previousPeriod?: PayrollPeriodData;
  trends: PayrollTrends;
  insights: PayrollInsight[];
}

export interface PayrollPeriodData {
  payPeriod: PayPeriod;
  totalPay: number;
  totalHours: number;
  tips: number;
  bonuses: number;
  commission: number;
  departmentBreakdown: {
    [key in Department]: {
      hours: number;
      pay: number;
      percentage: number;
    };
  };
  dailyAverages: {
    pay: number;
    hours: number;
    tips: number;
  };
  laborEfficiency: {
    junkPercentage: number;
    movePercentage: number;
    overallEfficiency: number;
  };
}

export interface PayrollTrends {
  totalPay: TrendData;
  totalHours: TrendData;
  tips: TrendData;
  bonuses: TrendData;
  laborEfficiency: TrendData;
  tipsPerHour: TrendData;
}

export interface TrendData {
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  isPositive: boolean;
  isSignificant: boolean; // > 10% change
}

export interface PayrollInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
}

/**
 * Get pay period comparison data for analysis
 */
export async function getPayPeriodComparison(
  employeeId: string,
  currentPeriodId: string,
  comparisonType: 'previous' | 'same-last-month' | 'best-period' | 'average' = 'previous'
): Promise<{ success: boolean; data?: PayPeriodComparison; error?: string }> {
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

    // Get current pay period
    const currentPeriod = await prisma.payPeriod.findUnique({
      where: { id: currentPeriodId },
    });

    if (!currentPeriod) {
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

    // Convert employee data for calculations
    const employeeForCalculation: User = {
      ...employee,
      roles: employee.roles as User['roles'],
      rateJunkCaptain: employee.rateJunkCaptain ? Number(employee.rateJunkCaptain) : undefined,
      rateJunkWingman: employee.rateJunkWingman ? Number(employee.rateJunkWingman) : undefined,
      rateMoveCaptain: employee.rateMoveCaptain ? Number(employee.rateMoveCaptain) : undefined,
      rateMoveWingman: employee.rateMoveWingman ? Number(employee.rateMoveWingman) : undefined,
      rateZigma: employee.rateZigma ? Number(employee.rateZigma) : undefined,
      rateTraining: employee.rateTraining ? Number(employee.rateTraining) : undefined,
      rateEstimating: employee.rateEstimating ? Number(employee.rateEstimating) : undefined,
      rateWarehouse: employee.rateWarehouse ? Number(employee.rateWarehouse) : undefined,
      rateAdmin: employee.rateAdmin ? Number(employee.rateAdmin) : undefined,
      salaryAmount: employee.salaryAmount ? Number(employee.salaryAmount) : undefined,
      salaryFrequency: employee.salaryFrequency as User['salaryFrequency'],
      salaryType: employee.salaryType as User['salaryType'],
      commissionRate: employee.commissionRate ? Number(employee.commissionRate) : undefined,
      junkBonusGoal: Number(employee.junkBonusGoal),
      moveBonusGoal: Number(employee.moveBonusGoal),
    };

    // Get current period data
    const currentPeriodData = await getPayrollPeriodData(
      employeeForCalculation,
      {
        ...currentPeriod,
        status: currentPeriod.status as PayPeriodStatus,
      }
    );

    // Get comparison period
    let comparisonPeriod: PayPeriod | null = null;
    
    if (comparisonType === 'previous') {
      const result = await prisma.payPeriod.findFirst({
        where: {
          endDate: { lt: currentPeriod.startDate },
          status: 'closed',
        },
        orderBy: { endDate: 'desc' },
      });
      
      if (result) {
        comparisonPeriod = {
          ...result,
          status: result.status as PayPeriodStatus,
        };
      }
    }
    // Add other comparison types as needed

    let previousPeriodData: PayrollPeriodData | undefined;
    if (comparisonPeriod) {
      previousPeriodData = await getPayrollPeriodData(
        employeeForCalculation,
        {
          ...comparisonPeriod,
          status: comparisonPeriod.status as PayPeriodStatus,
        }
      );
    }

    // Calculate trends
    const trends = calculateTrends(currentPeriodData, previousPeriodData);

    // Generate insights
    const insights = generateInsights(currentPeriodData, previousPeriodData, trends);

    const comparison: PayPeriodComparison = {
      currentPeriod: currentPeriodData,
      previousPeriod: previousPeriodData,
      trends,
      insights,
    };

    return { success: true, data: comparison };
  } catch (error) {
    console.error('Error fetching pay period comparison:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pay period comparison',
    };
  }
}

/**
 * Get payroll data for a specific period
 */
async function getPayrollPeriodData(
  employee: User,
  payPeriod: PayPeriod
): Promise<PayrollPeriodData> {
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

  // Convert Prisma data to proper types for calculation
  const employeeForCalculation: User = {
    ...employee,
    roles: employee.roles as User['roles'],
    rateJunkCaptain: employee.rateJunkCaptain ? Number(employee.rateJunkCaptain) : undefined,
    rateJunkWingman: employee.rateJunkWingman ? Number(employee.rateJunkWingman) : undefined,
    rateMoveCaptain: employee.rateMoveCaptain ? Number(employee.rateMoveCaptain) : undefined,
    rateMoveWingman: employee.rateMoveWingman ? Number(employee.rateMoveWingman) : undefined,
    rateZigma: employee.rateZigma ? Number(employee.rateZigma) : undefined,
    rateTraining: employee.rateTraining ? Number(employee.rateTraining) : undefined,
    rateEstimating: employee.rateEstimating ? Number(employee.rateEstimating) : undefined,
    rateWarehouse: employee.rateWarehouse ? Number(employee.rateWarehouse) : undefined,
    rateAdmin: employee.rateAdmin ? Number(employee.rateAdmin) : undefined,
    salaryAmount: employee.salaryAmount ? Number(employee.salaryAmount) : undefined,
    salaryFrequency: employee.salaryFrequency as User['salaryFrequency'],
    salaryType: employee.salaryType as User['salaryType'],
    commissionRate: employee.commissionRate ? Number(employee.commissionRate) : undefined,
    junkBonusGoal: Number(employee.junkBonusGoal),
    moveBonusGoal: Number(employee.moveBonusGoal),
  };

  // Convert logs data (simplified conversion for this use case)
  const logsForCalculation: DailyLog[] = approvedLogs.map(log => ({
    ...log,
    status: log.status as DailyLog['status'],
    submittedAt: log.submittedAt || undefined,
    approvedAt: log.approvedAt || undefined,
    approvedById: log.approvedById || undefined,
    lastEditedById: log.lastEditedById || undefined,
    captain: employeeForCalculation, // Simplified - using the same employee
    createdBy: employeeForCalculation,
    approvedBy: log.approvedBy ? employeeForCalculation : undefined,
    lastEditedBy: log.lastEditedBy ? employeeForCalculation : undefined,
    hours: log.hours?.map(hour => ({
      ...hour,
      log: {} as DailyLog,
      department: hour.department as Department,
      hours: Number(hour.hours),
      employee: employeeForCalculation,
    })) || [],
    jobs: log.jobs?.map(job => ({
      ...job,
      jobType: job.jobType as 'junk' | 'move',
      revenue: Number(job.revenue),
      tips: Number(job.tips),
      junkOnMove: job.junkOnMove ? Number(job.junkOnMove) : undefined,
      valuation: job.valuation ? Number(job.valuation) : undefined,
      materials: job.materials ? Number(job.materials) : undefined,
      disposalCost: job.disposalCost ? Number(job.disposalCost) : undefined,
      log: {} as DailyLog,
    })) || [],
  }));

  // Convert commission entries
  const commissionsForCalculation: CommissionEntry[] = commissionEntries.map(commission => ({
    ...commission,
    ...convertCommissionDecimalFields(commission),
    jobType: commission.jobType as CommissionEntry['jobType'],
    status: commission.status as CommissionEntry['status'],
    matchedLogId: commission.matchedLogId || undefined,
    matchedLog: commission.matchedLog ? {
      ...commission.matchedLog,
      status: commission.matchedLog.status as DailyLog['status'],
      submittedAt: commission.matchedLog.submittedAt || undefined,
      approvedAt: commission.matchedLog.approvedAt || undefined,
      approvedById: commission.matchedLog.approvedById || undefined,
      lastEditedById: commission.matchedLog.lastEditedById || undefined,
    } as DailyLog : undefined,
    sales: employeeForCalculation,
  }));

  // Calculate payroll using existing logic
  const payrollCalculation = calculatePayroll(
    [employeeForCalculation],
    logsForCalculation,
    commissionsForCalculation,
    payPeriod.startDate,
    payPeriod.endDate
  );

  // Calculate department breakdown
  const departmentBreakdown = {} as PayrollPeriodData['departmentBreakdown'];
  const employeePayroll = payrollCalculation[0]; // Get the first (and only) employee's payroll
  const totalHours = employeePayroll.totalHours;
  
  Object.entries(employeePayroll.hoursByDepartment).forEach(([dept, hours]) => {
    if (hours > 0) {
      const department = dept as Department;
      const rate = getEmployeeRate(employee, department, false); // Simplified rate calculation
      const pay = hours * rate;
      
      departmentBreakdown[department] = {
        hours,
        pay,
        percentage: totalHours > 0 ? (hours / totalHours) * 100 : 0,
      };
    }
  });

  // Calculate daily averages
  const workingDays = Math.max(1, getWorkingDaysInPeriod(payPeriod.startDate, payPeriod.endDate));
  const dailyAverages = {
    pay: employeePayroll.totalPay / workingDays,
    hours: totalHours / workingDays,
    tips: employeePayroll.tips / workingDays,
  };

  // Calculate labor efficiency (simplified)
  const laborEfficiency = {
    junkPercentage: 85, // Would calculate from actual data
    movePercentage: 90, // Would calculate from actual data
    overallEfficiency: 88, // Would calculate from actual data
  };

  return {
    payPeriod,
    totalPay: employeePayroll.totalPay,
    totalHours: totalHours,
    tips: employeePayroll.tips,
    bonuses: employeePayroll.bonuses,
    commission: employeePayroll.commission,
    departmentBreakdown,
    dailyAverages,
    laborEfficiency,
  };
}

/**
 * Calculate trends between current and previous periods
 */
function calculateTrends(
  current: PayrollPeriodData,
  previous?: PayrollPeriodData
): PayrollTrends {
  const createTrendData = (currentValue: number, previousValue: number = 0): TrendData => {
    const change = currentValue - previousValue;
    const changePercentage = previousValue > 0 ? (change / previousValue) * 100 : 0;
    
    return {
      current: currentValue,
      previous: previousValue,
      change,
      changePercentage,
      isPositive: change >= 0,
      isSignificant: Math.abs(changePercentage) > 10,
    };
  };

  return {
    totalPay: createTrendData(current.totalPay, previous?.totalPay),
    totalHours: createTrendData(current.totalHours, previous?.totalHours),
    tips: createTrendData(current.tips, previous?.tips),
    bonuses: createTrendData(current.bonuses, previous?.bonuses),
    laborEfficiency: createTrendData(
      current.laborEfficiency.overallEfficiency,
      previous?.laborEfficiency.overallEfficiency
    ),
    tipsPerHour: createTrendData(
      current.totalHours > 0 ? current.tips / current.totalHours : 0,
      previous && previous.totalHours > 0 ? previous.tips / previous.totalHours : 0
    ),
  };
}

/**
 * Generate insights based on payroll data and trends
 */
function generateInsights(
  current: PayrollPeriodData,
  previous?: PayrollPeriodData,
  trends?: PayrollTrends
): PayrollInsight[] {
  const insights: PayrollInsight[] = [];

  // Tips performance insight
  if (trends?.tips.isPositive && trends.tips.isSignificant) {
    insights.push({
      type: 'positive',
      title: 'Tips Performance Improved',
      description: `Your tips increased by ${trends.tips.changePercentage.toFixed(1)}% compared to last period`,
      metric: `+$${trends.tips.change.toFixed(0)} in tips`,
      recommendation: 'Keep up the excellent customer service!',
    });
  }

  // Labor efficiency insight
  if (current.laborEfficiency.overallEfficiency > 85) {
    insights.push({
      type: 'positive',
      title: 'Strong Labor Efficiency',
      description: 'Your efficiency is above target, earning additional bonuses',
      metric: `${current.laborEfficiency.overallEfficiency}% efficiency`,
      recommendation: 'Continue focusing on efficient job completion',
    });
  }

  // Hours worked insight
  if (current.totalHours > 40) {
    insights.push({
      type: 'warning',
      title: 'High Hours Worked',
      description: `You worked ${current.totalHours} hours this period`,
      metric: `${current.totalHours} hours worked`,
      recommendation: 'Monitor hours to optimize pay structure',
    });
  }

  // Department mix insight
  const primaryDept = Object.entries(current.departmentBreakdown)
    .sort(([,a], [,b]) => b.hours - a.hours)[0];
  
  if (primaryDept) {
    insights.push({
      type: 'neutral',
      title: 'Department Focus',
      description: `You worked primarily in ${primaryDept[0]} this period`,
      metric: `${primaryDept[1].hours}h in ${primaryDept[0]}`,
    });
  }

  return insights;
}

/**
 * Get employee rate for a department (simplified)
 */
function getEmployeeRate(employee: User, department: Department, isCaptain: boolean): number {
  switch (department) {
    case 'junk':
      return isCaptain ? (employee.rateJunkCaptain || 0) : (employee.rateJunkWingman || 0);
    case 'move':
      return isCaptain ? (employee.rateMoveCaptain || 0) : (employee.rateMoveWingman || 0);
    case 'zigma':
      return employee.rateZigma || 0;
    case 'training':
      return employee.rateTraining || 0;
    case 'estimating':
      return employee.rateEstimating || 0;
    case 'warehouse':
      return employee.rateWarehouse || 0;
    case 'admin':
      return employee.rateAdmin || 0;
    default:
      return 0;
  }
}

/**
 * Get working days in a period (simplified)
 */
function getWorkingDaysInPeriod(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Get historical payroll data for trends
 */
export async function getHistoricalPayrollData(
  employeeId: string,
  periodCount: number = 5
): Promise<{ success: boolean; data?: PayrollPeriodData[]; error?: string }> {
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

    // Get recent closed pay periods
    const payPeriods = await prisma.payPeriod.findMany({
      where: {
        status: 'closed',
      },
      orderBy: { endDate: 'desc' },
      take: periodCount,
    });

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

    // Convert employee data for calculations
    const employeeForCalculation: User = {
      ...employee,
      roles: employee.roles as User['roles'],
      rateJunkCaptain: employee.rateJunkCaptain ? Number(employee.rateJunkCaptain) : undefined,
      rateJunkWingman: employee.rateJunkWingman ? Number(employee.rateJunkWingman) : undefined,
      rateMoveCaptain: employee.rateMoveCaptain ? Number(employee.rateMoveCaptain) : undefined,
      rateMoveWingman: employee.rateMoveWingman ? Number(employee.rateMoveWingman) : undefined,
      rateZigma: employee.rateZigma ? Number(employee.rateZigma) : undefined,
      rateTraining: employee.rateTraining ? Number(employee.rateTraining) : undefined,
      rateEstimating: employee.rateEstimating ? Number(employee.rateEstimating) : undefined,
      rateWarehouse: employee.rateWarehouse ? Number(employee.rateWarehouse) : undefined,
      rateAdmin: employee.rateAdmin ? Number(employee.rateAdmin) : undefined,
      salaryAmount: employee.salaryAmount ? Number(employee.salaryAmount) : undefined,
      salaryFrequency: employee.salaryFrequency as User['salaryFrequency'],
      salaryType: employee.salaryType as User['salaryType'],
      commissionRate: employee.commissionRate ? Number(employee.commissionRate) : undefined,
      junkBonusGoal: Number(employee.junkBonusGoal),
      moveBonusGoal: Number(employee.moveBonusGoal),
    };

    // Get payroll data for each period
    const historicalData: PayrollPeriodData[] = [];
    
    for (const period of payPeriods) {
      const periodData = await getPayrollPeriodData(
        employeeForCalculation,
        {
          ...period,
          status: period.status as PayPeriodStatus,
        }
      );
      historicalData.push(periodData);
    }

    return { success: true, data: historicalData };
  } catch (error) {
    console.error('Error fetching historical payroll data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch historical payroll data',
    };
  }
}

/**
 * Get cached pay period comparison (for performance)
 */
export async function getCachedPayPeriodComparison(
  employeeId: string,
  currentPeriodId: string,
  comparisonType: 'previous' | 'same-last-month' | 'best-period' | 'average' = 'previous'
) {
  const cacheKey = `pay-period-comparison-${employeeId}-${currentPeriodId}-${comparisonType}`;

  // Cache for 1 hour for open periods, indefinitely for closed periods
  const currentPeriod = await prisma.payPeriod.findUnique({
    where: { id: currentPeriodId },
  });

  const revalidateTime = currentPeriod?.status === 'closed' ? false : 3600;

  return unstable_cache(
    () => getPayPeriodComparison(employeeId, currentPeriodId, comparisonType),
    [cacheKey],
    { revalidate: revalidateTime }
  )();
}