import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { abTesting } from '@/lib/ab-testing';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);

    const experimentName = searchParams.get('experiment');
    const action = searchParams.get('action');
    const userId = session?.user?.id;

    // Get variant assignment for a specific experiment
    if (experimentName && action === 'get_variant') {
      const sessionId = !userId ? generateSessionId() : undefined;
      const variant = await abTesting.getVariant(
        experimentName,
        userId,
        sessionId
      );

      return NextResponse.json({
        success: true,
        variant,
        experimentName,
        userId: userId || null,
        sessionId: sessionId || null,
      });
    }

    // Get experiment results
    if (experimentName && action === 'get_results') {
      const results = await abTesting.getResults(experimentName);
      return NextResponse.json({
        success: true,
        results,
      });
    }

    // List all experiments
    const experiments = await prisma.aBTestExperiment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            assignments: true,
            events: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      experiments: experiments.map((exp) => ({
        id: exp.id,
        name: exp.name,
        description: exp.description,
        status: exp.status,
        startDate: exp.startDate,
        endDate: exp.endDate,
        targetMetric: exp.targetMetric,
        variants: exp.variants,
        participantCount: exp._count.assignments,
        eventCount: exp._count.events,
        createdAt: exp.createdAt,
        updatedAt: exp.updatedAt,
      })),
    });
  } catch (error) {
    console.error('A/B Tests API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process A/B test request',
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
    const { action, experimentName, eventType, value, metadata, config } = body;

    // Track A/B test event
    if (action === 'track_event' && experimentName && eventType) {
      const userId = session?.user?.id;
      const sessionId = !userId ? generateSessionId() : undefined;

      await abTesting.trackEvent(
        experimentName,
        eventType,
        userId,
        sessionId,
        value,
        metadata
      );

      return NextResponse.json({
        success: true,
        message: 'Event tracked successfully',
        experimentName,
        eventType,
        userId: userId || null,
        sessionId: sessionId || null,
      });
    }

    // Create new experiment (admin only)
    if (action === 'create_experiment' && config) {
      if (!session?.user?.roles?.includes('admin')) {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        );
      }

      const experiment = await abTesting.createExperiment(config);

      return NextResponse.json({
        success: true,
        experiment: {
          id: experiment.id,
          name: experiment.name,
          description: experiment.description,
          status: experiment.status,
          variants: experiment.variants,
          targetMetric: experiment.targetMetric,
          createdAt: experiment.createdAt,
        },
      });
    }

    // Start experiment (admin only)
    if (action === 'start_experiment' && experimentName) {
      if (!session?.user?.roles?.includes('admin')) {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        );
      }

      const experiment = await abTesting.startExperiment(experimentName);

      return NextResponse.json({
        success: true,
        experiment: {
          id: experiment.id,
          name: experiment.name,
          status: experiment.status,
          startDate: experiment.startDate,
        },
      });
    }

    // Stop experiment (admin only)
    if (action === 'stop_experiment' && experimentName) {
      if (!session?.user?.roles?.includes('admin')) {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        );
      }

      const experiment = await abTesting.stopExperiment(experimentName);

      return NextResponse.json({
        success: true,
        experiment: {
          id: experiment.id,
          name: experiment.name,
          status: experiment.status,
          endDate: experiment.endDate,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('A/B Tests API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process A/B test request',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
