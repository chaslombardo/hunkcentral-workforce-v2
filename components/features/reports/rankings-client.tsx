"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BrandButton } from '@/components/brand/brand-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RankingsPageSkeleton, RankingsTabSkeleton } from '@/components/ui/skeleton-components';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import type { CaptainPerformanceData, PerformanceRankingsResponse } from '@/types';
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
  Award,
  RefreshCw
} from 'lucide-react';

interface RankingsClientProps {
  currentUserId: string;
  isCurrentUserCaptain: boolean;
}

export default function RankingsClient({ currentUserId, isCurrentUserCaptain }: RankingsClientProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceRankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Performance monitoring
  const { stats, recommendations } = usePerformanceOptimization({
    componentName: 'RankingsClient',
    trackRenderTime: true,
    warnLargeProps: true,
  });

  // Memoized formatters to avoid recreation on every render
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((value: number) => {
    return `${value.toFixed(1)}%`;
  }, []);

  // Fetch performance data with caching
  const fetchPerformanceData = useCallback(async (skipCache = false) => {
    try {
      setError(null);
      if (skipCache) setRefreshing(true);
      
      const url = new URL('/api/analytics/performance', window.location.origin);
      if (skipCache) {
        url.searchParams.set('skipCache', 'true');
      }
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }
      
      const data = await response.json();
      setPerformanceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Memoized calculations for summary metrics
  const summaryMetrics = useMemo(() => {
    if (!performanceData?.captains?.length) {
      return {
        totalCaptains: 0,
        topPerformer: 'N/A',
        avgJobSize: '$0',
        avgLaborEfficiency: '0%',
      };
    }

    const captains = performanceData.captains;
    const avgJobSize = captains.reduce((sum, captain) => 
      sum + captain.junkMetrics.averageJobSize + captain.moveMetrics.averageJobSize, 0
    ) / (captains.length * 2);

    const avgLaborEfficiency = captains.reduce((sum, captain) => 
      sum + captain.junkMetrics.laborPercentage + captain.moveMetrics.laborPercentage, 0
    ) / (captains.length * 2);

    return {
      totalCaptains: performanceData.totalCaptains,
      topPerformer: captains[0]?.captainName || 'N/A',
      avgJobSize: formatCurrency(avgJobSize),
      avgLaborEfficiency: formatPercentage(avgLaborEfficiency),
    };
  }, [performanceData, formatCurrency, formatPercentage]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchPerformanceData(true);
  }, [fetchPerformanceData]);

  // Show loading skeleton
  if (loading) {
    return <RankingsPageSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-red-500 mb-4">Error loading performance data</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <BrandButton onClick={() => fetchPerformanceData()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </BrandButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Captain Performance Rankings</h1>
          <p className="text-muted-foreground">
            Performance metrics for all captains across Junk and Move operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrandButton 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </BrandButton>
          <BrandButton variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Rankings
          </BrandButton>
        </div>
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
                <div className="text-2xl font-bold">{summaryMetrics.totalCaptains}</div>
                <p className="text-xs text-muted-foreground">Active captains in system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
                <Trophy className="h-4 w-4 text-[#ea7200]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.topPerformer}</div>
                <p className="text-xs text-muted-foreground">Highest total revenue</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Job Size</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.avgJobSize}</div>
                <p className="text-xs text-muted-foreground">Across all operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Labor Efficiency</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.avgLaborEfficiency}</div>
                <p className="text-xs text-muted-foreground">Combined operations</p>
              </CardContent>
            </Card>
          </div>

          {/* Rankings Table */}
          <RankingsTable 
            captains={performanceData?.captains || []}
            currentUserId={currentUserId}
            isCurrentUserCaptain={isCurrentUserCaptain}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        </TabsContent>

        <TabsContent value="junk" className="space-y-6">
          <JunkOperationsTab 
            captains={performanceData?.captains || []} 
            currentUserId={currentUserId} 
            isCurrentUserCaptain={isCurrentUserCaptain}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        </TabsContent>

        <TabsContent value="move" className="space-y-6">
          <MoveOperationsTab 
            captains={performanceData?.captains || []} 
            currentUserId={currentUserId} 
            isCurrentUserCaptain={isCurrentUserCaptain}
            formatCurrency={formatCurrency}
            formatPercentage={formatPercentage}
          />
        </TabsContent>
      </Tabs>

      {/* Performance debugging in development */}
      {process.env.NODE_ENV === 'development' && stats && (
        <div className="mt-8 p-4 bg-muted rounded-lg text-xs">
          <div className="font-medium mb-2">Performance Stats:</div>
          <div>Renders: {stats.count}, Avg: {stats.average.toFixed(2)}ms</div>
          {recommendations.length > 0 && (
            <div className="mt-2">
              <div className="font-medium">Recommendations:</div>
              <ul className="list-disc list-inside">
                {recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Memoized Rankings Table Component
const RankingsTable = React.memo(function RankingsTable({ 
  captains, 
  currentUserId, 
  isCurrentUserCaptain,
  formatCurrency,
  formatPercentage 
}: {
  captains: CaptainPerformanceData[];
  currentUserId: string;
  isCurrentUserCaptain: boolean;
  formatCurrency: (amount: number) => string;
  formatPercentage: (value: number) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Captain Performance Rankings</CardTitle>
        <CardDescription>Combined performance metrics across all operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {captains.length > 0 ? (
            captains.map((captain, index) => {
              const totalRevenue = captain.junkMetrics.totalRevenue + captain.moveMetrics.totalRevenue;
              const totalJobs = captain.junkMetrics.jobCount + captain.moveMetrics.jobCount;
              const avgJobSize = totalJobs > 0 ? totalRevenue / totalJobs : 0;
              const isCurrentUser = currentUserId === captain.captainId;
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
                    <CaptainDetailDialog captain={captain} isCurrentUser={isCurrentUser} />
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
  );
});

// Memoized Captain Detail Dialog
const CaptainDetailDialog = React.memo(function CaptainDetailDialog({ 
  captain, 
  isCurrentUser 
}: { 
  captain: CaptainPerformanceData; 
  isCurrentUser: boolean; 
}) {
  return (
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
  );
});

// Placeholder components for tabs (these would be implemented similarly)
function JunkOperationsTab({ captains, currentUserId, isCurrentUserCaptain, formatCurrency, formatPercentage }: any) {
  return <RankingsTabSkeleton />;
}

function MoveOperationsTab({ captains, currentUserId, isCurrentUserCaptain, formatCurrency, formatPercentage }: any) {
  return <RankingsTabSkeleton />;
}

function CaptainDetailView({ captain }: { captain: CaptainPerformanceData }) {
  return <div>Captain detail view placeholder</div>;
}