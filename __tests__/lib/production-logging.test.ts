import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  logInfo,
  logWarning,
  logAuthEvent,
  logDatabaseOperation,
  logApiRequest,
  logPerformanceMetric,
  logBusinessEvent,
  createRequestLogger,
} from '@/lib/production-logger';

// Mock process.stdout and process.stderr
const mockStdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
const mockStderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

describe('Production Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set production environment for testing
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logInfo', () => {
    it('should log structured info messages in production', () => {
      const context = {
        component: 'test-component',
        action: 'test-action',
        userId: 'user123',
        metadata: { key: 'value' },
      };

      logInfo('Test info message', context);

      expect(mockStdout).toHaveBeenCalledWith(
        expect.stringContaining('"level":"INFO"')
      );
      expect(mockStdout).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test info message"')
      );
      expect(mockStdout).toHaveBeenCalledWith(
        expect.stringContaining('"component":"test-component"')
      );
    });

    it('should include timestamp in ISO format', () => {
      const context = {
        component: 'test-component',
        action: 'test-action',
      };

      logInfo('Test message', context);

      const logCall = mockStdout.mock.calls[0][0] as string;
      const logEntry = JSON.parse(logCall);
      
      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('logWarning', () => {
    it('should log warning messages with proper level', () => {
      const context = {
        component: 'test-component',
        action: 'test-action',
        metadata: { warning: 'details' },
      };

      logWarning('Test warning', context);

      expect(mockStdout).toHaveBeenCalledWith(
        expect.stringContaining('"level":"WARN"')
      );
      expect(mockStdout).toHaveBeenCalledWith(
        expect.stringContaining('"message":"Test warning"')
      );
    });
  });

  describe('logAuthEvent', () => {
    it('should log authentication events with proper context', () => {
      const context = {
        userId: 'user123',
        sessionId: 'session456',
        metadata: { loginMethod: 'credentials' },
      };

      logAuthEvent('login_success', context);

      const logCall = mockStdout.mock.calls[0][0] as string;
      const logEntry = JSON.parse(logCall);

      expect(logEntry.level).toBe('INFO');
      expect(logEntry.component).toBe('authentication');
      expect(logEntry.action).toBe('login_success');
      expect(logEntry.userId).toBe('user123');
      expect(logEntry.sessionId).toBe('session456');
    });
  });

  describe('logDatabaseOperation', () => {
    it('should log database operations with metadata', () => {
      const context = {
        userId: 'user123',
        duration: 150,
        recordCount: 5,
      };

      logDatabaseOperation('create', 'users', context);

      const logCall = mockStdout.mock.calls[0][0] as string;
      const logEntry = JSON.parse(logCall);

      expect(logEntry.component).toBe('database');
      expect(logEntry.action).toBe('create_users');
      expect(logEntry.metadata.table).toBe('users');
      expect(logEntry.metadata.operation).toBe('create');
      expect(logEntry.metadata.duration).toBe(150);
      expect(logEntry.metadata.recordCount).toBe(5);
    });
  });

  describe('logApiRequest', () => {
    it('should log API requests with proper level based on status code', () => {
      const context = {
        userId: 'user123',
        statusCode: 200,
        duration: 250,
      };

      logApiRequest('GET', '/api/users', context);

      const logCall = mockStdout.mock.calls[0][0] as string;
      const logEntry = JSON.parse(logCall);

      expect(logEntry.level).toBe('INFO');
      expect(logEntry.component).toBe('api');
      expect(logEntry.metadata.method).toBe('GET');
      expect(logEntry.metadata.endpoint).toBe('/api/users');
      expect(logEntry.metadata.statusCode).toBe(200);
    });

    it('should log API errors with WARN level', () => {
      const context = {
        userId: 'user123',
        statusCode: 500,
        duration: 1000,
      };

      logApiRequest('POST', '/api/logs', context);

      const logCall = mockStdout.mock.calls[0][0] as string;
      const logEntry = JSON.parse(logCall);

      expect(logEntry.level).toBe('WARN');
    });
  });

  describe('logPerformanceMetric', () => {
    it('should log performance metrics with proper metadata', () => {
      const context = {
        component: 'page-load',
        action: 'initial-render',
        unit: 'ms',
        metadata: { page: '/dashboard' },
      };

      logPerformanceMetric('load_time', 1250, context);

      const logCall = mockStdout.mock.calls[0][0] as string;
      const logEntry = JSON.parse(logCall);

      expect(logEntry.metadata.metric).toBe('load_time');
      expect(logEntry.metadata.value).toBe(1250);
      expect(logEntry.metadata.unit).toBe('ms');
    });
  });

  describe('logBusinessEvent', () => {
    it('should log business events with entity context', () => {
      const context = {
        userId: 'user123',
        entityType: 'daily_log',
        entityId: 'log456',
        metadata: { status: 'approved' },
      };

      logBusinessEvent('log_approved', context);

      const logCall = mockStdout.mock.calls[0][0] as string;
      const logEntry = JSON.parse(logCall);

      expect(logEntry.component).toBe('business');
      expect(logEntry.action).toBe('log_approved');
      expect(logEntry.metadata.entityType).toBe('daily_log');
      expect(logEntry.metadata.entityId).toBe('log456');
    });
  });

  describe('createRequestLogger', () => {
    it('should create a scoped logger with consistent context', () => {
      const requestContext = {
        requestId: 'req123',
        userId: 'user456',
        url: '/api/test',
      };

      const logger = createRequestLogger(requestContext);

      logger.info('Test message', {
        component: 'test',
        action: 'test-action',
      });

      const logCall = mockStdout.mock.calls[0][0] as string;
      const logEntry = JSON.parse(logCall);

      expect(logEntry.requestId).toBe('req123');
      expect(logEntry.userId).toBe('user456');
      expect(logEntry.url).toBe('/api/test');
      expect(logEntry.component).toBe('test');
      expect(logEntry.action).toBe('test-action');
    });

    it('should provide all logging methods with consistent context', () => {
      const requestContext = {
        requestId: 'req123',
        userId: 'user456',
      };

      const logger = createRequestLogger(requestContext);

      // Test each method
      logger.authEvent('login_attempt');
      logger.dbOperation('read', 'users', { duration: 100 });
      logger.apiRequest('GET', '/test', { statusCode: 200 });
      logger.performanceMetric('response_time', 150, {
        component: 'api',
        action: 'request',
      });
      logger.businessEvent('user_action', { entityType: 'user' });

      // All calls should include the request context
      expect(mockStdout).toHaveBeenCalledTimes(5);
      
      mockStdout.mock.calls.forEach((call) => {
        const logEntry = JSON.parse(call[0] as string);
        expect(logEntry.requestId).toBe('req123');
        expect(logEntry.userId).toBe('user456');
      });
    });
  });

  describe('development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should not log info messages in development', () => {
      logInfo('Test message', {
        component: 'test',
        action: 'test',
      });

      expect(mockStdout).not.toHaveBeenCalled();
    });

    it('should log warnings in development with formatting', () => {
      logWarning('Test warning', {
        component: 'test',
        action: 'test',
      });

      expect(mockStdout).toHaveBeenCalledWith(
        expect.stringContaining('"level":"WARN"')
      );
      // In development, should be formatted (contains newlines and spaces)
      const logCall = mockStdout.mock.calls[0][0] as string;
      expect(logCall).toContain('\n');
    });
  });
});