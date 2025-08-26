'use client';

import * as React from 'react';
import {
  IconTrophy,
  IconTrendingUp,
  IconTrendingDown,
  IconMedal,
  IconStar,
  IconCurrencyDollar,
  IconClock,
  IconUsers,
  IconMinus,
} from '@tabler/icons-react';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/lib/formatters';

interface PerformanceData {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  role: 'captain' | 'wingman' | 'sales';
  revenue: number;
  efficiency: number;
  productivity: number;
  tips: number;
  rank: number;
  previousRank?: number;
  trend: 'up' | 'down' | 'same';
  score: number;
}

interface PerformanceRankingsProps {
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

// Generate sample performance data - TODO: Replace with real data
const generateSamplePerformanceData = (): PerformanceData[] => {
  const names = [
    'John Smith',
    'Sarah Johnson',
    'Mike Wilson',
    'Lisa Chen',
    'David Brown',
    'Emily Davis',
    'Chris Martinez',
    'Ashley Taylor',
    'Ryan Anderson',
    'Jessica White',
    'Kevin Lee',
    'Amanda Garcia',
    'Tyler Moore',
    'Nicole Thompson',
    'Brandon Clark',
  ];

  const roles: ('captain' | 'wingman' | 'sales')[] = [
    'captain',
    'wingman',
    'sales',
  ];
  const trends: ('up' | 'down' | 'same')[] = ['up', 'down', 'same'];

  return names
    .map((name, index) => {
      const role = roles[Math.floor(Math.random() * roles.length)];
      const revenue = Math.floor(Math.random() * 5000) + 1000;
      const efficiency = Math.floor(Math.random() * 30) + 70; // 70-100%
      const productivity = Math.floor(Math.random() * 40) + 60; // 60-100%
      const tips = Math.floor(Math.random() * 500) + 100;
      const trend = trends[Math.floor(Math.random() * trends.length)];

      // Calculate composite score
      const score = Math.floor(
        revenue / 50 + efficiency * 2 + productivity * 1.5 + tips / 10
      );

      return {
        id: `emp-${index + 1}`,
        name,
        initials: name
          .split(' ')
          .map((n) => n[0])
          .join(''),
        role,
        revenue,
        efficiency,
        productivity,
        tips,
        rank: index + 1,
        previousRank:
          trend === 'up' ? index + 2 : trend === 'down' ? index : index + 1,
        trend,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <IconTrophy className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <IconMedal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <IconMedal className="w-5 h-5 text-amber-600" />;
  return (
    <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
      #{rank}
    </span>
  );
};

const getTrendIcon = (trend: 'up' | 'down' | 'same') => {
  if (trend === 'up')
    return <IconTrendingUp className="w-4 h-4 text-green-600" />;
  if (trend === 'down')
    return <IconTrendingDown className="w-4 h-4 text-red-600" />;
  return <IconMinus className="w-4 h-4 text-gray-600" />;
};

export function PerformanceRankings({
  timeRange = '30d',
  onTimeRangeChange,
}: PerformanceRankingsProps) {
  const [rankingType, setRankingType] = React.useState('overall');
  const [roleFilter, setRoleFilter] = React.useState('all');

  const performanceData = React.useMemo(
    () => generateSamplePerformanceData(),
    []
  );

  const filteredData = React.useMemo(() => {
    let filtered = performanceData;

    if (roleFilter !== 'all') {
      filtered = filtered.filter((item) => item.role === roleFilter);
    }

    // Sort by ranking type
    if (rankingType === 'revenue') {
      filtered = [...filtered].sort((a, b) => b.revenue - a.revenue);
    } else if (rankingType === 'efficiency') {
      filtered = [...filtered].sort((a, b) => b.efficiency - a.efficiency);
    } else if (rankingType === 'productivity') {
      filtered = [...filtered].sort((a, b) => b.productivity - a.productivity);
    } else if (rankingType === 'tips') {
      filtered = [...filtered].sort((a, b) => b.tips - a.tips);
    }

    // Reassign ranks
    return filtered.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [performanceData, rankingType, roleFilter]);

  const topPerformers = filteredData.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h3 className="text-lg font-semibold text-hunks-green flex items-center gap-2">
            <IconTrophy className="w-5 h-5" />
            Performance Rankings
          </h3>
          <p className="text-sm text-muted-foreground">
            Anonymous performance rankings to motivate team excellence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="captain">Captains</SelectItem>
              <SelectItem value="wingman">Wingmen</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            value={rankingType}
            onValueChange={setRankingType}
            variant="outline"
            className="hidden @[767px]/main:flex"
          >
            <ToggleGroupItem value="overall">Overall</ToggleGroupItem>
            <ToggleGroupItem value="revenue">Revenue</ToggleGroupItem>
            <ToggleGroupItem value="efficiency">Efficiency</ToggleGroupItem>
            <ToggleGroupItem value="tips">Tips</ToggleGroupItem>
          </ToggleGroup>

          <Select value={rankingType} onValueChange={setRankingType}>
            <SelectTrigger className="w-32 @[767px]/main:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="productivity">Productivity</SelectItem>
              <SelectItem value="tips">Tips</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 3 Performers Podium */}
      <div className="px-4 lg:px-6">
        <Card className="hunk-gradient-bg">
          <CardHeader>
            <CardTitle className="text-hunks-green flex items-center gap-2">
              <IconStar className="w-5 h-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Leading the team in{' '}
              {rankingType === 'overall' ? 'overall performance' : rankingType}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 @[600px]/main:grid-cols-3">
              {topPerformers.map((performer, index) => (
                <Card
                  key={performer.id}
                  className={`relative overflow-hidden ${
                    index === 0
                      ? 'border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900'
                      : index === 1
                        ? 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900'
                        : 'border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900'
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      {getRankIcon(performer.rank)}
                      {getTrendIcon(performer.trend)}
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={performer.avatar}
                          alt={performer.name}
                        />
                        <AvatarFallback className="bg-hunks-green text-white">
                          {performer.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{performer.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {performer.role.charAt(0).toUpperCase() +
                            performer.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-semibold">{performer.score}</span>
                      </div>
                      {rankingType === 'overall' && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Revenue
                            </span>
                            <span className="font-semibold">
                              {formatCurrency(performer.revenue)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Efficiency
                            </span>
                            <span className="font-semibold">
                              {performer.efficiency}%
                            </span>
                          </div>
                        </>
                      )}
                      {rankingType === 'revenue' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-semibold">
                            {formatCurrency(performer.revenue)}
                          </span>
                        </div>
                      )}
                      {rankingType === 'efficiency' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Efficiency
                          </span>
                          <span className="font-semibold">
                            {performer.efficiency}%
                          </span>
                        </div>
                      )}
                      {rankingType === 'tips' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tips</span>
                          <span className="font-semibold">
                            {formatCurrency(performer.tips)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Rankings List */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-hunks-green">
              Complete Rankings
            </CardTitle>
            <CardDescription>
              Full team performance rankings for{' '}
              {timeRange === '7d'
                ? 'last 7 days'
                : timeRange === '30d'
                  ? 'last 30 days'
                  : 'last 90 days'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredData.map((performer) => (
                <div
                  key={performer.id}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 w-12">
                      {getRankIcon(performer.rank)}
                      {getTrendIcon(performer.trend)}
                    </div>

                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={performer.avatar}
                        alt={performer.name}
                      />
                      <AvatarFallback className="bg-hunks-green text-white text-sm">
                        {performer.initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="font-medium">{performer.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {performer.role.charAt(0).toUpperCase() +
                          performer.role.slice(1)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    {rankingType === 'overall' && (
                      <>
                        <div className="text-center">
                          <div className="font-semibold">
                            {formatCurrency(performer.revenue)}
                          </div>
                          <div className="text-muted-foreground">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">
                            {performer.efficiency}%
                          </div>
                          <div className="text-muted-foreground">
                            Efficiency
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">
                            {formatCurrency(performer.tips)}
                          </div>
                          <div className="text-muted-foreground">Tips</div>
                        </div>
                      </>
                    )}
                    {rankingType === 'revenue' && (
                      <div className="text-center">
                        <div className="font-semibold">
                          {formatCurrency(performer.revenue)}
                        </div>
                        <div className="text-muted-foreground">Revenue</div>
                      </div>
                    )}
                    {rankingType === 'efficiency' && (
                      <div className="text-center">
                        <div className="font-semibold">
                          {performer.efficiency}%
                        </div>
                        <div className="text-muted-foreground">Efficiency</div>
                      </div>
                    )}
                    {rankingType === 'productivity' && (
                      <div className="text-center">
                        <div className="font-semibold">
                          {performer.productivity}%
                        </div>
                        <div className="text-muted-foreground">
                          Productivity
                        </div>
                      </div>
                    )}
                    {rankingType === 'tips' && (
                      <div className="text-center">
                        <div className="font-semibold">
                          {formatCurrency(performer.tips)}
                        </div>
                        <div className="text-muted-foreground">Tips</div>
                      </div>
                    )}

                    <div className="text-center">
                      <div className="font-semibold text-hunks-green">
                        {performer.score}
                      </div>
                      <div className="text-muted-foreground">Score</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gamification Elements */}
      <div className="px-4 lg:px-6">
        <div className="grid grid-cols-1 gap-4 @[600px]/main:grid-cols-2 @[900px]/main:grid-cols-3">
          <Card className="border-hunks-green">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-hunks-green flex items-center gap-2">
                <IconTrophy className="w-4 h-4" />
                Monthly Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">Beat 85% Efficiency</div>
                <Progress value={78} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  Team average: 78% • Goal: 85%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-hunks-orange">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-hunks-orange flex items-center gap-2">
                <IconCurrencyDollar className="w-4 h-4" />
                Revenue Race
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {formatCurrency(45000)}
                </div>
                <Progress value={75} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  75% to {formatCurrency(60000)} monthly goal
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-600 flex items-center gap-2">
                <IconUsers className="w-4 h-4" />
                Team Spirit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">92%</div>
                <Progress value={92} className="h-2" />
                <div className="text-sm text-muted-foreground">
                  Team collaboration score
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
