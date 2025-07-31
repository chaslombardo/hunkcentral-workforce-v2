'use server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { 
  validatePayrollCalculation, 
  createDiscrepancyReport,
  type PayrollValidationResult,
  type DiscrepancyReport,
  type ValidationError 
} from '@/lib/payrollValidation';
import { logDailyLogChange } from '@/lib/auditLogger';
import type { User, PayPeriod, DailyLog, CommissionEntry, Department, JobType } from '@/types';

/**
 * Validate payroll calculation for a specific employee and pay period
 */
export async function validateEmployeePayroll(
  employeeId: string,
  payPeriodId: string
): Promise<{ success: boolean; data?: PayrollValidationResult; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized: Login required');
    }

    // Check if user can access this payroll data
    if (session.user.id !== employeeId && 
        !session.user.roles?.some(role => ['admin', 'manager'].includes(role))) {
      throw new Error('Unauthorized: Can only validate your own payroll data');
    }

    // Get pay period
    const payPeriod = await prisma.payPeriod.findUnique({
      where: { id: payPeriodId },
    });

    if (!payPeriod) {
      throw new Error('Pay period not found');
    }

    // Get employee data
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
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get approved logs for the pay period
    const approvedLogs = await prisma.dailyLog.findMany({
      where: {
        approvedAt: {
          gte: payPeriod.startDate,
          lte: payPeriod.endDate,
        },
        status: 'approved',
      },
      include: {
        captain: {
          select: {
            id: true,
            fullName: true,
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
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            roles: true,
            email: true,
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
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            roles: true,
            email: true,
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
        },
        lastEditedBy: {
          select: {
            id: true,
            fullName: true,
            roles: true,
            email: true,
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
        },
        jobs: true,
        hours: {
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                roles: true,
                email: true,
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
            },
          },
        },
      },
    });

    // Get commission entries for the employee
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

    // Convert logs and commissions to proper types
    const logsForValidation: DailyLog[] = approvedLogs.map(log => ({
      ...log,
      status: log.status as DailyLog['status'],
      submittedAt: log.submittedAt || undefined,
      approvedAt: log.approvedAt || undefined,
      approvedById: log.approvedById || undefined,
      lastEditedById: log.lastEditedById || undefined,
      captain: {
        ...log.captain,
        roles: log.captain.roles as User['roles'],
        rateJunkCaptain: log.captain.rateJunkCaptain ? Number(log.captain.rateJunkCaptain) : undefined,
        rateJunkWingman: log.captain.rateJunkWingman ? Number(log.captain.rateJunkWingman) : undefined,
        rateMoveCaptain: log.captain.rateMoveCaptain ? Number(log.captain.rateMoveCaptain) : undefined,
        rateMoveWingman: log.captain.rateMoveWingman ? Number(log.captain.rateMoveWingman) : undefined,
        rateZigma: log.captain.rateZigma ? Number(log.captain.rateZigma) : undefined,
        rateTraining: log.captain.rateTraining ? Number(log.captain.rateTraining) : undefined,
        rateEstimating: log.captain.rateEstimating ? Number(log.captain.rateEstimating) : undefined,
        rateWarehouse: log.captain.rateWarehouse ? Number(log.captain.rateWarehouse) : undefined,
        rateAdmin: log.captain.rateAdmin ? Number(log.captain.rateAdmin) : undefined,
        salaryAmount: log.captain.salaryAmount ? Number(log.captain.salaryAmount) : undefined,
        salaryFrequency: log.captain.salaryFrequency as User['salaryFrequency'],
        salaryType: log.captain.salaryType as User['salaryType'],
        commissionRate: log.captain.commissionRate ? Number(log.captain.commissionRate) : undefined,
        junkBonusGoal: Number(log.captain.junkBonusGoal),
        moveBonusGoal: Number(log.captain.moveBonusGoal),
      },
      createdBy: {
        ...log.createdBy,
        roles: log.createdBy.roles as User['roles'],
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
        salaryFrequency: log.createdBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.createdBy.salaryType as User['salaryType'],
        commissionRate: log.createdBy.commissionRate ? Number(log.createdBy.commissionRate) : undefined,
        junkBonusGoal: Number(log.createdBy.junkBonusGoal),
        moveBonusGoal: Number(log.createdBy.moveBonusGoal),
      },
      approvedBy: log.approvedBy ? {
        ...log.approvedBy,
        roles: log.approvedBy.roles as User['roles'],
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
        salaryFrequency: log.approvedBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.approvedBy.salaryType as User['salaryType'],
        commissionRate: log.approvedBy.commissionRate ? Number(log.approvedBy.commissionRate) : undefined,
        junkBonusGoal: Number(log.approvedBy.junkBonusGoal),
        moveBonusGoal: Number(log.approvedBy.moveBonusGoal),
      } : undefined,
      lastEditedBy: log.lastEditedBy ? {
        ...log.lastEditedBy,
        roles: log.lastEditedBy.roles as User['roles'],
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
        salaryFrequency: log.lastEditedBy.salaryFrequency as User['salaryFrequency'],
        salaryType: log.lastEditedBy.salaryType as User['salaryType'],
        commissionRate: log.lastEditedBy.commissionRate ? Number(log.lastEditedBy.commissionRate) : undefined,
        junkBonusGoal: Number(log.lastEditedBy.junkBonusGoal),
        moveBonusGoal: Number(log.lastEditedBy.moveBonusGoal),
      } : undefined,
      hours: log.hours.map(hour => ({
        ...hour,
        log: {} as DailyLog, // Circular reference - will be set by parent
        department: hour.department as Department,
        hours: Number(hour.hours),
        employee: {
          ...hour.employee,
          roles: hour.employee.roles as User['roles'],
          rateJunkCaptain: hour.employee.rateJunkCaptain ? Number(hour.employee.rateJunkCaptain) : undefined,
          rateJunkWingman: hour.employee.rateJunkWingman ? Number(hour.employee.rateJunkWingman) : undefined,
          rateMoveCaptain: hour.employee.rateMoveCaptain ? Number(hour.employee.rateMoveCaptain) : undefined,
          rateMoveWingman: hour.employee.rateMoveWingman ? Number(hour.employee.rateMoveWingman) : undefined,
          rateZigma: hour.employee.rateZigma ? Number(hour.employee.rateZigma) : undefined,
          rateTraining: hour.employee.rateTraining ? Number(hour.employee.rateTraining) : undefined,
          rateEstimating: hour.employee.rateEstimating ? Number(hour.employee.rateEstimating) : undefined,
          rateWarehouse: hour.employee.rateWarehouse ? Number(hour.employee.rateWarehouse) : undefined,
          rateAdmin: hour.employee.rateAdmin ? Number(hour.employee.rateAdmin) : undefined,
          salaryAmount: hour.employee.salaryAmount ? Number(hour.employee.salaryAmount) : undefined,
          salaryFrequency: hour.employee.salaryFrequency as User['salaryFrequency'],
          salaryType: hour.employee.salaryType as User['salaryType'],
          commissionRate: hour.employee.commissionRate ? Number(hour.employee.commissionRate) : undefined,
          junkBonusGoal: Number(hour.employee.junkBonusGoal),
          moveBonusGoal: Number(hour.employee.moveBonusGoal),
        },
      })),
      jobs: log.jobs.map(job => ({
        ...job,
        jobType: job.jobType as JobType,
        revenue: Number(job.revenue),
        tips: Number(job.tips),
        junkOnMove: job.junkOnMove ? Number(job.junkOnMove) : undefined,
        valuation: job.valuation ? Number(job.valuation) : undefined,
        materials: job.materials ? Number(job.materials) : undefined,
        disposalCost: job.disposalCost ? Number(job.disposalCost) : undefined,
        log: {} as DailyLog, // Circular reference - will be set by parent
      })),
    }));

    const commissionsForValidation: CommissionEntry[] = commissionEntries.map(commission => ({
      ...commission,
      jobType: commission.jobType as CommissionEntry['jobType'],
      status: commission.status as CommissionEntry['status'],
      estimatedRevenue: Number(commission.estimatedRevenue),
      actualRevenue: commission.actualRevenue ? Number(commission.actualRevenue) : undefined,
      commissionAmount: commission.commissionAmount ? Number(commission.commissionAmount) : undefined,
      matchedLogId: commission.matchedLogId || undefined,
      matchedLog: commission.matchedLog ? {
        ...commission.matchedLog,
        status: commission.matchedLog.status as DailyLog['status'],
        submittedAt: commission.matchedLog.submittedAt || undefined,
        approvedAt: commission.matchedLog.approvedAt || undefined,
        approvedById: commission.matchedLog.approvedById || undefined,
        lastEditedById: commission.matchedLog.lastEditedById || undefined,
      } as DailyLog : undefined,
      sales: {
        ...commission.sales,
        roles: commission.sales.roles as User['roles'],
        rateJunkCaptain: commission.sales.rateJunkCaptain ? Number(commission.sales.rateJunkCaptain) : undefined,
        rateJunkWingman: commission.sales.rateJunkWingman ? Number(commission.sales.rateJunkWingman) : undefined,
        rateMoveCaptain: commission.sales.rateMoveCaptain ? Number(commission.sales.rateMoveCaptain) : undefined,
        rateMoveWingman: commission.sales.rateMoveWingman ? Number(commission.sales.rateMoveWingman) : undefined,
        rateZigma: commission.sales.rateZigma ? Number(commission.sales.rateZigma) : undefined,
        rateTraining: commission.sales.rateTraining ? Number(commission.sales.rateTraining) : undefined,
        rateEstimating: commission.sales.rateEstimating ? Number(commission.sales.rateEstimating) : undefined,
        rateWarehouse: commission.sales.rateWarehouse ? Number(commission.sales.rateWarehouse) : undefined,
        rateAdmin: commission.sales.rateAdmin ? Number(commission.sales.rateAdmin) : undefined,
        salaryAmount: commission.sales.salaryAmount ? Number(commission.sales.salaryAmount) : undefined,
        salaryFrequency: commission.sales.salaryFrequency as User['salaryFrequency'],
        salaryType: commission.sales.salaryType as User['salaryType'],
        commissionRate: commission.sales.commissionRate ? Number(commission.sales.commissionRate) : undefined,
        junkBonusGoal: Number(commission.sales.junkBonusGoal),
        moveBonusGoal: Number(commission.sales.moveBonusGoal),
      },
    }));

    // Perform validation
    const validationResult = validatePayrollCalculation(
      employeeForValidation,
      logsForValidation,
      commissionsForValidation,
      payPeriod.startDate,
      payPeriod.endDate
    );

    // Log validation activity
    await logDailyLogChange(
      'validate_payroll',
      `payroll-${employeeId}-${payPeriodId}`,
      session.user.id,
      undefined,
      undefined,
      {
        employeeId,
        payPeriodId,
        validationAccuracy: validationResult.calculationAccuracy,
        errorsFound: validationResult.errors.length,
        warningsFound: validationResult.warnings.length,
      }
    );

    return { success: true, data: validationResult };
  } catch (error) {
    console.error('Error validating payroll:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate payroll',
    };
  }
}

/**
 * Submit a discrepancy report for payroll issues
 */
export async function submitDiscrepancyReport(
  employeeId: string,
  payPeriodId: string,
  reportData: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'calculation' | 'data_integrity' | 'rate_issue' | 'hours_mismatch' | 'tips_error' | 'other';
    description: string;
    expectedOutcome?: string;
    contactEmail?: string;
    requestCallback: boolean;
    errors: ValidationError[];
  }
): Promise<{ success: boolean; reportId?: string; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized: Login required');
    }

    // Check if user can submit report for this employee
    if (session.user.id !== employeeId && 
        !session.user.roles?.some(role => ['admin', 'manager'].includes(role))) {
      throw new Error('Unauthorized: Can only submit reports for your own payroll');
    }

    // Create discrepancy report record
    const discrepancyReport = await prisma.discrepancyReport.create({
      data: {
        employeeId,
        payPeriodId,
        reportedById: session.user.id,
        priority: reportData.priority,
        category: reportData.category,
        description: reportData.description,
        expectedOutcome: reportData.expectedOutcome,
        contactEmail: reportData.contactEmail,
        requestCallback: reportData.requestCallback,
        status: 'open',
        discrepancies: JSON.parse(JSON.stringify(reportData.errors)),
        severity: determineSeverity(reportData.errors),
      },
    });

    // Log the discrepancy report submission
    await logDailyLogChange(
      'submit_discrepancy_report',
      discrepancyReport.id,
      session.user.id,
      undefined,
      undefined,
      {
        employeeId,
        payPeriodId,
        priority: reportData.priority,
        category: reportData.category,
        errorsCount: reportData.errors.length,
      }
    );

    return { success: true, reportId: discrepancyReport.id };
  } catch (error) {
    console.error('Error submitting discrepancy report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit discrepancy report',
    };
  }
}

/**
 * Get discrepancy reports for an employee
 */
export async function getDiscrepancyReports(
  employeeId: string,
  payPeriodId?: string
): Promise<{ success: boolean; data?: DiscrepancyReport[]; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Unauthorized: Login required');
    }

    // Check if user can access these reports
    if (session.user.id !== employeeId && 
        !session.user.roles?.some(role => ['admin', 'manager'].includes(role))) {
      throw new Error('Unauthorized: Can only view your own discrepancy reports');
    }

    const reports = await prisma.discrepancyReport.findMany({
      where: {
        employeeId,
        ...(payPeriodId && { payPeriodId }),
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        reportedBy: {
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
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedReports: DiscrepancyReport[] = reports.map(report => ({
      employeeId: report.employeeId,
      payPeriodId: report.payPeriodId,
      discrepancies: Array.isArray(report.discrepancies) ? (report.discrepancies as unknown as ValidationError[]) : [],
      severity: report.severity as DiscrepancyReport['severity'],
      reportedAt: report.createdAt,
      status: report.status as DiscrepancyReport['status'],
      resolution: report.resolution || undefined,
    }));

    return { success: true, data: formattedReports };
  } catch (error) {
    console.error('Error fetching discrepancy reports:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch discrepancy reports',
    };
  }
}

/**
 * Determine severity based on validation errors
 */
function determineSeverity(errors: ValidationError[]): 'low' | 'medium' | 'high' | 'critical' {
  const criticalErrors = errors.filter(error => 
    ['HOURS_MISMATCH', 'TIPS_MISMATCH', 'DEPARTMENT_PAY_MISMATCH', 'COMMISSION_MISMATCH'].includes(error.code)
  );
  
  const rateErrors = errors.filter(error => 
    error.code === 'RATE_INCONSISTENCY' || error.code === 'MISSING_RATE'
  );

  if (criticalErrors.length > 0) {
    return 'critical';
  } else if (rateErrors.length > 0 || errors.filter(e => e.type === 'error').length > 2) {
    return 'high';
  } else if (errors.filter(e => e.type === 'error').length > 0 || errors.filter(e => e.type === 'warning').length > 3) {
    return 'medium';
  }
  
  return 'low';
}