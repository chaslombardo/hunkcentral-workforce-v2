// Payroll calculation validation and error detection
import type { User, Department, DailyLog, CommissionEntry } from '@/types';
import type { PayrollCalculation, EnhancedPayrollCalculation } from './payCalculator';
import { calculatePayroll, calculateEnhancedPayroll } from './payCalculator';

export interface ValidationError {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  field?: string;
  value?: unknown;
  expectedValue?: unknown;
  logId?: string;
  jobId?: string;
  employeeId?: string;
}

export interface PayrollValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
  calculationAccuracy: number; // 0-100 percentage
  auditTrail: AuditTrailEntry[];
}

export interface AuditTrailEntry {
  logId: string;
  jobId?: string;
  employeeId: string;
  department: Department;
  hours: number;
  rate: number;
  grossPay: number;
  tips: number;
  bonuses: number;
  commission: number;
  calculationDate: Date;
  approvedBy?: string;
  lastModified?: Date;
}

export interface DiscrepancyReport {
  employeeId: string;
  payPeriodId: string;
  discrepancies: ValidationError[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedAt: Date;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolution?: string;
}

/**
 * Validate payroll calculations for accuracy and consistency
 */
export function validatePayrollCalculation(
  employee: User,
  approvedLogs: DailyLog[],
  commissionEntries: CommissionEntry[],
  payPeriodStart: Date,
  payPeriodEnd: Date
): PayrollValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const info: ValidationError[] = [];
  const auditTrail: AuditTrailEntry[] = [];

  // Calculate payroll using existing logic
  const payrollCalculation = calculatePayroll(
    [employee],
    approvedLogs,
    commissionEntries,
    payPeriodStart,
    payPeriodEnd
  )[0];

  const enhancedPayroll = calculateEnhancedPayroll(
    employee,
    approvedLogs,
    commissionEntries,
    payPeriodStart,
    payPeriodEnd
  );

  // Validate department hours match total hours
  const departmentHoursSum = Object.values(payrollCalculation.hoursByDepartment)
    .reduce((sum, hours) => sum + hours, 0);

  if (Math.abs(departmentHoursSum - payrollCalculation.totalHours) > 0.01) {
    errors.push({
      type: 'error',
      code: 'HOURS_MISMATCH',
      message: `Department hours (${departmentHoursSum}) do not match total hours (${payrollCalculation.totalHours})`,
      field: 'totalHours',
      value: payrollCalculation.totalHours,
      expectedValue: departmentHoursSum,
      employeeId: employee.id,
    });
  }

  // Validate tips breakdown matches total tips
  const tipsSum = enhancedPayroll.tipsBreakdown.reduce((sum, tip) => sum + tip.myShare, 0);
  if (Math.abs(tipsSum - payrollCalculation.tips) > 0.01) {
    errors.push({
      type: 'error',
      code: 'TIPS_MISMATCH',
      message: `Tips breakdown (${tipsSum.toFixed(2)}) does not match total tips (${payrollCalculation.tips.toFixed(2)})`,
      field: 'tips',
      value: payrollCalculation.tips,
      expectedValue: tipsSum,
      employeeId: employee.id,
    });
  }

  // Validate department breakdown totals
  const departmentGrossPaySum = Object.values(enhancedPayroll.departmentBreakdown)
    .reduce((sum, dept) => sum + dept.grossPay, 0);

  if (Math.abs(departmentGrossPaySum - payrollCalculation.grossWages) > 0.01) {
    errors.push({
      type: 'error',
      code: 'DEPARTMENT_PAY_MISMATCH',
      message: `Department gross pay (${departmentGrossPaySum.toFixed(2)}) does not match total gross wages (${payrollCalculation.grossWages.toFixed(2)})`,
      field: 'grossWages',
      value: payrollCalculation.grossWages,
      expectedValue: departmentGrossPaySum,
      employeeId: employee.id,
    });
  }

  // Validate daily breakdown totals
  const dailyHoursSum = Object.values(enhancedPayroll.dailyBreakdown)
    .reduce((sum, day) => sum + day.totalHours, 0);

  if (Math.abs(dailyHoursSum - payrollCalculation.totalHours) > 0.01) {
    warnings.push({
      type: 'warning',
      code: 'DAILY_HOURS_MISMATCH',
      message: `Daily hours breakdown (${dailyHoursSum}) does not match total hours (${payrollCalculation.totalHours})`,
      field: 'totalHours',
      value: payrollCalculation.totalHours,
      expectedValue: dailyHoursSum,
      employeeId: employee.id,
    });
  }

  // Validate rate consistency
  for (const [department, breakdown] of Object.entries(enhancedPayroll.departmentBreakdown)) {
    if (breakdown.hours > 0) {
      const expectedRate = enhancedPayroll.rateSchedule[department as Department].currentRate;
      if (Math.abs(breakdown.rate - expectedRate) > 0.01) {
        errors.push({
          type: 'error',
          code: 'RATE_INCONSISTENCY',
          message: `Rate for ${department} (${breakdown.rate}) does not match expected rate (${expectedRate})`,
          field: `rate_${department}`,
          value: breakdown.rate,
          expectedValue: expectedRate,
          employeeId: employee.id,
        });
      }
    }
  }

  // Validate commission calculations
  const expectedCommission = commissionEntries
    .filter(entry => entry.status === 'matched' && entry.matchedLog?.approvedAt)
    .filter(entry => {
      const approvedDate = new Date(entry.matchedLog!.approvedAt!);
      return approvedDate >= payPeriodStart && approvedDate <= payPeriodEnd;
    })
    .reduce((sum, entry) => sum + Number(entry.commissionAmount || 0), 0);

  if (Math.abs(expectedCommission - payrollCalculation.commission) > 0.01) {
    errors.push({
      type: 'error',
      code: 'COMMISSION_MISMATCH',
      message: `Calculated commission (${payrollCalculation.commission.toFixed(2)}) does not match expected commission (${expectedCommission.toFixed(2)})`,
      field: 'commission',
      value: payrollCalculation.commission,
      expectedValue: expectedCommission,
      employeeId: employee.id,
    });
  }

  // Check for missing or orphaned data
  validateDataIntegrity(approvedLogs, employee, errors, warnings, info);

  // Build audit trail
  buildAuditTrail(approvedLogs, employee, auditTrail);

  // Calculate accuracy percentage
  const totalChecks = 10; // Number of validation checks performed
  const failedChecks = errors.length;
  const calculationAccuracy = Math.max(0, ((totalChecks - failedChecks) / totalChecks) * 100);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    info,
    calculationAccuracy,
    auditTrail,
  };
}

/**
 * Validate data integrity and flag potential issues
 */
function validateDataIntegrity(
  approvedLogs: DailyLog[],
  employee: User,
  errors: ValidationError[],
  warnings: ValidationError[],
  info: ValidationError[]
): void {
  for (const log of approvedLogs) {
    // Check for logs without hours for the employee
    const employeeHours = log.hours.filter(hour => hour.employeeId === employee.id);
    if (employeeHours.length === 0) {
      info.push({
        type: 'info',
        code: 'NO_HOURS_RECORDED',
        message: `No hours recorded for employee in log ${log.id}`,
        logId: log.id,
        employeeId: employee.id,
      });
      continue;
    }

    // Check for hours without corresponding jobs
    const junkHours = employeeHours.filter(hour => hour.department === 'junk');
    const moveHours = employeeHours.filter(hour => hour.department === 'move');
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    const moveJobs = log.jobs.filter(job => job.jobType === 'move');

    if (junkHours.length > 0 && junkJobs.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'HOURS_WITHOUT_JOBS',
        message: `Employee has junk hours but no junk jobs in log ${log.id}`,
        logId: log.id,
        employeeId: employee.id,
      });
    }

    if (moveHours.length > 0 && moveJobs.length === 0) {
      warnings.push({
        type: 'warning',
        code: 'HOURS_WITHOUT_JOBS',
        message: `Employee has move hours but no move jobs in log ${log.id}`,
        logId: log.id,
        employeeId: employee.id,
      });
    }

    // Check for excessive hours in a single day
    const totalDailyHours = employeeHours.reduce((sum, hour) => sum + Number(hour.hours), 0);
    if (totalDailyHours > 16) {
      warnings.push({
        type: 'warning',
        code: 'EXCESSIVE_HOURS',
        message: `Employee worked ${totalDailyHours} hours in a single day (log ${log.id})`,
        logId: log.id,
        employeeId: employee.id,
        value: totalDailyHours,
      });
    }

    // Check for zero-hour entries
    for (const hour of employeeHours) {
      if (Number(hour.hours) === 0) {
        warnings.push({
          type: 'warning',
          code: 'ZERO_HOURS',
          message: `Zero hours recorded for ${hour.department} department in log ${log.id}`,
          logId: log.id,
          employeeId: employee.id,
          field: `hours_${hour.department}`,
          value: 0,
        });
      }
    }

    // Check for missing rates
    for (const hour of employeeHours) {
      const rate = getRateForDepartment(employee, hour.department as Department, hour.isCoCaptain);
      if (rate === 0) {
        errors.push({
          type: 'error',
          code: 'MISSING_RATE',
          message: `No rate configured for ${hour.department} department`,
          logId: log.id,
          employeeId: employee.id,
          field: `rate_${hour.department}`,
          value: 0,
        });
      }
    }

    // Check for jobs with zero revenue but positive tips
    for (const job of log.jobs) {
      if (Number(job.revenue) === 0 && Number(job.tips) > 0) {
        warnings.push({
          type: 'warning',
          code: 'TIPS_WITHOUT_REVENUE',
          message: `Job ${job.jobId} has tips (${job.tips}) but no revenue`,
          logId: log.id,
          jobId: job.jobId,
          value: job.tips,
        });
      }
    }
  }
}

/**
 * Build audit trail for payroll calculations
 */
function buildAuditTrail(
  approvedLogs: DailyLog[],
  employee: User,
  auditTrail: AuditTrailEntry[]
): void {
  for (const log of approvedLogs) {
    const employeeHours = log.hours.filter(hour => hour.employeeId === employee.id);
    
    for (const hour of employeeHours) {
      const rate = getRateForDepartment(employee, hour.department as Department, hour.isCoCaptain);
      const grossPay = Number(hour.hours) * rate;
      
      // Calculate tips for this department
      const departmentJobs = log.jobs.filter(job => 
        (job.jobType === 'junk' && hour.department === 'junk') ||
        (job.jobType === 'move' && hour.department === 'move')
      );
      
      const departmentEmployees = log.hours
        .filter(h => h.department === hour.department)
        .map(h => h.employeeId);
      
      const uniqueEmployees = [...new Set(departmentEmployees)];
      const departmentTips = departmentJobs.reduce((sum, job) => sum + Number(job.tips), 0);
      const employeeTips = uniqueEmployees.length > 0 ? departmentTips / uniqueEmployees.length : 0;

      auditTrail.push({
        logId: log.id,
        employeeId: employee.id,
        department: hour.department as Department,
        hours: Number(hour.hours),
        rate,
        grossPay,
        tips: employeeTips,
        bonuses: 0, // Bonuses are calculated at log level for captains
        commission: 0, // Commission is calculated separately
        calculationDate: new Date(),
        approvedBy: log.approvedById || undefined,
        lastModified: log.updatedAt,
      });
    }
  }
}

/**
 * Get rate for a specific department and role
 */
function getRateForDepartment(user: User, department: Department, isCoCaptain: boolean): number {
  const usesCaptainRate = user.roles.includes('captain') || isCoCaptain;

  switch (department) {
    case 'junk':
      return usesCaptainRate
        ? Number(user.rateJunkCaptain ?? 0)
        : Number(user.rateJunkWingman ?? 0);
    case 'move':
      return usesCaptainRate
        ? Number(user.rateMoveCaptain ?? 0)
        : Number(user.rateMoveWingman ?? 0);
    case 'zigma':
      return Number(user.rateZigma ?? 0);
    case 'training':
      return Number(user.rateTraining ?? 0);
    case 'estimating':
      return Number(user.rateEstimating ?? 0);
    case 'warehouse':
      return Number(user.rateWarehouse ?? 0);
    case 'admin':
      return Number(user.rateAdmin ?? 0);
    default:
      return 0;
  }
}

/**
 * Create a discrepancy report for payroll issues
 */
export function createDiscrepancyReport(
  employeeId: string,
  payPeriodId: string,
  validationResult: PayrollValidationResult
): DiscrepancyReport {
  const allIssues = [...validationResult.errors, ...validationResult.warnings];
  
  // Determine severity based on error types and count
  let severity: DiscrepancyReport['severity'] = 'low';
  
  const criticalErrors = validationResult.errors.filter(error => 
    ['HOURS_MISMATCH', 'TIPS_MISMATCH', 'DEPARTMENT_PAY_MISMATCH', 'COMMISSION_MISMATCH'].includes(error.code)
  );
  
  const rateErrors = validationResult.errors.filter(error => 
    error.code === 'RATE_INCONSISTENCY' || error.code === 'MISSING_RATE'
  );

  if (criticalErrors.length > 0) {
    severity = 'critical';
  } else if (rateErrors.length > 0 || validationResult.errors.length > 2) {
    severity = 'high';
  } else if (validationResult.errors.length > 0 || validationResult.warnings.length > 3) {
    severity = 'medium';
  }

  return {
    employeeId,
    payPeriodId,
    discrepancies: allIssues,
    severity,
    reportedAt: new Date(),
    status: 'open',
  };
}

/**
 * Validate payroll data accuracy for employees
 */
export function validateDataAccuracy(
  payrollCalculation: PayrollCalculation,
  originalLogs: DailyLog[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Verify that all log data is properly reflected in payroll
  for (const log of originalLogs) {
    const employeeHours = log.hours.filter(hour => hour.employeeId === payrollCalculation.employeeId);
    
    // Check if log is properly included in calculation
    if (employeeHours.length > 0 && !log.approvedAt) {
      errors.push({
        type: 'error',
        code: 'UNAPPROVED_LOG_INCLUDED',
        message: `Unapproved log ${log.id} appears to be included in payroll calculation`,
        logId: log.id,
        employeeId: payrollCalculation.employeeId,
      });
    }

    // Verify job-to-hours consistency
    const junkHours = employeeHours.filter(hour => hour.department === 'junk');
    const moveHours = employeeHours.filter(hour => hour.department === 'move');
    const junkJobs = log.jobs.filter(job => job.jobType === 'junk');
    const moveJobs = log.jobs.filter(job => job.jobType === 'move');

    if (junkHours.length > 0 && junkJobs.length === 0) {
      errors.push({
        type: 'error',
        code: 'ORPHANED_HOURS',
        message: `Junk hours recorded without corresponding junk jobs in log ${log.id}`,
        logId: log.id,
        employeeId: payrollCalculation.employeeId,
      });
    }

    if (moveHours.length > 0 && moveJobs.length === 0) {
      errors.push({
        type: 'error',
        code: 'ORPHANED_HOURS',
        message: `Move hours recorded without corresponding move jobs in log ${log.id}`,
        logId: log.id,
        employeeId: payrollCalculation.employeeId,
      });
    }
  }

  return errors;
}