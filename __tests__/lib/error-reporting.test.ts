import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createErrorReport,
  reportServerError,
  reportClientError,
  reportDatabaseError,
  reportAuthError,
  reportComponentError,
  createUserFriendlyErrorMessage,
  extractErrorDebugInfo,
  createErrorContext,
  withErrorReporting,
} from '@/lib/error-reporting';

// Mock the logger modules
vi.mock('@/lib/errorLogger', () => ({
  logServerError: vi.fn(),
  logAuthError: vi.fn(),
  logDatabaseError: vi.fn(),
  logPageError: vi.fn(),
}));

vi.mock('@/lib/client-error-logger', () => ({
  logClientError: vi.fn(),
  logClientAuthError: vi.fn(),
  logClientComponentError: vi.fn(),
}));

describe('Error Reporting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createErrorReport', () => {
    it('should create a comprehensive error report', () => {
      const error = new Error('Test error');
      const context = {
        type: 'server' as const,
        component: 'test-component',
        action: 'test-action',
        userId: 'user123',
        url: 'https://example.com',
        userAgent: 'test-agent',
        metadata: { key: 'value' },
      };

      const report = createErrorReport(error, context);

      expect(report).toMatchObject({
        level: expect.any(String),
        type: 'server',
        message: 'Test error',
        stack: expect.any(String),
        context: {
          component: 'test-component',
          action: 'test-action',
          userId: 'user123',
          url: 'https://example.com',
          userAgent: 'test-agent',
          environment: expect.any(String),
          metadata: { key: 'value' },
        },
        resolved: false,
      });

      expect(report.id).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(report.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const context = {
        type: 'client' as const,
        component: 'test-component',
        action: 'test-action',
        url: 'https://example.com',
      };

      const report = createErrorReport(error, context);

      expect(report.message).toBe('String error');
      expect(report.stack).toBeUndefined();
    });

    it('should determine error levels correctly', () => {
      const criticalError = new Error('database connection failed');
      const highError = new Error('server error occurred');
      const mediumError = new Error('validation error');
      const lowError = new Error('minor issue');

      const criticalReport = createErrorReport(criticalError, {
        type: 'database',
        component: 'db',
        action: 'connect',
        url: 'test',
      });

      const highReport = createErrorReport(highError, {
        type: 'server',
        component: 'api',
        action: 'request',
        url: 'test',
      });

      const mediumReport = createErrorReport(mediumError, {
        type: 'component',
        component: 'form',
        action: 'validate',
        url: 'test',
      });

      const lowReport = createErrorReport(lowError, {
        type: 'client',
        component: 'ui',
        action: 'render',
        url: 'test',
      });

      expect(criticalReport.level).toBe('critical');
      expect(highReport.level).toBe('high');
      expect(mediumReport.level).toBe('medium');
      expect(lowReport.level).toBe('low');
    });
  });

  describe('createUserFriendlyErrorMessage', () => {
    it('should return development error messages in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Detailed error message');
      const message = createUserFriendlyErrorMessage(error, {
        type: 'server',
        component: 'api',
      });

      expect(message).toBe('Detailed error message');

      process.env.NODE_ENV = originalEnv;
    });

    it('should return user-friendly messages in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const authError = new Error('JWT token invalid');
      const dbError = new Error('Connection timeout');
      const networkError = new Error('Fetch failed');

      const authMessage = createUserFriendlyErrorMessage(authError, {
        type: 'auth',
        component: 'auth',
      });

      const dbMessage = createUserFriendlyErrorMessage(dbError, {
        type: 'database',
        component: 'db',
      });

      const networkMessage = createUserFriendlyErrorMessage(networkError, {
        type: 'network',
        component: 'api',
      });

      expect(authMessage).toBe(
        'Authentication failed. Please try logging in again.'
      );
      expect(dbMessage).toBe(
        'Unable to load data. Please try again in a moment.'
      );
      expect(networkMessage).toBe(
        'Network connection error. Please check your internet connection.'
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('extractErrorDebugInfo', () => {
    it('should extract comprehensive debug info from Error objects', () => {
      const error = new Error('Test error');
      error.name = 'CustomError';
      error.cause = 'Root cause';

      const debugInfo = extractErrorDebugInfo(error);

      expect(debugInfo).toEqual({
        message: 'Test error',
        stack: expect.any(String),
        name: 'CustomError',
        cause: 'Root cause',
      });
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const debugInfo = extractErrorDebugInfo(error);

      expect(debugInfo).toEqual({
        message: 'String error',
      });
    });
  });

  describe('createErrorContext', () => {
    it('should create comprehensive error context', () => {
      const context = createErrorContext({ custom: 'data' });

      expect(context).toMatchObject({
        timestamp: expect.any(String),
        environment: expect.any(String),
        custom: 'data',
      });

      expect(context.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  describe('withErrorReporting', () => {
    it('should wrap functions with error reporting', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
      const wrappedFn = withErrorReporting(mockFn, {
        component: 'test',
        action: 'test-action',
        type: 'server',
      });

      await expect(wrappedFn('arg1', 'arg2')).rejects.toThrow('Test error');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should return successful results without interference', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const wrappedFn = withErrorReporting(mockFn, {
        component: 'test',
        action: 'test-action',
        type: 'server',
      });

      const result = await wrappedFn('arg1', 'arg2');
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('Error reporting functions', () => {
    it('should call appropriate loggers for each error type', async () => {
      const { logServerError } = await import('@/lib/errorLogger');
      const { logClientError, logClientComponentError } = await import(
        '@/lib/client-error-logger'
      );

      const error = new Error('Test error');

      await reportServerError(error, {
        component: 'server',
        action: 'test',
        url: 'test-url',
      });

      await reportClientError(error, {
        component: 'client',
        action: 'test',
      });

      await reportComponentError(error, {
        component: 'component',
        action: 'test',
      });

      expect(logServerError).toHaveBeenCalled();
      expect(logClientError).toHaveBeenCalled();
      expect(logClientComponentError).toHaveBeenCalled();
    });
  });
});
