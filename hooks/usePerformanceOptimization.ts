/**
 * Performance optimization hook
 * Provides utilities for component performance monitoring and optimization
 */

import * as React from 'react';
import { usePerformanceMonitor } from '@/lib/performance-monitor';
import { bundleAnalysis } from '@/lib/performance-monitor';

interface PerformanceOptimizationOptions {
  /**
   * Component name for tracking
   */
  componentName: string;
  
  /**
   * Props to monitor for size warnings
   */
  props?: Record<string, unknown>;
  
  /**
   * Threshold for large props warning (in bytes)
   */
  propSizeThreshold?: number;
  
  /**
   * Whether to track render performance
   */
  trackRenderTime?: boolean;
  
  /**
   * Whether to warn about large props
   */
  warnLargeProps?: boolean;
  
  /**
   * Component variant for bundle analysis
   */
  variant?: string;
}

/**
 * Hook for comprehensive performance optimization
 */
export function usePerformanceOptimization({
  componentName,
  props = {},
  propSizeThreshold = 500,
  trackRenderTime = true,
  warnLargeProps = true,
  variant
}: PerformanceOptimizationOptions) {
  const monitor = usePerformanceMonitor(componentName);
  const startMarkRef = React.useRef<string>('');
  const renderCountRef = React.useRef(0);
  const lastPropsRef = React.useRef<Record<string, unknown>>({});

  // Track render performance
  React.useLayoutEffect(() => {
    if (trackRenderTime) {
      startMarkRef.current = monitor.startRender();
      renderCountRef.current++;
    }
  });

  React.useLayoutEffect(() => {
    if (trackRenderTime && startMarkRef.current) {
      monitor.endRender(startMarkRef.current);
    }
  });

  // Warn about large props and track bundle usage
  React.useEffect(() => {
    if (warnLargeProps) {
      bundleAnalysis.warnLargeProps(componentName, props, propSizeThreshold);
    }
    
    bundleAnalysis.trackRender(componentName, variant, props);
  }, [componentName, props, propSizeThreshold, warnLargeProps, variant]);

  // Detect unnecessary re-renders
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const propsChanged = JSON.stringify(props) !== JSON.stringify(lastPropsRef.current);
      
      if (renderCountRef.current > 1 && !propsChanged) {
        console.warn(
          `⚠️ ${componentName} re-rendered without prop changes (render #${renderCountRef.current}). ` +
          'Consider using React.memo or optimizing parent component.'
        );
      }
      
      lastPropsRef.current = props;
    }
  }, [componentName, props]);

  // Performance statistics
  const stats = React.useMemo(() => monitor.getStats(), [monitor]);

  // Optimization recommendations
  const recommendations = React.useMemo(() => {
    const recs: string[] = [];
    
    if (stats && stats.average > 16) {
      recs.push('Component render time exceeds 16ms - consider optimization');
    }
    
    if (renderCountRef.current > 10 && stats && stats.count > renderCountRef.current * 1.5) {
      recs.push('High re-render frequency detected - check prop stability');
    }
    
    const propSize = JSON.stringify(props).length;
    if (propSize > propSizeThreshold) {
      recs.push('Large props detected - consider memoization or prop optimization');
    }
    
    return recs;
  }, [stats, props, propSizeThreshold]);

  return {
    /**
     * Current performance statistics
     */
    stats,
    
    /**
     * Number of renders for this component instance
     */
    renderCount: renderCountRef.current,
    
    /**
     * Performance optimization recommendations
     */
    recommendations,
    
    /**
     * Whether the component is performing well
     */
    isPerformant: stats ? stats.average < 16 && recommendations.length === 0 : true,
    
    /**
     * Manual performance measurement utilities
     */
    measure: {
      start: () => monitor.startRender(),
      end: (startMark: string) => monitor.endRender(startMark)
    }
  };
}

/**
 * Hook for memoizing expensive calculations
 */
export function useExpensiveCalculation<T>(
  calculation: () => T,
  dependencies: React.DependencyList,
  componentName?: string
): T {
  return React.useMemo(() => {
    const startTime = performance.now();
    const result = calculation();
    const duration = performance.now() - startTime;
    
    if (process.env.NODE_ENV === 'development' && duration > 5) {
      console.warn(
        `⏱️ Expensive calculation in ${componentName || 'component'}: ${duration.toFixed(2)}ms`
      );
    }
    
    return result;
  }, dependencies);
}

/**
 * Hook for optimizing callback functions
 */
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList,
  componentName?: string
): T {
  const callCountRef = React.useRef(0);
  
  const optimizedCallback = React.useCallback((...args: Parameters<T>) => {
    callCountRef.current++;
    
    if (process.env.NODE_ENV === 'development' && callCountRef.current > 100) {
      console.warn(
        `🔄 High callback usage in ${componentName || 'component'}: ${callCountRef.current} calls`
      );
    }
    
    return callback(...args);
  }, dependencies) as T;
  
  return optimizedCallback;
}

/**
 * Hook for detecting and preventing memory leaks
 */
export function useMemoryLeakDetection(componentName: string) {
  const mountTimeRef = React.useRef(Date.now());
  const timersRef = React.useRef<Set<NodeJS.Timeout>>(new Set());
  const intervalsRef = React.useRef<Set<NodeJS.Timeout>>(new Set());
  const listenersRef = React.useRef<Set<() => void>>(new Set());

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      // Clear all timers
      timersRef.current.forEach(timer => clearTimeout(timer));
      intervalsRef.current.forEach(interval => clearInterval(interval));
      
      // Remove all listeners
      listenersRef.current.forEach(cleanup => cleanup());
      
      const lifespan = Date.now() - mountTimeRef.current;
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`🧹 Cleaned up ${componentName} after ${lifespan}ms`);
        
        if (timersRef.current.size > 0) {
          console.warn(`⚠️ ${componentName} had ${timersRef.current.size} uncleaned timers`);
        }
        
        if (listenersRef.current.size > 0) {
          console.warn(`⚠️ ${componentName} had ${listenersRef.current.size} uncleaned listeners`);
        }
      }
    };
  }, [componentName]);

  return {
    /**
     * Register a timer for automatic cleanup
     */
    registerTimer: (timer: NodeJS.Timeout) => {
      timersRef.current.add(timer);
      return timer;
    },
    
    /**
     * Register an interval for automatic cleanup
     */
    registerInterval: (interval: NodeJS.Timeout) => {
      intervalsRef.current.add(interval);
      return interval;
    },
    
    /**
     * Register a cleanup function
     */
    registerCleanup: (cleanup: () => void) => {
      listenersRef.current.add(cleanup);
    },
    
    /**
     * Component lifespan in milliseconds
     */
    getLifespan: () => Date.now() - mountTimeRef.current
  };
}

export default usePerformanceOptimization;