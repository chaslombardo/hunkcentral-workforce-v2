'use client';

import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics';

interface PerformanceMonitorProps {
  pageName: string;
  userId?: string;
  trackInteractions?: boolean;
  trackFormSubmissions?: boolean;
}

export function PerformanceMonitor({
  pageName,
  userId,
  trackInteractions = true,
  trackFormSubmissions = true,
}: PerformanceMonitorProps) {
  const startTimeRef = useRef<number>(Date.now());
  const interactionCountRef = useRef<number>(0);

  useEffect(() => {
    // Track page load performance
    const trackPageLoad = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          // Track various performance metrics
          analytics.trackPerformance({
            metricType: 'page_load',
            value: navigation.loadEventEnd - navigation.fetchStart,
            page: pageName,
            userId,
            metadata: {
              domContentLoaded:
                navigation.domContentLoadedEventEnd - navigation.fetchStart,
              firstPaint: navigation.responseEnd - navigation.fetchStart,
              domInteractive: navigation.domInteractive - navigation.fetchStart,
            },
          });

          // Track First Contentful Paint if available
          const paintEntries = performance.getEntriesByType('paint');
          const fcp = paintEntries.find(
            (entry) => entry.name === 'first-contentful-paint'
          );
          if (fcp) {
            analytics.trackPerformance({
              metricType: 'render_time',
              value: fcp.startTime,
              page: pageName,
              userId,
              metadata: { metric: 'first-contentful-paint' },
            });
          }
        }
      }

      // Track page view
      analytics.trackPageView(pageName, userId);
    };

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoad();
    } else {
      window.addEventListener('load', trackPageLoad);
    }

    // Track interactions if enabled
    const handleClick = (event: MouseEvent) => {
      if (!trackInteractions) return;

      const target = event.target as HTMLElement;
      const elementInfo = getElementInfo(target);

      interactionCountRef.current++;

      analytics.trackInteraction({
        eventType: 'click',
        element: elementInfo,
        page: pageName,
        userId,
        metadata: {
          timestamp: Date.now(),
          interactionCount: interactionCountRef.current,
          sessionTime: Date.now() - startTimeRef.current,
        },
      });
    };

    // Track form submissions if enabled
    const handleFormSubmit = (event: SubmitEvent) => {
      if (!trackFormSubmissions) return;

      const form = event.target as HTMLFormElement;
      const formName = form.name || form.id || 'unnamed-form';

      analytics.trackFormInteraction(formName, 'submit', pageName, userId);
    };

    // Track errors
    const handleError = (event: ErrorEvent) => {
      analytics.trackError(new Error(event.message), pageName, userId, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    // Track unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        pageName,
        userId,
        { type: 'unhandled-promise-rejection' }
      );
    };

    // Add event listeners
    if (trackInteractions) {
      document.addEventListener('click', handleClick, { passive: true });
    }
    if (trackFormSubmissions) {
      document.addEventListener('submit', handleFormSubmit);
    }
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Track visibility changes (user switching tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        analytics.trackInteraction({
          eventType: 'page_view',
          page: pageName,
          userId,
          metadata: {
            action: 'hidden',
            sessionTime: Date.now() - startTimeRef.current,
            interactionCount: interactionCountRef.current,
          },
        });
      } else {
        analytics.trackInteraction({
          eventType: 'page_view',
          page: pageName,
          userId,
          metadata: {
            action: 'visible',
            sessionTime: Date.now() - startTimeRef.current,
          },
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Copy ref values for cleanup function
    const startTime = startTimeRef.current;
    const interactionCount = interactionCountRef.current;

    // Cleanup
    return () => {
      if (trackInteractions) {
        document.removeEventListener('click', handleClick);
      }
      if (trackFormSubmissions) {
        document.removeEventListener('submit', handleFormSubmit);
      }
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
      window.removeEventListener('load', trackPageLoad);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Track session end
      analytics.trackInteraction({
        eventType: 'page_view',
        page: pageName,
        userId,
        metadata: {
          action: 'unload',
          sessionTime: Date.now() - startTime,
          interactionCount: interactionCount,
        },
      });
    };
  }, [pageName, userId, trackInteractions, trackFormSubmissions]);

  // Track Core Web Vitals
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        analytics.trackPerformance({
          metricType: 'render_time',
          value: lastEntry.startTime,
          page: pageName,
          userId,
          metadata: { metric: 'largest-contentful-paint' },
        });
      });

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(
          (entry: PerformanceEntry & { processingStart?: number }) => {
            analytics.trackPerformance({
              metricType: 'interaction_delay',
              value: (entry.processingStart || 0) - entry.startTime,
              page: pageName,
              userId,
              metadata: { metric: 'first-input-delay' },
            });
          }
        );
      });

      // Track Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();

        entries.forEach(
          (
            entry: PerformanceEntry & {
              hadRecentInput?: boolean;
              value?: number;
            }
          ) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value || 0;
            }
          }
        );

        analytics.trackPerformance({
          metricType: 'render_time',
          value: clsValue,
          page: pageName,
          userId,
          metadata: { metric: 'cumulative-layout-shift' },
        });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        fidObserver.observe({ entryTypes: ['first-input'] });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('Performance Observer not fully supported:', error);
      }

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, [pageName, userId]);

  return null; // This component doesn't render anything
}

// Helper function to get meaningful element information
function getElementInfo(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const className =
    element.className && typeof element.className === 'string'
      ? `.${element.className.split(' ').join('.')}`
      : '';
  const text = element.textContent?.trim().substring(0, 50) || '';
  const role = element.getAttribute('role') || '';
  const ariaLabel = element.getAttribute('aria-label') || '';

  // Prioritize meaningful identifiers
  if (ariaLabel) return `${tagName}[aria-label="${ariaLabel}"]`;
  if (id) return `${tagName}${id}`;
  if (role) return `${tagName}[role="${role}"]`;
  if (className && !className.includes('undefined'))
    return `${tagName}${className}`;
  if (text) return `${tagName}:"${text}"`;

  return tagName;
}

// Hook for manual performance tracking
export function usePerformanceTracking(pageName: string, userId?: string) {
  const trackInteraction = (
    element: string,
    metadata?: Record<string, unknown>
  ) => {
    analytics.trackInteraction({
      eventType: 'click',
      element,
      page: pageName,
      userId,
      metadata,
    });
  };

  const trackFormSubmission = (
    formName: string,
    metadata?: Record<string, unknown>
  ) => {
    analytics.trackFormInteraction(formName, 'submit', pageName, userId);
    if (metadata) {
      analytics.trackInteraction({
        eventType: 'form_submit',
        element: formName,
        page: pageName,
        userId,
        metadata,
      });
    }
  };

  const trackCustomMetric = (
    metricType: string,
    value: number,
    metadata?: Record<string, unknown>
  ) => {
    analytics.trackPerformance({
      metricType: metricType as
        | 'page_load'
        | 'interaction_delay'
        | 'bundle_size'
        | 'render_time',
      value,
      page: pageName,
      userId,
      metadata,
    });
  };

  return {
    trackInteraction,
    trackFormSubmission,
    trackCustomMetric,
  };
}
