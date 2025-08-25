'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getMonitoring } from '@/lib/monitoring';

interface PerformanceTrackerProps {
  userId?: string;
}

export function PerformanceTracker({ userId }: PerformanceTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Track page load performance
    const trackPageLoad = () => {
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

          // Track page load metrics
          const monitoring = getMonitoring();
          if (monitoring) {
            monitoring.trackPageLoad(pathname, loadTime, {
              domContentLoaded,
              firstPaint,
              firstContentfulPaint,
              userId,
            });
          }
        }
      }
    };

    // Track page load after a short delay to ensure all metrics are available
    const timer = setTimeout(trackPageLoad, 100);

    return () => clearTimeout(timer);
  }, [pathname, userId]);

  useEffect(() => {
    // Track user interactions
    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const component =
        target.closest('[data-component]')?.getAttribute('data-component') ||
        'unknown';
      const action = event.type;

      const monitoring = getMonitoring();
      if (monitoring) {
        monitoring.trackInteraction({
          component,
          action,
          duration: 0,
          metadata: {
            page: pathname,
            userId,
            elementTag: target.tagName.toLowerCase(),
            elementClass: target.className,
          },
        });
      }
    };

    // Add event listeners for common interactions
    const events = ['click', 'submit', 'focus', 'blur'];
    events.forEach((eventType) => {
      document.addEventListener(eventType, trackInteraction, { passive: true });
    });

    return () => {
      events.forEach((eventType) => {
        document.removeEventListener(eventType, trackInteraction);
      });
    };
  }, [pathname, userId]);

  useEffect(() => {
    // Track system health metrics
    const trackSystemHealth = () => {
      if (typeof window !== 'undefined') {
        const connection =
          (navigator as any).connection ||
          (navigator as any).mozConnection ||
          (navigator as any).webkitConnection;

        const monitoring = getMonitoring();
        if (monitoring) {
          monitoring.trackSystemHealth({
            metricType: 'memory',
            value: (performance as any).memory
              ? (performance as any).memory.usedJSHeapSize
              : 0,
            status: 'healthy',
          });
        }
      }
    };

    // Track system health on mount and periodically
    trackSystemHealth();
    const healthInterval = setInterval(trackSystemHealth, 30000); // Every 30 seconds

    return () => clearInterval(healthInterval);
  }, []);

  useEffect(() => {
    // Track page visibility changes
    const handleVisibilityChange = () => {
      const monitoring = getMonitoring();
      if (!monitoring) return;

      if (document.hidden) {
        monitoring.trackInteraction({
          component: 'page',
          action: 'hidden',
          duration: 0,
          metadata: {
            page: pathname,
            userId,
            timestamp: Date.now(),
          },
        });
      } else {
        monitoring.trackInteraction({
          component: 'page',
          action: 'visible',
          duration: 0,
          metadata: {
            page: pathname,
            userId,
            timestamp: Date.now(),
          },
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, userId]);

  // This component doesn't render anything
  return null;
}
