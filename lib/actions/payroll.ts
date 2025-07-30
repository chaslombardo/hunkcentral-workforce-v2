'use server';

import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculatePayroll, calculateHourlyWage } from '@/lib/payCalculator';
import type { Department, PayPeriod, PayPeriodStatus } from '@/types';

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
      },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get detailed payroll data
    // Convert Decimal values to numbers for calculation functions
    const employeeWithNumbers = {
      ...employee,
      rateJunkCaptain: employee.rateJunkCaptain ? Number(employee.rateJunkCaptain) : null,
      rateJunkWingman: employee.rateJunkWingman ? Number(employee.rateJunkWingman) : null,
      rateMoveCaptain: employee.rateMoveCaptain ? Number(employee.rateMoveCaptain) : null,
      rateMoveWingman: employee.rateMoveWingman ? Number(employee.rateMoveWingman) : null,
      rateZigma: employee.rateZigma ? Number(employee.rateZigma) : null,
      rateTraining: employee.rateTraining ? Number(employee.rateTraining) : null,
      rateEstimating: employee.rateEstimating ? Number(employee.rateEstimating) : null,
      rateWarehouse: employee.rateWarehouse ? Number(employee.rateWarehouse) : null,
      rateAdmin: employee.rateAdmin ? Number(employee.rateAdmin) : null,
      salaryAmount: employee.salaryAmount ? Number(employee.salaryAmount) : null,
      commissionRate: employee.commissionRate ? Number(employee.commissionRate) : null,
      junkBonusGoal: Number(employee.junkBonusGoal),
      moveBonusGoal: Number(employee.moveBonusGoal),
      createdAt: new Date(), // Add required fields for User interface
      updatedAt: new Date(),
    };
    
    const detailedData = await getEnhancedPayrollData(employeeWithNumbers, {
      ...payPeriod,
      status: payPeriod.status as PayPeriodStatus,
    });

    return { success: true, data: detailedData };
  } catch (error) {
    console.error('Error fetching detailed payroll breakdown:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payroll breakdown',
    };
  }
}

/**
 * Get enhanced payroll data with department breakdowns, daily history, and tips details
 */
async function getEnhancedPayrollData(
  employee: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
    rateJunkCaptain?: number | null;
    rateJunkWingman?: number | null;
    rateMoveCaptain?: number | null;
    rateMoveWingman?: number | null;
    rateZigma?: number | null;
    rateTraining?: number | null;
    rateEstimating?: number | null;
    rateWarehouse?: number | null;
    rateAdmin?: number | null;
    salaryAmount?: number | null;
    salaryFrequency?: string | null;
    salaryType?: string | null;
    commissionRate?: number | null;
    junkBonusGoal: number;
    moveBonusGoal: number;
  },
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
    },
  });

  // Calculate basic payroll using existing logic
  // Convert employee to match User interface requirements
  const employeeForCalculation = {
    ...employee,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roles: employee.roles as any[], // Type assertion for roles
    rateJunkCaptain: employee.rateJunkCaptain ?? undefined,
    rateJunkWingman: employee.rateJunkWingman ?? undefined,
    rateMoveCaptain: employee.rateMoveCaptain ?? undefined,
    rateMoveWingman: employee.rateMoveWingman ?? undefined,
    rateZigma: employee.rateZigma ?? undefined,
    rateTraining: employee.rateTraining ?? undefined,
    rateEstimating: employee.rateEstimating ?? undefined,
    rateWarehouse: employee.rateWarehouse ?? undefined,
    rateAdmin: employee.rateAdmin ?? undefined,
    salaryAmount: employee.salaryAmount ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    salaryFrequency: (employee.salaryFrequency as any) ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    salaryType: (employee.salaryType as any) ?? undefined,
    commissionRate: employee.commissionRate ?? undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  const basicPayroll = calculatePayroll(
    [employeeForCalculation],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    approvedLogs as any, // Prisma query result matches needed DailyLog fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commissionEntries as any, // Prisma query result matches needed CommissionEntry fields
    payPeriod.startDate,
    payPeriod.endDate
  )[0];

  // Calculate department breakdown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const departmentBreakdown = calculateDepartmentBreakdown(employee, approvedLogs as any);

  // Calculate daily work history
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dailyWorkHistory = calculateDailyWorkHistory(employee, approvedLogs as any);

  // Calculate tips details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tipsDetails = calculateTipsDetails(employee, approvedLogs as any);

  // Get rate information
  const rateInformation = getRateInformation(employee);

  return {
    employeeId: employee.id,
    employee: {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      roles: employee.roles,
    },
    totalHours: basicPayroll.totalHours,
    totalPay: basicPayroll.totalPay,
    grossWages: basicPayroll.grossWages,
    tips: basicPayroll.tips,
    commission: basicPayroll.commission,
    bonuses: basicPayroll.bonuses,
    departmentBreakdown,
    dailyWorkHistory,
    tipsDetails,
    rateInformation,
  };
}

/**
 * Calculate department breakdown for an employee
 */
function calculateDepartmentBreakdown(
  employee: {
    id: string;
    rateJunkCaptain?: number | null;
    rateJunkWingman?: number | null;
    rateMoveCaptain?: number | null;
    rateMoveWingman?: number | null;
    rateZigma?: number | null;
    rateTraining?: number | null;
    rateEstimating?: number | null;
    rateWarehouse?: number | null;
    rateAdmin?: number | null;
    roles: string[];
  },
  approvedLogs: Array<{
    id: string;
    hours: Array<{
      employeeId: string;
      department: string;
      hours: number;
      isCoCaptain: boolean;
    }>;
  }>
): DepartmentBreakdown[] {
  const departmentTotals: Record<Department, { hours: number; grossPay: number }> = {
    junk: { hours: 0, grossPay: 0 },
    move: { hours: 0, grossPay: 0 },
    zigma: { hours: 0, grossPay: 0 },
    training: { hours: 0, grossPay: 0 },
    estimating: { hours: 0, grossPay: 0 },
    warehouse: { hours: 0, grossPay: 0 },
    admin: { hours: 0, grossPay: 0 },
  };

  let totalHours = 0;

  // Sum up hours and calculate pay by department
  for (const log of approvedLogs) {
    const employeeHours = log.hours.filter(hour => hour.employeeId === employee.id);
    
    for (const hour of employeeHours) {
      const department = hour.department as Department;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rate = calculateHourlyWage(employee as any, department, hour.isCoCaptain);
      const hoursValue = Number(hour.hours);
      const pay = hoursValue * rate;

      departmentTotals[department].hours += hoursValue;
      departmentTotals[department].grossPay += pay;
      totalHours += hoursValue;
    }
  }

  // Convert to breakdown format
  const breakdown: DepartmentBreakdown[] = [];
  let primaryDepartment: Department | null = null;
  let maxHours = 0;

  for (const [dept, totals] of Object.entries(departmentTotals)) {
    if (totals.hours > 0) {
      const department = dept as Department;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rate = calculateHourlyWage(employee as any, department, false);
      const percentage = totalHours > 0 ? (totals.hours / totalHours) * 100 : 0;

      if (totals.hours > maxHours) {
        maxHours = totals.hours;
        primaryDepartment = department;
      }

      breakdown.push({
        department,
        hours: totals.hours,
        rate,
        grossPay: totals.grossPay,
        percentage,
        isPrimary: false, // Will be set below
      });
    }
  }

  // Mark primary department
  if (primaryDepartment) {
    const primaryIndex = breakdown.findIndex(b => b.department === primaryDepartment);
    if (primaryIndex >= 0) {
      breakdown[primaryIndex].isPrimary = true;
    }
  }

  return breakdown.sort((a, b) => b.hours - a.hours);
}

/**
 * Calculate daily work history for an employee
 */
function calculateDailyWorkHistory(
  employee: {
    id: string;
    rateJunkCaptain?: number | null;
    rateJunkWingman?: number | null;
    rateMoveCaptain?: number | null;
    rateMoveWingman?: number | null;
    rateZigma?: number | null;
    rateTraining?: number | null;
    rateEstimating?: number | null;
    rateWarehouse?: number | null;
    rateAdmin?: number | null;
    roles: string[];
  },
  approvedLogs: Array<{
    id: string;
    captainId: string;
    logDate: Date;
    hours: Array<{
      employeeId: string;
      department: string;
      hours: number;
      isCoCaptain: boolean;
    }>;
  }>
): DailyWorkEntry[] {
  const dailyEntries: Map<string, DailyWorkEntry> = new Map();

  for (const log of approvedLogs) {
    const employeeHours = log.hours.filter(hour => hour.employeeId === employee.id);
    
    if (employeeHours.length === 0) continue;

    const dateKey = log.logDate.toISOString().split('T')[0];
    
    if (!dailyEntries.has(dateKey)) {
      dailyEntries.set(dateKey, {
        date: log.logDate,
        departments: [],
        tips: 0,
        logIds: [],
        role: 'wingman', // Default, will be updated
      });
    }

    const entry = dailyEntries.get(dateKey)!;
    entry.logIds.push(log.id);

    // Determine role for this log
    if (log.captainId === employee.id) {
      entry.role = 'captain';
    } else if (employeeHours.some(hour => hour.isCoCaptain)) {
      entry.role = 'co-captain';
    }

    // Add department hours
    for (const hour of employeeHours) {
      const department = hour.department as Department;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rate = calculateHourlyWage(employee as any, department, hour.isCoCaptain);
      const hoursValue = Number(hour.hours);
      
      const existingDept = entry.departments.find(d => d.department === department);
      if (existingDept) {
        existingDept.hours += hoursValue;
      } else {
        entry.departments.push({
          department,
          hours: hoursValue,
          rate,
        });
      }
    }

    // Calculate tips for this day
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dailyTips = calculateDailyTips(employee.id, log as any);
    entry.tips += dailyTips;
  }

  return Array.from(dailyEntries.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Calculate tips details for an employee
 */
function calculateTipsDetails(
  employee: { id: string },
  approvedLogs: Array<{
    id: string;
    logDate: Date;
    hours: Array<{
      employeeId: string;
      department: string;
    }>;
    jobs: Array<{
      jobId: string;
      clientName: string;
      jobType: string;
      tips: number;
    }>;
  }>
): TipEntry[] {
  const tipEntries: TipEntry[] = [];

  for (const log of approvedLogs) {
    const employeeHours = log.hours.filter(hour => hour.employeeId === employee.id);
    
    if (employeeHours.length === 0) continue;

    // Group jobs by section type
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    const moveJobs = log.jobs.filter(job => job.jobType === 'move');

    // Calculate tips for junk section
    const junkHours = employeeHours.filter(hour => hour.department === 'junk');
    if (junkJobs.length > 0 && junkHours.length > 0) {
      const junkEmployees = [...new Set(log.hours
        .filter(hour => hour.department === 'junk')
        .map(hour => hour.employeeId))];
      
      for (const job of junkJobs) {
        if (job.tips > 0) {
          tipEntries.push({
            date: log.logDate,
            jobId: job.jobId,
            clientName: job.clientName,
            totalJobTips: job.tips,
            teamMembers: junkEmployees.length,
            myShare: job.tips / junkEmployees.length,
            jobType: 'junk',
            logId: log.id,
          });
        }
      }
    }

    // Calculate tips for move section
    const moveHours = employeeHours.filter(hour => hour.department === 'move');
    if (moveJobs.length > 0 && moveHours.length > 0) {
      const moveEmployees = [...new Set(log.hours
        .filter(hour => hour.department === 'move')
        .map(hour => hour.employeeId))];
      
      for (const job of moveJobs) {
        if (job.tips > 0) {
          tipEntries.push({
            date: log.logDate,
            jobId: job.jobId,
            clientName: job.clientName,
            totalJobTips: job.tips,
            teamMembers: moveEmployees.length,
            myShare: job.tips / moveEmployees.length,
            jobType: 'move',
            logId: log.id,
          });
        }
      }
    }
  }

  return tipEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
}

/**
 * Calculate daily tips for an employee from a specific log
 */
function calculateDailyTips(employeeId: string, log: {
  hours: Array<{
    employeeId: string;
    department: string;
  }>;
  jobs: Array<{
    jobType: string;
    tips: number;
  }>;
}): number {
  const employeeHours = log.hours.filter(hour => hour.employeeId === employeeId);
  
  if (employeeHours.length === 0) return 0;

  let totalTips = 0;

  // Calculate tips from junk section
  const junkHours = employeeHours.filter(hour => hour.department === 'junk');
  if (junkHours.length > 0) {
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    const junkEmployees = [...new Set(log.hours
      .filter(hour => hour.department === 'junk')
      .map(hour => hour.employeeId))];
    
    const junkTips = junkJobs.reduce((sum: number, job) => sum + Number(job.tips), 0);
    if (junkEmployees.length > 0) {
      totalTips += junkTips / junkEmployees.length;
    }
  }

  // Calculate tips from move section
  const moveHours = employeeHours.filter(hour => hour.department === 'move');
  if (moveHours.length > 0) {
    const moveJobs = log.jobs.filter(job => job.jobType === 'move');
    const moveEmployees = [...new Set(log.hours
      .filter(hour => hour.department === 'move')
      .map(hour => hour.employeeId))];
    
    const moveTips = moveJobs.reduce((sum: number, job) => sum + Number(job.tips), 0);
    if (moveEmployees.length > 0) {
      totalTips += moveTips / moveEmployees.length;
    }
  }

  return totalTips;
}

/**
 * Get rate information for an employee
 */
function getRateInformation(employee: {
  rateJunkCaptain?: number | null;
  rateJunkWingman?: number | null;
  rateMoveCaptain?: number | null;
  rateMoveWingman?: number | null;
  rateZigma?: number | null;
  rateTraining?: number | null;
  rateEstimating?: number | null;
  rateWarehouse?: number | null;
  rateAdmin?: number | null;
  roles: string[];
}): RateInfo {
  const departments: Department[] = ['junk', 'move', 'zigma', 'training', 'estimating', 'warehouse', 'admin'];
  const rateInfo: RateInfo = {};

  for (const department of departments) {
    const info: {
      captainRate?: number;
      wingmanRate?: number;
      currentRate: number;
    } = { currentRate: 0 };

    switch (department) {
      case 'junk':
        if (employee.rateJunkCaptain) info.captainRate = Number(employee.rateJunkCaptain);
        if (employee.rateJunkWingman) info.wingmanRate = Number(employee.rateJunkWingman);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        info.currentRate = calculateHourlyWage(employee as any, department, false);
        break;
      case 'move':
        if (employee.rateMoveCaptain) info.captainRate = Number(employee.rateMoveCaptain);
        if (employee.rateMoveWingman) info.wingmanRate = Number(employee.rateMoveWingman);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        info.currentRate = calculateHourlyWage(employee as any, department, false);
        break;
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        info.currentRate = calculateHourlyWage(employee as any, department, false);
        break;
    }

    rateInfo[department] = info;
  }

  return rateInfo;
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
): Promise<{ success: boolean; data?: {
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
}; error?: string }> {
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
      },
    });

    // Calculate basic payroll
    // Convert Decimal values to numbers for calculation functions
    const employeeWithNumbers = {
      ...employee,
      rateJunkCaptain: employee.rateJunkCaptain ? Number(employee.rateJunkCaptain) : null,
      rateJunkWingman: employee.rateJunkWingman ? Number(employee.rateJunkWingman) : null,
      rateMoveCaptain: employee.rateMoveCaptain ? Number(employee.rateMoveCaptain) : null,
      rateMoveWingman: employee.rateMoveWingman ? Number(employee.rateMoveWingman) : null,
      rateZigma: employee.rateZigma ? Number(employee.rateZigma) : null,
      rateTraining: employee.rateTraining ? Number(employee.rateTraining) : null,
      rateEstimating: employee.rateEstimating ? Number(employee.rateEstimating) : null,
      rateWarehouse: employee.rateWarehouse ? Number(employee.rateWarehouse) : null,
      rateAdmin: employee.rateAdmin ? Number(employee.rateAdmin) : null,
      salaryAmount: employee.salaryAmount ? Number(employee.salaryAmount) : null,
      commissionRate: employee.commissionRate ? Number(employee.commissionRate) : null,
      junkBonusGoal: Number(employee.junkBonusGoal),
      moveBonusGoal: Number(employee.moveBonusGoal),
      createdAt: new Date(), // Add required fields for User interface
      updatedAt: new Date(),
    };
    
    // Type assertion is safe here as we're passing the data from Prisma queries
    // that match the expected User, DailyLog, and CommissionEntry interfaces
    const basicPayroll = calculatePayroll(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [employeeWithNumbers] as any[], // Prisma user data matches User interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      approvedLogs as any[], // Prisma log data matches DailyLog interface  
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      commissionEntries as any[], // Prisma commission data matches CommissionEntry interface
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
    console.error('Error fetching payroll summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payroll summary',
    };
  }
}

/**
 * Validate enhanced payroll breakdown for accuracy
 */
export function validateEnhancedPayrollBreakdown(data: EnhancedPayrollData): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate department totals match overall totals
  const departmentHoursSum = data.departmentBreakdown.reduce((sum, dept) => sum + dept.hours, 0);
  
  if (Math.abs(departmentHoursSum - data.totalHours) > 0.01) {
    errors.push('Department hours do not match total hours');
  }

  const departmentPaySum = data.departmentBreakdown.reduce((sum, dept) => sum + dept.grossPay, 0);
  
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
    return sum + day.departments.reduce((daySum, dept) => daySum + dept.hours, 0);
  }, 0);
  
  if (Math.abs(dailyHoursSum - data.totalHours) > 0.01) {
    errors.push('Daily work history hours do not match total hours');
  }

  // Validate percentages add up to 100% (allowing for rounding)
  const percentageSum = data.departmentBreakdown.reduce((sum, dept) => sum + dept.percentage, 0);
  if (Math.abs(percentageSum - 100) > 0.1 && data.totalHours > 0) {
    errors.push('Department percentages do not add up to 100%');
  }

  return { isValid: errors.length === 0, errors };
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
    if (session.user.id !== targetEmployeeId && 
        !session.user.roles?.some(role => ['admin', 'manager'].includes(role))) {
      throw new Error('Unauthorized: Can only view your own pay periods');
    }

    const payPeriods = await prisma.payPeriod.findMany({
      orderBy: { startDate: 'desc' },
      take: 12, // Last 12 pay periods
    });

    return { success: true, data: payPeriods };
  } catch (error) {
    console.error('Error fetching employee pay periods:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch pay periods',
    };
  }
}