'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconExternalLink,
  IconLayoutColumns,
  IconLoader,
  IconSearch,
  IconX,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  NoLogsEmptyState,
  NoLogResultsEmptyState,
} from '@/components/features/empty-states';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveTable,
  MobileTableCard,
  MobileTableItem,
  MobileTableField,
} from '@/components/ui/responsive-table';
import {
  SortableHeader,
  getSortDirection,
} from '@/components/ui/sortable-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LogDetailDialog } from './log-detail-dialog';
import {
  getLogsForReview,
  bulkApproveLogs,
  bulkDeleteLogs,
  approveLog,
  deleteLog,
  unapproveLog,
} from '@/lib/actions/logs';
import { getUsers } from '@/lib/actions/users';
import { getPayPeriods } from '@/lib/actions/pay-periods';
import { LogReviewTableSkeleton } from '@/components/ui/skeleton-components';
import { useSession } from '@/hooks/useSession';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LogReviewData = {
  id: string;
  captainName: string;
  logDate: Date;
  status: 'submitted' | 'approved';
  totalRevenue: number;
  totalHours: number;
  jobCount: number;
  submittedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
};

function createColumns(
  onApprove: (logId: string) => Promise<void>,
  onUnapprove: (logId: string) => Promise<void>,
  onDelete: (logId: string) => Promise<void>,
  userRoles: string[] = []
): ColumnDef<LogReviewData>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'captainName',
      header: ({ column }) => (
        <SortableHeader
          sortDirection={getSortDirection(column.getIsSorted())}
          onSort={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          branded
        >
          Captain
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <Link
          href={`/logs/${row.original.id}`}
          className="font-medium text-hunks-green-600 hover:text-hunks-green-800 hover:underline"
        >
          {row.original.captainName}
        </Link>
      ),
    },
    {
      accessorKey: 'logDate',
      header: ({ column }) => (
        <SortableHeader
          sortDirection={getSortDirection(column.getIsSorted())}
          onSort={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          branded
        >
          Log Date
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <div>{format(row.original.logDate, 'MMM dd, yyyy')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <SortableHeader
          sortDirection={getSortDirection(column.getIsSorted())}
          onSort={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          branded
        >
          Status
        </SortableHeader>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === 'approved' ? 'default' : 'secondary'}
            className={`capitalize ${
              status === 'approved'
                ? 'bg-hunks-green hover:bg-hunks-green/90'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            {status === 'approved' && (
              <IconCircleCheckFilled className="w-3 h-3 mr-1" />
            )}
            {status === 'submitted' && <IconLoader className="w-3 h-3 mr-1" />}
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'totalRevenue',
      header: ({ column }) => (
        <div className="text-right">
          <SortableHeader
            sortDirection={getSortDirection(column.getIsSorted())}
            onSort={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            branded
          >
            Revenue
          </SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right font-medium text-hunks-green-700">
          ${row.original.totalRevenue.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: 'totalHours',
      header: () => <div className="text-right">Hours</div>,
      cell: ({ row }) => (
        <div className="text-right">{row.original.totalHours}</div>
      ),
    },
    {
      accessorKey: 'jobCount',
      header: () => <div className="text-right">Jobs</div>,
      cell: ({ row }) => (
        <div className="text-right">{row.original.jobCount}</div>
      ),
    },
    {
      accessorKey: 'submittedAt',
      header: 'Submitted',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(row.original.submittedAt, 'MMM dd, h:mm a')}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link href={`/logs/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              <IconExternalLink className="w-4 h-4" />
              <span className="sr-only">View details</span>
            </Button>
          </Link>
          <LogDetailDialog logId={row.original.id}>
            <Button variant="ghost" size="sm">
              <IconEye className="w-4 h-4" />
              <span className="sr-only">Quick view</span>
            </Button>
          </LogDetailDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/logs/${row.original.id}`}>
                  <IconExternalLink className="mr-2 h-4 w-4" />
                  View Full Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconEye className="mr-2 h-4 w-4" />
                Quick View
              </DropdownMenuItem>
              {row.original.status === 'submitted' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/logs/${row.original.id}/edit`}>
                      <IconEdit className="mr-2 h-4 w-4" />
                      Edit Log
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-green-600"
                    onClick={() => onApprove(row.original.id)}
                  >
                    <IconCircleCheckFilled className="mr-2 h-4 w-4" />
                    Approve
                  </DropdownMenuItem>
                  {userRoles.includes('admin') && (
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete(row.original.id)}
                    >
                      <IconX className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </>
              )}
              {row.original.status === 'approved' &&
                (userRoles.includes('manager') ||
                  userRoles.includes('admin')) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-orange-600"
                      onClick={() => onUnapprove(row.original.id)}
                    >
                      <IconLoader className="mr-2 h-4 w-4" />
                      Unapprove
                    </DropdownMenuItem>
                    {userRoles.includes('admin') && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(row.original.id)}
                      >
                        <IconX className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];
}

export function LogReviewQueue() {
  const { session } = useSession();
  const [data, setData] = React.useState<LogReviewData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'submittedAt', desc: true },
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  // Mobile responsiveness will be implemented in future iteration
  // const { isMobile } = useResponsiveTable()

  // New state for filters
  const [captains, setCaptains] = React.useState<
    Array<{ id: string; fullName: string }>
  >([]);
  const [payPeriods, setPayPeriods] = React.useState<
    Array<{ id: string; name: string; startDate: Date; endDate: Date }>
  >([]);
  const [selectedCaptain, setSelectedCaptain] = React.useState<string>('all');
  const [selectedPayPeriod, setSelectedPayPeriod] =
    React.useState<string>('all');
  const [customDateRange, setCustomDateRange] = React.useState<{
    from?: Date;
    to?: Date;
  }>({});
  const [dateFilterType, setDateFilterType] = React.useState<
    'all' | 'pay-period' | 'custom'
  >('all');

  const userRoles = React.useMemo(
    () => session?.user?.roles || [],
    [session?.user?.roles]
  );

  // Load initial data
  React.useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        // Load logs
        const logsResult = await getLogsForReview();
        if (
          logsResult.success &&
          logsResult.data &&
          Array.isArray(logsResult.data)
        ) {
          setData(logsResult.data as LogReviewData[]);
        } else {
          if (logsResult.error?.includes('Database connection')) {
            toast.error(
              'Database connection issue. Please try again in a moment.'
            );
          } else if (logsResult.error?.includes('Authentication')) {
            toast.error('Please log in again to continue.');
          } else if (logsResult.error?.includes('Manager access')) {
            toast.error('Manager access is required to view logs for review.');
          } else {
            toast.error(logsResult.error || 'Failed to load logs');
          }
        }

        // Load captains (users with captain role)
        const usersResult = await getUsers({ roles: ['captain'] });
        if (usersResult.success && usersResult.data?.users) {
          setCaptains(
            usersResult.data.users.map((user) => ({
              id: user.id,
              fullName: user.fullName,
            }))
          );
        }

        // Load pay periods
        const payPeriodsResult = await getPayPeriods();
        if (payPeriodsResult.success && payPeriodsResult.data) {
          setPayPeriods(
            payPeriodsResult.data.map((period) => ({
              id: period.id,
              name: period.name,
              startDate: period.startDate,
              endDate: period.endDate,
            }))
          );
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('An unexpected error occurred while loading data');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleApprove = async (logId: string) => {
    try {
      const result = await approveLog(logId);
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

        // Refresh data
        const refreshResult = await getLogsForReview();
        if (refreshResult.success && refreshResult.data) {
          setData(refreshResult.data as LogReviewData[]);
        }
      } else {
        if (result.error?.includes('Database connection')) {
          toast.error('Database connection issue. Please try again.');
        } else if (result.error?.includes('Authentication')) {
          toast.error('Please log in again to continue.');
        } else if (result.error?.includes('Manager access')) {
          toast.error('Manager access is required to approve logs.');
        } else if (result.error?.includes('Only submitted logs')) {
          toast.error('This log has already been processed.');
        } else {
          toast.error(result.error || 'Failed to approve log');
        }
      }
    } catch (error) {
      console.error('Error approving log:', error);
      toast.error('An unexpected error occurred while approving the log');
    }
  };

  const handleUnapprove = async (logId: string) => {
    // Show confirmation dialog before unapproving
    if (
      !confirm(
        'Are you sure you want to unapprove this log? It will be returned to submitted status for editing.'
      )
    ) {
      return;
    }

    try {
      const result = await unapproveLog(logId);
      if (result.success) {
        toast.success(
          'Log unapproved successfully and returned to submitted status'
        );
        // Refresh data
        const refreshResult = await getLogsForReview();
        if (refreshResult.success && refreshResult.data) {
          setData(refreshResult.data as LogReviewData[]);
        }
      } else {
        if (result.error?.includes('Database connection')) {
          toast.error('Database connection issue. Please try again.');
        } else if (result.error?.includes('Authentication')) {
          toast.error('Please log in again to continue.');
        } else if (result.error?.includes('Manager access')) {
          toast.error('Manager access is required to unapprove logs.');
        } else if (result.error?.includes('pay period is locked')) {
          toast.error(
            'Cannot unapprove log - the pay period is locked or closed.'
          );
        } else if (result.error?.includes('Only approved logs')) {
          toast.error('This log is not in approved status.');
        } else {
          toast.error(result.error || 'Failed to unapprove log');
        }
      }
    } catch (error) {
      console.error('Error unapproving log:', error);
      toast.error('An unexpected error occurred while unapproving the log');
    }
  };

  const handleDelete = async (logId: string) => {
    // Show confirmation dialog before deleting
    if (
      !confirm(
        'Are you sure you want to delete this log? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const result = await deleteLog(logId);
      if (result.success) {
        toast.success('Log deleted successfully');
        // Refresh data
        const refreshResult = await getLogsForReview();
        if (refreshResult.success && refreshResult.data) {
          setData(refreshResult.data as LogReviewData[]);
        }
      } else {
        if (result.error?.includes('Database connection')) {
          toast.error('Database connection issue. Please try again.');
        } else if (result.error?.includes('Authentication')) {
          toast.error('Please log in again to continue.');
        } else if (result.error?.includes('System administrator access')) {
          toast.error('Only system administrators can delete logs.');
        } else if (result.error?.includes('Cannot delete approved')) {
          toast.error('Cannot delete approved logs.');
        } else {
          toast.error(result.error || 'Failed to delete log');
        }
      }
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('An unexpected error occurred while deleting the log');
    }
  };

  const handleBulkApprove = async () => {
    const selectedLogIds = selectedRows
      .filter((row) => row.original.status === 'submitted')
      .map((row) => row.original.id);

    if (selectedLogIds.length === 0) {
      toast.error('No submitted logs selected');
      return;
    }

    try {
      const result = await bulkApproveLogs(selectedLogIds);
      if (result.success) {
        toast.success(`${selectedLogIds.length} logs approved successfully`);

        // Show commission matching summary for bulk operations
        if (result.data?.results) {
          let totalMatches = 0;
          let totalConflicts = 0;

          result.data.results.forEach(
            (logResult: {
              success: boolean;
              data?: {
                commissionMatching?: {
                  matchCount?: number;
                  conflictCount?: number;
                };
              };
            }) => {
              if (logResult.success && logResult.data?.commissionMatching) {
                totalMatches +=
                  logResult.data.commissionMatching.matchCount || 0;
                totalConflicts +=
                  logResult.data.commissionMatching.conflictCount || 0;
              }
            }
          );

          if (totalMatches > 0) {
            toast.success(
              `${totalMatches} commission(s) automatically matched`,
              {
                description:
                  totalConflicts > 0
                    ? `${totalConflicts} conflict(s) need manual resolution`
                    : undefined,
              }
            );
          }

          if (totalConflicts > 0) {
            toast.warning(`${totalConflicts} commission conflict(s) detected`, {
              description:
                'Check the Commission Conflicts tab for manual resolution',
            });
          }
        }

        setRowSelection({});
        // Refresh data
        const refreshResult = await getLogsForReview();
        if (refreshResult.success && refreshResult.data) {
          setData(refreshResult.data as LogReviewData[]);
        }
      } else {
        toast.error(result.error || 'Failed to approve logs');
      }
    } catch {
      toast.error('Failed to approve logs');
      // Error bulk approving logs
    }
  };

  const handleBulkDelete = async () => {
    const selectedLogIds = selectedRows
      .filter((row) => row.original.status !== 'approved') // Don't allow deleting approved logs
      .map((row) => row.original.id);

    if (selectedLogIds.length === 0) {
      toast.error('No deletable logs selected');
      return;
    }

    // Show confirmation dialog before bulk deleting
    if (
      !confirm(
        `Are you sure you want to delete ${selectedLogIds.length} logs? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const result = await bulkDeleteLogs(selectedLogIds);
      if (result.success) {
        toast.success(`${selectedLogIds.length} logs deleted successfully`);
        setRowSelection({});
        // Refresh data
        const refreshResult = await getLogsForReview();
        if (refreshResult.success && refreshResult.data) {
          setData(refreshResult.data as LogReviewData[]);
        }
      } else {
        toast.error(result.error || 'Failed to delete logs');
      }
    } catch (error) {
      console.error('Error bulk deleting logs:', error);
      toast.error('Failed to delete logs');
    }
  };

  // Filter data based on selected filters
  const filteredData = React.useMemo(() => {
    let filtered = [...data];

    // Filter by captain
    if (selectedCaptain !== 'all') {
      const selectedCaptainName = captains.find(
        (c) => c.id === selectedCaptain
      )?.fullName;
      if (selectedCaptainName) {
        filtered = filtered.filter(
          (log) => log.captainName === selectedCaptainName
        );
      }
    }

    // Filter by date
    if (dateFilterType === 'pay-period' && selectedPayPeriod !== 'all') {
      const selectedPeriod = payPeriods.find((p) => p.id === selectedPayPeriod);
      if (selectedPeriod) {
        filtered = filtered.filter((log) => {
          const logDate = new Date(log.logDate);
          return (
            logDate >= selectedPeriod.startDate &&
            logDate <= selectedPeriod.endDate
          );
        });
      }
    } else if (
      dateFilterType === 'custom' &&
      (customDateRange.from || customDateRange.to)
    ) {
      filtered = filtered.filter((log) => {
        const logDate = new Date(log.logDate);
        if (customDateRange.from && logDate < customDateRange.from)
          return false;
        if (customDateRange.to && logDate > customDateRange.to) return false;
        return true;
      });
    }

    return filtered;
  }, [
    data,
    selectedCaptain,
    captains,
    dateFilterType,
    selectedPayPeriod,
    payPeriods,
    customDateRange,
  ]);

  const columns = React.useMemo(
    () =>
      createColumns(handleApprove, handleUnapprove, handleDelete, userRoles),
    [userRoles]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSubmittedLogs = selectedRows.some(
    (row) => row.original.status === 'submitted'
  );

  if (loading) {
    return <LogReviewTableSkeleton />;
  }

  return (
    <Card className="border-hunks-green-200">
      <CardHeader>
        <CardTitle className="text-hunks-green-800">
          Daily Log Review Queue
        </CardTitle>
        <CardDescription>
          Review and approve submitted daily logs from captains
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by captain name..."
                  value={
                    (table
                      .getColumn('captainName')
                      ?.getFilterValue() as string) ?? ''
                  }
                  onChange={(event) =>
                    table
                      .getColumn('captainName')
                      ?.setFilterValue(event.target.value)
                  }
                  className="pl-8 w-full sm:w-[250px]"
                />
              </div>

              {/* Captain Filter */}
              <Select
                value={selectedCaptain}
                onValueChange={setSelectedCaptain}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by captain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Captains</SelectItem>
                  {captains.map((captain) => (
                    <SelectItem key={captain.id} value={captain.id}>
                      {captain.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={
                  (table.getColumn('status')?.getFilterValue() as string) ??
                  'all'
                }
                onValueChange={(value) =>
                  table
                    .getColumn('status')
                    ?.setFilterValue(value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Filter Type */}
              <Select
                value={dateFilterType}
                onValueChange={(value: 'all' | 'pay-period' | 'custom') => {
                  setDateFilterType(value);
                  if (value === 'all') {
                    setSelectedPayPeriod('all');
                    setCustomDateRange({});
                  }
                }}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Date filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="pay-period">Pay Period</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              {/* Pay Period Filter */}
              {dateFilterType === 'pay-period' && (
                <Select
                  value={selectedPayPeriod}
                  onValueChange={setSelectedPayPeriod}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select pay period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Pay Periods</SelectItem>
                    {payPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Custom Date Range Filter */}
              {dateFilterType === 'custom' && (
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[140px] justify-start text-left font-normal',
                          !customDateRange.from && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.from
                          ? format(customDateRange.from, 'MMM dd, yyyy')
                          : 'From date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateRange.from}
                        onSelect={(date) =>
                          setCustomDateRange((prev) => ({
                            ...prev,
                            from: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[140px] justify-start text-left font-normal',
                          !customDateRange.to && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customDateRange.to
                          ? format(customDateRange.to, 'MMM dd, yyyy')
                          : 'To date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customDateRange.to}
                        onSelect={(date) =>
                          setCustomDateRange((prev) => ({ ...prev, to: date }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
              {selectedRows.length > 0 && hasSubmittedLogs && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                  <Button
                    size="sm"
                    className="bg-hunks-green hover:bg-hunks-green/90"
                    onClick={handleBulkApprove}
                  >
                    <IconCircleCheckFilled className="w-4 h-4 mr-2" />
                    Approve Selected (
                    {
                      selectedRows.filter(
                        (row) => row.original.status === 'submitted'
                      ).length
                    }
                    )
                  </Button>
                  {userRoles.includes('admin') && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                    >
                      <IconX className="w-4 h-4 mr-2" />
                      Delete Selected
                    </Button>
                  )}
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-hunks-green-200 hover:bg-hunks-green-50"
                  >
                    <IconLayoutColumns className="w-4 h-4 mr-2" />
                    Columns
                    <IconChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {table
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== 'undefined' &&
                        column.getCanHide()
                    )
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <ResponsiveTable branded minWidth="1000px">
              <Table variant="branded">
                <TableHeader variant="branded">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} variant="branded">
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            colSpan={header.colSpan}
                            variant="branded"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        variant="branded"
                        data-state={row.getIsSelected() && 'selected'}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow variant="branded">
                      <TableCell colSpan={columns.length} className="p-0">
                        <div className="py-8">
                          {data.length === 0 ? (
                            <NoLogsEmptyState />
                          ) : (
                            <NoLogResultsEmptyState
                              onClearFilters={() => {
                                table.resetColumnFilters();
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ResponsiveTable>
          </div>

          {/* Mobile Cards */}
          <MobileTableCard>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <MobileTableItem key={row.id} branded>
                  <MobileTableField
                    label="Captain"
                    value={
                      <Link
                        href={`/logs/${row.original.id}`}
                        className="font-medium text-hunks-green-600 hover:text-hunks-green-800 hover:underline"
                      >
                        {row.original.captainName}
                      </Link>
                    }
                  />
                  <MobileTableField
                    label="Log Date"
                    value={format(row.original.logDate, 'MMM dd, yyyy')}
                  />
                  <MobileTableField
                    label="Status"
                    value={
                      <Badge
                        variant={
                          row.original.status === 'approved'
                            ? 'default'
                            : 'secondary'
                        }
                        className={`capitalize ${
                          row.original.status === 'approved'
                            ? 'bg-hunks-green hover:bg-hunks-green/90'
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                        }`}
                      >
                        {row.original.status === 'approved' && (
                          <IconCircleCheckFilled className="w-3 h-3 mr-1" />
                        )}
                        {row.original.status === 'submitted' && (
                          <IconLoader className="w-3 h-3 mr-1" />
                        )}
                        {row.original.status}
                      </Badge>
                    }
                  />
                  <MobileTableField
                    label="Revenue"
                    value={
                      <span className="font-medium text-hunks-green-700">
                        ${row.original.totalRevenue.toFixed(2)}
                      </span>
                    }
                  />
                  <MobileTableField
                    label="Hours"
                    value={row.original.totalHours}
                  />
                  <MobileTableField
                    label="Jobs"
                    value={row.original.jobCount}
                  />
                  <MobileTableField
                    label="Submitted"
                    value={format(row.original.submittedAt, 'MMM dd, h:mm a')}
                  />
                  <div className="flex justify-between items-center pt-2 border-t border-hunks-green-200">
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                      aria-label="Select row"
                    />
                    <div className="flex items-center gap-2">
                      <Link href={`/logs/${row.original.id}`}>
                        <Button variant="ghost" size="sm">
                          <IconExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <LogDetailDialog logId={row.original.id}>
                        <Button variant="ghost" size="sm">
                          <IconEye className="w-4 h-4" />
                        </Button>
                      </LogDetailDialog>
                      {row.original.status === 'submitted' && (
                        <>
                          <Link href={`/logs/${row.original.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <IconEdit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="bg-hunks-green hover:bg-hunks-green/90"
                            onClick={() => handleApprove(row.original.id)}
                          >
                            <IconCircleCheckFilled className="w-4 h-4" />
                          </Button>
                          {userRoles.includes('admin') && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(row.original.id)}
                            >
                              <IconX className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </MobileTableItem>
              ))
            ) : (
              <div className="py-8">
                {data.length === 0 ? (
                  <NoLogsEmptyState />
                ) : (
                  <NoLogResultsEmptyState
                    onClearFilters={() => {
                      table.resetColumnFilters();
                    }}
                  />
                )}
              </div>
            )}
          </MobileTableCard>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
