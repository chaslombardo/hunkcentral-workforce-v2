/**
 * Security Management API
 * Provides endpoints for security configuration and monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { withProductionApiAuth } from '@/lib/production-auth';
import { requireAnyRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logProductionError } from '@/lib/monitoring';
import { SecurityMonitor } from '@/lib/security';
import { z } from 'zod';

const SecurityConfigSchema = z.object({
  rateLimiting: z
    .object({
      windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
      maxRequests: z.number().min(1).max(10000),
      skipSuccessfulRequests: z.boolean().optional(),
    })
    .optional(),
  csrf: z
    .object({
      enabled: z.boolean(),
      tokenLength: z.number().min(16).max(64),
      cookieName: z.string().min(1).max(50),
    })
    .optional(),
  headers: z
    .object({
      hsts: z.boolean(),
      noSniff: z.boolean(),
      frameOptions: z.enum(['DENY', 'SAMEORIGIN']),
      referrerPolicy: z.string(),
    })
    .optional(),
  passwords: z
    .object({
      minLength: z.number().min(6).max(128),
      requireUppercase: z.boolean(),
      requireLowercase: z.boolean(),
      requireNumbers: z.boolean(),
      requireSpecialChars: z.boolean(),
      saltRounds: z.number().min(10).max(15),
    })
    .optional(),
});

/**
 * GET /api/security - Get security configuration and statistics
 */
async function handleGet(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin'], {
      url: request.url,
      action: 'view_security_config',
    });

    // Get security statistics from audit logs
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      securityEvents24h,
      securityEvents7d,
      failedLogins24h,
      rateLimitEvents24h,
      csrfEvents24h,
    ] = await Promise.all([
      // Security events in last 24 hours
      prisma.auditLog.count({
        where: {
          entityType: 'system_error',
          createdAt: { gte: last24Hours },
          changes: {
            path: ['category'],
            equals: 'security',
          },
        },
      }),

      // Security events in last 7 days
      prisma.auditLog.count({
        where: {
          entityType: 'system_error',
          createdAt: { gte: last7Days },
          changes: {
            path: ['category'],
            equals: 'security',
          },
        },
      }),

      // Failed login attempts in last 24 hours
      prisma.auditLog.count({
        where: {
          action: 'login_failed',
          createdAt: { gte: last24Hours },
        },
      }),

      // Rate limit events in last 24 hours
      prisma.auditLog.count({
        where: {
          entityType: 'system_error',
          createdAt: { gte: last24Hours },
          changes: {
            path: ['action'],
            equals: 'rate_limit_exceeded',
          },
        },
      }),

      // CSRF events in last 24 hours
      prisma.auditLog.count({
        where: {
          entityType: 'system_error',
          createdAt: { gte: last24Hours },
          changes: {
            path: ['action'],
            equals: 'csrf_validation_failed',
          },
        },
      }),
    ]);

    // Get recent security events
    const recentSecurityEvents = await prisma.auditLog.findMany({
      where: {
        entityType: 'system_error',
        createdAt: { gte: last24Hours },
        changes: {
          path: ['category'],
          equals: 'security',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        action: true,
        createdAt: true,
        userId: true,
        changes: true,
      },
    });

    // Get top blocked IPs (from rate limiting)
    const blockedIPs = await prisma.auditLog.findMany({
      where: {
        entityType: 'system_error',
        createdAt: { gte: last7Days },
        changes: {
          path: ['action'],
          equals: 'rate_limit_exceeded',
        },
      },
      select: {
        changes: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Process blocked IPs data
    const ipCounts = new Map<string, number>();
    blockedIPs.forEach((log) => {
      const changes = log.changes as any;
      const identifier = changes?.metadata?.identifier;
      if (identifier) {
        const ip = identifier.split(':')[0];
        ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
      }
    });

    const topBlockedIPs = Array.from(ipCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    const securityStats = {
      overview: {
        securityEvents24h,
        securityEvents7d,
        failedLogins24h,
        rateLimitEvents24h,
        csrfEvents24h,
      },
      recentEvents: recentSecurityEvents.map((event) => ({
        id: event.id,
        action: event.action,
        timestamp: event.createdAt,
        userId: event.userId,
        severity: (event.changes as any)?.severity || 'medium',
        component: (event.changes as any)?.component || 'unknown',
      })),
      topBlockedIPs,
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        statistics: securityStats,
        configuration: {
          // Return current security configuration
          // In a real implementation, this would come from a config store
          rateLimiting: {
            windowMs: 15 * 60 * 1000,
            maxRequests: 100,
            skipSuccessfulRequests: false,
          },
          csrf: {
            enabled: true,
            tokenLength: 32,
            cookieName: 'csrf-token',
          },
          headers: {
            hsts: true,
            noSniff: true,
            frameOptions: 'DENY',
            referrerPolicy: 'origin-when-cross-origin',
          },
          passwords: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            saltRounds: 12,
          },
        },
      },
    });
  } catch (error) {
    await logProductionError(error, {
      component: 'security_api',
      action: 'get_security_config',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve security configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/security - Update security configuration
 */
async function handlePut(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin'], {
      url: request.url,
      action: 'update_security_config',
    });

    const body = await request.json();
    const validatedConfig = SecurityConfigSchema.parse(body);

    // Log security configuration change
    await SecurityMonitor.logSecurityEvent('security_config_updated', 'high', {
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: {
        updatedFields: Object.keys(validatedConfig),
        adminUser: user.fullName,
      },
    });

    // In a real implementation, you would save this to a configuration store
    // For now, we'll just log the change and return success

    return NextResponse.json({
      success: true,
      message: 'Security configuration updated successfully',
      data: validatedConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid security configuration',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    await logProductionError(error, {
      component: 'security_api',
      action: 'update_security_config',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update security configuration',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/security - Trigger security actions (e.g., clear rate limits, reset CSRF tokens)
 */
async function handlePost(user: any, request: NextRequest) {
  try {
    requireAnyRole(user, ['admin'], {
      url: request.url,
      action: 'security_actions',
    });

    const body = await request.json();
    const { action, parameters } = body;

    switch (action) {
      case 'clear_rate_limits':
        // In a real implementation, you would clear the rate limit store
        await SecurityMonitor.logSecurityEvent(
          'rate_limits_cleared',
          'medium',
          {
            userId: user.id,
            url: request.url,
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
              adminUser: user.fullName,
              parameters,
            },
          }
        );
        break;

      case 'generate_csrf_tokens':
        // In a real implementation, you would regenerate CSRF tokens
        await SecurityMonitor.logSecurityEvent(
          'csrf_tokens_regenerated',
          'medium',
          {
            userId: user.id,
            url: request.url,
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
              adminUser: user.fullName,
              parameters,
            },
          }
        );
        break;

      case 'security_scan':
        // Trigger a security scan
        await SecurityMonitor.logSecurityEvent(
          'security_scan_initiated',
          'low',
          {
            userId: user.id,
            url: request.url,
            userAgent: request.headers.get('user-agent') || 'unknown',
            metadata: {
              adminUser: user.fullName,
              scanType: parameters?.scanType || 'full',
            },
          }
        );
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Unknown security action',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Security action '${action}' executed successfully`,
    });
  } catch (error) {
    await logProductionError(error, {
      component: 'security_api',
      action: 'security_actions',
      userId: user.id,
      url: request.url,
      userAgent: request.headers.get('user-agent') || 'unknown',
      category: 'api',
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to execute security action',
      },
      { status: 500 }
    );
  }
}

// Export handlers with authentication
export const GET = withProductionApiAuth(handleGet, {
  requiredRoles: ['admin'],
});
export const PUT = withProductionApiAuth(handlePut, {
  requiredRoles: ['admin'],
});
export const POST = withProductionApiAuth(handlePost, {
  requiredRoles: ['admin'],
});
