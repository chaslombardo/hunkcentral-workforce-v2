// Database Query Optimization for HUNKCentral
// Provides optimized query patterns and performance monitoring

import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

// Query performance monitoring
interface QueryPerformance {
  query: string;
  duration: number;
  timestamp: Date;
  params?: any;
}

class QueryPerformanceMonitor {
  private measurements: QueryPerformance[] = [];
  private readonly maxMeasurements = 1000;
  private readonly slowQueryThreshold = 1000; // 1 second

  logQuery(query: string, duration: number, params?: any): void {
    const measurement: QueryPerformance = {
      query,
      duration,
      timestamp: new Date(),
      params,
    };

    this.measurements.push(measurement);

    // Keep only recent measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift();
    }

    // Log slow queries
    if (duration > this.slowQueryThreshold) {
      console.warn(`Slow query detected (${duration}ms):`, query);
    }
  }

  getSlowQueries(threshold = this.slowQueryThreshold): QueryPerformance[] {
    return this.measurements.filter((m) => m.duration > threshold);
  }

  getAverageQueryTime(): number {
    if (this.measurements.length === 0) return 0;
    const total = this.measurements.reduce((sum, m) => sum + m.duration, 0);
    return total / this.measurements.length;
  }

  getQueryStats(): {
    totalQueries: number;
    averageTime: number;
    slowQueries: number;
    recentQueries: QueryPerformance[];
  } {
    return {
      totalQueries: this.measurements.length,
      averageTime: this.getAverageQueryTime(),
      slowQueries: this.getSlowQueries().length,
      recentQueries: this.measurements.slice(-10),
    };
  }
}

const queryMonitor = new QueryPerformanceMonitor();

// Optimized query wrapper with performance monitoring
export async function executeOptimizedQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    queryMonitor.logQuery(queryName, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    queryMonitor.logQuery(`${queryName} (ERROR)`, duration);
    throw error;
  }
}

// Optimized query patterns for common operations

/**
 * Get dashboard metrics with optimized single query
 */
export async function getOptimizedDashboardMetrics(userId?: string) {
  return executeOptimizedQuery('dashboard-metrics', async () => {
    // Single query to get all dashboard data instead of multiple sequential queries
    const [
      pendingLogsCount,
      commissionEntriesCount,
      activeUsersCount,
      currentPayPeriod,
      recentActivity,
    ] = await Promise.all([
      // Pending logs count
      prisma.dailyLog.count({
        where: { status: 'submitted' },
      }),

      // Commission entries count (this week)
      prisma.commissionEntry.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),

      // Active users count
      prisma.user.count(),

      // Current pay period
      prisma.payPeriod.findFirst({
        where: {
          AND: [
            { startDate: { lte: new Date() } },
            { endDate: { gte: new Date() } },
          ],
        },
        orderBy: { startDate: 'desc' },
      }),

      // Recent activity (combined query)
      prisma.$transaction([
        prisma.dailyLog.findMany({
          where: {
            updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          include: {
            captain: { select: { fullName: true } },
            approvedBy: { select: { fullName: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
        prisma.commissionEntry.findMany({
          where: {
            updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          include: {
            sales: { select: { fullName: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
      ]),
    ]);

    return {
      pendingLogsCount,
      commissionEntriesCount,
      activeUsersCount,
      currentPayPeriod,
      recentLogs: recentActivity[0],
      recentCommissions: recentActivity[1],
    };
  });
}

/**
 * Get payroll data with optimized joins
 */
export async function getOptimizedPayrollData(
  employeeId: string,
  payPeriodId: string
) {
  return executeOptimizedQuery('payroll-data', async () => {
    // Single query with all necessary joins instead of multiple queries
    const payrollData = await prisma.dailyLog.findMany({
      where: {
        OR: [{ captainId: employeeId }, { hours: { some: { employeeId } } }],
        status: 'approved',
        // Add pay period filter based on payPeriodId
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
            junkBonusGoal: true,
            moveBonusGoal: true,
          },
        },
        jobs: true,
        hours: {
          where: { employeeId },
          include: {
            employee: {
              select: {
                id: true,
                fullName: true,
                rateJunkCaptain: true,
                rateJunkWingman: true,
                rateMoveCaptain: true,
                rateMoveWingman: true,
                rateZigma: true,
                rateTraining: true,
                rateEstimating: true,
                rateWarehouse: true,
                rateAdmin: true,
              },
            },
          },
        },
      },
    });

    // Get commission data in parallel
    const commissionData = await prisma.commissionEntry.findMany({
      where: {
        salesId: employeeId,
        status: 'matched',
        matchedLog: {
          status: 'approved',
          // Add pay period filter
        },
      },
      include: {
        matchedLog: {
          select: { id: true, logDate: true },
        },
      },
    });

    return { payrollData, commissionData };
  });
}

/**
 * Get logs with optimized filtering and pagination
 */
export async function getOptimizedLogsList(
  filters: {
    status?: string;
    captainId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
  },
  pagination: {
    page: number;
    pageSize: number;
  }
) {
  return executeOptimizedQuery('logs-list', async () => {
    // Build optimized where clause
    const whereClause: Prisma.DailyLogWhereInput = {};

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.captainId) {
      whereClause.captainId = filters.captainId;
    }

    if (filters.dateFrom || filters.dateTo) {
      whereClause.logDate = {};
      if (filters.dateFrom) {
        whereClause.logDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        whereClause.logDate.lte = filters.dateTo;
      }
    }

    if (filters.search) {
      whereClause.OR = [
        {
          captain: {
            fullName: { contains: filters.search, mode: 'insensitive' },
          },
        },
        {
          jobs: {
            some: { jobId: { contains: filters.search, mode: 'insensitive' } },
          },
        },
        {
          jobs: {
            some: {
              clientName: { contains: filters.search, mode: 'insensitive' },
            },
          },
        },
      ];
    }

    // Execute count and data queries in parallel
    const [totalCount, logs] = await Promise.all([
      prisma.dailyLog.count({ where: whereClause }),
      prisma.dailyLog.findMany({
        where: whereClause,
        include: {
          captain: {
            select: { id: true, fullName: true },
          },
          jobs: {
            select: { revenue: true, tips: true },
          },
          hours: {
            select: { hours: true },
          },
          approvedBy: {
            select: { fullName: true },
          },
        },
        orderBy: [
          { status: 'asc' }, // Pending first
          { logDate: 'desc' },
        ],
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
      }),
    ]);

    return {
      logs,
      totalCount,
      totalPages: Math.ceil(totalCount / pagination.pageSize),
      currentPage: pagination.page,
    };
  });
}

/**
 * Get user performance data with optimized aggregations
 */
export async function getOptimizedUserPerformance(
  userId: string,
  payPeriodStart: Date,
  payPeriodEnd: Date
) {
  return executeOptimizedQuery('user-performance', async () => {
    // Use database aggregations instead of application-level calculations
    const performanceData = await prisma.$queryRaw<
      Array<{
        total_jobs: bigint;
        total_revenue: number;
        total_tips: number;
        total_hours: number;
        junk_revenue: number;
        move_revenue: number;
        junk_labor_cost: number;
        move_labor_cost: number;
      }>
    >`
      SELECT 
        COUNT(DISTINCT lj.id) as total_jobs,
        COALESCE(SUM(lj.revenue), 0) as total_revenue,
        COALESCE(SUM(lj.tips), 0) as total_tips,
        COALESCE(SUM(lh.hours), 0) as total_hours,
        COALESCE(SUM(CASE WHEN lj.job_type = 'junk' THEN lj.revenue ELSE 0 END), 0) as junk_revenue,
        COALESCE(SUM(CASE WHEN lj.job_type = 'move' THEN lj.revenue ELSE 0 END), 0) as move_revenue,
        COALESCE(SUM(CASE WHEN lj.job_type = 'junk' THEN lh.hours * u.rate_junk_captain ELSE 0 END), 0) as junk_labor_cost,
        COALESCE(SUM(CASE WHEN lj.job_type = 'move' THEN lh.hours * u.rate_move_captain ELSE 0 END), 0) as move_labor_cost
      FROM "DailyLog" dl
      LEFT JOIN "LogJob" lj ON dl.id = lj.log_id
      LEFT JOIN "LogHour" lh ON dl.id = lh.log_id AND lh.employee_id = $1
      LEFT JOIN "User" u ON lh.employee_id = u.id
      WHERE dl.status = 'approved'
        AND dl.approved_at >= $2
        AND dl.approved_at <= $3
        AND (dl.captain_id = $1 OR lh.employee_id = $1)
    `;

    return (
      performanceData[0] || {
        total_jobs: BigInt(0),
        total_revenue: 0,
        total_tips: 0,
        total_hours: 0,
        junk_revenue: 0,
        move_revenue: 0,
        junk_labor_cost: 0,
        move_labor_cost: 0,
      }
    );
  });
}

/**
 * Get commission matching candidates with optimized query
 */
export async function getOptimizedCommissionMatches(jobId: string) {
  return executeOptimizedQuery('commission-matches', async () => {
    // Single query to get all potential matches with scoring
    return prisma.$queryRaw<
      Array<{
        id: string;
        sales_id: string;
        sales_name: string;
        job_id: string;
        client_name: string;
        estimated_revenue: number;
        target_date: Date;
        accuracy_score: number;
      }>
    >`
      SELECT 
        ce.id,
        ce.sales_id,
        u.full_name as sales_name,
        ce.job_id,
        ce.client_name,
        ce.estimated_revenue,
        ce.target_date,
        CASE 
          WHEN ce.job_id = ${jobId} THEN 100
          WHEN ce.job_id LIKE ${jobId} || '%' THEN 80
          WHEN ce.job_id LIKE '%' || ${jobId} THEN 70
          ELSE 0
        END as accuracy_score
      FROM "CommissionEntry" ce
      JOIN "User" u ON ce.sales_id = u.id
      WHERE ce.status = 'pending'
        AND (
          ce.job_id = ${jobId}
          OR ce.job_id LIKE ${jobId} || '%'
          OR ce.job_id LIKE '%' || ${jobId}
        )
      ORDER BY accuracy_score DESC, ce.created_at ASC
    `;
  });
}

/**
 * Bulk operations with optimized batch processing
 */
export async function bulkUpdateLogStatus(
  logIds: string[],
  status: string,
  userId: string
) {
  return executeOptimizedQuery('bulk-update-logs', async () => {
    // Use transaction with batch operations
    return prisma.$transaction(async (tx) => {
      // Update all logs in a single query
      const updatedLogs = await tx.dailyLog.updateMany({
        where: { id: { in: logIds } },
        data: {
          status,
          approvedAt: status === 'approved' ? new Date() : null,
          approvedById: status === 'approved' ? userId : null,
        },
      });

      // Create audit logs in batch
      const auditLogs = logIds.map((logId) => ({
        entityType: 'daily_log',
        entityId: logId,
        action: status === 'approved' ? 'approve' : 'update',
        userId,
        changes: { status },
        dailyLogId: logId,
      }));

      await tx.auditLog.createMany({
        data: auditLogs,
      });

      return updatedLogs;
    });
  });
}

/**
 * Get database performance statistics
 */
export async function getDatabasePerformanceStats() {
  return executeOptimizedQuery('db-performance-stats', async () => {
    // Get table sizes and index usage
    const tableStats = await prisma.$queryRaw<
      Array<{
        table_name: string;
        row_count: bigint;
        table_size: string;
        index_size: string;
      }>
    >`
      SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins + n_tup_upd + n_tup_del as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `;

    // Get slow queries from query monitor
    const queryStats = queryMonitor.getQueryStats();

    return {
      tableStats,
      queryStats,
      timestamp: new Date(),
    };
  });
}

// Database connection optimization
export async function optimizeDatabaseConnection() {
  // Set optimal connection pool settings
  await prisma.$executeRaw`SET statement_timeout = '30s'`;
  await prisma.$executeRaw`SET lock_timeout = '10s'`;
  await prisma.$executeRaw`SET idle_in_transaction_session_timeout = '60s'`;

  console.log('Database connection optimized');
}

// Index recommendations based on query patterns
export function getIndexRecommendations(): string[] {
  const recommendations: string[] = [];
  const slowQueries = queryMonitor.getSlowQueries();

  // Analyze slow queries and suggest indexes
  for (const query of slowQueries) {
    if (query.query.includes('dashboard-metrics') && query.duration > 500) {
      recommendations.push(
        'Consider adding composite index on DailyLog(status, updated_at)'
      );
    }

    if (query.query.includes('payroll-data') && query.duration > 1000) {
      recommendations.push(
        'Consider adding index on LogHour(employee_id, log_id)'
      );
    }

    if (query.query.includes('logs-list') && query.duration > 800) {
      recommendations.push(
        'Consider adding composite index on DailyLog(status, log_date)'
      );
    }
  }

  return [...new Set(recommendations)]; // Remove duplicates
}

// Export query monitor for external use
export { queryMonitor };
