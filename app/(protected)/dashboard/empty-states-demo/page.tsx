"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  NoLogsEmptyState,
  NoLogResultsEmptyState,
  NoCommissionsEmptyState,
  NoCommissionMatchesEmptyState,
  NoPayrollDataEmptyState,
  NoReportDataEmptyState,
  NoUsersEmptyState,
  NoUserResultsEmptyState,
  NoDashboardDataEmptyState,
  NoAuditDataEmptyState,
  GenericEmptyState,
  LoadingEmptyState
} from "@/components/features/empty-states"

export default function EmptyStatesDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Empty States Demo</h1>
        <p className="text-muted-foreground">
          Showcase of all empty state components with engaging illustrations and helpful messaging.
        </p>
      </div>

      <Separator />

      {/* Logs Empty States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Logs Empty States</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>No Logs Found</CardTitle>
              <CardDescription>First-time user experience</CardDescription>
            </CardHeader>
            <CardContent>
              <NoLogsEmptyState />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>No Search Results</CardTitle>
              <CardDescription>When filters return no results</CardDescription>
            </CardHeader>
            <CardContent>
              <NoLogResultsEmptyState />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Commission Empty States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Commission Empty States</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>No Commissions</CardTitle>
              <CardDescription>Sales consultant first experience</CardDescription>
            </CardHeader>
            <CardContent>
              <NoCommissionsEmptyState />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>No Commission Matches</CardTitle>
              <CardDescription>When no automatic matches are found</CardDescription>
            </CardHeader>
            <CardContent>
              <NoCommissionMatchesEmptyState />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Reports Empty States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Reports Empty States</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>No Payroll Data</CardTitle>
              <CardDescription>When no data exists for pay period</CardDescription>
            </CardHeader>
            <CardContent>
              <NoPayrollDataEmptyState />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>No Report Data</CardTitle>
              <CardDescription>Generic report empty state</CardDescription>
            </CardHeader>
            <CardContent>
              <NoReportDataEmptyState reportType="analytics" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Management Empty States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">User Management Empty States</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>No Users</CardTitle>
              <CardDescription>Admin first-time setup</CardDescription>
            </CardHeader>
            <CardContent>
              <NoUsersEmptyState />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>No User Search Results</CardTitle>
              <CardDescription>When search returns no matches</CardDescription>
            </CardHeader>
            <CardContent>
              <NoUserResultsEmptyState />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dashboard & General Empty States */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Dashboard & General Empty States</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Welcome Dashboard</CardTitle>
              <CardDescription>New user dashboard experience</CardDescription>
            </CardHeader>
            <CardContent>
              <NoDashboardDataEmptyState />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>No Audit Data</CardTitle>
              <CardDescription>Audit trail empty state</CardDescription>
            </CardHeader>
            <CardContent>
              <NoAuditDataEmptyState />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading State</CardTitle>
              <CardDescription>While data is being fetched</CardDescription>
            </CardHeader>
            <CardContent>
              <LoadingEmptyState />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Size Variations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Size Variations</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Small Size</CardTitle>
              <CardDescription>Compact empty state</CardDescription>
            </CardHeader>
            <CardContent>
              <GenericEmptyState
                title="Small Empty State"
                description="Compact version for tight spaces"
                actionLabel="Action"
                onAction={() => {}}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medium Size (Default)</CardTitle>
              <CardDescription>Standard empty state</CardDescription>
            </CardHeader>
            <CardContent>
              <GenericEmptyState
                title="Medium Empty State"
                description="Standard size for most use cases with balanced spacing"
                actionLabel="Action"
                onAction={() => {}}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Large Size</CardTitle>
              <CardDescription>Prominent empty state</CardDescription>
            </CardHeader>
            <CardContent>
              <GenericEmptyState
                title="Large Empty State"
                description="Larger version for prominent placement and first-time user experiences"
                actionLabel="Action"
                onAction={() => {}}
              />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}