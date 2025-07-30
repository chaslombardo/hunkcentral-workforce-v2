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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Clock,
  DollarSign,
  Download,
  TrendingUp,
  TrendingDown,
  Award,
} from 'lucide-react';
import { formatCurrency, formatDate, calculateTrend } from '@/lib/formatters';
import type { PayPeriod, User, Department } from '@/types';
import type { PayrollCalculation } from '@/lib/payCalculator';
import { DepartmentBreakdown, type DepartmentBreakdownData } from './payroll-breakdown/department-breakdown';
import { RateInformationPanel } from './payroll-breakdown/rate-information-panel';
import { DailyWorkCalendar } from './payroll-breakdown/daily-work-calendar';
import { TipsDetailView } from './payroll-breakdown/tips-detail-view';
import type { DailyWorkEntry, WorkPatternStats } from '@/lib/actions/daily-work';
import type { TipEntry } from '@/lib/payCalculator';

// Mock data for current user - replace with actual user data
const mockUser: User = {
  id: '1',
  fullName: 'John Smith',
  email: 'john@example.com',
  roles: ['captain'],
  rateJunkCaptain: 20,
  rateJunkWingman: 16,
  rateMoveCaptain: 22,
  rateMoveWingman: 18,
  rateZigma: 19,
  rateTraining: 15,
  rateEstimating: 25,
  rateWarehouse: 17,
  rateAdmin: 14,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserPayroll: PayrollCalculation = {
  employeeId: '1',
  employee: mockUser,
  totalHours: 40,
  hoursByDepartment: { junk: 30, move: 8, zigma: 2, training: 0, estimating: 0, warehouse: 0, admin: 0 },
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

// Mock department breakdown data
const mockDepartmentBreakdown: DepartmentBreakdownData[] = [
  {
    department: 'junk',
    hours: 30,
    rate: 20, // Captain rate
    grossPay: 600,
    percentage: 75,
    isPrimary: true,
  },
  {
    department: 'move',
    hours: 8,
    rate: 18, // Wingman rate
    grossPay: 144,
    percentage: 20,
    isPrimary: false,
  },
  {
    department: 'zigma',
    hours: 2,
    rate: 19,
    grossPay: 38,
    percentage: 5,
    isPrimary: false,
  },
];

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

// Mock daily work entries for calendar
const mockDailyWorkEntries: DailyWorkEntry[] = [
  {
    date: new Date('2025-01-02'),
    logId: 'log-1',
    departments: [
      { department: 'junk', hours: 6, rate: 20, role: 'captain' },
      { department: 'move', hours: 2, rate: 18, role: 'wingman' },
    ],
    tips: 45,
    totalHours: 8,
    grossPay: 156,
    jobsCompleted: 3,
  },
  {
    date: new Date('2025-01-03'),
    logId: 'log-2',
    departments: [
      { department: 'junk', hours: 8, rate: 20, role: 'captain' },
    ],
    tips: 60,
    totalHours: 8,
    grossPay: 160,
    jobsCompleted: 4,
  },
  {
    date: new Date('2025-01-06'),
    logId: 'log-3',
    departments: [
      { department: 'move', hours: 6, rate: 22, role: 'captain' },
      { department: 'zigma', hours: 2, rate: 19, role: 'wingman' },
    ],
    tips: 35,
    totalHours: 8,
    grossPay: 170,
    jobsCompleted: 2,
  },
];

// Mock work pattern stats
const mockWorkPatternStats: WorkPatternStats = {
  totalDaysWorked: 15,
  avgHoursPerDay: 8.2,
  mostCommonDepartment: 'junk',
  totalJobsCompleted: 45,
  avgTipsPerDay: 42.5,
  busiestDay: new Date('2025-01-03'),
  highestTipDay: new Date('2025-01-03'),
  highestPayDay: new Date('2025-01-06'),
};

// Mock tips breakdown data
const mockTipsBreakdown: TipEntry[] = [
  {
    date: new Date('2025-01-02'),
    jobId: 'J2025-001',
    clientName: 'Smith Residence',
    totalJobTips: 80,
    teamMembers: 4,
    myShare: 20,
    jobType: 'junk',
    logId: 'log-1',
  },
  {
    date: new Date('2025-01-02'),
    jobId: 'J2025-002',
    clientName: 'Downtown Office',
    totalJobTips: 60,
    teamMembers: 3,
    myShare: 20,
    jobType: 'junk',
    logId: 'log-1',
  },
  {
    date: new Date('2025-01-03'),
    jobId: 'J2025-003',
    clientName: 'Johnson Family',
    totalJobTips: 100,
    teamMembers: 4,
    myShare: 25,
    jobType: 'junk',
    logId: 'log-2',
  },
  {
    date: new Date('2025-01-03'),
    jobId: 'J2025-004',
    clientName: 'Corporate Move',
    totalJobTips: 120,
    teamMembers: 4,
    myShare: 30,
    jobType: 'junk',
    logId: 'log-2',
  },
  {
    date: new Date('2025-01-06'),
    jobId: 'M2025-001',
    clientName: 'Miller Apartment',
    totalJobTips: 40,
    teamMembers: 2,
    myShare: 20,
    jobType: 'move',
    logId: 'log-3',
  },
  {
    date: new Date('2025-01-06'),
    jobId: 'J2025-005',
    clientName: 'Wilson House',
    totalJobTips: 30,
    teamMembers: 2,
    myShare: 15,
    jobType: 'junk',
    logId: 'log-3',
  },
  {
    date: new Date('2025-01-07'),
    jobId: 'M2025-002',
    clientName: 'Davis Relocation',
    totalJobTips: 90,
    teamMembers: 3,
    myShare: 30,
    jobType: 'move',
    logId: 'log-4',
  },
];

export function MyPayrollView() {
  const [selectedPeriod, setSelectedPeriod] = React.useState<PayPeriod>(mockPayPeriods[0]);
  const [userPayroll] = React.useState<PayrollCalculation>(mockUserPayroll);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();

  const trend = calculateTrend(userPayroll.totalPay, mockHistoricalData[0].totalPay);

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

          {/* Summary Cards - Following dashboard-01 SectionCards pattern */}
          <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {/* Total Pay */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Pay</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(userPayroll.totalPay)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trend.isPositive ? '+' : ''}{trend.percentage.toFixed(1)}%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {trend.isPositive ? 'Increased' : 'Decreased'} from last period
                  {trend.isPositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                </div>
                <div className="text-muted-foreground">
                  {formatDate(selectedPeriod.startDate)} - {formatDate(selectedPeriod.endDate)}
                </div>
              </CardFooter>
            </Card>

            {/* Hours Worked */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Hours Worked</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {userPayroll.totalHours}h
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3" />
                    Regular
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Total hours worked this period
                  <Clock className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Primary department: {Object.entries(userPayroll.hoursByDepartment)
                    .find(([, hours]) => hours > 0)?.[0] || 'admin'}
                </div>
              </CardFooter>
            </Card>

            {/* Tips Earned */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Tips Earned</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(userPayroll.tips)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <DollarSign className="h-3 w-3" />
                    Performance
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Great customer service!
                  <Award className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Average per job: {formatCurrency(userPayroll.tips / 8)}
                </div>
              </CardFooter>
            </Card>

            {/* Bonuses */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Bonuses</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(userPayroll.bonuses)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Award className="h-3 w-3" />
                    Labor Bonus
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Efficiency bonus earned
                  <Award className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Performance bonus earned
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Tabs for different views - Following dashboard-01 Tabs pattern */}
          <Tabs defaultValue="breakdown" className="w-full flex-col justify-start gap-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
              <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
                <TabsTrigger value="breakdown">Pay Breakdown</TabsTrigger>
                <TabsTrigger value="daily">Daily History</TabsTrigger>
                <TabsTrigger value="tips">Tips Details</TabsTrigger>
                <TabsTrigger value="history">Pay History</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
            </div>

            {/* Pay Breakdown Tab */}
            <TabsContent value="breakdown" className="flex flex-col px-4 lg:px-6">
              <div className="space-y-6">
                {/* Department Breakdown */}
                <DepartmentBreakdown
                  departments={mockDepartmentBreakdown}
                  totalHours={userPayroll.totalHours}
                  totalPay={userPayroll.totalPay}
                  user={userPayroll.employee}
                />

                {/* Rate Information Panel */}
                <RateInformationPanel
                  user={userPayroll.employee}
                  departmentHours={userPayroll.hoursByDepartment}
                />

                {/* Traditional Pay Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pay Components</CardTitle>
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
            </TabsContent>

            {/* Daily History Tab */}
            <TabsContent value="daily" className="flex flex-col px-4 lg:px-6">
              <DailyWorkCalendar
                workEntries={mockDailyWorkEntries}
                workPatternStats={mockWorkPatternStats}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                payPeriodStart={selectedPeriod.startDate}
                payPeriodEnd={selectedPeriod.endDate}
              />
            </TabsContent>

            {/* Tips Details Tab */}
            <TabsContent value="tips" className="flex flex-col px-4 lg:px-6">
              <TipsDetailView
                tips={mockTipsBreakdown}
                totalTips={userPayroll.tips}
                payPeriodStart={selectedPeriod.startDate}
                payPeriodEnd={selectedPeriod.endDate}
              />
            </TabsContent>

            {/* Pay History Tab */}
            <TabsContent value="history" className="flex flex-col px-4 lg:px-6">
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
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="flex flex-col px-4 lg:px-6">
              <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg font-medium">Performance Metrics</div>
                  <div className="text-sm">Labor efficiency, tip averages, and performance trends</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}