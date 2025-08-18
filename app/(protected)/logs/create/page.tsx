import { Metadata } from 'next';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { CaptainLogForm } from '@/components/features/logs/captain-log-form';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LogCreateErrorFallback } from '@/components/ui/logs-error-fallback';
import { logPageError, logAuthError } from '@/lib/errorLogger';

export const metadata: Metadata = {
  title: 'Create Daily Log - HUNKCentral',
  description: 'Create a new daily work log',
};

export default async function CreateLogPage() {
  let session;
  let userAgent: string | undefined;
  let currentUrl: string = '/logs/create';

  try {
    // Get request headers for error context
    const headersList = await headers();
    userAgent = headersList.get('user-agent') || undefined;
    currentUrl = headersList.get('x-url') || '/logs/create';

    // Validate authentication
    try {
      session = await auth();
    } catch (authError) {
      await logAuthError(authError, {
        action: 'session_validation',
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_create',
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
          page: 'logs_create',
          redirectTo: '/auth/login',
        },
      });
      throw new Error('Authentication required');
    }

    // Check user permissions
    const userRoles = session.user.roles || [];
    const canCreateLogs = userRoles.includes('captain') || userRoles.includes('admin');
    
    if (!canCreateLogs) {
      await logAuthError(new Error('Insufficient permissions'), {
        action: 'permission_check',
        userId: session.user.id,
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_create',
          userRoles,
          requiredRoles: ['captain', 'admin'],
        },
      });
      throw new Error('You do not have permission to create logs');
    }

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Create Daily Log</h1>
          <p className="text-muted-foreground">
            Record your daily work activities, jobs, and team hours.
          </p>
        </div>
        <ErrorBoundary fallback={LogCreateErrorFallback}>
          <CaptainLogForm />
        </ErrorBoundary>
      </div>
    );
  } catch (error) {
    // Log the error with comprehensive context
    await logPageError(error, {
      page: 'logs_create',
      userId: session?.user?.id,
      url: currentUrl || '/logs/create',
      userAgent,
      additionalData: {
        hasSession: !!session,
        userRoles: session?.user?.roles || [],
        timestamp: Date.now(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    });
    
    // Return user-friendly error fallback
    return <LogCreateErrorFallback 
      error={error instanceof Error ? error : new Error('Unknown error occurred')}
      context={{
        page: 'logs_create',
        userId: session?.user?.id,
      }}
    />;
  }
}