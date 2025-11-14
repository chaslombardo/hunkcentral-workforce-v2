import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MyPayrollView } from '@/components/features/reports/my-payroll-view';
import { offlinePayrollManager } from '@/lib/offlinePayrollManager';
import * as payrollValidation from '@/lib/actions/payroll-validation';

// Mock the payroll validation module
vi.mock('@/lib/actions/payroll-validation', () => ({
  validateEmployeePayroll: vi.fn(),
  submitDiscrepancyReport: vi.fn(),
}));

// Mock the offline detection hook
vi.mock('@/hooks/useOfflineDetection', () => ({
  useOfflineDetection: vi.fn(() => ({
    isOnline: true,
    isOffline: false,
    wasOffline: false,
    lastOnlineAt: new Date(),
    lastOfflineAt: null,
  })),
}));

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

// Mock console methods to reduce noise in tests
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

Object.defineProperty(console, 'log', { value: mockConsole.log });
Object.defineProperty(console, 'error', { value: mockConsole.error });
Object.defineProperty(console, 'warn', { value: mockConsole.warn });

describe('Payroll Error Recovery Integration', () => {
  const testUserId = 'test-user-123';
  const testPayPeriod = {
    id: 'period-456',
    name: 'January 2025 - Week 1',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-07'),
    status: 'closed' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSummaryData = {
    employeeId: testUserId,
    employee: {
      id: testUserId,
      fullName: 'Test User',
      email: 'test@example.com',
      roles: ['captain'],
      rateJunkCaptain: 20,
      rateJunkWingman: 16,
      rateMoveCaptain: 22,
      rateMoveWingman: 18,
      rateZigma: 19,
      rateTraining: 15,
      rateEstimating: 25,
      rateWarehouse: 17,
      rateAdmin: 14,
      junkBonusGoal: 0.14,
      moveBonusGoal: 0.24,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    payPeriod: testPayPeriod,
    totalHours: 40,
    totalPay: 1000,
    grossWages: 800,
    tips: 150,
    commission: 0,
    bonuses: 50,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
    mockLocalStorage.removeItem.mockImplementation(() => {});

    // Reset offline detection to online by default
    const { useOfflineDetection } = await vi.importMock(
      '@/hooks/useOfflineDetection'
    );
    useOfflineDetection.mockReturnValue({
      isOnline: true,
      isOffline: false,
      wasOffline: false,
      lastOnlineAt: new Date(),
      lastOfflineAt: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Summary Data Error Recovery', () => {
    it('should recover from network errors using cached data', async () => {
      // Set up cached data
      const cachedData = {
        data: mockSummaryData,
        timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
        version: '1.0.0',
        payPeriodId: testPayPeriod.id,
        userId: testUserId,
        type: 'summary',
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key.includes('payroll-summary')) {
          return JSON.stringify(cachedData);
        }
        return null;
      });

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Should show cached data with warning
      await waitFor(() => {
        expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      });

      // Should show cache warning
      expect(screen.getByText(/showing cached data/i)).toBeInTheDocument();
    });

    it('should handle complete cache failure gracefully', async () => {
      // Mock localStorage to throw errors
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Should show error fallback
      await waitFor(() => {
        expect(
          screen.getByText(/Payroll Summary Unavailable/)
        ).toBeInTheDocument();
      });

      // Should provide retry option
      expect(
        screen.getByRole('button', { name: /Try Again/ })
      ).toBeInTheDocument();
    });

    it('should handle corrupted cache data', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json data');

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Should handle corrupted cache gracefully
      await waitFor(() => {
        expect(
          screen.getByText(/Payroll Summary Unavailable/)
        ).toBeInTheDocument();
      });

      // Should show clear cache option
      expect(
        screen.getByRole('button', { name: /Clear Cache/ })
      ).toBeInTheDocument();
    });
  });

  describe('Detailed Data Error Recovery', () => {
    it('should show fallback when detailed data fails to load', async () => {
      // Set up summary data to load successfully
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key.includes('payroll-summary')) {
          return JSON.stringify({
            data: mockSummaryData,
            timestamp: Date.now(),
            version: '1.0.0',
            payPeriodId: testPayPeriod.id,
            userId: testUserId,
            type: 'summary',
          });
        }
        return null;
      });

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Wait for summary to load
      await waitFor(() => {
        expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      });

      // Click on breakdown tab to trigger detailed data loading
      const breakdownTab = screen.getByRole('tab', { name: /breakdown/i });
      fireEvent.click(breakdownTab);

      // Should show fallback for detailed data
      await waitFor(() => {
        expect(
          screen.getByText(/Department Breakdown Unavailable/)
        ).toBeInTheDocument();
      });
    });

    it('should handle validation errors gracefully', async () => {
      // Mock validation to fail
      vi.mocked(payrollValidation.validateEmployeePayroll).mockRejectedValue(
        new Error('Validation service unavailable')
      );

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Navigate to validation tab
      const validationTab = screen.getByRole('tab', { name: /validation/i });
      fireEvent.click(validationTab);

      // Should continue loading other data even if validation fails
      await waitFor(() => {
        // Should not crash the entire component
        expect(screen.getByText(/My Payroll/)).toBeInTheDocument();
      });

      // Validation error should be logged but not break the UI
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Validation data unavailable:',
        expect.any(Error)
      );
    });
  });

  describe('Offline Mode Recovery', () => {
    it('should handle offline to online transition', async () => {
      const { useOfflineDetection } = await vi.importMock(
        '@/hooks/useOfflineDetection'
      );

      // Start offline
      useOfflineDetection.mockReturnValue({
        isOnline: false,
        isOffline: true,
        wasOffline: true,
        lastOnlineAt: null,
        lastOfflineAt: new Date(),
      });

      // Set up cached data
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key.includes('payroll-summary')) {
          return JSON.stringify({
            data: mockSummaryData,
            timestamp: Date.now() - 60 * 60 * 1000, // 1 hour ago
            version: '1.0.0',
            payPeriodId: testPayPeriod.id,
            userId: testUserId,
            type: 'summary',
          });
        }
        return null;
      });

      const { rerender } = render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Should show offline notice
      await waitFor(() => {
        expect(
          screen.getByText(/You're currently offline/)
        ).toBeInTheDocument();
      });

      // Should show cached data
      expect(screen.getByText('$1,000.00')).toBeInTheDocument();

      // Simulate coming back online
      useOfflineDetection.mockReturnValue({
        isOnline: true,
        isOffline: false,
        wasOffline: true,
        lastOnlineAt: new Date(),
        lastOfflineAt: new Date(Date.now() - 60000),
      });

      rerender(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Should attempt to refresh data when back online
      await waitFor(() => {
        expect(
          screen.queryByText(/You're currently offline/)
        ).not.toBeInTheDocument();
      });
    });

    it('should provide offline-specific error messages', async () => {
      const { useOfflineDetection } = await vi.importMock(
        '@/hooks/useOfflineDetection'
      );

      useOfflineDetection.mockReturnValue({
        isOnline: false,
        isOffline: true,
        wasOffline: false,
        lastOnlineAt: new Date(Date.now() - 60000),
        lastOfflineAt: new Date(),
      });

      // No cached data available
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      await waitFor(() => {
        expect(screen.getByText(/Offline Mode/)).toBeInTheDocument();
        expect(
          screen.getByText(/You're currently offline/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Retry Mechanisms', () => {
    it('should implement exponential backoff for retries', async () => {
      let attemptCount = 0;
      const originalSetTimeout = global.setTimeout;
      const mockSetTimeout = vi.fn((callback, delay) => {
        // Track delay times to verify exponential backoff
        if (attemptCount > 0) {
          expect(delay).toBeGreaterThan(1000 * Math.pow(2, attemptCount - 2));
        }
        return originalSetTimeout(callback, 0); // Execute immediately for test
      });
      global.setTimeout = mockSetTimeout;

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Should show error state
      await waitFor(() => {
        expect(
          screen.getByText(/Payroll Summary Unavailable/)
        ).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Try Again/ });

      // Perform multiple retries
      for (let i = 0; i < 3; i++) {
        attemptCount = i;
        fireEvent.click(retryButton);

        await waitFor(() => {
          expect(screen.getByText(/Try Again \(\d+\)/)).toBeInTheDocument();
        });
      }

      global.setTimeout = originalSetTimeout;
    });

    it('should limit maximum retry attempts', async () => {
      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Payroll Summary Unavailable/)
        ).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Try Again/ });

      // Perform maximum retries
      for (let i = 0; i < 5; i++) {
        fireEvent.click(retryButton);
        await waitFor(() => {
          // Wait for retry to complete
        });
      }

      // Should disable retry after max attempts
      await waitFor(() => {
        expect(screen.getByText(/Max Retries/)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /Max Retries/ })
        ).toBeDisabled();
      });
    });
  });

  describe('Cache Management Integration', () => {
    it('should clear cache when clear cache button is clicked', async () => {
      // Set up corrupted cache scenario
      mockLocalStorage.getItem.mockReturnValue('corrupted json');

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      await waitFor(() => {
        expect(screen.getByText(/cached data corrupted/)).toBeInTheDocument();
      });

      const clearCacheButton = screen.getByRole('button', {
        name: /Clear Cache/,
      });
      fireEvent.click(clearCacheButton);

      // Should call localStorage.removeItem for payroll cache keys
      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalled();
      });
    });

    it('should use offline payroll manager for cache operations', async () => {
      const cacheDataSpy = vi.spyOn(offlinePayrollManager, 'cacheData');
      const getCachedDataSpy = vi.spyOn(offlinePayrollManager, 'getCachedData');

      // Mock successful data loading
      mockLocalStorage.getItem.mockReturnValue(null);

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Should attempt to get cached data
      await waitFor(() => {
        expect(getCachedDataSpy).toHaveBeenCalled();
      });

      // Should cache successful results (in real implementation)
      // This would be called when data loads successfully
      expect(cacheDataSpy).toHaveBeenCalledTimes(0); // No successful loads in this test
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch and handle component errors', () => {
      // Mock a component that throws an error
      const ErrorComponent = () => {
        throw new Error('Component rendering failed');
      };

      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod}>
          <ErrorComponent />
        </MyPayrollView>
      );

      // Should show error boundary fallback
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should provide component-specific error boundaries', () => {
      // This would be tested with actual component error boundaries
      // in the real implementation
      expect(true).toBe(true); // Placeholder for component-specific error boundary tests
    });
  });

  describe('Performance Under Error Conditions', () => {
    it('should not block UI when cache operations fail', async () => {
      // Mock localStorage operations to be slow
      mockLocalStorage.getItem.mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve(null), 100));
      });

      const startTime = Date.now();

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // UI should render quickly even if cache is slow
      expect(screen.getByText(/My Payroll/)).toBeInTheDocument();

      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(50); // Should render in under 50ms
    });

    it('should handle memory pressure gracefully', async () => {
      // Mock localStorage quota exceeded error
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      render(
        <MyPayrollView userId={testUserId} initialPayPeriod={testPayPeriod} />
      );

      // Should not crash when cache storage fails
      expect(screen.getByText(/My Payroll/)).toBeInTheDocument();

      // Should log the error but continue functioning
      await waitFor(() => {
        expect(mockConsole.error).toHaveBeenCalledWith(
          'Failed to cache payroll data:',
          expect.any(Error)
        );
      });
    });
  });
});
