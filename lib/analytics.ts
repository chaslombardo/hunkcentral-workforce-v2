// Client-side analytics interfaces
export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface UserInteractionEvent extends AnalyticsEvent {
  eventType: 'click' | 'form_submit' | 'page_view' | 'navigation' | 'error';
  element?: string;
  page: string;
  duration?: number;
}

export interface PerformanceMetric {
  metricType: 'page_load' | 'interaction_delay' | 'bundle_size' | 'render_time';
  value: number;
  page: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

// Client-side analytics service (no database access)
class AnalyticsService {
  private static instance: AnalyticsService;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      // Flush events every 30 seconds
      this.flushInterval = setInterval(() => {
        this.flush();
      }, 30000);
    }
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Track user interactions
  trackInteraction(event: UserInteractionEvent) {
    if (typeof window === 'undefined') return; // Server-side guard
    
    this.eventQueue.push({
      ...event,
      timestamp: event.timestamp || new Date(),
    });

    // Flush immediately for critical events
    if (event.eventType === 'error') {
      this.flush();
    }
  }

  // Track performance metrics
  trackPerformance(metric: PerformanceMetric) {
    if (typeof window === 'undefined') return; // Server-side guard
    
    this.performanceQueue.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });
  }

  // Track page views with performance data
  trackPageView(page: string, userId?: string, loadTime?: number) {
    this.trackInteraction({
      eventType: 'page_view',
      page,
      userId,
      metadata: { loadTime },
    });

    if (loadTime) {
      this.trackPerformance({
        metricType: 'page_load',
        value: loadTime,
        page,
        userId,
      });
    }
  }

  // Track form interactions
  trackFormInteraction(formName: string, action: 'start' | 'submit' | 'abandon', page: string, userId?: string) {
    this.trackInteraction({
      eventType: action === 'submit' ? 'form_submit' : 'click',
      element: formName,
      page,
      userId,
      metadata: { action },
    });
  }

  // Track navigation patterns
  trackNavigation(from: string, to: string, userId?: string) {
    this.trackInteraction({
      eventType: 'navigation',
      page: to,
      userId,
      metadata: { from, to },
    });
  }

  // Track errors
  trackError(error: Error, page: string, userId?: string, context?: Record<string, any>) {
    this.trackInteraction({
      eventType: 'error',
      page,
      userId,
      metadata: {
        message: error.message,
        stack: error.stack,
        context,
      },
    });
  }

  // Flush events to server via API
  private async flush() {
    if (typeof window === 'undefined') return; // Server-side guard
    if (this.eventQueue.length === 0 && this.performanceQueue.length === 0) {
      return;
    }

    try {
      // Send events to server via API
      if (this.eventQueue.length > 0 || this.performanceQueue.length > 0) {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events: this.eventQueue,
            metrics: this.performanceQueue,
          }),
        });
        
        this.eventQueue = [];
        this.performanceQueue = [];
      }
    } catch (error) {
      console.warn('Failed to flush analytics events:', error);
      // Don't throw error to prevent breaking the UI
    }
  }



  // Clean up on shutdown
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Final flush
  }
}

export const analytics = AnalyticsService.getInstance();

// Client-side analytics hook
export function useAnalytics() {
  const trackClick = (element: string, page: string) => {
    analytics.trackInteraction({
      eventType: 'click',
      element,
      page,
    });
  };

  const trackPageView = (page: string, loadTime?: number) => {
    analytics.trackPageView(page, undefined, loadTime);
  };

  const trackFormSubmit = (formName: string, page: string) => {
    analytics.trackFormInteraction(formName, 'submit', page);
  };

  const trackError = (error: Error, page: string, context?: Record<string, any>) => {
    analytics.trackError(error, page, undefined, context);
  };

  return {
    trackClick,
    trackPageView,
    trackFormSubmit,
    trackError,
  };
}