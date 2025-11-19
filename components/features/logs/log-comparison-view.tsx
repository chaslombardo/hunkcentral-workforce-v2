'use client';

import * as React from 'react';
import { format } from 'date-fns';
import {
  IconArrowLeft,
  IconCalendar,
  IconCircleCheckFilled,
  IconCurrencyDollar,
  IconUser,
  IconClock,
} from '@tabler/icons-react';

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
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Types for comparison data
type ComparisonLogData = {
  id: string;
  captain: {
    id: string;
    fullName: string;
  };
  logDate: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  approvedAt?: Date;
  jobs: Array<{
    id: string;
    jobType: 'junk' | 'move';
    jobId: string;
    clientName: string;
    revenue: number;
    tips: number;
    junkOnMove?: number;
    valuation?: number;
    materials?: number;
    disposalCost?: number;
  }>;
  hours: Array<{
    id: string;
    employee: {
      id: string;
      fullName: string;
    };
    department: string;
    hours: number;
    isCoCaptain: boolean;
  }>;
};

interface LogComparisonViewProps {
  primaryLog: ComparisonLogData;
  comparisonLog?: ComparisonLogData;
  onBack?: () => void;
}

export function LogComparisonView({
  primaryLog,
  comparisonLog,
  onBack,
}: LogComparisonViewProps) {
  // Calculate totals for primary log
  const primaryTotalRevenue = primaryLog.jobs.reduce(
    (sum, job) => sum + Number(job.revenue),
    0
  );
  const primaryTotalHours = primaryLog.hours.reduce(
    (sum, hour) => sum + Number(hour.hours),
    0
  );

  // Calculate totals for comparison log if available
  const comparisonTotalRevenue =
    comparisonLog?.jobs.reduce((sum, job) => sum + Number(job.revenue), 0) || 0;
  const comparisonTotalHours =
    comparisonLog?.hours.reduce((sum, hour) => sum + Number(hour.hours), 0) ||
    0;

  const LogSummaryCard = ({
    log,
    totalRevenue,
    totalHours,
    title,
  }: {
    log: ComparisonLogData | undefined;
    totalRevenue: number;
    totalHours: number;
    title: string;
  }) => {
    if (!log) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>No comparison data available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              Select a log to compare
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <Badge
              variant={
                log.status === 'approved'
                  ? 'default'
                  : log.status === 'submitted'
                    ? 'secondary'
                    : 'destructive'
              }
              className="capitalize"
            >
              {log.status === 'approved' && (
                <IconCircleCheckFilled className="w-3 h-3 mr-1" />
              )}
              {log.status}
            </Badge>
          </CardTitle>
          <CardDescription>
            {format(new Date(log.logDate), 'EEEE, MMMM dd, yyyy')} •
            {log.submittedAt &&
              ` Submitted ${format(new Date(log.submittedAt), "MMM dd 'at' h:mm a")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconUser className="w-4 h-4" />
                  Captain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{log.captain.fullName}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconCalendar className="w-4 h-4" />
                  Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">
                  {format(new Date(log.logDate), 'MMM dd')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconCurrencyDollar className="w-4 h-4" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">${totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconClock className="w-4 h-4" />
                  Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold">{totalHours}</p>
              </CardContent>
            </Card>
          </div>

          {/* Jobs Summary */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Jobs Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Jobs:</span>
                  <span className="font-medium">{log.jobs.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Junk Jobs:</span>
                  <span className="font-medium">
                    {log.jobs.filter((j) => j.jobType === 'junk').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Move Jobs:</span>
                  <span className="font-medium">
                    {log.jobs.filter((j) => j.jobType === 'move').length}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium mb-2">Team Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Team Members:</span>
                  <span className="font-medium">
                    {new Set(log.hours.map((h) => h.employee.id)).size}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Co-Captains:</span>
                  <span className="font-medium">
                    {log.hours.filter((h) => h.isCoCaptain).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Tips:</span>
                  <span className="font-medium">
                    $
                    {log.jobs
                      .reduce((sum, job) => sum + Number(job.tips), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <IconArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Log Comparison</h1>
          <p className="text-muted-foreground">
            Side-by-side comparison of daily logs
          </p>
        </div>
      </div>

      {/* Resizable Comparison Panels */}
      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[600px] rounded-lg border"
      >
        {/* Primary Log Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full p-6">
            <LogSummaryCard
              log={primaryLog}
              totalRevenue={primaryTotalRevenue}
              totalHours={primaryTotalHours}
              title="Primary Log"
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Comparison Log Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full p-6">
            <LogSummaryCard
              log={comparisonLog}
              totalRevenue={comparisonTotalRevenue}
              totalHours={comparisonTotalHours}
              title="Comparison Log"
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Detailed Comparison Tables */}
      {comparisonLog && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Comparison</CardTitle>
            <CardDescription>
              Side-by-side comparison of job and hour details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="jobs" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="jobs">Jobs Comparison</TabsTrigger>
                <TabsTrigger value="hours">Hours Comparison</TabsTrigger>
              </TabsList>

              <TabsContent value="jobs" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Primary Log Jobs */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Primary Log Jobs
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {primaryLog.jobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">
                              {job.jobId}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {job.jobType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              ${job.revenue.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Comparison Log Jobs */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Comparison Log Jobs
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonLog.jobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">
                              {job.jobId}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {job.jobType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              ${job.revenue.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hours" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Primary Log Hours */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Primary Log Hours
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {primaryLog.hours.map((hour) => (
                          <TableRow key={hour.id}>
                            <TableCell className="font-medium">
                              {hour.employee.fullName}
                            </TableCell>
                            <TableCell className="capitalize">
                              {hour.department}
                            </TableCell>
                            <TableCell className="text-right">
                              {hour.hours}h
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Comparison Log Hours */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Comparison Log Hours
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-right">Hours</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparisonLog.hours.map((hour) => (
                          <TableRow key={hour.id}>
                            <TableCell className="font-medium">
                              {hour.employee.fullName}
                            </TableCell>
                            <TableCell className="capitalize">
                              {hour.department}
                            </TableCell>
                            <TableCell className="text-right">
                              {hour.hours}h
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
