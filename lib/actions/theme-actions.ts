// Server actions for theme preference management
'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateThemePreference(
  theme: 'light' | 'dark' | 'system'
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Validate theme value
    if (!['light', 'dark', 'system'].includes(theme)) {
      throw new Error('Invalid theme preference');
    }

    // Update user's theme preference in database
    await prisma.user.update({
      where: { id: user.id },
      data: { themePreference: theme },
    });

    // Revalidate any pages that might show user preferences
    revalidatePath('/dashboard');
    revalidatePath('/admin/users');

    return { success: true };
  } catch (error) {
    console.error('Error updating theme preference:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update theme preference',
    };
  }
}

export async function getThemePreference() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { theme: 'system' }; // Default fallback
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { themePreference: true },
    });

    return {
      theme:
        (dbUser?.themePreference as 'light' | 'dark' | 'system') || 'system',
    };
  } catch (error) {
    console.error('Error getting theme preference:', error);
    return { theme: 'system' }; // Default fallback
  }
}
