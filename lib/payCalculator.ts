// Payroll and bonus calculation logic
import type { 
  User, 
  Department, 
  DailyLog, 
  CommissionEntry, 
  SalaryType, 
  SalaryFrequency,
  CaptainPerformanceData,
  JunkPerformanceMetrics,
  MovePerformanceMetrics,
  PerformanceFilters
} from '@/types';
import { LABOR_GOALS } from './constants';

export interface PayrollCalculation {
  employeeId: string;
  employee: User;
  totalHours: number;
  hoursByDepartment: Record<Department, number>;
  grossWages: number;
  tips: number;
  commission: number;
  bonuses: number;
  totalPay: number;
  breakdown: PayrollBreakdown;
}

export interface EnhancedPayrollCalculation extends PayrollCalculation {
  departmentBreakdown: {
    [key in Department]: {
      hours: number;
      rate: number;
      grossPay: number;
      percentage: number;
    };
  };
  dailyBreakdown: {
    [date: string]: {
      departments: { [key in Department]: number };
      tips: number;
      totalHours: number;
    };
  };
  tipsBreakdown: TipEntry[];
  rateSchedule: {
    [key in Department]: {
      captainRate?: number;
      wingmanRate?: number;
      currentRate: number;
    };
  };
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

export interface PayrollBreakdown {
  hourlyWages: number;
  salaryAmount: number;
  salaryType: SalaryType | null;
  salaryFrequency: SalaryFrequency | null;
  tips: number;
  commission: number;
  laborBonuses: number;
  totalBeforeSalaryAdjustment: number;
  finalPay: number;
}

export interface TipDistribution {
  employeeId: string;
  logId: string;
  sectionType: 'junk' | 'move' | 'other';
  totalSectionTips: number;
  numberOfHunks: number;
  tipsPerHunk: number;
}

export interface CommissionSummary {
  employeeId: string;
  totalCommissionAmount: number;
  commissionEntries: CommissionEntry[];
}

export interface LaborBonusSummary {
  employeeId: string;
  totalBonusAmount: number;
  bonusDetails: {
    logId: string;
    sectionType: 'junk' | 'move';
    bonusAmount: number;
    actualPercentage: number;
    goalPercentage: number;
    revenue: number;
  }[];
}

export interface LaborCostCalculation {
  totalRevenue: number;
  totalLaborCost: number;
  laborCostPercentage: number;
  isUnderGoal: boolean;
  goal: number;
}

/**
 * Calculate hourly wages for an employee based on department and co-captain status
 */
export function calculateHourlyWage(
  user: User,
  department: Department,
  isCoCaptain: boolean = false
): number {
  // Use captain rate if user is captain or co-captain, otherwise use wingman rate
  const usesCaptainRate = user.roles.includes('captain') || isCoCaptain;

  switch (department) {
    case 'junk':
      return usesCaptainRate
        ? Number(user.rateJunkCaptain ?? 0)
        : Number(user.rateJunkWingman ?? 0);
    case 'move':
      return usesCaptainRate
        ? Number(user.rateMoveCaptain ?? 0)
        : Number(user.rateMoveWingman ?? 0);
    case 'zigma':
      return Number(user.rateZigma ?? 0);
    case 'training':
      return Number(user.rateTraining ?? 0);
    case 'estimating':
      return Number(user.rateEstimating ?? 0);
    case 'warehouse':
      return Number(user.rateWarehouse ?? 0);
    case 'admin':
      return Number(user.rateAdmin ?? 0);
    default:
      return 0;
  }
}

/**
 * Calculate labor cost percentage for a section
 */
export function calculateLaborCostPercentage(
  totalLaborCost: number,
  totalRevenue: number,
  jobType: 'junk' | 'move'
): LaborCostCalculation {
  const percentage = totalRevenue > 0 ? totalLaborCost / totalRevenue : 0;
  const goal = jobType === 'junk' ? LABOR_GOALS.JUNK_DECIMAL : LABOR_GOALS.MOVE_DECIMAL;

  return {
    totalRevenue,
    totalLaborCost,
    laborCostPercentage: percentage,
    isUnderGoal: percentage <= goal,
    goal,
  };
}

/**
 * Calculate labor bonus for a captain
 */
export function calculateLaborBonus(
  captain: User,
  actualPercentage: number,
  goalPercentage: number,
  totalRevenue: number
): number {

  // Only captains are eligible for labor bonuses
  if (!captain.roles.includes('captain')) {
    return 0;
  }

  // Bonus only applies if actual percentage is under goal
  if (actualPercentage >= goalPercentage) {
    return 0;
  }

  // Bonus formula: (goal% - actual%) × captain revenue
  const bonusPercentage = goalPercentage - actualPercentage;
  return bonusPercentage * totalRevenue;
}

/**
 * Calculate tips per HUNK for a section
 */
export function calculateTipsPerHunk(
  totalTips: number,
  numberOfHunks: number
): number {
  return numberOfHunks > 0 ? totalTips / numberOfHunks : 0;
}

/**
 * Calculate tip distribution for all employees across all logs in a pay period
 */
export function calculateTipDistribution(
  approvedLogs: DailyLog[]
): Map<string, number> {
  const employeeTips = new Map<string, number>();

  for (const log of approvedLogs) {
    // Group jobs by section type
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    const moveJobs = log.jobs.filter(job => job.jobType === 'move');

    // Group hours by department/section
    const junkHours = log.hours.filter(hour => hour.department === 'junk');
    const moveHours = log.hours.filter(hour => hour.department === 'move');
    const otherHours = log.hours.filter(hour => 
      !['junk', 'move'].includes(hour.department)
    );

    // Calculate tips for junk section
    if (junkJobs.length > 0 && junkHours.length > 0) {
      const totalJunkTips = junkJobs.reduce((sum, job) => sum + Number(job.tips), 0);
      const junkEmployees = [...new Set(junkHours.map(hour => hour.employeeId))];
      const tipsPerEmployee = totalJunkTips / junkEmployees.length;

      for (const employeeId of junkEmployees) {
        const currentTips = employeeTips.get(employeeId) || 0;
        employeeTips.set(employeeId, currentTips + tipsPerEmployee);
      }
    }

    // Calculate tips for move section
    if (moveJobs.length > 0 && moveHours.length > 0) {
      const totalMoveTips = moveJobs.reduce((sum, job) => sum + Number(job.tips), 0);
      const moveEmployees = [...new Set(moveHours.map(hour => hour.employeeId))];
      const tipsPerEmployee = totalMoveTips / moveEmployees.length;

      for (const employeeId of moveEmployees) {
        const currentTips = employeeTips.get(employeeId) || 0;
        employeeTips.set(employeeId, currentTips + tipsPerEmployee);
      }
    }

    // Other hours don't typically have tips, but included for completeness
    // Tips from "other" jobs would be distributed among other hours employees
    const otherJobs = log.jobs.filter(job => !['junk', 'move'].includes(job.jobType));
    if (otherJobs.length > 0 && otherHours.length > 0) {
      const totalOtherTips = otherJobs.reduce((sum, job) => sum + Number(job.tips), 0);
      const otherEmployees = [...new Set(otherHours.map(hour => hour.employeeId))];
      const tipsPerEmployee = totalOtherTips / otherEmployees.length;

      for (const employeeId of otherEmployees) {
        const currentTips = employeeTips.get(employeeId) || 0;
        employeeTips.set(employeeId, currentTips + tipsPerEmployee);
      }
    }
  }

  return employeeTips;
}

/**
 * Calculate commission totals for employees in a pay period
 */
export function calculateCommissionTotals(
  commissionEntries: CommissionEntry[],
  payPeriodStart: Date,
  payPeriodEnd: Date
): Map<string, number> {
  const employeeCommissions = new Map<string, number>();

  // Filter commission entries that were matched during the pay period
  const matchedCommissions = commissionEntries.filter(entry => {
    if (entry.status !== 'matched' || !entry.matchedLog?.approvedAt) {
      return false;
    }
    
    const approvedDate = new Date(entry.matchedLog.approvedAt);
    return approvedDate >= payPeriodStart && approvedDate <= payPeriodEnd;
  });

  // Sum commission amounts by employee
  for (const commission of matchedCommissions) {
    const currentCommission = employeeCommissions.get(commission.salesId) || 0;
    employeeCommissions.set(
      commission.salesId, 
      currentCommission + Number(commission.commissionAmount || 0)
    );
  }

  return employeeCommissions;
}

/**
 * Calculate labor bonuses for captains across all logs in a pay period
 */
export function calculateLaborBonusesTotals(
  approvedLogs: DailyLog[]
): Map<string, number> {
  const employeeBonuses = new Map<string, number>();

  for (const log of approvedLogs) {
    const captain = log.captain;
    
    // Only captains are eligible for labor bonuses
    if (!captain.roles.includes('captain')) {
      continue;
    }

    // Calculate bonuses for junk section
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    if (junkJobs.length > 0) {
      const junkRevenue = junkJobs.reduce((sum, job) => sum + Number(job.revenue), 0);
      const junkHours = log.hours.filter(hour => hour.department === 'junk');
      
      if (junkHours.length > 0) {
        const totalJunkLaborCost = junkHours.reduce((sum, hour) => {
          const rate = calculateHourlyWage(hour.employee, 'junk', hour.isCoCaptain);
          return sum + (Number(hour.hours) * rate);
        }, 0);

        const actualPercentage = junkRevenue > 0 ? totalJunkLaborCost / junkRevenue : 0;
        const goalPercentage = Number(captain.junkBonusGoal);

        const bonus = calculateLaborBonus(
          captain,
          actualPercentage,
          goalPercentage,
          junkRevenue
        );

        if (bonus > 0) {
          const currentBonus = employeeBonuses.get(captain.id) || 0;
          employeeBonuses.set(captain.id, currentBonus + bonus);
        }
      }
    }

    // Calculate bonuses for move section
    const moveJobs = log.jobs.filter(job => job.jobType === 'move');
    if (moveJobs.length > 0) {
      const moveRevenue = moveJobs.reduce((sum, job) => sum + Number(job.revenue), 0);
      const moveHours = log.hours.filter(hour => hour.department === 'move');
      
      if (moveHours.length > 0) {
        const totalMoveLaborCost = moveHours.reduce((sum, hour) => {
          const rate = calculateHourlyWage(hour.employee, 'move', hour.isCoCaptain);
          return sum + (Number(hour.hours) * rate);
        }, 0);

        const actualPercentage = moveRevenue > 0 ? totalMoveLaborCost / moveRevenue : 0;
        const goalPercentage = Number(captain.moveBonusGoal);

        const bonus = calculateLaborBonus(
          captain,
          actualPercentage,
          goalPercentage,
          moveRevenue
        );

        if (bonus > 0) {
          const currentBonus = employeeBonuses.get(captain.id) || 0;
          employeeBonuses.set(captain.id, currentBonus + bonus);
        }
      }
    }
  }

  return employeeBonuses;
}

/**
 * Convert salary amount to weekly equivalent based on frequency
 */
export function convertSalaryToWeekly(
  salaryAmount: number,
  frequency: SalaryFrequency
): number {
  switch (frequency) {
    case 'weekly':
      return salaryAmount;
    case 'bi-weekly':
      return salaryAmount / 2;
    case 'monthly':
      return salaryAmount / 4.33; // 52 weeks / 12 months
    default:
      return 0;
  }
}

/**
 * Apply salary rules to calculate final pay
 */
export function applySalaryRules(
  user: User,
  hourlyWages: number,
  tips: number,
  commission: number,
  bonuses: number
): PayrollBreakdown {
  const totalBeforeSalaryAdjustment = hourlyWages + tips + commission + bonuses;
  
  if (!user.salaryAmount || !user.salaryFrequency || !user.salaryType) {
    // No salary - use hourly wages + other compensation
    return {
      hourlyWages,
      salaryAmount: 0,
      salaryType: null,
      salaryFrequency: null,
      tips,
      commission,
      laborBonuses: bonuses,
      totalBeforeSalaryAdjustment,
      finalPay: totalBeforeSalaryAdjustment,
    };
  }

  const weeklySalaryAmount = convertSalaryToWeekly(Number(user.salaryAmount || 0), user.salaryFrequency);

  switch (user.salaryType) {
    case 'base':
      // Base salary replaces hourly wages entirely
      return {
        hourlyWages: 0, // Not paid hourly wages
        salaryAmount: weeklySalaryAmount,
        salaryType: user.salaryType,
        salaryFrequency: user.salaryFrequency,
        tips,
        commission,
        laborBonuses: bonuses,
        totalBeforeSalaryAdjustment,
        finalPay: weeklySalaryAmount + tips + commission + bonuses,
      };

    case 'guaranteed':
      // Guaranteed salary is minimum - whichever is higher
      const guaranteedPay = Math.max(totalBeforeSalaryAdjustment, weeklySalaryAmount);
      return {
        hourlyWages,
        salaryAmount: guaranteedPay > totalBeforeSalaryAdjustment ? weeklySalaryAmount : 0,
        salaryType: user.salaryType,
        salaryFrequency: user.salaryFrequency,
        tips,
        commission,
        laborBonuses: bonuses,
        totalBeforeSalaryAdjustment,
        finalPay: guaranteedPay,
      };

    case 'supplemental':
      // Supplemental salary is added on top of other earnings
      return {
        hourlyWages,
        salaryAmount: weeklySalaryAmount,
        salaryType: user.salaryType,
        salaryFrequency: user.salaryFrequency,
        tips,
        commission,
        laborBonuses: bonuses,
        totalBeforeSalaryAdjustment,
        finalPay: totalBeforeSalaryAdjustment + weeklySalaryAmount,
      };

    default:
      // Fallback to no salary
      return {
        hourlyWages,
        salaryAmount: 0,
        salaryType: null,
        salaryFrequency: null,
        tips,
        commission,
        laborBonuses: bonuses,
        totalBeforeSalaryAdjustment,
        finalPay: totalBeforeSalaryAdjustment,
      };
  }
}

/**
 * Calculate comprehensive payroll for all employees in a pay period
 */
export function calculatePayroll(
  users: User[],
  approvedLogs: DailyLog[],
  commissionEntries: CommissionEntry[],
  payPeriodStart: Date,
  payPeriodEnd: Date
): PayrollCalculation[] {
  // Filter logs to pay period
  const periodLogs = approvedLogs.filter(log => {
    if (!log.approvedAt) return false;
    const approvedDate = new Date(log.approvedAt);
    return approvedDate >= payPeriodStart && approvedDate <= payPeriodEnd;
  });

  // Calculate tip distribution
  const tipDistribution = calculateTipDistribution(periodLogs);

  // Calculate commission totals
  const commissionTotals = calculateCommissionTotals(
    commissionEntries,
    payPeriodStart,
    payPeriodEnd
  );

  // Calculate labor bonus totals
  const bonusTotals = calculateLaborBonusesTotals(periodLogs);

  // Calculate payroll for each user
  const payrollCalculations: PayrollCalculation[] = [];

  for (const user of users) {
    // Calculate total hours by department
    const hoursByDepartment: Record<Department, number> = {
      junk: 0,
      move: 0,
      zigma: 0,
      training: 0,
      estimating: 0,
      warehouse: 0,
      admin: 0,
    };

    let totalHours = 0;
    let hourlyWages = 0;

    // Sum up hours and calculate wages for this employee
    for (const log of periodLogs) {
      const employeeHours = log.hours.filter(hour => hour.employeeId === user.id);
      
      for (const hour of employeeHours) {
        const hoursValue = Number(hour.hours);
        hoursByDepartment[hour.department] += hoursValue;
        totalHours += hoursValue;

        // Calculate wages for this hour entry
        const rate = calculateHourlyWage(user, hour.department, hour.isCoCaptain);
        hourlyWages += hoursValue * rate;
      }
    }

    // Get other compensation components
    const tips = tipDistribution.get(user.id) || 0;
    const commission = commissionTotals.get(user.id) || 0;
    const bonuses = bonusTotals.get(user.id) || 0;

    // Apply salary rules to get final breakdown
    const breakdown = applySalaryRules(user, hourlyWages, tips, commission, bonuses);

    // Create payroll calculation
    const payrollCalculation: PayrollCalculation = {
      employeeId: user.id,
      employee: user,
      totalHours,
      hoursByDepartment,
      grossWages: breakdown.hourlyWages,
      tips: breakdown.tips,
      commission: breakdown.commission,
      bonuses: breakdown.laborBonuses,
      totalPay: breakdown.finalPay,
      breakdown,
    };

    payrollCalculations.push(payrollCalculation);
  }

  return payrollCalculations;
}

/**
 * Calculate enhanced payroll with detailed breakdowns
 */
export function calculateEnhancedPayroll(
  user: User,
  approvedLogs: DailyLog[],
  commissionEntries: CommissionEntry[],
  payPeriodStart: Date,
  payPeriodEnd: Date
): EnhancedPayrollCalculation {
  // Get basic payroll calculation
  const basicPayroll = calculatePayroll(
    [user],
    approvedLogs,
    commissionEntries,
    payPeriodStart,
    payPeriodEnd
  )[0];

  // Calculate enhanced breakdowns
  const departmentBreakdown = calculateEnhancedDepartmentBreakdown(user, approvedLogs);
  const dailyBreakdown = calculateEnhancedDailyBreakdown(user, approvedLogs);
  const tipsBreakdown = calculateEnhancedTipsBreakdown(user, approvedLogs);
  const rateSchedule = calculateRateSchedule(user);

  return {
    ...basicPayroll,
    departmentBreakdown,
    dailyBreakdown,
    tipsBreakdown,
    rateSchedule,
  };
}

/**
 * Calculate enhanced department breakdown
 */
function calculateEnhancedDepartmentBreakdown(
  user: User,
  approvedLogs: DailyLog[]
): { [key in Department]: { hours: number; rate: number; grossPay: number; percentage: number } } {
  const breakdown: { [key in Department]: { hours: number; rate: number; grossPay: number; percentage: number } } = {
    junk: { hours: 0, rate: 0, grossPay: 0, percentage: 0 },
    move: { hours: 0, rate: 0, grossPay: 0, percentage: 0 },
    zigma: { hours: 0, rate: 0, grossPay: 0, percentage: 0 },
    training: { hours: 0, rate: 0, grossPay: 0, percentage: 0 },
    estimating: { hours: 0, rate: 0, grossPay: 0, percentage: 0 },
    warehouse: { hours: 0, rate: 0, grossPay: 0, percentage: 0 },
    admin: { hours: 0, rate: 0, grossPay: 0, percentage: 0 },
  };

  let totalHours = 0;

  // Calculate hours and pay by department
  for (const log of approvedLogs) {
    const userHours = log.hours.filter(hour => hour.employeeId === user.id);
    
    for (const hour of userHours) {
      const department = hour.department as Department;
      const rate = calculateHourlyWage(user, department, hour.isCoCaptain);
      const pay = hour.hours * rate;

      const hoursValue = Number(hour.hours);
      breakdown[department].hours += hoursValue;
      breakdown[department].grossPay += pay;
      breakdown[department].rate = rate; // Use the rate (could be captain or wingman)
      totalHours += hoursValue;
    }
  }

  // Calculate percentages
  for (const department of Object.keys(breakdown) as Department[]) {
    if (totalHours > 0) {
      breakdown[department].percentage = (breakdown[department].hours / totalHours) * 100;
    }
  }

  return breakdown;
}

/**
 * Calculate enhanced daily breakdown
 */
function calculateEnhancedDailyBreakdown(
  user: User,
  approvedLogs: DailyLog[]
): { [date: string]: { departments: { [key in Department]: number }; tips: number; totalHours: number } } {
  const dailyBreakdown: { [date: string]: { departments: { [key in Department]: number }; tips: number; totalHours: number } } = {};

  for (const log of approvedLogs) {
    const userHours = log.hours.filter(hour => hour.employeeId === user.id);
    
    if (userHours.length === 0) continue;

    const dateKey = log.logDate.toISOString().split('T')[0];
    
    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = {
        departments: {
          junk: 0,
          move: 0,
          zigma: 0,
          training: 0,
          estimating: 0,
          warehouse: 0,
          admin: 0,
        },
        tips: 0,
        totalHours: 0,
      };
    }

    // Add hours by department
    for (const hour of userHours) {
      const department = hour.department as Department;
      const hoursValue = Number(hour.hours);
      dailyBreakdown[dateKey].departments[department] += hoursValue;
      dailyBreakdown[dateKey].totalHours += hoursValue;
    }

    // Calculate tips for this day
    const dailyTips = calculateUserDailyTips(user.id, log);
    dailyBreakdown[dateKey].tips += dailyTips;
  }

  return dailyBreakdown;
}

/**
 * Calculate enhanced tips breakdown
 */
function calculateEnhancedTipsBreakdown(
  user: User,
  approvedLogs: DailyLog[]
): TipEntry[] {
  const tipEntries: TipEntry[] = [];

  for (const log of approvedLogs) {
    const userHours = log.hours.filter(hour => hour.employeeId === user.id);
    
    if (userHours.length === 0) continue;

    // Process junk jobs
    const junkHours = userHours.filter(hour => hour.department === 'junk');
    if (junkHours.length > 0) {
      const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
      const junkTeamSize = [...new Set(log.hours
        .filter(hour => hour.department === 'junk')
        .map(hour => hour.employeeId))].length;

      for (const job of junkJobs) {
        const jobTips = Number(job.tips);
        if (jobTips > 0) {
          tipEntries.push({
            date: log.logDate,
            jobId: job.jobId,
            clientName: job.clientName,
            totalJobTips: jobTips,
            teamMembers: junkTeamSize,
            myShare: jobTips / junkTeamSize,
            jobType: 'junk',
            logId: log.id,
          });
        }
      }
    }

    // Process move jobs
    const moveHours = userHours.filter(hour => hour.department === 'move');
    if (moveHours.length > 0) {
      const moveJobs = log.jobs.filter(job => job.jobType === 'move');
      const moveTeamSize = [...new Set(log.hours
        .filter(hour => hour.department === 'move')
        .map(hour => hour.employeeId))].length;

      for (const job of moveJobs) {
        const jobTips = Number(job.tips);
        if (jobTips > 0) {
          tipEntries.push({
            date: log.logDate,
            jobId: job.jobId,
            clientName: job.clientName,
            totalJobTips: jobTips,
            teamMembers: moveTeamSize,
            myShare: jobTips / moveTeamSize,
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
 * Calculate rate schedule for a user
 */
function calculateRateSchedule(user: User): {
  [key in Department]: {
    captainRate?: number;
    wingmanRate?: number;
    currentRate: number;
  };
} {
  const departments: Department[] = ['junk', 'move', 'zigma', 'training', 'estimating', 'warehouse', 'admin'];
  const rateSchedule: {
    [key in Department]: {
      captainRate?: number;
      wingmanRate?: number;
      currentRate: number;
    };
  } = {} as {
    [key in Department]: {
      captainRate?: number;
      wingmanRate?: number;
      currentRate: number;
    };
  };

  for (const department of departments) {
    const schedule: {
      captainRate?: number;
      wingmanRate?: number;
      currentRate: number;
    } = {
      currentRate: calculateHourlyWage(user, department, false),
    };

    // Add captain/wingman rates for departments that have them
    if (department === 'junk') {
      if (user.rateJunkCaptain) schedule.captainRate = user.rateJunkCaptain;
      if (user.rateJunkWingman) schedule.wingmanRate = user.rateJunkWingman;
    } else if (department === 'move') {
      if (user.rateMoveCaptain) schedule.captainRate = user.rateMoveCaptain;
      if (user.rateMoveWingman) schedule.wingmanRate = user.rateMoveWingman;
    }

    rateSchedule[department] = schedule;
  }

  return rateSchedule;
}

/**
 * Calculate daily tips for a specific user from a log
 */
function calculateUserDailyTips(userId: string, log: DailyLog): number {
  const userHours = log.hours.filter(hour => hour.employeeId === userId);
  
  if (userHours.length === 0) return 0;

  let totalTips = 0;

  // Calculate tips from junk section
  const junkHours = userHours.filter(hour => hour.department === 'junk');
  if (junkHours.length > 0) {
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    const junkTeamSize = [...new Set(log.hours
      .filter(hour => hour.department === 'junk')
      .map(hour => hour.employeeId))].length;
    
    const junkTips = junkJobs.reduce((sum, job) => sum + Number(job.tips), 0);
    if (junkTeamSize > 0) {
      totalTips += junkTips / junkTeamSize;
    }
  }

  // Calculate tips from move section
  const moveHours = userHours.filter(hour => hour.department === 'move');
  if (moveHours.length > 0) {
    const moveJobs = log.jobs.filter(job => job.jobType === 'move');
    const moveTeamSize = [...new Set(log.hours
      .filter(hour => hour.department === 'move')
      .map(hour => hour.employeeId))].length;
    
    const moveTips = moveJobs.reduce((sum, job) => sum + Number(job.tips), 0);
    if (moveTeamSize > 0) {
      totalTips += moveTips / moveTeamSize;
    }
  }

  return totalTips;
}

/**
 * Calculate performance metrics for a captain across all their logs
 */
export function calculateCaptainPerformanceMetrics(
  captain: User,
  approvedLogs: DailyLog[],
  filters?: PerformanceFilters
): CaptainPerformanceData {
  // Filter logs for this captain and date range
  let captainLogs = approvedLogs.filter(log => log.captainId === captain.id);
  
  if (filters?.startDate) {
    captainLogs = captainLogs.filter(log => log.logDate >= filters.startDate!);
  }
  
  if (filters?.endDate) {
    captainLogs = captainLogs.filter(log => log.logDate <= filters.endDate!);
  }

  // Calculate junk metrics
  const junkMetrics = calculateJunkPerformanceMetrics(captain, captainLogs);
  
  // Calculate move metrics
  const moveMetrics = calculateMovePerformanceMetrics(captain, captainLogs);

  return {
    captainId: captain.id,
    captainName: captain.fullName,
    junkMetrics,
    moveMetrics,
  };
}

/**
 * Calculate junk-specific performance metrics for a captain
 */
export function calculateJunkPerformanceMetrics(
  captain: User,
  captainLogs: DailyLog[]
): JunkPerformanceMetrics {
  let totalRevenue = 0;
  let totalDisposalCost = 0;
  let totalLaborCost = 0;
  let jobCount = 0;

  for (const log of captainLogs) {
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    const junkHours = log.hours.filter(hour => hour.department === 'junk');

    // Sum up job metrics
    for (const job of junkJobs) {
      totalRevenue += Number(job.revenue);
      totalDisposalCost += Number(job.disposalCost || 0);
      jobCount++;
    }

    // Calculate labor cost for junk section
    for (const hour of junkHours) {
      const rate = calculateHourlyWage(hour.employee, 'junk', hour.isCoCaptain);
      totalLaborCost += Number(hour.hours) * rate;
    }
  }

  const averageJobSize = jobCount > 0 ? totalRevenue / jobCount : 0;
  const laborPercentage = totalRevenue > 0 ? totalLaborCost / totalRevenue : 0;
  const disposalPercentage = totalRevenue > 0 ? totalDisposalCost / totalRevenue : 0;

  return {
    jobCount,
    totalRevenue,
    averageJobSize,
    laborPercentage,
    disposalPercentage,
  };
}

/**
 * Calculate move-specific performance metrics for a captain
 */
export function calculateMovePerformanceMetrics(
  captain: User,
  captainLogs: DailyLog[]
): MovePerformanceMetrics {
  let totalRevenue = 0;
  let totalLaborCost = 0;
  let totalUpsellRevenue = 0;
  let totalValuationRevenue = 0;
  let totalJunkOnMoveRevenue = 0;
  let totalMaterialsRevenue = 0;
  let jobCount = 0;

  for (const log of captainLogs) {
    const moveJobs = log.jobs.filter(job => job.jobType === 'move');
    const moveHours = log.hours.filter(hour => hour.department === 'move');

    // Sum up job metrics
    for (const job of moveJobs) {
      const jobRevenue = Number(job.revenue);
      const valuationRevenue = Number(job.valuation || 0);
      const junkOnMoveRevenue = Number(job.junkOnMove || 0);
      const materialsRevenue = Number(job.materials || 0);
      
      // Upsell revenue is calculated as total revenue minus base components
      const baseRevenue = valuationRevenue + junkOnMoveRevenue + materialsRevenue;
      const upsellRevenue = Math.max(0, jobRevenue - baseRevenue);

      totalRevenue += jobRevenue;
      totalUpsellRevenue += upsellRevenue;
      totalValuationRevenue += valuationRevenue;
      totalJunkOnMoveRevenue += junkOnMoveRevenue;
      totalMaterialsRevenue += materialsRevenue;
      jobCount++;
    }

    // Calculate labor cost for move section
    for (const hour of moveHours) {
      const rate = calculateHourlyWage(hour.employee, 'move', hour.isCoCaptain);
      totalLaborCost += Number(hour.hours) * rate;
    }
  }

  const averageJobSize = jobCount > 0 ? totalRevenue / jobCount : 0;
  const laborPercentage = totalRevenue > 0 ? totalLaborCost / totalRevenue : 0;
  const upsellPercentage = totalRevenue > 0 ? totalUpsellRevenue / totalRevenue : 0;
  const valuationPercentage = totalRevenue > 0 ? totalValuationRevenue / totalRevenue : 0;
  const junkOnMovePercentage = totalRevenue > 0 ? totalJunkOnMoveRevenue / totalRevenue : 0;
  const materialsPercentage = totalRevenue > 0 ? totalMaterialsRevenue / totalRevenue : 0;

  return {
    jobCount,
    totalRevenue,
    averageJobSize,
    laborPercentage,
    upsellRevenue: totalUpsellRevenue,
    upsellPercentage,
    valuationRevenue: totalValuationRevenue,
    valuationPercentage,
    junkOnMoveRevenue: totalJunkOnMoveRevenue,
    junkOnMovePercentage,
    materialsRevenue: totalMaterialsRevenue,
    materialsPercentage,
  };
}

// Performance calculation cache
const performanceCache = new Map<string, CaptainPerformanceData>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key for performance calculations
 */
function generatePerformanceCacheKey(
  captainId: string,
  logIds: string[],
  filters?: PerformanceFilters
): string {
  return JSON.stringify({
    captainId,
    logIds: logIds.sort(),
    filters: {
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString(),
      includeJunk: filters?.includeJunk,
      includeMove: filters?.includeMove,
    },
  });
}

/**
 * Calculate performance metrics for all captains with caching
 */
export function calculateAllCaptainsPerformance(
  users: User[],
  approvedLogs: DailyLog[],
  filters?: PerformanceFilters
): CaptainPerformanceData[] {
  // Filter to only captains
  const captains = users.filter(user => user.roles.includes('captain'));
  
  const results: CaptainPerformanceData[] = [];
  
  for (const captain of captains) {
    // Get logs for this captain
    const captainLogs = approvedLogs.filter(log => log.captainId === captain.id);
    const logIds = captainLogs.map(log => log.id);
    
    // Generate cache key
    const cacheKey = generatePerformanceCacheKey(captain.id, logIds, filters);
    
    // Check cache first
    const cached = performanceCache.get(cacheKey);
    if (cached) {
      results.push(cached);
      continue;
    }
    
    // Calculate performance metrics
    const performance = calculateCaptainPerformanceMetrics(captain, captainLogs, filters);
    
    // Cache the result
    performanceCache.set(cacheKey, performance);
    
    results.push(performance);
  }
  
  // Clean up old cache entries (keep only last 100 entries)
  if (performanceCache.size > 100) {
    const entries = Array.from(performanceCache.entries());
    const toDelete = entries.slice(0, entries.length - 100);
    toDelete.forEach(([key]) => performanceCache.delete(key));
  }
  
  // Sort by total revenue (descending)
  return results.sort((a, b) => {
    const totalA = a.junkMetrics.totalRevenue + a.moveMetrics.totalRevenue;
    const totalB = b.junkMetrics.totalRevenue + b.moveMetrics.totalRevenue;
    return totalB - totalA;
  });
}

/**
 * Calculate performance metrics for all captains (legacy function name)
 */
export function calculateAllCaptainsPerformanceOld(
  users: User[],
  approvedLogs: DailyLog[],
  filters?: PerformanceFilters
): CaptainPerformanceData[] {
  // Filter to only captains
  const captains = users.filter(user => user.roles.includes('captain'));
  
  // Filter by captain IDs if specified
  const filteredCaptains = filters?.captainIds 
    ? captains.filter(captain => filters.captainIds!.includes(captain.id))
    : captains;

  return filteredCaptains.map(captain => 
    calculateCaptainPerformanceMetrics(captain, approvedLogs, filters)
  );
}

/**
 * Calculate disposal percentage for a specific captain and date range
 */
export function calculateDisposalPercentage(
  captain: User,
  approvedLogs: DailyLog[],
  startDate?: Date,
  endDate?: Date
): number {
  let captainLogs = approvedLogs.filter(log => log.captainId === captain.id);
  
  if (startDate) {
    captainLogs = captainLogs.filter(log => log.logDate >= startDate);
  }
  
  if (endDate) {
    captainLogs = captainLogs.filter(log => log.logDate <= endDate);
  }

  let totalRevenue = 0;
  let totalDisposalCost = 0;

  for (const log of captainLogs) {
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    
    for (const job of junkJobs) {
      totalRevenue += Number(job.revenue);
      totalDisposalCost += Number(job.disposalCost || 0);
    }
  }

  return totalRevenue > 0 ? totalDisposalCost / totalRevenue : 0;
}

/**
 * Calculate average job size for a captain by job type
 */
export function calculateAverageJobSize(
  captain: User,
  approvedLogs: DailyLog[],
  jobType: 'junk' | 'move',
  startDate?: Date,
  endDate?: Date
): number {
  let captainLogs = approvedLogs.filter(log => log.captainId === captain.id);
  
  if (startDate) {
    captainLogs = captainLogs.filter(log => log.logDate >= startDate);
  }
  
  if (endDate) {
    captainLogs = captainLogs.filter(log => log.logDate <= endDate);
  }

  let totalRevenue = 0;
  let jobCount = 0;

  for (const log of captainLogs) {
    const jobs = log.jobs.filter(job => job.jobType === jobType);
    
    for (const job of jobs) {
      totalRevenue += Number(job.revenue);
      jobCount++;
    }
  }

  return jobCount > 0 ? totalRevenue / jobCount : 0;
}

/**
 * Calculate captain labor percentage for a specific job type and date range
 */
export function calculateCaptainLaborPercentage(
  captain: User,
  approvedLogs: DailyLog[],
  jobType: 'junk' | 'move',
  startDate?: Date,
  endDate?: Date
): number {
  let captainLogs = approvedLogs.filter(log => log.captainId === captain.id);
  
  if (startDate) {
    captainLogs = captainLogs.filter(log => log.logDate >= startDate);
  }
  
  if (endDate) {
    captainLogs = captainLogs.filter(log => log.logDate <= endDate);
  }

  let totalRevenue = 0;
  let totalLaborCost = 0;

  for (const log of captainLogs) {
    const jobs = log.jobs.filter(job => job.jobType === jobType);
    const hours = log.hours.filter(hour => hour.department === jobType);

    // Sum revenue for this job type
    for (const job of jobs) {
      totalRevenue += Number(job.revenue);
    }

    // Sum labor cost for this job type
    for (const hour of hours) {
      const rate = calculateHourlyWage(hour.employee, jobType, hour.isCoCaptain);
      totalLaborCost += Number(hour.hours) * rate;
    }
  }

  return totalRevenue > 0 ? totalLaborCost / totalRevenue : 0;
}
