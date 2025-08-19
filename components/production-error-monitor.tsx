'use client';

import { useEffect, useState } from 'react';
import { setupGlobalErrorHandling, setupErrorRetry, logClientError } from '@/lib/client-error-logger';
import { reportClientError } from '@/lib/error-reporting';

/**
 * Production Error Monitor Component
 * Sets up comprehensive error handling and monitoring for client-side errors
 */
export function ProductionErrorMonitor() {
  const [isOnline, setIsOnline] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [criticalErrorCount, setCriticalErrorCount] = useState(0);
  const [lastErrorTime, setLastErrorTime] = useState<Date | null>(null);

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
      const memory = (performance as { memory: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;
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

    // Console error monitoring with enhanced filtering
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      // Call original console.error
      originalConsoleError.apply(console, args);
      
      // Report console errors in production with filtering
      if (process.env.NODE_ENV === 'production') {
        const errorMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        // Filter out known non-critical console errors
        const ignoredPatterns = [
          'Warning: ReactDOM.render is deprecated',
          'Warning: componentWillReceiveProps',
          'Download the React DevTools',
          'The above error occurred in the',
        ];
        
        const shouldIgnore = ignoredPatterns.some(pattern => 
          errorMessage.includes(pattern)
        );
        
        if (!shouldIgnore) {
          reportClientError(new Error(`Console Error: ${errorMessage}`), {
            component: 'console_monitor',
            action: 'console_error',
            metadata: {
              arguments: args.length,
              timestamp: new Date().toISOString(),
              severity: errorMessage.toLowerCase().includes('critical') ? 'critical' : 'medium',
            },
          });
          
          setErrorCount(prev => prev + 1);
          setLastErrorTime(new Date());
          
          if (errorMessage.toLowerCase().includes('critical')) {
            setCriticalErrorCount(prev => prev + 1);
          }
        }
      }
    };
    
    console.warn = (...args) => {
      // Call original console.warn
      originalConsoleWarn.apply(console, args);
      
      // Report console warnings in production for critical issues only
      if (process.env.NODE_ENV === 'production') {
        const warningMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        
        // Only report warnings that might indicate serious issues
        const criticalWarnings = [
          'memory',
          'performance',
          'security',
          'authentication',
          'database',
          'network timeout',
        ];
        
        const isCriticalWarning = criticalWarnings.some(keyword => 
          warningMessage.toLowerCase().includes(keyword)
        );
        
        if (isCriticalWarning) {
          reportClientError(new Error(`Console Warning: ${warningMessage}`), {
            component: 'console_monitor',
            action: 'console_warning',
            metadata: {
              arguments: args.length,
              timestamp: new Date().toISOString(),
              severity: 'medium',
            },
          });
        }
      }
    };

    // Resource loading error monitoring
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const resourceUrl = target.tagName === 'LINK' 
          ? (target as HTMLLinkElement).href 
          : (target as HTMLImageElement | HTMLScriptElement).src;
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
      
      // Restore original console methods
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  // Enhanced error monitoring with categorization
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrorCount(prev => prev + 1);
      setLastErrorTime(new Date());
      
      // Check if it's a critical error
      const isCritical = event.error?.message?.toLowerCase().includes('critical') ||
                        event.error?.stack?.toLowerCase().includes('database') ||
                        event.error?.stack?.toLowerCase().includes('auth');
      
      if (isCritical) {
        setCriticalErrorCount(prev => prev + 1);
      }
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setErrorCount(prev => prev + 1);
      setLastErrorTime(new Date());
      
      // Check if it's a critical promise rejection
      const reason = String(event.reason);
      const isCritical = reason.toLowerCase().includes('critical') ||
                        reason.toLowerCase().includes('database') ||
                        reason.toLowerCase().includes('auth');
      
      if (isCritical) {
        setCriticalErrorCount(prev => prev + 1);
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Enhanced development error counter with more information
  if (process.env.NODE_ENV === 'development' && errorCount > 0) {
    return (
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        <div className="bg-red-500 text-white px-3 py-2 rounded text-sm shadow-lg">
          <div className="font-semibold">Errors: {errorCount}</div>
          {criticalErrorCount > 0 && (
            <div className="text-xs">Critical: {criticalErrorCount}</div>
          )}
          {lastErrorTime && (
            <div className="text-xs opacity-75">
              Last: {lastErrorTime.toLocaleTimeString()}
            </div>
          )}
        </div>
        {!isOnline && (
          <div className="bg-orange-500 text-white px-3 py-1 rounded text-xs shadow-lg">
            Offline
          </div>
        )}
      </div>
    );
  }

  // Production monitoring indicator (minimal UI)
  if (process.env.NODE_ENV === 'production' && criticalErrorCount > 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-600 text-white px-2 py-1 rounded-full text-xs shadow-lg animate-pulse">
          {criticalErrorCount}
        </div>
      </div>
    );
  }

  // This component doesn't render anything normally in production
  return null;
}