/**
 * Audit Statistics API
 * Provides audit trail statistics and analytics for dashboards and reporting
 */

import { NextRequest, NextResponse } from 'next/server';
import { withProductionApiAuth } from '@/lib/production-auth';
import { requireAnyRole } from '@/lib/auth';
import { AuditTrailService } from '@/lib/audit-trail';
import { logProductionError } from '@/lib/monitoring';
import { z } from 'zod';

const StatisticsQuerySchema = z.object({
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  period: z.enum(['24h', '7d', '30d', '90d', 'custom']).default('30d'),
});

/**
 * GET /api/audit/statistics - Get audit trail statistics
 */
async function handleGet(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin', 'manager'], {
      url: request.url,
      action: 'view_audit_statistics',
    });

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = StatisticsQuerySchema.parse(queryParams);

    // Calculate date range based on period
    let dateRange: { start: Date; end: Date } | undefined;

    if (validatedQuery.period === 'custom') {
      if (validatedQuery.startDate && validatedQuery.endDate) {
        dateRange = {
          start: validatedQuery.startDate,
          end: validatedQuery.endDate,
        };
      }
    } else {
      const now = new Date();
      const start = new Date();

      switch (validatedQuery.period) {
        case '24h':
          start.setHours(start.getHours() - 24);
          break;
        case '7d':
          start.setDate(start.getDate() - 7);
          break;
        case '30d':
          start.setDate(start.getDate() - 30);
          break;
        case '90d':
          start.setDate(start.getDate() - 90);
          break;
      }

      dateRange = { start, end: now };
    }

    const statistics = await AuditTrailService.getAuditStatistics(dateRange);

    // Add additional computed metrics
    const enhancedStatistics = {
      ...statistics,
      period: validatedQuery.period,
      dateRange,
      computedMetrics: {
        averageEntriesPerDay: dateRange
          ? statistics.totalEntries /
            Math.max(
              1,
              Math.ceil(
                (dateRange.end.getTime() - dateRange.start.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 0,
        mostActiveEntityType:
          Object.entries(statistics.entriesByType).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0] || 'none',
        mostCommonAction:
          Object.entries(statistics.entriesByAction).sort(
            ([, a], [, b]) => b - a
          )[0]?.[0] || 'none',
        topUser: statistics.entriesByUser[0] || null,
      },
    };

    return NextResponse.json({
      success: true,
      data: enhancedStatistics,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    await logProductionError(error, {
      component: 'audit_api',
      action: 'get_audit_statistics',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve audit statistics',
      },
      { status: 500 }
    );
  }
}

// Export GET handler with authentication
export const GET = withProductionApiAuth(handleGet, {
  requiredRoles: ['admin', 'manager'],
});
