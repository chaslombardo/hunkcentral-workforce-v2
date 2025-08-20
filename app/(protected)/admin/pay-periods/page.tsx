import { Suspense } from 'react';
import { PayPeriodManager } from '@/components/features/admin/pay-period-manager';
import { PayPeriodSummaryTiles } from '@/components/features/admin/pay-period-summary-tiles';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function PayPeriodsPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Suspense fallback={<PayPeriodSummaryTilesSkeleton />}>
        <PayPeriodSummaryTiles />
      </Suspense>
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Pay Period Management</CardTitle>
            <CardDescription>
              Manage pay periods and control when data can be modified for
              payroll processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<PayPeriodManagerSkeleton />}>
              <PayPeriodManager />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function PayPeriodSummaryTilesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-16" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PayPeriodManagerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
