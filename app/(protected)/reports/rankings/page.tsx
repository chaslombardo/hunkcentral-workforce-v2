import { redirect } from 'next/navigation';
import { auth, hasRole } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandButton } from '@/components/brand/brand-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CaptainPerformanceData } from '@/types';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Target,
  Download,
  Trophy,
  Truck,
  Package,
  Eye,
  Info,
  TrendingUp,
  Award
} from 'lucide-react';

export default async function RankingsPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // All authenticated users can access rankings report (per requirements)
  const isCurrentUserCaptain = hasRole(session.user, 'captain');
  
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
                    const avgLaborPercentage = totalJobs > 0 ? 
                      (captain.junkMetrics.laborPercentage + captain.moveMetrics.laborPercentage) / 2 : 0;
                    
                    return (
                      <div 
                        key={captain.captainId} 
                        className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                          isCurrentUser && isCurrentUserCaptain 
                            ? 'border-[#026937] bg-gradient-to-r from-[#026937]/10 to-[#ea7200]/5 shadow-md' 
                            : isCurrentUser 
                            ? 'border-[#026937] bg-[#026937]/5' 
                            : 'hover:shadow-sm'
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
                                <Badge variant="outline" className={`${
                                  isCurrentUserCaptain 
                                    ? 'text-[#026937] border-[#026937] bg-[#026937]/10' 
                                    : 'text-[#026937] border-[#026937]'
                                }`}>
                                  {isCurrentUserCaptain ? (
                                    <div className="flex items-center gap-1">
                                      <Award className="h-3 w-3" />
                                      You
                                    </div>
                                  ) : 'You'}
                                </Badge>
                              )}
                              {index === 0 && (
                                <Badge className="bg-[#ea7200] text-white">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  Top Performer
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                              <span>{totalJobs} total jobs</span>
                              <span>•</span>
                              <span>{formatCurrency(avgJobSize)} avg job size</span>
                              <span>•</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="flex items-center gap-1 cursor-help">
                                    {formatPercentage(avgLaborPercentage)} avg labor
                                    <Info className="h-3 w-3" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Average labor percentage across Junk (target: 14%) and Move (target: 24%) operations</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(totalRevenue)}</div>
                            <div className="text-sm text-muted-foreground">Total Revenue</div>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <BrandButton variant="outline" size="sm" className="gap-2">
                                <Eye className="h-4 w-4" />
                                Details
                              </BrandButton>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5 text-[#026937]" />
                                  {captain.captainName} - Detailed Performance
                                  {isCurrentUser && (
                                    <Badge variant="outline" className="text-[#026937] border-[#026937]">
                                      Your Performance
                                    </Badge>
                                  )}
                                </DialogTitle>
                                <DialogDescription>
                                  Comprehensive performance breakdown across all operations
                                </DialogDescription>
                              </DialogHeader>
                              <CaptainDetailView captain={captain} />
                            </DialogContent>
                          </Dialog>
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
          <JunkOperationsTab captains={(performanceData?.captains as CaptainPerformanceData[]) || []} currentUserId={session.user.id} isCurrentUserCaptain={isCurrentUserCaptain} />
        </TabsContent>

        <TabsContent value="move" className="space-y-6">
          <MoveOperationsTab captains={(performanceData?.captains as CaptainPerformanceData[]) || []} currentUserId={session.user.id} isCurrentUserCaptain={isCurrentUserCaptain} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Captain Detail View Component
function CaptainDetailView({ captain }: { captain: CaptainPerformanceData }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const totalRevenue = captain.junkMetrics.totalRevenue + captain.moveMetrics.totalRevenue;
  const totalJobs = captain.junkMetrics.jobCount + captain.moveMetrics.jobCount;
  const avgJobSize = totalJobs > 0 ? totalRevenue / totalJobs : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#026937]">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">All operations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Job Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgJobSize)}</div>
            <p className="text-xs text-muted-foreground">Per job</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ea7200]">
              {totalJobs > 0 ? Math.round((totalRevenue / totalJobs) / 100) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Revenue efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Tabs defaultValue="junk" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="junk">Junk Operations</TabsTrigger>
          <TabsTrigger value="move">Move Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="junk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#026937]" />
                Junk Operations Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Jobs Completed</div>
                  <div className="text-lg font-semibold">{captain.junkMetrics.jobCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-lg font-semibold">{formatCurrency(captain.junkMetrics.totalRevenue)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Average Job Size</div>
                  <div className="text-lg font-semibold">{formatCurrency(captain.junkMetrics.averageJobSize)}</div>
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Labor Percentage <Info className="h-3 w-3" />
                        </div>
                        <div className={`text-lg font-semibold ${
                          captain.junkMetrics.laborPercentage <= 14 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(captain.junkMetrics.laborPercentage)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Labor cost as percentage of revenue. Target: 14% or below for junk operations.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Disposal Percentage <Info className="h-3 w-3" />
                        </div>
                        <div className="text-lg font-semibold">{formatPercentage(captain.junkMetrics.disposalPercentage)}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Percentage of jobs that included disposal services</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="move" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#026937]" />
                Move Operations Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Jobs Completed</div>
                  <div className="text-lg font-semibold">{captain.moveMetrics.jobCount}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                  <div className="text-lg font-semibold">{formatCurrency(captain.moveMetrics.totalRevenue)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Average Job Size</div>
                  <div className="text-lg font-semibold">{formatCurrency(captain.moveMetrics.averageJobSize)}</div>
                </div>
                <div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          Labor Percentage <Info className="h-3 w-3" />
                        </div>
                        <div className={`text-lg font-semibold ${
                          captain.moveMetrics.laborPercentage <= 24 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(captain.moveMetrics.laborPercentage)}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Labor cost as percentage of revenue. Target: 24% or below for move operations.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Revenue Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            Upsell Revenue <Info className="h-3 w-3" />
                          </div>
                          <div className="text-lg font-semibold">{formatCurrency(captain.moveMetrics.upsellRevenue)}</div>
                          <div className="text-xs text-muted-foreground">({formatPercentage(captain.moveMetrics.upsellPercentage)})</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Additional services sold during the move</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            Valuation Revenue <Info className="h-3 w-3" />
                          </div>
                          <div className="text-lg font-semibold">{formatCurrency(captain.moveMetrics.valuationRevenue)}</div>
                          <div className="text-xs text-muted-foreground">({formatPercentage(captain.moveMetrics.valuationPercentage)})</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Revenue from valuation protection services</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            Junk on Move <Info className="h-3 w-3" />
                          </div>
                          <div className="text-lg font-semibold">{formatCurrency(captain.moveMetrics.junkOnMoveRevenue)}</div>
                          <div className="text-xs text-muted-foreground">({formatPercentage(captain.moveMetrics.junkOnMovePercentage)})</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Junk removal services performed during moves</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            Materials Revenue <Info className="h-3 w-3" />
                          </div>
                          <div className="text-lg font-semibold">{formatCurrency(captain.moveMetrics.materialsRevenue)}</div>
                          <div className="text-xs text-muted-foreground">({formatPercentage(captain.moveMetrics.materialsPercentage)})</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Revenue from packing materials and supplies</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Junk Operations Tab Component
function JunkOperationsTab({ captains, currentUserId, isCurrentUserCaptain }: { captains: CaptainPerformanceData[], currentUserId: string, isCurrentUserCaptain: boolean }) {
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
                  className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                    isCurrentUser && isCurrentUserCaptain 
                      ? 'border-[#026937] bg-gradient-to-r from-[#026937]/10 to-[#ea7200]/5 shadow-md' 
                      : isCurrentUser 
                      ? 'border-[#026937] bg-[#026937]/5' 
                      : 'hover:shadow-sm'
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
                          <Badge variant="outline" className={`${
                            isCurrentUserCaptain 
                              ? 'text-[#026937] border-[#026937] bg-[#026937]/10' 
                              : 'text-[#026937] border-[#026937]'
                          }`}>
                            {isCurrentUserCaptain ? (
                              <div className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                You
                              </div>
                            ) : 'You'}
                          </Badge>
                        )}
                        {index === 0 && (
                          <Badge className="bg-[#ea7200] text-white">
                            <Trophy className="h-3 w-3 mr-1" />
                            Top Junk
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span>{metrics.jobCount} jobs</span>
                        <span>•</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-help">
                              {formatPercentage(metrics.laborPercentage)} labor
                              <Info className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Labor cost percentage. Target: 14% or below for junk operations</p>
                          </TooltipContent>
                        </Tooltip>
                        <span>•</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-help">
                              {formatPercentage(metrics.disposalPercentage)} disposal
                              <Info className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Percentage of jobs that included disposal services</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(metrics.totalRevenue)}</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(metrics.averageJobSize)} avg</div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <BrandButton variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          Details
                        </BrandButton>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-[#026937]" />
                            {captain.captainName} - Junk Operations Detail
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-[#026937] border-[#026937]">
                                Your Performance
                              </Badge>
                            )}
                          </DialogTitle>
                          <DialogDescription>
                            Detailed junk operations performance metrics
                          </DialogDescription>
                        </DialogHeader>
                        <CaptainDetailView captain={captain} />
                      </DialogContent>
                    </Dialog>
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
function MoveOperationsTab({ captains, currentUserId, isCurrentUserCaptain }: { captains: CaptainPerformanceData[], currentUserId: string, isCurrentUserCaptain: boolean }) {
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
                  className={`p-4 border rounded-lg transition-all ${
                    isCurrentUser && isCurrentUserCaptain 
                      ? 'border-[#026937] bg-gradient-to-r from-[#026937]/10 to-[#ea7200]/5 shadow-md' 
                      : isCurrentUser 
                      ? 'border-[#026937] bg-[#026937]/5' 
                      : 'hover:shadow-sm'
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
                            <Badge variant="outline" className={`${
                              isCurrentUserCaptain 
                                ? 'text-[#026937] border-[#026937] bg-[#026937]/10' 
                                : 'text-[#026937] border-[#026937]'
                            }`}>
                              {isCurrentUserCaptain ? (
                                <div className="flex items-center gap-1">
                                  <Award className="h-3 w-3" />
                                  You
                                </div>
                              ) : 'You'}
                            </Badge>
                          )}
                          {index === 0 && (
                            <Badge className="bg-[#ea7200] text-white">
                              <Trophy className="h-3 w-3 mr-1" />
                              Top Move
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4">
                          <span>{metrics.jobCount} jobs</span>
                          <span>•</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 cursor-help">
                                {formatPercentage(metrics.laborPercentage)} labor
                                <Info className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Labor cost percentage. Target: 24% or below for move operations</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(metrics.totalRevenue)}</div>
                        <div className="text-sm text-muted-foreground">{formatCurrency(metrics.averageJobSize)} avg</div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <BrandButton variant="outline" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" />
                            Details
                          </BrandButton>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Truck className="h-5 w-5 text-[#026937]" />
                              {captain.captainName} - Move Operations Detail
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-[#026937] border-[#026937]">
                                  Your Performance
                                </Badge>
                              )}
                            </DialogTitle>
                            <DialogDescription>
                              Detailed move operations performance metrics with revenue breakdown
                            </DialogDescription>
                          </DialogHeader>
                          <CaptainDetailView captain={captain} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  {/* Move-specific metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <div className="text-muted-foreground flex items-center gap-1">
                              Upsell <Info className="h-3 w-3" />
                            </div>
                            <div className="font-medium">
                              {formatCurrency(metrics.upsellRevenue)} ({formatPercentage(metrics.upsellPercentage)})
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Additional services sold during the move</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <div className="text-muted-foreground flex items-center gap-1">
                              Valuation <Info className="h-3 w-3" />
                            </div>
                            <div className="font-medium">
                              {formatCurrency(metrics.valuationRevenue)} ({formatPercentage(metrics.valuationPercentage)})
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Revenue from valuation protection services</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <div className="text-muted-foreground flex items-center gap-1">
                              Junk on Move <Info className="h-3 w-3" />
                            </div>
                            <div className="font-medium">
                              {formatCurrency(metrics.junkOnMoveRevenue)} ({formatPercentage(metrics.junkOnMovePercentage)})
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Junk removal services performed during moves</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <div className="text-muted-foreground flex items-center gap-1">
                              Materials <Info className="h-3 w-3" />
                            </div>
                            <div className="font-medium">
                              {formatCurrency(metrics.materialsRevenue)} ({formatPercentage(metrics.materialsPercentage)})
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Revenue from packing materials and supplies</p>
                        </TooltipContent>
                      </Tooltip>
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