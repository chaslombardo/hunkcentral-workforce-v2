'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validatePayrollCalculation } from '@/lib/payrollValidation';
import type { PayrollValidationResult, DiscrepancyReport, ValidationError } from '@/lib/payrollValidation';
import type { User, DailyLog, CommissionEntry } from '@/types';
import { 
  convertUserDecimalFields, 
  convertLogJobDecimalFields, 
  convertLogHourDecimalFields,
  convertCommissionDecimalFields 
} from '@/lib/decimal-utils';

export interface ValidationResponse {
  success: boolean;
  data?: PayrollValidationResult;
  error?: string;
  errorCode?: string;
  retryable?: boolean;
}

export interface DiscrepancyReportData {
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'calculation' | 'data_integrity' | 'rate_issue' | 'hours_mismatch' | 'tips_error' | 'other';
  requestCallback?: boolean;
  expectedOutcome?: string;
  contactEmail?: string;
  errors: ValidationError[];
}

export interface DiscrepancyReportResponse {
  success: boolean;
  reportId?: string;
  error?: string;
  errorCode?: string;
}

/**
 * Validate employee payroll calculations with comprehensive error handling
 */
export async function validateEmployeePayroll(
  employeeId: string,
  payPeriodId: string
): Promise<ValidationResponse> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required. Please log in to view payroll data.',
        errorCode: 'UNAUTHORIZED',
        retryable: false,
      };
    }

    // Check if user can access this payroll data
    if (session.user.id !== employeeId && 
        !session.user.roles?.some(role => ['admin', 'manager'].includes(role))) {
      return {
        success: false,
        error: 'You can only view your own payroll validation data.',
        errorCode: 'FORBIDDEN',
        retryable: false,
      };
    }

    // Get pay period with error handling
    const payPeriod = await prisma.payPeriod.findUnique({
      where: { id: payPeriodId },
    }).catch((error) => {
      console.error('Database error fetching pay period:', error);
      throw new Error('Unable to access pay period data. Please try again.');
    });

    if (!payPeriod) {
      return {
        success: false,
        error: 'The requested pay period could not be found. It may have been deleted or you may not have access to it.',
        errorCode: 'PAY_PERIOD_NOT_FOUND',
        retryable: false,
      };
    }

    // Get employee data with error handling
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        fullName: true,
        email: true,
        roles: true,
        rateJunkCaptain: true,
        rateJunkWingman: true,
        rateMoveCaptain: true,
        rateMoveWingman: true,
        rateZigma: true,
        rateTraining: true,
        rateEstimating: true,
        rateWarehouse: true,
        rateAdmin: true,
        salaryAmount: true,
        salaryFrequency: true,
        salaryType: true,
        commissionRate: true,
        junkBonusGoal: true,
        moveBonusGoal: true,
        createdAt: true,
        updatedAt: true,
      },
    }).catch((error) => {
      console.error('Database error fetching employee:', error);
      throw new Error('Unable to access employee data. Please try again.');
    });

    if (!employee) {
      return {
        success: false,
        error: 'Employee record not found. Please contact your administrator.',
        errorCode: 'EMPLOYEE_NOT_FOUND',
        retryable: false,
      };
    }

    // Get approved logs with error handling
    const approvedLogs = await prisma.dailyLog.findMany({
      where: {
        approvedAt: {
          gte: payPeriod.startDate,
          lte: payPeriod.endDate,
        },
        status: 'approved',
      },
      include: {
        captain: true,
        createdBy: true,
        approvedBy: true,
        lastEditedBy: true,
        jobs: true,
        hours: {
          include: {
            employee: true,
          },
        },
      },
    }).catch((error) => {
      console.error('Database error fetching logs:', error);
      throw new Error('Unable to access work log data. Please try again.');
    });

    // Get commission entries with error handling
    const commissionEntries = await prisma.commissionEntry.findMany({
      where: {
        salesId: employeeId,
        status: 'matched',
        matchedLog: {
          approvedAt: {
            gte: payPeriod.startDate,
            lte: payPeriod.endDate,
          },
        },
      },
      include: {
        matchedLog: true,
        sales: true,
      },
    }).catch((error) => {
      console.error('Database error fetching commissions:', error);
      throw new Error('Unable to access commission data. Please try again.');
    });

    // Convert Prisma data to proper types for validation
    const employeeForValidation: User = {
      ...employee,
      roles: employee.roles as User['roles'],
      rateJunkCaptain: employee.rateJunkCaptain ? Number(employee.rateJunkCaptain) : undefined,
      rateJunkWingman: employee.rateJunkWingman ? Number(employee.rateJunkWingman) : undefined,
      rateMoveCaptain: employee.rateMoveCaptain ? Number(employee.rateMoveCaptain) : undefined,
      rateMoveWingman: employee.rateMoveWingman ? Number(employee.rateMoveWingman) : undefined,
      rateZigma: employee.rateZigma ? Number(employee.rateZigma) : undefined,
      rateTraining: employee.rateTraining ? Number(employee.rateTraining) : undefined,
      rateEstimating: employee.rateEstimating ? Number(employee.rateEstimating) : undefined,
      rateWarehouse: employee.rateWarehouse ? Number(employee.rateWarehouse) : undefined,
      rateAdmin: employee.rateAdmin ? Number(employee.rateAdmin) : undefined,
      salaryAmount: employee.salaryAmount ? Number(employee.salaryAmount) : undefined,
      salaryFrequency: employee.salaryFrequency as User['salaryFrequency'],
      salaryType: employee.salaryType as User['salaryType'],
      commissionRate: employee.commissionRate ? Number(employee.commissionRate) : undefined,
      junkBonusGoal: Number(employee.junkBonusGoal),
      moveBonusGoal: Number(employee.moveBonusGoal),
    };

    // Convert logs and commissions (simplified conversion for validation)
    // Using unknown first to handle complex type conversions with circular references
    const logsForValidation: DailyLog[] = (approvedLogs.map(log => ({
      ...log,
      status: log.status as DailyLog['status'],
      submittedAt: log.submittedAt || undefined,
      approvedAt: log.approvedAt || undefined,
      approvedById: log.approvedById || undefined,
      lastEditedById: log.lastEditedById || undefined,
      // Convert captain's Decimal fields to numbers using utility
      captain: {
        ...convertUserDecimalFields(log.captain),
        salaryFrequency: log.captain.salaryFrequency as User['salaryFrequency'],
        salaryType: log.captain.salaryType as User['salaryType'],
        roles: log.captain.roles as User['roles'],
      },
      // Convert approvedBy user if exists
      approvedBy: log.approvedBy ? {
        ...log.approvedBy,
        rateJunkCaptain: log.approvedBy.rateJunkCaptain ? Number(log.approvedBy.rateJunkCaptain) : undefined,
        rateJunkWingman: log.approvedBy.rateJunkWingman ? Number(log.approvedBy.rateJunkWingman) : undefined,
        rateMoveCaptain: log.approvedBy.rateMoveCaptain ? Number(log.approvedBy.rateMoveCaptain) : undefined,
        rateMoveWingman: log.approvedBy.rateMoveWingman ? Number(log.approvedBy.rateMoveWingman) : undefined,
        rateZigma: log.approvedBy.rateZigma ? Number(log.approvedBy.rateZigma) : undefined,
        rateTraining: log.approvedBy.rateTraining ? Number(log.approvedBy.rateTraining) : undefined,
        rateEstimating: log.approvedBy.rateEstimating ? Number(log.approvedBy.rateEstimating) : undefined,
        rateWarehouse: log.approvedBy.rateWarehouse ? Number(log.approvedBy.rateWarehouse) : undefined,
        rateAdmin: log.approvedBy.rateAdmin ? Number(log.approvedBy.rateAdmin) : undefined,
        salaryAmount: log.approvedBy.salaryAmount ? Number(log.approvedBy.salaryAmount) : undefined,
        commissionRate: log.approvedBy.commissionRate ? Number(log.approvedBy.commissionRate) : undefined,
        junkBonusGoal: Number(log.approvedBy.junkBonusGoal),
        moveBonusGoal: Number(log.approvedBy.moveBonusGoal),
        salaryFrequency: log.approvedBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.approvedBy.salaryType as User['salaryType'],
        roles: log.approvedBy.roles as User['roles'],
      } : undefined,
      // Convert createdBy user
      createdBy: {
        ...log.createdBy,
        rateJunkCaptain: log.createdBy.rateJunkCaptain ? Number(log.createdBy.rateJunkCaptain) : undefined,
        rateJunkWingman: log.createdBy.rateJunkWingman ? Number(log.createdBy.rateJunkWingman) : undefined,
        rateMoveCaptain: log.createdBy.rateMoveCaptain ? Number(log.createdBy.rateMoveCaptain) : undefined,
        rateMoveWingman: log.createdBy.rateMoveWingman ? Number(log.createdBy.rateMoveWingman) : undefined,
        rateZigma: log.createdBy.rateZigma ? Number(log.createdBy.rateZigma) : undefined,
        rateTraining: log.createdBy.rateTraining ? Number(log.createdBy.rateTraining) : undefined,
        rateEstimating: log.createdBy.rateEstimating ? Number(log.createdBy.rateEstimating) : undefined,
        rateWarehouse: log.createdBy.rateWarehouse ? Number(log.createdBy.rateWarehouse) : undefined,
        rateAdmin: log.createdBy.rateAdmin ? Number(log.createdBy.rateAdmin) : undefined,
        salaryAmount: log.createdBy.salaryAmount ? Number(log.createdBy.salaryAmount) : undefined,
        commissionRate: log.createdBy.commissionRate ? Number(log.createdBy.commissionRate) : undefined,
        junkBonusGoal: Number(log.createdBy.junkBonusGoal),
        moveBonusGoal: Number(log.createdBy.moveBonusGoal),
        salaryFrequency: log.createdBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.createdBy.salaryType as User['salaryType'],
        roles: log.createdBy.roles as User['roles'],
      },
      // Convert lastEditedBy user if exists
      lastEditedBy: log.lastEditedBy ? {
        ...log.lastEditedBy,
        rateJunkCaptain: log.lastEditedBy.rateJunkCaptain ? Number(log.lastEditedBy.rateJunkCaptain) : undefined,
        rateJunkWingman: log.lastEditedBy.rateJunkWingman ? Number(log.lastEditedBy.rateJunkWingman) : undefined,
        rateMoveCaptain: log.lastEditedBy.rateMoveCaptain ? Number(log.lastEditedBy.rateMoveCaptain) : undefined,
        rateMoveWingman: log.lastEditedBy.rateMoveWingman ? Number(log.lastEditedBy.rateMoveWingman) : undefined,
        rateZigma: log.lastEditedBy.rateZigma ? Number(log.lastEditedBy.rateZigma) : undefined,
        rateTraining: log.lastEditedBy.rateTraining ? Number(log.lastEditedBy.rateTraining) : undefined,
        rateEstimating: log.lastEditedBy.rateEstimating ? Number(log.lastEditedBy.rateEstimating) : undefined,
        rateWarehouse: log.lastEditedBy.rateWarehouse ? Number(log.lastEditedBy.rateWarehouse) : undefined,
        rateAdmin: log.lastEditedBy.rateAdmin ? Number(log.lastEditedBy.rateAdmin) : undefined,
        salaryAmount: log.lastEditedBy.salaryAmount ? Number(log.lastEditedBy.salaryAmount) : undefined,
        commissionRate: log.lastEditedBy.commissionRate ? Number(log.lastEditedBy.commissionRate) : undefined,
        junkBonusGoal: Number(log.lastEditedBy.junkBonusGoal),
        moveBonusGoal: Number(log.lastEditedBy.moveBonusGoal),
        salaryFrequency: log.lastEditedBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.lastEditedBy.salaryType as User['salaryType'],
        roles: log.lastEditedBy.roles as User['roles'],
      } : undefined,
      // Convert job Decimal fields to numbers using utility
      jobs: log.jobs.map(job => convertLogJobDecimalFields(job)),
      // Convert hour Decimal fields to numbers using utility
      hours: log.hours.map(hour => ({
        ...convertLogHourDecimalFields(hour),
        employee: {
          ...convertUserDecimalFields(hour.employee),
          salaryFrequency: hour.employee.salaryFrequency as User['salaryFrequency'],
          salaryType: hour.employee.salaryType as User['salaryType'],
          roles: hour.employee.roles as User['roles'],
        },
      })),
    })) as unknown) as DailyLog[];

    const commissionsForValidation: CommissionEntry[] = (commissionEntries.map(commission => ({
      ...commission,
      ...convertCommissionDecimalFields(commission),
      jobType: commission.jobType as CommissionEntry['jobType'],
      status: commission.status as CommissionEntry['status'],
      matchedLogId: commission.matchedLogId || undefined,
      // Convert matchedLog if exists
      matchedLog: commission.matchedLog ? {
        ...commission.matchedLog,
        status: commission.matchedLog.status as DailyLog['status'],
        submittedAt: commission.matchedLog.submittedAt || undefined,
        approvedAt: commission.matchedLog.approvedAt || undefined,
        approvedById: commission.matchedLog.approvedById || undefined,
        lastEditedById: commission.matchedLog.lastEditedById || undefined,
        // Add required fields that are missing from the basic matchedLog
        captain: {} as User, // This will be populated by the validation logic if needed
        createdBy: {} as User, // This will be populated by the validation logic if needed
        jobs: [], // This will be populated by the validation logic if needed
        hours: [], // This will be populated by the validation logic if needed
      } : undefined,
      // Convert sales user Decimal fields to numbers using utility
      sales: {
        ...convertUserDecimalFields(commission.sales),
        salaryFrequency: commission.sales.salaryFrequency as User['salaryFrequency'],
        salaryType: commission.sales.salaryType as User['salaryType'],
        roles: commission.sales.roles as User['roles'],
      },
    })) as unknown) as CommissionEntry[];

    // Perform validation
    const validationResult = validatePayrollCalculation(
      employeeForValidation,
      logsForValidation,
      commissionsForValidation,
      payPeriod.startDate,
      payPeriod.endDate
    );

    return {
      success: true,
      data: validationResult,
    };

  } catch (error) {
    console.error('Error validating payroll:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    
    // Determine if the error is retryable
    const isRetryable = errorMessage.includes('try again') || 
                       errorMessage.includes('network') ||
                       errorMessage.includes('timeout') ||
                       errorMessage.includes('connection');

    return {
      success: false,
      error: errorMessage,
      errorCode: 'VALIDATION_ERROR',
      retryable: isRetryable,
    };
  }
}

/**
 * Submit a discrepancy report with comprehensive error handling
 */
export async function submitDiscrepancyReport(
  employeeId: string,
  payPeriodId: string,
  reportData: DiscrepancyReportData
): Promise<DiscrepancyReportResponse> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required. Please log in to submit a report.',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Check if user can submit reports for this employee
    if (session.user.id !== employeeId && 
        !session.user.roles?.some(role => ['admin', 'manager'].includes(role))) {
      return {
        success: false,
        error: 'You can only submit reports for your own payroll data.',
        errorCode: 'FORBIDDEN',
      };
    }

    // Validate required fields
    if (!reportData.description?.trim()) {
      return {
        success: false,
        error: 'Please provide a description of the issue.',
        errorCode: 'MISSING_DESCRIPTION',
      };
    }

    if (!reportData.priority) {
      return {
        success: false,
        error: 'Please select a priority level for this report.',
        errorCode: 'MISSING_PRIORITY',
      };
    }

    if (!reportData.category) {
      return {
        success: false,
        error: 'Please select a category for this report.',
        errorCode: 'MISSING_CATEGORY',
      };
    }

    // Verify pay period exists
    const payPeriod = await prisma.payPeriod.findUnique({
      where: { id: payPeriodId },
    }).catch((error) => {
      console.error('Database error fetching pay period for report:', error);
      throw new Error('Unable to verify pay period. Please try again.');
    });

    if (!payPeriod) {
      return {
        success: false,
        error: 'The specified pay period could not be found.',
        errorCode: 'PAY_PERIOD_NOT_FOUND',
      };
    }

    // Create the discrepancy report
    const report = await prisma.discrepancyReport.create({
      data: {
        employeeId,
        payPeriodId,
        description: reportData.description.trim(),
        priority: reportData.priority,
        category: reportData.category,
        requestCallback: reportData.requestCallback || false,
        expectedOutcome: reportData.expectedOutcome?.trim(),
        contactEmail: reportData.contactEmail?.trim(),
        errors: JSON.stringify(reportData.errors),
        severity: reportData.priority, // Use priority as severity
        status: 'open',
        reportedById: session.user.id,
      },
    }).catch((error) => {
      console.error('Database error creating discrepancy report:', error);
      throw new Error('Unable to submit your report. Please try again.');
    });

    // TODO: Send notification to administrators
    // This could be implemented with email notifications or internal messaging

    return {
      success: true,
      reportId: report.id,
    };

  } catch (error) {
    console.error('Error submitting discrepancy report:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit report';
    
    return {
      success: false,
      error: errorMessage,
      errorCode: 'SUBMISSION_ERROR',
    };
  }
}

/**
 * Get discrepancy reports for an employee with error handling
 */
export async function getEmployeeDiscrepancyReports(
  employeeId: string,
  payPeriodId?: string
): Promise<{
  success: boolean;
  data?: DiscrepancyReport[];
  error?: string;
  errorCode?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required.',
        errorCode: 'UNAUTHORIZED',
      };
    }

    // Check permissions
    if (session.user.id !== employeeId && 
        !session.user.roles?.some(role => ['admin', 'manager'].includes(role))) {
      return {
        success: false,
        error: 'You can only view your own discrepancy reports.',
        errorCode: 'FORBIDDEN',
      };
    }

    const whereClause: { employeeId: string; payPeriodId?: string } = { employeeId };
    if (payPeriodId) {
      whereClause.payPeriodId = payPeriodId;
    }

    const reports = await prisma.discrepancyReport.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        payPeriod: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }).catch((error) => {
      console.error('Database error fetching discrepancy reports:', error);
      throw new Error('Unable to load discrepancy reports. Please try again.');
    });

    // Convert to proper format
    const formattedReports: DiscrepancyReport[] = reports.map(report => ({
      employeeId: report.employeeId,
      payPeriodId: report.payPeriodId,
      discrepancies: JSON.parse(report.errors as string) as ValidationError[],
      severity: report.priority as DiscrepancyReport['severity'],
      reportedAt: report.createdAt, // Use createdAt instead of reportedAt
      status: report.status as DiscrepancyReport['status'],
      resolution: report.resolution || undefined,
    }));

    return {
      success: true,
      data: formattedReports,
    };

  } catch (error) {
    console.error('Error fetching discrepancy reports:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Failed to load reports';
    
    return {
      success: false,
      error: errorMessage,
      errorCode: 'FETCH_ERROR',
    };
  }
}