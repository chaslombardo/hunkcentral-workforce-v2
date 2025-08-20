import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payPeriods = await prisma.payPeriod.findMany({
      orderBy: { startDate: 'desc' },
      take: 10, // Get last 10 pay periods
    });

    return NextResponse.json(payPeriods);
  } catch (error) {
    console.error('Error fetching pay periods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pay periods' },
      { status: 500 }
    );
  }
}
