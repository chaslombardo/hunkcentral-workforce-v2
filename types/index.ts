// TypeScript type definitions
// Note: These types represent the application layer types with Decimal fields converted to numbers
// The database layer uses Prisma Decimal types which are converted using lib/decimal-utils.ts

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

export type DiscrepancyPriority = 'low' | 'medium' | 'high' | 'critical';

export type DiscrepancyCategory =
  | 'calculation'
  | 'data_integrity'
  | 'rate_issue'
  | 'hours_mismatch'
  | 'tips_error'
  | 'other';

export type DiscrepancySeverity = 'low' | 'medium' | 'high' | 'critical';

export type DiscrepancyStatus =
  | 'open'
  | 'investigating'
  | 'resolved'
  | 'dismissed';

export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  permissions?: string[]; // Granular permissions array
  // Department-specific hourly rates (converted from Prisma Decimal to number)
  rateJunkCaptain?: number;
  rateJunkWingman?: number;
  rateMoveCaptain?: number;
  rateMoveWingman?: number;
  rateZigma?: number;
  rateTraining?: number;
  rateEstimating?: number;
  rateWarehouse?: number;
  rateAdmin?: number;
  // Salary settings (converted from Prisma Decimal to number)
  salaryAmount?: number;
  salaryFrequency?: SalaryFrequency;
  salaryType?: SalaryType;
  // Commission and bonus settings (converted from Prisma Decimal to number)
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
  // Financial fields (converted from Prisma Decimal to number)
  revenue: number;
  tips: number;
  // Move-specific fields (converted from Prisma Decimal to number)
  junkOnMove?: number;
  valuation?: number;
  materials?: number;
  // Junk-specific fields (converted from Prisma Decimal to number)
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
  // Hours field (converted from Prisma Decimal to number)
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
  // Financial fields (converted from Prisma Decimal to number)
  estimatedRevenue: number;
  actualRevenue: number | null;
  commissionAmount: number | null;
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

export interface DiscrepancyReport {
  id: string;
  employeeId: string;
  employee: User;
  payPeriodId: string;
  payPeriod: PayPeriod;
  reportedById: string;
  reportedBy: User;
  priority: DiscrepancyPriority;
  category: DiscrepancyCategory;
  description: string;
  expectedOutcome?: string;
  contactEmail?: string;
  requestCallback: boolean;
  errors: unknown; // JSON array of ValidationError objects
  severity: DiscrepancySeverity;
  status: DiscrepancyStatus;
  resolution?: string;
  resolvedById?: string;
  resolvedBy?: User;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  changes?: unknown;
  userId: string;
  user: User;
  dailyLogId?: string;
  dailyLog?: DailyLog;
  createdAt: Date;
}

// Performance Rankings Types
export interface PerformanceMetrics {
  jobCount: number;
  totalRevenue: number;
  averageJobSize: number;
  laborPercentage: number;
}

export interface JunkPerformanceMetrics extends PerformanceMetrics {
  disposalPercentage: number;
}

export interface MovePerformanceMetrics extends PerformanceMetrics {
  upsellRevenue: number;
  upsellPercentage: number;
  valuationRevenue: number;
  valuationPercentage: number;
  junkOnMoveRevenue: number;
  junkOnMovePercentage: number;
  materialsRevenue: number;
  materialsPercentage: number;
}

export interface CaptainPerformanceData {
  captainId: string;
  captainName: string;
  junkMetrics: JunkPerformanceMetrics;
  moveMetrics: MovePerformanceMetrics;
}

export interface PerformanceRankingsResponse {
  captains: CaptainPerformanceData[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  totalCaptains: number;
}

export interface PerformanceFilters {
  startDate?: Date;
  endDate?: Date;
  captainIds?: string[];
  includeJunk?: boolean;
  includeMove?: boolean;
}
