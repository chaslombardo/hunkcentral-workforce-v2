import { prisma } from "@/lib/prisma";

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

class AnalyticsService {
  private static instance: AnalyticsService;
  private eventQueue: AnalyticsEvent[] = [];
  private performanceQueue: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Track user interactions
  trackInteraction(event: UserInteractionEvent) {
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

  // Flush events to database
  private async flush() {
    if (this.eventQueue.length === 0 && this.performanceQueue.length === 0) {
      return;
    }

    try {
      // Batch insert events
      if (this.eventQueue.length > 0) {
        await prisma.analyticsEvent.createMany({
          data: this.eventQueue.map(event => ({
            eventType: event.eventType,
            userId: event.userId || null,
            metadata: event.metadata || {},
            timestamp: event.timestamp || new Date(),
          })),
        });
        this.eventQueue = [];
      }

      // Batch insert performance metrics
      if (this.performanceQueue.length > 0) {
        await prisma.performanceMetric.createMany({
          data: this.performanceQueue.map(metric => ({
            metricType: metric.metricType,
            value: metric.value,
            page: metric.page,
            userId: metric.userId || null,
            metadata: metric.metadata || {},
            timestamp: metric.timestamp || new Date(),
          })),
        });
        this.performanceQueue = [];
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
    }
  }

  // Get analytics data for reporting
  async getAnalytics(filters: {
    startDate?: Date;
    endDate?: Date;
    eventType?: string;
    page?: string;
    userId?: string;
  }) {
    const where: any = {};

    if (filters.startDate) {
      where.timestamp = { gte: filters.startDate };
    }
    if (filters.endDate) {
      where.timestamp = { ...where.timestamp, lte: filters.endDate };
    }
    if (filters.eventType) {
      where.eventType = filters.eventType;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }

    const events = await prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit results
    });

    return events;
  }

  // Get performance metrics
  async getPerformanceMetrics(filters: {
    startDate?: Date;
    endDate?: Date;
    metricType?: string;
    page?: string;
  }) {
    const where: any = {};

    if (filters.startDate) {
      where.timestamp = { gte: filters.startDate };
    }
    if (filters.endDate) {
      where.timestamp = { ...where.timestamp, lte: filters.endDate };
    }
    if (filters.metricType) {
      where.metricType = filters.metricType;
    }
    if (filters.page) {
      where.page = filters.page;
    }

    const metrics = await prisma.performanceMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    return metrics;
  }

  // Get user interaction patterns
  async getUserInteractionPatterns(userId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
        eventType: { in: ['click', 'form_submit', 'page_view', 'navigation'] },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Analyze patterns
    const patterns = {
      mostVisitedPages: this.getMostVisitedPages(events),
      commonClickTargets: this.getCommonClickTargets(events),
      navigationPaths: this.getNavigationPaths(events),
      formInteractions: this.getFormInteractions(events),
      timeOfDayActivity: this.getTimeOfDayActivity(events),
      sessionDuration: this.getAverageSessionDuration(events),
    };

    return patterns;
  }

  // Get performance comparison before/after implementation
  async getPerformanceComparison(
    beforeDate: Date,
    afterDate: Date,
    metricType?: string
  ) {
    const beforeMetrics = await this.getPerformanceMetrics({
      startDate: new Date(beforeDate.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days before
      endDate: beforeDate,
      metricType,
    });

    const afterMetrics = await this.getPerformanceMetrics({
      startDate: afterDate,
      endDate: new Date(afterDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days after
      metricType,
    });

    const comparison = {
      before: this.aggregateMetrics(beforeMetrics),
      after: this.aggregateMetrics(afterMetrics),
      improvement: {} as Record<string, any>,
    };

    // Calculate improvements
    for (const metric in comparison.before) {
      const beforeValue = (comparison.before as any)[metric];
      const afterValue = (comparison.after as any)[metric];
      if (beforeValue && afterValue) {
        (comparison.improvement as any)[metric] = {
          absolute: afterValue - beforeValue,
          percentage: ((afterValue - beforeValue) / beforeValue) * 100,
        };
      }
    }

    return comparison;
  }

  // Helper methods for pattern analysis
  private getMostVisitedPages(events: any[]) {
    const pageViews = events.filter(e => e.eventType === 'page_view');
    const pageCounts = pageViews.reduce((acc, event) => {
      const page = event.metadata?.page || 'unknown';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(pageCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));
  }

  private getCommonClickTargets(events: any[]) {
    const clicks = events.filter(e => e.eventType === 'click');
    const elementCounts = clicks.reduce((acc, event) => {
      const element = event.element || 'unknown';
      acc[element] = (acc[element] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(elementCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([element, count]) => ({ element, count }));
  }

  private getNavigationPaths(events: any[]) {
    const navEvents = events.filter(e => e.eventType === 'navigation');
    const paths = navEvents.reduce((acc, event) => {
      const from = event.metadata?.from || 'unknown';
      const to = event.metadata?.to || 'unknown';
      const path = `${from} → ${to}`;
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(paths)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
  }

  private getFormInteractions(events: any[]) {
    const formEvents = events.filter(e => e.eventType === 'form_submit');
    const formCounts = formEvents.reduce((acc, event) => {
      const form = event.element || 'unknown';
      acc[form] = (acc[form] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(formCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([form, count]) => ({ form, count }));
  }

  private getTimeOfDayActivity(events: any[]) {
    const hourCounts = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCounts[hour] || 0,
    }));
  }

  private getAverageSessionDuration(events: any[]) {
    // Group events by user and calculate session durations
    const userSessions = events.reduce((acc: Record<string, Date[]>, event) => {
      const userId = event.userId || 'anonymous';
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(new Date(event.timestamp));
      return acc;
    }, {});

    const sessionDurations = Object.values(userSessions).map((timestamps: Date[]) => {
      timestamps.sort((a: Date, b: Date) => a.getTime() - b.getTime());
      const first = timestamps[0];
      const last = timestamps[timestamps.length - 1];
      return last.getTime() - first.getTime();
    });

    const avgDuration = sessionDurations.length > 0
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length
      : 0;

    return Math.round(avgDuration / 1000 / 60); // Convert to minutes
  }

  private aggregateMetrics(metrics: any[]) {
    const aggregated: Record<string, any> = {};
    
    metrics.forEach(metric => {
      const type = metric.metricType;
      if (!aggregated[type]) {
        aggregated[type] = { values: [], count: 0, sum: 0 };
      }
      aggregated[type].values.push(metric.value);
      aggregated[type].count++;
      aggregated[type].sum += metric.value;
    });

    // Calculate averages
    for (const type in aggregated) {
      const data = aggregated[type];
      aggregated[type] = {
        average: data.sum / data.count,
        min: Math.min(...data.values),
        max: Math.max(...data.values),
        count: data.count,
      };
    }

    return aggregated;
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