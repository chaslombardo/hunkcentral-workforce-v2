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
  IconEye,
  IconEdit,
  IconPlus,
  IconClock,
  IconCheck,
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
import { formatCurrency, formatDateDisplay } from '@/lib/formatters';

interface SalesMetrics {
  pendingCommissions: number;
  matchedCommissions: number;
}

interface CommissionData {
  id: string;
  bookingDate: string;
  clientName: string;
  jobType: 'junk' | 'move';
  estimatedRevenue: number;
  actualRevenue?: number;
  commissionRate: number;
  estimatedCommission: number;
  actualCommission?: number;
  status: 'pending' | 'matched' | 'paid';
  jobId?: string;
  matchedDate?: string;
  notes?: string;
}

interface SalesDataTableProps {
  metrics?: SalesMetrics;
}

// Hook to fetch commission data from API
const useCommissionData = () => {
  const [data, setData] = React.useState<CommissionData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/commission/list');
        if (!response.ok) {
          throw new Error('Failed to fetch commission data');
        }
        
        const result = await response.json();
        
        // Transform API data to match our interface
        const transformedData: CommissionData[] = result.data?.map((entry: any) => ({
          id: entry.id,
          bookingDate: entry.createdAt.split('T')[0],
          clientName: entry.clientName,
          jobType: entry.jobType,
          estimatedRevenue: entry.estimatedRevenue,
          actualRevenue: entry.actualRevenue,
          commissionRate: entry.sales?.commissionRate || 0.05,
          estimatedCommission: entry.estimatedRevenue * (entry.sales?.commissionRate || 0.05),
          actualCommission: entry.commissionAmount,
          status: entry.status,
          jobId: entry.jobId,
          matchedDate: entry.matchedLog?.logDate,
          notes: entry.status === 'pending' ? 'Awaiting job completion' : undefined,
        })) || [];
        
        setData(transformedData);
      } catch (err) {
        console.error('Error fetching commission data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setData([]); // Return empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
};

const columns: ColumnDef<CommissionData>[] = [
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
    header: 'Commission ID',
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.id}</div>
    ),
  },
  {
    accessorKey: 'bookingDate',
    header: 'Booking Date',
    cell: ({ row }) => (
      <div className="font-medium">
        {formatDateDisplay(new Date(row.original.bookingDate))}
      </div>
    ),
  },
  {
    accessorKey: 'clientName',
    header: 'Client',
    cell: ({ row }) => (
      <div className="max-w-32 truncate font-medium">
        {row.original.clientName}
      </div>
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
    accessorKey: 'estimatedRevenue',
    header: () => <div className="text-right">Est. Revenue</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.estimatedRevenue)}
      </div>
    ),
  },
  {
    accessorKey: 'actualRevenue',
    header: () => <div className="text-right">Actual Revenue</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.actualRevenue ? (
          formatCurrency(row.original.actualRevenue)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'estimatedCommission',
    header: () => <div className="text-right">Est. Commission</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.estimatedCommission)}
        <div className="text-xs text-muted-foreground">
          {(row.original.commissionRate * 100).toFixed(1)}%
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'actualCommission',
    header: () => <div className="text-right">Actual Commission</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {row.original.actualCommission ? (
          formatCurrency(row.original.actualCommission)
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;

      return (
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={
              status === 'paid'
                ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950'
                : status === 'matched'
                  ? 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950'
                  : 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:bg-yellow-950'
            }
          >
            {status === 'pending' && <IconClock className="w-3 h-3 mr-1" />}
            {status === 'matched' && <IconCheck className="w-3 h-3 mr-1" />}
            {status === 'paid' && <IconCheck className="w-3 h-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          {row.original.jobId && (
            <Badge variant="secondary" className="text-xs font-mono">
              {row.original.jobId}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm">
          <IconEye className="w-4 h-4" />
          <span className="sr-only">View details</span>
        </Button>
        <Button variant="ghost" size="sm">
          <IconEdit className="w-4 h-4" />
          <span className="sr-only">Edit commission</span>
        </Button>
      </div>
    ),
  },
];

export function SalesDataTable({ metrics }: SalesDataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'bookingDate', desc: true }, // Sort by newest first
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading, error } = useCommissionData();

  const table = useReactTable({
    data: data || [],
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

  // Calculate summary stats
  const pendingCommissions = data.filter((item) => item.status === 'pending');
  const matchedCommissions = data.filter((item) => item.status === 'matched');
  const paidCommissions = data.filter((item) => item.status === 'paid');

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <div className="text-center py-6">
          <h3 className="text-lg font-semibold text-hunks-green mb-2">Commission Tracking</h3>
          <p className="text-muted-foreground mb-2">Unable to load commission data</p>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

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

  // Calculate summary stats
  const pendingCommissions = data.filter((item) => item.status === 'pending');
  const matchedCommissions = data.filter((item) => item.status === 'matched');
  const paidCommissions = data.filter((item) => item.status === 'paid');

  return (
    <Tabs defaultValue="all" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h3 className="text-lg font-semibold text-hunks-green">
            Commission Tracking
          </h3>
          <p className="text-sm text-muted-foreground">
            Your bookings and commission status
          </p>
        </div>

        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all">
            All Commissions
            <Badge variant="secondary" className="ml-2">
              {data.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge
              variant="outline"
              className="ml-2 border-yellow-200 text-yellow-700 bg-yellow-50"
            >
              {pendingCommissions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="matched">
            Matched
            <Badge
              variant="outline"
              className="ml-2 border-blue-200 text-blue-700 bg-blue-50"
            >
              {matchedCommissions.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid
            <Badge
              variant="outline"
              className="ml-2 border-green-200 text-green-700 bg-green-50"
            >
              {paidCommissions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by client..."
              value={
                (table.getColumn('clientName')?.getFilterValue() as string) ??
                ''
              }
              onChange={(event) =>
                table
                  .getColumn('clientName')
                  ?.setFilterValue(event.target.value)
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
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
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

          <Button variant="default" size="sm">
            <IconPlus className="w-4 h-4 mr-2" />
            Add Booking
          </Button>

          <Button variant="outline" size="sm">
            <IconDownload className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <TabsContent
        value="all"
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
                      row.original.status === 'paid'
                        ? 'bg-green-50 dark:bg-green-950/20'
                        : row.original.status === 'matched'
                          ? 'bg-blue-50 dark:bg-blue-950/20'
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
                    No commissions found.
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

      <TabsContent value="pending" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-muted-foreground">
            Pending commissions view - filtered table coming soon
          </p>
        </div>
      </TabsContent>

      <TabsContent value="matched" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-muted-foreground">
            Matched commissions view - filtered table coming soon
          </p>
        </div>
      </TabsContent>

      <TabsContent value="paid" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-muted-foreground">
            Paid commissions view - filtered table coming soon
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
