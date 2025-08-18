import { prisma } from '@/lib/prisma';

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  userAgent?: string;
  url: string;
  timestamp: number;
  stack?: string;
  additionalData?: Record<string, unknown>;
}

export interface ServerErrorLog {
  level: 'error' | 'warn' | 'info';
  message: string;
  context: ErrorContext;
  resolved: boolean;
}

/**
 * Logs server-side errors with comprehensive context information
 */
export async function logServerError(
  error: Error | unknown,
  context: Omit<ErrorContext, 'timestamp'>
): Promise<void> {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    // Enhanced error context with more debugging information
    const enhancedContext = {
      ...context,
      timestamp: Date.now(),
      stack,
      // Add comprehensive debugging context
      errorDetails: {
        name: error instanceof Error ? error.name : 'Unknown',
        cause: error instanceof Error ? (error as any).cause : undefined, // Type assertion for cause property
        message: errorMessage,
        stackTrace: stack,
      },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      requestInfo: {
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    
    const errorLog: ServerErrorLog = {
      level: 'error',
      message: errorMessage,
      context: enhancedContext,
      resolved: false,
    };

    // Enhanced production logging
    if (process.env.NODE_ENV === 'production') {
      try {
        // Store error in database for production monitoring with enhanced context
        const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.auditLog.create({
          data: {
            entityType: 'system_error',
            entityId: errorId,
            action: 'server_error',
            userId: context.userId || 'system',
            changes: JSON.parse(JSON.stringify({
              errorId,
              level: errorLog.level,
              message: errorLog.message,
              component: context.component,
              action: context.action,
              url: context.url,
              userAgent: context.userAgent,
              // Enhanced stack trace with full context
              errorDetails: enhancedContext.errorDetails,
              systemInfo: enhancedContext.systemInfo,
              requestInfo: enhancedContext.requestInfo,
              additionalData: context.additionalData,
              environment: process.env.NODE_ENV,
              timestamp: new Date(errorLog.context.timestamp).toISOString(),
              severity: determineSeverity(errorMessage, context.component),
              // Add debugging helpers
              debugInfo: {
                stackLines: stack ? stack.split('\n').length : 0,
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                hasStack: !!stack,
                hasCause: !!(error instanceof Error && (error as any).cause),
              },
            })),
          },
        });

        // In production, also log critical errors to external monitoring
        if (isCriticalError(errorMessage, context.component)) {
          await logCriticalError(errorLog);
        }
      } catch (dbError) {
        // If database logging fails, use structured logging for production monitoring
        const structuredLog = {
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: 'Database logging failed',
          error: {
            original: errorMessage,
            component: context.component,
            action: context.action,
            userId: context.userId,
            url: context.url,
            stack: stack?.substring(0, 1000),
          },
          dbError: dbError instanceof Error ? dbError.message : String(dbError),
        };
        
        // Use structured JSON logging for production monitoring tools
        process.stderr.write(JSON.stringify(structuredLog) + '\n');
      }
    } else {
      // Development logging with enhanced context
      const devLog = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: errorMessage,
        component: context.component,
        action: context.action,
        userId: context.userId,
        url: context.url,
        stack,
        additionalData: context.additionalData,
      };
      
      // Use structured logging even in development for consistency
      process.stderr.write(JSON.stringify(devLog, null, 2) + '\n');
    }
  } catch (loggingError) {
    // Ensure error logging never breaks the application
    const fallbackLog = {
      timestamp: new Date().toISOString(),
      level: 'CRITICAL',
      message: 'Error logging system failure',
      originalError: error instanceof Error ? error.message : String(error),
      loggingError: loggingError instanceof Error ? loggingError.message : String(loggingError),
    };
    
    process.stderr.write(JSON.stringify(fallbackLog) + '\n');
  }
}

/**
 * Determines the severity level of an error based on message and component
 */
function determineSeverity(message: string, component: string): 'low' | 'medium' | 'high' | 'critical' {
  const criticalKeywords = ['database', 'auth', 'payment', 'security', 'crash'];
  const highKeywords = ['server', 'api', 'session', 'permission'];
  const mediumKeywords = ['validation', 'form', 'ui', 'component'];
  
  const lowerMessage = message.toLowerCase();
  const lowerComponent = component.toLowerCase();
  
  if (criticalKeywords.some(keyword => lowerMessage.includes(keyword) || lowerComponent.includes(keyword))) {
    return 'critical';
  }
  
  if (highKeywords.some(keyword => lowerMessage.includes(keyword) || lowerComponent.includes(keyword))) {
    return 'high';
  }
  
  if (mediumKeywords.some(keyword => lowerMessage.includes(keyword) || lowerComponent.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Checks if an error is critical and requires immediate attention
 */
function isCriticalError(message: string, component: string): boolean {
  return determineSeverity(message, component) === 'critical';
}

/**
 * Logs critical errors to external monitoring service
 */
async function logCriticalError(errorLog: ServerErrorLog): Promise<void> {
  try {
    // In a real production environment, this would send to services like:
    // - Sentry
    // - DataDog
    // - New Relic
    // - Custom webhook
    
    const criticalAlert = {
      timestamp: new Date().toISOString(),
      level: 'CRITICAL',
      service: 'hunkcentral',
      environment: process.env.NODE_ENV,
      error: errorLog,
      alertType: 'critical_error',
    };
    
    // For now, log to stderr with CRITICAL prefix for monitoring tools to pick up
    process.stderr.write(`CRITICAL_ALERT: ${JSON.stringify(criticalAlert)}\n`);
    
    // TODO: Implement actual external service integration
    // Example: await sendToSentry(criticalAlert);
    // Example: await sendToSlack(criticalAlert);
  } catch (alertError) {
    // Don't let critical alerting break the application
    process.stderr.write(`ALERT_SYSTEM_FAILURE: ${JSON.stringify({ error: alertError })}\n`);
  }
}

/**
 * Logs authentication-related errors with specific context
 */
export async function logAuthError(
  error: Error | unknown,
  context: {
    action: 'login' | 'session_validation' | 'redirect' | 'logout' | 'permission_check' | 'api_auth' | 'page_auth';
    userId?: string;
    url: string;
    userAgent?: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<void> {
  await logServerError(error, {
    component: 'authentication',
    action: context.action,
    userId: context.userId,
    url: context.url,
    userAgent: context.userAgent,
    additionalData: context.additionalData,
  });
}

/**
 * Logs database-related errors with query context
 */
export async function logDatabaseError(
  error: Error | unknown,
  context: {
    operation: string;
    table?: string;
    userId?: string;
    url: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<void> {
  await logServerError(error, {
    component: 'database',
    action: context.operation,
    userId: context.userId,
    url: context.url,
    additionalData: {
      table: context.table,
      ...context.additionalData,
    },
  });
}

/**
 * Logs page rendering errors with component context
 */
export async function logPageError(
  error: Error | unknown,
  context: {
    page: string;
    userId?: string;
    url: string;
    userAgent?: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<void> {
  await logServerError(error, {
    component: 'page_render',
    action: `render_${context.page}`,
    userId: context.userId,
    url: context.url,
    userAgent: context.userAgent,
    additionalData: context.additionalData,
  });
}

/**
 * Creates a standardized error response for API routes
 */
export function createErrorResponse(
  error: Error | unknown,
  context: {
    component: string;
    action: string;
    userId?: string;
  }
): {
  error: string;
  message: string;
  timestamp: number;
} {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  // Log the error
  logServerError(error, {
    ...context,
    url: 'api_route',
  });

  return {
    error: 'server_error',
    message: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred',
    timestamp: Date.now(),
  };
}

/**
 * Wraps async functions with error handling and logging
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: {
    component: string;
    action: string;
  }
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      await logServerError(error, {
        ...context,
        url: 'wrapped_function',
      });
      throw error;
    }
  };
}