/**
 * Edge Runtime Compatible Logging
 * Minimal logging functions safe for Edge Runtime (middleware)
 */

interface EdgeLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  component: string;
  action: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a minimal log entry for Edge Runtime
 */
function createEdgeLogEntry(
  level: EdgeLogEntry['level'],
  message: string,
  context: {
    component: string;
    action: string;
    userId?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): EdgeLogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    component: context.component,
    action: context.action,
    userId: context.userId,
    url: context.url,
    userAgent: context.userAgent,
    metadata: context.metadata,
  };
}

/**
 * Edge-safe info logging
 */
export function edgeLogInfo(
  message: string,
  context: {
    component: string;
    action: string;
    userId?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  if (process.env.NODE_ENV === 'production') {
    const logEntry = createEdgeLogEntry('INFO', message, context);
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Edge-safe warning logging
 */
export function edgeLogWarning(
  message: string,
  context: {
    component: string;
    action: string;
    userId?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const logEntry = createEdgeLogEntry('WARN', message, context);
  console.warn(JSON.stringify(logEntry));
}

/**
 * Edge-safe auth event logging
 */
export function edgeLogAuthEvent(
  event: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'session_expired' | 'permission_denied',
  context: {
    userId?: string;
    url?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const message = `Authentication event: ${event}`;
  const logEntry = createEdgeLogEntry('INFO', message, {
    component: 'authentication',
    action: event,
    ...context,
  });
  
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Edge-safe API request logging
 */
export function edgeLogApiRequest(
  method: string,
  endpoint: string,
  context: {
    userId?: string;
    statusCode?: number;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const message = `API ${method} ${endpoint}`;
  const level = context.statusCode && context.statusCode >= 400 ? 'WARN' : 'INFO';
  
  const logEntry = createEdgeLogEntry(level, message, {
    component: 'api',
    action: `${method.toLowerCase()}_${endpoint.replace(/\//g, '_')}`,
    ...context,
    metadata: {
      method,
      endpoint,
      statusCode: context.statusCode,
      ...context.metadata,
    },
  });
  
  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(logEntry));
  }
}

/**
 * Edge-safe request logger factory
 */
export function createEdgeRequestLogger(context: {
  requestId: string;
  userId?: string;
  url?: string;
  userAgent?: string;
}) {
  return {
    info: (message: string, additionalContext: { component: string; action: string; metadata?: Record<string, unknown> }) =>
      edgeLogInfo(message, { ...context, ...additionalContext }),
    
    warning: (message: string, additionalContext: { component: string; action: string; metadata?: Record<string, unknown> }) =>
      edgeLogWarning(message, { ...context, ...additionalContext }),
    
    authEvent: (event: Parameters<typeof edgeLogAuthEvent>[0], metadata?: Record<string, unknown>) =>
      edgeLogAuthEvent(event, { ...context, metadata }),
    
    apiRequest: (method: string, endpoint: string, additionalContext?: { statusCode?: number; metadata?: Record<string, unknown> }) =>
      edgeLogApiRequest(method, endpoint, { ...context, ...additionalContext }),
  };
}
