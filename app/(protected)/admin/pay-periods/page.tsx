import { Suspense } from 'react';
import { PayPeriodManager } from '@/components/features/admin/pay-period-manager';
import { PayPeriodSummaryTiles } from '@/components/features/admin/pay-period-summary-tiles';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function PayPeriodsPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-6 lg:p-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-hunks-green/5 via-background to-hunks-orange/5 rounded-lg p-6 border border-hunks-green/10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-hunks-green mb-3">
            Pay Period Management
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Manage pay periods and control when data can be modified for payroll
            processing
          </p>
        </div>
      </div>

      {/* Summary Tiles */}
      <Suspense fallback={<PayPeriodSummaryTilesSkeleton />}>
        <PayPeriodSummaryTiles />
      </Suspense>

      {/* Main Content */}
      <div className="min-h-[60vh] flex-1 rounded-xl">
        <Card className="h-full border-hunks-green/20 bg-gradient-to-br from-hunks-green/5 via-background to-transparent">
          <CardContent className="p-8">
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
