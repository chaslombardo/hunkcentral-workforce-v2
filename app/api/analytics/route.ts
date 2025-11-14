import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const eventType = searchParams.get('eventType');
    const metricType = searchParams.get('metricType');
    const page = searchParams.get('page');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get analytics events
    const events = await prisma.analyticsEvent.findMany({
      where: {
        ...(eventType && { eventType }),
        ...(userId && { userId }),
        ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        userId: true,
        metadata: true,
        timestamp: true,
        createdAt: true,
      },
    });

    // Get performance metrics
    const metrics = await prisma.performanceMetric.findMany({
      where: {
        ...(metricType && { metricType }),
        ...(page && { page }),
        ...(userId && { userId }),
        ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        metricType: true,
        value: true,
        page: true,
        userId: true,
        metadata: true,
        timestamp: true,
        createdAt: true,
      },
    });

    // Get aggregated statistics
    const eventStats = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      _count: { eventType: true },
      where: {
        ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
      },
    });

    const metricStats = await prisma.performanceMetric.groupBy({
      by: ['metricType'],
      _avg: { value: true },
      _count: { metricType: true },
      where: {
        ...(Object.keys(dateFilter).length > 0 && { timestamp: dateFilter }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        events,
        metrics,
        statistics: {
          eventCounts: eventStats.map((stat) => ({
            eventType: stat.eventType,
            count: stat._count.eventType,
          })),
          metricAverages: metricStats.map((stat) => ({
            metricType: stat.metricType,
            average: stat._avg.value,
            count: stat._count.metricType,
          })),
        },
        filters: {
          eventType,
          metricType,
          page,
          userId,
          startDate,
          endDate,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Analytics GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve analytics data',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const { events, metrics } = await request.json();

    // Validate request data
    if (!Array.isArray(events) && !Array.isArray(metrics)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const results = {
      eventsCreated: 0,
      metricsCreated: 0,
    };

    // Process analytics events
    if (events && events.length > 0) {
      const createdEvents = await prisma.analyticsEvent.createMany({
        data: events.map(
          (event: {
            eventType: string;
            metadata?: Record<string, unknown>;
            timestamp?: string;
          }) => ({
            eventType: event.eventType,
            userId: session?.user?.id || null,
            metadata: event.metadata || {},
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          })
        ),
        skipDuplicates: true,
      });
      results.eventsCreated = createdEvents.count;
    }

    // Process performance metrics
    if (metrics && metrics.length > 0) {
      const createdMetrics = await prisma.performanceMetric.createMany({
        data: metrics.map(
          (metric: {
            metricType: string;
            value: number;
            page: string;
            metadata?: Record<string, unknown>;
            timestamp?: string;
          }) => ({
            metricType: metric.metricType,
            value: metric.value,
            page: metric.page,
            userId: session?.user?.id || null,
            metadata: metric.metadata || {},
            timestamp: metric.timestamp
              ? new Date(metric.timestamp)
              : new Date(),
          })
        ),
        skipDuplicates: true,
      });
      results.metricsCreated = createdMetrics.count;
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Created ${results.eventsCreated} events and ${results.metricsCreated} metrics`,
    });
  } catch (error) {
    console.error('Analytics POST API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process analytics data',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
