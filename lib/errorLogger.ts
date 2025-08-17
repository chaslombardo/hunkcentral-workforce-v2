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
    
    const errorLog: ServerErrorLog = {
      level: 'error',
      message: errorMessage,
      context: {
        ...context,
        timestamp: Date.now(),
        stack,
      },
      resolved: false,
    };

    // Log to console in development for immediate visibility
    if (process.env.NODE_ENV === 'development') {
      console.error('Server Error:', {
        message: errorMessage,
        component: context.component,
        action: context.action,
        userId: context.userId,
        url: context.url,
        stack,
      });
    }

    // In production, we could send to external error tracking service
    // For now, we'll store in database if available
    if (process.env.NODE_ENV === 'production') {
      try {
        // Store error in database for production monitoring
        await prisma.auditLog.create({
          data: {
            entityType: 'system_error',
            entityId: `error_${Date.now()}`,
            action: 'server_error',
            userId: context.userId || 'system',
            changes: JSON.parse(JSON.stringify({
              level: errorLog.level,
              message: errorLog.message,
              component: context.component,
              action: context.action,
              url: context.url,
              userAgent: context.userAgent,
              stack: stack?.substring(0, 1000), // Limit stack trace length
              additionalData: context.additionalData,
            })),
          },
        });
      } catch (dbError) {
        // If database logging fails, fall back to console
        console.error('Failed to log error to database:', dbError);
        console.error('Original error:', errorLog);
      }
    }
  } catch (loggingError) {
    // Ensure error logging never breaks the application
    console.error('Error logging failed:', loggingError);
    console.error('Original error:', error);
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