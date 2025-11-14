'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { PerformanceRankings } from '@/components/features/dashboard/performance-rankings';

export const dynamic = 'force-dynamic';

export default function RankingsPage() {
  return (
    <ProtectedRoute>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
              Performance Rankings
            </h1>
            <p className="text-muted-foreground">
              See how you stack up against your teammates and strive for
              excellence.
            </p>
          </div>

          <PerformanceRankings />
        </div>
      </div>
    </ProtectedRoute>
  );
}
