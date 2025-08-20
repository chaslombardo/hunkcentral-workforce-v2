/**
 * Production Error Reporter
 * Provides comprehensive error reporting utilities for production debugging
 */

// Error reporting utilities - imports removed to fix unused variable warnings
// These can be re-imported when the reporter functionality is fully implemented

export interface ErrorReportConfig {
  enableAutoReporting: boolean;
  enableUserFeedback: boolean;
  enableStackTraceCapture: boolean;
  enablePerformanceMetrics: boolean;
  enableBreadcrumbs: boolean;
  maxBreadcrumbs: number;
  reportingEndpoint?: string;
  apiKey?: string;
}

export interface Breadcrumb {
  timestamp: number;
  category: 'navigation' | 'user' | 'http' | 'console' | 'error' | 'info';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

export interface PerformanceMetrics {
  loadTime?: number;
  domContentLoaded?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  breadcrumbs: Breadcrumb[];
  performanceMetrics: PerformanceMetrics;
  context: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
  userFeedback?: string;
  tags: Record<string, string>;
  environment: string;
}

class ProductionErrorReporter {
  private config: ErrorReportConfig;
  private breadcrumbs: Breadcrumb[] = [];
  private performanceObserver?: PerformanceObserver;
  private sessionId: string;

  constructor(config: Partial<ErrorReportConfig> = {}) {
    this.config = {
      enableAutoReporting: true,
      enableUserFeedback: false,
      enableStackTraceCapture: true,
      enablePerformanceMetrics: true,
      enableBreadcrumbs: true,
      maxBreadcrumbs: 50,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Set up performance monitoring
    if (this.config.enablePerformanceMetrics) {
      this.setupPerformanceMonitoring();
    }

    // Set up breadcrumb collection
    if (this.config.enableBreadcrumbs) {
      this.setupBreadcrumbCollection();
    }

    // Set up global error handlers
    this.setupGlobalErrorHandlers();
  }

  private setupPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.addBreadcrumb({
              category: 'info',
              message: `Performance: ${entry.name}`,
              level: 'info',
              data: {
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                entryType: entry.entryType,
              },
            });
          });
        });

        this.performanceObserver.observe({
          entryTypes: [
            'navigation',
            'paint',
            'largest-contentful-paint',
            'first-input',
          ],
        });
      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }
  }

  private setupBreadcrumbCollection(): void {
    // Navigation breadcrumbs
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      this.addBreadcrumb({
        category: 'navigation',
        message: `Navigation to ${args[2]}`,
        level: 'info',
        data: { url: args[2] },
      });
      return originalPushState.apply(history, args);
    };

    history.replaceState = (...args) => {
      this.addBreadcrumb({
        category: 'navigation',
        message: `Navigation replaced to ${args[2]}`,
        level: 'info',
        data: { url: args[2] },
      });
      return originalReplaceState.apply(history, args);
    };

    // Click breadcrumbs
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target) {
        this.addBreadcrumb({
          category: 'user',
          message: `Clicked ${target.tagName.toLowerCase()}`,
          level: 'info',
          data: {
            tagName: target.tagName,
            className: target.className,
            id: target.id,
            textContent: target.textContent?.substring(0, 100),
          },
        });
      }
    });

    // Console breadcrumbs
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      this.addBreadcrumb({
        category: 'console',
        message: `Console error: ${args.join(' ')}`,
        level: 'error',
        data: { arguments: args.length },
      });
      return originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      this.addBreadcrumb({
        category: 'console',
        message: `Console warning: ${args.join(' ')}`,
        level: 'warning',
        data: { arguments: args.length },
      });
      return originalConsoleWarn.apply(console, args);
    };

    // HTTP request breadcrumbs
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url =
        typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = args[1]?.method || 'GET';

      this.addBreadcrumb({
        category: 'http',
        message: `${method} ${url}`,
        level: 'info',
        data: { url, method },
      });

      try {
        const response = await originalFetch.apply(window, args);

        this.addBreadcrumb({
          category: 'http',
          message: `${method} ${url} - ${response.status}`,
          level: response.ok ? 'info' : 'warning',
          data: {
            url,
            method,
            status: response.status,
            statusText: response.statusText,
          },
        });

        return response;
      } catch (error) {
        this.addBreadcrumb({
          category: 'http',
          message: `${method} ${url} - Failed`,
          level: 'error',
          data: {
            url,
            method,
            error: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
    };
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.reportError(event.error || new Error(event.message), {
        component: 'global',
        action: 'unhandled_error',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        {
          component: 'global',
          action: 'unhandled_promise_rejection',
          context: {
            reason: String(event.reason),
          },
        }
      );
    });
  }

  private addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
    if (!this.config.enableBreadcrumbs) return;

    const fullBreadcrumb: Breadcrumb = {
      ...breadcrumb,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(fullBreadcrumb);

    // Keep only the most recent breadcrumbs
    if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
    }
  }

  private getPerformanceMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {};

    if ('performance' in window) {
      // Navigation timing
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
        metrics.domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.fetchStart;
      }

      // Paint timing
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-paint') {
          metrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          metrics.firstContentfulPaint = entry.startTime;
        }
      });

      // Largest Contentful Paint
      const lcpEntries = performance.getEntriesByType(
        'largest-contentful-paint'
      );
      if (lcpEntries.length > 0) {
        metrics.largestContentfulPaint =
          lcpEntries[lcpEntries.length - 1].startTime;
      }

      // Memory usage
      if ('memory' in performance) {
        const memory = (
          performance as {
            memory: {
              usedJSHeapSize: number;
              totalJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          }
        ).memory;
        metrics.memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
    }

    return metrics;
  }

  private createFingerprint(
    error: Error,
    context: Record<string, unknown>
  ): string {
    const message = error.message || 'Unknown error';
    const component = context.component || 'unknown';
    const action = context.action || 'unknown';

    // Extract the first few lines of stack trace for fingerprinting
    const stackLines = error.stack?.split('\n').slice(0, 3).join('|') || '';

    // Create a hash-like fingerprint
    const fingerprint = `${component}:${action}:${message}:${stackLines}`
      .replace(/\d+/g, 'N') // Replace numbers with N for better grouping
      .replace(/['"]/g, '') // Remove quotes
      .toLowerCase();

    return Buffer.from(fingerprint).toString('base64').substring(0, 32);
  }

  private determineSeverity(
    error: Error,
    context: Record<string, unknown>
  ): ErrorReport['severity'] {
    const message = error.message.toLowerCase();
    const component = String(context.component || '').toLowerCase();

    // Critical errors
    const criticalKeywords = [
      'database',
      'authentication',
      'payment',
      'security',
      'critical',
      'fatal',
      'crash',
    ];

    // High priority errors
    const highKeywords = [
      'server',
      'api',
      'network',
      'timeout',
      'unauthorized',
      'permission',
    ];

    // Medium priority errors
    const mediumKeywords = [
      'validation',
      'form',
      'component',
      'render',
      'not found',
    ];

    if (
      criticalKeywords.some(
        (keyword) => message.includes(keyword) || component.includes(keyword)
      )
    ) {
      return 'critical';
    }

    if (
      highKeywords.some(
        (keyword) => message.includes(keyword) || component.includes(keyword)
      )
    ) {
      return 'high';
    }

    if (
      mediumKeywords.some(
        (keyword) => message.includes(keyword) || component.includes(keyword)
      )
    ) {
      return 'medium';
    }

    return 'low';
  }

  public async reportError(
    error: Error | unknown,
    context: {
      component: string;
      action: string;
      userId?: string;
      userFeedback?: string;
      tags?: Record<string, string>;
      context?: Record<string, unknown>;
    }
  ): Promise<ErrorReport> {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const timestamp = new Date().toISOString();
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const report: ErrorReport = {
      id: errorId,
      timestamp,
      message: errorObj.message || 'Unknown error',
      stack: this.config.enableStackTraceCapture ? errorObj.stack : undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: context.userId,
      sessionId: this.sessionId,
      breadcrumbs: [...this.breadcrumbs],
      performanceMetrics: this.config.enablePerformanceMetrics
        ? this.getPerformanceMetrics()
        : {},
      context: {
        component: context.component,
        action: context.action,
        ...context.context,
      },
      severity: this.determineSeverity(errorObj, context),
      fingerprint: this.createFingerprint(errorObj, context),
      userFeedback: context.userFeedback,
      tags: {
        environment: process.env.NODE_ENV || 'unknown',
        ...context.tags,
      },
      environment: process.env.NODE_ENV || 'unknown',
    };

    // Add error breadcrumb
    this.addBreadcrumb({
      category: 'error',
      message: `Error: ${errorObj.message}`,
      level: 'error',
      data: {
        errorId,
        component: context.component,
        action: context.action,
        severity: report.severity,
      },
    });

    // Send to server if auto-reporting is enabled
    if (this.config.enableAutoReporting) {
      try {
        await this.sendReport(report);
      } catch (reportingError) {
        console.error('Failed to send error report:', reportingError);
        // Store in localStorage for retry
        this.storeReportForRetry(report);
      }
    }

    return report;
  }

  private async sendReport(report: ErrorReport): Promise<void> {
    const endpoint = this.config.reportingEndpoint || '/api/errors/client';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && {
          Authorization: `Bearer ${this.config.apiKey}`,
        }),
      },
      body: JSON.stringify({
        level: 'error',
        message: report.message,
        context: {
          component: report.context.component,
          action: report.context.action,
          userId: report.userId,
          url: report.url,
          userAgent: report.userAgent,
          timestamp: Date.parse(report.timestamp),
          stack: report.stack,
          additionalData: {
            errorId: report.id,
            sessionId: report.sessionId,
            breadcrumbs: report.breadcrumbs,
            performanceMetrics: report.performanceMetrics,
            severity: report.severity,
            fingerprint: report.fingerprint,
            userFeedback: report.userFeedback,
            tags: report.tags,
            context: report.context,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send report: ${response.status} ${response.statusText}`
      );
    }
  }

  private storeReportForRetry(report: ErrorReport): void {
    try {
      const stored = JSON.parse(
        localStorage.getItem('pending_error_reports') || '[]'
      );
      stored.push(report);

      // Keep only the last 10 reports
      if (stored.length > 10) {
        stored.splice(0, stored.length - 10);
      }

      localStorage.setItem('pending_error_reports', JSON.stringify(stored));
    } catch (error) {
      console.error('Failed to store error report for retry:', error);
    }
  }

  public async retryPendingReports(): Promise<void> {
    try {
      const stored = JSON.parse(
        localStorage.getItem('pending_error_reports') || '[]'
      );
      if (stored.length === 0) return;

      for (const report of stored) {
        try {
          await this.sendReport(report);
        } catch (error) {
          console.error('Failed to retry error report:', error);
          break; // Stop retrying if still failing
        }
      }

      // Clear successfully sent reports
      localStorage.removeItem('pending_error_reports');
    } catch (error) {
      console.error('Failed to retry pending reports:', error);
    }
  }

  public addTag(key: string, value: string): void {
    // Tags will be included in future error reports
    if (!this.config.enableBreadcrumbs) return;

    this.addBreadcrumb({
      category: 'info',
      message: `Tag added: ${key}=${value}`,
      level: 'info',
      data: { key, value },
    });
  }

  public setUser(userId: string, userData?: Record<string, unknown>): void {
    this.addBreadcrumb({
      category: 'info',
      message: `User set: ${userId}`,
      level: 'info',
      data: { userId, userData },
    });
  }

  public captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info'
  ): void {
    this.addBreadcrumb({
      category: 'info',
      message,
      level,
    });
  }

  public destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    this.breadcrumbs = [];
  }
}

// Global instance
let globalReporter: ProductionErrorReporter | null = null;

export function initializeErrorReporter(
  config?: Partial<ErrorReportConfig>
): ProductionErrorReporter {
  if (typeof window === 'undefined') {
    // Return a no-op reporter for server-side
    return {
      reportError: async () => ({}) as ErrorReport,
      retryPendingReports: async () => {},
      addTag: () => {},
      setUser: () => {},
      captureMessage: () => {},
      destroy: () => {},
    } as unknown as ProductionErrorReporter;
  }

  if (!globalReporter) {
    globalReporter = new ProductionErrorReporter(config);

    // Retry pending reports on initialization
    globalReporter.retryPendingReports();

    // Retry pending reports when coming back online
    window.addEventListener('online', () => {
      globalReporter?.retryPendingReports();
    });
  }

  return globalReporter;
}

export function getErrorReporter(): ProductionErrorReporter | null {
  return globalReporter;
}

export { ProductionErrorReporter };
