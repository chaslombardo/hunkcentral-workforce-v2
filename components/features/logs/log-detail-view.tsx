'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { notFound, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  IconArrowLeft,
  IconBriefcase,
  IconCalendar,
  IconCircleCheckFilled,
  IconCurrencyDollar,
  IconEdit,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { loadLog, approveLog } from '@/lib/actions/logs';

// Types based on the loadLog server action response
type LogJob = {
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
};

type LogHour = {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    fullName: string;
  };
  department: string;
  hours: number;
  isCoCaptain: boolean;
};

type LogDetailData = {
  id: string;
  captainId: string;
  captain: {
    id: string;
    fullName: string;
  };
  logDate: Date;
  status: 'draft' | 'submitted' | 'approved';
  submittedAt?: Date;
  approvedAt?: Date;
  jobs: LogJob[];
  hours: LogHour[];
  createdAt: Date;
  updatedAt: Date;
};

interface LogDetailViewProps {
  logId: string;
}

export function LogDetailView({ logId }: LogDetailViewProps) {
  const router = useRouter();
  const [logData, setLogData] = React.useState<LogDetailData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [comments, setComments] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);

  // Load log data
  React.useEffect(() => {
    async function fetchLogData() {
      setLoading(true);
      try {
        const result = await loadLog(logId);
        if (result.success && result.data) {
          setLogData(result.data as LogDetailData);
        } else {
          if (result.error === 'Log not found') {
            notFound();
          } else if (result.error?.includes('Database connection')) {
            toast.error(
              'Database connection issue. Please try again in a moment.'
            );
          } else if (result.error?.includes('Authentication')) {
            toast.error('Please log in again to continue.');
            // Redirect to login could be added here
          } else if (result.error?.includes('Permission denied')) {
            toast.error('You do not have permission to view this log.');
          } else {
            toast.error(result.error || 'Failed to load log');
          }
        }
      } catch (error) {
        console.error('Error loading log:', error);
        toast.error('An unexpected error occurred while loading the log');
      } finally {
        setLoading(false);
      }
    }
    fetchLogData();
  }, [logId]);

  const handleApprove = async () => {
    if (!logData) return;

    setActionLoading(true);
    try {
      const result = await approveLog(logData.id, comments);
      if (result.success) {
        toast.success('Log approved successfully');

        // Show commission matching notifications if available
        if (result.data?.commissionMatching) {
          const { matchCount, conflictCount } = result.data.commissionMatching;

          if (matchCount > 0) {
            toast.success(`${matchCount} commission(s) automatically matched`, {
              description:
                conflictCount > 0
                  ? `${conflictCount} conflict(s) need manual resolution`
                  : undefined,
            });
          }

          if (conflictCount > 0) {
            toast.warning(`${conflictCount} commission conflict(s) detected`, {
              description:
                'Check the Commission Conflicts tab for manual resolution',
            });
          }
        }

        // Refresh log data
        const refreshResult = await loadLog(logId);
        if (refreshResult.success && refreshResult.data) {
          setLogData(refreshResult.data as LogDetailData);
        }
      } else {
        toast.error(result.error || 'Failed to approve log');
      }
    } catch {
      toast.error('Failed to approve log');
      // Error approving log
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>; // This will be replaced by LogDetailSkeleton
  }

  if (!logData) {
    return <div>Log not found</div>;
  }

  // Calculate totals
  const totalRevenue = logData.jobs.reduce(
    (sum, job) => sum + Number(job.revenue),
    0
  );
  const totalHours = logData.hours.reduce(
    (sum, hour) => sum + Number(hour.hours),
    0
  );
  const junkJobs = logData.jobs.filter((job) => job.jobType === 'junk');
  const moveJobs = logData.jobs.filter((job) => job.jobType === 'move');
  const junkHours = logData.hours.filter((hour) => hour.department === 'junk');
  const moveHours = logData.hours.filter((hour) => hour.department === 'move');
  const otherHours = logData.hours.filter(
    (hour) => !['junk', 'move'].includes(hour.department)
  );

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Log Details - {logData.captain.fullName}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(logData.logDate), 'EEEE, MMMM dd, yyyy')} •
              {logData.submittedAt &&
                ` Submitted ${format(new Date(logData.submittedAt), "MMM dd 'at' h:mm a")}`}
            </p>
          </div>
        </div>
        <Badge
          variant={logData.status === 'approved' ? 'default' : 'secondary'}
          className="capitalize text-sm px-3 py-1"
        >
          {logData.status === 'approved' && (
            <IconCircleCheckFilled className="w-4 h-4 mr-2" />
          )}
          {logData.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconUser className="w-4 h-4" />
                  Captain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{logData.captain.fullName}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconCalendar className="w-4 h-4" />
                  Log Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {format(new Date(logData.logDate), 'MMM dd')}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconCurrencyDollar className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <IconClock className="w-4 h-4" />
                  Total Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalHours}</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="junk">
                      Junk Jobs ({junkJobs.length})
                    </TabsTrigger>
                    <TabsTrigger value="move">
                      Move Jobs ({moveJobs.length})
                    </TabsTrigger>
                    <TabsTrigger value="hours">Team Hours</TabsTrigger>
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="overview" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Job Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Jobs:</span>
                            <span className="font-medium">
                              {logData.jobs.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Junk Jobs:</span>
                            <span className="font-medium">
                              {junkJobs.length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Move Jobs:</span>
                            <span className="font-medium">
                              {moveJobs.length}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span>Total Revenue:</span>
                            <span className="font-medium">
                              ${totalRevenue.toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Team Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Hours:</span>
                            <span className="font-medium">{totalHours}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Team Members:</span>
                            <span className="font-medium">
                              {
                                new Set(logData.hours.map((h) => h.employeeId))
                                  .size
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Co-Captains:</span>
                            <span className="font-medium">
                              {
                                logData.hours.filter((h) => h.isCoCaptain)
                                  .length
                              }
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="junk" className="space-y-4 mt-0">
                    {junkJobs.length > 0 ? (
                      <div className="space-y-4">
                        {junkJobs.map((job) => (
                          <Card key={job.id}>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <IconBriefcase className="w-4 h-4" />
                                {job.jobId}
                              </CardTitle>
                              <CardDescription>
                                {job.clientName}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>Revenue:</span>
                                <span className="font-medium">
                                  ${job.revenue.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tips:</span>
                                <span className="font-medium">
                                  ${job.tips.toFixed(2)}
                                </span>
                              </div>
                              {job.disposalCost && (
                                <div className="flex justify-between">
                                  <span>Disposal Cost:</span>
                                  <span className="font-medium">
                                    ${job.disposalCost.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No junk jobs recorded
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="move" className="space-y-4 mt-0">
                    {moveJobs.length > 0 ? (
                      <div className="space-y-4">
                        {moveJobs.map((job) => (
                          <Card key={job.id}>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <IconBriefcase className="w-4 h-4" />
                                {job.jobId}
                              </CardTitle>
                              <CardDescription>
                                {job.clientName}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between">
                                <span>Revenue:</span>
                                <span className="font-medium">
                                  ${job.revenue.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tips:</span>
                                <span className="font-medium">
                                  ${job.tips.toFixed(2)}
                                </span>
                              </div>
                              {job.junkOnMove && (
                                <div className="flex justify-between">
                                  <span>Junk on Move:</span>
                                  <span className="font-medium">
                                    ${job.junkOnMove.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {job.valuation && (
                                <div className="flex justify-between">
                                  <span>Valuation:</span>
                                  <span className="font-medium">
                                    ${job.valuation.toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {job.materials && (
                                <div className="flex justify-between">
                                  <span>Materials:</span>
                                  <span className="font-medium">
                                    ${job.materials.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No move jobs recorded
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="hours" className="space-y-4 mt-0">
                    <div className="space-y-6">
                      {junkHours.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">
                            Junk Department
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Role</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {junkHours.map((hour) => (
                                <TableRow key={hour.id}>
                                  <TableCell className="font-medium">
                                    {hour.employee.fullName}
                                  </TableCell>
                                  <TableCell>{hour.hours}h</TableCell>
                                  <TableCell>
                                    {hour.isCoCaptain ? (
                                      <Badge variant="secondary">
                                        Co-Captain
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Wingman</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {moveHours.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">
                            Move Department
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Hours</TableHead>
                                <TableHead>Role</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {moveHours.map((hour) => (
                                <TableRow key={hour.id}>
                                  <TableCell className="font-medium">
                                    {hour.employee.fullName}
                                  </TableCell>
                                  <TableCell>{hour.hours}h</TableCell>
                                  <TableCell>
                                    {hour.isCoCaptain ? (
                                      <Badge variant="secondary">
                                        Co-Captain
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Wingman</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {otherHours.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3">
                            Other Hours
                          </h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Hours</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {otherHours.map((hour) => (
                                <TableRow key={hour.id}>
                                  <TableCell className="font-medium">
                                    {hour.employee.fullName}
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {hour.department}
                                  </TableCell>
                                  <TableCell>{hour.hours}h</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}

                      {logData.hours.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No hours recorded
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="summary" className="space-y-4 mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Employee Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="text-right">
                                  Total Hours
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(
                                logData.hours.reduce(
                                  (acc, hour) => {
                                    const name = hour.employee.fullName;
                                    acc[name] =
                                      (acc[name] || 0) + Number(hour.hours);
                                    return acc;
                                  },
                                  {} as Record<string, number>
                                )
                              ).map(([name, hours]) => (
                                <TableRow key={name}>
                                  <TableCell className="font-medium">
                                    {name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {hours}h
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Revenue Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span>Junk Revenue:</span>
                            <span className="font-medium">
                              $
                              {junkJobs
                                .reduce(
                                  (sum, job) => sum + Number(job.revenue),
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Move Revenue:</span>
                            <span className="font-medium">
                              $
                              {moveJobs
                                .reduce(
                                  (sum, job) => sum + Number(job.revenue),
                                  0
                                )
                                .toFixed(2)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span>Total Tips:</span>
                            <span className="font-medium">
                              $
                              {logData.jobs
                                .reduce((sum, job) => sum + Number(job.tips), 0)
                                .toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Total Revenue:</span>
                            <span>${totalRevenue.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Actions Panel - Right Side */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Actions
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/logs/${logData.id}/edit`)}
                >
                  <IconEdit className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {logData.status === 'submitted' && (
                <div className="space-y-2">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    <IconCircleCheckFilled className="w-4 h-4 mr-2" />
                    Approve Log
                  </Button>
                </div>
              )}

              {logData.status === 'approved' && (
                <div className="text-center py-4">
                  <Badge variant="default" className="text-sm">
                    <IconCircleCheckFilled className="w-4 h-4 mr-2" />
                    Approved
                  </Badge>
                  {logData.approvedAt && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {format(
                        new Date(logData.approvedAt),
                        "MMM dd 'at' h:mm a"
                      )}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
              <CardDescription>
                Add notes or feedback for this log
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="comments">Manager Comments</Label>
                <Textarea
                  id="comments"
                  placeholder="Enter your comments here..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
