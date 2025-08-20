import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  LogsPageErrorFallback,
  LogCreateErrorFallback,
  LogReviewErrorFallback,
  LogDetailErrorFallback,
} from '@/components/ui/logs-error-fallback';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe('Logs Error Handling Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LogsPageErrorFallback', () => {
    it('should render authentication error correctly', () => {
      const authError = new Error('Authentication failed');
      const resetError = vi.fn();

      render(
        <LogsPageErrorFallback
          error={authError}
          resetError={resetError}
          context={{ page: 'logs', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Authentication Error')).toBeInTheDocument();
      expect(
        screen.getByText(/There was a problem with your session/)
      ).toBeInTheDocument();
      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should render database error correctly', () => {
      const dbError = new Error('Database connection failed');
      const resetError = vi.fn();

      render(
        <LogsPageErrorFallback
          error={dbError}
          resetError={resetError}
          context={{ page: 'logs', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Database Error')).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to connect to the database/)
      ).toBeInTheDocument();
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });

    it('should render generic error correctly', () => {
      const genericError = new Error('Something went wrong');
      const resetError = vi.fn();

      render(
        <LogsPageErrorFallback
          error={genericError}
          resetError={resetError}
          context={{ page: 'logs', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Page Load Error')).toBeInTheDocument();
      expect(
        screen.getByText(/There was an error loading the logs page/)
      ).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });

    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error message');
      const resetError = vi.fn();

      render(
        <LogsPageErrorFallback
          error={error}
          resetError={resetError}
          context={{ page: 'logs', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Test error message')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('LogCreateErrorFallback', () => {
    it('should render form loading error correctly', () => {
      const error = new Error('Form failed to load');
      const resetError = vi.fn();

      render(
        <LogCreateErrorFallback
          error={error}
          resetError={resetError}
          context={{ page: 'logs_create', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Form Loading Error')).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to load the log creation form/)
      ).toBeInTheDocument();
      expect(screen.getByText('Back to Logs')).toBeInTheDocument();
    });
  });

  describe('LogReviewErrorFallback', () => {
    it('should render review queue error correctly', () => {
      const error = new Error('Failed to load review queue');
      const resetError = vi.fn();

      render(
        <LogReviewErrorFallback
          error={error}
          resetError={resetError}
          context={{ page: 'logs_review', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Review Queue Error')).toBeInTheDocument();
      expect(
        screen.getByText(/There was an error loading the review queue/)
      ).toBeInTheDocument();
      expect(screen.getByText('Retry Loading')).toBeInTheDocument();
    });

    it('should render database error with special message', () => {
      const dbError = new Error('Database connection timeout');
      const resetError = vi.fn();

      render(
        <LogReviewErrorFallback
          error={dbError}
          resetError={resetError}
          context={{ page: 'logs_review', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Database Connection Error')).toBeInTheDocument();
      expect(
        screen.getByText(/Our team has been notified/)
      ).toBeInTheDocument();
    });
  });

  describe('LogDetailErrorFallback', () => {
    it('should render not found error correctly', () => {
      const notFoundError = new Error('Log not found');
      const resetError = vi.fn();

      render(
        <LogDetailErrorFallback
          error={notFoundError}
          resetError={resetError}
          context={{ page: 'logs_detail', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Log Not Found')).toBeInTheDocument();
      expect(
        screen.getByText(/The requested log could not be found/)
      ).toBeInTheDocument();
      expect(screen.getByText('Back to Logs')).toBeInTheDocument();
      expect(screen.getByText('Review Queue')).toBeInTheDocument();
    });

    it('should render permission error correctly', () => {
      const permissionError = new Error('Permission denied');
      const resetError = vi.fn();

      render(
        <LogDetailErrorFallback
          error={permissionError}
          resetError={resetError}
          context={{ page: 'logs_detail', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(
        screen.getByText(/You do not have permission to view this log/)
      ).toBeInTheDocument();
    });

    it('should render generic loading error with retry option', () => {
      const loadingError = new Error('Failed to load log details');
      const resetError = vi.fn();

      render(
        <LogDetailErrorFallback
          error={loadingError}
          resetError={resetError}
          context={{ page: 'logs_detail', userId: 'test-user' }}
        />
      );

      expect(screen.getByText('Log Loading Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });
});
