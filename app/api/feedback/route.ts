import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
