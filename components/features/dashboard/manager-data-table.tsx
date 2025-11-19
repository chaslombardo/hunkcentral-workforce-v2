'use client';

import * as React from 'react';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconDownload,
  IconCheck,
  IconX,
  IconEye,
  IconAlertTriangle,
} from '@tabler/icons-react';
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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';

interface ManagerMetrics {
  logsAwaitingReview: number;
  recentApprovals: number;
}

interface PendingLogData {
  id: string;
  date: string;
  captain: string;
  jobType: 'junk' | 'move';
  revenue: number;
  laborCostPercent: number;
  status: 'pending' | 'flagged' | 'priority';
  teamSize: number;
  submittedAt: string;
  exceptions: string[];
}

interface ManagerDataTableProps {
  metrics?: ManagerMetrics;
}

// Generate sample pending log data - TODO: Replace with real data
const generateSamplePendingLogs = (
  metrics?: ManagerMetrics
): PendingLogData[] => {
  const captains = [
    'John Smith',
    'Sarah Johnson',
    'Mike Wilson',
    'Lisa Chen',
    'David Brown',
  ];
  const jobTypes: ('junk' | 'move')[] = ['junk', 'move'];
  const statuses: ('pending' | 'flagged' | 'priority')[] = [
    'pending',
    'flagged',
    'priority',
  ];
  const possibleExceptions = [
    'High labor cost',
    'Missing job details',
    'Unusual tip amount',
    'Late submission',
    'Team size mismatch',
  ];

  const backlogLevel = metrics?.logsAwaitingReview ?? 12;
  const recentApprovals = metrics?.recentApprovals ?? 20;

  return Array.from({ length: 12 }, () => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 3));
    const submittedAt = new Date(date);
    submittedAt.setHours(
      submittedAt.getHours() - Math.floor(Math.random() * 8)
    );

    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const goalPercent = jobType === 'junk' ? 14 : 24;
    const approvalsBias = recentApprovals > 25 ? -2 : 0;
    const laborPercent =
      goalPercent + (Math.random() - 0.3) * 8 + approvalsBias;

    const flaggedBias = backlogLevel > 15 ? 0.5 : 0.25;
    const status =
      Math.random() < flaggedBias
        ? 'flagged'
        : Math.random() < 0.2
          ? 'priority'
          : statuses[0];
    const exceptions =
      status === 'flagged' || status === 'priority'
        ? [
            possibleExceptions[
              Math.floor(Math.random() * possibleExceptions.length)
            ],
          ]
        : [];

    return {
      id: `LOG-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
      date: date.toISOString().split('T')[0],
      captain: captains[Math.floor(Math.random() * captains.length)],
      jobType,
      revenue: Math.floor(Math.random() * 1500) + 300,
      laborCostPercent: Math.max(8, laborPercent),
      status,
      teamSize: Math.floor(Math.random() * 4) + 2,
      jobCount: Math.floor(Math.random() * 3) + 1,
      exceptions,
      submittedAt: submittedAt.toISOString(),
    };
  });
};

const columns: ColumnDef<PendingLogData>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
    accessorKey: 'id',
    header: 'Log ID',
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.id}</div>
    ),
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted',
    cell: ({ row }) => {
      const submittedAt = new Date(row.original.submittedAt);
      const now = new Date();
      const hoursAgo = Math.floor(
        (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60)
      );

      return (
        <div className="text-sm">
          <div className="font-medium">
            {hoursAgo < 1 ? 'Just now' : `${hoursAgo}h ago`}
          </div>
          <div className="text-muted-foreground text-xs">
            {submittedAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'captain',
    header: 'Captain',
    cell: ({ row }) => (
      <div className="font-medium">{row.original.captain}</div>
    ),
  },
  {
    accessorKey: 'jobType',
    header: 'Type',
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.original.jobType === 'junk'
            ? 'border-hunks-green text-hunks-green bg-hunks-green/10'
            : 'border-hunks-orange text-hunks-orange bg-hunks-orange/10'
        }
      >
        {row.original.jobType.toUpperCase()}
      </Badge>
    ),
  },
  {
    accessorKey: 'revenue',
    header: () => <div className="text-right">Revenue</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.revenue)}
      </div>
    ),
  },
  {
    accessorKey: 'laborCostPercent',
    header: () => <div className="text-right">Labor %</div>,
    cell: ({ row }) => {
      const percent = row.original.laborCostPercent;
      const goal = row.original.jobType === 'junk' ? 14 : 24;
      const isGood = percent < goal;
      const isVeryHigh = percent > goal * 1.3;

      return (
        <div className="text-right">
          <Badge
            variant="outline"
            className={
              isVeryHigh
                ? 'border-red-500 text-red-700 bg-red-100 dark:border-red-800 dark:text-red-300 dark:bg-red-950'
                : isGood
                  ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950'
                  : 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:bg-yellow-950'
            }
          >
            {percent.toFixed(1)}%
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      const hasExceptions = row.original.exceptions.length > 0;

      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              status === 'priority'
                ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950'
                : status === 'flagged'
                  ? 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:bg-yellow-950'
                  : 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950'
            }
          >
            {status === 'priority' && (
              <IconAlertTriangle className="w-3 h-3 mr-1" />
            )}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {hasExceptions && (
            <Badge variant="destructive" className="text-xs">
              {row.original.exceptions.length} issue
              {row.original.exceptions.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm">
          <IconEye className="w-4 h-4" />
          <span className="sr-only">View details</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-green-600 hover:text-green-700"
        >
          <IconCheck className="w-4 h-4" />
          <span className="sr-only">Approve</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <IconX className="w-4 h-4" />
          <span className="sr-only">Reject</span>
        </Button>
      </div>
    ),
  },
];

export function ManagerDataTable({ metrics }: ManagerDataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'submittedAt', desc: true }, // Sort by newest first
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const data = React.useMemo(
    () => generateSamplePendingLogs(metrics),
    [metrics]
  );

  const table = useReactTable({
    data,
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

  const selectedRowsCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <Tabs
      defaultValue="pending"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h3 className="text-lg font-semibold text-hunks-green">
            Pending Approvals
          </h3>
          <p className="text-sm text-muted-foreground">
            Logs requiring your review and approval
          </p>
        </div>

        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="pending">
            Pending Logs
            <Badge variant="secondary" className="ml-2">
              {data.filter((log) => log.status === 'pending').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged
            <Badge variant="destructive" className="ml-2">
              {
                data.filter(
                  (log) => log.status === 'flagged' || log.status === 'priority'
                ).length
              }
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          {selectedRowsCount > 0 && (
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-muted-foreground">
                {selectedRowsCount} selected
              </span>
              <Button size="sm" variant="default">
                <IconCheck className="w-4 h-4 mr-2" />
                Bulk Approve
              </Button>
              <Button size="sm" variant="outline">
                <IconX className="w-4 h-4 mr-2" />
                Bulk Reject
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by captain..."
              value={
                (table.getColumn('captain')?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table.getColumn('captain')?.setFilterValue(event.target.value)
              }
              className="w-48"
            />
            <Select
              value={
                (table.getColumn('status')?.getFilterValue() as string) ?? 'all'
              }
              onValueChange={(value) =>
                table
                  .getColumn('status')
                  ?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="w-4 h-4" />
                <span className="hidden lg:inline">Columns</span>
                <IconChevronDown className="w-4 h-4" />
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

          <Button variant="outline" size="sm">
            <IconDownload className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <TabsContent
        value="pending"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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
                    data-state={row.getIsSelected() && 'selected'}
                    className={
                      row.original.status === 'priority'
                        ? 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500'
                        : row.original.status === 'flagged'
                          ? 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500'
                          : ''
                    }
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
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No pending logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="w-20 h-8" id="rows-per-page">
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
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="flagged" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-muted-foreground">
            Flagged logs view - filtered table coming soon
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
