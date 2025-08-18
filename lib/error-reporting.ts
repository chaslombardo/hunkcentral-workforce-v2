/**
 * Error Reporting Utilities for Production Debugging
 * Provides comprehensive error reporting and debugging tools
 */

import { logServerError, logAuthError, logDatabaseError } from '@/lib/errorLogger';
import { logClientError, logClientComponentError } from '@/lib/client-error-logger';

export interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  type: 'client' | 'server' | 'database' | 'auth' | 'network' | 'component';
  message: string;
  stack?: string;
  context: {
    component: string;
    action: string;
    userId?: string;
    sessionId?: string;
    url: string;
    userAgent?: string;
    environment: string;
    metadata?: Record<string, unknown>;
  };
  resolved: boolean;
  resolution?: {
    resolvedAt: string;
    resolvedBy: string;
    resolution: string;
  };
}

/**
 * Creates a standardized error report
 */
export function createErrorReport(
  error: Error | unknown,
  context: {
    type: ErrorReport['type'];
    component: string;
    action: string;
    userId?: string;
    sessionId?: string;
    url: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): ErrorReport {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  
  return {
    id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level: determineErrorLevel(errorMessage, context.component, context.type),
    type: context.type,
    message: errorMessage,
    stack,
    context: {
      ...context,
      environment: process.env.NODE_ENV || 'unknown',
    },
    resolved: false,
  };
}

/**
 * Determines error severity level based on message, component, and type
 */
function determineErrorLevel(
  message: string,
  component: string,
  type: ErrorReport['type']
): ErrorReport['level'] {
  const lowerMessage = message.toLowerCase();
  const lowerComponent = component.toLowerCase();

  // Critical errors
  const criticalKeywords = [
    'database connection',
    'authentication failed',
    'payment',
    'security',
    'crash',
    'fatal',
    'cannot connect',
    'server error 500',
  ];

  // High priority errors
  const highKeywords = [
    'server error',
    'api error',
    'session expired',
    'permission denied',
    'network error',
    'timeout',
    'unauthorized',
  ];

  // Medium priority errors
  const mediumKeywords = [
    'validation error',
    'form error',
    'component error',
    'render error',
    'not found',
    '404',
  ];

  // Check for critical errors
  if (
    type === 'database' ||
    type === 'auth' ||
    criticalKeywords.some(keyword => 
      lowerMessage.includes(keyword) || lowerComponent.includes(keyword)
    )
  ) {
    return 'critical';
  }

  // Check for high priority errors
  if (
    type === 'server' ||
    type === 'network' ||
    highKeywords.some(keyword => 
      lowerMessage.includes(keyword) || lowerComponent.includes(keyword)
    )
  ) {
    return 'high';
  }

  // Check for medium priority errors
  if (
    type === 'component' ||
    mediumKeywords.some(keyword => 
      lowerMessage.includes(keyword) || lowerComponent.includes(keyword)
    )
  ) {
    return 'medium';
  }

  return 'low';
}

/**
 * Reports a server-side error with comprehensive context
 */
export async function reportServerError(
  error: Error | unknown,
  context: {
    component: string;
    action: string;
    userId?: string;
    sessionId?: string;
    url: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ErrorReport> {
  const report = createErrorReport(error, {
    ...context,
    type: 'server',
  });

  // Log using existing server error logger
  await logServerError(error, {
    component: context.component,
    action: context.action,
    userId: context.userId,
    url: context.url,
    userAgent: context.userAgent,
    additionalData: {
      errorId: report.id,
      level: report.level,
      sessionId: context.sessionId,
      ...context.metadata,
    },
  });

  return report;
}

/**
 * Reports a client-side error with comprehensive context
 */
export async function reportClientError(
  error: Error | unknown,
  context: {
    component: string;
    action: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ErrorReport> {
  const report = createErrorReport(error, {
    ...context,
    type: 'client',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
  });

  // Log using existing client error logger
  await logClientError(error, {
    component: context.component,
    action: context.action,
    userId: context.userId,
    additionalData: {
      errorId: report.id,
      level: report.level,
      ...context.metadata,
    },
  });

  return report;
}

/**
 * Reports a database error with query context
 */
export async function reportDatabaseError(
  error: Error | unknown,
  context: {
    operation: string;
    table?: string;
    userId?: string;
    url: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ErrorReport> {
  const report = createErrorReport(error, {
    ...context,
    type: 'database',
    component: 'database',
    action: context.operation,
  });

  // Log using existing database error logger
  await logDatabaseError(error, {
    operation: context.operation,
    table: context.table,
    userId: context.userId,
    url: context.url,
    additionalData: {
      errorId: report.id,
      level: report.level,
      ...context.metadata,
    },
  });

  return report;
}

/**
 * Reports an authentication error
 */
export async function reportAuthError(
  error: Error | unknown,
  context: {
    action: 'login' | 'session_validation' | 'redirect' | 'logout' | 'permission_check' | 'api_auth' | 'page_auth';
    userId?: string;
    url: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ErrorReport> {
  const report = createErrorReport(error, {
    ...context,
    type: 'auth',
    component: 'authentication',
  });

  // Log using existing auth error logger
  await logAuthError(error, {
    action: context.action,
    userId: context.userId,
    url: context.url,
    userAgent: context.userAgent,
    additionalData: {
      errorId: report.id,
      level: report.level,
      ...context.metadata,
    },
  });

  return report;
}

/**
 * Reports a component error with React context
 */
export async function reportComponentError(
  error: Error | unknown,
  context: {
    component: string;
    action: string;
    userId?: string;
    componentStack?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ErrorReport> {
  const report = createErrorReport(error, {
    ...context,
    type: 'component',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
    metadata: {
      componentStack: context.componentStack,
      ...context.metadata,
    },
  });

  // Log using existing client component error logger
  await logClientComponentError(error, {
    component: context.component,
    action: context.action,
    userId: context.userId,
    additionalData: {
      errorId: report.id,
      level: report.level,
      componentStack: context.componentStack,
      ...context.metadata,
    },
  });

  return report;
}

/**
 * Creates a production-safe error message for users
 */
export function createUserFriendlyErrorMessage(
  error: Error | unknown,
  context: {
    type: ErrorReport['type'];
    component: string;
  }
): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : String(error);
  }

  // Production-safe messages based on error type
  switch (context.type) {
    case 'auth':
      return 'Authentication failed. Please try logging in again.';
    case 'database':
      return 'Unable to load data. Please try again in a moment.';
    case 'network':
      return 'Network connection error. Please check your internet connection.';
    case 'component':
      return 'A component failed to load. Please refresh the page.';
    case 'server':
      return 'Server error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Extracts debugging information from an error
 */
export function extractErrorDebugInfo(error: Error | unknown): {
  message: string;
  stack?: string;
  name?: string;
  cause?: unknown;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: (error as any).cause, // Type assertion for cause property
    };
  }

  return {
    message: String(error),
  };
}

/**
 * Creates a comprehensive error context for debugging
 */
export function createErrorContext(additionalContext?: Record<string, unknown>): Record<string, unknown> {
  const context: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // Add client-side context if available
  if (typeof window !== 'undefined') {
    context.client = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      online: navigator.onLine,
      language: navigator.language,
      platform: navigator.platform,
    };
  }

  // Add server-side context if available
  if (typeof process !== 'undefined') {
    context.server = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
    };
  }

  return {
    ...context,
    ...additionalContext,
  };
}

/**
 * Wraps a function with comprehensive error reporting
 */
export function withErrorReporting<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context: {
    component: string;
    action: string;
    type: ErrorReport['type'];
  }
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Report the error based on type
      switch (context.type) {
        case 'server':
          await reportServerError(error, {
            component: context.component,
            action: context.action,
            url: 'wrapped_function',
            metadata: createErrorContext({ args: args.length }),
          });
          break;
        case 'client':
          await reportClientError(error, {
            component: context.component,
            action: context.action,
            metadata: createErrorContext({ args: args.length }),
          });
          break;
        case 'database':
          await reportDatabaseError(error, {
            operation: context.action,
            url: 'wrapped_function',
            metadata: createErrorContext({ args: args.length }),
          });
          break;
        case 'component':
          await reportComponentError(error, {
            component: context.component,
            action: context.action,
            metadata: createErrorContext({ args: args.length }),
          });
          break;
      }
      
      throw error;
    }
  };
}