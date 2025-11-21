import { Metadata } from 'next';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { CaptainLogFormV1 } from '@/components/features/logs/captain-log-form-v1';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LogCreateErrorFallback } from '@/components/ui/logs-error-fallback';
import { logAuthError, logPageError } from '@/lib/monitoring';

export const metadata: Metadata = {
  title: 'Create Daily Log (V1) - HUNKCentral',
  description: 'Create a new daily work log - Single Page Version',
};

export default async function CreateLogV1Page() {
  let session;
  let userAgent: string | undefined;
  let currentUrl: string = '/logs/create-v1';

  try {
    // Get request headers for error context
    const headersList = await headers();
    userAgent = headersList.get('user-agent') || undefined;
    currentUrl = headersList.get('x-url') || '/logs/create-v1';

    // Validate authentication
    try {
      session = await auth();
    } catch (authError) {
      await logAuthError(authError, {
        action: 'session_validation',
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_create_v1',
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
          page: 'logs_create_v1',
          redirectTo: '/auth/login',
        },
      });
      throw new Error('Authentication required');
    }

    // Check user permissions
    const userRoles = session.user.roles || [];
    const canCreateLogs =
      userRoles.includes('captain') || userRoles.includes('admin');

    if (!canCreateLogs) {
      await logAuthError(new Error('Insufficient permissions'), {
        action: 'permission_check',
        userId: session.user.id,
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_create_v1',
          userRoles,
          requiredRoles: ['captain', 'admin'],
        },
      });
      throw new Error('You do not have permission to create logs');
    }

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Create Daily Log - Single Page
          </h1>
          <p className="text-muted-foreground">
            Modern single-page layout with all sections visible at once.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2 py-1 text-xs bg-hunks-green text-white rounded-full">
              Version 1
            </span>
            <span className="text-sm text-muted-foreground">
              Full-width single page with proper data isolation
            </span>
          </div>
        </div>
        <ErrorBoundary fallback={LogCreateErrorFallback}>
          <CaptainLogFormV1 />
        </ErrorBoundary>
      </div>
    );
  } catch (error) {
    // Log the error with comprehensive context
    await logPageError(error, {
      page: 'logs_create_v1',
      action: 'page_error',
      userId: session?.user?.id,
      url: currentUrl || '/logs/create-v1',
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
      <LogCreateErrorFallback
        error={
          error instanceof Error ? error : new Error('Unknown error occurred')
        }
        context={{
          page: 'logs_create_v1',
          userId: session?.user?.id,
        }}
      />
    );
  }
}
