import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { logAuthError, logPageError } from '@/lib/monitoring';
import { listLogs } from '@/lib/actions/logs';
import { LogsViewClient } from '@/components/features/logs/logs-view-client';

export const dynamic = 'force-dynamic';

export default async function ViewLogsPage() {
  let session: Awaited<ReturnType<typeof auth>> | null = null;
  let userAgent: string | undefined;
  let currentUrl = '/logs/view';

  try {
    const headersList = await headers();
    userAgent = headersList.get('user-agent') || undefined;
    currentUrl = headersList.get('x-url') || '/logs/view';

    try {
      session = await auth();
    } catch (authError) {
      await logAuthError(authError, {
        action: 'session_validation',
        url: currentUrl,
        userAgent,
        additionalData: { page: 'logs_view', timestamp: Date.now() },
      });
      throw authError;
    }

    if (!session?.user) {
      await logAuthError(new Error('No session found'), {
        action: 'redirect',
        url: currentUrl,
        userAgent,
        additionalData: { page: 'logs_view', redirectTo: '/auth/login' },
      });
      throw new Error('Authentication required');
    }

    // Default to current pay period could be resolved on client via API; here we return initial payload
    const initial = await listLogs({
      // For captains, mineOnly makes sure they only see their logs by default
      mineOnly:
        session.user.roles?.includes('captain') &&
        !session.user.roles?.includes('manager') &&
        !session.user.roles?.includes('admin'),
      // Default to current page
      page: 1,
      pageSize: 25,
    });

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
            View Logs
          </h1>
          <p className="text-muted-foreground">
            Browse, filter, and manage daily logs.
          </p>
        </div>
        <LogsViewClient initialData={initial.success ? initial.data : null} />
      </div>
    );
  } catch (error) {
    await logPageError(error, {
      page: 'logs_view',
      action: 'page_error',
      userId: session?.user?.id,
      url: currentUrl || '/logs/view',
      userAgent,
      additionalData: {
        hasSession: !!session,
        userRoles: session?.user?.roles || [],
        timestamp: Date.now(),
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      },
    });

    return (
      <div className="container mx-auto py-10">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <h2 className="text-xl font-semibold text-destructive">
            Failed to load logs
          </h2>
          <p className="text-destructive/80">Please try again later.</p>
        </div>
      </div>
    );
  }
}
