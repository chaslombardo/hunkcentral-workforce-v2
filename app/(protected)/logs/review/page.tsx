import { Suspense } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { LogReviewQueue } from '@/components/features/logs/log-review-queue';
import { Skeleton } from '@/components/ui/skeleton';
import LogErrorBoundary from '@/components/ui/log-error-boundary';
import { LogReviewErrorFallback } from '@/components/ui/logs-error-fallback';
import { logPageError, logAuthError } from '@/lib/errorLogger';

export default async function LogReviewPage() {
  let session;
  let userAgent: string | undefined;
  let currentUrl: string = '/logs/review';

  try {
    // Get request headers for error context
    const headersList = await headers();
    userAgent = headersList.get('user-agent') || undefined;
    currentUrl = headersList.get('x-url') || '/logs/review';

    // Validate authentication
    try {
      session = await auth();
    } catch (authError) {
      await logAuthError(authError, {
        action: 'session_validation',
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_review',
          timestamp: Date.now(),
        },
      });
      throw authError;
    }

    if (!session?.user) {
      await logAuthError(new Error('No session found'), {
        action: 'redirect',
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_review',
          redirectTo: '/auth/login',
        },
      });
      throw new Error('Authentication required');
    }

    // Check user permissions
    const userRoles = session.user.roles || [];
    const canReviewLogs =
      userRoles.includes('manager') || userRoles.includes('admin');

    if (!canReviewLogs) {
      await logAuthError(new Error('Insufficient permissions'), {
        action: 'permission_check',
        userId: session.user.id,
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_review',
          userRoles,
          requiredRoles: ['manager', 'admin'],
        },
      });
      throw new Error('You do not have permission to review logs');
    }

    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Log Review</h1>
            <p className="text-muted-foreground">
              Review and approve submitted daily logs
            </p>
          </div>
        </div>

        <LogErrorBoundary fallback={LogReviewErrorFallback}>
          <Suspense fallback={<LogReviewSkeleton />}>
            <LogReviewQueue />
          </Suspense>
        </LogErrorBoundary>
      </div>
    );
  } catch (error) {
    // Log the error with comprehensive context
    await logPageError(error, {
      page: 'logs_review',
      userId: session?.user?.id,
      url: currentUrl || '/logs/review',
      userAgent,
      additionalData: {
        hasSession: !!session,
        userRoles: session?.user?.roles || [],
        timestamp: Date.now(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    });

    // Return user-friendly error fallback
    return (
      <LogReviewErrorFallback
        error={
          error instanceof Error ? error : new Error('Unknown error occurred')
        }
        context={{
          page: 'logs_review',
          userId: session?.user?.id,
        }}
      />
    );
  }
}

function LogReviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
