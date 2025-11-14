'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface LogErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface LogErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class LogErrorBoundary extends React.Component<
  LogErrorBoundaryProps,
  LogErrorBoundaryState
> {
  constructor(props: LogErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LogErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Log Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={this.handleRetry}
          />
        );
      }

      // Default error UI
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
            <CardDescription className="text-red-600">
              There was an error loading the log data. This might be due to a
              server issue or network problem.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <div className="text-sm text-red-700 bg-red-100 p-3 rounded border">
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Server Action Error Fallback Component
export function ServerActionErrorFallback({
  error,
  retry,
}: {
  error?: Error;
  retry: () => void;
}) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          Server Error
        </CardTitle>
        <CardDescription className="text-yellow-600">
          Unable to load data from the server. Please check your connection and
          try again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded border">
            <strong>Details:</strong> {error.message}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={retry}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button
            onClick={() => (window.location.href = '/logs')}
            variant="outline"
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            Back to Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Database Error Fallback Component
export function DatabaseErrorFallback({
  error,
  retry,
}: {
  error?: Error;
  retry: () => void;
}) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Database Connection Error
        </CardTitle>
        <CardDescription className="text-red-600">
          Unable to connect to the database. Please try again in a moment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && error.message.includes('database') && (
          <div className="text-sm text-red-700 bg-red-100 p-3 rounded border">
            The database is temporarily unavailable. Our team has been notified.
          </div>
        )}
        <div className="flex gap-2">
          <Button
            onClick={retry}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            Back to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default LogErrorBoundary;
