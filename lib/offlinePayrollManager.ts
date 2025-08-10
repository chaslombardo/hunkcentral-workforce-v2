'use client';

/**
 * Offline Payroll Data Manager
 * 
 * Handles caching, retrieval, and synchronization of payroll data
 * for offline capability and improved error recovery.
 */

export interface CachedPayrollData {
  data: unknown;
  timestamp: number;
  version: string;
  payPeriodId: string;
  userId: string;
  type: 'summary' | 'details';
  tabName?: string;
}

export interface OfflinePayrollState {
  isOffline: boolean;
  hasCachedData: boolean;
  cacheAge: number; // in minutes
  lastSyncAt: Date | null;
  cacheVersion: string;
}

export class OfflinePayrollManager {
  private static instance: OfflinePayrollManager;
  private readonly CACHE_VERSION = '1.0.0';
  private readonly MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours in ms
  private readonly CACHE_PREFIX = 'payroll-cache-';

  private constructor() {}

  static getInstance(): OfflinePayrollManager {
    if (!OfflinePayrollManager.instance) {
      OfflinePayrollManager.instance = new OfflinePayrollManager();
    }
    return OfflinePayrollManager.instance;
  }

  /**
   * Cache payroll data with metadata
   */
  async cacheData(
    type: 'summary' | 'details',
    data: unknown,
    userId: string,
    payPeriodId: string,
    tabName?: string
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(type, userId, payPeriodId, tabName);
      const cachedData: CachedPayrollData = {
        data,
        timestamp: Date.now(),
        version: this.CACHE_VERSION,
        payPeriodId,
        userId,
        type,
        tabName,
      };

      localStorage.setItem(cacheKey, JSON.stringify(cachedData));
      
      // Update sync timestamp
      localStorage.setItem(`${this.CACHE_PREFIX}last-sync-${payPeriodId}`, Date.now().toString());
      
      // Cached data successfully
    } catch (error) {
      // Failed to cache payroll data
      console.error('Failed to cache payroll data:', error);
      // If localStorage is full, try to clear old cache
      this.clearExpiredCache();
    }
  }

  /**
   * Retrieve cached payroll data
   */
  async getCachedData(
    type: 'summary' | 'details',
    userId: string,
    payPeriodId: string,
    tabName?: string
  ): Promise<CachedPayrollData | null> {
    try {
      const cacheKey = this.getCacheKey(type, userId, payPeriodId, tabName);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const parsedCache: CachedPayrollData = JSON.parse(cached);
      
      // Check if cache is expired
      if (this.isCacheExpired(parsedCache)) {
        // Cache expired, removing
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Check version compatibility
      if (parsedCache.version !== this.CACHE_VERSION) {
        // Cache version mismatch, removing
        localStorage.removeItem(cacheKey);
        return null;
      }

      return parsedCache;
    } catch (error) {
      // Failed to retrieve cached data
      console.error('Failed to retrieve cached data:', error);
      // If parsing fails, remove corrupted cache
      const cacheKey = this.getCacheKey(type, userId, payPeriodId, tabName);
      localStorage.removeItem(cacheKey);
      return null;
    }
  }

  /**
   * Check if cached data exists and is valid
   */
  async hasCachedData(
    type: 'summary' | 'details',
    userId: string,
    payPeriodId: string,
    tabName?: string
  ): Promise<boolean> {
    const cached = await this.getCachedData(type, userId, payPeriodId, tabName);
    return cached !== null;
  }

  /**
   * Get cache age in minutes
   */
  async getCacheAge(
    type: 'summary' | 'details',
    userId: string,
    payPeriodId: string,
    tabName?: string
  ): Promise<number> {
    const cached = await this.getCachedData(type, userId, payPeriodId, tabName);
    if (!cached) return 0;
    
    return Math.floor((Date.now() - cached.timestamp) / (1000 * 60));
  }

  /**
   * Clear all cached data for a specific pay period
   */
  async clearPayPeriodCache(payPeriodId: string): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_PREFIX) && key.includes(payPeriodId)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem(`${this.CACHE_PREFIX}last-sync-${payPeriodId}`);
      
      // Cleared cache for pay period
    } catch (error) {
      // Failed to clear pay period cache
      console.error('Failed to clear pay period cache:', error);
    }
  }

  /**
   * Clear all cached payroll data
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_PREFIX)
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      
      // Cleared all payroll cache
    } catch (error) {
      // Failed to clear all cache
      console.error('Failed to clear all cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.CACHE_PREFIX) && !key.includes('last-sync')
      );
      
      let clearedCount = 0;
      
      for (const key of keys) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsedCache: CachedPayrollData = JSON.parse(cached);
            if (this.isCacheExpired(parsedCache) || parsedCache.version !== this.CACHE_VERSION) {
              localStorage.removeItem(key);
              clearedCount++;
            }
          }
        } catch {
          // Remove corrupted cache entries
          localStorage.removeItem(key);
          clearedCount++;
        }
      }
      
      if (clearedCount > 0) {
        // Cleared expired/corrupted cache entries
      }
    } catch (error) {
      // Failed to clear expired cache
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Get offline state for a specific pay period
   */
  async getOfflineState(
    userId: string,
    payPeriodId: string,
    isOffline: boolean
  ): Promise<OfflinePayrollState> {
    const hasSummaryCache = await this.hasCachedData('summary', userId, payPeriodId);
    const hasDetailsCache = await this.hasCachedData('details', userId, payPeriodId);
    const cacheAge = Math.max(
      await this.getCacheAge('summary', userId, payPeriodId),
      await this.getCacheAge('details', userId, payPeriodId)
    );
    
    const lastSyncTimestamp = localStorage.getItem(`${this.CACHE_PREFIX}last-sync-${payPeriodId}`);
    const lastSyncAt = lastSyncTimestamp ? new Date(parseInt(lastSyncTimestamp)) : null;

    return {
      isOffline,
      hasCachedData: hasSummaryCache || hasDetailsCache,
      cacheAge,
      lastSyncAt,
      cacheVersion: this.CACHE_VERSION,
    };
  }

  /**
   * Attempt to sync cached data when coming back online
   */
  async syncWhenOnline(
    userId: string,
    payPeriodId: string,
    fetchFn: () => Promise<unknown>
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      // Attempting to sync data
      
      const freshData = await fetchFn();
      
      // Cache the fresh data
      await this.cacheData('summary', freshData, userId, payPeriodId);
      
      return { success: true, data: freshData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      // Sync failed
      
      // Try to return cached data as fallback
      const cached = await this.getCachedData('summary', userId, payPeriodId);
      if (cached) {
        return { 
          success: false, 
          data: cached.data, 
          error: `${errorMessage} (using cached data)` 
        };
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get cache statistics for debugging
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    expiredEntries: number;
  }> {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.CACHE_PREFIX) && !key.includes('last-sync')
    );
    
    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let expiredCount = 0;
    
    for (const key of keys) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          totalSize += cached.length;
          const parsedCache: CachedPayrollData = JSON.parse(cached);
          
          if (parsedCache.timestamp < oldestTimestamp) {
            oldestTimestamp = parsedCache.timestamp;
          }
          if (parsedCache.timestamp > newestTimestamp) {
            newestTimestamp = parsedCache.timestamp;
          }
          
          if (this.isCacheExpired(parsedCache)) {
            expiredCount++;
          }
        }
      } catch {
        // Count corrupted entries as expired
        expiredCount++;
      }
    }
    
    return {
      totalEntries: keys.length,
      totalSize,
      oldestEntry: oldestTimestamp === Infinity ? null : new Date(oldestTimestamp),
      newestEntry: newestTimestamp === 0 ? null : new Date(newestTimestamp),
      expiredEntries: expiredCount,
    };
  }

  private getCacheKey(
    type: 'summary' | 'details',
    userId: string,
    payPeriodId: string,
    tabName?: string
  ): string {
    const base = `${this.CACHE_PREFIX}${type}-${userId}-${payPeriodId}`;
    return tabName ? `${base}-${tabName}` : base;
  }

  private isCacheExpired(cached: CachedPayrollData): boolean {
    return (Date.now() - cached.timestamp) > this.MAX_CACHE_AGE;
  }
}

// Export singleton instance
export const offlinePayrollManager = OfflinePayrollManager.getInstance();

// Hook for using offline payroll manager in React components
import * as React from 'react';

export function useOfflinePayrollManager() {
  return React.useMemo(() => offlinePayrollManager, []);
}