'use client';

import * as React from 'react';
import { useIsMobile } from './use-mobile';
import { usePerformance } from './usePerformance';
import { useMobileOptimizedLoading } from './useMobileOptimizedLoading';

interface PayrollLoadingOptions {
  enableProgressiveLoading?: boolean;
  prioritizeVisible?: boolean;
  cacheStrategy?: 'aggressive' | 'normal' | 'minimal';
}

export function useMobilePayrollLoading<T>(
  loadingFunction: () => Promise<T>,
  dependencies: React.DependencyList,
  options: PayrollLoadingOptions = {}
) {
  const isMobile = useIsMobile();
  const { isSlowConnection, measureApiCall } = usePerformance();
  const {
    enableProgressiveLoading = true,
    prioritizeVisible = true,
    cacheStrategy = 'normal'
  } = options;

  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [loadingStage, setLoadingStage] = React.useState<string>('');

  // Cache for loaded data
  const cacheRef = React.useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  
  // Generate cache key from dependencies
  const cacheKey = React.useMemo(() => 
    JSON.stringify(dependencies), 
    dependencies
  );

  // Determine cache TTL based on strategy and connection
  const getCacheTTL = () => {
    const baseTTL = {
      aggressive: 30 * 60 * 1000, // 30 minutes
      normal: 10 * 60 * 1000,     // 10 minutes
      minimal: 2 * 60 * 1000      // 2 minutes
    }[cacheStrategy];

    // Extend cache time on slow connections
    return isSlowConnection ? baseTTL * 2 : baseTTL;
  };

  const loadData = React.useCallback(async () => {
    // Check cache first
    const cached = cacheRef.current.get(cacheKey);
    const now = Date.now();
    const cacheTTL = getCacheTTL();

    if (cached && (now - cached.timestamp) < cacheTTL) {
      setData(cached.data);
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    const measureApi = measureApiCall('payroll-data-load');

    try {
      // Progressive loading stages for mobile
      if (enableProgressiveLoading && isMobile) {
        setLoadingStage('Connecting...');
        setProgress(10);
        
        // Small delay to show initial loading state
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setLoadingStage('Loading data...');
        setProgress(30);
      }

      const result = await loadingFunction();
      
      if (enableProgressiveLoading && isMobile) {
        setLoadingStage('Processing...');
        setProgress(80);
        
        // Small delay to show processing state
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Cache the result
      cacheRef.current.set(cacheKey, {
        data: result,
        timestamp: now
      });

      // Clean up old cache entries (keep last 10)
      if (cacheRef.current.size > 10) {
        const entries = Array.from(cacheRef.current.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        cacheRef.current.clear();
        entries.slice(0, 10).forEach(([key, value]) => {
          cacheRef.current.set(key, value);
        });
      }

      setData(result);
      setProgress(100);
      setLoadingStage('Complete');
      
      measureApi(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      measureApi(false);
      
      // On mobile with slow connection, try to use stale cache
      if (isMobile && isSlowConnection && cached) {
        setData(cached.data);
        setError(`Using cached data: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
      // Reset progress after a delay
      setTimeout(() => {
        setProgress(0);
        setLoadingStage('');
      }, 500);
    }
  }, [loadingFunction, cacheKey, enableProgressiveLoading, isMobile, isSlowConnection, measureApiCall, getCacheTTL]);

  React.useEffect(() => {
    loadData();
  }, dependencies);

  // Preload data when component becomes visible (mobile optimization)
  const intersectionRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (!prioritizeVisible || !isMobile || !intersectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !data && !isLoading) {
            loadData();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    observer.observe(intersectionRef.current);

    return () => observer.disconnect();
  }, [prioritizeVisible, isMobile, data, isLoading, loadData]);

  return {
    data,
    isLoading,
    error,
    progress,
    loadingStage,
    reload: loadData,
    intersectionRef,
    isMobile,
    isSlowConnection,
    // Helper to clear cache
    clearCache: () => cacheRef.current.clear(),
    // Helper to get cache info
    getCacheInfo: () => ({
      size: cacheRef.current.size,
      keys: Array.from(cacheRef.current.keys()),
    }),
  };
}

// Specialized hook for payroll summary data
export function useMobilePayrollSummary(
  userId: string,
  payPeriodId: string
) {
  return useMobilePayrollLoading(
    async () => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        totalPay: 955,
        totalHours: 40,
        tips: 150,
        bonuses: 85,
      };
    },
    [userId, payPeriodId],
    {
      cacheStrategy: 'aggressive', // Summary data changes less frequently
      prioritizeVisible: true,
    }
  );
}

// Specialized hook for detailed payroll breakdown
export function useMobilePayrollDetails(
  userId: string,
  payPeriodId: string,
  activeTab: string
) {
  return useMobilePayrollLoading(
    async () => {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        departmentBreakdown: [],
        dailyWorkHistory: [],
        tipsDetails: [],
        workPatternStats: {},
      };
    },
    [userId, payPeriodId, activeTab],
    {
      cacheStrategy: 'normal',
      prioritizeVisible: true,
      enableProgressiveLoading: true,
    }
  );
}