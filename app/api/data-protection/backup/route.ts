/**
 * Data Backup API
 * Provides endpoints for creating and managing database backups
 */

import { NextRequest, NextResponse } from 'next/server';
import { withProductionApiAuth } from '@/lib/production-auth';
import { requireAnyRole } from '@/lib/auth';
import { DataBackup } from '@/lib/data-protection';
import { logProductionError } from '@/lib/monitoring';
import { z } from 'zod';

const BackupRequestSchema = z.object({
  type: z.enum(['full', 'incremental']),
  lastBackupDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

/**
 * POST /api/data-protection/backup - Create a new backup
 */
async function handlePost(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin'], {
      url: request.url,
      action: 'create_backup',
    });

    const body = await request.json();
    const validatedRequest = BackupRequestSchema.parse(body);

    let backupMetadata;

    if (validatedRequest.type === 'full') {
      backupMetadata = await DataBackup.createFullBackup(user.id);
    } else if (validatedRequest.type === 'incremental') {
      if (!validatedRequest.lastBackupDate) {
        return NextResponse.json(
          {
            success: false,
            error: 'lastBackupDate is required for incremental backups',
          },
          { status: 400 }
        );
      }
      backupMetadata = await DataBackup.createIncrementalBackup(
        user.id,
        validatedRequest.lastBackupDate
      );
    }

    return NextResponse.json({
      success: true,
      data: backupMetadata,
      message: `${validatedRequest.type} backup created successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid backup request',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    await logProductionError(error, {
      component: 'data_protection_api',
      action: 'create_backup',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create backup',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/data-protection/backup - Restore from backup
 */
async function handlePut(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin'], {
      url: request.url,
      action: 'restore_backup',
    });

    const body = await request.json();
    const { backupId } = body;

    if (!backupId) {
      return NextResponse.json(
        {
          success: false,
          error: 'backupId is required',
        },
        { status: 400 }
      );
    }

    await DataBackup.restoreFromBackup(backupId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
      data: { backupId },
    });
  } catch (error) {
    await logProductionError(error, {
      component: 'data_protection_api',
      action: 'restore_backup',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to restore backup',
      },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const POST = withProductionApiAuth(handlePost, {
  requiredRoles: ['admin'],
});
export const PUT = withProductionApiAuth(handlePut, {
  requiredRoles: ['admin'],
});
