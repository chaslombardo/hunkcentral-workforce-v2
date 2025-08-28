'use client';

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Award } from 'lucide-react';
import { formatCurrency, formatHours } from '@/lib/formatters';
import type { PayPeriod } from '@/types';
import type { PayrollCalculation } from '@/lib/payCalculator';

interface PayrollSummaryCardsProps {
  payrollData: PayrollCalculation[];
  selectedPeriod: PayPeriod | null;
}

export function PayrollSummaryCards({
  payrollData,
  selectedPeriod,
}: PayrollSummaryCardsProps) {
  // Calculate summary metrics
  const totalEmployees = payrollData.length;
  const totalPayroll = payrollData.reduce(
    (sum, calc) => sum + calc.totalPay,
    0
  );
  const totalHours = payrollData.reduce(
    (sum, calc) => sum + calc.totalHours,
    0
  );
  const totalTips = payrollData.reduce((sum, calc) => sum + calc.tips, 0);
  const totalBonuses = payrollData.reduce((sum, calc) => sum + calc.bonuses, 0);

  // Note: Historical comparison data would come from API in real implementation
  // For now, showing current period data without comparison

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Payroll */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Payroll</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalPayroll)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              Current Period
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total pay for current period
          </div>
          <div className="text-muted-foreground">
            {selectedPeriod ? `For ${selectedPeriod.name}` : 'Current period'}
          </div>
        </CardFooter>
      </Card>

      {/* Total Employees */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Employees</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalEmployees}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users className="h-3 w-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All employees with hours <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">Across all departments</div>
        </CardFooter>
      </Card>

      {/* Total Hours */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Hours</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatHours(totalHours)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              Current Period
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total hours worked <Clock className="size-4" />
          </div>
          <div className="text-muted-foreground">All departments combined</div>
        </CardFooter>
      </Card>

      {/* Tips & Bonuses */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tips & Bonuses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalTips + totalBonuses)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Award className="h-3 w-3" />
              Performance
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tips: {formatCurrency(totalTips)} • Bonuses:{' '}
            {formatCurrency(totalBonuses)}
            <Award className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Performance-based compensation
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
