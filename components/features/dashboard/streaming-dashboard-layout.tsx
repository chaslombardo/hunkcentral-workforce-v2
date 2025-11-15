'use client';

import { Suspense } from 'react';
import {
  SkeletonCard,
  SkeletonChart,
  SkeletonTable,
} from '@/components/ui/skeleton-card';

interface StreamingDashboardLayoutProps {
  children: React.ReactNode;
}

export function StreamingDashboardLayout({
  children,
}: StreamingDashboardLayoutProps) {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Stats Cards - Critical Above-the-Fold Content */}
        <Suspense
          fallback={
            <div className="px-4 lg:px-6">
              <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={`stats-${i}`} />
                ))}
              </div>
            </div>
          }
        >
          {children}
        </Suspense>

        {/* Charts - Important but can load slightly later */}
        <Suspense
          fallback={
            <div className="px-4 lg:px-6">
              <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2">
                <SkeletonChart />
                <SkeletonChart />
              </div>
            </div>
          }
        >
          {/* Will be replaced by actual chart components */}
        </Suspense>

        {/* Data Tables - Can load last */}
        <Suspense
          fallback={
            <div className="px-4 lg:px-6">
              <SkeletonTable />
            </div>
          }
        >
          {/* Will be replaced by actual table components */}
        </Suspense>
      </div>
    </div>
  );
}
