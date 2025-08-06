"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

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
  )
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number } = {}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton data-testid="skeleton" className="h-8 w-48" />
        <Skeleton data-testid="skeleton" className="h-8 w-32" />
      </div>
      <div className="border rounded-lg">
        <div className="p-4 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton data-testid="skeleton" key={j} className="h-4 w-20" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}