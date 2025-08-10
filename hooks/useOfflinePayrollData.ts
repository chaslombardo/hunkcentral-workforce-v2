'use client';

import * as React from 'react';
import { useOfflineDetection } from './useOfflineDetection';

interface CachedPayrollData {
  summary?: any;
  details?: any;
  timestamp: number;
  payPeriodId: string;
}

interface OfflinePayrollState {
  isOffline: boolean;
  hasCachedData: boolean;
  cacheAge: number; // in minutes
  lastSyncAt: Date | null;
}

export function useOfflinePayrollData(payPeriodId: string) {
  const offlineState = useOfflineDetection();
  const [cachedData, setCachedData] = React.useState<CachedPayrollData | null>(null);
  const [lastSyncAt, setLastSyncAt] = React.useState<Date | null>(null);

  // Load cached data on mount
  React.useEffect(() => {
    const loadCachedData = () => {
      try {
        const summaryCache = localStorage.getItem(`payroll-summary-${payPeriodId}`);
        const detailsCache = localStorage.getItem(`payroll-details-${payPeriodId}-breakdown`);
        const syncTime = localStorage.getItem(`payroll-sync-${payPeriodId}`);

        if (summaryCache || detailsCache) {
          const cached: CachedPayrollData = {
            summary: summaryCache ? JSON.parse(summaryCache) : undefined,
            details: detailsCache ? JSON.parse(detailsCache) : undefined,
            timestamp: syncTime ? parseInt(syncTime) : Date.now(),
            payPeriodId,
          };
          setCachedData(cached);
          
          if (syncTime) {
            setLastSyncAt(new Date(parseInt(syncTime)));
          }
        }
      } catch (error) {
        // Failed to load cached payroll data
      }
    };

    loadCachedData();
  }, [payPeriodId]);

  // Cache data when online
  const cacheData = React.useCallback((type: 'summary' | 'details', data: any, tabName?: string) => {
    try {
      const key = type === 'summary' 
        ? `payroll-summary-${payPeriodId}`
        : `payroll-details-${payPeriodId}-${tabName || 'breakdown'}`;
      
      localStorage.setItem(key, JSON.stringify(data));
      localStorage.setItem(`payroll-sync-${payPeriodId}`, Date.now().toString());
      setLastSyncAt(new Date());

      // Update cached data state
      setCachedData(prev => ({
        ...prev,
        [type]: data,
        timestamp: Date.now(),
        payPeriodId,
      }));
    } catch (error) {
      // Failed to cache payroll data
    }
  }, [payPeriodId]);

  // Get cached data
  const getCachedData = React.useCallback((type: 'summary' | 'details', tabName?: string) => {
    try {
      const key = type === 'summary' 
        ? `payroll-summary-${payPeriodId}`
        : `payroll-details-${payPeriodId}-${tabName || 'breakdown'}`;
      
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      // Failed to get cached payroll data
      return null;
    }
  }, [payPeriodId]);

  // Clear cache
  const clearCache = React.useCallback(() => {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(`payroll-summary-${payPeriodId}`) ||
        key.startsWith(`payroll-details-${payPeriodId}`) ||
        key.startsWith(`payroll-sync-${payPeriodId}`)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      setCachedData(null);
      setLastSyncAt(null);
    } catch (error) {
      // Failed to clear cached payroll data
    }
  }, [payPeriodId]);

  // Calculate cache age in minutes
  const cacheAge = React.useMemo(() => {
    if (!cachedData) return 0;
    return Math.floor((Date.now() - cachedData.timestamp) / (1000 * 60));
  }, [cachedData]);

  // Determine if cache is stale (older than 1 hour)
  const isCacheStale = cacheAge > 60;

  const state: OfflinePayrollState = {
    isOffline: offlineState.isOffline,
    hasCachedData: !!cachedData,
    cacheAge,
    lastSyncAt,
  };

  return {
    state,
    actions: {
      cacheData,
      getCachedData,
      clearCache,
    },
    utils: {
      isCacheStale,
      canUseCache: offlineState.isOffline || isCacheStale,
    },
  };
}

// Hook for managing offline-first data loading
export function useOfflineFirstData<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isFromCache, setIsFromCache] = React.useState(false);
  const offlineState = useOfflineDetection();

  const loadData = React.useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try cache first if offline or not forcing refresh
      if ((offlineState.isOffline || !forceRefresh)) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          setData(parsedCache);
          setIsFromCache(true);
          
          if (offlineState.isOffline) {
            setIsLoading(false);
            return parsedCache;
          }
        }
      }

      // Try to fetch fresh data if online
      if (!offlineState.isOffline) {
        const freshData = await fetchFn();
        setData(freshData);
        setIsFromCache(false);
        
        // Cache the fresh data
        localStorage.setItem(cacheKey, JSON.stringify(freshData));
        setIsLoading(false);
        return freshData;
      }

      setIsLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      
      // Try to use cached data as fallback
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        setData(parsedCache);
        setIsFromCache(true);
        setError(`${errorMessage} (showing cached data)`);
      } else {
        setError(errorMessage);
      }
      
      setIsLoading(false);
      return null;
    }
  }, [fetchFn, cacheKey, offlineState.isOffline, ...dependencies]);

  // Load data on mount and dependency changes
  React.useEffect(() => {
    loadData();
  }, dependencies);

  const retry = React.useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    isFromCache,
    retry,
    refresh: () => loadData(true),
  };
}