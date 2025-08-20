import { prisma } from '@/lib/prisma';
import type { Department } from '@/types';

/**
 * Enhanced database queries for detailed payroll data
 */

/**
 * Get department-specific hours and rates for an employee in a pay period
 */
export async function getDepartmentHoursAndRates(
  employeeId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
) {
  const result = await prisma.$queryRaw<
    Array<{
      department: string;
      total_hours: bigint;
      captain_hours: bigint;
      wingman_hours: bigint;
      co_captain_hours: bigint;
    }>
  >`
    SELECT 
      lh.department,
      SUM(lh.hours) as total_hours,
      SUM(CASE WHEN dl."captainId" = ${employeeId} THEN lh.hours ELSE 0 END) as captain_hours,
      SUM(CASE WHEN lh."isCoCaptain" = true THEN lh.hours ELSE 0 END) as co_captain_hours,
      SUM(CASE WHEN dl."captainId" != ${employeeId} AND lh."isCoCaptain" = false THEN lh.hours ELSE 0 END) as wingman_hours
    FROM "LogHour" lh
    JOIN "DailyLog" dl ON lh."logId" = dl.id
    WHERE lh."employeeId" = ${employeeId}
      AND dl.status = 'approved'
      AND dl."approvedAt" >= ${payPeriodStart}
      AND dl."approvedAt" <= ${payPeriodEnd}
    GROUP BY lh.department
    ORDER BY total_hours DESC
  `;

  return result.map((row) => ({
    department: row.department as Department,
    totalHours: Number(row.total_hours),
    captainHours: Number(row.captain_hours),
    wingmanHours: Number(row.wingman_hours),
    coCaptainHours: Number(row.co_captain_hours),
  }));
}

/**
 * Get daily work breakdown for an employee in a pay period
 */
export async function getDailyWorkBreakdown(
  employeeId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
) {
  const result = await prisma.$queryRaw<
    Array<{
      log_date: Date;
      log_id: string;
      department: string;
      hours: bigint;
      is_co_captain: boolean;
      is_captain: boolean;
      daily_tips: bigint;
    }>
  >`
    SELECT 
      dl."logDate" as log_date,
      dl.id as log_id,
      lh.department,
      lh.hours,
      lh."isCoCaptain" as is_co_captain,
      (dl."captainId" = ${employeeId}) as is_captain,
      COALESCE(
        (SELECT SUM(lj.tips) 
         FROM "LogJob" lj 
         WHERE lj."logId" = dl.id 
           AND lj."jobType" = lh.department
        ) / NULLIF(
          (SELECT COUNT(DISTINCT lh2."employeeId") 
           FROM "LogHour" lh2 
           WHERE lh2."logId" = dl.id 
             AND lh2.department = lh.department
          ), 0
        ), 0
      ) as daily_tips
    FROM "LogHour" lh
    JOIN "DailyLog" dl ON lh."logId" = dl.id
    WHERE lh."employeeId" = ${employeeId}
      AND dl.status = 'approved'
      AND dl."approvedAt" >= ${payPeriodStart}
      AND dl."approvedAt" <= ${payPeriodEnd}
    ORDER BY dl."logDate" DESC, lh.department
  `;

  return result.map((row) => ({
    logDate: row.log_date,
    logId: row.log_id,
    department: row.department as Department,
    hours: Number(row.hours),
    isCoCaptain: row.is_co_captain,
    isCaptain: row.is_captain,
    dailyTips: Number(row.daily_tips),
  }));
}

/**
 * Get detailed tips breakdown for an employee in a pay period
 */
export async function getTipsBreakdown(
  employeeId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
) {
  const result = await prisma.$queryRaw<
    Array<{
      log_date: Date;
      log_id: string;
      job_id: string;
      client_name: string;
      job_type: string;
      job_tips: bigint;
      team_members: bigint;
      my_share: bigint;
    }>
  >`
    WITH employee_jobs AS (
      SELECT DISTINCT
        dl."logDate" as log_date,
        dl.id as log_id,
        lj."jobId" as job_id,
        lj."clientName" as client_name,
        lj."jobType" as job_type,
        lj.tips as job_tips,
        lh.department
      FROM "LogHour" lh
      JOIN "DailyLog" dl ON lh."logId" = dl.id
      JOIN "LogJob" lj ON lj."logId" = dl.id
      WHERE lh."employeeId" = ${employeeId}
        AND dl.status = 'approved'
        AND dl."approvedAt" >= ${payPeriodStart}
        AND dl."approvedAt" <= ${payPeriodEnd}
        AND lj."jobType" = lh.department
        AND lj.tips > 0
    ),
    team_counts AS (
      SELECT 
        ej.log_id,
        ej.job_type,
        COUNT(DISTINCT lh."employeeId") as team_members
      FROM employee_jobs ej
      JOIN "LogHour" lh ON lh."logId" = ej.log_id AND lh.department = ej.job_type
      GROUP BY ej.log_id, ej.job_type
    )
    SELECT 
      ej.log_date,
      ej.log_id,
      ej.job_id,
      ej.client_name,
      ej.job_type,
      ej.job_tips,
      tc.team_members,
      (ej.job_tips / tc.team_members) as my_share
    FROM employee_jobs ej
    JOIN team_counts tc ON tc.log_id = ej.log_id AND tc.job_type = ej.job_type
    ORDER BY ej.log_date DESC, ej.job_tips DESC
  `;

  return result.map((row) => ({
    logDate: row.log_date,
    logId: row.log_id,
    jobId: row.job_id,
    clientName: row.client_name,
    jobType: row.job_type as 'junk' | 'move',
    jobTips: Number(row.job_tips),
    teamMembers: Number(row.team_members),
    myShare: Number(row.my_share),
  }));
}

/**
 * Get payroll summary with department totals for an employee
 */
export async function getPayrollSummaryWithDepartments(
  employeeId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
) {
  const result = await prisma.$queryRaw<
    Array<{
      department: string;
      total_hours: bigint;
      gross_pay: bigint;
      tips: bigint;
    }>
  >`
    WITH department_hours AS (
      SELECT 
        lh.department,
        SUM(lh.hours) as total_hours,
        SUM(
          lh.hours * 
          CASE 
            WHEN lh.department = 'junk' THEN 
              CASE WHEN dl."captainId" = ${employeeId} OR lh."isCoCaptain" THEN u."rateJunkCaptain" 
              ELSE u."rateJunkWingman" END
            WHEN lh.department = 'move' THEN
              CASE WHEN dl."captainId" = ${employeeId} OR lh."isCoCaptain" THEN u."rateMoveCaptain" 
              ELSE u."rateMoveWingman" END
            WHEN lh.department = 'zigma' THEN u."rateZigma"
            WHEN lh.department = 'training' THEN u."rateTraining"
            WHEN lh.department = 'estimating' THEN u."rateEstimating"
            WHEN lh.department = 'warehouse' THEN u."rateWarehouse"
            WHEN lh.department = 'admin' THEN u."rateAdmin"
            ELSE 0
          END
        ) as gross_pay
      FROM "LogHour" lh
      JOIN "DailyLog" dl ON lh."logId" = dl.id
      JOIN "User" u ON lh."employeeId" = u.id
      WHERE lh."employeeId" = ${employeeId}
        AND dl.status = 'approved'
        AND dl."approvedAt" >= ${payPeriodStart}
        AND dl."approvedAt" <= ${payPeriodEnd}
      GROUP BY lh.department
    ),
    department_tips AS (
      SELECT 
        lh.department,
        COALESCE(SUM(
          lj.tips / NULLIF(
            (SELECT COUNT(DISTINCT lh2."employeeId") 
             FROM "LogHour" lh2 
             WHERE lh2."logId" = dl.id 
               AND lh2.department = lh.department
            ), 0
          )
        ), 0) as tips
      FROM "LogHour" lh
      JOIN "DailyLog" dl ON lh."logId" = dl.id
      JOIN "LogJob" lj ON lj."logId" = dl.id AND lj."jobType" = lh.department
      WHERE lh."employeeId" = ${employeeId}
        AND dl.status = 'approved'
        AND dl."approvedAt" >= ${payPeriodStart}
        AND dl."approvedAt" <= ${payPeriodEnd}
      GROUP BY lh.department
    )
    SELECT 
      dh.department,
      dh.total_hours,
      dh.gross_pay,
      COALESCE(dt.tips, 0) as tips
    FROM department_hours dh
    LEFT JOIN department_tips dt ON dh.department = dt.department
    ORDER BY dh.total_hours DESC
  `;

  return result.map((row) => ({
    department: row.department as Department,
    totalHours: Number(row.total_hours),
    grossPay: Number(row.gross_pay),
    tips: Number(row.tips),
  }));
}

/**
 * Get commission details for an employee in a pay period
 */
export async function getCommissionDetails(
  employeeId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
) {
  const commissions = await prisma.commissionEntry.findMany({
    where: {
      salesId: employeeId,
      status: 'matched',
      matchedLog: {
        approvedAt: {
          gte: payPeriodStart,
          lte: payPeriodEnd,
        },
      },
    },
    include: {
      matchedLog: {
        select: {
          id: true,
          logDate: true,
          approvedAt: true,
        },
      },
    },
    orderBy: {
      matchedLog: {
        logDate: 'desc',
      },
    },
  });

  return commissions.map((commission) => ({
    id: commission.id,
    jobId: commission.jobId,
    clientName: commission.clientName,
    jobType: commission.jobType,
    estimatedRevenue: Number(commission.estimatedRevenue),
    actualRevenue: Number(commission.actualRevenue || 0),
    commissionAmount: Number(commission.commissionAmount || 0),
    logDate: commission.matchedLog?.logDate,
    logId: commission.matchedLog?.id,
  }));
}

/**
 * Get bonus details for an employee in a pay period
 */
export async function getBonusDetails(
  employeeId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
) {
  // Fetch all approved logs for the captain in the pay period
  const logs = await prisma.dailyLog.findMany({
    where: {
      captainId: employeeId,
      status: 'approved',
      approvedAt: {
        gte: payPeriodStart,
        lte: payPeriodEnd,
      },
    },
    include: {
      jobs: true,
      hours: {
        include: {
          employee: {
            select: {
              id: true,
              rateJunkCaptain: true,
              rateJunkWingman: true,
              rateMoveCaptain: true,
              rateMoveWingman: true,
            },
          },
        },
      },
      captain: {
        select: {
          junkBonusGoal: true,
          moveBonusGoal: true,
        },
      },
    },
  });

  if (logs.length === 0) {
    return [];
  }

  // Use weekly aggregation approach for bonus calculation
  let totalJunkRevenue = 0;
  let totalJunkLaborCost = 0;
  let totalMoveRevenue = 0;
  let totalMoveLaborCost = 0;
  const junkBonusGoal = Number(logs[0].captain.junkBonusGoal) || 0.14;
  const moveBonusGoal = Number(logs[0].captain.moveBonusGoal) || 0.24;

  // Aggregate all sections across the pay period
  for (const log of logs) {
    // Aggregate revenue by job type
    for (const job of log.jobs) {
      if (job.jobType === 'junk') {
        totalJunkRevenue += Number(job.revenue);
      } else if (job.jobType === 'move') {
        totalMoveRevenue += Number(job.revenue);
      }
    }

    // Aggregate labor costs by department
    for (const hour of log.hours) {
      if (hour.department === 'junk') {
        const rate =
          log.captainId === hour.employeeId || hour.isCoCaptain
            ? Number(hour.employee.rateJunkCaptain || 0)
            : Number(hour.employee.rateJunkWingman || 0);
        totalJunkLaborCost += Number(hour.hours) * rate;
      } else if (hour.department === 'move') {
        const rate =
          log.captainId === hour.employeeId || hour.isCoCaptain
            ? Number(hour.employee.rateMoveCaptain || 0)
            : Number(hour.employee.rateMoveWingman || 0);
        totalMoveLaborCost += Number(hour.hours) * rate;
      }
    }
  }

  const bonusDetails = [];

  // Calculate weekly aggregated junk bonus
  if (totalJunkRevenue > 0) {
    const actualPercentage = totalJunkLaborCost / totalJunkRevenue;
    if (actualPercentage < junkBonusGoal) {
      const bonusAmount = (junkBonusGoal - actualPercentage) * totalJunkRevenue;
      bonusDetails.push({
        logId: 'aggregated-junk', // Indicates this is aggregated across multiple logs
        logDate: payPeriodStart, // Use pay period start as reference date
        sectionType: 'junk' as const,
        revenue: totalJunkRevenue,
        laborCost: totalJunkLaborCost,
        actualPercentage,
        goalPercentage: junkBonusGoal,
        bonusAmount,
      });
    }
  }

  // Calculate weekly aggregated move bonus
  if (totalMoveRevenue > 0) {
    const actualPercentage = totalMoveLaborCost / totalMoveRevenue;
    if (actualPercentage < moveBonusGoal) {
      const bonusAmount = (moveBonusGoal - actualPercentage) * totalMoveRevenue;
      bonusDetails.push({
        logId: 'aggregated-move', // Indicates this is aggregated across multiple logs
        logDate: payPeriodStart, // Use pay period start as reference date
        sectionType: 'move' as const,
        revenue: totalMoveRevenue,
        laborCost: totalMoveLaborCost,
        actualPercentage,
        goalPercentage: moveBonusGoal,
        bonusAmount,
      });
    }
  }

  return bonusDetails;
}

/**
 * Get work pattern analysis for an employee
 */
export async function getWorkPatternAnalysis(
  employeeId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
) {
  const result = await prisma.$queryRaw<
    Array<{
      total_days_worked: bigint;
      avg_hours_per_day: bigint;
      most_common_department: string;
      total_jobs_completed: bigint;
      avg_tips_per_day: bigint;
    }>
  >`
    WITH daily_stats AS (
      SELECT 
        dl."logDate" as log_date,
        SUM(lh.hours) as daily_hours,
        lh.department,
        COUNT(DISTINCT lj.id) as jobs_count,
        COALESCE(SUM(lj.tips) / NULLIF(COUNT(DISTINCT lh2."employeeId"), 0), 0) as daily_tips
      FROM "LogHour" lh
      JOIN "DailyLog" dl ON lh."logId" = dl.id
      LEFT JOIN "LogJob" lj ON lj."logId" = dl.id AND lj."jobType" = lh.department
      LEFT JOIN "LogHour" lh2 ON lh2."logId" = dl.id AND lh2.department = lh.department
      WHERE lh."employeeId" = ${employeeId}
        AND dl.status = 'approved'
        AND dl."approvedAt" >= ${payPeriodStart}
        AND dl."approvedAt" <= ${payPeriodEnd}
      GROUP BY dl."logDate", lh.department
    ),
    department_totals AS (
      SELECT 
        department,
        SUM(daily_hours) as total_hours
      FROM daily_stats
      GROUP BY department
      ORDER BY total_hours DESC
      LIMIT 1
    )
    SELECT 
      COUNT(DISTINCT log_date) as total_days_worked,
      AVG(daily_hours) as avg_hours_per_day,
      (SELECT department FROM department_totals LIMIT 1) as most_common_department,
      SUM(jobs_count) as total_jobs_completed,
      AVG(daily_tips) as avg_tips_per_day
    FROM daily_stats
  `;

  const stats = result[0];
  return {
    totalDaysWorked: Number(stats?.total_days_worked || 0),
    avgHoursPerDay: Number(stats?.avg_hours_per_day || 0),
    mostCommonDepartment:
      (stats?.most_common_department as Department) || 'admin',
    totalJobsCompleted: Number(stats?.total_jobs_completed || 0),
    avgTipsPerDay: Number(stats?.avg_tips_per_day || 0),
  };
}
