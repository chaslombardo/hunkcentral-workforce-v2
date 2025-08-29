import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = searchParams.get('page');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: Record<string, string> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (page) where.page = page;
    if (userId) where.userId = userId;

    // Get feedback entries
    const feedback = await prisma.userFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        page: true,
        priority: true,
        email: true,
        userId: true,
        userAgent: true,
        screenResolution: true,
        status: true,
        resolution: true,
        resolvedAt: true,
        timestamp: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.userFeedback.count({ where });

    // Get statistics
    const stats = await prisma.userFeedback.groupBy({
      by: ['type', 'status', 'priority'],
      _count: { id: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        feedback,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
        statistics: {
          byType: stats.reduce((acc: Record<string, number>, stat) => {
            acc[stat.type] = (acc[stat.type] || 0) + stat._count.id;
            return acc;
          }, {}),
          byStatus: stats.reduce((acc: Record<string, number>, stat) => {
            acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
            return acc;
          }, {}),
          byPriority: stats.reduce((acc: Record<string, number>, stat) => {
            acc[stat.priority] = (acc[stat.priority] || 0) + stat._count.id;
            return acc;
          }, {}),
        },
        filters: {
          type,
          status,
          priority,
          page,
          userId,
          limit,
          offset,
        },
      },
    });
  } catch (error) {
    console.error('Feedback GET API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve feedback data',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const {
      type,
      title,
      description,
      page,
      priority,
      email,
      reproductionSteps,
      expectedBehavior,
      actualBehavior,
      browserInfo,
      attachScreenshot,
      timestamp,
      url,
      referrer,
    } = body;

    // Validate required fields
    if (!type || !title || !description || !priority) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store feedback in database
    const feedback = await prisma.userFeedback.create({
      data: {
        type,
        title,
        description: [
          description,
          reproductionSteps
            ? `\n\n**Steps to Reproduce:**\n${reproductionSteps}`
            : '',
          expectedBehavior
            ? `\n\n**Expected Behavior:**\n${expectedBehavior}`
            : '',
          actualBehavior ? `\n\n**Actual Behavior:**\n${actualBehavior}` : '',
          url ? `\n\n**URL:** ${url}` : '',
          referrer ? `\n\n**Referrer:** ${referrer}` : '',
          attachScreenshot ? `\n\n**Browser Info Attached:** Yes` : '',
        ]
          .filter(Boolean)
          .join(''),
        page,
        priority,
        email,
        userId: session?.user?.id || null,
        userAgent:
          browserInfo ||
          JSON.stringify({
            userAgent: body.userAgent,
            screenResolution: body.screenResolution,
          }),
        screenResolution: body.screenResolution,
        timestamp: new Date(timestamp),
        status: 'open',
      },
    });

    // Track analytics event
    await trackFeedbackEvent({
      userId: session?.user?.id,
      feedbackType: type,
      priority,
      page,
      timestamp: new Date(timestamp),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: feedback.id,
        type: feedback.type,
        title: feedback.title,
        status: feedback.status,
        priority: feedback.priority,
        createdAt: feedback.createdAt,
      },
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function trackFeedbackEvent(data: {
  userId?: string;
  feedbackType: string;
  priority: string;
  page: string;
  timestamp: Date;
}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'feedback_submitted',
        userId: data.userId,
        metadata: {
          feedbackType: data.feedbackType,
          priority: data.priority,
          page: data.page,
        },
        timestamp: data.timestamp,
      },
    });
  } catch (error) {
    console.error('Error tracking feedback event:', error);
  }
}
