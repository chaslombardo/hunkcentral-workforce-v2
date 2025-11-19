import { FormFeedback } from '@/components/forms/form-feedback';
import { getDashboardMetrics } from '@/lib/actions/dashboard';

export const dynamic = 'force-dynamic';

export default async function FormFeedbackPage() {
  const response = await getDashboardMetrics();

  if (!response.success || !response.data) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
            Form Feedback System
          </h1>
          <p className="text-muted-foreground">
            Real workflows rely on the same feedback components used across the
            dashboard.
          </p>
        </div>
        <FormFeedback
          type="error"
          title="Unable to load metrics"
          message={response.error || 'An unexpected issue occurred.'}
          details="We were unable to load live dashboard data. Please try again shortly."
          suggestions={['Check your network connection', 'Refresh this page']}
        />
      </div>
    );
  }

  const data = response.data;
  const pendingLogs = data.pendingLogs.count;
  const pendingChange = data.pendingLogs.change?.value ?? 0;
  const payPeriod = data.currentPayPeriod ?? { status: 'unknown' };
  const daysRemaining = payPeriod?.daysRemaining ?? 0;
  const recentActivity = data.recentActivity.slice(0, 3);

  const approvalsStatus = pendingLogs
    ? {
        type: 'warning' as const,
        title: 'Logs awaiting approval',
        message: `${pendingLogs} log${pendingLogs === 1 ? '' : 's'} need manager review`,
        details:
          pendingChange > 0
            ? `Queue grew ${pendingChange.toFixed(1)}% versus last week.`
            : 'Queue is trending down week over week.',
        suggestions: [
          'Review submissions in the log queue',
          'Follow up with captains missing details',
        ],
      }
    : {
        type: 'success' as const,
        title: 'Log approvals are current',
        message: 'All submitted logs have been reviewed.',
        details: 'New submissions will appear here automatically.',
      };

  const payPeriodStatus =
    daysRemaining <= 2
      ? {
          type: 'warning' as const,
          title: 'Pay period ending soon',
          message: `${daysRemaining === 0 ? 'Final day' : `${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`} remaining in ${payPeriod.name || 'current period'}.`,
          suggestions: [
            'Confirm all captain logs are submitted',
            'Finalize payroll adjustments before the lock date',
          ],
        }
      : {
          type: 'info' as const,
          title: payPeriod.name || 'Current pay period',
          message: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining before payroll closes.`,
          details: 'You can safely continue submitting and editing logs.',
        };

  const commissionStatus = data.commissionEntries.count
    ? {
        type: 'success' as const,
        title: 'Commission activity',
        message: `${data.commissionEntries.count} commission entries recorded this week`,
        details: `Change vs. last week: ${
          data.commissionEntries.change?.value?.toFixed(1) ?? '0.0'
        }%`,
        suggestions: [
          'Match open commissions to approved jobs',
          'Resolve conflicts in the commission dashboard',
        ],
      }
    : {
        type: 'info' as const,
        title: 'No new commissions yet',
        message: 'Commission entries update as soon as sales close jobs.',
        suggestions: [
          'Check your CRM sync',
          'Verify matched logs for accuracy',
        ],
      };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Feedback
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
          Workflow Alerts
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Each feedback panel below is backed by the actual dashboard metrics
          service, so you see exactly what managers see when reviewing payroll
          readiness.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormFeedback
          type={approvalsStatus.type}
          title={approvalsStatus.title}
          message={approvalsStatus.message}
          details={approvalsStatus.details}
          suggestions={approvalsStatus.suggestions}
          showAnimation
        />
        <FormFeedback
          type={payPeriodStatus.type}
          title={payPeriodStatus.title}
          message={payPeriodStatus.message}
          details={payPeriodStatus.details}
          suggestions={payPeriodStatus.suggestions}
        />
        <FormFeedback
          type={commissionStatus.type}
          title={commissionStatus.title}
          message={commissionStatus.message}
          details={commissionStatus.details}
          suggestions={commissionStatus.suggestions}
        />
        <FormFeedback
          type="info"
          title="Recent form activity"
          message="Latest submissions across logs and commissions"
          details={
            recentActivity.length
              ? recentActivity
                  .map(
                    (activity) =>
                      `${activity.description} — ${activity.user} (${activity.timestamp.toLocaleDateString()})`
                  )
                  .join('\n')
              : 'No submissions recorded in the last few days.'
          }
          suggestions={
            recentActivity.length
              ? [
                  'Open the activity feed for details',
                  'Audit any anomalies directly from the logs view',
                ]
              : [
                  'Encourage captains to submit their logs',
                  'Confirm CRM sync and job imports',
                ]
          }
        />
      </div>
    </div>
  );
}
