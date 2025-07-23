// Application constants and enums

export const COLLEGE_HUNKS_COLORS = {
  GREEN: '#026937',
  ORANGE: '#ea7200',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CAPTAIN: 'captain',
  SALES: 'sales',
  WINGMAN: 'wingman',
} as const;

export const JOB_TYPES = {
  JUNK: 'junk',
  MOVE: 'move',
} as const;

export const LOG_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
} as const;

export const COMMISSION_STATUS = {
  PENDING: 'pending',
  MATCHED: 'matched',
  APPROVED: 'approved',
} as const;

export const PAY_PERIOD_STATUS = {
  OPEN: 'open',
  LOCKED: 'locked',
  CLOSED: 'closed',
} as const;

export const DEPARTMENTS = {
  JUNK: 'junk',
  MOVE: 'move',
  ZIGMA: 'zigma',
  TRAINING: 'training',
  ESTIMATING: 'estimating',
  WAREHOUSE: 'warehouse',
  ADMIN: 'admin',
} as const;

export const SALARY_TYPES = {
  BASE: 'base',
  GUARANTEED: 'guaranteed',
  SUPPLEMENTAL: 'supplemental',
} as const;

export const SALARY_FREQUENCIES = {
  WEEKLY: 'weekly',
  BI_WEEKLY: 'bi-weekly',
  MONTHLY: 'monthly',
} as const;

// Labor cost percentage goals
export const LABOR_GOALS = {
  JUNK: 0.14, // 14%
  MOVE: 0.24, // 24%
} as const;