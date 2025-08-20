import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check authorization
    if (
      !session.user.roles?.includes('admin') &&
      !session.user.roles?.includes('manager')
    ) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or Manager access required' },
        { status: 403 }
      );
    }

    // Build where clause for manager filtering
    let where = {};
    if (
      session.user.roles?.includes('manager') &&
      !session.user.roles?.includes('admin')
    ) {
      where = {
        roles: { hasSome: ['captain', 'wingman'] },
      };
    }

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
        junkBonusGoal: true,
        moveBonusGoal: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    // Convert Decimal fields to numbers for JSON serialization
    const serializedUsers = users.map((user) => ({
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
      junkBonusGoal: Number(user.junkBonusGoal),
      moveBonusGoal: Number(user.moveBonusGoal),
    }));

    return NextResponse.json(serializedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
