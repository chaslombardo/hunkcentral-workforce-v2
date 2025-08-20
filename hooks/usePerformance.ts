'use client';

import { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

interface NetworkInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export function usePerformance() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [networkInfo, setNetworkInfo] = useState<Partial<NetworkInfo>>({});
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    // Get network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });

      // Consider 2G and slow-2g as slow connections
      setIsSlowConnection(['slow-2g', '2g'].includes(connection.effectiveType));

      // Listen for network changes
      connection.addEventListener('change', () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
        setIsSlowConnection(
          ['slow-2g', '2g'].includes(connection.effectiveType)
        );
      });
    }

    // Measure performance metrics
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;

        if (navigation) {
          setMetrics((prev) => ({
            ...prev,
            loadTime: navigation.loadEventEnd - navigation.loadEventStart,
            timeToInteractive:
              navigation.domInteractive - navigation.fetchStart,
          }));
        }

        // Web Vitals
        if ('PerformanceObserver' in window) {
          // First Contentful Paint
          const fcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcp = entries.find(
              (entry) => entry.name === 'first-contentful-paint'
            );
            if (fcp) {
              setMetrics((prev) => ({
                ...prev,
                firstContentfulPaint: fcp.startTime,
              }));
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });

          // Largest Contentful Paint
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              setMetrics((prev) => ({
                ...prev,
                largestContentfulPaint: lastEntry.startTime,
              }));
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.processingStart && entry.startTime) {
                const fid = entry.processingStart - entry.startTime;
                setMetrics((prev) => ({ ...prev, firstInputDelay: fid }));
              }
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            setMetrics((prev) => ({
              ...prev,
              cumulativeLayoutShift: clsValue,
            }));
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
      }
    };

    // Measure after page load
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
    }

    return () => {
      window.removeEventListener('load', measurePerformance);
    };
  }, []);

  const measurePageLoad = useCallback((pageName: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Log to analytics or monitoring service
      if (loadTime > 1000) {
        // Slow page load detected
      }

      return loadTime;
    };
  }, []);

  const measureApiCall = useCallback((apiName: string) => {
    const startTime = performance.now();

    return (success: boolean = true) => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log slow API calls
      if (duration > 2000) {
        // Slow API call detected
      }

      return duration;
    };
  }, []);

  const getPerformanceScore = useCallback(() => {
    let score = 100;

    // Deduct points for poor metrics
    if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 2000) {
      score -= 20;
    }
    if (
      metrics.largestContentfulPaint &&
      metrics.largestContentfulPaint > 2500
    ) {
      score -= 20;
    }
    if (metrics.firstInputDelay && metrics.firstInputDelay > 100) {
      score -= 20;
    }
    if (metrics.cumulativeLayoutShift && metrics.cumulativeLayoutShift > 0.1) {
      score -= 20;
    }
    if (metrics.loadTime && metrics.loadTime > 1000) {
      score -= 20;
    }

    return Math.max(0, score);
  }, [metrics]);

  return {
    metrics,
    networkInfo,
    isSlowConnection,
    measurePageLoad,
    measureApiCall,
    getPerformanceScore,
    isGoodPerformance: getPerformanceScore() >= 80,
  };
}
