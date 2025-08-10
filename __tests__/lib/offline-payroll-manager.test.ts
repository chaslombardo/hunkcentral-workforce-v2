import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OfflinePayrollManager, offlinePayrollManager } from '@/lib/offlinePayrollManager';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

Object.defineProperty(console, 'log', { value: mockConsole.log });
Object.defineProperty(console, 'error', { value: mockConsole.error });
Object.defineProperty(console, 'warn', { value: mockConsole.warn });

describe('OfflinePayrollManager', () => {
  const testUserId = 'user-123';
  const testPayPeriodId = 'period-456';
  const testData = {
    totalPay: 1000,
    totalHours: 40,
    grossWages: 800,
    tips: 150,
    bonuses: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = OfflinePayrollManager.getInstance();
      const instance2 = OfflinePayrollManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(offlinePayrollManager);
    });
  });

  describe('cacheData', () => {
    it('should cache summary data correctly', async () => {
      await offlinePayrollManager.cacheData('summary', testData, testUserId, testPayPeriodId);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'payroll-cache-summary-user-123-period-456',
        expect.stringContaining('"data":')
      );

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'payroll-cache-last-sync-period-456',
        expect.any(String)
      );
    });

    it('should cache details data with tab name', async () => {
      await offlinePayrollManager.cacheData('details', testData, testUserId, testPayPeriodId, 'breakdown');

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'payroll-cache-details-user-123-period-456-breakdown',
        expect.stringContaining('"tabName":"breakdown"')
      );
    });

    it('should handle cache storage errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      // Should not throw error
      await expect(
        offlinePayrollManager.cacheData('summary', testData, testUserId, testPayPeriodId)
      ).resolves.toBeUndefined();

      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to cache payroll data:',
        expect.any(Error)
      );
    });

    it('should include correct metadata in cached data', async () => {
      const mockTimestamp = 1640995200000; // Fixed timestamp for testing
      vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      await offlinePayrollManager.cacheData('summary', testData, testUserId, testPayPeriodId);

      const cachedDataCall = mockLocalStorage.setItem.mock.calls.find(call => 
        call[0].includes('summary')
      );
      
      expect(cachedDataCall).toBeDefined();
      const cachedData = JSON.parse(cachedDataCall![1]);
      
      expect(cachedData).toMatchObject({
        data: testData,
        timestamp: mockTimestamp,
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      });
    });
  });

  describe('getCachedData', () => {
    it('should retrieve cached data correctly', async () => {
      const cachedData = {
        data: testData,
        timestamp: Date.now(),
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await offlinePayrollManager.getCachedData('summary', testUserId, testPayPeriodId);

      expect(result).toEqual(cachedData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(
        'payroll-cache-summary-user-123-period-456'
      );
    });

    it('should return null for non-existent cache', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await offlinePayrollManager.getCachedData('summary', testUserId, testPayPeriodId);

      expect(result).toBeNull();
    });

    it('should handle expired cache', async () => {
      const expiredData = {
        data: testData,
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));

      const result = await offlinePayrollManager.getCachedData('summary', testUserId, testPayPeriodId);

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'payroll-cache-summary-user-123-period-456'
      );
    });

    it('should handle version mismatch', async () => {
      const oldVersionData = {
        data: testData,
        timestamp: Date.now(),
        version: '0.9.0', // Old version
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldVersionData));

      const result = await offlinePayrollManager.getCachedData('summary', testUserId, testPayPeriodId);

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('should handle corrupted cache data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      const result = await offlinePayrollManager.getCachedData('summary', testUserId, testPayPeriodId);

      expect(result).toBeNull();
      expect(mockConsole.error).toHaveBeenCalledWith(
        'Failed to retrieve cached data:',
        expect.any(Error)
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('hasCachedData', () => {
    it('should return true for valid cached data', async () => {
      const cachedData = {
        data: testData,
        timestamp: Date.now(),
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await offlinePayrollManager.hasCachedData('summary', testUserId, testPayPeriodId);

      expect(result).toBe(true);
    });

    it('should return false for no cached data', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await offlinePayrollManager.hasCachedData('summary', testUserId, testPayPeriodId);

      expect(result).toBe(false);
    });

    it('should return false for expired cached data', async () => {
      const expiredData = {
        data: testData,
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));

      const result = await offlinePayrollManager.hasCachedData('summary', testUserId, testPayPeriodId);

      expect(result).toBe(false);
    });
  });

  describe('getCacheAge', () => {
    it('should return correct cache age in minutes', async () => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour ago
      const cachedData = {
        data: testData,
        timestamp: oneHourAgo,
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const age = await offlinePayrollManager.getCacheAge('summary', testUserId, testPayPeriodId);

      expect(age).toBe(60); // 60 minutes
    });

    it('should return 0 for non-existent cache', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const age = await offlinePayrollManager.getCacheAge('summary', testUserId, testPayPeriodId);

      expect(age).toBe(0);
    });
  });

  describe('clearPayPeriodCache', () => {
    it('should clear all cache for a pay period', async () => {
      const mockKeys = [
        'payroll-cache-summary-user-123-period-456',
        'payroll-cache-details-user-123-period-456-breakdown',
        'payroll-cache-details-user-123-period-456-tips',
        'other-cache-key',
        'payroll-cache-summary-user-123-period-789', // Different period
      ];

      Object.defineProperty(mockLocalStorage, 'length', { value: mockKeys.length });
      mockLocalStorage.key.mockImplementation((index) => mockKeys[index]);

      // Mock Object.keys to return our test keys
      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);

      await offlinePayrollManager.clearPayPeriodCache(testPayPeriodId);

      // Should remove keys that contain the pay period ID
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'payroll-cache-summary-user-123-period-456'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'payroll-cache-details-user-123-period-456-breakdown'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'payroll-cache-details-user-123-period-456-tips'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'payroll-cache-last-sync-period-456'
      );

      // Should not remove keys for other periods or non-payroll keys
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other-cache-key');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith(
        'payroll-cache-summary-user-123-period-789'
      );
    });
  });

  describe('clearAllCache', () => {
    it('should clear all payroll cache', async () => {
      const mockKeys = [
        'payroll-cache-summary-user-123-period-456',
        'payroll-cache-details-user-123-period-456-breakdown',
        'other-cache-key',
        'payroll-cache-last-sync-period-456',
      ];

      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);

      await offlinePayrollManager.clearAllCache();

      // Should remove all payroll cache keys
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'payroll-cache-summary-user-123-period-456'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'payroll-cache-details-user-123-period-456-breakdown'
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'payroll-cache-last-sync-period-456'
      );

      // Should not remove non-payroll keys
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('other-cache-key');
    });
  });

  describe('clearExpiredCache', () => {
    it('should clear only expired and corrupted cache entries', async () => {
      const validData = {
        data: testData,
        timestamp: Date.now(),
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      const expiredData = {
        data: testData,
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      const oldVersionData = {
        data: testData,
        timestamp: Date.now(),
        version: '0.9.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      const mockKeys = [
        'payroll-cache-valid',
        'payroll-cache-expired',
        'payroll-cache-old-version',
        'payroll-cache-corrupted',
        'payroll-cache-last-sync-period-456', // Should be ignored
      ];

      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);

      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'payroll-cache-valid':
            return JSON.stringify(validData);
          case 'payroll-cache-expired':
            return JSON.stringify(expiredData);
          case 'payroll-cache-old-version':
            return JSON.stringify(oldVersionData);
          case 'payroll-cache-corrupted':
            return 'invalid json';
          default:
            return null;
        }
      });

      await offlinePayrollManager.clearExpiredCache();

      // Should remove expired, old version, and corrupted entries
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('payroll-cache-expired');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('payroll-cache-old-version');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('payroll-cache-corrupted');

      // Should not remove valid entries or sync timestamps
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('payroll-cache-valid');
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalledWith('payroll-cache-last-sync-period-456');
    });
  });

  describe('getOfflineState', () => {
    it('should return correct offline state', async () => {
      const summaryData = {
        data: testData,
        timestamp: Date.now() - (30 * 60 * 1000), // 30 minutes ago
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      const syncTimestamp = (Date.now() - (15 * 60 * 1000)).toString(); // 15 minutes ago

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key.includes('summary')) {
          return JSON.stringify(summaryData);
        }
        if (key.includes('last-sync')) {
          return syncTimestamp;
        }
        return null;
      });

      const state = await offlinePayrollManager.getOfflineState(testUserId, testPayPeriodId, true);

      expect(state).toMatchObject({
        isOffline: true,
        hasCachedData: true,
        cacheAge: 30,
        lastSyncAt: new Date(parseInt(syncTimestamp)),
        cacheVersion: '1.0.0',
      });
    });

    it('should handle no cached data', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const state = await offlinePayrollManager.getOfflineState(testUserId, testPayPeriodId, false);

      expect(state).toMatchObject({
        isOffline: false,
        hasCachedData: false,
        cacheAge: 0,
        lastSyncAt: null,
        cacheVersion: '1.0.0',
      });
    });
  });

  describe('syncWhenOnline', () => {
    it('should sync successfully and cache fresh data', async () => {
      const freshData = { ...testData, totalPay: 1100 };
      const fetchFn = vi.fn().mockResolvedValue(freshData);

      const result = await offlinePayrollManager.syncWhenOnline(testUserId, testPayPeriodId, fetchFn);

      expect(result).toEqual({
        success: true,
        data: freshData,
      });

      expect(fetchFn).toHaveBeenCalled();
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'payroll-cache-summary-user-123-period-456',
        expect.stringContaining('"totalPay":1100')
      );
    });

    it('should return cached data on sync failure', async () => {
      const cachedData = {
        data: testData,
        timestamp: Date.now(),
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      };

      const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await offlinePayrollManager.syncWhenOnline(testUserId, testPayPeriodId, fetchFn);

      expect(result).toEqual({
        success: false,
        data: testData,
        error: 'Network error (using cached data)',
      });

      expect(fetchFn).toHaveBeenCalled();
    });

    it('should return error when sync fails and no cache available', async () => {
      const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await offlinePayrollManager.syncWhenOnline(testUserId, testPayPeriodId, fetchFn);

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      });
    });
  });

  describe('getCacheStats', () => {
    it('should return correct cache statistics', async () => {
      const oldTimestamp = Date.now() - (2 * 60 * 60 * 1000); // 2 hours ago
      const newTimestamp = Date.now() - (30 * 60 * 1000); // 30 minutes ago
      const expiredTimestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago

      const validData = JSON.stringify({
        data: testData,
        timestamp: newTimestamp,
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      });

      const oldData = JSON.stringify({
        data: testData,
        timestamp: oldTimestamp,
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'details',
      });

      const expiredData = JSON.stringify({
        data: testData,
        timestamp: expiredTimestamp,
        version: '1.0.0',
        payPeriodId: testPayPeriodId,
        userId: testUserId,
        type: 'summary',
      });

      const mockKeys = [
        'payroll-cache-valid',
        'payroll-cache-old',
        'payroll-cache-expired',
        'payroll-cache-corrupted',
        'payroll-cache-last-sync-period-456', // Should be ignored
      ];

      vi.spyOn(Object, 'keys').mockReturnValue(mockKeys);

      mockLocalStorage.getItem.mockImplementation((key) => {
        switch (key) {
          case 'payroll-cache-valid':
            return validData;
          case 'payroll-cache-old':
            return oldData;
          case 'payroll-cache-expired':
            return expiredData;
          case 'payroll-cache-corrupted':
            return 'invalid json';
          default:
            return null;
        }
      });

      const stats = await offlinePayrollManager.getCacheStats();

      expect(stats).toMatchObject({
        totalEntries: 4, // Excludes sync timestamp
        totalSize: validData.length + oldData.length + expiredData.length + 'invalid json'.length,
        oldestEntry: new Date(oldTimestamp),
        newestEntry: new Date(newTimestamp),
        expiredEntries: 2, // expired + corrupted
      });
    });

    it('should handle empty cache', async () => {
      vi.spyOn(Object, 'keys').mockReturnValue([]);

      const stats = await offlinePayrollManager.getCacheStats();

      expect(stats).toMatchObject({
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null,
        expiredEntries: 0,
      });
    });
  });
});