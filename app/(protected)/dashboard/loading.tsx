export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header Skeleton */}
      <div className="border-b bg-background p-4">
        <div className="mx-auto max-w-7xl animate-pulse">
          <div className="h-6 w-32 rounded bg-muted"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Page Title */}
          <div className="h-8 w-48 animate-pulse rounded bg-muted"></div>

          {/* Stats Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-muted"
              ></div>
            ))}
          </div>

          {/* Chart Row */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-80 animate-pulse rounded-lg bg-muted"></div>
            <div className="h-80 animate-pulse rounded-lg bg-muted"></div>
          </div>

          {/* Table Section */}
          <div className="h-96 animate-pulse rounded-lg bg-muted"></div>
        </div>
      </div>
    </div>
  );
}
