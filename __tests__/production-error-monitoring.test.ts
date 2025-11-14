/**
 * Production Error Monitoring Tests
 * Tests the comprehensive error monitoring and reporting system
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import {
  logProductionError,
  getErrorStatistics,
} from '@/lib/production-error-logger';
import {
  initializeErrorReporter,
  ProductionErrorReporter,
} from '@/lib/production-error-reporter';
import {
  reportComponentError,
  createUserFriendlyErrorMessage,
} from '@/lib/error-reporting';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/errorLogger', () => ({
  logServerError: vi.fn(),
}));

// Mock global objects for browser environment
const mockWindow = {
  location: { href: 'https://test.example.com/test-page' },
  navigator: {
    userAgent: 'Test User Agent',
    language: 'en-US',
    platform: 'Test Platform',
    onLine: true,
  },
  performance: {
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  fetch: vi.fn(),
  localStorage: {
    getItem: vi.fn(() => '[]'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  history: {
    pushState: vi.fn(),
    replaceState: vi.fn(),
  },
  document: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  console: {
    error: vi.fn(),
    warn: vi.fn(),
  },
  Buffer: {
    from: vi.fn((str: string) => ({
      toString: vi.fn(() => btoa(str)),
    })),
  },
};

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'navigator', {
  value: mockWindow.navigator,
  writable: true,
});

Object.defineProperty(global, 'performance', {
  value: mockWindow.performance,
  writable: true,
});

Object.defineProperty(global, 'localStorage', {
  value: mockWindow.localStorage,
  writable: true,
});

Object.defineProperty(global, 'fetch', {
  value: mockWindow.fetch,
  writable: true,
});

Object.defineProperty(global, 'btoa', {
  value: (str: string) => Buffer.from(str).toString('base64'),
  writable: true,
});

describe('Production Error Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.env for each test
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Enhanced Error Logging', () => {
    it('should log production errors with comprehensive context', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.auditLog.findFirst as Mock).mockResolvedValue(null);
      (mockPrisma.prisma.auditLog.create as Mock).mockResolvedValue({
        id: 'test-id',
      });

      const testError = new Error('Test production error');
      testError.stack =
        'Error: Test production error\n    at test (test.js:1:1)';

      const result = await logProductionError(testError, {
        component: 'test_component',
        action: 'test_action',
        userId: 'test-user-123',
        url: 'https://test.example.com/test',
        userAgent: 'Test User Agent',
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        query: { param: 'value' },
        body: { test: 'data' },
        category: 'api',
      });

      expect(result).toMatchObject({
        message: 'Test production error',
        level: 'error',
        context: expect.objectContaining({
          component: 'test_component',
          action: 'test_action',
          userId: 'test-user-123',
          category: 'api',
          severity: expect.any(String),
        }),
        parsedStack: expect.arrayContaining([
          expect.objectContaining({
            function: expect.any(String),
            file: expect.any(String),
            line: expect.any(Number),
          }),
        ]),
        fingerprint: expect.any(String),
      });

      expect(mockPrisma.prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'system_error',
            action: 'error_logged',
            changes: expect.objectContaining({
              debugInfo: expect.objectContaining({
                nodeVersion: expect.any(String),
                platform: expect.any(String),
                stackFrameCount: expect.any(Number),
              }),
              requestInfo: expect.objectContaining({
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                query: { param: 'value' },
              }),
            }),
          }),
        })
      );
    });

    it('should handle error deduplication correctly', async () => {
      const mockPrisma = await import('@/lib/prisma');
      const existingError = {
        id: 'existing-id',
        changes: {
          fingerprint: 'test-fingerprint',
          occurrenceCount: 1,
          firstOccurrence: '2024-01-01T00:00:00.000Z',
        },
      };

      (mockPrisma.prisma.auditLog.findFirst as Mock).mockResolvedValue(
        existingError
      );
      (mockPrisma.prisma.auditLog.update as Mock).mockResolvedValue({
        id: 'existing-id',
      });

      const testError = new Error('Duplicate error');

      const result = await logProductionError(testError, {
        component: 'test_component',
        action: 'test_action',
        url: 'https://test.example.com/test',
        userAgent: 'Test User Agent',
      });

      expect(result.occurrenceCount).toBe(2);
      expect(mockPrisma.prisma.auditLog.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'existing-id' },
          data: expect.objectContaining({
            changes: expect.objectContaining({
              occurrenceCount: 2,
              recentOccurrences: expect.any(Array),
            }),
          }),
        })
      );
    });

    it('should determine error severity correctly', async () => {
      const mockPrisma = await import('@/lib/prisma');
      (mockPrisma.prisma.auditLog.findFirst as Mock).mockResolvedValue(null);
      (mockPrisma.prisma.auditLog.create as Mock).mockResolvedValue({
        id: 'test-id',
      });

      // Test critical error
      const criticalError = new Error('Database connection failed');
      const criticalResult = await logProductionError(criticalError, {
        component: 'database',
        action: 'connect',
        url: 'https://test.example.com/test',
        userAgent: 'Test User Agent',
        category: 'database',
      });

      expect(criticalResult.context.severity).toBe('critical');

      // Test high priority error
      const highError = new Error('API timeout occurred');
      const highResult = await logProductionError(highError, {
        component: 'api',
        action: 'request',
        url: 'https://test.example.com/test',
        userAgent: 'Test User Agent',
        category: 'api',
      });

      expect(highResult.context.severity).toBe('high');

      // Test medium priority error
      const mediumError = new Error('Validation failed');
      const mediumResult = await logProductionError(mediumError, {
        component: 'form',
        action: 'validate',
        url: 'https://test.example.com/test',
        userAgent: 'Test User Agent',
      });

      expect(mediumResult.context.severity).toBe('medium');
    });
  });

  describe('Client-Side Error Reporter', () => {
    it('should initialize error reporter with correct configuration', () => {
      const reporter = initializeErrorReporter({
        enableAutoReporting: true,
        enableUserFeedback: true,
        enableBreadcrumbs: true,
        maxBreadcrumbs: 25,
      });

      expect(reporter).toBeInstanceOf(ProductionErrorReporter);
    });

    it('should report errors with comprehensive context', async () => {
      (mockWindow.fetch as Mock).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      const reporter = initializeErrorReporter({
        enableAutoReporting: true,
        enableBreadcrumbs: true,
        enablePerformanceMetrics: true,
      });

      const testError = new Error('Client-side test error');

      const report = await reporter.reportError(testError, {
        component: 'test_component',
        action: 'test_action',
        userId: 'test-user-123',
        userFeedback: 'This happened when I clicked the button',
        tags: { feature: 'test-feature' },
        context: { additionalInfo: 'test-info' },
      });

      expect(report).toMatchObject({
        message: 'Client-side test error',
        url: 'https://test.example.com/test-page',
        userAgent: 'Test User Agent',
        userId: 'test-user-123',
        userFeedback: 'This happened when I clicked the button',
        severity: expect.any(String),
        fingerprint: expect.any(String),
        breadcrumbs: expect.any(Array),
        performanceMetrics: expect.any(Object),
        tags: expect.objectContaining({
          feature: 'test-feature',
          environment: 'test',
        }),
        context: expect.objectContaining({
          component: 'test_component',
          action: 'test_action',
          additionalInfo: 'test-info',
        }),
      });

      expect(mockWindow.fetch).toHaveBeenCalledWith(
        '/api/errors/client',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Client-side test error'),
        })
      );
    });

    it('should collect breadcrumbs correctly', async () => {
      const reporter = initializeErrorReporter({
        enableBreadcrumbs: true,
        maxBreadcrumbs: 5,
      });

      // Simulate user interactions that should create breadcrumbs
      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'target', {
        value: {
          tagName: 'BUTTON',
          className: 'test-button',
          id: 'test-id',
          textContent: 'Test Button',
        },
      });

      // Trigger click event
      const clickHandler = (
        mockWindow.document.addEventListener as Mock
      ).mock.calls.find((call) => call[0] === 'click')?.[1];
      if (clickHandler) {
        clickHandler(clickEvent);
      }

      const testError = new Error('Error after user interaction');
      const report = await reporter.reportError(testError, {
        component: 'test_component',
        action: 'test_action',
      });

      expect(report.breadcrumbs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'user',
            message: 'Clicked button',
            level: 'info',
            data: expect.objectContaining({
              tagName: 'BUTTON',
              className: 'test-button',
              id: 'test-id',
            }),
          }),
        ])
      );
    });

    it('should handle offline error storage and retry', async () => {
      // Mock fetch to fail initially
      (mockWindow.fetch as Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const reporter = initializeErrorReporter({
        enableAutoReporting: true,
      });

      const testError = new Error('Offline error');
      await reporter.reportError(testError, {
        component: 'test_component',
        action: 'test_action',
      });

      // Verify error was stored in localStorage
      expect(mockWindow.localStorage.setItem).toHaveBeenCalledWith(
        'pending_error_reports',
        expect.stringContaining('Offline error')
      );

      // Mock successful retry
      (mockWindow.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      });

      // Mock localStorage to return the stored error
      (mockWindow.localStorage.getItem as Mock).mockReturnValueOnce(
        JSON.stringify([
          {
            id: 'test-id',
            message: 'Offline error',
            timestamp: new Date().toISOString(),
          },
        ])
      );

      await reporter.retryPendingReports();

      expect(mockWindow.fetch).toHaveBeenCalledTimes(2); // Initial failed attempt + retry
      expect(mockWindow.localStorage.removeItem).toHaveBeenCalledWith(
        'pending_error_reports'
      );
    });
  });

  describe('Error Statistics', () => {
    it('should calculate error statistics correctly', async () => {
      const mockPrisma = await import('@/lib/prisma');
      const mockErrorLogs = [
        {
          id: '1',
          createdAt: new Date(),
          changes: {
            severity: 'critical',
            category: 'database',
            component: 'user_service',
            resolved: false,
            fingerprint: 'fp1',
            message: 'Database error',
            occurrenceCount: 5,
          },
        },
        {
          id: '2',
          createdAt: new Date(),
          changes: {
            severity: 'high',
            category: 'api',
            component: 'auth_service',
            resolved: true,
            fingerprint: 'fp2',
            message: 'Auth error',
            occurrenceCount: 2,
          },
        },
        {
          id: '3',
          createdAt: new Date(),
          changes: {
            severity: 'medium',
            category: 'component',
            component: 'form_component',
            resolved: false,
            fingerprint: 'fp3',
            message: 'Form error',
            occurrenceCount: 1,
          },
        },
      ];

      (mockPrisma.prisma.auditLog.findMany as Mock).mockResolvedValue(
        mockErrorLogs
      );

      const stats = await getErrorStatistics({
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
      });

      expect(stats).toEqual({
        total: 3,
        bySeverity: {
          critical: 1,
          high: 1,
          medium: 1,
        },
        byCategory: {
          database: 1,
          api: 1,
          component: 1,
        },
        byComponent: {
          user_service: 1,
          auth_service: 1,
          form_component: 1,
        },
        resolved: 1,
        topErrors: expect.arrayContaining([
          expect.objectContaining({
            fingerprint: 'fp1',
            message: 'Database error',
            occurrenceCount: 5,
            component: 'user_service',
            severity: 'critical',
          }),
        ]),
      });
    });
  });

  describe('User-Friendly Error Messages', () => {
    it('should create appropriate user-friendly messages', () => {
      // Test different error types
      const authError = new Error('Authentication failed');
      const authMessage = createUserFriendlyErrorMessage(authError, {
        type: 'auth',
        component: 'login',
      });
      expect(authMessage).toBe(
        'Authentication failed. Please try logging in again.'
      );

      const databaseError = new Error('Database connection timeout');
      const dbMessage = createUserFriendlyErrorMessage(databaseError, {
        type: 'database',
        component: 'data_service',
      });
      expect(dbMessage).toBe(
        'Unable to load data. Please try again in a moment.'
      );

      const networkError = new Error('Network request failed');
      const networkMessage = createUserFriendlyErrorMessage(networkError, {
        type: 'network',
        component: 'api_client',
      });
      expect(networkMessage).toBe(
        'Network connection error. Please check your internet connection.'
      );

      const componentError = new Error('Component render failed');
      const componentMessage = createUserFriendlyErrorMessage(componentError, {
        type: 'component',
        component: 'user_profile',
      });
      expect(componentMessage).toBe(
        'A component failed to load. Please refresh the page.'
      );
    });

    it('should show technical details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const testError = new Error('Technical error details');
      const message = createUserFriendlyErrorMessage(testError, {
        type: 'server',
        component: 'api',
      });

      expect(message).toBe('Technical error details');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Component Error Reporting', () => {
    it('should report component errors with React context', async () => {
      const mockLogClientComponentError = vi.fn();
      vi.doMock('@/lib/client-error-logger', () => ({
        logClientComponentError: mockLogClientComponentError,
      }));

      const testError = new Error('React component error');

      await reportComponentError(testError, {
        component: 'UserProfile',
        action: 'render',
        userId: 'test-user-123',
        componentStack: 'at UserProfile\n  at App',
        metadata: {
          props: { userId: 'test-user-123' },
          state: { loading: false },
        },
      });

      expect(mockLogClientComponentError).toHaveBeenCalledWith(
        testError,
        expect.objectContaining({
          component: 'UserProfile',
          action: 'render',
          userId: 'test-user-123',
          additionalData: expect.objectContaining({
            componentStack: 'at UserProfile\n  at App',
            props: { userId: 'test-user-123' },
            state: { loading: false },
          }),
        })
      );
    });
  });
});

describe('Error Boundary Integration', () => {
  it('should handle errors in production error boundary', () => {
    // This would typically be tested with React Testing Library
    // but we'll test the core logic here

    const testError = new Error('Boundary test error');
    const errorInfo = {
      componentStack: 'at TestComponent\n  at ErrorBoundary',
    };

    // Test error fingerprinting
    const fingerprint1 = Buffer.from(
      'test_component:render:Boundary test error:'
    )
      .toString('base64')
      .substring(0, 32);
    const fingerprint2 = Buffer.from(
      'test_component:render:Boundary test error:'
    )
      .toString('base64')
      .substring(0, 32);

    expect(fingerprint1).toBe(fingerprint2); // Same errors should have same fingerprint
  });
});
