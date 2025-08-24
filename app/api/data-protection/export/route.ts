/**
 * Data Export API
 * Provides GDPR-compliant data export functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { withProductionApiAuth } from '@/lib/production-auth';
import { requireAnyRole, canUserAccessUserData } from '@/lib/auth';
import { DataExport } from '@/lib/data-protection';
import { logProductionError } from '@/lib/production-error-logger';
import { z } from 'zod';

const DataExportRequestSchema = z.object({
  userId: z.string().optional(), // If not provided, export current user's data
  dataTypes: z.array(
    z.enum(['profile', 'logs', 'commissions', 'payroll', 'audit_trail', 'all'])
  ),
  format: z.enum(['json', 'csv', 'xml']).default('json'),
});

/**
 * POST /api/data-protection/export - Create a data export request
 */
async function handlePost(user: any, request: NextRequest) {
  try {
    const body = await request.json();
    const validatedRequest = DataExportRequestSchema.parse(body);

    // Determine target user (default to current user)
    const targetUserId = validatedRequest.userId || user.id;

    // Check permissions
    if (targetUserId !== user.id) {
      // Only admins can export other users' data, or users can export their own data
      if (!canUserAccessUserData(user, targetUserId)) {
        requireAnyRole(user, ['admin'], {
          url: request.url,
          action: 'export_user_data',
        });
      }
    }

    const exportRequest = await DataExport.createExportRequest(
      targetUserId,
      user.id,
      {
        dataTypes: validatedRequest.dataTypes,
        format: validatedRequest.format,
      }
    );

    return NextResponse.json({
      success: true,
      data: exportRequest,
      message: 'Data export request created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid export request',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    await logProductionError(error, {
      component: 'data_protection_api',
      action: 'create_export_request',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create export request',
      },
      { status: 500 }
    );
  }
}

// Export handler with authentication
export const POST = withProductionApiAuth(handlePost, {
  requiredRoles: ['captain', 'sales', 'manager', 'admin'],
});
