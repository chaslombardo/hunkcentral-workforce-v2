import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has captain or admin role
    if (
      !session.user.roles?.includes('captain') &&
      !session.user.roles?.includes('admin')
    ) {
      return NextResponse.json({ count: 0 });
    }

    // Count draft logs for the current user (captains see their own drafts)
    const whereClause = session.user.roles?.includes('admin')
      ? { status: 'draft' } // Admins see all drafts
      : {
          status: 'draft',
          OR: [
            { captainId: session.user.id },
            { createdById: session.user.id },
          ],
        }; // Captains see only their own drafts

    const count = await prisma.dailyLog.count({
      where: whereClause,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching draft logs count:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
