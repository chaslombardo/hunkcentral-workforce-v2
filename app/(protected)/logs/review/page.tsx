import { Suspense } from 'react';
import { LogReviewQueue } from '@/components/features/logs/log-review-queue';
import { Skeleton } from '@/components/ui/skeleton';
import LogErrorBoundary, { DatabaseErrorFallback } from '@/components/ui/log-error-boundary';

export default function LogReviewPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Review</h1>
          <p className="text-muted-foreground">
            Review and approve submitted daily logs
          </p>
        </div>
      </div>

      <LogErrorBoundary fallback={DatabaseErrorFallback}>
        <Suspense fallback={<LogReviewSkeleton />}>
          <LogReviewQueue />
        </Suspense>
      </LogErrorBoundary>
    </div>
  );
}

function LogReviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}