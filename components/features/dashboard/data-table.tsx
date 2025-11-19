'use client';

import * as React from 'react';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
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

interface JobHistoryData {
  id: string;
  date: string;
  jobType: 'junk' | 'move';
  clientName: string;
  revenue: number;
  tips: number;
  laborCostPercent: number;
  status: 'completed' | 'approved' | 'pending';
  teamSize: number;
}

interface DataTableProps {
  data: JobHistoryData[];
  title: string;
  description: string;
}

// Sample data for demonstration - TODO: Replace with real data
const sampleData: JobHistoryData[] = [
  {
    id: '1',
    date: '2024-01-15',
    jobType: 'junk',
    clientName: 'Smith Residence',
    revenue: 450,
    tips: 60,
    laborCostPercent: 12.5,
    status: 'approved',
    teamSize: 3,
  },
  {
    id: '2',
    date: '2024-01-14',
    jobType: 'move',
    clientName: 'Johnson Family',
    revenue: 850,
    tips: 120,
    laborCostPercent: 23.2,
    status: 'approved',
    teamSize: 4,
  },
  {
    id: '3',
    date: '2024-01-13',
    jobType: 'junk',
    clientName: 'Office Cleanout',
    revenue: 320,
    tips: 40,
    laborCostPercent: 13.8,
    status: 'completed',
    teamSize: 2,
  },
];

const columns: ColumnDef<JobHistoryData>[] = [
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
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => (
      <div className="font-medium">
        {formatDateDisplay(new Date(row.original.date))}
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
    accessorKey: 'clientName',
    header: 'Client',
    cell: ({ row }) => (
      <div className="max-w-32 truncate">{row.original.clientName}</div>
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
    accessorKey: 'tips',
    header: () => <div className="text-right">Tips</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatCurrency(row.original.tips)}
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

      return (
        <div className="text-right">
          <Badge
            variant="outline"
            className={
              isGood
                ? 'border-green-200 text-green-700 bg-green-50'
                : 'border-red-200 text-red-700 bg-red-50'
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
      return (
        <Badge
          variant="outline"
          className={
            status === 'approved'
              ? 'border-green-200 text-green-700 bg-green-50'
              : status === 'completed'
                ? 'border-blue-200 text-blue-700 bg-blue-50'
                : 'border-yellow-200 text-yellow-700 bg-yellow-50'
          }
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'teamSize',
    header: () => <div className="text-center">Team</div>,
    cell: ({ row }) => (
      <div className="text-center">{row.original.teamSize} HUNKs</div>
    ),
  },
];

export function DataTable({
  data = sampleData,
  title,
  description,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

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

  return (
    <Tabs defaultValue="jobs" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h3 className="text-lg font-semibold text-hunks-green">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="jobs">Recent Jobs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search jobs..."
              value={
                (table.getColumn('clientName')?.getFilterValue() as string) ??
                ''
              }
              onChange={(event) =>
                table
                  .getColumn('clientName')
                  ?.setFilterValue(event.target.value)
              }
              className="w-64"
            />
            <Select
              value={
                (table.getColumn('jobType')?.getFilterValue() as string) ??
                'all'
              }
              onValueChange={(value) =>
                table
                  .getColumn('jobType')
                  ?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="junk">Junk</SelectItem>
                <SelectItem value="move">Move</SelectItem>
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
        </div>
      </div>

      <TabsContent
        value="jobs"
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
                    No jobs found.
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

      <TabsContent value="performance" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-muted-foreground">
            Performance analytics coming soon
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
