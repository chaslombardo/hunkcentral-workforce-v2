'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/hooks/useSession';
import { BrandLoader } from '@/components/ui/brand-loader';
import { WingmanSectionCards } from './wingman-section-cards';
import { Card } from '@/components/ui/card';
import { Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

export function WingmanDashboard() {
  const { user } = useSession();
  const { roleMetrics, loading, error } = useDashboardData(user?.roles);

  if (loading) {
    return (
      <div className="@container/main flex flex-1 flex-col gap-2">
        <BrandLoader label="Loading your pay details..." fullScreen size="lg" />
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
                Unable to load wingman dashboard
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
        {/* Wingman Pay Metrics Cards */}
        <WingmanSectionCards metrics={roleMetrics?.wingman} />

        {/* Quick Actions */}
        <div className="px-4 lg:px-6">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-hunks-green" />
                Quick Actions
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                View your pay history and details
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                asChild
                variant="outline"
                className="justify-start h-auto py-3"
              >
                <Link href={ROUTES.MY_PAYROLL}>
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>View My Payroll</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="justify-start h-auto py-3"
              >
                <Link href={ROUTES.LOGS}>
                  <FileText className="h-4 w-4 mr-2" />
                  <span>View My Logs</span>
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Pay Period Info */}
        <div className="px-4 lg:px-6">
          <Card className="p-6 bg-gradient-to-br from-hunks-green/5 to-hunks-orange/5 border-hunks-green/20">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-hunks-green/10 p-3">
                <Calendar className="h-6 w-6 text-hunks-green" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-hunks-green mb-2">
                  Current Pay Period
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Earnings:
                    </span>
                    <span className="font-semibold">
                      $
                      {(roleMetrics?.wingman?.totalCompensation || 0).toFixed(
                        2
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours Worked:</span>
                    <span className="font-semibold">
                      {roleMetrics?.wingman?.currentPayPeriodHours || 0} hrs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Effective Rate:
                    </span>
                    <span className="font-semibold text-hunks-green">
                      $
                      {(roleMetrics?.wingman?.effectiveHourlyRate || 0).toFixed(
                        2
                      )}
                      /hr
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-hunks-green/20">
                  <p className="text-xs text-muted-foreground">
                    Keep up the great work! Your effective hourly rate includes
                    all your base pay, tips, and overtime earnings.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
