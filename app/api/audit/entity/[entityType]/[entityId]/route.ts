/**
 * Entity Audit Trail API
 * Provides audit trail for specific entities (logs, users, commissions, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withProductionApiAuth } from '@/lib/production-auth';
import { requireAnyRole, canUserAccessUserData } from '@/lib/auth';
import { AuditTrailService } from '@/lib/audit-trail';
import { logProductionError } from '@/lib/production-error-logger';
import { z } from 'zod';

const EntityAuditQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50)),
  includeRelated: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

/**
 * GET /api/audit/entity/[entityType]/[entityId] - Get audit trail for specific entity
 */
async function handleGet(user: any, request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const entityType = pathSegments[pathSegments.length - 2];
  const entityId = pathSegments[pathSegments.length - 1];
  try {
    // Check permissions based on entity type
    switch (entityType) {
      case 'user':
        // Users can view their own audit trail, managers can view team members, admins can view all
        if (!canUserAccessUserData(user, entityId)) {
          requireAnyRole(user, ['admin'], {
            url: request.url,
            action: 'view_user_audit_trail',
          });
        }
        break;

      case 'daily_log':
        // Captains can view their own logs, managers can view team logs, admins can view all
        requireAnyRole(user, ['captain', 'manager', 'admin'], {
          url: request.url,
          action: 'view_log_audit_trail',
        });
        break;

      case 'commission_entry':
        // Sales can view their own commissions, managers and admins can view all
        requireAnyRole(user, ['sales', 'manager', 'admin'], {
          url: request.url,
          action: 'view_commission_audit_trail',
        });
        break;

      default:
        // For other entity types, require manager or admin access
        requireAnyRole(user, ['manager', 'admin'], {
          url: request.url,
          action: 'view_entity_audit_trail',
        });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = EntityAuditQuerySchema.parse(queryParams);

    const auditTrail = await AuditTrailService.getEntityAuditTrail(
      entityType,
      entityId,
      {
        limit: validatedQuery.limit,
        includeRelated: validatedQuery.includeRelated,
      }
    );

    // Log the audit trail access
    await AuditTrailService.createAuditLog({
      entityType: 'audit_access',
      entityId: `${entityType}_${entityId}`,
      action: 'view_entity_audit_trail',
      userId: user.id,
      changes: {
        viewedEntityType: entityType,
        viewedEntityId: entityId,
        viewedBy: user.fullName,
        viewedAt: new Date().toISOString(),
        includeRelated: validatedQuery.includeRelated,
        limit: validatedQuery.limit,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        entityType,
        entityId,
        auditTrail,
        totalEntries: auditTrail.length,
        includeRelated: validatedQuery.includeRelated,
      },
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
      action: 'get_entity_audit_trail',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
      metadata: {
        entityType,
        entityId,
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve entity audit trail',
      },
      { status: 500 }
    );
  }
}

// Export GET handler with authentication
export const GET = withProductionApiAuth(handleGet, {
  requiredRoles: ['captain', 'sales', 'manager', 'admin'],
});
