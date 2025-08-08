"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { MetricCardDemo } from '@/components/brand/metric-card-demo'
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MetricCardsExamplePage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#026937]">
              Enhanced Metric Cards
            </h1>
            <p className="text-muted-foreground">
              Demonstration of the new MetricCard component with real data integration
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Component Features</CardTitle>
            <CardDescription>
              The enhanced MetricCard component includes the following features:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#026937] rounded-full" />
                Real-time data integration with loading states
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#026937] rounded-full" />
                Trend indicators with percentage changes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#026937] rounded-full" />
                Brand-consistent color theming (Green, Orange, Blue, Purple)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#026937] rounded-full" />
                Contextual footer information
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#026937] rounded-full" />
                Error handling and empty states
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#026937] rounded-full" />
                Responsive design with container queries
              </li>
            </ul>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Component Examples</h2>
          <MetricCardDemo />
        </div>
      </div>
    </ProtectedRoute>
  )
}