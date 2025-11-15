'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/hooks/useSession';
import { AdminSectionCards } from './admin-section-cards';
import { AdminChartAreaInteractive } from './admin-chart-area-interactive';
import { AdminDataTable } from './admin-data-table';
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
} from '@/components/ui/skeleton-card';

export function AdminDashboard() {
  const { user } = useSession();
  const { metrics, roleMetrics, loading, error } = useDashboardData(
    user?.roles
  );

  // Show skeleton instantly while data loads
  if (loading && !metrics && !roleMetrics) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="text-center py-8">
              <p className="text-destructive">
                Error loading dashboard: {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Admin Metrics Cards - Using dashboard-01 SectionCards pattern with admin-specific features */}
        <AdminSectionCards metrics={roleMetrics?.admin} />

        {/* System Performance Chart - Using dashboard-01 ChartAreaInteractive pattern */}
        <div className="px-4 lg:px-6">
          <AdminChartAreaInteractive metrics={roleMetrics?.admin} />
        </div>

        {/* System Activity & Audit Log - Using dashboard-01 DataTable pattern with system monitoring */}
        <AdminDataTable metrics={roleMetrics?.admin} />
      </div>
    </div>
  );
}
