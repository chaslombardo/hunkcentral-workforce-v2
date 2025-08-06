'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

import {
  HelpCircle,
  DollarSign,
  Users,
  Calendar,
  TrendingUp,

  Award,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { TipEntry } from '@/lib/payCalculator';

export interface TipsDetailViewProps {
  tips: TipEntry[];
  totalTips: number;
  payPeriodStart: Date;
  payPeriodEnd: Date;
}

type SortOption = 'date' | 'amount' | 'client' | 'jobType';
type FilterOption = 'all' | 'junk' | 'move';

export function TipsDetailView({
  tips,
  totalTips,
  payPeriodStart,
  payPeriodEnd,
}: TipsDetailViewProps) {
  const [sortBy, setSortBy] = React.useState<SortOption>('date');
  const [filterBy, setFilterBy] = React.useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Calculate performance metrics
  const safeTips = tips || [];
  const totalJobs = safeTips.length;
  const averageTipPerJob = totalJobs > 0 ? totalTips / totalJobs : 0;
  const junkTips = safeTips.filter(tip => tip.jobType === 'junk');
  const moveTips = safeTips.filter(tip => tip.jobType === 'move');
  const averageJunkTip = junkTips.length > 0 ? junkTips.reduce((sum, tip) => sum + tip.myShare, 0) / junkTips.length : 0;
  const averageMoveTip = moveTips.length > 0 ? moveTips.reduce((sum, tip) => sum + tip.myShare, 0) / moveTips.length : 0;

  // Find highest tip day
  const dailyTips = safeTips.reduce((acc, tip) => {
    const dateKey = tip.date.toISOString().split('T')[0];
    acc[dateKey] = (acc[dateKey] || 0) + tip.myShare;
    return acc;
  }, {} as Record<string, number>);

  const highestTipDay = Object.entries(dailyTips).reduce((max, [date, amount]) => 
    amount > max.amount ? { date: new Date(date), amount } : max, 
    { date: new Date(), amount: 0 }
  );

  // Filter and sort tips
  const filteredAndSortedTips = React.useMemo(() => {
    if (!tips || !Array.isArray(tips)) {
      return [];
    }
    let filtered = tips;

    // Apply job type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(tip => tip.jobType === filterBy);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tip => 
        tip.clientName.toLowerCase().includes(query) ||
        tip.jobId.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.date.getTime() - a.date.getTime();
        case 'amount':
          return b.myShare - a.myShare;
        case 'client':
          return a.clientName.localeCompare(b.clientName);
        case 'jobType':
          return a.jobType.localeCompare(b.jobType);
        default:
          return 0;
      }
    });
  }, [tips, filterBy, searchQuery, sortBy]);

  // Handle undefined or null tips array
  if (!tips || !Array.isArray(tips)) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2" />
            <p>Tips data is not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
        {/* Performance Metrics Cards */}
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {/* Total Tips */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Tips Earned</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl" data-testid="total-tips-amount">
              {formatCurrency(totalTips)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <DollarSign className="h-3 w-3" />
                {totalJobs} jobs
              </Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Average per Job */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Average per Job</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl" data-testid="average-per-job">
              {formatCurrency(averageTipPerJob)}
            </CardTitle>
            <CardAction>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button">
                      <Badge variant="outline">
                        <HelpCircle className="h-3 w-3" />
                        Per job
                      </Badge>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total tips divided by number of jobs completed</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardAction>
          </CardHeader>
        </Card>

        {/* Best Day */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Highest Tip Day</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl" data-testid="highest-tip-day">
              {formatCurrency(highestTipDay.amount)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp className="h-3 w-3" />
                Best
              </Badge>
            </CardAction>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-sm text-muted-foreground">
              {formatDate(highestTipDay.date)}
            </div>
          </div>
        </Card>

        {/* Job Type Comparison */}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Junk vs Move Tips</CardDescription>
            <CardTitle className="text-lg font-semibold tabular-nums @[250px]/card:text-xl" data-testid="job-type-comparison">
              {formatCurrency(averageJunkTip)} / {formatCurrency(averageMoveTip)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <Award className="h-3 w-3" />
                Avg per job
              </Badge>
            </CardAction>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="text-sm text-muted-foreground">
              Junk: {junkTips.length} jobs • Move: {moveTips.length} jobs
            </div>
          </div>
        </Card>
      </div>

      {/* Tips Detail Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Tips Breakdown</CardTitle>
              <CardDescription>
                Detailed breakdown of all tips earned from {formatDate(payPeriodStart)} to {formatDate(payPeriodEnd)}
              </CardDescription>
            </div>
            
            {/* Controls */}
            <div className="flex gap-2 flex-col sm:flex-row sm:items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search client or job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full sm:w-[200px]"
                />
              </div>

              <div className="flex gap-2">
                {/* Filter */}
                <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="All Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    <SelectItem value="junk">Junk Only</SelectItem>
                    <SelectItem value="move">Move Only</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue placeholder="By Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">By Date</SelectItem>
                    <SelectItem value="amount">By Amount</SelectItem>
                    <SelectItem value="client">By Client</SelectItem>
                    <SelectItem value="jobType">By Job Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredAndSortedTips.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">
                {searchQuery || filterBy !== 'all' 
                  ? 'No tips match your current filters.' 
                  : 'No tips recorded for this period.'}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {filteredAndSortedTips.map((tip, index) => (
                  <Card key={`mobile-${tip.logId}-${tip.jobId}-${index}`} className="@container/card">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-base truncate @[250px]/card:text-lg" data-testid={`mobile-client-${tip.clientName}`}>
                            {tip.clientName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(tip.date)} • Job #{tip.jobId}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="font-mono text-xl font-semibold @[250px]/card:text-2xl" data-testid={`mobile-amount-${tip.myShare}`}>
                            {formatCurrency(tip.myShare)}
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {tip.jobType}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-medium">{formatCurrency(tip.totalJobTips)}</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{tip.teamMembers}</span>
                          </div>
                        </div>
                        
                        <Button variant="ghost" asChild>
                          <Link href={`/logs/${tip.logId}`}>
                            <ExternalLink className="h-4 w-4" />
                            View Log
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="flex items-center justify-center gap-1" type="button">
                                <DollarSign className="h-3 w-3" />
                                Total Tips
                                <HelpCircle className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total tips collected for this job before team split</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="flex items-center justify-center gap-1" type="button">
                                <Users className="h-3 w-3" />
                                Team Size
                                <HelpCircle className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of team members sharing the tips</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead className="text-right">My Share</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedTips.map((tip, index) => (
                      <TableRow key={`${tip.logId}-${tip.jobId}-${index}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(tip.date)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {tip.clientName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {tip.jobId}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {tip.jobType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {formatCurrency(tip.totalJobTips)}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {tip.teamMembers}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(tip.myShare)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/logs/${tip.logId}`}>
                              <ExternalLink className="h-3 w-3" />
                              <span className="sr-only">View log for {tip.clientName}</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary Footer */}
              <Separator />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                <div className="text-muted-foreground">
                  Showing {filteredAndSortedTips.length} of {tips.length} tip entries
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-muted-foreground">Filtered Total:</span>
                    <span className="font-mono font-semibold ml-2">
                      {formatCurrency(filteredAndSortedTips.reduce((sum, tip) => sum + tip.myShare, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

        {/* Tip Distribution Formula Explanation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              How Tips Are Calculated
            </CardTitle>
            <CardDescription>
              Understanding how your tip share is determined
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">Tip Distribution Formula</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Tips are shared equally among all team members working that job section</div>
                  <div data-testid="tip-formula">• Your share = Total Job Tips ÷ Number of Team Members</div>
                  <div>• Co-captains receive the same share as other team members</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Example Calculation</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Job collected $60 in tips</div>
                  <div>• 3 team members worked the job</div>
                  <div>• Your share: $60 ÷ 3 = $20.00</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}