'use client';

import React from 'react';
import { AlertTriangle, Bug, RefreshCw, Home, Send, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { reportComponentError, createUserFriendlyErrorMessage } from '@/lib/error-reporting';
import { logClientComponentError } from '@/lib/client-error-logger';

interface ProductionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
  reportSent: boolean;
  userFeedback: string;
  copied: boolean;
}

interface ProductionErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ 
    error: Error; 
    resetError: () => void; 
    errorId?: string;
    onSendReport?: (feedback: string) => void;
  }>;
  level?: 'page' | 'component' | 'section';
  name?: string;
  enableUserFeedback?: boolean;
  enableErrorReporting?: boolean;
}

export class ProductionErrorBoundary extends React.Component<
  ProductionErrorBoundaryProps, 
  ProductionErrorBoundaryState
> {
  constructor(props: ProductionErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      reportSent: false, 
      userFeedback: '',
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ProductionErrorBoundaryState> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId;
    
    // Enhanced error logging with comprehensive context
    logClientComponentError(error, {
      component: this.props.name || 'production_error_boundary',
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
        // Enhanced debugging context
        reactVersion: React.version,
        errorBoundaryProps: {
          level: this.props.level,
          name: this.props.name,
          enableUserFeedback: this.props.enableUserFeedback,
          enableErrorReporting: this.props.enableErrorReporting,
        },
        // Browser context
        browserInfo: {
          language: navigator.language,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          userAgent: navigator.userAgent,
        },
        // Performance context
        performanceInfo: this.getPerformanceInfo(),
        // Memory context (if available)
        memoryInfo: this.getMemoryInfo(),
      },
    });

    // Store error info for detailed display
    this.setState({ errorInfo });

    // Auto-report critical errors in production
    if (process.env.NODE_ENV === 'production' && this.isCriticalError(error)) {
      this.sendErrorReport('Auto-reported critical error');
    }
  }

  getPerformanceInfo = () => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        return {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        };
      }
    }
    return null;
  };

  getMemoryInfo = () => {
    if ('memory' in performance) {
      const memory = (performance as { memory: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      } }).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  };

  isCriticalError = (error: Error): boolean => {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    const criticalKeywords = [
      'database',
      'authentication',
      'payment',
      'security',
      'critical',
      'fatal',
      'cannot connect',
      'network error',
      'server error',
    ];
    
    return criticalKeywords.some(keyword => 
      message.includes(keyword) || stack.includes(keyword)
    );
  };

  resetError = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      reportSent: false,
      userFeedback: '',
      copied: false,
    });
  };

  sendErrorReport = async (feedback?: string) => {
    if (!this.state.error || this.state.reportSent) return;

    try {
      await reportComponentError(this.state.error, {
        component: this.props.name || 'production_error_boundary',
        action: 'user_reported_error',
        componentStack: this.state.errorInfo?.componentStack || undefined,
        metadata: {
          errorId: this.state.errorId,
          userFeedback: feedback || this.state.userFeedback,
          level: this.props.level,
          timestamp: new Date().toISOString(),
          reportedByUser: !!feedback || this.state.userFeedback.length > 0,
        },
      });

      this.setState({ reportSent: true });
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  };

  copyErrorInfo = () => {
    const errorInfo = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stack: this.state.error?.stack,
    };

    navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2000);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent 
          error={this.state.error!} 
          resetError={this.resetError} 
          errorId={this.state.errorId}
          onSendReport={this.sendErrorReport}
        />;
      }

      const isPageLevel = this.props.level === 'page';
      const errorTitle = isPageLevel ? 'Page Error' : 'Component Error';
      const errorDescription = isPageLevel 
        ? 'This page encountered an error and cannot be displayed properly.'
        : 'A component on this page encountered an error.';

      const userFriendlyMessage = this.state.error 
        ? createUserFriendlyErrorMessage(this.state.error, {
            type: 'component',
            component: this.props.name || 'unknown',
          })
        : 'An unexpected error occurred.';

      const isCritical = this.state.error ? this.isCriticalError(this.state.error) : false;

      return (
        <Card className={`${isPageLevel ? 'max-w-3xl mx-auto mt-8' : 'max-w-lg mx-auto mt-4'} ${
          isCritical ? 'border-destructive' : 'border-destructive/20'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {errorTitle}
              {this.state.errorId && (
                <Badge variant="outline" className="ml-auto text-xs">
                  ID: {this.state.errorId}
                </Badge>
              )}
              {isCritical && (
                <Badge variant="destructive" className="text-xs">
                  CRITICAL
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {errorDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* User-friendly error message */}
              <Alert className={isCritical ? 'border-destructive' : ''}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {userFriendlyMessage}
                </AlertDescription>
              </Alert>

              {/* Technical error details for development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-destructive">
                    Technical Details (Development):
                  </div>
                  <div className="text-sm text-muted-foreground font-mono bg-muted p-3 rounded border">
                    <div className="font-semibold">{this.state.error.name}: {this.state.error.message}</div>
                    {this.state.error.stack && (
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto">
                            <Bug className="h-3 w-3 mr-1" />
                            Show Stack Trace
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <pre className="text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                            {this.state.error.stack}
                          </pre>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </div>
                </div>
              )}

              {/* User feedback section */}
              {this.props.enableUserFeedback && process.env.NODE_ENV === 'production' && (
                <div className="space-y-2">
                  <Label htmlFor="user-feedback" className="text-sm font-medium">
                    Help us improve (optional):
                  </Label>
                  <Textarea
                    id="user-feedback"
                    placeholder="What were you trying to do when this error occurred?"
                    value={this.state.userFeedback}
                    onChange={(e) => this.setState({ userFeedback: e.target.value })}
                    className="text-sm"
                    rows={3}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={this.resetError} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                {isPageLevel && (
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/dashboard'}
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                )}
              </div>

              {/* Error reporting section */}
              {this.props.enableErrorReporting && process.env.NODE_ENV === 'production' && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Error Reporting</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={this.copyErrorInfo}
                        disabled={this.state.copied}
                      >
                        {this.state.copied ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Info
                          </>
                        )}
                      </Button>
                      {!this.state.reportSent ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => this.sendErrorReport()}
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Send Report
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          Report Sent
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {this.state.reportSent 
                      ? 'Thank you! Your error report helps us identify and fix issues.'
                      : 'Send an anonymous error report to help us identify and fix this issue.'
                    }
                  </p>
                </div>
              )}

              {/* Error ID for support */}
              {this.state.errorId && process.env.NODE_ENV === 'production' && (
                <div className="text-xs text-center text-muted-foreground border-t pt-4">
                  Error ID: {this.state.errorId} - Reference this ID when contacting support
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

// Hook version for functional components with enhanced features
export function useProductionErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);
  const [errorId, setErrorId] = React.useState<string | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
    setErrorId(null);
  }, []);

  const captureError = React.useCallback((error: Error, context?: Record<string, unknown>) => {
    const id = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setErrorId(id);
    
    // Log the error with context
    logClientComponentError(error, {
      component: 'use_production_error_boundary',
      action: 'capture_error',
      additionalData: {
        errorId: id,
        hookUsage: true,
        context,
        timestamp: new Date().toISOString(),
      },
    });
    
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError, errorId };
}