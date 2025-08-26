/**
 * Simple Uptime Status API
 * Provides basic uptime monitoring data for the dashboard
 */

import { NextResponse } from 'next/server';
import { getUptimeMonitoring } from '@/lib/uptime-monitor';

export async function GET() {
  try {
    const uptimeMonitor = getUptimeMonitoring();

    if (!uptimeMonitor) {
      // Return basic status if uptime monitoring is not enabled
      return NextResponse.json({
        overall: {
          status: 'operational',
          uptime: 100,
        },
        checks: [],
        message: 'Uptime monitoring not enabled',
      });
    }

    const overallStatus = uptimeMonitor.getOverallStatus();
    const allStats = uptimeMonitor.getAllStats();

    const response = {
      overall: {
        status: overallStatus.status,
        uptime: overallStatus.uptime,
        totalChecks: overallStatus.totalChecks,
        operationalChecks: overallStatus.operationalChecks,
      },
      checks: allStats.map((stats) => ({
        name: stats.name,
        status: stats.lastCheck?.status || 'unknown',
        uptime: stats.uptime,
        responseTime: stats.avgResponseTime,
        totalChecks: stats.totalChecks,
        successfulChecks: stats.successfulChecks,
        failedChecks: stats.failedChecks,
      })),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Uptime status API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch uptime status',
        message: error instanceof Error ? error.message : String(error),
        overall: {
          status: 'unknown',
          uptime: 0,
        },
        checks: [],
      },
      { status: 500 }
    );
  }
}
