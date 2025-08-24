/**
 * Data Retention API
 * Provides endpoints for managing data retention policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { withProductionApiAuth } from '@/lib/production-auth';
import { requireAnyRole } from '@/lib/auth';
import { DataRetention } from '@/lib/data-protection';
import { logProductionError } from '@/lib/production-error-logger';

/**
 * GET /api/data-protection/retention - Get current retention policies
 */
async function handleGet(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin'], {
      url: request.url,
      action: 'view_retention_policies',
    });

    // In a real implementation, you would fetch policies from database
    // For now, return the default policies
    const policies = [
      {
        entityType: 'daily_log',
        retentionPeriodDays: 365 * 7, // 7 years
        archiveAfterDays: 365 * 2, // Archive after 2 years
        isActive: true,
      },
      {
        entityType: 'commission_entry',
        retentionPeriodDays: 365 * 7, // 7 years
        archiveAfterDays: 365 * 2,
        isActive: true,
      },
      {
        entityType: 'audit_log',
        retentionPeriodDays: 365 * 5, // 5 years
        archiveAfterDays: 365 * 1,
        exceptions: ['security'],
        isActive: true,
      },
      {
        entityType: 'user',
        retentionPeriodDays: 365 * 10, // 10 years
        archiveAfterDays: 365 * 3,
        isActive: true,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        policies,
        lastApplied: new Date().toISOString(), // In production, get from database
      },
    });
  } catch (error) {
    await logProductionError(error, {
      component: 'data_protection_api',
      action: 'get_retention_policies',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve retention policies',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data-protection/retention - Apply retention policies
 */
async function handlePost(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin'], {
      url: request.url,
      action: 'apply_retention_policies',
    });

    const result = await DataRetention.applyRetentionPolicies(user.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Retention policies applied successfully. Archived: ${result.archived}, Deleted: ${result.deleted}`,
    });
  } catch (error) {
    await logProductionError(error, {
      component: 'data_protection_api',
      action: 'apply_retention_policies',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to apply retention policies',
      },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withProductionApiAuth(handleGet, {
  requiredRoles: ['admin'],
});
export const POST = withProductionApiAuth(handlePost, {
  requiredRoles: ['admin'],
});
