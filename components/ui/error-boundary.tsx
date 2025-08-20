'use client';

import React from 'react';
import { AlertTriangle, Bug, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { logClientComponentError } from '@/lib/client-error-logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    errorId?: string;
  }>;
  level?: 'page' | 'component' | 'section';
  name?: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId;

    // Enhanced error logging with more context
    logClientComponentError(error, {
      component: this.props.name || 'error_boundary',
      action: 'component_error',
      additionalData: {
        errorId,
        level: this.props.level || 'component',
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        // Additional debugging context
        reactVersion: React.version,
        errorBoundaryProps: {
          level: this.props.level,
          name: this.props.name,
        },
      },
    });

    // Store error info for detailed display
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
            errorId={this.state.errorId}
          />
        );
      }

      const isPageLevel = this.props.level === 'page';
      const errorTitle = isPageLevel ? 'Page Error' : 'Component Error';
      const errorDescription = isPageLevel
        ? 'This page encountered an error and cannot be displayed properly.'
        : 'A component on this page encountered an error.';

      return (
        <Card
          className={`${isPageLevel ? 'max-w-2xl mx-auto mt-8' : 'max-w-md mx-auto mt-4'} border-destructive/20`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {errorTitle}
              {this.state.errorId && (
                <Badge variant="outline" className="ml-auto text-xs">
                  ID: {this.state.errorId}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{errorDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {this.state.error && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-destructive">
                    Error Message:
                  </div>
                  <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded border">
                    {this.state.error.message}
                  </div>
                </div>
              )}

              {process.env.NODE_ENV === 'development' &&
                this.state.error?.stack && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Bug className="h-4 w-4 mr-2" />
                        Show Stack Trace (Development)
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="text-xs font-mono bg-muted p-3 rounded border max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

              <div className="flex gap-2">
                <Button onClick={this.resetError} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                {isPageLevel && (
                  <Button
                    variant="outline"
                    onClick={() => (window.location.href = '/dashboard')}
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                )}
              </div>

              {process.env.NODE_ENV === 'production' && (
                <div className="text-xs text-muted-foreground text-center">
                  Error ID: {this.state.errorId} - This error has been
                  automatically reported.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}
