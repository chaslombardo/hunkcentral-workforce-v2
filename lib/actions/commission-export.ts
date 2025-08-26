'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DataExporter, EmailReporter } from '@/lib/export-utils';
import { convertCommissionDecimalFields } from '@/lib/decimal-utils';
import { format } from 'date-fns';

export interface CommissionExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  salesConsultant?: string;
  includeCalculations?: boolean;
  includeProjections?: boolean;
}

export interface CommissionReportData {
  id: string;
  jobId: string;
  clientName: string;
  jobType: string;
  salesConsultant: string;
  estimatedRevenue: number;
  actualRevenue: number | null;
  commissionRate: number;
  commissionAmount: number | null;
  status: string;
  bookingAccuracy: number | null;
  createdAt: Date;
  targetDate: Date;
  matchedAt: Date | null;
  approvedAt: Date | null;
}

export async function exportCommissionData(options: CommissionExportOptions) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check permissions
    const canExport =
      session.user.roles?.includes('admin') ||
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('sales');

    if (!canExport) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Build query filters
    const whereClause: any = {};

    if (options.dateRange) {
      whereClause.createdAt = {
        gte: options.dateRange.start,
        lte: options.dateRange.end,
      };
    }

    if (options.status && options.status.length > 0) {
      whereClause.status = {
        in: options.status,
      };
    }

    if (options.salesConsultant) {
      whereClause.salesId = options.salesConsultant;
    }

    // If user is sales consultant, only show their entries
    if (
      session.user.roles?.includes('sales') &&
      !session.user.roles?.includes('manager') &&
      !session.user.roles?.includes('admin')
    ) {
      whereClause.salesId = session.user.id;
    }

    // Fetch commission data
    const commissionEntries = await prisma.commissionEntry.findMany({
      where: whereClause,
      include: {
        sales: {
          select: {
            fullName: true,
            email: true,
            commissionRate: true,
          },
        },
        matchedLog: {
          select: {
            id: true,
            logDate: true,
            approvedAt: true,
            captain: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert and format data
    const reportData: CommissionReportData[] = commissionEntries.map(
      (entry) => {
        const converted = convertCommissionDecimalFields(entry);

        // Calculate booking accuracy
        let bookingAccuracy: number | null = null;
        if (converted.actualRevenue && converted.estimatedRevenue > 0) {
          bookingAccuracy =
            (Math.min(converted.estimatedRevenue, converted.actualRevenue) /
              Math.max(converted.estimatedRevenue, converted.actualRevenue)) *
            100;
        }

        return {
          id: converted.id,
          jobId: converted.jobId,
          clientName: converted.clientName,
          jobType: converted.jobType,
          salesConsultant: entry.sales.fullName,
          estimatedRevenue: converted.estimatedRevenue,
          actualRevenue: converted.actualRevenue,
          commissionRate: Number(entry.sales.commissionRate) || 0,
          commissionAmount: converted.commissionAmount,
          status: converted.status,
          bookingAccuracy,
          createdAt: converted.createdAt,
          targetDate: converted.targetDate,
          matchedAt: entry.matchedLog?.approvedAt || null,
          approvedAt: converted.approvedAt,
        };
      }
    );

    // Define export columns
    const columns = [
      { accessorKey: 'jobId', header: 'Job ID' },
      { accessorKey: 'clientName', header: 'Client Name' },
      { accessorKey: 'jobType', header: 'Job Type' },
      { accessorKey: 'salesConsultant', header: 'Sales Consultant' },
      { accessorKey: 'estimatedRevenue', header: 'Estimated Revenue' },
      { accessorKey: 'actualRevenue', header: 'Actual Revenue' },
      { accessorKey: 'commissionRate', header: 'Commission Rate (%)' },
      { accessorKey: 'commissionAmount', header: 'Commission Amount' },
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'bookingAccuracy', header: 'Booking Accuracy (%)' },
      { accessorKey: 'createdAt', header: 'Created Date' },
      { accessorKey: 'targetDate', header: 'Target Date' },
      { accessorKey: 'matchedAt', header: 'Matched Date' },
      { accessorKey: 'approvedAt', header: 'Approved Date' },
    ];

    // Add calculation breakdown if requested
    if (options.includeCalculations) {
      const calculationData = reportData.map((entry) => ({
        ...entry,
        revenueVariance: entry.actualRevenue
          ? entry.actualRevenue - entry.estimatedRevenue
          : null,
        revenueVariancePercent:
          entry.actualRevenue && entry.estimatedRevenue > 0
            ? ((entry.actualRevenue - entry.estimatedRevenue) /
                entry.estimatedRevenue) *
              100
            : null,
        projectedCommission:
          entry.estimatedRevenue * (entry.commissionRate / 100),
        commissionVariance:
          entry.commissionAmount && entry.estimatedRevenue > 0
            ? entry.commissionAmount -
              entry.estimatedRevenue * (entry.commissionRate / 100)
            : null,
      }));

      columns.push(
        { accessorKey: 'revenueVariance', header: 'Revenue Variance' },
        {
          accessorKey: 'revenueVariancePercent',
          header: 'Revenue Variance (%)',
        },
        { accessorKey: 'projectedCommission', header: 'Projected Commission' },
        { accessorKey: 'commissionVariance', header: 'Commission Variance' }
      );

      return {
        success: true,
        data: calculationData,
        columns,
        summary: generateCommissionSummary(calculationData),
      };
    }

    return {
      success: true,
      data: reportData,
      columns,
      summary: generateCommissionSummary(reportData),
    };
  } catch (error) {
    console.error('Commission export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

export async function emailCommissionReport(
  options: CommissionExportOptions & {
    recipients: string[];
    subject: string;
    message: string;
  }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check permissions
    const canEmail =
      session.user.roles?.includes('admin') ||
      session.user.roles?.includes('manager');

    if (!canEmail) {
      return {
        success: false,
        error: 'Insufficient permissions to email reports',
      };
    }

    // Get export data
    const exportResult = await exportCommissionData(options);

    if (!exportResult.success) {
      return exportResult;
    }

    // Send email report
    const emailReporter = new EmailReporter();
    await emailReporter.sendReport({
      recipients: options.recipients,
      subject: options.subject,
      message: options.message,
      format: options.format,
      data: exportResult.data!,
      columns: exportResult.columns!,
    });

    return { success: true };
  } catch (error) {
    console.error('Email commission report error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email failed',
    };
  }
}

export async function getCommissionAnalyticsData(dateRange?: {
  start: Date;
  end: Date;
}) {
  try {
    const session = await auth();

    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Build query filters
    const whereClause: any = {};

    if (dateRange) {
      whereClause.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    // If user is sales consultant, only show their data
    if (
      session.user.roles?.includes('sales') &&
      !session.user.roles?.includes('manager') &&
      !session.user.roles?.includes('admin')
    ) {
      whereClause.salesId = session.user.id;
    }

    // Get commission entries with analytics
    const entries = await prisma.commissionEntry.findMany({
      where: whereClause,
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            commissionRate: true,
          },
        },
        matchedLog: {
          select: {
            id: true,
            logDate: true,
            approvedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate analytics
    const analytics = {
      totalEntries: entries.length,
      pendingEntries: entries.filter((e) => e.status === 'pending').length,
      matchedEntries: entries.filter((e) => e.status === 'matched').length,
      approvedEntries: entries.filter((e) => e.status === 'approved').length,
      rejectedEntries: entries.filter((e) => e.status === 'rejected').length,

      totalEstimatedRevenue: entries.reduce(
        (sum, e) => sum + Number(e.estimatedRevenue),
        0
      ),
      totalActualRevenue: entries.reduce(
        (sum, e) => sum + (Number(e.actualRevenue) || 0),
        0
      ),
      totalCommissionEarned: entries.reduce(
        (sum, e) => sum + (Number(e.commissionAmount) || 0),
        0
      ),

      conversionRate:
        entries.length > 0
          ? (entries.filter(
              (e) => e.status === 'matched' || e.status === 'approved'
            ).length /
              entries.length) *
            100
          : 0,

      avgBookingAccuracy: calculateAverageBookingAccuracy(entries),

      topPerformers: await getTopCommissionPerformers(whereClause),

      monthlyTrends: await getCommissionMonthlyTrends(whereClause),
    };

    return {
      success: true,
      data: analytics,
    };
  } catch (error) {
    console.error('Commission analytics error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Analytics failed',
    };
  }
}

function generateCommissionSummary(data: CommissionReportData[]) {
  const totalEntries = data.length;
  const pendingEntries = data.filter((e) => e.status === 'pending').length;
  const matchedEntries = data.filter((e) => e.status === 'matched').length;
  const approvedEntries = data.filter((e) => e.status === 'approved').length;

  const totalEstimated = data.reduce((sum, e) => sum + e.estimatedRevenue, 0);
  const totalActual = data.reduce((sum, e) => sum + (e.actualRevenue || 0), 0);
  const totalCommission = data.reduce(
    (sum, e) => sum + (e.commissionAmount || 0),
    0
  );

  const avgAccuracy = data
    .filter((e) => e.bookingAccuracy !== null)
    .reduce((sum, e, _, arr) => sum + e.bookingAccuracy! / arr.length, 0);

  return {
    totalEntries,
    pendingEntries,
    matchedEntries,
    approvedEntries,
    conversionRate:
      totalEntries > 0
        ? ((matchedEntries + approvedEntries) / totalEntries) * 100
        : 0,
    totalEstimated,
    totalActual,
    totalCommission,
    avgAccuracy: avgAccuracy || 0,
    revenueVariance: totalActual - totalEstimated,
    revenueVariancePercent:
      totalEstimated > 0
        ? ((totalActual - totalEstimated) / totalEstimated) * 100
        : 0,
  };
}

function calculateAverageBookingAccuracy(entries: any[]): number {
  const entriesWithAccuracy = entries.filter(
    (e) => e.actualRevenue && Number(e.estimatedRevenue) > 0
  );

  if (entriesWithAccuracy.length === 0) return 0;

  const totalAccuracy = entriesWithAccuracy.reduce((sum, entry) => {
    const estimated = Number(entry.estimatedRevenue);
    const actual = Number(entry.actualRevenue);
    const accuracy =
      (Math.min(estimated, actual) / Math.max(estimated, actual)) * 100;
    return sum + accuracy;
  }, 0);

  return totalAccuracy / entriesWithAccuracy.length;
}

async function getTopCommissionPerformers(whereClause: any) {
  const performers = await prisma.commissionEntry.groupBy({
    by: ['salesId'],
    where: {
      ...whereClause,
      status: { in: ['matched', 'approved'] },
    },
    _sum: {
      commissionAmount: true,
      actualRevenue: true,
    },
    _count: {
      id: true,
    },
  });

  // Get user details
  const performersWithDetails = await Promise.all(
    performers.map(async (performer) => {
      const user = await prisma.user.findUnique({
        where: { id: performer.salesId },
        select: { fullName: true, email: true },
      });

      return {
        salesId: performer.salesId,
        name: user?.fullName || 'Unknown',
        email: user?.email || '',
        totalCommission: Number(performer._sum.commissionAmount) || 0,
        totalRevenue: Number(performer._sum.actualRevenue) || 0,
        jobCount: performer._count.id,
        avgCommissionPerJob:
          performer._count.id > 0
            ? (Number(performer._sum.commissionAmount) || 0) /
              performer._count.id
            : 0,
      };
    })
  );

  return performersWithDetails
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, 10);
}

async function getCommissionMonthlyTrends(whereClause: any) {
  // This would be implemented with proper SQL aggregation
  // For now, return a simplified version
  const entries = await prisma.commissionEntry.findMany({
    where: whereClause,
    select: {
      createdAt: true,
      commissionAmount: true,
      actualRevenue: true,
      status: true,
    },
  });

  // Group by month
  const monthlyData = entries.reduce(
    (acc, entry) => {
      const month = format(entry.createdAt, 'yyyy-MM');

      if (!acc[month]) {
        acc[month] = {
          month,
          entries: 0,
          commission: 0,
          revenue: 0,
          matched: 0,
        };
      }

      acc[month].entries++;
      acc[month].commission += Number(entry.commissionAmount) || 0;
      acc[month].revenue += Number(entry.actualRevenue) || 0;

      if (entry.status === 'matched' || entry.status === 'approved') {
        acc[month].matched++;
      }

      return acc;
    },
    {} as Record<string, any>
  );

  return Object.values(monthlyData)
    .sort((a: any, b: any) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months
}
