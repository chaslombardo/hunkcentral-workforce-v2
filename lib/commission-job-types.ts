import type { CommissionJobType } from '@/types';

export const COMMISSION_JOB_TYPES: CommissionJobType[] = [
  'move',
  'moveLabor',
  'junkRemoval',
  'generalLabor',
];

export function normalizeCommissionJobType(value: string): CommissionJobType {
  if (value === 'junk') {
    return 'junkRemoval';
  }
  if (value === 'move') {
    return 'move';
  }
  if (COMMISSION_JOB_TYPES.includes(value as CommissionJobType)) {
    return value as CommissionJobType;
  }
  return 'move';
}

export function commissionJobTypeToLogType(value: string): 'junk' | 'move' {
  const normalized = normalizeCommissionJobType(value);
  switch (normalized) {
    case 'junkRemoval':
      return 'junk';
    default:
      return 'move';
  }
}
