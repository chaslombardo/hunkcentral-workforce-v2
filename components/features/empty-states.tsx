'use client';

import * as React from 'react';
import {
  FileText,
  BarChart3,
  ClipboardList,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { usePerformanceMonitor } from '@/lib/performance-monitor';

// Lazy load illustrations to reduce initial bundle size
const LogsIllustration = React.lazy(() =>
  import('@/components/ui/empty-state-illustrations').then((module) => ({
    default: module.LogsIllustration,
  }))
);

const CommissionIllustration = React.lazy(() =>
  import('@/components/ui/empty-state-illustrations').then((module) => ({
    default: module.CommissionIllustration,
  }))
);

const ReportsIllustration = React.lazy(() =>
  import('@/components/ui/empty-state-illustrations').then((module) => ({
    default: module.ReportsIllustration,
  }))
);

const UsersIllustration = React.lazy(() =>
  import('@/components/ui/empty-state-illustrations').then((module) => ({
    default: module.UsersIllustration,
  }))
);

const SearchIllustration = React.lazy(() =>
  import('@/components/ui/empty-state-illustrations').then((module) => ({
    default: module.SearchIllustration,
  }))
);

const WelcomeIllustration = React.lazy(() =>
  import('@/components/ui/empty-state-illustrations').then((module) => ({
    default: module.WelcomeIllustration,
  }))
);

// Fallback component for lazy-loaded illustrations
const IllustrationFallback = () => (
  <div
    className="w-48 h-48 bg-muted/20 rounded-lg animate-pulse"
    aria-hidden="true"
    role="img"
    aria-label="Loading illustration"
  />
);

// Logs Empty States
export const NoLogsEmptyState = React.memo(function NoLogsEmptyState({
  onCreateLog,
}: {
  onCreateLog?: () => void;
}) {
  const monitor = usePerformanceMonitor('NoLogsEmptyState');
  const startMarkRef = React.useRef<string>('');

  React.useLayoutEffect(() => {
    startMarkRef.current = monitor.startRender();
  });

  React.useLayoutEffect(() => {
    monitor.endRender(startMarkRef.current);
  });

  return (
    <EmptyState
      illustration={
        <React.Suspense fallback={<IllustrationFallback />}>
          <LogsIllustration />
        </React.Suspense>
      }
      title="No logs found"
      description="Get started by creating your first daily log. Track jobs, hours, and revenue all in one place."
      action={
        onCreateLog
          ? {
              label: 'Create First Log',
              onClick: onCreateLog,
            }
          : {
              label: 'Create First Log',
              href: '/logs/create',
            }
      }
      secondaryAction={{
        label: 'Coming Soon',
        onClick: () => {},
        variant: 'outline',
        disabled: true,
      }}
      size="lg"
      variant="card"
    />
  );
});

export const NoLogResultsEmptyState = React.memo(
  function NoLogResultsEmptyState({
    onClearFilters,
  }: {
    onClearFilters?: () => void;
  }) {
    return (
      <EmptyState
        illustration={
          <React.Suspense fallback={<IllustrationFallback />}>
            <SearchIllustration />
          </React.Suspense>
        }
        title="No logs match your search"
        description="Try adjusting your filters or search terms to find what you're looking for."
        action={
          onClearFilters
            ? {
                label: 'Clear Filters',
                onClick: onClearFilters,
                variant: 'outline',
              }
            : undefined
        }
        size="md"
      />
    );
  }
);

// Commission Empty States
export const NoCommissionsEmptyState = React.memo(
  function NoCommissionsEmptyState({
    onCreateCommission,
  }: {
    onCreateCommission?: () => void;
  }) {
    return (
      <EmptyState
        illustration={
          <React.Suspense fallback={<IllustrationFallback />}>
            <CommissionIllustration />
          </React.Suspense>
        }
        title="No commissions tracked yet"
        description="Start tracking your sales commissions to see how your bookings convert to revenue."
        action={
          onCreateCommission
            ? {
                label: 'Add Commission',
                onClick: onCreateCommission,
              }
            : {
                label: 'Add Commission',
                href: '/commission/create',
              }
        }
        secondaryAction={{
          label: 'Coming Soon',
          onClick: () => {},
          variant: 'outline',
          disabled: true,
        }}
        size="lg"
        variant="card"
      />
    );
  }
);

export const NoCommissionMatchesEmptyState = React.memo(
  function NoCommissionMatchesEmptyState() {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No commission matches found"
        description="Your commission entries will automatically match to approved logs when job IDs align."
        size="md"
      />
    );
  }
);

// Reports Empty States
export function NoPayrollDataEmptyState({
  onRefresh,
}: {
  onRefresh?: () => void;
}) {
  return (
    <EmptyState
      illustration={<ReportsIllustration />}
      title="No payroll data available"
      description="Payroll reports will appear here once logs are submitted and approved for this pay period."
      action={
        onRefresh
          ? {
              label: 'Refresh Data',
              onClick: onRefresh,
              variant: 'outline',
            }
          : undefined
      }
      size="lg"
      variant="card"
    />
  );
}

export function NoReportDataEmptyState({ reportType }: { reportType: string }) {
  return (
    <EmptyState
      icon={BarChart3}
      title={`No ${reportType} data found`}
      description="Data will appear here once there are approved logs and activities for the selected time period."
      size="md"
    />
  );
}

// User Management Empty States
export function NoUsersEmptyState({ onAddUser }: { onAddUser?: () => void }) {
  return (
    <EmptyState
      illustration={<UsersIllustration />}
      title="No users found"
      description="Add team members to get started with user management and role assignments."
      action={
        onAddUser
          ? {
              label: 'Add First User',
              onClick: onAddUser,
            }
          : {
              label: 'Add First User',
              href: '/admin/users/create',
            }
      }
      size="lg"
      variant="card"
    />
  );
}

export function NoUserResultsEmptyState({
  onClearSearch,
}: {
  onClearSearch?: () => void;
}) {
  return (
    <EmptyState
      illustration={<SearchIllustration />}
      title="No users match your search"
      description="Try different search terms or check if the user exists in the system."
      action={
        onClearSearch
          ? {
              label: 'Clear Search',
              onClick: onClearSearch,
              variant: 'outline',
            }
          : undefined
      }
      size="md"
    />
  );
}

// Dashboard Empty States
export function NoDashboardDataEmptyState() {
  return (
    <EmptyState
      illustration={<WelcomeIllustration />}
      title="Welcome to HUNKCentral"
      description="Your dashboard will show key metrics and recent activity once you start logging work and tracking performance."
      action={{
        label: 'Create Your First Log',
        href: '/logs/create',
      }}
      secondaryAction={{
        label: 'Coming Soon',
        onClick: () => {},
        variant: 'outline',
        disabled: true,
      }}
      size="lg"
      variant="card"
    />
  );
}

// Audit Empty States
export function NoAuditDataEmptyState() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="No audit records found"
      description="Audit trails will appear here as users create, edit, and approve logs and other activities."
      size="md"
    />
  );
}

// Generic Empty States
export function GenericEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon: Icon = FileText,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: typeof FileText;
}) {
  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={description}
      action={
        actionLabel
          ? onAction
            ? {
                label: actionLabel,
                onClick: onAction,
              }
            : actionHref
              ? {
                  label: actionLabel,
                  href: actionHref,
                }
              : undefined
          : undefined
      }
      size="md"
    />
  );
}

// Loading Empty State (for when data is being fetched)
export function LoadingEmptyState({
  message = 'Loading data...',
}: {
  message?: string;
}) {
  return (
    <EmptyState
      icon={RefreshCw}
      title={message}
      description="Please wait while we fetch your information."
      size="md"
      className="animate-pulse"
    />
  );
}
