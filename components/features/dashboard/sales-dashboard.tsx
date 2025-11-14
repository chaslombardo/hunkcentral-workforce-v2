'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/hooks/useSession';
import { SalesSectionCards } from './sales-section-cards';
import { SalesChartAreaInteractive } from './sales-chart-area-interactive';
import { SalesDataTable } from './sales-data-table';

export function SalesDashboard() {
  const { user } = useSession();
  const { metrics, roleMetrics, loading, error } = useDashboardData(
    user?.roles
  );

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="animate-pulse">
            <div className="*:data-[slot=card]:from-hunks-green/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg" />
              ))}
            </div>
          </div>
          <div className="px-4 lg:px-6">
            <div className="h-64 bg-muted rounded-lg animate-pulse" />
          </div>
          <div className="px-4 lg:px-6">
            <div className="h-96 bg-muted rounded-lg animate-pulse" />
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
