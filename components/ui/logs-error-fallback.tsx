'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  context?: {
    page: string;
    action?: string;
    userId?: string;
  };
}

/**
 * Main logs page error fallback with navigation options
 */
export function LogsPageErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isAuthError = error?.message?.toLowerCase().includes('auth') || 
                     error?.message?.toLowerCase().includes('session') ||
                     error?.message?.toLowerCase().includes('unauthorized');
  
  const isDatabaseError = error?.message?.toLowerCase().includes('database') ||
                         error?.message?.toLowerCase().includes('connection') ||
                         error?.message?.toLowerCase().includes('prisma');

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            {isAuthError ? 'Authentication Error' : isDatabaseError ? 'Database Error' : 'Page Load Error'}
          </CardTitle>
          <CardDescription className="text-red-600">
            {isAuthError 
              ? 'There was a problem with your session. Please log in again.'
              : isDatabaseError
              ? 'Unable to connect to the database. Please try again in a moment.'
              : 'There was an error loading the logs page. This might be temporary.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && process.env.NODE_ENV === 'development' && (
            <div className="text-sm text-red-700 bg-red-100 p-3 rounded border">
              <strong>Error Details:</strong> {error.message}
              {error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">Stack Trace</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-32 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {resetError && (
              <Button 
                onClick={resetError}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            
            {isAuthError ? (
              <Link href="/auth/login">
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            )}
          </div>

          <div className="text-sm text-red-600 bg-red-100 p-3 rounded border">
            <strong>What you can do:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Try refreshing the page</li>
              <li>Check your internet connection</li>
              <li>Clear your browser cache if the problem persists</li>
              <li>Contact support if the error continues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Log creation form error fallback
 */
export function LogCreateErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-2xl mx-auto border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Form Loading Error
          </CardTitle>
          <CardDescription className="text-yellow-600">
            Unable to load the log creation form. This might be due to a temporary issue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && process.env.NODE_ENV === 'development' && (
            <div className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded border">
              <strong>Error Details:</strong> {error.message}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {resetError && (
              <Button 
                onClick={resetError}
                variant="outline"
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
            
            <Link href="/logs">
              <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Logs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Log review queue error fallback
 */
export function LogReviewErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isDatabaseError = error?.message?.toLowerCase().includes('database') ||
                         error?.message?.toLowerCase().includes('connection');

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          {isDatabaseError ? 'Database Connection Error' : 'Review Queue Error'}
        </CardTitle>
        <CardDescription className="text-red-600">
          {isDatabaseError 
            ? 'Unable to load logs from the database. Please try again in a moment.'
            : 'There was an error loading the review queue. This might be temporary.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && process.env.NODE_ENV === 'development' && (
          <div className="text-sm text-red-700 bg-red-100 p-3 rounded border">
            <strong>Error Details:</strong> {error.message}
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {resetError && (
            <Button 
              onClick={resetError}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading
            </Button>
          )}
          
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
          
          <Link href="/logs">
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <FileText className="h-4 w-4 mr-2" />
              Back to Logs
            </Button>
          </Link>
        </div>

        {isDatabaseError && (
          <div className="text-sm text-red-600 bg-red-100 p-3 rounded border">
            <strong>Database Issue:</strong> The system is temporarily unable to connect to the database. 
            Our team has been notified and is working to resolve this issue.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Log detail view error fallback
 */
export function LogDetailErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const isNotFound = error?.message?.toLowerCase().includes('not found') ||
                    error?.message?.toLowerCase().includes('404');
  
  const isPermission = error?.message?.toLowerCase().includes('permission') ||
                      error?.message?.toLowerCase().includes('unauthorized') ||
                      error?.message?.toLowerCase().includes('forbidden');

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-2xl mx-auto border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            {isNotFound ? 'Log Not Found' : isPermission ? 'Access Denied' : 'Log Loading Error'}
          </CardTitle>
          <CardDescription className="text-red-600">
            {isNotFound 
              ? 'The requested log could not be found. It may have been deleted or you may not have permission to view it.'
              : isPermission
              ? 'You do not have permission to view this log.'
              : 'There was an error loading the log details.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && process.env.NODE_ENV === 'development' && (
            <div className="text-sm text-red-700 bg-red-100 p-3 rounded border">
              <strong>Error Details:</strong> {error.message}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {!isNotFound && !isPermission && resetError && (
              <Button 
                onClick={resetError}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <Link href="/logs">
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Logs
              </Button>
            </Link>
            
            <Link href="/logs/review">
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                <FileText className="h-4 w-4 mr-2" />
                Review Queue
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}