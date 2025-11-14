'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { ZodError } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserSearchSchema,
} from '@/lib/validations';
import type {
  CreateUserFormData,
  UpdateUserFormData,
  UserSearchFormData,
} from '@/lib/validations';
import { onUserCreated, onUserUpdated, onUserRatesUpdated } from '@/lib/cache';

// Create a new user
export async function createUser(data: CreateUserFormData) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    let validatedData;
    try {
      validatedData = CreateUserSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues;
        if (issues && issues.length > 0) {
          const firstIssue = issues[0];
          return {
            success: false,
            error: firstIssue.message,
          };
        }
      }
      throw error; // Re-throw if not a ZodError
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: user.id,
        action: 'create',
        changes: {
          created: {
            email: user.email,
            fullName: user.fullName,
            roles: user.roles,
          },
        },
        userId: session.user.id,
      },
    });

    // Trigger cache invalidation for performance optimization
    try {
      await onUserCreated(user.id);
    } catch (cacheError) {
      // Don't fail the operation if cache invalidation fails
      console.error('Cache invalidation failed:', cacheError);
    }

    revalidatePath('/admin/users');
    return {
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  } catch (error) {
    // Error creating user
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to create user',
    };
  }
}

// Update user permissions
export async function updateUserPermissions(data: {
  userId: string;
  permissions: string[];
}) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get current user data for audit trail
    const currentUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { permissions: true, fullName: true },
    });

    if (!currentUser) {
      throw new Error('User not found');
    }

    // Update user permissions
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: { permissions: data.permissions },
      select: { id: true, fullName: true, permissions: true },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: data.userId,
        action: 'update_permissions',
        changes: {
          permissions: {
            from: currentUser.permissions,
            to: data.permissions,
          },
        },
        userId: session.user.id,
      },
    });

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${data.userId}`);

    return {
      success: true,
      user: updatedUser,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to update permissions',
    };
  }
}

// Bulk update permissions for multiple users
export async function bulkUpdatePermissions(data: {
  userIds: string[];
  permissions: string[];
  action: 'add' | 'remove' | 'replace';
}) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    const results = [];

    for (const userId of data.userIds) {
      try {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { permissions: true, fullName: true },
        });

        if (!currentUser) {
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }

        let newPermissions: string[];

        switch (data.action) {
          case 'add':
            newPermissions = [
              ...new Set([...currentUser.permissions, ...data.permissions]),
            ];
            break;
          case 'remove':
            newPermissions = currentUser.permissions.filter(
              (p) => !data.permissions.includes(p)
            );
            break;
          case 'replace':
            newPermissions = data.permissions;
            break;
          default:
            throw new Error('Invalid action');
        }

        await prisma.user.update({
          where: { id: userId },
          data: { permissions: newPermissions },
        });

        // Log audit trail
        await prisma.auditLog.create({
          data: {
            entityType: 'user',
            entityId: userId,
            action: `bulk_${data.action}_permissions`,
            changes: {
              permissions: {
                from: currentUser.permissions,
                to: newPermissions,
                action: data.action,
                applied: data.permissions,
              },
            },
            userId: session.user.id,
          },
        });

        results.push({ userId, success: true });
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    revalidatePath('/admin/users');

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return {
      success: true,
      results,
      summary: {
        total: data.userIds.length,
        successful: successCount,
        failed: errorCount,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to bulk update permissions',
    };
  }
}

// Update an existing user
export async function updateUser(data: UpdateUserFormData) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    let validatedData;
    try {
      validatedData = UpdateUserSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues;
        if (issues && issues.length > 0) {
          const firstIssue = issues[0];
          return {
            success: false,
            error: firstIssue.message,
          };
        }
      }
      throw error; // Re-throw if not a ZodError
    }

    // Get existing user for audit trail
    const existingUser = await prisma.user.findUnique({
      where: { id: validatedData.id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...validatedData };
    delete updateData.id;

    // Hash password if provided
    if (validatedData.password) {
      updateData.password = await bcrypt.hash(validatedData.password, 12);
    } else {
      delete updateData.password;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: validatedData.id },
      data: updateData,
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: updatedUser.id,
        action: 'update',
        changes: {
          before: {
            email: existingUser.email,
            fullName: existingUser.fullName,
            roles: existingUser.roles,
          },
          after: {
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            roles: updatedUser.roles,
          },
        },
        userId: session.user.id,
      },
    });

    // Trigger cache invalidation for performance optimization
    try {
      // Check if rates were updated to trigger specific invalidation
      const ratesUpdated = Object.keys(updateData).some(
        (key) =>
          key.startsWith('rate') ||
          key.includes('salary') ||
          key.includes('commission')
      );

      if (ratesUpdated) {
        await onUserRatesUpdated(updatedUser.id);
      } else {
        await onUserUpdated(updatedUser.id);
      }
    } catch (cacheError) {
      // Don't fail the operation if cache invalidation fails
      console.error('Cache invalidation failed:', cacheError);
    }

    revalidatePath('/admin/users');
    return {
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
      },
    };
  } catch (error) {
    // Error updating user
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to update user',
    };
  }
}

// Delete a user
export async function deleteUser(userId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Check if user exists and get data for audit
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check if user has related data that would prevent deletion
    const relatedData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyLogs: { take: 1 },
        logHours: { take: 1 },
        commissionEntries: { take: 1 },
      },
    });

    if (
      relatedData?.dailyLogs.length ||
      relatedData?.logHours.length ||
      relatedData?.commissionEntries.length
    ) {
      throw new Error(
        'Cannot delete user with existing logs, hours, or commission entries'
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: userId,
        action: 'delete',
        changes: {
          deleted: {
            email: existingUser.email,
            fullName: existingUser.fullName,
            roles: existingUser.roles,
          },
        },
        userId: session.user.id,
      },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    // Error deleting user
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

// Get users with search and filtering
export async function getUsers(params: Partial<UserSearchFormData> = {}) {
  try {
    const session = await getSession();
    if (
      !session?.user?.roles?.includes('admin') &&
      !session?.user?.roles?.includes('manager')
    ) {
      throw new Error('Unauthorized: Admin or Manager access required');
    }

    const validatedParams = UserSearchSchema.parse({
      sortBy: 'fullName',
      sortOrder: 'asc',
      page: 1,
      limit: 20,
      ...params,
    });
    const { search, roles, sortBy, sortOrder, page, limit } = validatedParams;

    // Build where clause
    const conditions: Record<string, unknown>[] = [];

    if (search) {
      conditions.push({
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (roles && roles.length > 0) {
      conditions.push({
        roles: { hasSome: roles },
      });
    }

    // Manager role filtering - managers can only see captains and wingmen
    if (
      session.user.roles?.includes('manager') &&
      !session.user.roles?.includes('admin')
    ) {
      conditions.push({
        roles: { hasSome: ['captain', 'wingman'] },
      });
    }

    const where =
      conditions.length > 0
        ? conditions.length === 1
          ? conditions[0]
          : { AND: conditions }
        : {};

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
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
        salaryAmount: true,
        salaryFrequency: true,
        salaryType: true,
        commissionRate: true,
        junkBonusGoal: true,
        moveBonusGoal: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    // Error fetching users
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch users',
    };
  }
}

// Get a single user by ID
export async function getUserById(userId: string) {
  try {
    const session = await getSession();
    if (
      !session?.user?.roles?.includes('admin') &&
      !session?.user?.roles?.includes('manager')
    ) {
      throw new Error('Unauthorized: Admin or Manager access required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
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
        salaryAmount: true,
        salaryFrequency: true,
        salaryType: true,
        commissionRate: true,
        junkBonusGoal: true,
        moveBonusGoal: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check manager access permissions
    if (
      session.user.roles?.includes('manager') &&
      !session.user.roles?.includes('admin')
    ) {
      const hasAccessibleRole = user.roles.some((role) =>
        ['captain', 'wingman'].includes(role)
      );
      if (!hasAccessibleRole) {
        throw new Error(
          'Access denied: Managers can only view captain and wingman users'
        );
      }

      // Log manager access for audit trail
      await prisma.auditLog
        .create({
          data: {
            entityType: 'user_access',
            entityId: userId,
            action: 'manager_view_user',
            changes: {
              action: 'manager_access',
              targetUserId: userId,
              targetUserRoles: user.roles,
              accessType: 'view_user_profile',
            },
            userId: session.user.id,
          },
        })
        .catch(() => {
          // Don't fail the main operation if audit logging fails
        });
    }

    // Convert Decimal fields to numbers for client components
    const userWithNumbers = {
      ...user,
      rateJunkCaptain: user.rateJunkCaptain
        ? Number(user.rateJunkCaptain)
        : null,
      rateJunkWingman: user.rateJunkWingman
        ? Number(user.rateJunkWingman)
        : null,
      rateMoveCaptain: user.rateMoveCaptain
        ? Number(user.rateMoveCaptain)
        : null,
      rateMoveWingman: user.rateMoveWingman
        ? Number(user.rateMoveWingman)
        : null,
      rateZigma: user.rateZigma ? Number(user.rateZigma) : null,
      rateTraining: user.rateTraining ? Number(user.rateTraining) : null,
      rateEstimating: user.rateEstimating ? Number(user.rateEstimating) : null,
      rateWarehouse: user.rateWarehouse ? Number(user.rateWarehouse) : null,
      rateAdmin: user.rateAdmin ? Number(user.rateAdmin) : null,
      salaryAmount: user.salaryAmount ? Number(user.salaryAmount) : null,
      commissionRate: user.commissionRate ? Number(user.commissionRate) : null,
      junkBonusGoal: Number(user.junkBonusGoal),
      moveBonusGoal: Number(user.moveBonusGoal),
    };

    return { success: true, user: userWithNumbers };
  } catch (error) {
    // Error fetching user
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch user',
    };
  }
}

// Copy user settings (for template functionality)
export async function copyUserSettings(fromUserId: string, toUserId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Get source user settings
    const sourceUser = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: {
        rateJunkCaptain: true,
        rateJunkWingman: true,
        rateMoveCaptain: true,
        rateMoveWingman: true,
        rateZigma: true,
        rateTraining: true,
        rateEstimating: true,
        rateWarehouse: true,
        rateAdmin: true,
        salaryAmount: true,
        salaryFrequency: true,
        salaryType: true,
        commissionRate: true,
        junkBonusGoal: true,
        moveBonusGoal: true,
      },
    });

    if (!sourceUser) {
      throw new Error('Source user not found');
    }

    // Update target user with source settings
    await prisma.user.update({
      where: { id: toUserId },
      data: sourceUser,
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        entityType: 'user',
        entityId: toUserId,
        action: 'update',
        changes: {
          action: 'copy_settings',
          fromUserId,
          settings: sourceUser,
        },
        userId: session.user.id,
      },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    // Error copying user settings
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to copy user settings',
    };
  }
}

// Bulk update roles for multiple users
export async function bulkUpdateRoles(data: {
  userIds: string[];
  roles: string[];
  action: 'add' | 'remove' | 'replace';
}) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    const results = [];

    for (const userId of data.userIds) {
      try {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { roles: true, fullName: true },
        });

        if (!currentUser) {
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }

        let newRoles: string[];

        switch (data.action) {
          case 'add':
            newRoles = [...new Set([...currentUser.roles, ...data.roles])];
            break;
          case 'remove':
            newRoles = currentUser.roles.filter((r) => !data.roles.includes(r));
            break;
          case 'replace':
            newRoles = data.roles;
            break;
          default:
            throw new Error('Invalid action');
        }

        await prisma.user.update({
          where: { id: userId },
          data: { roles: newRoles },
        });

        // Log audit trail
        await prisma.auditLog.create({
          data: {
            entityType: 'user',
            entityId: userId,
            action: `bulk_${data.action}_roles`,
            changes: {
              roles: {
                from: currentUser.roles,
                to: newRoles,
                action: data.action,
                applied: data.roles,
              },
            },
            userId: session.user.id,
          },
        });

        results.push({ userId, success: true });
      } catch (error) {
        results.push({
          userId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    revalidatePath('/admin/users');

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return {
      success: true,
      results,
      summary: {
        total: data.userIds.length,
        successful: successCount,
        failed: errorCount,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to bulk update roles',
    };
  }
}

// Bulk import users from CSV data
export async function bulkImportUsers(data: {
  users: Array<{
    fullName: string;
    email: string;
    roles: string[];
    rateJunkCaptain?: number;
    rateJunkWingman?: number;
    rateMoveCaptain?: number;
    rateMoveWingman?: number;
    salaryAmount?: number;
    salaryFrequency?: string;
    commissionRate?: number;
  }>;
  skipDuplicates: boolean;
  sendWelcomeEmails: boolean;
}) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    const results = [];
    let skippedCount = 0;

    for (const userData of data.users) {
      try {
        // Check for existing user
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser && data.skipDuplicates) {
          skippedCount++;
          results.push({
            email: userData.email,
            success: false,
            error: 'Email already exists (skipped)',
          });
          continue;
        }

        if (existingUser && !data.skipDuplicates) {
          results.push({
            email: userData.email,
            success: false,
            error: 'Email already exists',
          });
          continue;
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        // Create user
        const user = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
        });

        // Log audit trail
        await prisma.auditLog.create({
          data: {
            entityType: 'user',
            entityId: user.id,
            action: 'bulk_import',
            changes: {
              created: {
                email: user.email,
                fullName: user.fullName,
                roles: user.roles,
              },
            },
            userId: session.user.id,
          },
        });

        // TODO: Send welcome email if requested
        if (data.sendWelcomeEmails) {
          // Implement email sending logic
        }

        results.push({
          email: userData.email,
          success: true,
          tempPassword: data.sendWelcomeEmails ? undefined : tempPassword,
        });
      } catch (error) {
        results.push({
          email: userData.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    revalidatePath('/admin/users');

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    return {
      success: true,
      results,
      summary: {
        total: data.users.length,
        successful: successCount,
        failed: errorCount,
        skipped: skippedCount,
      },
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to import users',
    };
  }
}

// Export users to CSV format
export async function exportUsers(userIds?: string[]) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    const whereClause = userIds ? { id: { in: userIds } } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        email: true,
        roles: true,
        rateJunkCaptain: true,
        rateJunkWingman: true,
        rateMoveCaptain: true,
        rateMoveWingman: true,
        salaryAmount: true,
        salaryFrequency: true,
        commissionRate: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return {
      success: true,
      users,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Failed to export users',
    };
  }
}
