/**
 * Production Error Monitoring Integration Tests
 * Tests the integration of error monitoring components
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductionErrorBoundary } from '@/components/ui/production-error-boundary';
import { ProductionErrorMonitor } from '@/components/production-error-monitor';
import React from 'react';

// Mock the error logging functions
vi.mock('@/lib/client-error-logger', () => ({
  logClientComponentError: vi.fn(),
  setupGlobalErrorHandling: vi.fn(),
  setupErrorRetry: vi.fn(),
}));

vi.mock('@/lib/error-reporting', () => ({
  reportComponentError: vi.fn(),
  createUserFriendlyErrorMessage: vi.fn((error) => error.message),
}));

// Component that throws an error for testing
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test component error');
  }
  return <div>Component rendered successfully</div>;
}

describe('Production Error Monitoring Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ProductionErrorBoundary', () => {
    it('should render children when no error occurs', () => {
      render(
        <ProductionErrorBoundary name="test-boundary">
          <ErrorThrowingComponent shouldThrow={false} />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('Component rendered successfully')).toBeInTheDocument();
    });

    it('should catch and display error when component throws', () => {
      render(
        <ProductionErrorBoundary 
          name="test-boundary" 
          enableUserFeedback={true}
          enableErrorReporting={true}
        >
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('Test component error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should show user feedback section when enabled', () => {
      render(
        <ProductionErrorBoundary 
          name="test-boundary" 
          enableUserFeedback={true}
          level="component"
        >
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('Help us improve (optional):')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What were you trying to do when this error occurred?')).toBeInTheDocument();
    });

    it('should show error reporting section when enabled', () => {
      render(
        <ProductionErrorBoundary 
          name="test-boundary" 
          enableErrorReporting={true}
          level="component"
        >
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('Error Reporting')).toBeInTheDocument();
      expect(screen.getByText('Copy Info')).toBeInTheDocument();
      expect(screen.getByText('Send Report')).toBeInTheDocument();
    });

    it('should display error ID for support reference', () => {
      render(
        <ProductionErrorBoundary name="test-boundary">
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      // Error ID should be displayed
      const errorIdElement = screen.getByText(/Error ID:/);
      expect(errorIdElement).toBeInTheDocument();
      expect(errorIdElement.textContent).toMatch(/ID: err_\d+_[a-z0-9]+/);
    });
  });

  describe('ProductionErrorMonitor', () => {
    it('should render without errors', () => {
      const { container } = render(<ProductionErrorMonitor />);
      
      // In production, this component doesn't render anything visible
      expect(container.firstChild).toBeNull();
    });

    it('should set up global error handling on mount', () => {
      const { setupGlobalErrorHandling } = require('@/lib/client-error-logger');
      
      render(<ProductionErrorMonitor />);
      
      expect(setupGlobalErrorHandling).toHaveBeenCalled();
    });
  });

  describe('Error Boundary with Different Levels', () => {
    it('should show page-level error UI for page errors', () => {
      render(
        <ProductionErrorBoundary 
          name="test-page" 
          level="page"
        >
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('Page Error')).toBeInTheDocument();
      expect(screen.getByText('This page encountered an error and cannot be displayed properly.')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('should show component-level error UI for component errors', () => {
      render(
        <ProductionErrorBoundary 
          name="test-component" 
          level="component"
        >
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('A component on this page encountered an error.')).toBeInTheDocument();
      expect(screen.queryByText('Go Home')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    it('should allow users to retry after error', () => {
      const { rerender } = render(
        <ProductionErrorBoundary name="test-boundary">
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      
      const tryAgainButton = screen.getByText('Try Again');
      expect(tryAgainButton).toBeInTheDocument();
      
      // Simulate clicking try again and component not throwing error
      tryAgainButton.click();
      
      rerender(
        <ProductionErrorBoundary name="test-boundary">
          <ErrorThrowingComponent shouldThrow={false} />
        </ProductionErrorBoundary>
      );
      
      // After retry, the component should render normally
      expect(screen.queryByText('Component Error')).not.toBeInTheDocument();
    });
  });

  describe('Critical Error Detection', () => {
    it('should identify critical errors correctly', () => {
      function CriticalErrorComponent() {
        throw new Error('Database connection failed - critical error');
      }

      render(
        <ProductionErrorBoundary name="test-boundary">
          <CriticalErrorComponent />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed - critical error')).toBeInTheDocument();
    });
  });

  describe('Development vs Production Behavior', () => {
    it('should show technical details in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ProductionErrorBoundary name="test-boundary">
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      expect(screen.getByText('Technical Details (Development):')).toBeInTheDocument();
      expect(screen.getByText('Show Stack Trace')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide technical details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ProductionErrorBoundary name="test-boundary">
          <ErrorThrowingComponent shouldThrow={true} />
        </ProductionErrorBoundary>
      );

      expect(screen.queryByText('Technical Details (Development):')).not.toBeInTheDocument();
      expect(screen.queryByText('Show Stack Trace')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });
});