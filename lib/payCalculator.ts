// Payroll and bonus calculation logic
import type { User, LogHour, Department, DailyLog, LogJob, CommissionEntry, SalaryType, SalaryFrequency } from '@/types';
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
        ? (user.rateJunkCaptain ?? 0)
        : (user.rateJunkWingman ?? 0);
    case 'move':
      return usesCaptainRate
        ? (user.rateMoveCaptain ?? 0)
        : (user.rateMoveWingman ?? 0);
    case 'zigma':
      return user.rateZigma ?? 0;
    case 'training':
      return user.rateTraining ?? 0;
    case 'estimating':
      return user.rateEstimating ?? 0;
    case 'warehouse':
      return user.rateWarehouse ?? 0;
    case 'admin':
      return user.rateAdmin ?? 0;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function calculateLaborBonus(
  captain: User,
  actualPercentage: number,
  goalPercentage: number,
  totalRevenue: number,
  _jobType: 'junk' | 'move'
): number {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = _jobType; // Acknowledge unused parameter

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
      const totalJunkTips = junkJobs.reduce((sum, job) => sum + job.tips, 0);
      const junkEmployees = [...new Set(junkHours.map(hour => hour.employeeId))];
      const tipsPerEmployee = totalJunkTips / junkEmployees.length;

      for (const employeeId of junkEmployees) {
        const currentTips = employeeTips.get(employeeId) || 0;
        employeeTips.set(employeeId, currentTips + tipsPerEmployee);
      }
    }

    // Calculate tips for move section
    if (moveJobs.length > 0 && moveHours.length > 0) {
      const totalMoveTips = moveJobs.reduce((sum, job) => sum + job.tips, 0);
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
      const totalOtherTips = otherJobs.reduce((sum, job) => sum + job.tips, 0);
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
      currentCommission + (commission.commissionAmount || 0)
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
      const junkRevenue = junkJobs.reduce((sum, job) => sum + job.revenue, 0);
      const junkHours = log.hours.filter(hour => hour.department === 'junk');
      
      if (junkHours.length > 0) {
        const totalJunkLaborCost = junkHours.reduce((sum, hour) => {
          const rate = calculateHourlyWage(hour.employee, 'junk', hour.isCoCaptain);
          return sum + (hour.hours * rate);
        }, 0);

        const actualPercentage = junkRevenue > 0 ? totalJunkLaborCost / junkRevenue : 0;
        const goalPercentage = captain.junkBonusGoal;

        const bonus = calculateLaborBonus(
          captain,
          actualPercentage,
          goalPercentage,
          junkRevenue,
          'junk'
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
      const moveRevenue = moveJobs.reduce((sum, job) => sum + job.revenue, 0);
      const moveHours = log.hours.filter(hour => hour.department === 'move');
      
      if (moveHours.length > 0) {
        const totalMoveLaborCost = moveHours.reduce((sum, hour) => {
          const rate = calculateHourlyWage(hour.employee, 'move', hour.isCoCaptain);
          return sum + (hour.hours * rate);
        }, 0);

        const actualPercentage = moveRevenue > 0 ? totalMoveLaborCost / moveRevenue : 0;
        const goalPercentage = captain.moveBonusGoal;

        const bonus = calculateLaborBonus(
          captain,
          actualPercentage,
          goalPercentage,
          moveRevenue,
          'move'
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

  const weeklySalaryAmount = convertSalaryToWeekly(user.salaryAmount, user.salaryFrequency);

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
        hoursByDepartment[hour.department] += hour.hours;
        totalHours += hour.hours;

        // Calculate wages for this hour entry
        const rate = calculateHourlyWage(user, hour.department, hour.isCoCaptain);
        hourlyWages += hour.hours * rate;
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
