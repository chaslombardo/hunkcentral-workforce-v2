// Metrics Calculator for Pre-computed Analytics
// Handles calculation of dashboard, payroll, and performance metrics

import { prisma } from './prisma';
import { calculateOverallTotals } from './logCalculations';
import { calculateEnhancedPayroll } from './payCalculator';

export interface DashboardMetrics {
  // Captain metrics
  captain?: {
    totalJobs: number;
    totalRevenue: number;
    totalTips: number;
    totalHours: number;
    laborBonus: number;
    junkLaborCostPercent: number;
    moveLaborCostPercent: number;
    averageJobSize: number;
    jobsByType: { junk: number; move: number };
    recentLogs: any[];
  };

  // Manager metrics
  manager?: {
    pendingApprovals: number;
    teamPerformance: any[];
    laborCostTrends: any[];
    exceptionAlerts: any[];
    teamSummary: {
      totalEmployees: number;
      activeToday: number;
      avgLaborCost: number;
    };
  };

  // Sales metrics
  sales?: {
    totalCommissions: number;
    pendingCommissions: number;
    matchedCommissions: number;
    bookingAccuracy: number;
    conversionRate: number;
    pipelineValue: number;
    recentBookings: any[];
  };

  // Admin metrics
  admin?: {
    systemHealth: {
      activeUsers: number;
      logsToday: number;
      errorRate: number;
      avgResponseTime: number;
    };
    userActivity: any[];
    payrollStatus: any[];
    alerts: any[];
  };
}

export interface PayrollMetrics {
  userId: string;
  payPeriodId: string;
  totalEarnings: number;
  baseHours: number;
  totalTips: number;
  laborBonus: number;
  commission: number;
  salary: number;
  breakdown: {
    hourlyEarnings: number;
    tipEarnings: number;
    bonusEarnings: number;
    commissionEarnings: number;
    salaryEarnings: number;
  };
  performance: {
    totalJobs: number;
    avgLaborCost: number;
    efficiency: number;
    ranking: number;
  };
}

export interface LaborCostMetrics {
  payPeriodId: string;
  department?: string;
  totalRevenue: number;
  totalLaborCost: number;
  laborCostPercent: number;
  goalPercent: number;
  variance: number;
  trends: Array<{
    date: string;
    revenue: number;
    laborCost: number;
    percent: number;
  }>;
  topPerformers: Array<{
    userId: string;
    name: string;
    laborCostPercent: number;
    revenue: number;
  }>;
}

export interface UserPerformanceMetrics {
  userId: string;
  payPeriodId?: string;
  rankings: {
    revenue: { rank: number; total: number; value: number };
    efficiency: { rank: number; total: number; value: number };
    productivity: { rank: number; total: number; value: number };
    tips: { rank: number; total: number; value: number };
  };
  trends: Array<{
    date: string;
    revenue: number;
    laborCost: number;
    tips: number;
    jobs: number;
  }>;
  goals: {
    junkLaborGoal: number;
    moveLaborGoal: number;
    currentJunkPercent: number;
    currentMovePercent: number;
  };
}

// Main calculation function
export async function calculatePrecomputedMetrics(
  metricType: string,
  payload: any
): Promise<void> {
  console.log(`Computing ${metricType} metrics with payload:`, payload);

  try {
    let data: any;
    let entityType: string | null = null;
    let entityId: string | null = null;

    switch (metricType) {
      case 'dashboard':
        data = await calculateDashboardMetrics(payload.userId, payload.payPeriodId);
        entityType = payload.userId ? 'user' : 'global';
        entityId = payload.userId || null;
        break;

      case 'payroll':
        data = await calculatePayrollMetrics(payload.payPeriodId, payload.userId);
        entityType = 'user';
        entityId = payload.userId;
        break;

      case 'labor_costs':
        data = await calculateLaborCostMetrics(payload.payPeriodId, payload.department);
        entityType = payload.department ? 'department' : 'global';
        entityId = payload.department || null;
        break;

      case 'commission':
        data = await calculateCommissionMetrics(payload.userId, payload.payPeriodId);
        entityType = 'user';
        entityId = payload.userId;
        break;

      case 'user_performance':
        data = await calculateUserPerformanceMetrics(payload.userId, payload.payPeriodId);
        entityType = 'user';
        entityId = payload.userId;
        break;

      default:
        throw new Error(`Unknown metric type: ${metricType}`);
    }

    // Store computed metrics
    await storePrecomputedMetric({
      metricType,
      entityType,
      entityId,
      data,
      payPeriodId: payload.payPeriodId,
      department: payload.department,
    });

    console.log(`Successfully computed ${metricType} metrics`);
  } catch (error) {
    console.error(`Error computing ${metricType} metrics:`, error);
    throw error;
  }
}

// Dashboard metrics calculation
async function calculateDashboardMetrics(
  userId?: string,
  payPeriodId?: string
): Promise<DashboardMetrics> {
  const user = userId ? await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roles: true, fullName: true },
  }) : null;

  const metrics: DashboardMetrics = {};

  // Get current pay period if not specified
  const currentPayPeriod = payPeriodId ? 
    await prisma.payPeriod.findUnique({ where: { id: payPeriodId } }) :
    await prisma.payPeriod.findFirst({
      where: { status: 'open' },
      orderBy: { startDate: 'desc' },
    });

  if (!currentPayPeriod) {
    throw new Error('No active pay period found');
  }

  // Captain metrics
  if (!user || user.roles.includes('captain')) {
    metrics.captain = await calculateCaptainMetrics(userId, currentPayPeriod.id);
  }

  // Manager metrics
  if (!user || user.roles.includes('manager')) {
    metrics.manager = await calculateManagerMetrics(currentPayPeriod.id);
  }

  // Sales metrics
  if (!user || user.roles.includes('sales')) {
    metrics.sales = await calculateSalesMetrics(userId, currentPayPeriod.id);
  }

  // Admin metrics
  if (!user || user.roles.includes('admin')) {
    metrics.admin = await calculateAdminMetrics(currentPayPeriod.id);
  }

  return metrics;
}

// Captain-specific metrics
async function calculateCaptainMetrics(userId?: string, payPeriodId?: string) {
  const whereClause: any = {};
  if (userId) whereClause.captainId = userId;
  if (payPeriodId) {
    const payPeriod = await prisma.payPeriod.findUnique({
      where: { id: payPeriodId },
    });
    if (payPeriod) {
      whereClause.logDate = {
        gte: payPeriod.startDate,
        lte: payPeriod.endDate,
      };
    }
  }

  const logs = await prisma.dailyLog.findMany({
    where: { ...whereClause, status: 'approved' },
    include: {
      jobs: true,
      hours: { include: { employee: true } },
      captain: true,
    },
  });

  let totalRevenue = 0;
  let totalTips = 0;
  let totalHours = 0;
  const laborBonus = 0;
  let junkRevenue = 0;
  let moveRevenue = 0;
  const junkLaborCost = 0;
  const moveLaborCost = 0;
  const jobsByType = { junk: 0, move: 0 };

  for (const log of logs) {
    // Create simplified totals calculation
    const logRevenue = log.jobs.reduce((sum, job) => sum + Number(job.revenue), 0);
    const logTips = log.jobs.reduce((sum, job) => sum + Number(job.tips), 0);
    const logHours = log.hours.reduce((sum, hour) => sum + Number(hour.hours), 0);
    
    totalRevenue += logRevenue;
    totalTips += logTips;
    totalHours += logHours;
    // TODO: Calculate labor bonus properly

    // Job type breakdown
    for (const job of log.jobs) {
      if (job.jobType === 'junk') {
        junkRevenue += Number(job.revenue);
        jobsByType.junk++;
      } else if (job.jobType === 'move') {
        moveRevenue += Number(job.revenue);
        jobsByType.move++;
      }
    }

    // TODO: Calculate labor cost by type properly
    // junkLaborCost += totals.junkLaborCost;
    // moveLaborCost += totals.moveLaborCost;
  }

  const totalJobs = jobsByType.junk + jobsByType.move;
  const averageJobSize = totalJobs > 0 ? totalRevenue / totalJobs : 0;
  const junkLaborCostPercent = junkRevenue > 0 ? (junkLaborCost / junkRevenue) * 100 : 0;
  const moveLaborCostPercent = moveRevenue > 0 ? (moveLaborCost / moveRevenue) * 100 : 0;

  // Recent logs for quick access
  const recentLogs = logs
    .sort((a, b) => b.logDate.getTime() - a.logDate.getTime())
    .slice(0, 5)
    .map(log => ({
      id: log.id,
      date: log.logDate,
      status: log.status,
      revenue: log.jobs.reduce((sum, job) => sum + Number(job.revenue), 0),
      tips: log.jobs.reduce((sum, job) => sum + Number(job.tips), 0),
      jobs: log.jobs.length,
    }));

  return {
    totalJobs,
    totalRevenue,
    totalTips,
    totalHours,
    laborBonus,
    junkLaborCostPercent,
    moveLaborCostPercent,
    averageJobSize,
    jobsByType,
    recentLogs,
  };
}

// Manager-specific metrics
async function calculateManagerMetrics(payPeriodId: string) {
  // Pending approvals
  const pendingApprovals = await prisma.dailyLog.count({
    where: { status: 'submitted' },
  });

  // Team performance (top performers)
  const teamPerformance = await prisma.dailyLog.findMany({
    where: { 
      status: 'approved',
      // Add pay period filter if needed
    },
    include: {
      captain: { select: { id: true, fullName: true } },
      jobs: true,
    },
    take: 10,
  });

  // Exception alerts (logs with high labor costs)
  const exceptionAlerts = await prisma.dailyLog.findMany({
    where: { 
      status: 'submitted',
      // Add conditions for high labor costs
    },
    include: {
      captain: { select: { fullName: true } },
      jobs: true,
    },
    take: 5,
  });

  // Team summary
  const totalEmployees = await prisma.user.count({
    where: { roles: { hasSome: ['captain', 'wingman'] } },
  });

  const activeToday = await prisma.dailyLog.count({
    where: {
      logDate: new Date(),
      status: { in: ['submitted', 'approved'] },
    },
  });

  return {
    pendingApprovals,
    teamPerformance: teamPerformance.map(log => ({
      captainName: log.captain.fullName,
      revenue: log.jobs.reduce((sum, job) => sum + Number(job.revenue), 0),
      jobs: log.jobs.length,
      date: log.logDate,
    })),
    laborCostTrends: [], // TODO: Implement trend calculation
    exceptionAlerts: exceptionAlerts.map(log => ({
      captainName: log.captain.fullName,
      date: log.logDate,
      issue: 'High labor cost detected',
      severity: 'medium',
    })),
    teamSummary: {
      totalEmployees,
      activeToday,
      avgLaborCost: 0, // TODO: Calculate average
    },
  };
}

// Sales-specific metrics
async function calculateSalesMetrics(userId?: string, payPeriodId?: string) {
  const whereClause: any = {};
  if (userId) whereClause.salesId = userId;

  const commissions = await prisma.commissionEntry.findMany({
    where: whereClause,
    include: { matchedLog: true },
  });

  const totalCommissions = commissions
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0);

  const pendingCommissions = commissions.filter(c => c.status === 'pending').length;
  const matchedCommissions = commissions.filter(c => c.status === 'matched').length;

  const totalBookings = commissions.length;
  const matchedBookings = commissions.filter(c => c.matchedLogId).length;
  const bookingAccuracy = totalBookings > 0 ? (matchedBookings / totalBookings) * 100 : 0;

  const pipelineValue = commissions
    .filter(c => c.status === 'pending')
    .reduce((sum, c) => sum + Number(c.estimatedRevenue), 0);

  const recentBookings = commissions
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5)
    .map(c => ({
      id: c.id,
      clientName: c.clientName,
      estimatedRevenue: c.estimatedRevenue,
      status: c.status,
      targetDate: c.targetDate,
    }));

  return {
    totalCommissions,
    pendingCommissions,
    matchedCommissions,
    bookingAccuracy,
    conversionRate: bookingAccuracy, // Simplified
    pipelineValue,
    recentBookings,
  };
}

// Admin-specific metrics
async function calculateAdminMetrics(payPeriodId: string) {
  const activeUsers = await prisma.user.count();
  
  const logsToday = await prisma.dailyLog.count({
    where: {
      logDate: new Date(),
    },
  });

  // System health metrics (simplified)
  const systemHealth = {
    activeUsers,
    logsToday,
    errorRate: 0, // TODO: Implement error tracking
    avgResponseTime: 0, // TODO: Implement performance tracking
  };

  return {
    systemHealth,
    userActivity: [], // TODO: Implement user activity tracking
    payrollStatus: [], // TODO: Implement payroll status tracking
    alerts: [], // TODO: Implement system alerts
  };
}

// Payroll metrics calculation
async function calculatePayrollMetrics(
  payPeriodId: string,
  userId?: string
): Promise<PayrollMetrics[]> {
  const whereClause: any = {};
  if (userId) whereClause.id = userId;

  const users = await prisma.user.findMany({
    where: whereClause,
    select: { 
      id: true, 
      fullName: true, 
      roles: true,
      salaryAmount: true,
      salaryType: true,
      salaryFrequency: true,
    },
  });

  const payrollMetrics: PayrollMetrics[] = [];

  for (const user of users) {
    // Get user's logs for the pay period
    const userLogs = await prisma.dailyLog.findMany({
      where: {
        captainId: user.id,
        status: 'approved',
        // Add pay period date filter here
      },
      include: { 
        jobs: true, 
        hours: { include: { employee: true } },
        captain: true 
      },
    });
    
    // Get commission entries for the user
    const commissionEntries = await prisma.commissionEntry.findMany({
      where: { 
        salesId: user.id,
        status: 'approved'
      },
      include: { matchedLog: true },
    });

    // Calculate basic payroll metrics
    const totalHours = userLogs.reduce((sum, log) => 
      sum + log.hours.filter(h => h.employeeId === user.id)
        .reduce((hourSum, hour) => hourSum + Number(hour.hours), 0), 0
    );

    const totalRevenue = userLogs.reduce((sum, log) => 
      sum + log.jobs.reduce((jobSum, job) => jobSum + Number(job.revenue), 0), 0
    );

    const totalTips = userLogs.reduce((sum, log) => 
      sum + log.jobs.reduce((jobSum, job) => jobSum + Number(job.tips), 0), 0
    );

    const totalCommission = commissionEntries.reduce((sum, entry) => 
      sum + Number(entry.commissionAmount || 0), 0
    );

    const totalJobs = userLogs.reduce((sum, log) => sum + log.jobs.length, 0);
    
    payrollMetrics.push({
      userId: user.id,
      payPeriodId,
      totalEarnings: totalRevenue, // Simplified
      baseHours: totalHours,
      totalTips,
      laborBonus: 0, // TODO: Calculate properly
      commission: totalCommission,
      salary: Number(user.salaryAmount || 0),
      breakdown: {
        hourlyEarnings: 0, // TODO: Calculate properly
        tipEarnings: totalTips,
        bonusEarnings: 0, // TODO: Calculate properly
        commissionEarnings: totalCommission,
        salaryEarnings: Number(user.salaryAmount || 0),
      },
      performance: {
        totalJobs,
        avgLaborCost: 0, // TODO: Calculate properly
        efficiency: 0, // TODO: Calculate properly
        ranking: 0, // TODO: Calculate ranking
      },
    });
  }

  return payrollMetrics;
}

// Labor cost metrics calculation
async function calculateLaborCostMetrics(
  payPeriodId: string,
  department?: string
): Promise<LaborCostMetrics> {
  const payPeriod = await prisma.payPeriod.findUnique({
    where: { id: payPeriodId },
  });

  if (!payPeriod) {
    throw new Error('Pay period not found');
  }

  const logs = await prisma.dailyLog.findMany({
    where: {
      status: 'approved',
      logDate: {
        gte: payPeriod.startDate,
        lte: payPeriod.endDate,
      },
    },
    include: {
      jobs: true,
      hours: { include: { employee: true } },
      captain: true,
    },
  });

  let totalRevenue = 0;
  let totalLaborCost = 0;

  for (const log of logs) {
    const logRevenue = log.jobs.reduce((sum, job) => sum + Number(job.revenue), 0);
    // TODO: Calculate labor cost properly
    const logLaborCost = 0; // Placeholder
    
    totalRevenue += logRevenue;
    totalLaborCost += logLaborCost;
  }

  const laborCostPercent = totalRevenue > 0 ? (totalLaborCost / totalRevenue) * 100 : 0;
  const goalPercent = department === 'junk' ? 14 : department === 'move' ? 24 : 19; // Average
  const variance = laborCostPercent - goalPercent;

  // TODO: Implement trends and top performers calculation

  return {
    payPeriodId,
    department,
    totalRevenue,
    totalLaborCost,
    laborCostPercent,
    goalPercent,
    variance,
    trends: [],
    topPerformers: [],
  };
}

// Commission metrics calculation
async function calculateCommissionMetrics(
  userId?: string,
  payPeriodId?: string
) {
  // Implementation similar to sales metrics but more detailed
  return await calculateSalesMetrics(userId, payPeriodId);
}

// User performance metrics calculation
async function calculateUserPerformanceMetrics(
  userId: string,
  payPeriodId?: string
): Promise<UserPerformanceMetrics> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { junkBonusGoal: true, moveBonusGoal: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // TODO: Implement comprehensive performance ranking calculation
  
  return {
    userId,
    payPeriodId,
    rankings: {
      revenue: { rank: 0, total: 0, value: 0 },
      efficiency: { rank: 0, total: 0, value: 0 },
      productivity: { rank: 0, total: 0, value: 0 },
      tips: { rank: 0, total: 0, value: 0 },
    },
    trends: [],
    goals: {
      junkLaborGoal: Number(user.junkBonusGoal) * 100,
      moveLaborGoal: Number(user.moveBonusGoal) * 100,
      currentJunkPercent: 0,
      currentMovePercent: 0,
    },
  };
}

// Store computed metrics in database
async function storePrecomputedMetric({
  metricType,
  entityType,
  entityId,
  data,
  payPeriodId,
  department,
}: {
  metricType: string;
  entityType: string | null;
  entityId: string | null;
  data: any;
  payPeriodId?: string;
  department?: string;
}): Promise<void> {
  await prisma.precomputedMetric.upsert({
    where: {
      metricType_entityType_entityId_payPeriodId_department: {
        metricType,
        entityType: entityType || '',
        entityId: entityId || '',
        payPeriodId: payPeriodId || '',
        department: department || '',
      },
    },
    update: {
      data,
      computedAt: new Date(),
      version: { increment: 1 },
    },
    create: {
      metricType,
      entityType,
      entityId,
      data,
      payPeriodId,
      department,
      computedAt: new Date(),
      version: 1,
    },
  });
}

// Retrieve cached metrics
export async function getCachedMetrics(
  metricType: string,
  entityType?: string,
  entityId?: string,
  payPeriodId?: string,
  department?: string
): Promise<any | null> {
  const metric = await prisma.precomputedMetric.findFirst({
    where: {
      metricType,
      entityType: entityType || null,
      entityId: entityId || null,
      payPeriodId: payPeriodId || null,
      department: department || null,
    },
    orderBy: { computedAt: 'desc' },
  });

  return metric?.data || null;
}

// Check if metrics are fresh (within threshold)
export function areMetricsFresh(
  computedAt: Date,
  thresholdMinutes = 30
): boolean {
  const now = new Date();
  const diffMs = now.getTime() - computedAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= thresholdMinutes;
}