'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, RefreshCw } from 'lucide-react';

interface AnalyticsData {
  userInteractionPatterns: {
    sessionDuration: number;
    commonClickTargets: Array<{
      element: string;
      count: number;
    }>;
    navigationPaths: Array<{
      path: string;
      frequency: number;
      count: number;
    }>;
  };
  performanceMetrics: Array<{
    name: string;
    value: number;
    change: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    bounceRate: number;
    avgTime: number;
  }>;
  errorRates: Array<{
    date: string;
    errors: number;
    total: number;
  }>;
  userActivity: Array<{
    name: string;
    hour: number;
    users: number;
    color?: string;
  }>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    setRefreshing(true);
    try {
      // In a real implementation, this would call your analytics API
      // For now, we'll simulate the data structure
      const mockData: AnalyticsData = {
        userInteractionPatterns: {
          sessionDuration: 18, // minutes
          commonClickTargets: [
            { element: 'submit-log-button', count: 456 },
            { element: 'navigation-menu', count: 234 },
            { element: 'add-job-button', count: 189 },
            { element: 'approve-button', count: 167 },
            { element: 'export-button', count: 123 },
          ],
          navigationPaths: [
            { path: '/dashboard → /logs/create', frequency: 234, count: 234 },
            { path: '/logs/create → /dashboard', frequency: 189, count: 189 },
            {
              path: '/dashboard → /reports/payroll',
              frequency: 156,
              count: 156,
            },
            { path: '/logs/review → /logs/[id]', frequency: 134, count: 134 },
            {
              path: '/commission/create → /commission/list',
              frequency: 98,
              count: 98,
            },
          ],
        },
        performanceMetrics: [
          { name: 'Page Load Time', value: 1.2, change: -0.1 },
          { name: 'Render Time', value: 0.8, change: 0.05 },
          { name: 'Interaction Delay', value: 0.1, change: -0.02 },
          { name: 'Bundle Size', value: 245.5, change: 12.3 },
          { name: 'First Paint', value: 0.95, change: -0.08 },
          { name: 'Time to Interactive', value: 1.8, change: 0.15 },
        ],
        topPages: [
          { page: '/dashboard', views: 1234, bounceRate: 0.12, avgTime: 180 },
          { page: '/logs/create', views: 856, bounceRate: 0.08, avgTime: 240 },
          {
            page: '/reports/payroll',
            views: 645,
            bounceRate: 0.15,
            avgTime: 300,
          },
          {
            page: '/commission/create',
            views: 432,
            bounceRate: 0.1,
            avgTime: 200,
          },
          { page: '/logs/review', views: 321, bounceRate: 0.18, avgTime: 150 },
        ],
        errorRates: [
          { date: '2024-01-01', errors: 12, total: 1000 },
          { date: '2024-01-02', errors: 8, total: 1100 },
          { date: '2024-01-03', errors: 15, total: 950 },
          { date: '2024-01-04', errors: 6, total: 1200 },
          { date: '2024-01-05', errors: 4, total: 1300 },
          { date: '2024-01-06', errors: 9, total: 1150 },
          { date: '2024-01-07', errors: 7, total: 1250 },
        ],
        userActivity: Array.from({ length: 24 }, (_, hour) => ({
          name: `${hour}:00`,
          hour,
          users: Math.floor(Math.random() * 100) + 20,
          color: hour % 2 === 0 ? '#026937' : '#ea7200',
        })),
      };

      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const exportData = () => {
    if (!data) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      timeRange,
      ...data,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        Loading analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        Failed to load analytics
      </div>
    );
  }

  // Trend icon functionality reserved for future implementation
  // const getTrendIcon = (current: number, previous: number) => {
  //   if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
  //   if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
  //   return <Minus className="h-4 w-4 text-gray-500" />;
  // };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Pages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.topPages.slice(0, 5).map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm truncate">{page.page}</span>
                    <Badge variant="secondary">{page.views}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  User Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.userActivity}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {data.userActivity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Session Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Avg Session Duration</span>
                    <span className="font-medium">
                      {data.userInteractionPatterns.sessionDuration}m
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Bounce Rate</span>
                    <span className="font-medium">12%</span>
                  </div>
                  <Progress value={12} className="mt-1" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Return Visitors</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <Progress value={68} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Page load times, render performance, and interaction delays over
                time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.performanceMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pageLoad"
                    stroke="#026937"
                    name="Page Load (s)"
                  />
                  <Line
                    type="monotone"
                    dataKey="renderTime"
                    stroke="#ea7200"
                    name="Render Time (s)"
                  />
                  <Line
                    type="monotone"
                    dataKey="interactionDelay"
                    stroke="#3b82f6"
                    name="Interaction Delay (s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Core Web Vitals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Largest Contentful Paint</span>
                    <span className="font-medium text-green-600">1.2s</span>
                  </div>
                  <Progress value={80} className="mt-1" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>First Input Delay</span>
                    <span className="font-medium text-green-600">45ms</span>
                  </div>
                  <Progress value={90} className="mt-1" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Cumulative Layout Shift</span>
                    <span className="font-medium text-yellow-600">0.08</span>
                  </div>
                  <Progress value={70} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Performance by Page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.topPages.slice(0, 5).map((page, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm truncate">{page.page}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {(page.avgTime / 60).toFixed(1)}m
                      </span>
                      <Badge
                        variant={
                          page.bounceRate < 0.15 ? 'default' : 'destructive'
                        }
                        className="text-xs"
                      >
                        {(page.bounceRate * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Most Clicked Elements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.userInteractionPatterns.commonClickTargets.map(
                  (
                    target: { element: string; count: number },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm truncate">{target.element}</span>
                      <Badge variant="secondary">{target.count}</Badge>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Common Navigation Paths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.userInteractionPatterns.navigationPaths.map(
                  (
                    path: { path: string; frequency: number; count: number },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="text-xs truncate">{path.path}</span>
                      <Badge variant="outline">{path.count}</Badge>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activity by Time of Day</CardTitle>
              <CardDescription>
                User activity patterns throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#026937" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Rate Trends</CardTitle>
              <CardDescription>
                Application errors and error rates over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={data.errorRates.map((item) => ({
                    ...item,
                    errorRate: ((item.errors / item.total) * 100).toFixed(2),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="errorRate"
                    stroke="#ef4444"
                    name="Error Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
