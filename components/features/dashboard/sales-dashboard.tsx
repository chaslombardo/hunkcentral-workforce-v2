'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/hooks/useSession';
import { BrandLoader } from '@/components/ui/brand-loader';
import { SalesSectionCards } from './sales-section-cards';
import { SalesChartAreaInteractive } from './sales-chart-area-interactive';
import { SalesDataTable } from './sales-data-table';

export function SalesDashboard() {
  const { user } = useSession();
  const { roleMetrics, loading, error } = useDashboardData(user?.roles);

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <BrandLoader label="Loading sales insights..." fullScreen size="lg" />
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
                Unable to load sales dashboard
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
        {/* Sales Metrics Cards - Using dashboard-01 SectionCards pattern with sales-specific features */}
        <SalesSectionCards metrics={roleMetrics?.sales} />

        {/* Commission Pipeline Chart - Using dashboard-01 ChartAreaInteractive pattern */}
        <div className="px-4 lg:px-6">
          <SalesChartAreaInteractive metrics={roleMetrics?.sales} />
        </div>

        {/* Commission Status Table - Using dashboard-01 DataTable pattern with commission tracking */}
        <SalesDataTable metrics={roleMetrics?.sales} />
      </div>
    </div>
  );
}
