/**
 * Production Logging Utilities
 * Provides structured logging for production environments
 */

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  component: string;
  action: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a structured log entry
 */
function createLogEntry(
  level: LogEntry['level'],
  message: string,
  context: {
    component: string;
    action: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    component: context.component,
    action: context.action,
    userId: context.userId,
    sessionId: context.sessionId,
    requestId: context.requestId,
    url: context.url,
    userAgent: context.userAgent,
    metadata: context.metadata,
  };
}

/**
 * Logs structured information messages
 */
export function logInfo(
  message: string,
  context: {
    component: string;
    action: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  if (process.env.NODE_ENV === 'production') {
    const logEntry = createLogEntry('INFO', message, context);
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Logs structured warning messages
 */
export function logWarning(
  message: string,
  context: {
    component: string;
    action: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const logEntry = createLogEntry('WARN', message, context);

  if (process.env.NODE_ENV === 'production') {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.warn(JSON.stringify(logEntry, null, 2));
  }
}

/**
 * Logs authentication events
 */
export function logAuthEvent(
  event:
    | 'login_attempt'
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'session_expired'
    | 'permission_denied',
  context: {
    userId?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const message = `Authentication event: ${event}`;
  const logEntry = createLogEntry('INFO', message, {
    component: 'authentication',
    action: event,
    ...context,
  });

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Logs database operations
 */
export function logDatabaseOperation(
  operation: 'create' | 'read' | 'update' | 'delete' | 'query',
  table: string,
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    duration?: number;
    recordCount?: number;
    metadata?: Record<string, unknown>;
  }
): void {
  const message = `Database ${operation} on ${table}`;
  const logEntry = createLogEntry('INFO', message, {
    component: 'database',
    action: `${operation}_${table}`,
    ...context,
    metadata: {
      table,
      operation,
      duration: context.duration,
      recordCount: context.recordCount,
      ...context.metadata,
    },
  });

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Logs API requests and responses
 */
export function logApiRequest(
  method: string,
  endpoint: string,
  context: {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    statusCode?: number;
    duration?: number;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const message = `API ${method} ${endpoint}`;
  const level =
    context.statusCode && context.statusCode >= 400 ? 'WARN' : 'INFO';

  const logEntry = createLogEntry(level, message, {
    component: 'api',
    action: `${method.toLowerCase()}_${endpoint.replace(/\//g, '_')}`,
    ...context,
    metadata: {
      method,
      endpoint,
      statusCode: context.statusCode,
      duration: context.duration,
      ...context.metadata,
    },
  });

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Logs performance metrics
 */
export function logPerformanceMetric(
  metric: string,
  value: number,
  context: {
    component: string;
    action: string;
    userId?: string;
    sessionId?: string;
    unit?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const message = `Performance metric: ${metric} = ${value}${context.unit || ''}`;
  const logEntry = createLogEntry('INFO', message, {
    ...context,
    metadata: {
      metric,
      value,
      unit: context.unit,
      ...context.metadata,
    },
  });

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Logs business events
 */
export function logBusinessEvent(
  event: string,
  context: {
    userId?: string;
    sessionId?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const message = `Business event: ${event}`;
  const logEntry = createLogEntry('INFO', message, {
    component: 'business',
    action: event,
    ...context,
    metadata: {
      event,
      entityType: context.entityType,
      entityId: context.entityId,
      ...context.metadata,
    },
  });

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Creates a request-scoped logger with consistent context
 */
export function createRequestLogger(context: {
  requestId: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}) {
  return {
    info: (
      message: string,
      additionalContext: {
        component: string;
        action: string;
        metadata?: Record<string, unknown>;
      }
    ) => logInfo(message, { ...context, ...additionalContext }),

    warning: (
      message: string,
      additionalContext: {
        component: string;
        action: string;
        metadata?: Record<string, unknown>;
      }
    ) => logWarning(message, { ...context, ...additionalContext }),

    authEvent: (
      event: Parameters<typeof logAuthEvent>[0],
      metadata?: Record<string, unknown>
    ) => logAuthEvent(event, { ...context, metadata }),

    dbOperation: (
      operation: Parameters<typeof logDatabaseOperation>[0],
      table: string,
      additionalContext?: {
        duration?: number;
        recordCount?: number;
        metadata?: Record<string, unknown>;
      }
    ) =>
      logDatabaseOperation(operation, table, {
        ...context,
        ...additionalContext,
      }),

    apiRequest: (
      method: string,
      endpoint: string,
      additionalContext?: {
        statusCode?: number;
        duration?: number;
        metadata?: Record<string, unknown>;
      }
    ) => logApiRequest(method, endpoint, { ...context, ...additionalContext }),

    performanceMetric: (
      metric: string,
      value: number,
      additionalContext: {
        component: string;
        action: string;
        unit?: string;
        metadata?: Record<string, unknown>;
      }
    ) =>
      logPerformanceMetric(metric, value, { ...context, ...additionalContext }),

    businessEvent: (
      event: string,
      additionalContext?: {
        entityType?: string;
        entityId?: string;
        metadata?: Record<string, unknown>;
      }
    ) => logBusinessEvent(event, { ...context, ...additionalContext }),
  };
}
