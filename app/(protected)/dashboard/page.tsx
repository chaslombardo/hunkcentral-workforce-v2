// Dashboard page
'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import { useSession } from '@/hooks/useSession';
import { MainLayout } from '@/components/layout/main-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useSession();

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.fullName}! Your roles: {user?.roles.join(', ')}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              Sign Out
            </Button>
          </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Commission Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Awaiting match</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">System users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Current Pay Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Open</div>
              <p className="text-xs text-muted-foreground">Status</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {user?.roles.includes('captain') && (
                <Button asChild className="w-full justify-start">
                  <Link href="/logs/create">Create Daily Log</Link>
                </Button>
              )}
              {user?.roles.includes('sales') && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/commission/create">Add Commission Entry</Link>
                </Button>
              )}
              {(user?.roles.includes('manager') || user?.roles.includes('admin')) && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/logs/review">Review Logs</Link>
                </Button>
              )}
              {user?.roles.includes('admin') && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/admin/users">Manage Users</Link>
                </Button>
              )}
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
      </div>
    </MainLayout>
    </ProtectedRoute>
  );
}
