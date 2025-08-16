import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const { events, metrics } = await request.json();

    // Validate request data
    if (!Array.isArray(events) && !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    // Process analytics events
    if (events && events.length > 0) {
      await prisma.analyticsEvent.createMany({
        data: events.map((event: { eventType: string; metadata?: Record<string, unknown>; timestamp?: string }) => ({
          eventType: event.eventType,
          userId: session?.user?.id || null,
          metadata: event.metadata || {},
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        })),
        skipDuplicates: true,
      });
    }

    // Process performance metrics
    if (metrics && metrics.length > 0) {
      await prisma.performanceMetric.createMany({
        data: metrics.map((metric: { metricType: string; value: number; page: string; metadata?: Record<string, unknown>; timestamp?: string }) => ({
          metricType: metric.metricType,
          value: metric.value,
          page: metric.page,
          userId: session?.user?.id || null,
          metadata: metric.metadata || {},
          timestamp: metric.timestamp ? new Date(metric.timestamp) : new Date(),
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics data' },
      { status: 500 }
    );
  }
}