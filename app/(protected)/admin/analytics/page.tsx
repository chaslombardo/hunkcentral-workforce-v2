import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PerformanceMonitor } from '@/components/performance-monitor';
import {
  BarChart3,
  MessageSquare,
  TestTube,
  TrendingUp,
  Users,
  Clock,
} from 'lucide-react';
import dynamicImport from 'next/dynamic';

export const dynamic = 'force-dynamic';

// Lazy load heavy dashboard components
const AnalyticsDashboard = dynamicImport(() =>
  import('@/components/features/admin/analytics-dashboard').then((mod) => ({
    default: mod.AnalyticsDashboard,
  }))
);

const FeedbackManager = dynamicImport(() =>
  import('@/components/features/admin/feedback-manager').then((mod) => ({
    default: mod.FeedbackManager,
  }))
);

const ABTestManager = dynamicImport(() =>
  import('@/components/features/admin/ab-test-manager').then((mod) => ({
    default: mod.ABTestManager,
  }))
);

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session?.user || !session.user.roles?.includes('admin')) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PerformanceMonitor
        pageName="/admin/analytics"
        userId={session.user.id}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics & Feedback
          </h1>
          <p className="text-muted-foreground">
            Monitor user behavior, performance metrics, and feedback to improve
            HUNKCentral
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,231</div>
            <p className="text-xs text-muted-foreground">+8% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Load Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-muted-foreground">
              -0.3s from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">5 high priority</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="ab-tests" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            A/B Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <Suspense fallback={<div>Loading analytics...</div>}>
            <AnalyticsDashboard />
          </Suspense>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Suspense fallback={<div>Loading feedback...</div>}>
            <FeedbackManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="ab-tests" className="space-y-4">
          <Suspense fallback={<div>Loading A/B tests...</div>}>
            <ABTestManager />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
