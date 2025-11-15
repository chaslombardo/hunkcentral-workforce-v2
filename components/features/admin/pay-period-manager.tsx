'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Plus,
  MoreHorizontal,
  Lock,
  Unlock,
  Archive,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import {
  createPayPeriod,
  updatePayPeriodStatus,
  getPayPeriods,
  getPayPeriodStatsForTile,
  deletePayPeriod,
  type PayPeriod,
  type CreatePayPeriodInput,
} from '@/lib/actions/pay-periods';

export function PayPeriodManager() {
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [payPeriodStats, setPayPeriodStats] = useState<Record<string, any>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});

  // Load pay periods
  useEffect(() => {
    loadPayPeriods();
  }, []);

  const loadPayPeriods = async () => {
    try {
      const result = await getPayPeriods();
      if (result.success && result.data) {
        // Sort pay periods chronologically by start date (most recent first)
        const sortedPeriods = result.data.sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        setPayPeriods(sortedPeriods);
      } else {
        toast.error(result.error || 'Failed to load pay periods');
      }
    } catch {
      toast.error('Failed to load pay periods');
    } finally {
      setLoading(false);
      // Load stats for all pay periods after loading pay periods
      if (result.success && result.data) {
        loadAllPayPeriodStats(result.data);
      }
    }
  };

  // Load statistics for all pay periods
  const loadAllPayPeriodStats = async (periods: PayPeriod[]) => {
    const stats: Record<string, any> = {};
    const loading: Record<string, boolean> = {};

    // Initialize loading states
    periods.forEach((period) => {
      loading[period.id] = true;
    });
    setLoadingStats({ ...loading });

    // Load stats for each period
    await Promise.all(
      periods.map(async (period) => {
        try {
          const statsResult = await getPayPeriodStatsForTile(period.id);
          if (statsResult.success) {
            stats[period.id] = statsResult.data;
          }
        } catch (error) {
          console.error(`Failed to load stats for period ${period.id}:`, error);
        } finally {
          loading[period.id] = false;
          setLoadingStats({ ...loading });
        }
      })
    );

    setPayPeriodStats(stats);
  };

  const handleCreatePayPeriod = async (data: CreatePayPeriodInput) => {
    try {
      const result = await createPayPeriod(data);
      if (result.success) {
        toast.success('Pay period created successfully');
        setCreateDialogOpen(false);
        loadPayPeriods();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to create pay period');
    }
  };

  const handleStatusChange = async (
    id: string,
    status: 'open' | 'locked' | 'closed'
  ) => {
    try {
      const result = await updatePayPeriodStatus({ id, status });
      if (result.success) {
        toast.success(`Pay period ${status} successfully`);
        loadPayPeriods();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to update pay period status');
    }
  };

  const handleDeletePayPeriod = async (id: string) => {
    try {
      const result = await deletePayPeriod(id);
      if (result.success) {
        toast.success('Pay period deleted successfully');
        loadPayPeriods();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to delete pay period');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'locked':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Unlock className="h-3 w-3" />;
      case 'locked':
        return <Lock className="h-3 w-3" />;
      case 'closed':
        return <Archive className="h-3 w-3" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2" />
          </div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="h-6 w-32 bg-muted rounded" />
                  <div className="h-8 w-8 bg-muted rounded" />
                </div>
                <div className="h-6 w-16 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-4 w-24 bg-muted rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 w-14 bg-muted rounded" />
                    <div className="h-4 w-12 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pay Periods</h2>
          <p className="text-muted-foreground">
            Manage pay periods and control data modification permissions
          </p>
        </div>
        <Dialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          modal={true}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Pay Period
            </Button>
          </DialogTrigger>
          <CreatePayPeriodDialog onSubmit={handleCreatePayPeriod} />
        </Dialog>
      </div>

      {/* Pay Periods Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {payPeriods.map((period) => (
          <Card key={period.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{period.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {period.status === 'open' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => {
                            // TODO: Implement edit pay period functionality
                            toast.info('Edit functionality coming soon');
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Period
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(period.id, 'locked')
                          }
                        >
                          <Lock className="mr-2 h-4 w-4" />
                          Lock Period
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              Delete Period
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Pay Period
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this pay period?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePayPeriod(period.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {period.status === 'locked' && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(period.id, 'open')}
                        >
                          <Unlock className="mr-2 h-4 w-4" />
                          Reopen Period
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(period.id, 'closed')
                          }
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Close Period
                        </DropdownMenuItem>
                      </>
                    )}
                    {period.status === 'closed' && (
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(period.id, 'open')}
                      >
                        <Unlock className="mr-2 h-4 w-4" />
                        Reopen Period
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Badge className={cn('w-fit', getStatusColor(period.status))}>
                {getStatusIcon(period.status)}
                <span className="ml-1 capitalize">{period.status}</span>
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span>
                    {format(new Date(period.startDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date:</span>
                  <span>
                    {format(new Date(period.endDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>
                    {Math.ceil(
                      (new Date(period.endDate).getTime() -
                        new Date(period.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}{' '}
                    days
                  </span>
                </div>
                {period.status !== 'open' && (
                  <>
                    <div className="border-t pt-2 mt-2 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Total Hours:
                        </span>
                        {loadingStats[period.id] ? (
                          <span className="text-muted-foreground">
                            Loading...
                          </span>
                        ) : (
                          <span className="font-medium">
                            {payPeriodStats[period.id]?.totalHours?.toFixed(
                              1
                            ) || '0.0'}
                            h
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Gross Payroll:
                        </span>
                        {loadingStats[period.id] ? (
                          <span className="text-muted-foreground">
                            Loading...
                          </span>
                        ) : (
                          <span className="font-medium">
                            $
                            {payPeriodStats[period.id]?.grossPayroll?.toFixed(
                              2
                            ) || '0.00'}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Approved Logs:
                        </span>
                        {loadingStats[period.id] ? (
                          <span className="text-muted-foreground">
                            Loading...
                          </span>
                        ) : (
                          <span className="font-medium">
                            {payPeriodStats[period.id]?.approvedLogsCount || 0}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {payPeriods.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pay Periods</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first pay period to start managing payroll data
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Pay Period
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CreatePayPeriodDialog({
  onSubmit,
}: {
  onSubmit: (data: CreatePayPeriodInput) => void;
}) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [submitting, setSubmitting] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startDate || !endDate) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name,
        startDate:
          startDate.getFullYear() +
          '-' +
          String(startDate.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(startDate.getDate()).padStart(2, '0'),
        endDate:
          endDate.getFullYear() +
          '-' +
          String(endDate.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(endDate.getDate()).padStart(2, '0'),
      });
      // Reset form
      setName('');
      setStartDate(undefined);
      setEndDate(undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Create Pay Period</DialogTitle>
        <DialogDescription>
          Create a new pay period to manage payroll data and permissions.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., January 2024"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Start Date</Label>
            <Popover
              open={startDateOpen}
              onOpenChange={setStartDateOpen}
              modal={false}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    setStartDate(date);
                    if (date) {
                      setStartDateOpen(false); // Auto-close on selection
                      // If end date is before start date, clear it
                      if (endDate && date >= endDate) {
                        setEndDate(undefined);
                      }
                      // Auto-open end date picker for smooth workflow
                      setTimeout(() => setEndDateOpen(true), 300);
                    }
                  }}
                  initialFocus
                  disabled={(date) =>
                    date < new Date(new Date().getFullYear(), 0, 1)
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid gap-2">
            <Label>End Date</Label>
            <Popover
              open={endDateOpen}
              onOpenChange={setEndDateOpen}
              modal={false}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    setEndDate(date);
                    setEndDateOpen(false); // Auto-close on selection
                  }}
                  initialFocus
                  disabled={(date) => (startDate ? date <= startDate : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Pay Period'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
