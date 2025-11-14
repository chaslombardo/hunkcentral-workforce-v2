import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@hunkcentral.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or manager role for sending notifications
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { roles: true },
    });

    const canSendNotifications = user?.roles?.some((role) =>
      ['admin', 'manager'].includes(role.toLowerCase())
    );

    if (!canSendNotifications) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userIds, title, message, data, actions } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Get push subscriptions for target users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: userIds ? { in: userIds } : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No subscriptions found for target users' },
        { status: 404 }
      );
    }

    // Prepare notification payload
    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: data || {},
      actions: actions || [],
      timestamp: Date.now(),
    });

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dhKey,
                auth: subscription.authKey,
              },
            },
            payload
          );

          return {
            userId: subscription.userId,
            success: true,
          };
        } catch (error) {
          console.error(
            `Failed to send notification to user ${subscription.userId}:`,
            error
          );

          // If subscription is invalid, remove it
          if (error instanceof Error && error.message.includes('410')) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id },
            });
          }

          return {
            userId: subscription.userId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const successful = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
      total: results.length,
    });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
