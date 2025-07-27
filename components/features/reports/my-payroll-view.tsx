'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  DollarSign,
  Download,
  TrendingUp,
  Award,
} from 'lucide-react';
import type { PayPeriod, User } from '@/types';
import type { PayrollCalculation } from '@/lib/payCalculator';

// Mock data for current user - replace with actual user data
const mockUserPayroll: PayrollCalculation = {
  employeeId: '1',
  employee: {
    id: '1',
    fullName: 'John Smith',
    email: 'john@example.com',
    roles: ['captain'],
  } as User,
  totalHours: 40,
  hoursByDepartment: { junk: 40, move: 0, zigma: 0, training: 0, estimating: 0, warehouse: 0, admin: 0 },
  grossWages: 720,
  tips: 150,
  bonuses: 85,
  commission: 0,
  totalPay: 955,
  breakdown: {
    hourlyWages: 720,
    salaryAmount: 0,
    salaryType: null,
    salaryFrequency: null,
    tips: 150,
    commission: 0,
    laborBonuses: 85,
    totalBeforeSalaryAdjustment: 955,
    finalPay: 955,
  },
};

// Mock pay periods
const mockPayPeriods: PayPeriod[] = [
  {
    id: '1',
    name: 'January 2025 - Week 1',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-07'),
    status: 'closed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'January 2025 - Week 2',
    startDate: new Date('2025-01-08'),
    endDate: new Date('2025-01-14'),
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    name: 'December 2024 - Week 4',
    startDate: new Date('2024-12-23'),
    endDate: new Date('2024-12-29'),
    status: 'closed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock historical data for trends
const mockHistoricalData = [
  { period: 'Dec Week 4', totalPay: 890, hours: 38, tips: 120 },
  { period: 'Jan Week 1', totalPay: 955, hours: 40, tips: 150 },
  { period: 'Jan Week 2', totalPay: 1020, hours: 42, tips: 180 },
];

export function MyPayrollView() {
  const [selectedPeriod, setSelectedPeriod] = React.useState<PayPeriod>(mockPayPeriods[0]);
  const [userPayroll] = React.useState<PayrollCalculation>(mockUserPayroll);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calculateTrend = () => {
    const currentPay = userPayroll.totalPay;
    const previousPay = mockHistoricalData[0].totalPay;
    const change = ((currentPay - previousPay) / previousPay) * 100;
    return {
      percentage: change,
      isPositive: change > 0,
    };
  };

  const trend = calculateTrend();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Header Section */}
          <div className="px-4 lg:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">My Payroll</h1>
                <p className="text-muted-foreground">
                  View your compensation details and pay history
                </p>
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Pay Period Selector */}
                <Select
                  value={selectedPeriod.id}
                  onValueChange={(value) => {
                    const period = mockPayPeriods.find(p => p.id === value);
                    if (period) setSelectedPeriod(period);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPayPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        <div className="flex items-center gap-2">
                          <span>{period.name}</span>
                          <Badge 
                            variant={period.status === 'closed' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {period.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Paystub
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {/* Total Pay */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Pay</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(userPayroll.totalPay)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={trend.isPositive ? 'default' : 'secondary'}>
                    <TrendingUp className="h-3 w-3" />
                    {trend.isPositive ? '+' : ''}{trend.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {trend.isPositive ? 'Increased' : 'Decreased'} from last period
                  <TrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  {formatDate(selectedPeriod.startDate)} - {formatDate(selectedPeriod.endDate)}
                </div>
              </CardContent>
            </Card>

            {/* Hours Worked */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Hours Worked</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {userPayroll.totalHours}h
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Clock className="h-3 w-3" />
                    Regular
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Total hours worked this period
                  <Clock className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Primary department: {Object.entries(userPayroll.hoursByDepartment)
                    .find(([, hours]) => hours > 0)?.[0] || 'admin'}
                </div>
              </CardContent>
            </Card>

            {/* Tips Earned */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Tips Earned</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(userPayroll.tips)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <DollarSign className="h-3 w-3" />
                    Performance
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Great customer service!
                  <Award className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Average per job: {formatCurrency(userPayroll.tips / 8)}
                </div>
              </CardContent>
            </Card>

            {/* Bonuses */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Bonuses</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(userPayroll.bonuses)}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Award className="h-3 w-3" />
                    Labor Bonus
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Efficiency bonus earned
                  <Award className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Performance bonus earned
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Pay Breakdown</CardTitle>
                <CardDescription>
                  Detailed breakdown of your compensation for {selectedPeriod.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {/* Regular Pay */}
                  <AccordionItem value="regular-pay">
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>Regular Pay</span>
                        <span className="font-mono">{formatCurrency(userPayroll.grossWages)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Hours:</span>
                          <span>{userPayroll.totalHours} hours</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Primary Department:</span>
                          <span className="capitalize">
                            {Object.entries(userPayroll.hoursByDepartment)
                              .find(([, hours]) => hours > 0)?.[0] || 'admin'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Gross Wages:</span>
                          <span>{formatCurrency(userPayroll.grossWages)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(userPayroll.grossWages)}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>



                  {/* Tips */}
                  <AccordionItem value="tips">
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>Tips</span>
                        <span className="font-mono">{formatCurrency(userPayroll.tips)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Tips Received:</span>
                          <span>{formatCurrency(userPayroll.tips)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Jobs Completed:</span>
                          <span>8 jobs</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Average per Job:</span>
                          <span>{formatCurrency(userPayroll.tips / 8)}</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Bonuses */}
                  <AccordionItem value="bonuses">
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full mr-4">
                        <span>Bonuses</span>
                        <span className="font-mono">{formatCurrency(userPayroll.bonuses)}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Labor Efficiency Bonus:</span>
                          <span>{formatCurrency(userPayroll.bonuses)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Labor Cost Percentage:</span>
                          <span>16.0%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Target:</span>
                          <span>14.0%</span>
                        </div>
                        <div className="mt-2">
                          <Progress 
                            value={Math.min(100, (14 / 16) * 100)} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Separator className="my-4" />

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Pay:</span>
                  <span className="font-mono">{formatCurrency(userPayroll.totalPay)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pay History */}
          <div className="px-4 lg:px-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Pay History</CardTitle>
                <CardDescription>
                  Your compensation over the last few pay periods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pay Period</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Tips</TableHead>
                      <TableHead className="text-right">Bonuses</TableHead>
                      <TableHead className="text-right">Total Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockHistoricalData.map((period, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{period.period}</TableCell>
                        <TableCell className="text-right font-mono">
                          {period.hours}h
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(period.tips)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(85)} {/* Mock bonus */}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(period.totalPay)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}