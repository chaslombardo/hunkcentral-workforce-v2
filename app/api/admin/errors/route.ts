import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { logServerError } from '@/lib/errorLogger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const level = searchParams.get('level');
    // const type = searchParams.get('type'); // TODO: Implement type filtering
    // const resolved = searchParams.get('resolved'); // TODO: Implement resolved filtering

    // Build where clause for filtering
    const where: any = {
      entityType: 'system_error',
    };

    // Add filters based on query parameters
    if (level) {
      where.changes = {
        path: ['level'],
        equals: level,
      };
    }

    // Fetch error logs from audit table
    const errorLogs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Get error statistics
    const stats = await getErrorStats();

    // Transform audit logs to error reports format
    const errors = errorLogs.map(log => {
      const changes = log.changes as any;
      return {
        id: log.entityId,
        timestamp: log.createdAt.toISOString(),
        level: changes.level || 'medium',
        type: determineErrorType(changes.component, changes.message),
        message: changes.message || 'Unknown error',
        stack: changes.errorDetails?.stackTrace,
        context: {
          component: changes.component || 'unknown',
          action: changes.action || 'unknown',
          userId: log.userId,
          sessionId: changes.sessionId,
          url: changes.url || 'unknown',
          userAgent: changes.userAgent,
          environment: changes.environment || 'unknown',
          metadata: {
            errorDetails: changes.errorDetails,
            systemInfo: changes.systemInfo,
            requestInfo: changes.requestInfo,
            additionalData: changes.additionalData,
            debugInfo: changes.debugInfo,
          },
        },
        resolved: changes.resolved || false,
        resolution: changes.resolution,
      };
    });

    return NextResponse.json({
      errors,
      stats,
      pagination: {
        limit,
        offset,
        total: await prisma.auditLog.count({ where }),
      },
    });
  } catch (error) {
    await logServerError(error, {
      component: 'api_admin_errors',
      action: 'get_errors',
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(
      { error: 'Failed to fetch error data' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { errorId, resolution } = body;

    if (!errorId || !resolution) {
      return NextResponse.json(
        { error: 'Missing errorId or resolution' },
        { status: 400 }
      );
    }

    // Update the error log to mark as resolved
    const errorLog = await prisma.auditLog.findFirst({
      where: {
        entityId: errorId,
        entityType: 'system_error',
      },
    });

    if (!errorLog) {
      return NextResponse.json(
        { error: 'Error not found' },
        { status: 404 }
      );
    }

    const updatedChanges = {
      ...(errorLog.changes as any),
      resolved: true,
      resolution: {
        resolvedAt: new Date().toISOString(),
        resolvedBy: session.user.id,
        resolution,
      },
    };

    await prisma.auditLog.update({
      where: { id: errorLog.id },
      data: {
        changes: updatedChanges,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await logServerError(error, {
      component: 'api_admin_errors',
      action: 'resolve_error',
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json(
      { error: 'Failed to resolve error' },
      { status: 500 }
    );
  }
}

async function getErrorStats() {
  try {
    const errorLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'system_error',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const stats = {
      total: errorLogs.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolved: 0,
      byType: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      trend: 'stable' as 'up' | 'down' | 'stable',
    };

    errorLogs.forEach(log => {
      const changes = log.changes as any;
      const level = changes.level || 'medium';
      const component = changes.component || 'unknown';
      const type = determineErrorType(component, changes.message);

      // Count by level
      if (level === 'critical') stats.critical++;
      else if (level === 'high') stats.high++;
      else if (level === 'medium') stats.medium++;
      else stats.low++;

      // Count resolved
      if (changes.resolved) stats.resolved++;

      // Count by type
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by component
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
    });

    // Calculate trend (simplified)
    const recentErrors = errorLogs.filter(log => 
      log.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    const previousErrors = errorLogs.filter(log => 
      log.createdAt > new Date(Date.now() - 48 * 60 * 60 * 1000) &&
      log.createdAt <= new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;

    if (recentErrors > previousErrors * 1.2) stats.trend = 'up';
    else if (recentErrors < previousErrors * 0.8) stats.trend = 'down';

    return stats;
  } catch (error) {
    return {
      total: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      resolved: 0,
      byType: {},
      byComponent: {},
      trend: 'stable' as const,
    };
  }
}

function determineErrorType(component: string, message: string): string {
  const lowerComponent = component.toLowerCase();
  const lowerMessage = message.toLowerCase();

  if (lowerComponent.includes('auth') || lowerMessage.includes('auth')) return 'auth';
  if (lowerComponent.includes('database') || lowerMessage.includes('database')) return 'database';
  if (lowerComponent.includes('server') || lowerMessage.includes('server')) return 'server';
  if (lowerComponent.includes('client') || lowerMessage.includes('client')) return 'client';
  if (lowerComponent.includes('network') || lowerMessage.includes('network')) return 'network';
  
  return 'component';
}