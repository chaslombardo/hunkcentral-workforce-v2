/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logClientError,
  logClientAuthError,
  logClientComponentError,
  logServiceWorkerError,
  logNetworkError,
  retryPendingErrors,
  setupErrorRetry,
  setupGlobalErrorHandling,
} from '@/lib/client-error-logger';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock console.error
const mockConsoleError = vi
  .spyOn(console, 'error')
  .mockImplementation(() => {});

describe('Client Error Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('[]');
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logClientError', () => {
    it('should send error to server in production', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

      const error = new Error('Test error');
      const context = {
        component: 'test-component',
        action: 'test-action',
        userId: 'user123',
      };

      await logClientError(error, context);

      expect(mockFetch).toHaveBeenCalledWith('/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"message":"Test error"'),
      });
    });

    it('should store error in localStorage when network fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const error = new Error('Test error');
      const context = {
        component: 'test-component',
        action: 'test-action',
      };

      await logClientError(error, context);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pending_errors',
        expect.stringContaining('"message":"Test error"')
      );
    });

    it('should include proper context in error log', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

      const error = new Error('Test error');
      const context = {
        component: 'test-component',
        action: 'test-action',
        userId: 'user123',
        additionalData: { key: 'value' },
      };

      await logClientError(error, context);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.level).toBe('error');
      expect(requestBody.message).toBe('Test error');
      expect(requestBody.context.component).toBe('test-component');
      expect(requestBody.context.action).toBe('test-action');
      expect(requestBody.context.userId).toBe('user123');
      expect(requestBody.context.additionalData).toEqual({ key: 'value' });
      expect(requestBody.context.url).toBe('http://localhost:3000/');
      expect(requestBody.context.userAgent).toBeDefined();
      expect(requestBody.context.timestamp).toBeDefined();
    });

    it('should log to console in development', async () => {
      process.env.NODE_ENV = 'development';
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

      const error = new Error('Test error');
      const context = {
        component: 'test-component',
        action: 'test-action',
      };

      await logClientError(error, context);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Client Error:',
        expect.objectContaining({
          message: 'Test error',
          component: 'test-component',
          action: 'test-action',
        })
      );
    });

    it('should handle non-Error objects', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

      const error = 'String error';
      const context = {
        component: 'test-component',
        action: 'test-action',
      };

      await logClientError(error, context);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.message).toBe('String error');
      expect(requestBody.context.stack).toBeUndefined();
    });

    it('should limit stored errors to 10', async () => {
      const existingErrors = Array(10)
        .fill(null)
        .map((_, i) => ({
          message: `Error ${i}`,
          context: { component: 'test', action: 'test' },
        }));

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingErrors));
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const error = new Error('New error');
      const context = {
        component: 'test-component',
        action: 'test-action',
      };

      await logClientError(error, context);

      const setItemCall = mockLocalStorage.setItem.mock.calls[0];
      const storedErrors = JSON.parse(setItemCall[1]);

      expect(storedErrors).toHaveLength(10);
      expect(storedErrors[9].message).toBe('New error');
      expect(storedErrors[0].message).toBe('Error 1'); // First error removed
    });
  });

  describe('specialized error loggers', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));
    });

    it('should log auth errors with proper component', async () => {
      const error = new Error('Auth error');
      const context = {
        action: 'login' as const,
        userId: 'user123',
      };

      await logClientAuthError(error, context);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.context.component).toBe('client_authentication');
      expect(requestBody.context.action).toBe('login');
    });

    it('should log component errors with proper prefix', async () => {
      const error = new Error('Component error');
      const context = {
        component: 'my-component',
        action: 'render',
        userId: 'user123',
      };

      await logClientComponentError(error, context);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.context.component).toBe('client_my-component');
    });

    it('should log service worker errors', async () => {
      const error = new Error('SW error');
      const context = {
        action: 'registration' as const,
        additionalData: { swVersion: '1.0' },
      };

      await logServiceWorkerError(error, context);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.context.component).toBe('service_worker');
      expect(requestBody.context.action).toBe('registration');
      expect(requestBody.context.additionalData.swVersion).toBe('1.0');
    });

    it('should log network errors with endpoint details', async () => {
      const error = new Error('Network error');
      const context = {
        endpoint: '/api/users',
        method: 'POST',
        status: 500,
        userId: 'user123',
      };

      await logNetworkError(error, context);

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.context.component).toBe('network');
      expect(requestBody.context.action).toBe('POST_/api/users');
      expect(requestBody.context.additionalData.endpoint).toBe('/api/users');
      expect(requestBody.context.additionalData.method).toBe('POST');
      expect(requestBody.context.additionalData.status).toBe(500);
    });
  });

  describe('retryPendingErrors', () => {
    it('should retry pending errors and clear storage on success', async () => {
      const pendingErrors = [
        { message: 'Error 1', context: { component: 'test', action: 'test' } },
        { message: 'Error 2', context: { component: 'test', action: 'test' } },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(pendingErrors));
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      await retryPendingErrors();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
        'pending_errors'
      );
    });

    it('should stop retrying on network failure', async () => {
      const pendingErrors = [
        { message: 'Error 1', context: { component: 'test', action: 'test' } },
        { message: 'Error 2', context: { component: 'test', action: 'test' } },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(pendingErrors));
      mockFetch.mockRejectedValue(new Error('Network error'));

      await retryPendingErrors();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });

    it('should handle empty pending errors', async () => {
      mockLocalStorage.getItem.mockReturnValue('[]');

      await retryPendingErrors();

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('setupErrorRetry', () => {
    it('should add event listeners for retry triggers', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      setupErrorRetry();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'load',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'online',
        expect.any(Function)
      );
    });
  });

  describe('setupGlobalErrorHandling', () => {
    it('should add global error handlers', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      setupGlobalErrorHandling();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );
    });

    it('should handle global errors', async () => {
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      setupGlobalErrorHandling();

      const errorHandler = vi
        .mocked(window.addEventListener)
        .mock.calls.find((call) => call[0] === 'error')?.[1] as EventListener;

      const errorEvent = new ErrorEvent('error', {
        error: new Error('Global error'),
        message: 'Global error',
        filename: 'test.js',
        lineno: 10,
        colno: 5,
      });

      errorHandler(errorEvent);

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"component":"global"'),
      });
    });

    it('should handle unhandled promise rejections', async () => {
      mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

      setupGlobalErrorHandling();

      const rejectionHandler = vi
        .mocked(window.addEventListener)
        .mock.calls.find(
          (call) => call[0] === 'unhandledrejection'
        )?.[1] as EventListener;

      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject(new Error('Promise rejection')),
        reason: new Error('Promise rejection'),
      });

      rejectionHandler(rejectionEvent);

      // Wait for async logging
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalledWith('/api/errors/client', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"action":"unhandled_promise_rejection"'),
      });
    });
  });
});
