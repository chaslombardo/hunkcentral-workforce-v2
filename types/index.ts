// TypeScript type definitions

export type UserRole = 'admin' | 'manager' | 'captain' | 'sales' | 'wingman';

export type JobType = 'junk' | 'move';

export type LogStatus = 'draft' | 'submitted' | 'approved';

export type CommissionStatus = 'pending' | 'matched' | 'approved';

export type PayPeriodStatus = 'open' | 'locked' | 'closed';

export type Department =
  | 'junk'
  | 'move'
  | 'zigma'
  | 'training'
  | 'estimating'
  | 'warehouse'
  | 'admin';

export type SalaryType = 'base' | 'guaranteed' | 'supplemental';

export type SalaryFrequency = 'weekly' | 'bi-weekly' | 'monthly';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  // Department-specific hourly rates
  rateJunkCaptain?: number;
  rateJunkWingman?: number;
  rateMoveCaptain?: number;
  rateMoveWingman?: number;
  rateZigma?: number;
  rateTraining?: number;
  rateEstimating?: number;
  rateWarehouse?: number;
  rateAdmin?: number;
  // Salary settings
  salaryAmount?: number;
  salaryFrequency?: SalaryFrequency;
  salaryType?: SalaryType;
  // Commission and bonus settings
  commissionRate?: number;
  junkBonusGoal: number;
  moveBonusGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyLog {
  id: string;
  captainId: string;
  captain: User;
  logDate: Date;
  status: LogStatus;
  submittedAt?: Date;
  approvedAt?: Date;
  approvedById?: string;
  approvedBy?: User;
  createdById: string;
  createdBy: User;
  lastEditedById?: string;
  lastEditedBy?: User;
  createdAt: Date;
  updatedAt: Date;
  jobs: LogJob[];
  hours: LogHour[];
}

export interface LogJob {
  id: string;
  logId: string;
  log: DailyLog;
  jobType: JobType;
  jobId: string;
  clientName: string;
  revenue: number;
  tips: number;
  // Move-specific fields
  junkOnMove?: number;
  valuation?: number;
  materials?: number;
  // Junk-specific fields (section level)
  disposalCost?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogHour {
  id: string;
  logId: string;
  log: DailyLog;
  employeeId: string;
  employee: User;
  department: Department;
  hours: number;
  isCoCaptain: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommissionEntry {
  id: string;
  salesId: string;
  sales: User;
  jobId: string;
  clientName: string;
  jobType: JobType;
  targetDate: Date;
  estimatedRevenue: number;
  actualRevenue?: number;
  commissionAmount?: number;
  status: CommissionStatus;
  matchedLogId?: string;
  matchedLog?: DailyLog;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: PayPeriodStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: any;
  userId: string;
  user: User;
  dailyLogId?: string;
  dailyLog?: DailyLog;
  createdAt: Date;
}
