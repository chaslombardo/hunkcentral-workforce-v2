/**
 * Audit Trail API
 * Provides endpoints for searching, filtering, and exporting audit logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withProductionApiAuth } from '@/lib/production-auth';
import { requireAnyRole, type SessionUser } from '@/lib/auth';
import { AuditTrailService } from '@/lib/audit-trail';
import { logProductionError } from '@/lib/monitoring';
import { z } from 'zod';

const AuditSearchQuerySchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  searchTerm: z.string().optional(),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  sortBy: z.enum(['createdAt', 'action', 'entityType', 'userId']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const AuditExportQuerySchema = z.object({
  format: z.enum(['csv', 'json', 'excel']),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  searchTerm: z.string().optional(),
});

/**
 * GET /api/audit - Search audit logs
 */
async function handleGet(user: SessionUser, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin', 'manager'], {
      url: request.url,
      action: 'view_audit_logs',
    });

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validatedQuery = AuditSearchQuerySchema.parse(queryParams);

    // Build filters
    const filters: {
      entityType?: string;
      entityId?: string;
      action?: string;
      userId?: string;
      searchTerm?: string;
      page?: number;
      limit?: number;
      sortBy?: 'createdAt' | 'action' | 'entityType' | 'userId';
      sortOrder?: 'asc' | 'desc';
      dateRange?: {
        start: Date;
        end: Date;
      };
    } = {
      entityType: validatedQuery.entityType,
      entityId: validatedQuery.entityId,
      action: validatedQuery.action,
      userId: validatedQuery.userId,
      searchTerm: validatedQuery.searchTerm,
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
    };

    // Add date range if provided
    if (validatedQuery.startDate || validatedQuery.endDate) {
      filters.dateRange = {
        start: validatedQuery.startDate || new Date(0), // Beginning of time if no start
        end: validatedQuery.endDate || new Date(), // Now if no end
      };
    }

    const result = await AuditTrailService.searchAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: result,
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
      action: 'search_audit_logs',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search audit logs',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit/export - Export audit logs
 */
export async function POST(request: NextRequest) {
  return withProductionApiAuth(
    async (user: SessionUser) => {
      try {
        requireAnyRole(user, ['admin', 'manager'], {
          url: request.url,
          action: 'export_audit_logs',
        });

        const body = await request.json();
        const validatedQuery = AuditExportQuerySchema.parse(body);

        // Build filters for export
        const filters: {
          entityType?: string;
          entityId?: string;
          action?: string;
          userId?: string;
          searchTerm?: string;
          dateRange?: {
            start: Date;
            end: Date;
          };
        } = {
          entityType: validatedQuery.entityType,
          entityId: validatedQuery.entityId,
          action: validatedQuery.action,
          userId: validatedQuery.userId,
          searchTerm: validatedQuery.searchTerm,
        };

        // Add date range if provided
        if (validatedQuery.startDate || validatedQuery.endDate) {
          filters.dateRange = {
            start: validatedQuery.startDate || new Date(0),
            end: validatedQuery.endDate || new Date(),
          };
        }

        const exportResult = await AuditTrailService.exportAuditLogs(
          filters,
          validatedQuery.format
        );

        // Log the export action
        await AuditTrailService.createAuditLog({
          entityType: 'audit_export',
          entityId: `export_${Date.now()}`,
          action: 'export_audit_logs',
          userId: user.id,
          changes: {
            format: validatedQuery.format,
            filters,
            exportedBy: user.fullName,
            exportedAt: new Date().toISOString(),
          },
        });

        // Convert Buffer to proper format for NextResponse
        const responseData = Buffer.isBuffer(exportResult.data)
          ? new Uint8Array(exportResult.data).buffer
          : exportResult.data;

        return new NextResponse(responseData, {
          status: 200,
          headers: {
            'Content-Type': exportResult.contentType,
            'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
          },
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: 'Invalid export parameters',
              details: error.issues,
            },
            { status: 400 }
          );
        }

        await logProductionError(error, {
          component: 'audit_api',
          action: 'export_audit_logs',
          userId: user.id,
          url: request.url,
          userAgent: request.headers.get('user-agent') || 'unknown',
          category: 'api',
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Failed to export audit logs',
          },
          { status: 500 }
        );
      }
    },
    { requiredRoles: ['admin', 'manager'] }
  )(request);
}

// Export GET handler with authentication
export const GET = withProductionApiAuth(handleGet, {
  requiredRoles: ['admin', 'manager'],
});
