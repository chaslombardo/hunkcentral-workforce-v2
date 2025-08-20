/**
 * Performance optimization configuration
 * Central configuration for performance monitoring and optimization settings
 */

export interface PerformanceConfig {
  // Monitoring settings
  monitoring: {
    enabled: boolean;
    trackRenderTimes: boolean;
    trackBundleUsage: boolean;
    logInterval: number; // milliseconds
    maxStoredMeasurements: number;
  };

  // Warning thresholds
  thresholds: {
    renderTime: number; // milliseconds
    propSize: number; // bytes
    reRenderCount: number;
    memoryUsage: number; // MB
  };

  // Optimization settings
  optimization: {
    enableMemoization: boolean;
    enableLazyLoading: boolean;
    enableTreeShaking: boolean;
    enableCodeSplitting: boolean;
  };

  // Component-specific settings
  components: {
    [componentName: string]: {
      memoize: boolean;
      lazyLoad: boolean;
      propSizeThreshold: number;
      trackPerformance: boolean;
    };
  };
}

// Default configuration
export const defaultPerformanceConfig: PerformanceConfig = {
  monitoring: {
    enabled: process.env.NODE_ENV === 'development',
    trackRenderTimes: true,
    trackBundleUsage: true,
    logInterval: 30000, // 30 seconds
    maxStoredMeasurements: 100,
  },

  thresholds: {
    renderTime: 16, // 60fps target
    propSize: 1000, // 1KB
    reRenderCount: 10,
    memoryUsage: 50, // 50MB
  },

  optimization: {
    enableMemoization: true,
    enableLazyLoading: true,
    enableTreeShaking: true,
    enableCodeSplitting: true,
  },

  components: {
    // High-frequency components that need optimization
    MetricCard: {
      memoize: true,
      lazyLoad: false, // Used frequently
      propSizeThreshold: 500,
      trackPerformance: true,
    },

    BrandButton: {
      memoize: true,
      lazyLoad: false, // Used frequently
      propSizeThreshold: 200,
      trackPerformance: true,
    },

    StatusIndicator: {
      memoize: true,
      lazyLoad: false, // Used frequently
      propSizeThreshold: 200,
      trackPerformance: true,
    },

    SmartInput: {
      memoize: true,
      lazyLoad: false, // Used in forms
      propSizeThreshold: 800,
      trackPerformance: true,
    },

    FormFeedback: {
      memoize: true,
      lazyLoad: true, // Only shown on errors/success
      propSizeThreshold: 300,
      trackPerformance: true,
    },

    BrandLoading: {
      memoize: true,
      lazyLoad: false, // Used frequently
      propSizeThreshold: 100,
      trackPerformance: false, // Simple component
    },

    // Layout components
    SmartBreadcrumbs: {
      memoize: true,
      lazyLoad: false, // Always visible
      propSizeThreshold: 300,
      trackPerformance: true,
    },

    NavigationProvider: {
      memoize: true,
      lazyLoad: false, // Core component
      propSizeThreshold: 500,
      trackPerformance: true,
    },

    // Feature components that can be lazy loaded
    PayrollReport: {
      memoize: true,
      lazyLoad: true, // Heavy component
      propSizeThreshold: 2000,
      trackPerformance: true,
    },

    LogForm: {
      memoize: true,
      lazyLoad: true, // Complex form
      propSizeThreshold: 1500,
      trackPerformance: true,
    },

    EmptyStates: {
      memoize: true,
      lazyLoad: true, // Only shown when needed
      propSizeThreshold: 400,
      trackPerformance: false,
    },
  },
};

// Environment-specific overrides
const environmentOverrides: Partial<PerformanceConfig> = {
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    monitoring: {
      enabled: false,
      trackRenderTimes: false,
      trackBundleUsage: false,
      logInterval: 0,
      maxStoredMeasurements: 0,
    },
    optimization: {
      enableMemoization: true,
      enableLazyLoading: true,
      enableTreeShaking: true,
      enableCodeSplitting: true,
    },
  }),

  // Test environment
  ...(process.env.NODE_ENV === 'test' && {
    monitoring: {
      enabled: false,
      trackRenderTimes: false,
      trackBundleUsage: false,
      logInterval: 0,
      maxStoredMeasurements: 0,
    },
  }),
};

// Merge configuration with environment overrides
export const performanceConfig: PerformanceConfig = {
  ...defaultPerformanceConfig,
  ...environmentOverrides,
  monitoring: {
    ...defaultPerformanceConfig.monitoring,
    ...environmentOverrides.monitoring,
  },
  thresholds: {
    ...defaultPerformanceConfig.thresholds,
    ...environmentOverrides.thresholds,
  },
  optimization: {
    ...defaultPerformanceConfig.optimization,
    ...environmentOverrides.optimization,
  },
  components: {
    ...defaultPerformanceConfig.components,
    ...environmentOverrides.components,
  },
};

/**
 * Get performance configuration for a specific component
 */
export function getComponentConfig(componentName: string) {
  return (
    performanceConfig.components[componentName] || {
      memoize: false,
      lazyLoad: false,
      propSizeThreshold: performanceConfig.thresholds.propSize,
      trackPerformance: false,
    }
  );
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof PerformanceConfig['optimization']
): boolean {
  return performanceConfig.optimization[feature];
}

/**
 * Check if monitoring is enabled
 */
export function isMonitoringEnabled(): boolean {
  return performanceConfig.monitoring.enabled;
}

/**
 * Get threshold value
 */
export function getThreshold(
  threshold: keyof PerformanceConfig['thresholds']
): number {
  return performanceConfig.thresholds[threshold];
}

/**
 * Update performance configuration at runtime (development only)
 */
export function updatePerformanceConfig(
  updates: Partial<PerformanceConfig>
): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn(
      'Performance configuration can only be updated in development mode'
    );
    return;
  }

  Object.assign(performanceConfig, updates);
  console.warn('Performance configuration updated:', updates);
}

// Export for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as Record<string, unknown>).__performanceConfig = {
    config: performanceConfig,
    getComponentConfig,
    isFeatureEnabled,
    isMonitoringEnabled,
    getThreshold,
    updatePerformanceConfig,
  };
}

export default performanceConfig;
