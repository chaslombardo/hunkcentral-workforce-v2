'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/hooks/useSession';
import { BrandLoader } from '@/components/ui/brand-loader';
import { CaptainSectionCards } from './captain-section-cards';
import { CaptainChartAreaInteractive } from './captain-chart-area-interactive';
import { CaptainDataTable } from './captain-data-table';

export function CaptainDashboard() {
  const { user } = useSession();
  const { roleMetrics, loading, error } = useDashboardData(user?.roles);

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <BrandLoader label="Loading captain stats..." fullScreen size="lg" />
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
                Unable to load captain dashboard
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
        {/* Captain Metrics Cards - Using dashboard-01 SectionCards pattern with College Hunks branding */}
        <CaptainSectionCards metrics={roleMetrics?.captain} />

        {/* Labor Cost Chart - Using dashboard-01 ChartAreaInteractive pattern */}
        <div className="px-4 lg:px-6">
          <CaptainChartAreaInteractive metrics={roleMetrics?.captain} />
        </div>

        {/* Job History Table - Using dashboard-01 DataTable pattern */}
        <CaptainDataTable metrics={roleMetrics?.captain} />
      </div>
    </div>
  );
}
