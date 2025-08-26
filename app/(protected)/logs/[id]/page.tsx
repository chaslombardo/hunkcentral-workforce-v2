import { Suspense } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { LogDetailView } from '@/components/features/logs/log-detail-view';
import { LogDetailSkeleton } from '@/components/features/logs/log-detail-skeleton';
import LogErrorBoundary from '@/components/ui/log-error-boundary';
import { LogDetailErrorFallback } from '@/components/ui/logs-error-fallback';
import { getMonitoring, logAuthError, logPageError } from '@/lib/monitoring';
import type { Session } from 'next-auth';

interface LogDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LogDetailPage({ params }: LogDetailPageProps) {
  let session: Session | null = null;
  let userAgent: string | undefined;
  let currentUrl: string = '/logs';
  let logId: string = 'unknown';

  try {
    const { id } = await params;
    logId = id;

    // Get request headers for error context
    const headersList = await headers();
    userAgent = headersList.get('user-agent') || undefined;
    currentUrl = headersList.get('x-url') || `/logs/${id}`;

    // Validate authentication
    try {
      session = await auth();
    } catch (authError) {
      await logAuthError(authError, {
        action: 'session_validation',
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_detail',
          logId,
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
          page: 'logs_detail',
          logId,
          redirectTo: '/auth/login',
        },
      });
      throw new Error('Authentication required');
    }

    // Validate log ID format
    if (!logId || typeof logId !== 'string' || logId.trim() === '') {
      throw new Error('Invalid log ID provided');
    }

    return (
      <div className="container mx-auto py-6">
        <LogErrorBoundary fallback={LogDetailErrorFallback}>
          <Suspense fallback={<LogDetailSkeleton />}>
            <LogDetailView logId={logId} />
          </Suspense>
        </LogErrorBoundary>
      </div>
    );
  } catch (error) {
    // Log the error with comprehensive context
    const userId = (session as Session | null)?.user?.id;
    const userRoles = (session as Session | null)?.user?.roles || [];

    await logPageError(error, {
      page: 'logs_detail',
      action: 'page_error',
      userId,
      url: currentUrl || `/logs/${logId}`,
      userAgent,
      additionalData: {
        hasSession: !!session,
        userRoles,
        logId: logId,
        timestamp: Date.now(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    });

    // Return user-friendly error fallback
    return (
      <LogDetailErrorFallback
        error={
          error instanceof Error ? error : new Error('Unknown error occurred')
        }
        context={{
          page: 'logs_detail',
          userId,
        }}
      />
    );
  }
}
