import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getMonitoring } from '@/lib/monitoring';
import { LogsPageErrorFallback } from '@/components/ui/logs-error-fallback';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
import { BrandButton } from '@/components/brand/brand-button';
import { StatusIndicator } from '@/components/brand/status-indicator';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function LogsPage() {
  let session;
  let userAgent: string | undefined;
  let currentUrl: string = '/logs';

  try {
    // Get request headers for error context
    const headersList = await headers();
    userAgent = headersList.get('user-agent') || undefined;
    currentUrl = headersList.get('x-url') || '/logs';

    // Authenticate user with comprehensive error handling
    try {
      session = await auth();
    } catch (authError) {
      await logAuthError(authError, {
        action: 'session_validation',
        url: currentUrl,
        userAgent,
        additionalData: {
          page: 'logs',
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
          page: 'logs',
          redirectTo: '/auth/login',
        },
      });
      redirect('/auth/login');
    }

    const userRoles = session.user.roles || [];
    const canCreateLogs =
      userRoles.includes('captain') || userRoles.includes('admin');
    const canReviewLogs =
      userRoles.includes('manager') || userRoles.includes('admin');

    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Daily Logs</h1>
          <p className="text-muted-foreground">
            Manage daily work logs, track job progress, and review team
            activities.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {canCreateLogs && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Create New Log
                </CardTitle>
                <Plus className="h-4 w-4 text-[#026937]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Record your daily work activities, jobs completed, and team
                    hours.
                  </p>
                  <Link href="/logs/create">
                    <BrandButton variant="primary" className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Daily Log
                    </BrandButton>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {canReviewLogs && (
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Review Logs
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-[#ea7200]" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Review and approve submitted daily logs from your team.
                  </p>
                  <Link href="/logs/review">
                    <BrandButton variant="outline" className="w-full">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Review Queue
                    </BrandButton>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Recent Logs
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  View your recently submitted logs and their status.
                </p>
                <BrandButton variant="outline" className="w-full" disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  Coming Soon
                </BrandButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#026937]" />
                Log Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                  <span className="text-sm">
                    Submit logs within 24 hours of work completion
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                  <span className="text-sm">
                    Include all job details and team member hours
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Important
                  </Badge>
                  <span className="text-sm">
                    Ensure accurate revenue and expense tracking
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-[#ea7200]" />
                Review Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusIndicator status="pending" size="sm" />
                  <span className="text-sm">
                    Log submitted and awaiting review
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIndicator status="approved" size="sm" />
                  <span className="text-sm">
                    Log approved and processed for payroll
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusIndicator status="rejected" size="sm" />
                  <span className="text-sm">
                    Log requires corrections before approval
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific information */}
        {!canCreateLogs && !canReviewLogs && (
          <Card className="mt-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">Limited Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-700">
                You currently have view-only access to the logs system. Contact
                your manager if you need permissions to create or review logs.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    // Log the error with comprehensive context
    await logPageError(error, {
      page: 'logs',
      userId: session?.user?.id,
      url: currentUrl || '/logs',
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
      <LogsPageErrorFallback
        error={
          error instanceof Error ? error : new Error('Unknown error occurred')
        }
        context={{
          page: 'logs',
          userId: session?.user?.id,
        }}
      />
    );
  }
}
