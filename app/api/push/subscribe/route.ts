import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription, deviceInfo } = body;

    if (!subscription?.endpoint || !subscription?.keys) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Store or update push subscription in database
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        userAgent: deviceInfo?.userAgent,
        platform: deviceInfo?.platform,
        language: deviceInfo?.language,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        userAgent: deviceInfo?.userAgent,
        platform: deviceInfo?.platform,
        language: deviceInfo?.language,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}
