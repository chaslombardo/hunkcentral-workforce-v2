// Payroll and bonus calculation logic
import type { User, LogHour, Department } from '@/types';
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

// Placeholder functions - will be fully implemented in later tasks
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function calculatePayroll(
  _users: User[],
  _logHours: LogHour[],
  _payPeriodStart: Date,
  _payPeriodEnd: Date
): PayrollCalculation[] {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = [_users, _logHours, _payPeriodStart, _payPeriodEnd]; // Acknowledge unused parameters

  // TODO: Implement comprehensive payroll calculation
  return [];
}
