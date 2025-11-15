/**
 * Utility functions for handling data serialization between server and client components
 * Ensures Prisma Decimal objects and other non-serializable objects are properly converted
 */

import type { Decimal } from '@prisma/client/runtime/library';

// Type for decimal values that works in both environments
type DecimalValue =
  | Decimal // Prisma Decimal type
  | { toString(): string }
  | number
  | string
  | null
  | undefined;

/**
 * Convert Prisma Decimals to JavaScript numbers
 */
export function decimalToNumber(decimal: DecimalValue): number {
  if (!decimal) return 0;
  return Number(decimal);
}

/**
 * Convert a JavaScript number to a Prisma Decimal
 */
export function numberToDecimal(
  num: number | null | undefined
): Decimal | null {
  if (num === null || num === undefined) return null;
  return num as unknown as Decimal;
}

/**
 * Properly serialize objects to be safe for client components
 */
export function safeSerialize(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => safeSerialize(item));
  }

  const serialized: any = {};
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'function' || typeof value === 'symbol') {
      continue;
    }

    if (value && typeof value === 'object') {
      serialized[key] = safeSerialize(value);
    } else if (typeof value === 'bigint') {
      serialized[key] = value.toString();
    } else {
      serialized[key] = value;
    }
  }

  return serialized;
}

/**
 * Convert Prisma User objects to client-safe objects
 */
export function serializeUser(user: any): any {
  if (!user || typeof user !== 'object') return {};

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
    rateJunkCaptain: decimalToNumber(user.rateJunkCaptain),
    rateJunkWingman: decimalToNumber(user.rateJunkWingman),
    rateMoveCaptain: decimalToNumber(user.rateMoveCaptain),
    rateMoveWingman: decimalToNumber(user.rateMoveWingman),
  };
}
