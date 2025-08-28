import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getCommissionEntries } from '@/lib/actions/commission';
import { CommissionPerformanceDashboard } from '@/components/features/commission/commission-performance-dashboard';
import { CommissionAnalytics } from '@/components/features/commission/commission-analytics';
import { CommissionCalculationBreakdown } from '@/components/features/commission/commission-calculation-breakdown';
import { CommissionProjections } from '@/components/features/commission/commission-projections';
import { CommissionExportButtons } from '@/components/features/commission/commission-export-buttons';
import { BrandButton } from '@/components/brand/brand-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Plus,
  BarChart3,
  Calculator,
  TrendingUp,
  Target,
  FileText,
  DollarSign,
} from 'lucide-react';

export default async function CommissionReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check if user has permission to view commission reports
  const canViewReports =
    session.user.roles?.includes('sales') ||
    session.user.roles?.includes('manager') ||
    session.user.roles?.includes('admin') ||
    session.user.commissionRate;

  if (!canViewReports) {
    redirect('/dashboard');
  }

  // Get commission entries
  const entriesResult = await getCommissionEntries();
  const entries = entriesResult.success ? entriesResult.data || [] : [];

  // Check if user can view all data or just their own
  const canViewAllData =
    session.user.roles?.includes('admin') ||
    session.user.roles?.includes('manager');

  // Filter entries for current user if they're not admin/manager
  const filteredEntries = canViewAllData
    ? entries
    : entries.filter((entry) => entry.salesId === session.user.id);

  // Calculate quick stats
  const stats = {
    totalEntries: filteredEntries.length,
    pendingEntries: filteredEntries.filter((e) => e.status === 'pending')
      .length,
    matchedEntries: filteredEntries.filter((e) => e.status === 'matched')
      .length,
    approvedEntries: filteredEntries.filter((e) => e.status === 'approved')
      .length,
    totalCommission: filteredEntries.reduce(
      (sum, e) => sum + (Number(e.commissionAmount) || 0),
      0
    ),
    totalRevenue: filteredEntries.reduce(
      (sum, e) => sum + (Number(e.actualRevenue) || 0),
      0
    ),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
            Commission Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive commission tracking, performance analytics, and
            detailed breakdowns
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/commission/create">
            <BrandButton variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </BrandButton>
          </Link>
          <Link href="/commission/list">
            <BrandButton variant="outline" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              View List
            </BrandButton>
          </Link>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="relative overflow-hidden border-l-4 border-l-hunks-green bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-xl hover:shadow-hunks-green/20 hover:scale-[1.02] group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-green transition-colors duration-300">
              Total Commission
            </CardTitle>
            <DollarSign className="h-4 w-4 text-hunks-green group-hover:scale-110 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-hunks-green group-hover:scale-105 transition-transform duration-300">
              {formatCurrency(stats.totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-hunks-green/70 transition-colors duration-300">
              From {stats.approvedEntries} approved entries
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-hunks-orange bg-gradient-to-br from-white via-white to-hunks-orange/5 transition-all duration-500 hover:shadow-xl hover:shadow-hunks-orange/20 hover:scale-[1.02] group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-orange transition-colors duration-300">
              Total Revenue
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-hunks-orange group-hover:scale-110 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-hunks-orange group-hover:scale-105 transition-transform duration-300">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-hunks-orange/70 transition-colors duration-300">
              From matched jobs
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-blue-500 bg-gradient-to-br from-white via-white to-blue-50 transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-blue-600 transition-colors duration-300">
              Conversion Rate
            </CardTitle>
            <Target className="h-4 w-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 group-hover:scale-105 transition-transform duration-300">
              {stats.totalEntries > 0
                ? `${(((stats.matchedEntries + stats.approvedEntries) / stats.totalEntries) * 100).toFixed(1)}%`
                : '0.0%'}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-blue-600/70 transition-colors duration-300">
              {stats.matchedEntries + stats.approvedEntries} of{' '}
              {stats.totalEntries} entries
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-white via-white to-purple-50 transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02] group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-colors duration-300">
              Pipeline Status
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform duration-300" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800"
              >
                {stats.pendingEntries} Pending
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 border-blue-200 text-blue-800"
              >
                {stats.matchedEntries} Matched
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2 group-hover:text-purple-600/70 transition-colors duration-300">
              Active pipeline entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-hunks-green/20">
          <TabsTrigger
            value="dashboard"
            className="data-[state=active]:bg-hunks-green data-[state=active]:text-white transition-all duration-300"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Performance Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-hunks-orange data-[state=active]:text-white transition-all duration-300"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics & Trends
          </TabsTrigger>
          <TabsTrigger
            value="calculations"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-300"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Calculation Breakdown
          </TabsTrigger>
          <TabsTrigger
            value="projections"
            className="data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-all duration-300"
          >
            <Target className="mr-2 h-4 w-4" />
            Earnings Projections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <CommissionPerformanceDashboard
            currentUserId={session.user.id}
            userRole={session.user.roles || []}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-hunks-orange/5 border-hunks-orange/20">
            <CardHeader>
              <CardTitle className="text-hunks-orange">
                Commission Analytics & Trends
              </CardTitle>
              <CardDescription>
                Detailed performance metrics, conversion rates, and booking
                accuracy analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionAnalytics entries={filteredEntries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculations" className="space-y-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-blue-50 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-blue-600">
                Commission Calculation Breakdown
              </CardTitle>
              <CardDescription>
                Detailed analysis of commission calculations, variances, and
                accuracy metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionCalculationBreakdown
                entries={filteredEntries}
                showDetailed={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projections" className="space-y-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-white via-white to-purple-50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-purple-600">
                Commission Earnings Projections
              </CardTitle>
              <CardDescription>
                Projected earnings based on historical performance and current
                pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommissionProjections
                entries={filteredEntries}
                currentUserId={session.user.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export and Actions */}
      <Card className="mt-6 bg-gradient-to-r from-hunks-green/10 via-white to-hunks-orange/10 border-hunks-green/30">
        <CardHeader>
          <CardTitle className="text-hunks-green">Export & Actions</CardTitle>
          <CardDescription>
            Export commission data and generate reports for analysis or sharing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommissionExportButtons
            entries={filteredEntries}
            canViewAllData={canViewAllData}
            currentUserId={session.user.id}
          />
          <p className="text-xs text-muted-foreground mt-3">
            Export includes commission calculations, booking accuracy, revenue
            variance, and performance metrics.
            {!canViewAllData &&
              ' You can only export your own commission data.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
