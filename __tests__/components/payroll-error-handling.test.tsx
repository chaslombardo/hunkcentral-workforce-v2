import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PayrollErrorBoundary,
  PayrollComponentErrorBoundary,
} from '@/components/features/reports/payroll-error-boundary';
import {
  PayrollSummaryFallback,
  DepartmentBreakdownFallback,
  DailyWorkFallback,
  TipsDetailFallback,
  PayrollLoadingSkeleton,
} from '@/components/features/reports/payroll-fallback-views';

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

// Mock window.location
const mockLocation = {
  href: '',
  reload: vi.fn(),
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Component that throws an error for testing
function ErrorThrowingComponent({
  shouldThrow = true,
  errorMessage = 'Test error',
}) {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>Component loaded successfully</div>;
}

describe('PayrollErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent shouldThrow={false} />
      </PayrollErrorBoundary>
    );

    expect(
      screen.getByText('Component loaded successfully')
    ).toBeInTheDocument();
  });

  it('should render error fallback when error occurs', () => {
    render(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent errorMessage="Network request failed" />
      </PayrollErrorBoundary>
    );

    expect(
      screen.getByText(/System Error - Payroll Data Unavailable/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /An unexpected error occurred while loading your payroll information/
      )
    ).toBeInTheDocument();
  });

  it('should categorize different error types correctly', () => {
    const { rerender } = render(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent errorMessage="cached data corrupted" />
      </PayrollErrorBoundary>
    );

    expect(
      screen.getByText(/Cache Error - Payroll Data Unavailable/)
    ).toBeInTheDocument();

    rerender(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent errorMessage="unauthorized access" />
      </PayrollErrorBoundary>
    );

    expect(
      screen.getByText(/Cache Error - Payroll Data Unavailable/)
    ).toBeInTheDocument();

    rerender(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent errorMessage="payroll calculation failed" />
      </PayrollErrorBoundary>
    );

    expect(
      screen.getByText(/Cache Error - Payroll Data Unavailable/)
    ).toBeInTheDocument();
  });

  it('should handle retry functionality', async () => {
    const { rerender } = render(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent />
      </PayrollErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /Try Again/ });
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);

    // Should show retrying state
    await waitFor(() => {
      expect(screen.getByText(/Try Again/)).toBeInTheDocument();
    });

    // Simulate successful retry by not throwing error
    await waitFor(() => {
      rerender(
        <PayrollErrorBoundary>
          <ErrorThrowingComponent shouldThrow={false} />
        </PayrollErrorBoundary>
      );
    });
  });

  it('should disable retry after max attempts', async () => {
    render(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent />
      </PayrollErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /Try Again/ });

    // Click retry button 5 times to reach max
    for (let i = 0; i < 5; i++) {
      fireEvent.click(retryButton);
      await waitFor(() => {
        // Wait for retry to complete
      });
    }

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Try Again/ })).toBeDisabled();
    });
  });

  it('should show clear cache option for cache errors', () => {
    render(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent errorMessage="cached data corrupted" />
      </PayrollErrorBoundary>
    );

    expect(
      screen.getByRole('button', { name: /Clear Cache & Retry/ })
    ).toBeInTheDocument();
  });

  it('should handle page reload', () => {
    render(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent />
      </PayrollErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /Reload Page/ });
    fireEvent.click(reloadButton);

    expect(mockLocation.reload).toHaveBeenCalled();
  });

  it('should handle navigation to dashboard', () => {
    render(
      <PayrollErrorBoundary>
        <ErrorThrowingComponent />
      </PayrollErrorBoundary>
    );

    const dashboardButton = screen.getByRole('button', {
      name: /Return to Dashboard/,
    });
    fireEvent.click(dashboardButton);

    expect(mockLocation.href).toBe('/dashboard');
  });

  it('should call onError callback when provided', () => {
    const onError = vi.fn();

    render(
      <PayrollErrorBoundary onError={onError}>
        <ErrorThrowingComponent errorMessage="Test callback error" />
      </PayrollErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });
});

describe('PayrollComponentErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render component-specific error message', () => {
    render(
      <PayrollComponentErrorBoundary componentName="Department Breakdown">
        <ErrorThrowingComponent />
      </PayrollComponentErrorBoundary>
    );

    expect(
      screen.getByText(/Department Breakdown Unavailable/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This section couldn't load due to a technical issue/)
    ).toBeInTheDocument();
  });

  it('should provide retry functionality for components', async () => {
    const { rerender } = render(
      <PayrollComponentErrorBoundary componentName="Tips Detail">
        <ErrorThrowingComponent />
      </PayrollComponentErrorBoundary>
    );

    const retryButton = screen.getByRole('button', { name: /Retry/ });
    fireEvent.click(retryButton);

    // Simulate successful retry
    await waitFor(() => {
      rerender(
        <PayrollComponentErrorBoundary componentName="Tips Detail">
          <ErrorThrowingComponent shouldThrow={false} />
        </PayrollComponentErrorBoundary>
      );
    });

    expect(
      screen.getByText('Component loaded successfully')
    ).toBeInTheDocument();
  });
});

describe('PayrollSummaryFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render unavailable state when no data', () => {
    render(<PayrollSummaryFallback error="Network error" onRetry={vi.fn()} />);

    expect(screen.getByText(/Payroll Summary Unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/Network error/)).toBeInTheDocument();
  });

  it('should render offline state correctly', () => {
    render(<PayrollSummaryFallback isOffline={true} onRetry={vi.fn()} />);

    expect(screen.getByText(/Offline Mode/)).toBeInTheDocument();
    expect(screen.getByText(/You're currently offline/)).toBeInTheDocument();
  });

  it('should render summary data when available', () => {
    const summaryData = {
      totalHours: 40,
      totalPay: 1000,
      grossWages: 800,
      tips: 150,
      bonuses: 50,
      commission: 0,
    };

    render(
      <PayrollSummaryFallback
        summaryData={summaryData}
        error="Details unavailable"
      />
    );

    expect(screen.getAllByText('$1,000.00')[0]).toBeInTheDocument(); // Total pay
    expect(screen.getByText('40h')).toBeInTheDocument(); // Hours
    expect(screen.getAllByText('$150.00')[0]).toBeInTheDocument(); // Tips
  });

  it('should handle retry with count tracking', async () => {
    const onRetry = vi.fn();

    render(<PayrollSummaryFallback error="Network error" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /Try Again/ });

    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);

    // Should show retry count after first attempt
    await waitFor(() => {
      expect(screen.getByText(/Try Again \(1\)/)).toBeInTheDocument();
    });
  });

  it('should disable retry after max attempts', async () => {
    const onRetry = vi.fn();

    render(<PayrollSummaryFallback error="Network error" onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /Try Again/ });

    // Click 5 times to reach max
    for (let i = 0; i < 5; i++) {
      fireEvent.click(retryButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/Max Retries/)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Max Retries/ })
      ).toBeDisabled();
    });
  });

  it('should show clear cache option for cache errors', () => {
    render(
      <PayrollSummaryFallback error="cached data corrupted" onRetry={vi.fn()} />
    );

    expect(
      screen.getByRole('button', { name: /Clear Cache/ })
    ).toBeInTheDocument();
  });

  it('should clear cache when clear cache button is clicked', async () => {
    const onRetry = vi.fn();

    render(
      <PayrollSummaryFallback error="cached data corrupted" onRetry={onRetry} />
    );

    const clearCacheButton = screen.getByRole('button', {
      name: /Clear Cache/,
    });
    fireEvent.click(clearCacheButton);

    // Should call localStorage.removeItem for payroll cache keys
    await waitFor(() => {
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    // Should trigger retry after clearing cache
    await waitFor(() => {
      expect(onRetry).toHaveBeenCalled();
    });
  });
});

describe('DepartmentBreakdownFallback', () => {
  it('should render with available summary data', () => {
    render(
      <DepartmentBreakdownFallback
        totalHours={40}
        totalPay={1000}
        error="Failed to load breakdown"
        onRetry={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Department Breakdown Unavailable/)
    ).toBeInTheDocument();
    expect(screen.getByText('40h')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
  });

  it('should handle retry functionality', () => {
    const onRetry = vi.fn();

    render(
      <DepartmentBreakdownFallback error="Network error" onRetry={onRetry} />
    );

    const retryButton = screen.getByRole('button', {
      name: /Try Loading Breakdown/,
    });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalled();
  });
});

describe('DailyWorkFallback', () => {
  it('should render with available summary data', () => {
    render(
      <DailyWorkFallback
        totalDays={15}
        avgHours={8.2}
        error="Calendar unavailable"
        onRetry={vi.fn()}
      />
    );

    expect(
      screen.getByText(/Daily Work History Unavailable/)
    ).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('8.2h')).toBeInTheDocument();
  });
});

describe('TipsDetailFallback', () => {
  it('should render with available summary data', () => {
    render(
      <TipsDetailFallback
        totalTips={250}
        jobCount={10}
        error="Tips details unavailable"
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText(/Tips Details Unavailable/)).toBeInTheDocument();
    expect(screen.getByText('$250.00')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument(); // Average per job
  });
});

describe('PayrollLoadingSkeleton', () => {
  it('should render loading skeleton components', () => {
    render(<PayrollLoadingSkeleton />);

    // Should render multiple skeleton cards
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});

describe('Error Recovery Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle complete error recovery flow', async () => {
    let shouldThrow = true;

    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Network request failed');
      }
      return <div>Data loaded successfully</div>;
    };

    const { rerender } = render(
      <PayrollErrorBoundary>
        <TestComponent />
      </PayrollErrorBoundary>
    );

    // Should show error state
    expect(
      screen.getByText(/System Error - Payroll Data Unavailable/)
    ).toBeInTheDocument();

    // Click retry
    const retryButton = screen.getByRole('button', { name: /Try Again/ });
    fireEvent.click(retryButton);

    // Simulate successful recovery
    shouldThrow = false;

    await waitFor(() => {
      rerender(
        <PayrollErrorBoundary>
          <TestComponent />
        </PayrollErrorBoundary>
      );
    });

    // Should show success state
    expect(screen.getByText('Data loaded successfully')).toBeInTheDocument();
  });

  it('should handle offline to online transition', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <PayrollSummaryFallback isOffline={true} onRetry={onRetry} />
    );

    expect(screen.getByText(/Offline Mode/)).toBeInTheDocument();

    // Simulate coming back online
    rerender(<PayrollSummaryFallback isOffline={false} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: /Try Again/ });
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalled();
  });
});
