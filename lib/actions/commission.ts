'use server';

import { revalidatePath } from 'next/cache';

import { prisma } from '@/lib/prisma';
import {
  CommissionEntrySchema,
  type CommissionEntryFormData,
} from '@/lib/validations';
import { auth } from '@/lib/auth';
import { logCommissionChange } from '@/lib/auditLogger';
import { canModifyDataForDate } from '@/lib/actions/pay-periods';
import { convertCommissionDecimalFields } from '@/lib/decimal-utils';

export async function createCommissionEntry(data: CommissionEntryFormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Validate the data
    const validatedData = CommissionEntrySchema.parse(data);

    // Check if data can be modified for the target date
    const canModify = await canModifyDataForDate(validatedData.targetDate);
    if (!canModify) {
      throw new Error(
        'Cannot create commission entry for this date - pay period is locked or closed'
      );
    }

    // Note: We allow duplicate job IDs from different sales people
    // Conflicts will be detected and handled during the commission matching process

    // Create the commission entry
    const commissionEntry = await prisma.commissionEntry.create({
      data: {
        ...validatedData,
        status: 'pending',
      },
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Log the creation
    await logCommissionChange(
      'create',
      commissionEntry.id,
      session.user.id,
      undefined,
      commissionEntry
    );

    revalidatePath('/commission');
    return { success: true, data: commissionEntry };
  } catch (error) {
    // Error creating commission entry
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to create commission entry' };
  }
}

export async function getCommissionEntries(userId?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // If userId is provided, filter by that user, otherwise show all for managers/admins
    const whereClause = userId ? { salesId: userId } : {};

    // Check if user has permission to view all entries
    const canViewAll =
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('admin');

    // If not manager/admin and no specific userId, show only their own entries
    if (!canViewAll && !userId) {
      whereClause.salesId = session.user.id;
    }

    const entries = await prisma.commissionEntry.findMany({
      where: whereClause,
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        matchedLog: {
          select: {
            id: true,
            logDate: true,
            captain: {
              select: {
                fullName: true,
              },
            },
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal fields to numbers using utility
    const commissionEntries = entries.map((entry) =>
      convertCommissionDecimalFields(entry)
    );

    return { success: true, data: commissionEntries };
  } catch (error) {
    // Error fetching commission entries
    console.error('Error fetching commission entries:', error);
    return { success: false, error: 'Failed to fetch commission entries' };
  }
}

export async function updateCommissionEntry(
  id: string,
  data: Partial<CommissionEntryFormData>
) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Get the existing entry
    const existingEntry = await prisma.commissionEntry.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      throw new Error('Commission entry not found');
    }

    // Check permissions - only the creator or managers/admins can update
    const canUpdate =
      existingEntry.salesId === session.user.id ||
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('admin');

    if (!canUpdate) {
      throw new Error('Unauthorized to update this commission entry');
    }

    // If updating jobId, check for duplicates
    if (data.jobId && data.jobId !== existingEntry.jobId) {
      const duplicateEntry = await prisma.commissionEntry.findFirst({
        where: { jobId: data.jobId },
      });

      if (duplicateEntry) {
        throw new Error(
          'Job ID already exists. Duplicate entries are not allowed.'
        );
      }
    }

    // Update the entry
    const updatedEntry = await prisma.commissionEntry.update({
      where: { id },
      data,
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Log the update
    await logCommissionChange(
      'update',
      id,
      session.user.id,
      existingEntry,
      updatedEntry
    );

    revalidatePath('/commission');
    return { success: true, data: updatedEntry };
  } catch (error) {
    // Error updating commission entry
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to update commission entry' };
  }
}

export async function deleteCommissionEntry(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Get the existing entry
    const existingEntry = await prisma.commissionEntry.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      throw new Error('Commission entry not found');
    }

    // Check permissions - only the creator or managers/admins can delete
    const canDelete =
      existingEntry.salesId === session.user.id ||
      session.user.roles?.includes('manager') ||
      session.user.roles?.includes('admin');

    if (!canDelete) {
      throw new Error('Unauthorized to delete this commission entry');
    }

    // Don't allow deletion of matched entries
    if (existingEntry.status === 'matched') {
      throw new Error('Cannot delete matched commission entries');
    }

    // Delete the entry
    await prisma.commissionEntry.delete({
      where: { id },
    });

    // Log the deletion
    await logCommissionChange(
      'delete',
      id,
      session.user.id,
      existingEntry,
      undefined
    );

    revalidatePath('/commission');
    return { success: true };
  } catch (error) {
    // Error deleting commission entry
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to delete commission entry' };
  }
}

export async function approveCommissionEntry(id: string, comments?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check if user has manager or admin role
    if (
      !session.user.roles?.includes('manager') &&
      !session.user.roles?.includes('admin')
    ) {
      throw new Error('Manager access required to approve commission entries');
    }

    // Get the existing entry
    const existingEntry = await prisma.commissionEntry.findUnique({
      where: { id },
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!existingEntry) {
      throw new Error('Commission entry not found');
    }

    // Only allow approval of matched entries
    if (existingEntry.status !== 'matched') {
      throw new Error('Only matched commission entries can be approved');
    }

    // Update the entry status to approved
    const approvedEntry = await prisma.commissionEntry.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedById: session.user.id,
      },
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Log the approval
    await logCommissionChange(
      'approve',
      id,
      session.user.id,
      existingEntry,
      approvedEntry,
      { comments, approvedAt: approvedEntry.approvedAt }
    );

    revalidatePath('/commission');
    return { success: true, data: approvedEntry };
  } catch (error) {
    // Error approving commission entry
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to approve commission entry' };
  }
}

export async function rejectCommissionEntry(id: string, reason?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Check if user has manager or admin role
    if (
      !session.user.roles?.includes('manager') &&
      !session.user.roles?.includes('admin')
    ) {
      throw new Error('Manager access required to reject commission entries');
    }

    // Get the existing entry
    const existingEntry = await prisma.commissionEntry.findUnique({
      where: { id },
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!existingEntry) {
      throw new Error('Commission entry not found');
    }

    // Only allow rejection of matched or pending entries
    if (!['matched', 'pending'].includes(existingEntry.status)) {
      throw new Error(
        'Only matched or pending commission entries can be rejected'
      );
    }

    // Update the entry status to rejected
    const rejectedEntry = await prisma.commissionEntry.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedById: session.user.id,
        rejectionReason: reason,
      },
      include: {
        sales: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        rejectedBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Log the rejection
    await logCommissionChange(
      'reject',
      id,
      session.user.id,
      existingEntry,
      rejectedEntry,
      { reason, rejectedAt: rejectedEntry.rejectedAt }
    );

    revalidatePath('/commission');
    return { success: true, data: rejectedEntry };
  } catch (error) {
    // Error rejecting commission entry
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Failed to reject commission entry' };
  }
}

export async function getSalesUsers() {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    // Get users with sales role or commission rate
    const users = await prisma.user.findMany({
      where: {
        OR: [{ roles: { has: 'sales' } }, { commissionRate: { not: null } }],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        commissionRate: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    // Convert Decimal to number for commission rate only and return only needed fields
    const salesUsers = users.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      commissionRate: user.commissionRate ? Number(user.commissionRate) : null,
    }));

    return { success: true, data: salesUsers };
  } catch (error) {
    // Error fetching sales users
    console.error('Error fetching sales users:', error);
    return { success: false, error: 'Failed to fetch sales users' };
  }
}
