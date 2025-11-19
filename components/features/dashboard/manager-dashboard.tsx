'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/hooks/useSession';
import { BrandLoader } from '@/components/ui/brand-loader';
import { ManagerSectionCards } from './manager-section-cards';
import { ManagerChartAreaInteractive } from './manager-chart-area-interactive';
import { ManagerDataTable } from './manager-data-table';

export function ManagerDashboard() {
  const { user } = useSession();
  const { roleMetrics, loading, error } = useDashboardData(user?.roles);

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <BrandLoader label="Loading manager metrics..." fullScreen size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
              <p className="font-semibold text-destructive">
                Unable to load manager dashboard
              </p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Manager Metrics Cards - Using dashboard-01 SectionCards pattern with manager-specific features */}
        <ManagerSectionCards metrics={roleMetrics?.manager} />

        {/* Team Performance Chart - Using dashboard-01 ChartAreaInteractive pattern */}
        <div className="px-4 lg:px-6">
          <ManagerChartAreaInteractive metrics={roleMetrics?.manager} />
        </div>

        {/* Pending Approvals Table - Using dashboard-01 DataTable pattern with bulk operations */}
        <ManagerDataTable metrics={roleMetrics?.manager} />
      </div>
    </div>
  );
}
