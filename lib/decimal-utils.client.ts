/**
 * Client-safe utility functions for handling decimal conversions
 *
 * This module provides decimal conversion utilities that work in the browser
 * without importing Prisma client dependencies.
 */

// Type for decimal values from Prisma
type DecimalValue = { toString(): string } | number | string | null | undefined;

/**
 * Convert a decimal value to a JavaScript number
 * Returns 0 if the value is null or undefined
 */
export function decimalToNumber(decimal: DecimalValue): number {
  if (!decimal) return 0;
  return Number(decimal);
}

/**
 * Convert a JavaScript number to a decimal-like value
 * Returns null if the value is null or undefined
 */
export function numberToDecimal(num: number | null | undefined): number | null {
  if (num === null || num === undefined) return null;
  return num;
}

/**
 * Convert an optional decimal to an optional JavaScript number
 */
export function optionalDecimalToNumber(
  decimal: DecimalValue
): number | undefined {
  if (!decimal) return undefined;
  return Number(decimal);
}

/**
 * Convert an optional JavaScript number to an optional decimal-like value
 */
export function optionalNumberToDecimal(
  num: number | null | undefined
): number | null {
  if (num === null || num === undefined) return null;
  return num;
}

/**
 * Convert a User model with decimal fields to numbers (client-safe)
 */
export function convertUserDecimalFields<
  T extends {
    rateJunkCaptain?: DecimalValue;
    rateJunkWingman?: DecimalValue;
    rateMoveCaptain?: DecimalValue;
    rateMoveWingman?: DecimalValue;
    rateZigma?: DecimalValue;
    rateTraining?: DecimalValue;
    rateEstimating?: DecimalValue;
    rateWarehouse?: DecimalValue;
    rateAdmin?: DecimalValue;
    salaryAmount?: DecimalValue;
    commissionRate?: DecimalValue;
    junkBonusGoal: DecimalValue;
    moveBonusGoal: DecimalValue;
  },
>(
  user: T
): Omit<
  T,
  | 'rateJunkCaptain'
  | 'rateJunkWingman'
  | 'rateMoveCaptain'
  | 'rateMoveWingman'
  | 'rateZigma'
  | 'rateTraining'
  | 'rateEstimating'
  | 'rateWarehouse'
  | 'rateAdmin'
  | 'salaryAmount'
  | 'commissionRate'
  | 'junkBonusGoal'
  | 'moveBonusGoal'
> & {
  rateJunkCaptain?: number;
  rateJunkWingman?: number;
  rateMoveCaptain?: number;
  rateMoveWingman?: number;
  rateZigma?: number;
  rateTraining?: number;
  rateEstimating?: number;
  rateWarehouse?: number;
  rateAdmin?: number;
  salaryAmount?: number;
  commissionRate?: number;
  junkBonusGoal: number;
  moveBonusGoal: number;
} {
  return {
    ...user,
    rateJunkCaptain: optionalDecimalToNumber(user.rateJunkCaptain),
    rateJunkWingman: optionalDecimalToNumber(user.rateJunkWingman),
    rateMoveCaptain: optionalDecimalToNumber(user.rateMoveCaptain),
    rateMoveWingman: optionalDecimalToNumber(user.rateMoveWingman),
    rateZigma: optionalDecimalToNumber(user.rateZigma),
    rateTraining: optionalDecimalToNumber(user.rateTraining),
    rateEstimating: optionalDecimalToNumber(user.rateEstimating),
    rateWarehouse: optionalDecimalToNumber(user.rateWarehouse),
    rateAdmin: optionalDecimalToNumber(user.rateAdmin),
    salaryAmount: optionalDecimalToNumber(user.salaryAmount),
    commissionRate: optionalDecimalToNumber(user.commissionRate),
    junkBonusGoal: decimalToNumber(user.junkBonusGoal),
    moveBonusGoal: decimalToNumber(user.moveBonusGoal),
  };
}

/**
 * Convert a LogJob model with decimal fields to numbers (client-safe)
 */
export function convertLogJobDecimalFields<
  T extends {
    revenue: DecimalValue;
    tips: DecimalValue;
    junkOnMove?: DecimalValue;
    valuation?: DecimalValue;
    materials?: DecimalValue;
    disposalCost?: DecimalValue;
  },
>(
  job: T
): Omit<
  T,
  'revenue' | 'tips' | 'junkOnMove' | 'valuation' | 'materials' | 'disposalCost'
> & {
  revenue: number;
  tips: number;
  junkOnMove?: number;
  valuation?: number;
  materials?: number;
  disposalCost?: number;
} {
  return {
    ...job,
    revenue: decimalToNumber(job.revenue),
    tips: decimalToNumber(job.tips),
    junkOnMove: optionalDecimalToNumber(job.junkOnMove),
    valuation: optionalDecimalToNumber(job.valuation),
    materials: optionalDecimalToNumber(job.materials),
    disposalCost: optionalDecimalToNumber(job.disposalCost),
  };
}

/**
 * Convert a LogHour model with decimal fields to numbers (client-safe)
 */
export function convertLogHourDecimalFields<
  T extends {
    hours: DecimalValue;
  },
>(
  hour: T
): Omit<T, 'hours'> & {
  hours: number;
} {
  return {
    ...hour,
    hours: decimalToNumber(hour.hours),
  };
}

/**
 * Convert a CommissionEntry model with decimal fields to numbers (client-safe)
 */
export function convertCommissionDecimalFields<
  T extends {
    estimatedRevenue: DecimalValue;
    actualRevenue?: DecimalValue;
    commissionAmount?: DecimalValue;
  },
>(
  commission: T
): Omit<T, 'estimatedRevenue' | 'actualRevenue' | 'commissionAmount'> & {
  estimatedRevenue: number;
  actualRevenue: number | null;
  commissionAmount: number | null;
} {
  return {
    ...commission,
    estimatedRevenue: decimalToNumber(commission.estimatedRevenue),
    actualRevenue: commission.actualRevenue
      ? decimalToNumber(commission.actualRevenue)
      : null,
    commissionAmount: commission.commissionAmount
      ? decimalToNumber(commission.commissionAmount)
      : null,
  };
}
