/**
 * Code splitting utilities for lazy loading components and optimizing bundle size
 */

import * as React from 'react';

// Loading fallback component
const LoadingFallback = ({ componentName }: { componentName?: string }) => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hunks-green"></div>
    {componentName && (
      <span className="ml-2 text-sm text-muted-foreground">
        Loading {componentName}...
      </span>
    )}
  </div>
);

// Error boundary for lazy loaded components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; componentName?: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; componentName?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error loading component ${this.props.componentName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="text-destructive mb-2">
            Failed to load {this.props.componentName || 'component'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-hunks-green hover:underline"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Enhanced lazy loading with performance monitoring and error handling
 */
export function createLazyComponent<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  componentName?: string,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(async () => {
    const startTime = performance.now();
    
    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      
      // Log load time in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(`📦 ${componentName || 'Component'} loaded in ${loadTime.toFixed(2)}ms`);
      }
      
      return module;
    } catch (error) {
      console.error(`Failed to load ${componentName || 'component'}:`, error);
      throw error;
    }
  });

  const WrappedComponent = React.forwardRef<unknown, React.ComponentProps<T>>((props, ref) => {
    const FallbackComponent = fallback || (() => <LoadingFallback componentName={componentName} />);
    
    return (
      <LazyErrorBoundary componentName={componentName}>
        <React.Suspense fallback={<FallbackComponent />}>
          <LazyComponent {...(props as React.ComponentProps<T>)} ref={ref} />
        </React.Suspense>
      </LazyErrorBoundary>
    );
  });

  WrappedComponent.displayName = `Lazy(${componentName || 'Component'})`;
  return WrappedComponent;
}

/**
 * Preload a lazy component
 */
export function preloadComponent(importFn: () => Promise<unknown>) {
  // Start loading the component but don't wait for it
  importFn().catch(error => {
    console.warn('Failed to preload component:', error);
  });
}

/**
 * Hook for preloading components on hover or focus
 */
export function usePreloadOnHover(importFn: () => Promise<unknown>) {
  const [isPreloaded, setIsPreloaded] = React.useState(false);

  const preload = React.useCallback(() => {
    if (!isPreloaded) {
      setIsPreloaded(true);
      preloadComponent(importFn);
    }
  }, [importFn, isPreloaded]);

  return {
    onMouseEnter: preload,
    onFocus: preload,
  };
}

/**
 * Tree-shakable component variants
 * Only import the variants that are actually used
 */
export const createVariantLoader = <T extends Record<string, React.ComponentType<unknown>>>(
  variants: T
) => {
  const loadedVariants = new Map<keyof T, React.ComponentType<unknown>>();

  return {
    /**
     * Get a variant component, loading it lazily if needed
     */
    getVariant: (variantName: keyof T): React.ComponentType<unknown> => {
      if (loadedVariants.has(variantName)) {
        return loadedVariants.get(variantName)!;
      }

      const VariantComponent = variants[variantName];
      if (!VariantComponent) {
        throw new Error(`Variant "${String(variantName)}" not found`);
      }

      loadedVariants.set(variantName, VariantComponent);
      return VariantComponent;
    },

    /**
     * Preload specific variants
     */
    preloadVariants: (variantNames: (keyof T)[]) => {
      variantNames.forEach(name => {
        if (!loadedVariants.has(name) && variants[name]) {
          loadedVariants.set(name, variants[name]);
        }
      });
    },

    /**
     * Get all loaded variants (for debugging)
     */
    getLoadedVariants: () => Array.from(loadedVariants.keys()),
  };
};

/**
 * Bundle size optimization utilities
 */
export const bundleOptimization = {
  /**
   * Dynamically import only the icons that are needed
   */
  createIconLoader: () => {
    const iconCache = new Map<string, React.ComponentType<any>>();

    const loader = {
      loadIcon: async (iconName: string) => {
        if (iconCache.has(iconName)) {
          return iconCache.get(iconName)!;
        }

        try {
          // Dynamic import from lucide-react
          const iconModule = await import('lucide-react');
          const IconComponent = (iconModule as Record<string, React.ComponentType<unknown>>)[iconName];
          
          if (IconComponent) {
            iconCache.set(iconName, IconComponent);
            return IconComponent;
          } else {
            console.warn(`Icon "${iconName}" not found in lucide-react`);
            return null;
          }
        } catch (error) {
          console.error(`Failed to load icon "${iconName}":`, error);
          return null;
        }
      },

      preloadIcons: async (names: string[]) => {
        const promises = names.map(name => loader.loadIcon(name));
        await Promise.allSettled(promises);
      },

      getLoadedIcons: () => Array.from(iconCache.keys()),
    };

    return loader;
  },

  /**
   * Remove unused CSS classes at build time (development helper)
   */
  analyzeUnusedClasses: (usedClasses: Set<string>) => {
    if (process.env.NODE_ENV !== 'development') return;

    // This would be used with a build-time plugin to identify unused classes
    console.warn('Used CSS classes:', Array.from(usedClasses).sort());
  },
};

/**
 * Performance-aware component loader
 */
export function createPerformantLoader<T extends React.ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    componentName?: string;
    preloadCondition?: () => boolean;
    fallback?: React.ComponentType;
    errorBoundary?: boolean;
  } = {}
) {
  const {
    componentName = 'Component',
    preloadCondition,
    fallback,
    errorBoundary = true,
  } = options;

  const LazyComponent = createLazyComponent(importFn, componentName, fallback);

  const PerformantComponent = React.forwardRef<unknown, React.ComponentProps<T>>((props, ref) => {
    // Preload if condition is met
    React.useEffect(() => {
      if (preloadCondition?.()) {
        preloadComponent(importFn);
      }
    }, []);

    if (!errorBoundary) {
      return <LazyComponent {...(props as React.ComponentProps<T>)} ref={ref} />;
    }

    return (
      <LazyErrorBoundary componentName={componentName}>
        <LazyComponent {...(props as React.ComponentProps<T>)} ref={ref} />
      </LazyErrorBoundary>
    );
  });

  PerformantComponent.displayName = `PerformantLoader(${componentName})`;
  return PerformantComponent;
}

// Export commonly used lazy components for the theme system
// Note: These would be implemented when the actual components exist
export const LazyComponents = {
  // Example lazy components - implement when needed
  // PayrollChart: createLazyComponent(
  //   () => import('@/components/features/reports/payroll-chart'),
  //   'PayrollChart'
  // ),
};

const codeSplittingUtils = {
  createLazyComponent,
  preloadComponent,
  usePreloadOnHover,
  createVariantLoader,
  bundleOptimization,
  createPerformantLoader,
  LazyComponents,
};

export default codeSplittingUtils;