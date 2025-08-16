'use client';

import { TrendingDown, TrendingUp, Users, Clock, DollarSign } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import type { SectionCalculation } from '@/lib/logCalculations';
import { formatCurrency, formatPercentage } from '@/lib/logCalculations';

interface SectionSummaryProps {
  title: string;
  calculation: SectionCalculation;
  showDisposalCost?: boolean;
  showUpsells?: boolean;
}

export function SectionSummary({
  title,
  calculation,
  showDisposalCost = false,
  showUpsells = false,
}: SectionSummaryProps) {
  const {
    totalRevenue,
    totalTips,
    totalLaborCost,
    laborCostPercentage,
    tipsPerHunk,
    totalHours,
    employeeCount,
    isUnderGoal,
    goal,
    disposalCostPercentage,
    upsellPercentage,
    totalUpsells,
  } = calculation;

  // Calculate progress bar value (capped at 100% for display)
  const progressValue = Math.min((laborCostPercentage / goal) * 100, 100);

  return (
    <Card className="bg-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          {title}
          <Badge
            variant={isUnderGoal ? "default" : "destructive"}
            className={
              isUnderGoal
                ? "bg-hunks-green hover:bg-hunks-green/90 text-white"
                : ""
            }
          >
            {isUnderGoal ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            {isUnderGoal ? "Under Goal" : "Over Goal"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time calculations for this section
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue and Tips Row */}
        {totalRevenue > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Revenue</p>
              <p className="text-lg font-semibold text-hunks-green">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Tips</p>
              <p className="text-lg font-semibold text-hunks-orange">
                {formatCurrency(totalTips)}
              </p>
            </div>
          </div>
        )}

        {/* Labor Cost Progress */}
        {totalRevenue > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Labor Cost Percentage
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Labor Cost Calculation</h4>
                    <div className="text-xs space-y-1">
                      <p>Total Labor Cost: {formatCurrency(totalLaborCost)}</p>
                      <p>Total Revenue: {formatCurrency(totalRevenue)}</p>
                      <p>Percentage: {formatCurrency(totalLaborCost)} ÷ {formatCurrency(totalRevenue)} = {formatPercentage(laborCostPercentage)}</p>
                      <Separator className="my-2" />
                      <p className="font-medium">
                        Goal: {formatPercentage(goal)} or less
                      </p>
                      <p className={isUnderGoal ? "text-hunks-green" : "text-destructive"}>
                        Status: {isUnderGoal ? "Under goal ✓" : "Over goal ⚠"}
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <span className={`text-sm font-semibold ${isUnderGoal ? "text-hunks-green" : "text-destructive"}`}>
                {formatPercentage(laborCostPercentage)} / {formatPercentage(goal)}
              </span>
            </div>
            <Progress
              value={progressValue}
              className={`h-3 ${
                isUnderGoal
                  ? "[&>div]:bg-hunks-green"
                  : "[&>div]:bg-destructive"
              }`}
            />
          </div>
        )}

        {/* Tips per HUNK */}
        {totalTips > 0 && employeeCount > 0 && (
          <div className="flex items-center justify-between">
            <HoverCard>
              <HoverCardTrigger asChild>
                <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Tips per HUNK
                </button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Tips Distribution</h4>
                  <div className="text-xs space-y-1">
                    <p>Total Tips: {formatCurrency(totalTips)}</p>
                    <p>Number of HUNKs: {employeeCount}</p>
                    <p>Per HUNK: {formatCurrency(totalTips)} ÷ {employeeCount} = {formatCurrency(tipsPerHunk)}</p>
                    <Separator className="my-2" />
                    <p className="text-muted-foreground">
                      Tips are distributed equally among all team members in this section.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
            <Badge variant="secondary" className="bg-hunks-orange/10 text-hunks-orange border-hunks-orange/20">
              {formatCurrency(tipsPerHunk)}
            </Badge>
          </div>
        )}

        {/* Hours and Team Size */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total Hours</p>
              <p className="text-sm font-semibold">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Team Size</p>
              <p className="text-sm font-semibold">{employeeCount} HUNKs</p>
            </div>
          </div>
        </div>

        {/* Disposal Cost Percentage (Junk only) */}
        {showDisposalCost && disposalCostPercentage !== undefined && totalRevenue > 0 && (
          <>
            <Separator />
            <div className="flex items-center justify-between">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Disposal Cost %
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Disposal Cost Percentage</h4>
                    <div className="text-xs space-y-1">
                      <p>Disposal costs as a percentage of junk revenue</p>
                      <p>Lower percentages indicate better profitability</p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <Badge variant="outline">
                {formatPercentage(disposalCostPercentage)}
              </Badge>
            </div>
          </>
        )}

        {/* Upsell Percentage (Move only) */}
        {showUpsells && upsellPercentage !== undefined && totalRevenue > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Upsell Performance
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Upsell Calculation</h4>
                      <div className="text-xs space-y-1">
                        <p>Total Upsells: {formatCurrency(totalUpsells || 0)}</p>
                        <p>Move Revenue: {formatCurrency(totalRevenue)}</p>
                        <p>Upsell %: {formatPercentage(upsellPercentage)}</p>
                        <Separator className="my-2" />
                        <p className="text-muted-foreground">
                          Includes Junk on Move, Valuation, and Materials
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <Badge variant="outline" className="border-hunks-green text-hunks-green">
                  {formatPercentage(upsellPercentage)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                Upsells: {formatCurrency(totalUpsells || 0)}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}