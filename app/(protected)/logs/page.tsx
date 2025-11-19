import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { prisma } from '@/lib/prisma';
import { logAuthError, logPageError } from '@/lib/monitoring';
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

    const recentLogsRaw = await prisma.dailyLog.findMany({
      where: { captainId: session.user.id },
      orderBy: { logDate: 'desc' },
      take: 3,
      select: {
        id: true,
        logDate: true,
        status: true,
        submittedAt: true,
        jobs: {
          select: {
            revenue: true,
          },
        },
      },
    });

    const recentLogs = recentLogsRaw.map((log) => ({
      ...log,
      totalRevenue: log.jobs.reduce(
        (sum, job) => sum + Number(job.revenue || 0),
        0
      ),
    }));

    return (
      <div className="container mx-auto py-8 space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-hunks-green/5 via-background to-hunks-orange/5 rounded-lg p-6 border border-hunks-green/10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-hunks-green mb-3">
              Daily Logs
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Manage daily work logs, track job progress, and review team
              activities.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {canCreateLogs && (
            <Card className="border-l-4 border-l-hunks-green bg-gradient-to-br from-hunks-green/5 via-background to-transparent hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-hunks-green">
                  Create New Log
                </CardTitle>
                <Plus className="h-6 w-6 text-hunks-green" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Record your daily work activities, jobs completed, and team
                    hours.
                  </p>
                  <Link href="/logs/create">
                    <BrandButton variant="primary" className="w-full h-12">
                      <Plus className="mr-2 h-5 w-5" />
                      Create Daily Log
                    </BrandButton>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {canReviewLogs && (
            <Card className="border-l-4 border-l-hunks-orange bg-gradient-to-br from-hunks-orange/5 via-background to-transparent hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-hunks-orange">
                  Review Logs
                </CardTitle>
                <CheckCircle className="h-6 w-6 text-hunks-orange" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Review and approve submitted daily logs from your team.
                  </p>
                  <Link href="/logs/review">
                    <BrandButton
                      variant="outline-secondary"
                      className="w-full h-12"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Review Queue
                    </BrandButton>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-l-4 border-l-blue-500 bg-card/60 dark:bg-muted/30 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold text-blue-600">
                My Recent Logs
              </CardTitle>
              <FileText className="h-6 w-6 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You haven&apos;t submitted any logs yet.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recentLogs.map((log) => (
                      <li
                        key={log.id}
                        className="flex items-center justify-between rounded-md border border-border/60 bg-background/80 px-3 py-2 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {new Date(log.logDate).toLocaleDateString()}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            ${log.totalRevenue.toLocaleString()} revenue
                          </p>
                        </div>
                        <Badge
                          variant={
                            log.status === 'approved'
                              ? 'default'
                              : log.status === 'submitted'
                                ? 'secondary'
                                : 'outline'
                          }
                          className="capitalize"
                        >
                          {log.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <BrandButton variant="outline" className="w-full h-12" asChild>
                  <Link href="/logs/mine">
                    <Clock className="mr-2 h-5 w-5" />
                    View My Logs
                  </Link>
                </BrandButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-hunks-green/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-hunks-green">
                <FileText className="h-6 w-6" />
                Log Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Required
                  </Badge>
                  <span className="text-base">
                    Submit logs within 24 hours of work completion
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Required
                  </Badge>
                  <span className="text-base">
                    Include all job details and team member hours
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Important
                  </Badge>
                  <span className="text-base">
                    Ensure accurate revenue and expense tracking
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-hunks-orange/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-hunks-orange">
                <CheckCircle className="h-6 w-6" />
                Review Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <StatusIndicator status="pending" size="sm" />
                  <span className="text-base">
                    Log submitted and awaiting review
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusIndicator status="approved" size="sm" />
                  <span className="text-base">
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
      action: 'page_error',
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
