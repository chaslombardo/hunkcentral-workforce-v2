'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { CreateUserSchema, UpdateUserSchema, UserSearchSchema } from '@/lib/validations';
import type { CreateUserFormData, UpdateUserFormData, UserSearchFormData } from '@/lib/validations';

// Create a new user
export async function createUser(data: CreateUserFormData) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    const validatedData = CreateUserSchema.parse(data);
    
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

    revalidatePath('/admin/users');
    return { success: true, user: { id: user.id, email: user.email, fullName: user.fullName } };
  } catch (error) {
    console.error('Error creating user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create user' 
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

    const validatedData = UpdateUserSchema.parse(data);
    
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

    revalidatePath('/admin/users');
    return { success: true, user: { id: updatedUser.id, email: updatedUser.email, fullName: updatedUser.fullName } };
  } catch (error) {
    console.error('Error updating user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update user' 
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

    if (relatedData?.dailyLogs.length || relatedData?.logHours.length || relatedData?.commissionEntries.length) {
      throw new Error('Cannot delete user with existing logs, hours, or commission entries');
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
    console.error('Error deleting user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete user' 
    };
  }
}

// Get users with search and filtering
export async function getUsers(params: Partial<UserSearchFormData> = {}) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin') && !session?.user?.roles?.includes('manager')) {
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

    const where = conditions.length > 0 
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
    console.error('Error fetching users:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch users' 
    };
  }
}

// Get a single user by ID
export async function getUserById(userId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.roles?.includes('admin') && !session?.user?.roles?.includes('manager')) {
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

    return { success: true, user };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch user' 
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
    console.error('Error copying user settings:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to copy user settings' 
    };
  }
}