'use client';

import { Calculator, Users, Clock, DollarSign, TrendingUp } from 'lucide-react';

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { OverallCalculation } from '@/lib/logCalculations';
import { formatCurrency, formatPercentage } from '@/lib/logCalculations';

interface LogTotalsProps {
  calculation: OverallCalculation;
  captainId?: string;
}

export function LogTotals({ calculation, captainId }: LogTotalsProps) {
  const {
    totalRevenue,
    totalTips,
    totalLaborCost,
    totalHours,
    overallLaborCostPercentage,
    employeeSummary,
    sectionBreakdown,
  } = calculation;

  // Calculate overall progress (using a blended goal of 19% as middle ground)
  const overallGoal = 19; // Blended goal between junk (14%) and move (24%)
  const overallProgressValue = Math.min(
    (overallLaborCostPercentage / overallGoal) * 100,
    100
  );
  const isOverallUnderGoal = overallLaborCostPercentage <= overallGoal;

  return (
    <Card className="bg-gradient-to-br from-hunks-green/5 to-hunks-orange/5 border-hunks-green/20">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-hunks-green">
          <Calculator className="h-5 w-5" />
          Daily Log Summary
        </CardTitle>
        <CardDescription>
          Complete overview of today&apos;s work and earnings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-hunks-green/10 border border-hunks-green/20">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-hunks-green" />
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="text-lg font-bold text-hunks-green">
              {formatCurrency(totalRevenue)}
            </p>
          </div>

          <div className="text-center p-3 rounded-lg bg-hunks-orange/10 border border-hunks-orange/20">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-hunks-orange" />
            <p className="text-xs text-muted-foreground">Total Tips</p>
            <p className="text-lg font-bold text-hunks-orange">
              {formatCurrency(totalTips)}
            </p>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50 border">
            <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Total Hours</p>
            <p className="text-lg font-bold">{totalHours.toFixed(1)}h</p>
          </div>

          <div className="text-center p-3 rounded-lg bg-muted/50 border">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Team Members</p>
            <p className="text-lg font-bold">{employeeSummary.length}</p>
          </div>
        </div>

        {/* Overall Labor Cost Progress */}
        {totalRevenue > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Overall Labor Cost Percentage
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">
                      Overall Labor Cost
                    </h4>
                    <div className="text-xs space-y-1">
                      <p>Total Labor Cost: {formatCurrency(totalLaborCost)}</p>
                      <p>Total Revenue: {formatCurrency(totalRevenue)}</p>
                      <p>
                        Overall Percentage:{' '}
                        {formatPercentage(overallLaborCostPercentage)}
                      </p>
                      <Separator className="my-2" />
                      <p className="text-muted-foreground">
                        This combines labor costs from all sections (Junk, Move,
                        and Other Hours)
                      </p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <div className="flex items-center gap-2">
                <Badge
                  variant={isOverallUnderGoal ? 'default' : 'destructive'}
                  className={
                    isOverallUnderGoal
                      ? 'bg-hunks-green hover:bg-hunks-green/90 text-white'
                      : ''
                  }
                >
                  {formatPercentage(overallLaborCostPercentage)}
                </Badge>
              </div>
            </div>
            <Progress
              value={overallProgressValue}
              className={`h-3 ${
                isOverallUnderGoal
                  ? '[&>div]:bg-hunks-green'
                  : '[&>div]:bg-destructive'
              }`}
            />
          </div>
        )}

        {/* Section Breakdown */}
        {(sectionBreakdown.junk ||
          sectionBreakdown.move ||
          sectionBreakdown.other) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Section Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {sectionBreakdown.junk && (
                  <div className="p-3 rounded-lg bg-muted/30 border">
                    <p className="font-medium text-hunks-green mb-2">
                      Junk Section
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-medium">
                          {formatCurrency(sectionBreakdown.junk.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor %:</span>
                        <span
                          className={`font-medium ${sectionBreakdown.junk.isUnderGoal ? 'text-hunks-green' : 'text-destructive'}`}
                        >
                          {formatPercentage(
                            sectionBreakdown.junk.laborCostPercentage
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hours:</span>
                        <span className="font-medium">
                          {sectionBreakdown.junk.totalHours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {sectionBreakdown.move && (
                  <div className="p-3 rounded-lg bg-muted/30 border">
                    <p className="font-medium text-hunks-orange mb-2">
                      Move Section
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-medium">
                          {formatCurrency(sectionBreakdown.move.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Labor %:</span>
                        <span
                          className={`font-medium ${sectionBreakdown.move.isUnderGoal ? 'text-hunks-green' : 'text-destructive'}`}
                        >
                          {formatPercentage(
                            sectionBreakdown.move.laborCostPercentage
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hours:</span>
                        <span className="font-medium">
                          {sectionBreakdown.move.totalHours.toFixed(1)}h
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {sectionBreakdown.other && (
                  <div className="p-3 rounded-lg bg-muted/30 border">
                    <p className="font-medium mb-2">Other Hours</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Labor Cost:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            sectionBreakdown.other.totalLaborCost
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hours:</span>
                        <span className="font-medium">
                          {sectionBreakdown.other.totalHours.toFixed(1)}h
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Team:</span>
                        <span className="font-medium">
                          {sectionBreakdown.other.employeeCount} HUNKs
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Employee Summary Table */}
        {employeeSummary.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Employee Summary</h4>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Tips</TableHead>
                      <TableHead className="text-right">Labor Cost</TableHead>
                      <TableHead>Departments</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employeeSummary.map((employee) => (
                      <TableRow key={employee.employeeId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            {employee.employeeName}
                            {captainId && employee.employeeId === captainId && (
                              <span 
                                className="text-lg" 
                                title="Captain" 
                                role="img" 
                                aria-label="Captain"
                              >
                                💪
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {employee.totalHours.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right text-hunks-orange font-medium">
                          {formatCurrency(employee.totalTips)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(employee.totalLaborCost)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {employee.departments.map((dept) => (
                              <Badge
                                key={dept.department}
                                variant="outline"
                                className="text-xs"
                              >
                                {dept.department}: {dept.hours.toFixed(1)}h
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
