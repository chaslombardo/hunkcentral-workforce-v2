/**
 * Performance monitoring utilities for tracking component render times
 * and bundle size optimizations
 */

import * as React from 'react';

// Performance monitoring for component render times
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private renderTimes: Map<string, number[]> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing a component render
   */
  startRender(componentName: string): string {
    if (!this.isEnabled) return '';
    
    const markName = `${componentName}-render-start-${Date.now()}`;
    performance.mark(markName);
    return markName;
  }

  /**
   * End timing a component render and record the duration
   */
  endRender(componentName: string, startMark: string): void {
    if (!this.isEnabled || !startMark) return;

    const endMarkName = `${componentName}-render-end-${Date.now()}`;
    performance.mark(endMarkName);
    
    try {
      const measureName = `${componentName}-render-duration`;
      performance.measure(measureName, startMark, endMarkName);
      
      const measure = performance.getEntriesByName(measureName)[0];
      if (measure) {
        this.recordRenderTime(componentName, measure.duration);
      }
      
      // Clean up marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMarkName);
      performance.clearMeasures(measureName);
    } catch {
      console.warn('Performance measurement failed');
    }
  }

  /**
   * Record a render time for a component
   */
  private recordRenderTime(componentName: string, duration: number): void {
    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, []);
    }
    
    const times = this.renderTimes.get(componentName)!;
    times.push(duration);
    
    // Keep only the last 100 measurements to prevent memory leaks
    if (times.length > 100) {
      times.shift();
    }
  }

  /**
   * Get performance statistics for a component
   */
  getStats(componentName: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    recent: number;
  } | null {
    const times = this.renderTimes.get(componentName);
    if (!times || times.length === 0) return null;

    const count = times.length;
    const sum = times.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = Math.min(...times);
    const max = Math.max(...times);
    const recent = times[times.length - 1];

    return { count, average, min, max, recent };
  }

  /**
   * Get all performance statistics
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const stats: Record<string, ReturnType<typeof this.getStats>> = {};
    
    for (const [componentName] of this.renderTimes) {
      stats[componentName] = this.getStats(componentName);
    }
    
    return stats;
  }

  /**
   * Log performance statistics to console
   */
  logStats(): void {
    if (!this.isEnabled) return;

    const stats = this.getAllStats();
    const sortedStats = Object.entries(stats)
      .filter(([, stat]) => stat !== null)
      .sort(([, a], [, b]) => (b?.average || 0) - (a?.average || 0));

    if (sortedStats.length === 0) {
      console.warn('No performance data available');
      return;
    }

    console.warn('🚀 Component Performance Stats');
    console.warn(
      sortedStats.reduce((acc, [name, stat]) => {
        acc[name] = {
          'Renders': stat?.count,
          'Avg (ms)': stat?.average.toFixed(2),
          'Min (ms)': stat?.min.toFixed(2),
          'Max (ms)': stat?.max.toFixed(2),
          'Recent (ms)': stat?.recent.toFixed(2)
        };
        return acc;
      }, {} as Record<string, Record<string, unknown>>)
    );
    console.warn('End performance stats');
  }

  /**
   * Clear all performance data
   */
  clear(): void {
    this.renderTimes.clear();
  }

  /**
   * Enable or disable performance monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
}

/**
 * React hook for monitoring component performance
 */
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startRender: () => monitor.startRender(componentName),
    endRender: (startMark: string) => monitor.endRender(componentName, startMark),
    getStats: () => monitor.getStats(componentName)
  };
}

/**
 * Higher-order component for automatic performance monitoring
 */
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent = React.forwardRef<unknown, P>((props, ref) => {
    const monitor = usePerformanceMonitor(displayName);
    const startMarkRef = React.useRef<string>('');

    React.useLayoutEffect(() => {
      startMarkRef.current = monitor.startRender();
    });

    React.useLayoutEffect(() => {
      monitor.endRender(startMarkRef.current);
    });

    return <Component {...(props as P)} ref={ref} />;
  });

  WrappedComponent.displayName = `withPerformanceMonitor(${displayName})`;
  return WrappedComponent;
}

/**
 * Bundle size analysis utilities
 */
export const bundleAnalysis = {
  /**
   * Log the size of imported modules (development only)
   */
  logImportSize: (moduleName: string, moduleExports: unknown) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      const size = JSON.stringify(moduleExports).length;
      console.warn(`📦 ${moduleName}: ~${(size / 1024).toFixed(2)}KB`);
    } catch {
      console.warn(`📦 ${moduleName}: Unable to calculate size`);
    }
  },

  /**
   * Warn about large component props
   */
  warnLargeProps: (componentName: string, props: unknown, threshold = 1000) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    try {
      const size = JSON.stringify(props).length;
      if (size > threshold) {
        console.warn(
          `⚠️ ${componentName} has large props (${(size / 1024).toFixed(2)}KB). ` +
          'Consider memoization or prop optimization.'
        );
      }
    } catch {
      // Ignore circular reference errors
    }
  },

  /**
   * Track component render for bundle optimization
   */
  trackRender: (componentName: string, variant?: string, props?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // Import bundle analyzer dynamically to avoid circular dependencies
    import('./bundle-analyzer').then(({ bundleAnalyzer }) => {
      bundleAnalyzer.trackComponentUsage(componentName, variant, props);
    }).catch(() => {
      // Ignore import failures
    });
  }
};

// Global performance monitoring instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Development-only performance logging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Log stats every 30 seconds in development
  setInterval(() => {
    performanceMonitor.logStats();
  }, 30000);

  // Add to window for manual inspection
  (window as unknown as Record<string, unknown>).__performanceMonitor = performanceMonitor;
}