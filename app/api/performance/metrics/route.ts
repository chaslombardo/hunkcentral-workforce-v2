import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getMonitoring } from '@/lib/monitoring';
import { databaseAlerting } from '@/lib/databasePerformanceAlerting';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'dashboard';

    switch (type) {
      case 'dashboard':
        const dashboard = performanceMonitor.getPerformanceDashboard();
        return NextResponse.json(dashboard);

      case 'database':
        const dbSummary = await databaseAlerting.getPerformanceSummary();
        return NextResponse.json(dbSummary);

      case 'alerts':
        const alerts = databaseAlerting.getActiveAlerts();
        return NextResponse.json(alerts);

      case 'real-time':
        // Get real-time metrics for the last 5 minutes
        const realTimeMetrics = {
          timestamp: new Date().toISOString(),
          pageLoad: performanceMonitor.getRecentPageLoadMetrics(5),
          interactions: performanceMonitor.getRecentInteractionMetrics(5),
          systemHealth: performanceMonitor.getSystemHealthStatus(),
        };
        return NextResponse.json(realTimeMetrics);

      default:
        return NextResponse.json(
          { error: 'Invalid metrics type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Performance metrics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, data } = body;

    switch (type) {
      case 'page-load':
        performanceMonitor.trackPageLoad(data.page, data.loadTime, {
          userId: session.user.id,
          ...data.metadata,
        });
        break;

      case 'interaction':
        performanceMonitor.trackInteraction({
          component: data.component,
          action: data.action,
          duration: data.duration,
          metadata: {
            userId: session.user.id,
            ...data.metadata,
          },
        });
        break;

      case 'system-health':
        performanceMonitor.trackSystemHealth({
          ...data,
          userId: session.user.id,
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Performance tracking API error:', error);
    return NextResponse.json(
      { error: 'Failed to track performance metric' },
      { status: 500 }
    );
  }
}
