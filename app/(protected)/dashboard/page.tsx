'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSession } from '@/hooks/useSession';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DesktopDashboard } from '@/components/features/desktop/desktop-dashboard';
import { ManagerDesktopDashboard } from '@/components/features/desktop/manager-desktop-dashboard';
import { CaptainDesktopDashboard } from '@/components/features/desktop/captain-desktop-dashboard';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { user } = useSession();
  const { metrics, roleMetrics, loading, error } = useDashboardData(
    user?.roles
  );

  // Determine which dashboard to show based on user roles
  const renderDashboard = () => {
    if (!user?.roles) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Loading...</h1>
            <p className="text-muted-foreground">Preparing your dashboard</p>
          </div>
        </div>
      );
    }

    // Priority order: Admin > Manager > Sales > Captain
    if (user.roles.includes('admin')) {
      return (
        <DesktopDashboard
          metrics={metrics}
          roleMetrics={roleMetrics}
          loading={loading}
          error={error}
          user={user}
        />
      );
    } else if (user.roles.includes('manager')) {
      return (
        <ManagerDesktopDashboard
          metrics={metrics}
          roleMetrics={roleMetrics}
          loading={loading}
          error={error}
          user={user}
        />
      );
    } else if (user.roles.includes('captain')) {
      return (
        <CaptainDesktopDashboard
          metrics={metrics}
          roleMetrics={roleMetrics}
          loading={loading}
          error={error}
          user={user}
        />
      );
    } else {
      // Default fallback for other roles
      return (
        <CaptainDesktopDashboard
          metrics={metrics}
          roleMetrics={roleMetrics}
          loading={loading}
          error={error}
          user={user}
        />
      );
    }
  };

  return (
    <ProtectedRoute>
      {/* Desktop-first full-screen dashboard - no wrapper needed */}
      {renderDashboard()}
    </ProtectedRoute>
  );
}
