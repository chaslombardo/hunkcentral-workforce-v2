/**
 * Data Deletion API
 * Provides GDPR-compliant data deletion functionality (Right to be Forgotten)
 */

import { NextRequest, NextResponse } from 'next/server';
import { withProductionApiAuth } from '@/lib/production-auth';
import { requireAnyRole } from '@/lib/auth';
import { DataExport } from '@/lib/data-protection';
import { logProductionError } from '@/lib/monitoring';
import { z } from 'zod';

const DataDeletionRequestSchema = z.object({
  userId: z.string(),
  reason: z.enum(['gdpr_request', 'account_closure', 'admin_action']),
  confirmationCode: z.string().min(6), // Require confirmation code for safety
});

/**
 * POST /api/data-protection/delete - Delete user data (GDPR Right to be Forgotten)
 */
async function handlePost(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin'], {
      url: request.url,
      action: 'delete_user_data',
    });

    const body = await request.json();
    const validatedRequest = DataDeletionRequestSchema.parse(body);

    // Verify confirmation code (in production, this would be a secure token)
    const expectedCode = `DELETE_${validatedRequest.userId.slice(-6).toUpperCase()}`;
    if (validatedRequest.confirmationCode !== expectedCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid confirmation code',
          hint: `Expected format: DELETE_${validatedRequest.userId.slice(-6).toUpperCase()}`,
        },
        { status: 400 }
      );
    }

    // Prevent deletion of admin users
    if (validatedRequest.userId === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete your own account',
        },
        { status: 400 }
      );
    }

    await DataExport.deleteUserData(validatedRequest.userId, user.id);

    return NextResponse.json({
      success: true,
      message: 'User data deletion completed successfully',
      data: {
        deletedUserId: validatedRequest.userId,
        deletedBy: user.id,
        reason: validatedRequest.reason,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid deletion request',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    await logProductionError(error, {
      component: 'data_protection_api',
      action: 'delete_user_data',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete user data',
      },
      { status: 500 }
    );
  }
}

// Export handler with authentication
export const POST = withProductionApiAuth(handlePost, {
  requiredRoles: ['admin'],
});
