/**
 * Utility functions for handling Prisma Decimal type conversions
 *
 * This module provides consistent conversion between Prisma Decimal types
 * and JavaScript numbers for calculations and display.
 */

import { Decimal } from '@prisma/client/runtime/library';

/**
 * Convert a Prisma Decimal to a JavaScript number
 * Returns 0 if the value is null or undefined
 */
export function decimalToNumber(decimal: Decimal | null | undefined): number {
  if (!decimal) return 0;
  return Number(decimal);
}

/**
 * Convert a JavaScript number to a Prisma Decimal
 * Returns null if the value is null or undefined
 */
export function numberToDecimal(
  num: number | null | undefined
): Decimal | null {
  if (num === null || num === undefined) return null;
  return new Decimal(num);
}

/**
 * Convert an optional Prisma Decimal to an optional JavaScript number
 */
export function optionalDecimalToNumber(
  decimal: Decimal | null | undefined
): number | undefined {
  if (!decimal) return undefined;
  return Number(decimal);
}

/**
 * Convert an optional JavaScript number to an optional Prisma Decimal
 */
export function optionalNumberToDecimal(
  num: number | null | undefined
): Decimal | null {
  if (num === null || num === undefined) return null;
  return new Decimal(num);
}

/**
 * Type for converting Prisma model with Decimal fields to JavaScript numbers
 */
export type DecimalToNumber<T> = {
  [K in keyof T]: T[K] extends Decimal | null | undefined
    ? T[K] extends Decimal
      ? number
      : T[K] extends Decimal | null
        ? number | null
        : number | undefined
    : T[K];
};

/**
 * Convert a User model with Decimal fields to numbers
 */
export function convertUserDecimalFields<
  T extends {
    rateJunkCaptain?: Decimal | null;
    rateJunkWingman?: Decimal | null;
    rateMoveCaptain?: Decimal | null;
    rateMoveWingman?: Decimal | null;
    rateZigma?: Decimal | null;
    rateTraining?: Decimal | null;
    rateEstimating?: Decimal | null;
    rateWarehouse?: Decimal | null;
    rateAdmin?: Decimal | null;
    salaryAmount?: Decimal | null;
    commissionRate?: Decimal | null;
    junkBonusGoal: Decimal;
    moveBonusGoal: Decimal;
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
 * Convert a LogJob model with Decimal fields to numbers
 */
export function convertLogJobDecimalFields<
  T extends {
    revenue: Decimal;
    tips: Decimal;
    junkOnMove?: Decimal | null;
    valuation?: Decimal | null;
    materials?: Decimal | null;
    disposalCost?: Decimal | null;
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
 * Convert a LogHour model with Decimal fields to numbers
 */
export function convertLogHourDecimalFields<
  T extends {
    hours: Decimal;
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
 * Convert a CommissionEntry model with Decimal fields to numbers
 */
export function convertCommissionDecimalFields<
  T extends {
    estimatedRevenue: Decimal;
    actualRevenue?: Decimal | null;
    commissionAmount?: Decimal | null;
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
