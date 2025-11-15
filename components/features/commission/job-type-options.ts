import type { CommissionJobType } from '@/types';
import { normalizeCommissionJobType } from '@/lib/commission-job-types';

interface JobTypeOption {
  value: CommissionJobType;
  label: string;
  description: string;
  accentClass: string;
  indicatorClass: string;
}

export const COMMISSION_JOB_TYPE_OPTIONS: JobTypeOption[] = [
  {
    value: 'move',
    label: 'Full-Service Move',
    description: 'Truck + crew provided by College Hunks',
    accentClass: 'border-hunks-green/40 text-hunks-green bg-hunks-green/10',
    indicatorClass: 'bg-hunks-green',
  },
  {
    value: 'moveLabor',
    label: 'Move Labor Only',
    description: 'Labor-only move (no truck)',
    accentClass: 'border-emerald-400/60 text-emerald-700 bg-emerald-100',
    indicatorClass: 'bg-emerald-500',
  },
  {
    value: 'junkRemoval',
    label: 'Junk Removal',
    description: 'Full junk removal booking',
    accentClass: 'border-hunks-orange/40 text-hunks-orange bg-hunks-orange/10',
    indicatorClass: 'bg-hunks-orange',
  },
  {
    value: 'generalLabor',
    label: 'General Labor / Other',
    description: 'Packing, staging, or other billable labor',
    accentClass: 'border-amber-400/60 text-amber-700 bg-amber-50',
    indicatorClass: 'bg-amber-400',
  },
];

export function getCommissionJobTypeMeta(value: CommissionJobType) {
  return (
    COMMISSION_JOB_TYPE_OPTIONS.find((option) => option.value === value) ||
    COMMISSION_JOB_TYPE_OPTIONS[0]
  );
}

export { normalizeCommissionJobType };
