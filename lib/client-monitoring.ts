/**
 * Client-Side Monitoring Utilities
 * Connects to monitoring APIs and tracks client-side metrics
 */

export interface ClientMetric {
  metricType: string;
  value: number;
  page: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface ClientEvent {
  eventType: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface FeedbackData {
  type: 'bug' | 'feature' | 'improvement' | 'performance' | 'general';
  title: string;
  description: string;
  page: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  email?: string;
  reproductionSteps?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  attachScreenshot?: boolean;
}

export interface ABTestConfig {
  name: string;
  description?: string;
  variants: Array<{
    name: string;
    weight: number;
    config: Record<string, unknown>;
  }>;
  targetMetric: string;
  startDate?: Date;
  endDate?: Date;
}

class ClientMonitoring {
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private eventQueue: ClientEvent[] = [];
  private metricQueue: ClientMetric[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startBatchFlush();
    this.setupPerformanceObserver();
    this.setupErrorTracking();
  }

  // Analytics Methods
  public trackEvent(
    eventType: string,
    metadata?: Record<string, unknown>
  ): void {
    this.eventQueue.push({
      eventType,
      metadata: {
        ...metadata,
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    this.checkFlush();
  }

  public trackMetric(
    metricType: string,
    value: number,
    metadata?: Record<string, unknown>
  ): void {
    this.metricQueue.push({
      metricType,
      value,
      page: window.location.pathname,
      metadata: {
        ...metadata,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    this.checkFlush();
  }

  public trackPageLoad(): void {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart;
        const domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.fetchStart;
        const firstPaint =
          performance.getEntriesByName('first-paint')[0]?.startTime || 0;
        const firstContentfulPaint =
          performance.getEntriesByName('first-contentful-paint')[0]
            ?.startTime || 0;

        this.trackMetric('page_load', loadTime, {
          domContentLoaded,
          firstPaint,
          firstContentfulPaint,
          navigationTiming: {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domComplete - navigation.domContentLoadedEventStart,
          },
        });

        this.trackEvent('page_view', {
          loadTime,
          page: window.location.pathname,
        });
      }
    }
  }

  public trackInteraction(
    action: string,
    component: string,
    duration?: number
  ): void {
    this.trackEvent('interaction', {
      action,
      component,
      duration,
      page: window.location.pathname,
    });

    if (duration !== undefined) {
      this.trackMetric('interaction_delay', duration, {
        action,
        component,
      });
    }
  }

  // Feedback Methods
  public async submitFeedback(
    feedback: FeedbackData
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...feedback,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          browserInfo: JSON.stringify({
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
          }),
        }),
      });

      const result = await response.json();

      if (result.success) {
        this.trackEvent('feedback_submitted', {
          feedbackType: feedback.type,
          priority: feedback.priority,
          feedbackId: result.data?.id,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // A/B Testing Methods
  public async getABTestVariant(experimentName: string): Promise<{
    variant: string | null;
    config: Record<string, unknown>;
    isControl: boolean;
  }> {
    try {
      const response = await fetch(
        `/api/ab-tests?experiment=${experimentName}&action=get_variant`
      );
      const result = await response.json();

      if (result.success && result.variant) {
        return {
          variant: result.variant.variant,
          config: result.variant.config,
          isControl: result.variant.isControl,
        };
      }

      return { variant: null, config: {}, isControl: false };
    } catch (error) {
      console.error('Failed to get A/B test variant:', error);
      return { variant: null, config: {}, isControl: false };
    }
  }

  public async trackABTestEvent(
    experimentName: string,
    eventType: string,
    value?: number,
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_event',
          experimentName,
          eventType,
          value,
          metadata: {
            ...metadata,
            url: window.location.href,
            page: window.location.pathname,
          },
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to track A/B test event:', error);
      return false;
    }
  }

  // System Health Methods
  public async getSystemHealth(): Promise<{
    status: string;
    services: Record<string, boolean>;
    timestamp: string;
  } | null> {
    try {
      const response = await fetch('/api/health');
      const result = await response.json();

      return {
        status: result.status,
        services: result.services || {},
        timestamp: result.timestamp,
      };
    } catch (error) {
      console.error('Failed to get system health:', error);
      return null;
    }
  }

  // Private Methods
  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private checkFlush(): void {
    if (
      this.eventQueue.length >= this.batchSize ||
      this.metricQueue.length >= this.batchSize
    ) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0 && this.metricQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    const metrics = [...this.metricQueue];

    this.eventQueue = [];
    this.metricQueue = [];

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: events.length > 0 ? events : undefined,
          metrics: metrics.length > 0 ? metrics : undefined,
        }),
      });
    } catch (error) {
      console.error('Failed to flush analytics data:', error);
      // Re-queue the data for next flush
      this.eventQueue.unshift(...events);
      this.metricQueue.unshift(...metrics);
    }
  }

  private setupPerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Observe Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              this.trackMetric('lcp', entry.startTime);
            } else if (entry.entryType === 'first-input') {
              this.trackMetric(
                'fid',
                (entry as PerformanceEventTiming).processingStart -
                  entry.startTime
              );
            } else if (entry.entryType === 'layout-shift') {
              const layoutShift = entry as PerformanceEntry & {
                value?: number;
                hadRecentInput?: boolean;
              };
              if (!layoutShift.hadRecentInput) {
                this.trackMetric('cls', layoutShift.value ?? 0);
              }
            }
          }
        });

        observer.observe({
          entryTypes: [
            'largest-contentful-paint',
            'first-input',
            'layout-shift',
          ],
        });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  private setupErrorTracking(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackEvent('javascript_error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.trackEvent('unhandled_promise_rejection', {
          reason: event.reason?.toString(),
          stack: event.reason?.stack,
        });
      });
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// Singleton instance
let clientMonitoring: ClientMonitoring | null = null;

export function getClientMonitoring(): ClientMonitoring {
  if (typeof window === 'undefined') {
    throw new Error(
      'Client monitoring can only be used in browser environment'
    );
  }

  if (!clientMonitoring) {
    clientMonitoring = new ClientMonitoring();
  }
  return clientMonitoring;
}

export function destroyClientMonitoring(): void {
  if (clientMonitoring) {
    clientMonitoring.destroy();
    clientMonitoring = null;
  }
}

// Auto-initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const monitoring = getClientMonitoring();
    monitoring.trackPageLoad();
  });
}
