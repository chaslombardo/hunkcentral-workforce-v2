'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, RefreshCw, Home, HelpCircle } from 'lucide-react';

interface PayrollErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface PayrollErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<PayrollErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface PayrollErrorFallbackProps {
  error: Error;
  resetError: () => void;
  hasOfflineCapability?: boolean;
}

export class PayrollErrorBoundary extends React.Component<
  PayrollErrorBoundaryProps,
  PayrollErrorBoundaryState
> {
  constructor(props: PayrollErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): PayrollErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error for debugging
    // PayrollErrorBoundary caught an error

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || PayrollErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          hasOfflineCapability={true}
        />
      );
    }

    return this.props.children;
  }
}

function PayrollErrorFallback({
  error,
  resetError,
  hasOfflineCapability = false,
}: PayrollErrorFallbackProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastRetryAt, setLastRetryAt] = React.useState<Date | null>(null);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);
    setLastRetryAt(new Date());

    // Add exponential backoff delay based on retry count
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      resetError();
    } catch {
      // Retry failed
    } finally {
      setIsRetrying(false);
    }
  };

  const handleReload = () => {
    // Clear any corrupted cache before reload
    try {
      const keys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith('payroll-summary-') ||
          key.startsWith('payroll-details-')
      );
      keys.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Failed to clear cache before reload
    }

    window.location.reload();
  };

  const handleClearCache = () => {
    try {
      const keys = Object.keys(localStorage).filter(
        (key) =>
          key.startsWith('payroll-summary-') ||
          key.startsWith('payroll-details-')
      );
      keys.forEach((key) => localStorage.removeItem(key));

      // Show success message briefly
      const originalTitle = document.title;
      document.title = 'Cache Cleared - ' + originalTitle;
      setTimeout(() => {
        document.title = originalTitle;
      }, 2000);

      // Attempt retry after clearing cache
      handleRetry();
    } catch {
      // Failed to clear cache
    }
  };

  // Enhanced error categorization
  const isNetworkError =
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('offline') ||
    error.message.includes('Failed to load');

  const isDataError =
    error.message.includes('payroll') ||
    error.message.includes('calculation') ||
    error.message.includes('breakdown');

  const isCacheError =
    error.message.includes('cached data corrupted') ||
    error.message.includes('parse') ||
    error.message.includes('JSON');

  const isValidationError =
    error.message.includes('validation') ||
    error.message.includes('unauthorized') ||
    error.message.includes('permission');

  const getErrorCategory = () => {
    if (isNetworkError) return 'Network';
    if (isCacheError) return 'Cache';
    if (isValidationError) return 'Authorization';
    if (isDataError) return 'Data';
    return 'System';
  };

  const getErrorSeverity = () => {
    if (isValidationError) return 'critical';
    if (isNetworkError && hasOfflineCapability) return 'warning';
    if (isCacheError) return 'warning';
    return 'error';
  };

  const severity = getErrorSeverity();
  const category = getErrorCategory();

  return (
    <div className="space-y-6 p-4">
      {/* Main Error Alert */}
      <Alert
        className={
          severity === 'critical'
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            : severity === 'warning'
              ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
        }
      >
        <AlertTriangle
          className={`h-4 w-4 ${
            severity === 'critical'
              ? 'text-red-600'
              : severity === 'warning'
                ? 'text-yellow-600'
                : 'text-red-600'
          }`}
        />
        <AlertTitle
          className={
            severity === 'critical'
              ? 'text-red-800 dark:text-red-200'
              : severity === 'warning'
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-red-800 dark:text-red-200'
          }
        >
          {category} Error - Payroll Data Unavailable
        </AlertTitle>
        <AlertDescription
          className={
            severity === 'critical'
              ? 'text-red-700 dark:text-red-300'
              : severity === 'warning'
                ? 'text-yellow-700 dark:text-yellow-300'
                : 'text-red-700 dark:text-red-300'
          }
        >
          {isNetworkError
            ? "We're having trouble connecting to our servers. Your data may be temporarily unavailable."
            : isCacheError
              ? "There's an issue with cached data. Clearing the cache may resolve this problem."
              : isValidationError
                ? "You don't have permission to access this payroll data, or your session has expired."
                : isDataError
                  ? 'There was an issue loading your payroll breakdown. Your summary data may still be available.'
                  : 'An unexpected error occurred while loading your payroll information.'}
        </AlertDescription>
      </Alert>

      {/* Error Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Details
          </CardTitle>
          <CardDescription>
            Technical information about what went wrong
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium">Error Type:</div>
            <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
              {error.name || 'Unknown Error'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Description:</div>
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              {error.message || 'No additional details available'}
            </div>
          </div>

          <Separator />

          {/* Recovery Actions */}
          <div className="space-y-3">
            <div className="text-sm font-medium">Recovery Options:</div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                onClick={handleRetry}
                disabled={isRetrying || retryCount >= 5}
                className="w-full"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying... ({retryCount + 1})
                  </>
                ) : retryCount >= 5 ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Max Retries Reached
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again {retryCount > 0 ? `(${retryCount})` : ''}
                  </>
                )}
              </Button>

              {isCacheError && (
                <Button
                  variant="outline"
                  onClick={handleClearCache}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Clear Cache & Retry
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleReload}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Return to Dashboard
            </Button>

            {/* Show retry history if there have been attempts */}
            {retryCount > 0 && lastRetryAt && (
              <div className="text-xs text-muted-foreground">
                Last retry: {lastRetryAt.toLocaleTimeString()} ({retryCount}{' '}
                attempts)
              </div>
            )}
          </div>

          {/* Offline Capability Notice */}
          {hasOfflineCapability && isNetworkError && (
            <>
              <Separator />
              <Alert>
                <HelpCircle className="h-4 w-4" />
                <AlertTitle>Offline Mode Available</AlertTitle>
                <AlertDescription>
                  Some of your payroll data may be cached and available offline.
                  Try refreshing the page or check back when your connection is
                  restored.
                </AlertDescription>
              </Alert>
            </>
          )}

          {/* Help Text */}
          <div className="text-xs text-muted-foreground">
            If this problem persists, please contact your system administrator
            or IT support. Include the error details above when reporting the
            issue.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized error boundary for payroll components
export function PayrollComponentErrorBoundary({
  children,
  componentName,
}: {
  children: React.ReactNode;
  componentName: string;
}) {
  return (
    <PayrollErrorBoundary
      fallback={({ resetError }) => (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-3 flex-1">
                <div>
                  <div className="font-medium text-red-800 dark:text-red-200">
                    {componentName} Unavailable
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                    This section couldn&apos;t load due to a technical issue.
                    Your other payroll data should still be available.
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetError}
                    className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                  >
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      onError={() => {
        // Component error occurred
      }}
    >
      {children}
    </PayrollErrorBoundary>
  );
}
