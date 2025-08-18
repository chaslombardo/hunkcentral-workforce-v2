/**
 * Enhanced Production Error Logger
 * Provides comprehensive server-side error logging with detailed stack traces and context
 */

import { prisma } from '@/lib/prisma';
import { logServerError } from '@/lib/errorLogger';

export interface EnhancedErrorContext {
  component: string;
  action: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url: string;
  userAgent?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  params?: Record<string, string>;
  timestamp: number;
  environment: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'server' | 'database' | 'auth' | 'api' | 'middleware' | 'component';
  metadata?: Record<string, unknown>;
}

export interface EnhancedStackFrame {
  function?: string;
  file?: string;
  line?: number;
  column?: number;
  source?: string;
}

export interface EnhancedErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  parsedStack?: EnhancedStackFrame[];
  context: EnhancedErrorContext;
  fingerprint: string;
  resolved: boolean;
  occurrenceCount: number;
  firstOccurrence: string;
  lastOccurrence: string;
}

/**
 * Parses error stack trace into structured format
 */
function parseStackTrace(stack: string): EnhancedStackFrame[] {
  if (!stack) return [];

  const frames: EnhancedStackFrame[] = [];
  const lines = stack.split('\n');

  for (const line of lines) {
    // Skip the error message line
    if (!line.trim().startsWith('at ')) continue;

    // Parse different stack trace formats
    const match = line.match(/at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?/);
    if (match) {
      const [, functionName, file, lineNum, columnNum] = match;
      frames.push({
        function: functionName?.trim() || '<anonymous>',
        file: file?.trim(),
        line: parseInt(lineNum, 10),
        column: parseInt(columnNum, 10),
        source: line.trim(),
      });
    }
  }

  return frames;
}

/**
 * Creates a fingerprint for error deduplication
 */
function createErrorFingerprint(error: Error, context: EnhancedErrorContext): string {
  const message = error.message || 'Unknown error';
  const component = context.component;
  const action = context.action;
  
  // Extract the first few lines of stack trace for fingerprinting
  const stackLines = error.stack?.split('\n').slice(0, 3).join('|') || '';
  
  // Create a hash-like fingerprint
  const fingerprint = `${component}:${action}:${message}:${stackLines}`
    .replace(/\d+/g, 'N') // Replace numbers with N for better grouping
    .replace(/['"]/g, '') // Remove quotes
    .toLowerCase();
  
  return Buffer.from(fingerprint).toString('base64').substring(0, 32);
}

/**
 * Determines error severity based on context and message
 */
function determineErrorSeverity(
  error: Error, 
  context: Partial<EnhancedErrorContext>
): EnhancedErrorContext['severity'] {
  const message = error.message.toLowerCase();
  const component = context.component?.toLowerCase() || '';
  const category = context.category || 'server';

  // Critical errors
  const criticalKeywords = [
    'database connection',
    'authentication failed',
    'payment failed',
    'security violation',
    'data corruption',
    'system crash',
    'fatal error',
    'cannot connect to database',
    'prisma client initialization',
  ];

  // High priority errors
  const highKeywords = [
    'server error',
    'api timeout',
    'session expired',
    'permission denied',
    'network timeout',
    'unauthorized access',
    'validation failed',
    'rate limit exceeded',
  ];

  // Medium priority errors
  const mediumKeywords = [
    'not found',
    'bad request',
    'invalid input',
    'parsing error',
    'format error',
    'type error',
  ];

  // Check for critical errors
  if (
    category === 'database' ||
    category === 'auth' ||
    criticalKeywords.some(keyword => 
      message.includes(keyword) || component.includes(keyword)
    )
  ) {
    return 'critical';
  }

  // Check for high priority errors
  if (
    category === 'api' ||
    highKeywords.some(keyword => 
      message.includes(keyword) || component.includes(keyword)
    )
  ) {
    return 'high';
  }

  // Check for medium priority errors
  if (
    mediumKeywords.some(keyword => 
      message.includes(keyword) || component.includes(keyword)
    )
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Enhanced server error logging with comprehensive context and deduplication
 */
export async function logProductionError(
  error: Error | unknown,
  context: Omit<EnhancedErrorContext, 'timestamp' | 'environment' | 'severity' | 'category'> & {
    category?: EnhancedErrorContext['category'];
  }
): Promise<EnhancedErrorLog> {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  const timestamp = Date.now();
  const environment = process.env.NODE_ENV || 'unknown';
  
  const enhancedContext: EnhancedErrorContext = {
    ...context,
    timestamp,
    environment,
    severity: determineErrorSeverity(errorObj, context),
    category: context.category || 'server',
  };

  const errorId = `err_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  const fingerprint = createErrorFingerprint(errorObj, enhancedContext);
  const parsedStack = parseStackTrace(errorObj.stack || '');

  const errorLog: EnhancedErrorLog = {
    id: errorId,
    timestamp: new Date(timestamp).toISOString(),
    level: 'error',
    message: errorObj.message || 'Unknown error',
    stack: errorObj.stack,
    parsedStack,
    context: enhancedContext,
    fingerprint,
    resolved: false,
    occurrenceCount: 1,
    firstOccurrence: new Date(timestamp).toISOString(),
    lastOccurrence: new Date(timestamp).toISOString(),
  };

  try {
    // Check if this error has occurred before (deduplication)
    const existingError = await prisma.auditLog.findFirst({
      where: {
        entityType: 'system_error',
        changes: {
          path: ['fingerprint'],
          equals: fingerprint,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingError) {
      // Update existing error with new occurrence
      const existingChanges = existingError.changes as {
        occurrenceCount?: number;
        lastOccurrence?: string;
        recentOccurrences?: Array<{
          timestamp: string;
          context: EnhancedErrorContext;
        }>;
        [key: string]: unknown;
      };
      const updatedChanges = {
        ...existingChanges,
        occurrenceCount: (existingChanges.occurrenceCount || 1) + 1,
        lastOccurrence: errorLog.timestamp,
        latestContext: enhancedContext,
        // Keep track of recent occurrences
        recentOccurrences: [
          ...(existingChanges.recentOccurrences || []).slice(-9), // Keep last 9
          {
            timestamp: errorLog.timestamp,
            context: enhancedContext,
          },
        ],
      };

      await prisma.auditLog.update({
        where: { id: existingError.id },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          changes: updatedChanges as any, // Prisma JSON handling requires any
        },
      });

      // Update the error log with existing data
      errorLog.occurrenceCount = updatedChanges.occurrenceCount;
      errorLog.firstOccurrence = (existingChanges.firstOccurrence as string) || errorLog.firstOccurrence;
    } else {
      // Create new error log entry
      await prisma.auditLog.create({
        data: {
          entityType: 'system_error',
          entityId: errorId,
          action: 'error_logged',
          userId: context.userId || 'system',
          changes: JSON.parse(JSON.stringify({
            ...errorLog,
            // Enhanced debugging information
            debugInfo: {
              nodeVersion: process.version,
              platform: process.platform,
              arch: process.arch,
              memoryUsage: process.memoryUsage(),
              uptime: process.uptime(),
              stackFrameCount: parsedStack.length,
              errorType: errorObj.constructor.name,
              hasStack: !!errorObj.stack,
              hasCause: !!(errorObj as Error & { cause?: unknown }).cause,
            },
            // Request context
            requestInfo: {
              method: context.method,
              url: context.url,
              userAgent: context.userAgent,
              headers: context.headers,
              query: context.query,
              params: context.params,
              body: typeof context.body === 'object' ? 
                JSON.stringify(context.body).substring(0, 1000) : 
                String(context.body).substring(0, 1000),
            },
            // System context
            systemInfo: {
              timestamp: new Date().toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              locale: Intl.DateTimeFormat().resolvedOptions().locale,
            },
          })),
        },
      });
    }

    // Also use the existing error logger for compatibility
    await logServerError(errorObj, {
      component: context.component,
      action: context.action,
      userId: context.userId,
      url: context.url,
      userAgent: context.userAgent,
      additionalData: {
        errorId,
        fingerprint,
        severity: enhancedContext.severity,
        category: enhancedContext.category,
        parsedStackFrames: parsedStack.length,
        occurrenceCount: errorLog.occurrenceCount,
      },
    });

    // Send critical errors to external monitoring
    if (enhancedContext.severity === 'critical') {
      await sendCriticalErrorAlert(errorLog);
    }

    return errorLog;
  } catch (loggingError) {
    // Fallback logging if database fails
    const fallbackLog = {
      timestamp: new Date().toISOString(),
      level: 'CRITICAL',
      message: 'Production error logging failed',
      originalError: errorObj.message,
      loggingError: loggingError instanceof Error ? loggingError.message : String(loggingError),
      context: enhancedContext,
    };
    
    process.stderr.write(JSON.stringify(fallbackLog) + '\n');
    
    return errorLog;
  }
}

/**
 * Sends critical error alerts to external monitoring services
 */
async function sendCriticalErrorAlert(errorLog: EnhancedErrorLog): Promise<void> {
  try {
    const alert = {
      timestamp: errorLog.timestamp,
      level: 'CRITICAL',
      service: 'hunkcentral',
      environment: errorLog.context.environment,
      errorId: errorLog.id,
      message: errorLog.message,
      component: errorLog.context.component,
      action: errorLog.context.action,
      severity: errorLog.context.severity,
      category: errorLog.context.category,
      fingerprint: errorLog.fingerprint,
      occurrenceCount: errorLog.occurrenceCount,
      stackFrames: errorLog.parsedStack?.length || 0,
      userId: errorLog.context.userId,
      url: errorLog.context.url,
    };
    
    // Log to stderr with CRITICAL prefix for monitoring tools
    process.stderr.write(`CRITICAL_ALERT: ${JSON.stringify(alert)}\n`);
    
    // TODO: Implement external service integrations
    // Examples:
    // - await sendToSentry(alert);
    // - await sendToSlack(alert);
    // - await sendToDatadog(alert);
    // - await sendToWebhook(alert);
  } catch (alertError) {
    process.stderr.write(`ALERT_SYSTEM_FAILURE: ${JSON.stringify({ 
      error: alertError instanceof Error ? alertError.message : String(alertError),
      originalErrorId: errorLog.id,
    })}\n`);
  }
}

/**
 * Logs API route errors with request context
 */
export async function logApiError(
  error: Error | unknown,
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    query?: Record<string, string>;
    params?: Record<string, string>;
    body?: unknown;
  },
  context: {
    action: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
  }
): Promise<EnhancedErrorLog> {
  return logProductionError(error, {
    component: 'api_route',
    action: context.action,
    userId: context.userId,
    sessionId: context.sessionId,
    requestId: context.requestId,
    url: request.url,
    userAgent: request.headers['user-agent'],
    method: request.method,
    headers: request.headers,
    query: request.query,
    params: request.params,
    body: request.body,
    category: 'api',
  });
}

/**
 * Logs database errors with query context
 */
export async function logDatabaseError(
  error: Error | unknown,
  context: {
    operation: string;
    table?: string;
    query?: string;
    userId?: string;
    url: string;
    metadata?: Record<string, unknown>;
  }
): Promise<EnhancedErrorLog> {
  return logProductionError(error, {
    component: 'database',
    action: context.operation,
    userId: context.userId,
    url: context.url,
    category: 'database',
    metadata: {
      table: context.table,
      query: context.query?.substring(0, 500), // Limit query length
      ...context.metadata,
    },
  });
}

/**
 * Logs authentication errors with security context
 */
export async function logAuthError(
  error: Error | unknown,
  context: {
    action: 'login' | 'session_validation' | 'permission_check' | 'token_validation' | 'logout';
    userId?: string;
    sessionId?: string;
    url: string;
    userAgent?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<EnhancedErrorLog> {
  return logProductionError(error, {
    component: 'authentication',
    action: context.action,
    userId: context.userId,
    sessionId: context.sessionId,
    url: context.url,
    userAgent: context.userAgent,
    category: 'auth',
    metadata: {
      ipAddress: context.ipAddress,
      securityEvent: true,
      ...context.metadata,
    },
  });
}

/**
 * Wraps async functions with enhanced error handling and logging
 */
export function withProductionErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: {
    component: string;
    action: string;
    category?: EnhancedErrorContext['category'];
  }
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      await logProductionError(error, {
        ...context,
        url: 'wrapped_function',
        userAgent: 'server',
      });
      throw error;
    }
  };
}

/**
 * Gets error statistics for monitoring dashboard
 */
export async function getErrorStatistics(timeRange: {
  start: Date;
  end: Date;
}): Promise<{
  total: number;
  bySeverity: Record<string, number>;
  byCategory: Record<string, number>;
  byComponent: Record<string, number>;
  resolved: number;
  topErrors: Array<{
    fingerprint: string;
    message: string;
    occurrenceCount: number;
    component: string;
    severity: string;
  }>;
}> {
  try {
    const errorLogs = await prisma.auditLog.findMany({
      where: {
        entityType: 'system_error',
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end,
        },
      },
    });

    const stats = {
      total: errorLogs.length,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      byComponent: {} as Record<string, number>,
      resolved: 0,
      topErrors: [] as Array<{
        fingerprint: string;
        message: string;
        occurrenceCount: number;
        component: string;
        severity: string;
      }>,
    };

    const errorMap = new Map<string, {
      fingerprint: string;
      message: string;
      occurrenceCount: number;
      component: string;
      severity: string;
    }>();

    errorLogs.forEach(log => {
      const changes = log.changes as {
        severity?: string;
        category?: string;
        component?: string;
        fingerprint?: string;
        message?: string;
        occurrenceCount?: number;
        resolved?: boolean;
        [key: string]: unknown;
      };
      const severity = changes.severity || 'medium';
      const category = changes.category || 'server';
      const component = changes.component || 'unknown';
      const fingerprint = changes.fingerprint;

      // Count by severity
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

      // Count by category
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

      // Count by component
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;

      // Count resolved
      if (changes.resolved) {
        stats.resolved++;
      }

      // Track unique errors for top errors
      if (fingerprint) {
        if (!errorMap.has(fingerprint)) {
          errorMap.set(fingerprint, {
            fingerprint,
            message: changes.message || 'Unknown error',
            occurrenceCount: changes.occurrenceCount || 1,
            component,
            severity,
          });
        }
      }
    });

    // Get top errors by occurrence count
    stats.topErrors = Array.from(errorMap.values())
      .sort((a, b) => b.occurrenceCount - a.occurrenceCount)
      .slice(0, 10);

    return stats;
  } catch (error) {
    console.error('Failed to get error statistics:', error);
    return {
      total: 0,
      bySeverity: {},
      byCategory: {},
      byComponent: {},
      resolved: 0,
      topErrors: [],
    };
  }
}