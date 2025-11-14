import { Metadata } from 'next';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { CaptainLogForm } from '@/components/features/logs/captain-log-form';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LogCreateErrorFallback } from '@/components/ui/logs-error-fallback';
import { loadLog } from '@/lib/actions/logs';
import { logAuthError, logPageError } from '@/lib/monitoring';
import { DailyLogFormData } from '@/lib/validations';
import { LogJob, LogHour } from '@/types';

export const metadata: Metadata = {
  title: 'Edit Daily Log - HUNKCentral',
  description: 'Edit an existing daily work log',
};

interface EditLogPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLogPage({ params }: EditLogPageProps) {
  let session;
  let userAgent: string | undefined;
  let currentUrl: string = '/logs/edit';

  try {
    // Resolve params
    const resolvedParams = await params;
    const logId = resolvedParams.id;
    currentUrl = `/logs/${logId}/edit`;

    // Get request headers for error context
    const headersList = await headers();
    userAgent = headersList.get('user-agent') || undefined;

    // Validate authentication
    try {
      session = await auth();
    } catch (authError) {
      await logAuthError(authError, {
        action: 'session_validation',
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_edit',
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
          page: 'logs_edit',
          logId,
          redirectTo: '/auth/login',
        },
      });
      throw new Error('Authentication required');
    }

    // Check user permissions - captains can edit their own logs, managers and admins can edit any log
    const userRoles = session.user.roles || [];
    const canEditLogs =
      userRoles.includes('captain') ||
      userRoles.includes('manager') ||
      userRoles.includes('admin');

    if (!canEditLogs) {
      await logAuthError(new Error('Insufficient permissions'), {
        action: 'permission_check',
        userId: session.user.id,
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_edit',
          logId,
          userRoles,
          requiredRoles: ['captain', 'manager', 'admin'],
        },
      });
      throw new Error('You do not have permission to edit logs');
    }

    // Load the existing log
    const logResult = await loadLog(logId);

    if (!logResult.success || !logResult.data) {
      await logPageError(new Error(`Failed to load log: ${logResult.error}`), {
        page: 'logs_edit',
        action: 'load_log',
        userId: session.user.id,
        url: currentUrl,
        userAgent,
        additionalData: {
          logId,
          logError: logResult.error,
          timestamp: Date.now(),
        },
      });
      throw new Error(logResult.error || 'Log not found');
    }

    const logData = logResult.data;

    // Check if user can edit this specific log
    const canEditThisLog =
      logData.captainId === session.user.id ||
      logData.createdById === session.user.id ||
      userRoles.includes('manager') ||
      userRoles.includes('admin');

    if (!canEditThisLog) {
      await logAuthError(new Error('Cannot edit this log'), {
        action: 'permission_check',
        userId: session.user.id,
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs_edit',
          logId,
          logCaptainId: logData.captainId,
          logCreatedById: logData.createdById,
          userRoles,
        },
      });
      throw new Error('You can only edit your own logs');
    }

    // Check if log can be edited (only draft and submitted logs can be edited)
    if (logData.status === 'approved') {
      throw new Error('Approved logs cannot be edited');
    }

    // Transform log data to form format
    const initialFormData: Partial<DailyLogFormData> = {
      captainId: logData.captainId,
      logDate: new Date(logData.logDate),
      sections: {
        junk: true, // Default to true, could be derived from existing jobs
        move: true, // Default to true, could be derived from existing jobs
        otherHours: true, // Default to true, could be derived from existing hours
      },
      jobs: logData.jobs.map((job: LogJob) => ({
        jobType: job.jobType as 'junk' | 'move',
        jobId: job.jobId || '',
        clientName: job.clientName || '',
        revenue: Number(job.revenue),
        tips: Number(job.tips),
        junkOnMove: job.junkOnMove ? Number(job.junkOnMove) : undefined,
        valuation: job.valuation ? Number(job.valuation) : undefined,
        materials: job.materials ? Number(job.materials) : undefined,
        disposalCost: job.disposalCost ? Number(job.disposalCost) : undefined,
      })),
      disposalCost: 0, // Could be calculated from jobs
      hours: logData.hours.map((hour: LogHour) => ({
        employeeId: hour.employeeId,
        department: hour.department as
          | 'junk'
          | 'move'
          | 'admin'
          | 'training'
          | 'estimating'
          | 'warehouse',
        hours: Number(hour.hours),
        isCoCaptain: hour.isCoCaptain || false,
      })),
    };

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Edit Daily Log</h1>
          <p className="text-muted-foreground">
            Make changes to your daily work log for{' '}
            {new Date(logData.logDate).toLocaleDateString()}.
          </p>
          <div className="mt-2 text-sm text-muted-foreground">
            Status:{' '}
            <span className="capitalize font-medium">{logData.status}</span>
            {logData.submittedAt && (
              <span>
                {' '}
                • Submitted:{' '}
                {new Date(logData.submittedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <ErrorBoundary fallback={LogCreateErrorFallback}>
          <CaptainLogForm initialLogId={logId} initialData={initialFormData} />
        </ErrorBoundary>
      </div>
    );
  } catch (error) {
    // Log the error with comprehensive context
    await logPageError(error, {
      page: 'logs_edit',
      action: 'page_error',
      userId: session?.user?.id,
      url: currentUrl,
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
          page: 'logs_edit',
          userId: session?.user?.id,
        }}
      />
    );
  }
}
