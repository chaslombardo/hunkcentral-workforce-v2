import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LogsPageErrorFallback } from '@/components/ui/logs-error-fallback';

// Mock Next.js components
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Component that throws an error for testing
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test component error');
  }
  return <div>Component loaded successfully</div>;
}

describe('Logs Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should catch and display errors using ErrorBoundary with custom fallback', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={({ error, resetError }) => (
        <LogsPageErrorFallback error={error} resetError={resetError} />
      )}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show the error fallback instead of the component
    expect(screen.queryByText('Component loaded successfully')).not.toBeInTheDocument();
    expect(screen.getByText('Page Load Error')).toBeInTheDocument();
    expect(screen.getByText(/There was an error loading the logs page/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Refresh Page')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should render component normally when no error occurs', () => {
    render(
      <ErrorBoundary fallback={({ error, resetError }) => (
        <LogsPageErrorFallback error={error} resetError={resetError} />
      )}>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show the component normally
    expect(screen.getByText('Component loaded successfully')).toBeInTheDocument();
    expect(screen.queryByText('Page Load Error')).not.toBeInTheDocument();
  });

  it('should handle authentication errors specifically', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function AuthErrorComponent() {
      throw new Error('Authentication failed');
    }

    render(
      <ErrorBoundary fallback={({ error, resetError }) => (
        <LogsPageErrorFallback error={error} resetError={resetError} />
      )}>
        <AuthErrorComponent />
      </ErrorBoundary>
    );

    // Should detect auth error and show appropriate message
    expect(screen.getByText('Authentication Error')).toBeInTheDocument();
    expect(screen.getByText(/There was a problem with your session/)).toBeInTheDocument();
    expect(screen.getByText('Back to Login')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should handle database errors specifically', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function DatabaseErrorComponent() {
      throw new Error('Database connection failed');
    }

    render(
      <ErrorBoundary fallback={({ error, resetError }) => (
        <LogsPageErrorFallback error={error} resetError={resetError} />
      )}>
        <DatabaseErrorComponent />
      </ErrorBoundary>
    );

    // Should detect database error and show appropriate message
    expect(screen.getByText('Database Error')).toBeInTheDocument();
    expect(screen.getByText(/Unable to connect to the database/)).toBeInTheDocument();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('should provide helpful user guidance', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary fallback={({ error, resetError }) => (
        <LogsPageErrorFallback error={error} resetError={resetError} />
      )}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show helpful guidance
    expect(screen.getByText('What you can do:')).toBeInTheDocument();
    expect(screen.getByText(/Try refreshing the page/)).toBeInTheDocument();
    expect(screen.getByText(/Check your internet connection/)).toBeInTheDocument();
    expect(screen.getByText(/Clear your browser cache/)).toBeInTheDocument();
    expect(screen.getByText(/Contact support/)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});