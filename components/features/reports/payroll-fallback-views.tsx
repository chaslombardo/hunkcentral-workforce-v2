'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  RefreshCw,
  WifiOff,
  Calendar,
  Award,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { User } from '@/types';

interface PayrollSummaryFallbackProps {
  summaryData?: {
    totalHours: number;
    totalPay: number;
    grossWages: number;
    tips: number;
    bonuses: number;
    commission: number;
  };
  user?: User;
  error?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  isOffline?: boolean;
}

export function PayrollSummaryFallback({
  summaryData,
  error,
  onRetry,
  isRetrying = false,
  isOffline = false,
}: PayrollSummaryFallbackProps) {
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastRetryAt, setLastRetryAt] = React.useState<Date | null>(null);

  const handleRetry = React.useCallback(async () => {
    if (!onRetry) return;
    
    setRetryCount(prev => prev + 1);
    setLastRetryAt(new Date());
    
    try {
      await onRetry();
    } catch {
      // Retry failed in fallback
    }
  }, [onRetry]);

  const handleClearCacheAndRetry = React.useCallback(async () => {
    try {
      // Clear payroll-related cache
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('payroll-summary-') || 
        key.startsWith('payroll-details-')
      );
      keys.forEach(key => localStorage.removeItem(key));
      
      // Wait a moment then retry
      setTimeout(handleRetry, 500);
    } catch {
      // Failed to clear cache
      handleRetry(); // Try anyway
    }
  }, [handleRetry]);

  if (!summaryData) {
    const isCacheError = error?.includes('corrupted') || error?.includes('parse');
    const _isNetworkError = error?.includes('network') || error?.includes('fetch') || isOffline;
    // Use the variable to avoid unused warning
    // Network error detected
    
    return (
      <Card 
        className={
          isOffline 
            ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
            : "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
        }
        data-testid="payroll-summary-fallback"
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            {isOffline ? (
              <WifiOff className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-3 flex-1">
              <div>
                <div className={`font-medium ${
                  isOffline 
                    ? 'text-blue-800 dark:text-blue-200' 
                    : 'text-yellow-800 dark:text-yellow-200'
                }`}>
                  {isOffline ? 'Offline Mode' : 'Payroll Summary Unavailable'}
                </div>
                <div className={`text-sm mt-1 ${
                  isOffline 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {isOffline 
                    ? "You're currently offline. Some payroll data may be available from cache when you reconnect."
                    : isCacheError
                    ? "There's an issue with cached data. Try clearing the cache to resolve this."
                    : error || "We're having trouble loading your payroll summary. This may be a temporary issue."
                  }
                </div>
              </div>
              
              {onRetry && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleRetry}
                    disabled={isRetrying || retryCount >= 5}
                    className={
                      isOffline
                        ? "border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                        : "border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900"
                    }
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                        Retrying...
                      </>
                    ) : retryCount >= 5 ? (
                      <>
                        <AlertTriangle className="mr-2 h-3 w-3" />
                        Max Retries
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Try Again {retryCount > 0 ? `(${retryCount})` : ''}
                      </>
                    )}
                  </Button>

                  {isCacheError && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleClearCacheAndRetry}
                      disabled={isRetrying}
                      className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900"
                    >
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Clear Cache
                    </Button>
                  )}
                </div>
              )}

              {retryCount > 0 && lastRetryAt && (
                <div className="text-xs text-muted-foreground">
                  Last attempt: {lastRetryAt.toLocaleTimeString()} ({retryCount} tries)
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Offline/Error Notice */}
      {(isOffline || error) && (
        <Alert className={isOffline ? "border-blue-200 bg-blue-50" : "border-yellow-200 bg-yellow-50"}>
          {isOffline ? <WifiOff className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertTitle>
            {isOffline ? "Limited Offline Mode" : "Using Cached Data"}
          </AlertTitle>
          <AlertDescription>
            {isOffline 
              ? "You're viewing cached payroll data. Some features may be limited until you're back online."
              : "Detailed breakdowns are temporarily unavailable. Showing summary data from cache."
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Pay</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(summaryData.totalPay)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Gross wages + tips + bonuses</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Hours Worked</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {summaryData.totalHours}h
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Total hours this period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tips Earned</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums">
              {formatCurrency(summaryData.tips)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" />
              <span>Customer tips</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Basic Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Pay Breakdown</CardTitle>
          <CardDescription>
            Basic compensation breakdown (detailed view unavailable)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Gross Wages</span>
              <span className="font-mono font-medium">{formatCurrency(summaryData.grossWages)}</span>
            </div>
            <Progress 
              value={(summaryData.grossWages / summaryData.totalPay) * 100} 
              className="h-2"
            />
          </div>

          {summaryData.tips > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Tips</span>
                <span className="font-mono font-medium">{formatCurrency(summaryData.tips)}</span>
              </div>
              <Progress 
                value={(summaryData.tips / summaryData.totalPay) * 100} 
                className="h-2"
              />
            </div>
          )}

          {summaryData.bonuses > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Bonuses</span>
                <span className="font-mono font-medium">{formatCurrency(summaryData.bonuses)}</span>
              </div>
              <Progress 
                value={(summaryData.bonuses / summaryData.totalPay) * 100} 
                className="h-2"
              />
            </div>
          )}

          {summaryData.commission > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Commission</span>
                <span className="font-mono font-medium">{formatCurrency(summaryData.commission)}</span>
              </div>
              <Progress 
                value={(summaryData.commission / summaryData.totalPay) * 100} 
                className="h-2"
              />
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center font-medium">
            <span>Total Pay</span>
            <span className="font-mono text-lg">{formatCurrency(summaryData.totalPay)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Retry Action */}
      {onRetry && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="text-sm text-muted-foreground">
                Want to see detailed breakdowns, daily work history, and tips details?
              </div>
              <Button 
                onClick={onRetry}
                disabled={isRetrying}
                className="w-full sm:w-auto"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading Details...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Load Detailed View
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface DepartmentBreakdownFallbackProps {
  totalHours?: number;
  totalPay?: number;
  error?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function DepartmentBreakdownFallback({
  totalHours,
  totalPay,
  error,
  onRetry,
  isRetrying = false,
}: DepartmentBreakdownFallbackProps) {
  return (
    <Card 
      className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
      data-testid="department-breakdown-fallback"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Department Breakdown Unavailable
        </CardTitle>
        <CardDescription>
          {error || "We couldn't load your department-specific pay breakdown."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalHours && totalPay && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Summary:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Hours</div>
                <div className="font-mono font-medium">{totalHours}h</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Pay</div>
                <div className="font-mono font-medium">{formatCurrency(totalPay)}</div>
              </div>
            </div>
          </div>
        )}

        {onRetry && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Try Loading Breakdown
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface DailyWorkFallbackProps {
  totalDays?: number;
  avgHours?: number;
  error?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function DailyWorkFallback({
  totalDays,
  avgHours,
  error,
  onRetry,
  isRetrying = false,
}: DailyWorkFallbackProps) {
  return (
    <Card 
      className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
      data-testid="daily-work-fallback"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-yellow-600" />
          Daily Work History Unavailable
        </CardTitle>
        <CardDescription>
          {error || "We couldn't load your daily work breakdown and calendar."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalDays && avgHours && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Summary:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Days Worked</div>
                <div className="font-mono font-medium">{totalDays}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Hours/Day</div>
                <div className="font-mono font-medium">{avgHours.toFixed(1)}h</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          The daily work calendar and detailed work history are temporarily unavailable. 
          You can still view your overall hours and pay totals above.
        </div>

        {onRetry && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Try Loading Calendar
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface TipsDetailFallbackProps {
  totalTips?: number;
  jobCount?: number;
  error?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function TipsDetailFallback({
  totalTips,
  jobCount,
  error,
  onRetry,
  isRetrying = false,
}: TipsDetailFallbackProps) {
  return (
    <Card 
      className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
      data-testid="tips-detail-fallback"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-yellow-600" />
          Tips Details Unavailable
        </CardTitle>
        <CardDescription>
          {error || "We couldn't load your detailed tips breakdown."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {totalTips !== undefined && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Available Summary:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Tips</div>
                <div className="font-mono font-medium">{formatCurrency(totalTips)}</div>
              </div>
              {jobCount && (
                <div>
                  <div className="text-muted-foreground">Avg per Job</div>
                  <div className="font-mono font-medium">{formatCurrency(totalTips / jobCount)}</div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          The detailed tips breakdown showing individual jobs, team sharing, and daily totals 
          is temporarily unavailable. Your total tips amount is still included in your pay summary.
        </div>

        {onRetry && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Try Loading Tips Details
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Loading skeleton for when data is being retried
export function PayrollLoadingSkeleton() {
  return (
    <div className="space-y-6" data-testid="payroll-loading-skeleton">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} data-testid={`skeleton-summary-card-${i}`}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" data-testid={`skeleton-card-title-${i}`} />
              <Skeleton className="h-8 w-24" data-testid={`skeleton-card-value-${i}`} />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-32" data-testid={`skeleton-card-description-${i}`} />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card data-testid="skeleton-breakdown-card">
        <CardHeader>
          <Skeleton className="h-6 w-32" data-testid="skeleton-breakdown-title" />
          <Skeleton className="h-4 w-48" data-testid="skeleton-breakdown-description" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2" data-testid={`skeleton-breakdown-item-${i}`}>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" data-testid={`skeleton-item-label-${i}`} />
                <Skeleton className="h-4 w-16" data-testid={`skeleton-item-value-${i}`} />
              </div>
              <Skeleton className="h-2 w-full" data-testid={`skeleton-item-progress-${i}`} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}