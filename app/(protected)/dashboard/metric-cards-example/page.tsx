import { MetricCardDemo } from "@/components/brand/metric-card-demo"

export default function MetricCardsExamplePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Enhanced Metric Cards
        </h1>
        <p className="text-muted-foreground">
          Brand-consistent metric cards built with shadcn/ui components and College Hunks brand colors.
        </p>
      </div>
      
      <MetricCardDemo />
    </div>
  )
}