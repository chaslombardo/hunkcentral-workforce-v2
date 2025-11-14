'use client';

export interface ClientErrorContext {
  component: string;
  action: string;
  userId?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  stack?: string;
  additionalData?: Record<string, unknown>;
}

export interface ClientErrorLog {
  level: 'error' | 'warn' | 'info';
  message: string;
  context: ClientErrorContext;
}

/**
 * Logs client-side errors with comprehensive context information
 */
export async function logClientError(
  error: Error | unknown,
  context: Omit<ClientErrorContext, 'timestamp' | 'userAgent' | 'url'>
): Promise<void> {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const errorLog: ClientErrorLog = {
      level: 'error',
      message: errorMessage,
      context: {
        ...context,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        stack,
      },
    };

    // In development, log to console for immediate visibility
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error:', {
        message: errorMessage,
        component: context.component,
        action: context.action,
        userId: context.userId,
        url: window.location.href,
        stack,
      });
    }

    // Send error to server for production logging
    try {
      await fetch('/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog),
      });
    } catch {
      // If network request fails, store in localStorage for later retry
      try {
        const storedErrors = JSON.parse(
          localStorage.getItem('pending_errors') || '[]'
        );
        storedErrors.push(errorLog);
        // Keep only last 10 errors to prevent storage overflow
        if (storedErrors.length > 10) {
          storedErrors.splice(0, storedErrors.length - 10);
        }
        localStorage.setItem('pending_errors', JSON.stringify(storedErrors));
      } catch {
        // If localStorage fails, there's nothing more we can do
        // Error logging should never break the application
      }
    }
  } catch (loggingError) {
    // Ensure error logging never breaks the application
    if (process.env.NODE_ENV === 'development') {
      console.error('Client error logging failed:', loggingError);
      console.error('Original error:', error);
    }
  }
}

/**
 * Logs authentication-related client errors
 */
export async function logClientAuthError(
  error: Error | unknown,
  context: {
    action:
      | 'login'
      | 'session_check'
      | 'redirect'
      | 'logout'
      | 'permission_denied';
    userId?: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<void> {
  await logClientError(error, {
    component: 'client_authentication',
    action: context.action,
    userId: context.userId,
    additionalData: context.additionalData,
  });
}

/**
 * Logs component rendering errors
 */
export async function logClientComponentError(
  error: Error | unknown,
  context: {
    component: string;
    action: string;
    userId?: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<void> {
  await logClientError(error, {
    component: `client_${context.component}`,
    action: context.action,
    userId: context.userId,
    additionalData: context.additionalData,
  });
}

/**
 * Logs service worker related errors
 */
export async function logServiceWorkerError(
  error: Error | unknown,
  context: {
    action: 'registration' | 'fetch' | 'cache' | 'update' | 'message';
    additionalData?: Record<string, unknown>;
  }
): Promise<void> {
  await logClientError(error, {
    component: 'service_worker',
    action: context.action,
    additionalData: context.additionalData,
  });
}

/**
 * Logs network-related errors
 */
export async function logNetworkError(
  error: Error | unknown,
  context: {
    endpoint: string;
    method: string;
    status?: number;
    userId?: string;
    additionalData?: Record<string, unknown>;
  }
): Promise<void> {
  await logClientError(error, {
    component: 'network',
    action: `${context.method}_${context.endpoint}`,
    userId: context.userId,
    additionalData: {
      endpoint: context.endpoint,
      method: context.method,
      status: context.status,
      ...context.additionalData,
    },
  });
}

/**
 * Attempts to send any pending errors stored in localStorage
 */
export async function retryPendingErrors(): Promise<void> {
  try {
    const storedErrors = JSON.parse(
      localStorage.getItem('pending_errors') || '[]'
    );
    if (storedErrors.length === 0) return;

    for (const errorLog of storedErrors) {
      try {
        await fetch('/api/errors/client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorLog),
        });
      } catch {
        // If still failing, keep the error for next retry
        break;
      }
    }

    // Clear successfully sent errors
    localStorage.removeItem('pending_errors');
  } catch {
    // Ignore errors in retry mechanism
  }
}

/**
 * Sets up automatic retry of pending errors on page load
 */
export function setupErrorRetry(): void {
  if (typeof window !== 'undefined') {
    // Retry pending errors when the page loads
    window.addEventListener('load', retryPendingErrors);

    // Retry pending errors when network comes back online
    window.addEventListener('online', retryPendingErrors);
  }
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandling(): void {
  if (typeof window !== 'undefined') {
    // Handle unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      logClientError(event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        additionalData: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logClientError(event.reason, {
        component: 'global',
        action: 'unhandled_promise_rejection',
      });
    });
  }
}
