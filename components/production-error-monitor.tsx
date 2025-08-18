'use client';

import { useEffect, useState } from 'react';
import { setupGlobalErrorHandling, setupErrorRetry, logClientError } from '@/lib/client-error-logger';
import { reportClientError } from '@/lib/error-reporting';

/**
 * Production Error Monitor Component
 * Sets up comprehensive error handling and monitoring for client-side errors
 */
export function ProductionErrorMonitor() {
  const [, setIsOnline] = useState(true);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // Set up global error handling for unhandled errors and promise rejections
    setupGlobalErrorHandling();
    
    // Set up automatic retry mechanism for pending errors
    setupErrorRetry();

    // Monitor network status
    const handleOnline = () => {
      setIsOnline(true);
      // Retry pending errors when coming back online
      setupErrorRetry();
    };

    const handleOffline = () => {
      setIsOnline(false);
      logClientError(new Error('Network connection lost'), {
        component: 'network_monitor',
        action: 'connection_lost',
      });
    };

    // Performance monitoring
    const monitorPerformance = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.fetchStart;
          const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
          
          // Report slow page loads as potential issues
          if (loadTime > 5000) {
            reportClientError(new Error(`Slow page load: ${loadTime}ms`), {
              component: 'performance_monitor',
              action: 'slow_page_load',
              metadata: {
                loadTime,
                domContentLoaded,
                navigationTiming: {
                  fetchStart: navigation.fetchStart,
                  domainLookupStart: navigation.domainLookupStart,
                  domainLookupEnd: navigation.domainLookupEnd,
                  connectStart: navigation.connectStart,
                  connectEnd: navigation.connectEnd,
                  requestStart: navigation.requestStart,
                  responseStart: navigation.responseStart,
                  responseEnd: navigation.responseEnd,
                  domContentLoadedEventStart: navigation.domContentLoadedEventStart,
                  domContentLoadedEventEnd: navigation.domContentLoadedEventEnd,
                  loadEventStart: navigation.loadEventStart,
                  loadEventEnd: navigation.loadEventEnd,
                },
              },
            });
          }
        }
      }
    };

    // Memory usage monitoring
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMemory = memory.usedJSHeapSize;
        const totalMemory = memory.totalJSHeapSize;
        const memoryLimit = memory.jsHeapSizeLimit;
        
        // Report high memory usage
        if (usedMemory / memoryLimit > 0.8) {
          reportClientError(new Error(`High memory usage: ${Math.round((usedMemory / memoryLimit) * 100)}%`), {
            component: 'memory_monitor',
            action: 'high_memory_usage',
            metadata: {
              usedMemory,
              totalMemory,
              memoryLimit,
              usagePercentage: (usedMemory / memoryLimit) * 100,
            },
          });
        }
      }
    };

    // Console error monitoring
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // Report console errors in production
      if (process.env.NODE_ENV === 'production') {
        const errorMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        reportClientError(new Error(`Console Error: ${errorMessage}`), {
          component: 'console_monitor',
          action: 'console_error',
          metadata: {
            arguments: args.length,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    // Resource loading error monitoring
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const resourceUrl = (target as any).src || (target as any).href;
        reportClientError(new Error(`Failed to load resource: ${resourceUrl}`), {
          component: 'resource_monitor',
          action: 'resource_load_error',
          metadata: {
            resourceType: target.tagName.toLowerCase(),
            resourceUrl,
            timestamp: new Date().toISOString(),
          },
        });
      }
    };

    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', handleResourceError, true);

    // Initial performance check
    setTimeout(monitorPerformance, 2000);
    
    // Periodic memory monitoring
    const memoryInterval = setInterval(monitorMemory, 30000); // Every 30 seconds

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleResourceError, true);
      clearInterval(memoryInterval);
      
      // Restore original console.error
      console.error = originalConsoleError;
    };
  }, []);

  // Monitor error count for debugging
  useEffect(() => {
    const handleError = () => setErrorCount(prev => prev + 1);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // Development error counter (only visible in development)
  if (process.env.NODE_ENV === 'development' && errorCount > 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-sm z-50">
        Errors: {errorCount}
      </div>
    );
  }

  // This component doesn't render anything in production
  return null;
}