/**
 * Code splitting utilities for enhanced components
 * Implements lazy loading and dynamic imports for better performance
 */

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { bundleAnalyzer } from './bundle-analyzer';

// Generic loading fallback component
const LoadingFallback = ({ className }: { className?: string }) => (
  <div className={className}>
    <Skeleton className="h-full w-full" />
  </div>
);

/**
 * Create a lazy-loaded component with performance tracking
 */
export function createLazyComponent(
  importFn: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>,
  componentName: string,
  fallback?: React.ComponentType<Record<string, unknown>>
) {
  const LazyComponent = React.lazy(async () => {
    const startTime = performance.now();
    
    try {
      const moduleResult = await importFn();
      const loadTime = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`📦 Loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
      }
      
      bundleAnalyzer.trackComponentUsage(componentName, 'lazy-loaded');
      return moduleResult;
    } catch (error) {
      console.error(`Failed to load ${componentName}:`, error);
      throw error;
    }
  });
  
  return {
    Component: LazyComponent,
    Fallback: fallback || LoadingFallback
  };
}

/**
 * Preload component on user interaction
 */
export function usePreloadOnInteraction<T>(
  importFn: () => Promise<T>,
  trigger: 'hover' | 'focus' | 'click' = 'hover'
) {
  const [isPreloaded, setIsPreloaded] = React.useState(false);
  
  const preload = React.useCallback(async () => {
    if (isPreloaded) return;
    
    try {
      await importFn();
      setIsPreloaded(true);
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }, [importFn, isPreloaded]);

  const handlers = React.useMemo(() => {
    switch (trigger) {
      case 'hover':
        return {
          onMouseEnter: preload,
          onFocus: preload
        };
      case 'focus':
        return {
          onFocus: preload
        };
      case 'click':
        return {
          onClick: preload
        };
      default:
        return {};
    }
  }, [trigger, preload]);

  return { handlers, isPreloaded };
}

/**
 * Route-based preloading
 */
export function useRoutePreload(
  routes: Record<string, () => Promise<unknown>>,
  currentRoute: string
) {
  React.useEffect(() => {
    const preloadRoute = routes[currentRoute];
    if (preloadRoute) {
      // Preload after a short delay to not block initial render
      const timer = setTimeout(() => {
        preloadRoute().catch(() => {
          // Ignore preload failures
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [routes, currentRoute]);
}

/**
 * Intersection observer based preloading
 */
export function useIntersectionPreload<T>(
  importFn: () => Promise<T>,
  options: IntersectionObserverInit = { rootMargin: '50px' }
) {
  const [ref, setRef] = React.useState<Element | null>(null);
  const [isPreloaded, setIsPreloaded] = React.useState(false);

  React.useEffect(() => {
    if (!ref || isPreloaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            importFn()
              .then(() => setIsPreloaded(true))
              .catch(() => {
                // Ignore preload failures
              });
            observer.disconnect();
          }
        });
      },
      options
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, importFn, isPreloaded, options]);

  return setRef;
}

// Example lazy loading configurations (to be implemented as needed)
export const lazyLoadingExamples = {
  // These would be implemented when specific components need lazy loading
  // MetricCard: () => import('@/components/brand/metric-card'),
  // BrandButton: () => import('@/components/brand/brand-button'),
  // etc.
};

const codeSplittingUtils = {
  createLazyComponent,
  usePreloadOnInteraction,
  useRoutePreload,
  useIntersectionPreload,
  lazyLoadingExamples
};

export default codeSplittingUtils;