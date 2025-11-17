import { NextRequest, NextResponse } from 'next/server';
import {
  checkFileSystem as checkFileSystemImpl,
  checkDatabase,
  checkMemoryUsage,
} from '@/lib/server-health-checks';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const component = searchParams.get('component');

    // Run specific component check if requested
    if (component === 'filesystem') {
      const result = await checkFileSystemImpl();
      return NextResponse.json(result);
    }

    if (component === 'database') {
      const result = await checkDatabase();
      return NextResponse.json(result);
    }

    if (component === 'memory') {
      const result = await checkMemoryUsage();
      return NextResponse.json(result);
    }

    // Run all health checks
    const [filesystem, database, memory] = await Promise.allSettled([
      checkFileSystemImpl(),
      checkDatabase(),
      checkMemoryUsage(),
    ]);

    const healthChecks = {
      filesystem:
        filesystem.status === 'fulfilled'
          ? filesystem.value
          : {
              name: 'filesystem',
              status: 'unhealthy',
              responseTime: 0,
              timestamp: new Date().toISOString(),
              error:
                filesystem.status === 'rejected'
                  ? filesystem.reason
                  : 'Unknown error',
            },
      database:
        database.status === 'fulfilled'
          ? database.value
          : {
              name: 'database',
              status: 'unhealthy',
              responseTime: 0,
              timestamp: new Date().toISOString(),
              error:
                database.status === 'rejected'
                  ? database.reason
                  : 'Unknown error',
            },
      memory:
        memory.status === 'fulfilled'
          ? memory.value
          : {
              name: 'memory',
              status: 'unhealthy',
              responseTime: 0,
              timestamp: new Date().toISOString(),
              error:
                memory.status === 'rejected' ? memory.reason : 'Unknown error',
            },
    };

    // Determine overall status
    const unhealthyCount = Object.values(healthChecks).filter(
      (check) => check.status === 'unhealthy'
    ).length;
    const degradedCount = Object.values(healthChecks).filter(
      (check) => check.status === 'degraded'
    ).length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: healthChecks,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
