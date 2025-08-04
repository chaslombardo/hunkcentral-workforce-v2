'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Info,
  Star,
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Department, User } from '@/types';

export interface DepartmentBreakdownData {
  department: Department;
  hours: number;
  rate: number;
  grossPay: number;
  percentage: number;
  isPrimary: boolean;
}

interface DepartmentBreakdownProps {
  departments: DepartmentBreakdownData[];
  totalHours: number;
  totalPay: number;
  user: User;
}

const DEPARTMENT_LABELS: Record<Department, string> = {
  junk: 'Junk Removal',
  move: 'Moving Services',
  zigma: 'Zigma Operations',
  training: 'Training',
  estimating: 'Estimating',
  warehouse: 'Warehouse',
  admin: 'Administrative',
};

const DEPARTMENT_COLORS: Record<Department, string> = {
  junk: 'bg-[#026937]',
  move: 'bg-[#ea7200]',
  zigma: 'bg-blue-500',
  training: 'bg-purple-500',
  estimating: 'bg-green-500',
  warehouse: 'bg-yellow-500',
  admin: 'bg-gray-500',
};

function DepartmentCard({ 
  department, 
  totalHours, 
  totalPay,
  user
}: { 
  department: DepartmentBreakdownData; 
  totalHours: number; 
  totalPay: number;
  user: User;
}) {
  const departmentLabel = DEPARTMENT_LABELS[department.department];
  const colorClass = DEPARTMENT_COLORS[department.department];

  // Get rate information for tooltips
  const getRateInfo = () => {
    const dept = department.department;
    if (dept === 'junk') {
      return {
        captainRate: user.rateJunkCaptain,
        wingmanRate: user.rateJunkWingman,
        currentRate: department.rate,
      };
    } else if (dept === 'move') {
      return {
        captainRate: user.rateMoveCaptain,
        wingmanRate: user.rateMoveWingman,
        currentRate: department.rate,
      };
    } else {
      return {
        currentRate: department.rate,
      };
    }
  };

  const rateInfo = getRateInfo();

  return (
    <Card className={`@container/card ${department.isPrimary ? 'border-[#026937] border-2' : ''}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${colorClass} flex-shrink-0`} />
          <span className="truncate">{departmentLabel}</span>
          {department.isPrimary && (
            <Badge className="bg-[#026937] hover:bg-[#026937]/90 text-xs flex-shrink-0">
              <Star className="h-3 w-3 mr-1" />
              Primary
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {department.hours}h @ {formatCurrency(department.rate)}/hr
        </CardDescription>
        <CardAction>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Info className="h-3 w-3" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">{departmentLabel} Rate Information</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Current Rate:</span>
                    <span className="font-mono">{formatCurrency(rateInfo.currentRate)}/hr</span>
                  </div>
                  {rateInfo.captainRate && (
                    <div className="flex justify-between">
                      <span>Captain Rate:</span>
                      <span className="font-mono">{formatCurrency(rateInfo.captainRate)}/hr</span>
                    </div>
                  )}
                  {rateInfo.wingmanRate && (
                    <div className="flex justify-between">
                      <span>Wingman Rate:</span>
                      <span className="font-mono">{formatCurrency(rateInfo.wingmanRate)}/hr</span>
                    </div>
                  )}
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">
                  {department.department === 'junk' || department.department === 'move' 
                    ? 'Captain rates apply when you are the captain or co-captain on a job.'
                    : 'This department has a single hourly rate for all roles.'}
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {formatCurrency(department.grossPay)}
            </div>
            <Badge variant="outline" className="mt-2">
              <Clock className="h-3 w-3 mr-1" />
              {department.percentage.toFixed(1)}%
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hours Distribution:</span>
              <span>{department.percentage.toFixed(1)}% of total</span>
            </div>
            <Progress 
              value={department.percentage} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{department.hours} hours</span>
              <span>{totalHours} total</span>
            </div>
          </div>
          
          <div className="flex justify-between text-sm">
            <span>Pay Distribution:</span>
            <span>{((department.grossPay / totalPay) * 100).toFixed(1)}% of total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DepartmentBreakdown({ 
  departments, 
  totalHours, 
  totalPay,
  user 
}: DepartmentBreakdownProps) {
  // Handle undefined or null departments array
  if (!departments || !Array.isArray(departments)) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>Department breakdown data is not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Filter out departments with no hours
  const activeDepartments = departments.filter(dept => dept.hours > 0);
  
  // Sort by hours (descending) to show primary department first
  const sortedDepartments = activeDepartments.sort((a, b) => b.hours - a.hours);

  if (activeDepartments.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No department hours recorded for this period</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Department Breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Hours and pay across {activeDepartments.length} departments
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Pay</div>
            <div className="font-semibold tabular-nums text-xl">
              {formatCurrency(totalPay)}
            </div>
          </div>
        </div>

        {/* Department Cards Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sortedDepartments.map((department) => (
            <DepartmentCard
              key={department.department}
              department={department}
              totalHours={totalHours}
              totalPay={totalPay}
              user={user}
            />
          ))}
        </div>

        {/* Summary Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Department Summary</CardTitle>
            <CardDescription>
              Overview of your work distribution and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm grid-cols-2 md:grid-cols-4">
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {activeDepartments.length}
                </div>
                <div className="text-muted-foreground text-xs">Departments</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {totalHours}h
                </div>
                <div className="text-muted-foreground text-xs">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {formatCurrency(totalPay / totalHours)}
                </div>
                <div className="text-muted-foreground text-xs">Avg Rate</div>
              </div>
              <div className="text-center">
                <div className="font-semibold capitalize text-lg">
                  {sortedDepartments[0]?.department || 'N/A'}
                </div>
                <div className="text-muted-foreground text-xs">Primary Dept</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}