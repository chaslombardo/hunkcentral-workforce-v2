'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validatePayrollCalculation, createDiscrepancyReport } from '@/lib/payrollValidation';
import type { PayrollValidationResult, DiscrepancyReport, ValidationError } from '@/lib/payrollValidation';
import type { User, DailyLog, CommissionEntry, PayPeriod } from '@/types';

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
    const logsForValidation: DailyLog[] = approvedLogs.map(log => ({
      ...log,
      status: log.status as DailyLog['status'],
      submittedAt: log.submittedAt || undefined,
      approvedAt: log.approvedAt || undefined,
      approvedById: log.approvedById || undefined,
      lastEditedById: log.lastEditedById || undefined,
    })) as DailyLog[];

    const commissionsForValidation: CommissionEntry[] = commissionEntries.map(commission => ({
      ...commission,
      jobType: commission.jobType as CommissionEntry['jobType'],
      status: commission.status as CommissionEntry['status'],
      estimatedRevenue: Number(commission.estimatedRevenue),
      actualRevenue: commission.actualRevenue ? Number(commission.actualRevenue) : undefined,
      commissionAmount: commission.commissionAmount ? Number(commission.commissionAmount) : undefined,
      matchedLogId: commission.matchedLogId || undefined,
    })) as CommissionEntry[];

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
        status: 'open',
        reportedAt: new Date(),
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
        reportedAt: 'desc',
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
      reportedAt: report.reportedAt,
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