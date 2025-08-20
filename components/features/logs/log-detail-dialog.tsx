'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  IconCircleCheckFilled,
  IconUser,
  IconCalendar,
  IconClock,
  IconCurrencyDollar,
  IconBriefcase,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

import { loadLog, approveLog } from '@/lib/actions/logs';

interface LogDetailDialogProps {
  logId: string;
  children: React.ReactNode;
}

export function LogDetailDialog({ logId, children }: LogDetailDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [logData, setLogData] = React.useState<LogDetailData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [comments, setComments] = React.useState('');
  const [actionLoading, setActionLoading] = React.useState(false);

  // Load log data when dialog opens
  React.useEffect(() => {
    if (open && !logData) {
      async function fetchLogData() {
        setLoading(true);
        try {
          const result = await loadLog(logId);
          if (result.success && result.data) {
            setLogData(result.data as LogDetailData);
          } else {
            toast.error(result.error || 'Failed to load log');
          }
        } catch {
          toast.error('Failed to load log');
          // Error loading log
        } finally {
          setLoading(false);
        }
      }
      fetchLogData();
    }
  }, [open, logId, logData]);

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
            toast.success(`${matchCount} commission(s) automatically matched`);
          }

          if (conflictCount > 0) {
            toast.warning(`${conflictCount} commission conflict(s) detected`);
          }
        }

        // Refresh log data
        const refreshResult = await loadLog(logId);
        if (refreshResult.success && refreshResult.data) {
          setLogData(refreshResult.data as LogDetailData);
        }

        setOpen(false);
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

  if (loading || !logData) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Loading Log Details</DialogTitle>
            <DialogDescription>
              Please wait while we load the log information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading log details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Log Details - {logData.captain.fullName}
            <Badge
              variant={
                logData.status === 'approved'
                  ? 'default'
                  : logData.status === 'submitted'
                    ? 'secondary'
                    : 'destructive'
              }
              className="capitalize"
            >
              {logData.status === 'approved' && (
                <IconCircleCheckFilled className="w-3 h-3 mr-1" />
              )}
              {logData.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {format(new Date(logData.logDate), 'EEEE, MMMM dd, yyyy')} •
            {logData.submittedAt &&
              ` Submitted ${format(new Date(logData.submittedAt), "MMM dd 'at' h:mm a")}`}
          </DialogDescription>
        </DialogHeader>

        <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
          {/* Left Panel - Log Details */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full overflow-auto pr-4">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="junk">Junk Jobs</TabsTrigger>
                  <TabsTrigger value="move">Move Jobs</TabsTrigger>
                  <TabsTrigger value="hours">Team Hours</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <IconUser className="w-4 h-4" />
                          Captain
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {logData.captain.fullName}
                        </p>
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
                        <p className="text-2xl font-bold">
                          ${totalRevenue.toFixed(2)}
                        </p>
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

                  <Card>
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
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
                        <span className="font-medium">{junkJobs.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Move Jobs:</span>
                        <span className="font-medium">{moveJobs.length}</span>
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
                </TabsContent>

                <TabsContent value="junk" className="space-y-4">
                  {junkJobs.map((job) => (
                    <Card key={job.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconBriefcase className="w-4 h-4" />
                          {job.jobId}
                        </CardTitle>
                        <CardDescription>{job.clientName}</CardDescription>
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
                  {junkJobs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No junk jobs recorded
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="move" className="space-y-4">
                  {moveJobs.map((job) => (
                    <Card key={job.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconBriefcase className="w-4 h-4" />
                          {job.jobId}
                        </CardTitle>
                        <CardDescription>{job.clientName}</CardDescription>
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
                  {moveJobs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No move jobs recorded
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="hours" className="space-y-4">
                  <div className="space-y-4">
                    {logData.hours.map((hour) => (
                      <Card key={hour.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {hour.employee.fullName}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {hour.department}{' '}
                                {hour.isCoCaptain && '• Co-Captain'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {hour.hours}h
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Actions & Comments */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <div className="h-full overflow-auto pl-4">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
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

                {/* External Comparison Panel */}
                <Card>
                  <CardHeader>
                    <CardTitle>External Comparison</CardTitle>
                    <CardDescription>
                      Compare with external systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium mb-2">HUNKCentral Data</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Total Revenue:</span>
                              <span>${totalRevenue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Hours:</span>
                              <span>{totalHours}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Jobs Count:</span>
                              <span>{logData.jobs.length}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">External System</h4>
                          <div className="space-y-1 text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Total Revenue:</span>
                              <span>-</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Hours:</span>
                              <span>-</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Jobs Count:</span>
                              <span>-</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        External system integration coming soon
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
