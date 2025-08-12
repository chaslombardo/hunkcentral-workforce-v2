import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandButton } from '@/components/brand/brand-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CaptainPerformanceData } from '@/types';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Target,
  Download,
  Trophy,
  Truck,
  Package
} from 'lucide-react';

export default async function RankingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // All authenticated users can access rankings report (per requirements)
  
  // Fetch performance data using server-side approach
  let performanceData = null;
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/analytics/performance`);
    if (response.ok) {
      performanceData = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch performance data:', error);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Captain Performance Rankings</h1>
          <p className="text-muted-foreground">
            Performance metrics for all captains across Junk and Move operations.
          </p>
        </div>
        <BrandButton variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Rankings
        </BrandButton>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="junk">Junk Operations</TabsTrigger>
          <TabsTrigger value="move">Move Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Captains</CardTitle>
                <Users className="h-4 w-4 text-[#026937]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.totalCaptains || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active captains in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Trophy className="h-4 w-4 text-[#ea7200]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.captains?.[0]?.captainName || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Highest total revenue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Size</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.captains?.length > 0 
                    ? formatCurrency(
                        performanceData.captains.reduce((sum: number, captain: CaptainPerformanceData) => 
                          sum + captain.junkMetrics.averageJobSize + captain.moveMetrics.averageJobSize, 0
                        ) / (performanceData.captains.length * 2)
                      )
                    : '$0'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Labor Efficiency</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.captains?.length > 0 
                    ? formatPercentage(
                        performanceData.captains.reduce((sum: number, captain: CaptainPerformanceData) => 
                          sum + captain.junkMetrics.laborPercentage + captain.moveMetrics.laborPercentage, 0
                        ) / (performanceData.captains.length * 2)
                      )
                    : '0%'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Combined operations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Rankings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Captain Performance Rankings</CardTitle>
              <CardDescription>
                Combined performance metrics across all operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceData?.captains?.length > 0 ? (
                  performanceData.captains.map((captain: CaptainPerformanceData, index: number) => {
                    const totalRevenue = captain.junkMetrics.totalRevenue + captain.moveMetrics.totalRevenue;
                    const totalJobs = captain.junkMetrics.jobCount + captain.moveMetrics.jobCount;
                    const avgJobSize = totalJobs > 0 ? totalRevenue / totalJobs : 0;
                    const isCurrentUser = session.user.id === captain.captainId;
                    
                    return (
                      <div 
                        key={captain.captainId} 
                        className={`flex items-center justify-between p-4 border rounded-lg ${
                          isCurrentUser ? 'border-[#026937] bg-[#026937]/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium ${
                            index === 0 ? 'bg-[#ea7200]' : 'bg-[#026937]'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {captain.captainName}
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-[#026937] border-[#026937]">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {totalJobs} total jobs • {formatCurrency(avgJobSize)} avg job size
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(totalRevenue)}</div>
                          <div className="text-sm text-muted-foreground">Total Revenue</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No performance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="junk" className="space-y-6">
          <JunkOperationsTab captains={(performanceData?.captains as CaptainPerformanceData[]) || []} currentUserId={session.user.id} />
        </TabsContent>

        <TabsContent value="move" className="space-y-6">
          <MoveOperationsTab captains={(performanceData?.captains as CaptainPerformanceData[]) || []} currentUserId={session.user.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Junk Operations Tab Component
function JunkOperationsTab({ captains, currentUserId }: { captains: CaptainPerformanceData[], currentUserId: string }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Sort captains by junk revenue
  const sortedCaptains = [...captains].sort((a, b) => b.junkMetrics.totalRevenue - a.junkMetrics.totalRevenue);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Junk Revenue</CardTitle>
            <Package className="h-4 w-4 text-[#026937]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                captains.reduce((sum, captain) => sum + captain.junkMetrics.totalRevenue, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">All captains combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Junk Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#ea7200]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {captains.reduce((sum, captain) => sum + captain.junkMetrics.jobCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Jobs completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Labor %</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {captains.length > 0 
                ? formatPercentage(
                    captains.reduce((sum, captain) => sum + captain.junkMetrics.laborPercentage, 0) / captains.length
                  )
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">Target: 14%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Junk Operations Rankings</CardTitle>
          <CardDescription>Performance metrics for junk removal operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedCaptains.map((captain, index) => {
              const isCurrentUser = currentUserId === captain.captainId;
              const metrics = captain.junkMetrics;
              
              return (
                <div 
                  key={captain.captainId} 
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    isCurrentUser ? 'border-[#026937] bg-[#026937]/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium ${
                      index === 0 ? 'bg-[#ea7200]' : 'bg-[#026937]'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {captain.captainName}
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-[#026937] border-[#026937]">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {metrics.jobCount} jobs • {formatPercentage(metrics.laborPercentage)} labor • {formatPercentage(metrics.disposalPercentage)} disposal
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(metrics.totalRevenue)}</div>
                    <div className="text-sm text-muted-foreground">{formatCurrency(metrics.averageJobSize)} avg</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Move Operations Tab Component
function MoveOperationsTab({ captains, currentUserId }: { captains: CaptainPerformanceData[], currentUserId: string }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Sort captains by move revenue
  const sortedCaptains = [...captains].sort((a, b) => b.moveMetrics.totalRevenue - a.moveMetrics.totalRevenue);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Move Revenue</CardTitle>
            <Truck className="h-4 w-4 text-[#026937]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                captains.reduce((sum, captain) => sum + captain.moveMetrics.totalRevenue, 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">All captains combined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Move Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-[#ea7200]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {captains.reduce((sum, captain) => sum + captain.moveMetrics.jobCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Jobs completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Labor %</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {captains.length > 0 
                ? formatPercentage(
                    captains.reduce((sum, captain) => sum + captain.moveMetrics.laborPercentage, 0) / captains.length
                  )
                : '0%'
              }
            </div>
            <p className="text-xs text-muted-foreground">Target: 24%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Move Operations Rankings</CardTitle>
          <CardDescription>Performance metrics for moving operations with detailed breakdowns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedCaptains.map((captain, index) => {
              const isCurrentUser = currentUserId === captain.captainId;
              const metrics = captain.moveMetrics;
              
              return (
                <div 
                  key={captain.captainId} 
                  className={`p-4 border rounded-lg ${
                    isCurrentUser ? 'border-[#026937] bg-[#026937]/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium ${
                        index === 0 ? 'bg-[#ea7200]' : 'bg-[#026937]'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {captain.captainName}
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-[#026937] border-[#026937]">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {metrics.jobCount} jobs • {formatPercentage(metrics.laborPercentage)} labor
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(metrics.totalRevenue)}</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(metrics.averageJobSize)} avg</div>
                    </div>
                  </div>
                  
                  {/* Move-specific metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Upsell</div>
                      <div className="font-medium">
                        {formatCurrency(metrics.upsellRevenue)} ({formatPercentage(metrics.upsellPercentage)})
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Valuation</div>
                      <div className="font-medium">
                        {formatCurrency(metrics.valuationRevenue)} ({formatPercentage(metrics.valuationPercentage)})
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Junk on Move</div>
                      <div className="font-medium">
                        {formatCurrency(metrics.junkOnMoveRevenue)} ({formatPercentage(metrics.junkOnMovePercentage)})
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Materials</div>
                      <div className="font-medium">
                        {formatCurrency(metrics.materialsRevenue)} ({formatPercentage(metrics.materialsPercentage)})
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}