/**
 * React Hook for Monitoring Integration
 * Provides easy access to monitoring functionality in React components
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  getClientMonitoring,
  type FeedbackData,
} from '@/lib/client-monitoring';

export interface SystemHealth {
  status: string;
  services: Record<string, boolean>;
  timestamp: string;
}

export interface ABTestVariant {
  variant: string | null;
  config: Record<string, unknown>;
  isControl: boolean;
}

export function useMonitoring() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);

  // Track events
  const trackEvent = useCallback(
    (eventType: string, metadata?: Record<string, unknown>) => {
      try {
        const monitoring = getClientMonitoring();
        monitoring.trackEvent(eventType, metadata);
      } catch (error) {
        console.warn('Failed to track event:', error);
      }
    },
    []
  );

  // Track metrics
  const trackMetric = useCallback(
    (metricType: string, value: number, metadata?: Record<string, unknown>) => {
      try {
        const monitoring = getClientMonitoring();
        monitoring.trackMetric(metricType, value, metadata);
      } catch (error) {
        console.warn('Failed to track metric:', error);
      }
    },
    []
  );

  // Track interactions
  const trackInteraction = useCallback(
    (action: string, component: string, duration?: number) => {
      try {
        const monitoring = getClientMonitoring();
        monitoring.trackInteraction(action, component, duration);
      } catch (error) {
        console.warn('Failed to track interaction:', error);
      }
    },
    []
  );

  // Submit feedback
  const submitFeedback = useCallback(async (feedback: FeedbackData) => {
    try {
      const monitoring = getClientMonitoring();
      return await monitoring.submitFeedback(feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  // Get system health
  const getSystemHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const monitoring = getClientMonitoring();
      const health = await monitoring.getSystemHealth();
      setSystemHealth(health);
      return health;
    } catch (error) {
      console.error('Failed to get system health:', error);
      return null;
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Auto-refresh system health
  useEffect(() => {
    getSystemHealth();

    // Refresh every 5 minutes
    const interval = setInterval(getSystemHealth, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [getSystemHealth]);

  return {
    // Event tracking
    trackEvent,
    trackMetric,
    trackInteraction,

    // Feedback
    submitFeedback,

    // System health
    systemHealth,
    healthLoading,
    getSystemHealth,
  };
}

export function useABTest(experimentName: string) {
  const [variant, setVariant] = useState<ABTestVariant>({
    variant: null,
    config: {},
    isControl: false,
  });
  const [loading, setLoading] = useState(true);

  // Get variant assignment
  useEffect(() => {
    const getVariant = async () => {
      try {
        const monitoring = getClientMonitoring();
        const result = await monitoring.getABTestVariant(experimentName);
        setVariant(result);
      } catch (error) {
        console.error('Failed to get A/B test variant:', error);
      } finally {
        setLoading(false);
      }
    };

    getVariant();
  }, [experimentName]);

  // Track A/B test events
  const trackEvent = useCallback(
    async (
      eventType: string,
      value?: number,
      metadata?: Record<string, unknown>
    ) => {
      try {
        const monitoring = getClientMonitoring();
        return await monitoring.trackABTestEvent(
          experimentName,
          eventType,
          value,
          metadata
        );
      } catch (error) {
        console.error('Failed to track A/B test event:', error);
        return false;
      }
    },
    [experimentName]
  );

  return {
    variant: variant.variant,
    config: variant.config,
    isControl: variant.isControl,
    loading,
    trackEvent,
  };
}

export function usePerformanceTracking() {
  const trackPageLoad = useCallback(() => {
    try {
      const monitoring = getClientMonitoring();
      monitoring.trackPageLoad();
    } catch (error) {
      console.warn('Failed to track page load:', error);
    }
  }, []);

  const trackComponentRender = useCallback(
    (componentName: string, renderTime: number) => {
      try {
        const monitoring = getClientMonitoring();
        monitoring.trackMetric('component_render', renderTime, {
          component: componentName,
        });
      } catch (error) {
        console.warn('Failed to track component render:', error);
      }
    },
    []
  );

  const trackUserAction = useCallback((action: string, startTime: number) => {
    const duration = Date.now() - startTime;
    try {
      const monitoring = getClientMonitoring();
      monitoring.trackInteraction(action, 'user_action', duration);
    } catch (error) {
      console.warn('Failed to track user action:', error);
    }
  }, []);

  return {
    trackPageLoad,
    trackComponentRender,
    trackUserAction,
  };
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const ComponentWithTracking: React.ComponentType<P> = (props: P) => {
    const { trackComponentRender } = usePerformanceTracking();

    useEffect(() => {
      const startTime = performance.now();

      return () => {
        const renderTime = performance.now() - startTime;
        trackComponentRender(
          componentName || WrappedComponent.name,
          renderTime
        );
      };
    }, [trackComponentRender]);

    return React.createElement(WrappedComponent, props);
  };

  ComponentWithTracking.displayName = `withPerformanceTracking(${componentName || WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithTracking;
}
