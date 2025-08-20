'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function LogFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton data-testid="skeleton" className="h-6 w-48" />
          <Skeleton data-testid="skeleton" className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton data-testid="skeleton" className="h-10 w-full" />
            <Skeleton data-testid="skeleton" className="h-10 w-full" />
          </div>
          <Skeleton data-testid="skeleton" className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  branded = false,
  showHeader = true,
  showFilters = true,
}: {
  rows?: number;
  columns?: number;
  branded?: boolean;
  showHeader?: boolean;
  showFilters?: boolean;
} = {}) {
  return (
    <div className="space-y-4">
      {/* Header and filters */}
      {showFilters && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <Skeleton data-testid="skeleton" className="h-10 w-64" />
            <Skeleton data-testid="skeleton" className="h-10 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton data-testid="skeleton" className="h-10 w-24" />
            <Skeleton data-testid="skeleton" className="h-10 w-20" />
          </div>
        </div>
      )}

      {/* Table */}
      <div
        className={cn(
          'border rounded-lg overflow-hidden',
          branded && 'border-hunks-green-200'
        )}
      >
        {/* Table Header */}
        {showHeader && (
          <div
            className={cn(
              'p-4 border-b',
              branded
                ? 'bg-hunks-green-50 border-hunks-green-200'
                : 'bg-muted/50'
            )}
          >
            <div className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton
                  data-testid="skeleton"
                  key={j}
                  className={cn('h-4 w-20', branded && 'bg-hunks-green-200/50')}
                />
              ))}
            </div>
          </div>
        )}

        {/* Table Body */}
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton
                  data-testid="skeleton"
                  key={j}
                  className={cn('h-4 w-20', branded && 'bg-hunks-green-100/50')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <Skeleton data-testid="skeleton" className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton data-testid="skeleton" className="h-8 w-8" />
          <Skeleton data-testid="skeleton" className="h-8 w-8" />
          <Skeleton data-testid="skeleton" className="h-4 w-16" />
          <Skeleton data-testid="skeleton" className="h-8 w-8" />
          <Skeleton data-testid="skeleton" className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function PayrollTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-hunks-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton data-testid="skeleton" className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton data-testid="skeleton" className="h-8 w-16 mb-2" />
              <Skeleton data-testid="skeleton" className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <TableSkeleton rows={8} columns={9} branded={true} />
    </div>
  );
}

export function CommissionTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4 border-l-hunks-orange">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton data-testid="skeleton" className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton data-testid="skeleton" className="h-8 w-16 mb-2" />
              <Skeleton data-testid="skeleton" className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <TableSkeleton rows={6} columns={11} branded={true} />
    </div>
  );
}

export function LogReviewTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton data-testid="skeleton" className="h-6 w-48" />
        <Skeleton data-testid="skeleton" className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <TableSkeleton rows={8} columns={9} branded={true} />
      </CardContent>
    </Card>
  );
}

export function RankingsPageSkeleton() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton data-testid="skeleton" className="h-8 w-64 mb-2" />
          <Skeleton data-testid="skeleton" className="h-4 w-96" />
        </div>
        <Skeleton data-testid="skeleton" className="h-10 w-32" />
      </div>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
          <Skeleton data-testid="skeleton" className="h-8 w-20" />
          <Skeleton data-testid="skeleton" className="h-8 w-24" />
          <Skeleton data-testid="skeleton" className="h-8 w-24" />
        </div>

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton data-testid="skeleton" className="h-4 w-24" />
                <Skeleton data-testid="skeleton" className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton data-testid="skeleton" className="h-8 w-16 mb-2" />
                <Skeleton data-testid="skeleton" className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rankings Table */}
        <Card>
          <CardHeader>
            <Skeleton data-testid="skeleton" className="h-6 w-48" />
            <Skeleton data-testid="skeleton" className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Skeleton
                      data-testid="skeleton"
                      className="h-8 w-8 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Skeleton data-testid="skeleton" className="h-5 w-32" />
                        {i === 0 && (
                          <Skeleton
                            data-testid="skeleton"
                            className="h-5 w-20 rounded-full"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton data-testid="skeleton" className="h-3 w-16" />
                        <Skeleton data-testid="skeleton" className="h-3 w-20" />
                        <Skeleton data-testid="skeleton" className="h-3 w-18" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Skeleton
                        data-testid="skeleton"
                        className="h-5 w-20 mb-1"
                      />
                      <Skeleton data-testid="skeleton" className="h-3 w-16" />
                    </div>
                    <Skeleton data-testid="skeleton" className="h-8 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function RankingsTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton data-testid="skeleton" className="h-4 w-24" />
              <Skeleton data-testid="skeleton" className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton data-testid="skeleton" className="h-8 w-20 mb-2" />
              <Skeleton data-testid="skeleton" className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rankings List */}
      <Card>
        <CardHeader>
          <Skeleton data-testid="skeleton" className="h-6 w-40" />
          <Skeleton data-testid="skeleton" className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Skeleton
                    data-testid="skeleton"
                    className="h-8 w-8 rounded-full"
                  />
                  <div>
                    <Skeleton
                      data-testid="skeleton"
                      className="h-5 w-28 mb-2"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Skeleton data-testid="skeleton" className="h-3 w-12" />
                      <Skeleton data-testid="skeleton" className="h-3 w-16" />
                      <Skeleton data-testid="skeleton" className="h-3 w-14" />
                      <Skeleton data-testid="skeleton" className="h-3 w-12" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <Skeleton
                      data-testid="skeleton"
                      className="h-5 w-20 mb-1"
                    />
                    <Skeleton data-testid="skeleton" className="h-3 w-16" />
                  </div>
                  <Skeleton data-testid="skeleton" className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
