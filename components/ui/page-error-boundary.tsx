'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  Shield, 
  Database,
  Server,
  Wifi,
} from 'lucide-react';
import { reportComponentError, createUserFriendlyErrorMessage } from '@/lib/error-reporting';

interface PageErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId?: string;
}

function PageErrorFallback({ error, resetError, errorId }: PageErrorFallbackProps) {
  const [isReporting, setIsReporting] = React.useState(false);
  const [reportSent, setReportSent] = React.useState(false);

  const handleSendReport = async () => {
    setIsReporting(true);
    try {
      await reportComponentError(error, {
        component: 'page_error_boundary',
        action: 'manual_report',
        metadata: {
          errorId,
          userInitiated: true,
          timestamp: new Date().toISOString(),
        },
      });
      setReportSent(true);
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    } finally {
      setIsReporting(false);
    }
  };

  const getErrorType = (error: Error): 'auth' | 'network' | 'database' | 'server' | 'component' => {
    const message = error.message.toLowerCase();
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'auth';
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('database') || message.includes('prisma') || message.includes('sql')) {
      return 'database';
    }
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return 'server';
    }
    return 'component';
  };

  const errorType = getErrorType(error);
  const userFriendlyMessage = createUserFriendlyErrorMessage(error, {
    type: errorType,
    component: 'page',
  });

  const getErrorIcon = () => {
    switch (errorType) {
      case 'auth': return <Shield className="h-6 w-6" />;
      case 'network': return <Wifi className="h-6 w-6" />;
      case 'database': return <Database className="h-6 w-6" />;
      case 'server': return <Server className="h-6 w-6" />;
      default: return <Bug className="h-6 w-6" />;
    }
  };

  const getErrorColor = () => {
    switch (errorType) {
      case 'auth': return 'text-orange-600';
      case 'network': return 'text-blue-600';
      case 'database': return 'text-purple-600';
      case 'server': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSuggestions = () => {
    switch (errorType) {
      case 'auth':
        return [
          'Try logging out and logging back in',
          'Clear your browser cache and cookies',
          'Check if your session has expired',
        ];
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable any VPN or proxy',
        ];
      case 'database':
        return [
          'This is likely a temporary issue',
          'Try again in a few minutes',
          'Contact support if the problem persists',
        ];
      case 'server':
        return [
          'The server is experiencing issues',
          'Try again in a few minutes',
          'Check the status page for updates',
        ];
      default:
        return [
          'Try refreshing the page',
          'Clear your browser cache',
          'Try using a different browser',
        ];
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-2xl w-full border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-6 w-6" />
            Page Error
            {errorId && (
              <Badge variant="outline" className="ml-auto text-xs">
                ID: {errorId}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            This page encountered an error and cannot be displayed properly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Type and Message */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className={getErrorColor()}>
                {getErrorIcon()}
              </div>
              <Badge variant="outline" className="capitalize">
                {errorType} Error
              </Badge>
            </div>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="font-medium">
                {userFriendlyMessage}
              </AlertDescription>
            </Alert>
          </div>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Development Details:</h4>
              <div className="text-sm font-mono bg-muted p-3 rounded border">
                <div className="text-destructive font-semibold">{error.name}: {error.message}</div>
                {error.stack && (
                  <pre className="mt-2 text-xs whitespace-pre-wrap text-muted-foreground">
                    {error.stack.split('\n').slice(1, 6).join('\n')}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">What you can try:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              {getSuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          {/* Error Reporting */}
          {process.env.NODE_ENV === 'production' && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Help us improve</span>
                {!reportSent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSendReport}
                    disabled={isReporting}
                  >
                    {isReporting ? 'Sending...' : 'Send Error Report'}
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-green-600">
                    Report Sent
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {reportSent 
                  ? 'Thank you! Your error report helps us identify and fix issues.'
                  : 'Send an anonymous error report to help us identify and fix this issue.'
                }
              </p>
            </div>
          )}

          {/* Error ID for Support */}
          {errorId && process.env.NODE_ENV === 'production' && (
            <div className="text-xs text-center text-muted-foreground border-t pt-4">
              Error ID: {errorId} - Reference this ID when contacting support
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
}

export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      level="page"
      name={pageName || 'page'}
      fallback={PageErrorFallback}
    >
      {children}
    </ErrorBoundary>
  );
}