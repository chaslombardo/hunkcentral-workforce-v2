"use client"

import { ProtectedRoute } from '@/components/auth/protected-route'
import { useSession } from '@/hooks/useSession'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, DollarSign, BarChart3, Users } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useSession()

  const getQuickActions = () => {
    const actions = []
    
    if (user?.roles?.includes('captain') || user?.roles?.includes('admin')) {
      actions.push({
        title: "Create Daily Log",
        description: "Record today&apos;s jobs and team hours",
        href: "/logs/create",
        icon: ClipboardList,
        color: "bg-[#026937] hover:bg-[#026937]/90",
      })
    }

    if (user?.roles?.includes('sales') || user?.roles?.includes('admin')) {
      actions.push({
        title: "Add Commission",
        description: "Track new job bookings",
        href: "/commission/create",
        icon: DollarSign,
        color: "bg-[#ea7200] hover:bg-[#ea7200]/90",
      })
    }

    if (user?.roles?.includes('manager') || user?.roles?.includes('admin')) {
      actions.push({
        title: "Review Logs",
        description: "Approve pending daily logs",
        href: "/logs/review",
        icon: BarChart3,
        color: "bg-blue-600 hover:bg-blue-700",
      })
    }

    if (user?.roles?.includes('admin')) {
      actions.push({
        title: "Manage Users",
        description: "Add and configure employees",
        href: "/admin/users",
        icon: Users,
        color: "bg-purple-600 hover:bg-purple-700",
      })
    }

    return actions
  }

  const quickActions = getQuickActions()

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#026937]">
            Welcome back, {user?.fullName || 'User'}!
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your workforce today.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Logs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Entries</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                System users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Pay Period</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Open</div>
              <p className="text-xs text-muted-foreground">
                Status
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => (
                  <Button 
                    key={action.title} 
                    asChild 
                    className={`w-full justify-start ${action.color} text-white`}
                  >
                    <Link href={action.href} className="flex items-center gap-2">
                      <action.icon className="h-4 w-4" />
                      {action.title}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Activity feed will be available once data is populated.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
