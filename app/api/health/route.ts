/**
 * Health Check API Endpoint
 * Provides system health status and monitoring data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMonitoring, initializeMonitoring } from '@/lib/monitoring';
import { getMonitoringIntegration } from '@/lib/monitoring-integration';
import { config, isMonitoringEnabled } from '@/lib/production-config';
import { logApiRequest } from '@/lib/production-logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const url = request.url;
  const userAgent = request.headers.get('user-agent') || '';

  try {
    // Initialize monitoring if not already done
    const monitoring = getMonitoring() || initializeMonitoring();
    const monitoringIntegration = getMonitoringIntegration();

    // Get query parameters
    const { searchParams } = new URL(url);
    const detailed = searchParams.get('detailed') === 'true';
    const checks = searchParams.get('checks') === 'true';
    const metrics = searchParams.get('metrics') === 'true';
    const alerts = searchParams.get('alerts') === 'true';

    // Get system status from both monitoring systems
    const systemStatus = await monitoring.getSystemStatus();
    const integrationHealth = monitoringIntegration.getSystemHealth();

    // Determine overall status
    const overallStatus =
      integrationHealth?.status === 'unhealthy' ||
      systemStatus.status === 'unhealthy'
        ? 'unhealthy'
        : integrationHealth?.status === 'degraded' ||
            systemStatus.status === 'degraded'
          ? 'degraded'
          : 'healthy';

    // Basic health response
    const healthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: config.deployment.version,
      environment: config.deployment.environment,
      region: config.deployment.region,
      uptime: process.uptime(),
      buildId: config.deployment.buildId,
      services: integrationHealth?.services || {},
      enabledMonitoringServices: monitoringIntegration.getEnabledServices(),
    };

    // Add detailed information if requested
    if (detailed || checks || metrics || alerts) {
      const detailedResponse = {
        ...healthResponse,
        ...((detailed || checks) && {
          healthChecks: systemStatus.checks,
        }),
        ...((detailed || metrics) && {
          metrics: systemStatus.metrics,
          recentMetrics: monitoring.getMetrics(10),
          serviceMetrics: await monitoringIntegration.getServiceMetrics(),
        }),
        ...((detailed || alerts) && {
          alerts: monitoring.getAlerts(20),
          activeAlerts: systemStatus.activeAlerts,
        }),
        ...(detailed && {
          system: {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
          },
          deployment: config.deployment,
          monitoring: {
            enabled: isMonitoringEnabled('enablePerformanceMonitoring'),
            errorTracking: isMonitoringEnabled('enableErrorTracking'),
            uptimeMonitoring: isMonitoringEnabled('enableUptimeMonitoring'),
            securityMonitoring: isMonitoringEnabled('enableSecurityMonitoring'),
          },
        }),
      };

      const responseTime = Date.now() - startTime;

      await logApiRequest('GET', '/api/health', {
        statusCode: 200,
        duration: responseTime,
        userAgent,
        metadata: {
          detailed,
          checks,
          metrics,
          alerts,
          systemStatus: overallStatus,
          integrationStatus: integrationHealth?.status,
        },
      });

      return NextResponse.json(detailedResponse, {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': `${responseTime}ms`,
        },
      });
    }

    // Return basic health status
    const responseTime = Date.now() - startTime;

    await logApiRequest('GET', '/api/health', {
      statusCode: 200,
      duration: responseTime,
      userAgent,
      metadata: {
        systemStatus: systemStatus.status,
        basic: true,
      },
    });

    return NextResponse.json(healthResponse, {
      status: overallStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`,
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;

    await logApiRequest('GET', '/api/health', {
      statusCode: 500,
      duration: responseTime,
      userAgent,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  }
}

// POST endpoint for resolving alerts
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const userAgent = request.headers.get('user-agent') || '';

  try {
    const monitoring = getMonitoring();
    if (!monitoring) {
      return NextResponse.json(
        { error: 'Monitoring system not initialized' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, alertId } = body;

    if (action === 'resolve_alert' && alertId) {
      const resolved = await monitoring.resolveAlert(alertId);

      const responseTime = Date.now() - startTime;

      await logApiRequest('POST', '/api/health', {
        statusCode: resolved ? 200 : 404,
        duration: responseTime,
        userAgent,
        metadata: {
          action,
          alertId,
          resolved,
        },
      });

      return NextResponse.json(
        { success: resolved, alertId },
        {
          status: resolved ? 200 : 404,
          headers: {
            'X-Response-Time': `${responseTime}ms`,
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;

    await logApiRequest('POST', '/api/health', {
      statusCode: 500,
      duration: responseTime,
      userAgent,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  }
}
