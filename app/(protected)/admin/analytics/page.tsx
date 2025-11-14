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
    <div className="container mx-auto py-8 space-y-8">
      <PerformanceMonitor
        pageName="/admin/analytics"
        userId={session.user.id}
      />

      <div className="bg-gradient-to-r from-hunks-green/5 via-background to-hunks-orange/5 rounded-lg p-6 border border-hunks-green/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-hunks-green mb-3">
              Analytics & Feedback
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Monitor user behavior, performance metrics, and feedback to
              improve HUNKCentral
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-hunks-green bg-gradient-to-br from-hunks-green/5 via-background to-transparent hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-hunks-green">
              Active Users
            </CardTitle>
            <Users className="h-5 w-5 text-hunks-green" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-hunks-green mb-1">
              1,234
            </div>
            <p className="text-sm text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-hunks-orange bg-gradient-to-br from-hunks-orange/5 via-background to-transparent hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-hunks-orange">
              Page Views
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-hunks-orange" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-hunks-orange mb-1">
              45,231
            </div>
            <p className="text-sm text-muted-foreground">+8% from last week</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-500/5 via-background to-transparent hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Avg Load Time
            </CardTitle>
            <Clock className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">1.2s</div>
            <p className="text-sm text-muted-foreground">
              -0.3s from last week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-500/5 via-background to-transparent hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">
              Open Feedback
            </CardTitle>
            <MessageSquare className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-1">23</div>
            <p className="text-sm text-muted-foreground">5 high priority</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-2 data-[state=active]:bg-hunks-green data-[state=active]:text-white transition-all duration-300"
          >
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="feedback"
            className="flex items-center gap-2 data-[state=active]:bg-hunks-green data-[state=active]:text-white transition-all duration-300"
          >
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger
            value="ab-tests"
            className="flex items-center gap-2 data-[state=active]:bg-hunks-green data-[state=active]:text-white transition-all duration-300"
          >
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
