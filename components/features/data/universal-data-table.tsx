'use client';

import * as React from 'react';
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
  IconDownload,
  IconFilter,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconX,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';

// Filter configuration types
export interface FilterConfig {
  key: string;
  label: string;
  type:
    | 'select'
    | 'multiSelect'
    | 'dateRange'
    | 'numberRange'
    | 'text'
    | 'boolean';
  options?: { value: string; label: string; color?: string }[];
  placeholder?: string;
}

export interface QuickFilterConfig {
  key: string;
  label: string;
  value: unknown;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

export interface GroupByConfig {
  key: string;
  label: string;
}

export interface AggregationConfig {
  key: string;
  label: string;
  type: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ActionConfig {
  label: string;
  action: (data: unknown[]) => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface BulkActionConfig {
  label: string;
  action: (selectedRows: unknown[]) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
}

export interface RowActionConfig {
  label: string;
  action: (row: unknown) => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
}

// Universal DataTable component props
export interface UniversalDataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];

  // Search functionality
  searchable?: boolean;
  searchPlaceholder?: string;
  globalSearch?: boolean;
  columnSearch?: boolean;

  // Sorting functionality
  sortable?: boolean;
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  multiSort?: boolean;

  // Filtering functionality
  filters?: FilterConfig[];
  quickFilters?: QuickFilterConfig[];
  advancedFilters?: boolean;

  // Grouping and aggregation
  groupBy?: GroupByConfig[];
  aggregations?: AggregationConfig[];

  // Export functionality
  exportOptions?: ('excel' | 'csv' | 'pdf' | 'print')[];

  // Pagination
  pagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];

  // Actions
  actions?: ActionConfig[];
  bulkActions?: BulkActionConfig[];
  rowActions?: RowActionConfig[];

  // Styling
  className?: string;
  branded?: boolean;

  // Loading state
  loading?: boolean;

  // Empty state
  emptyMessage?: string;

  // Selection
  enableSelection?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
}

export function UniversalDataTable<T>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Search...',
  globalSearch = true,
  sortable: _sortable = true,
  defaultSort,
  filters = [],
  quickFilters = [],
  exportOptions = [],
  pagination = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  actions = [],
  bulkActions = [],
  className,
  branded = true,
  loading = false,
  emptyMessage = 'No results found.',
  enableSelection = false,
  onSelectionChange,
}: UniversalDataTableProps<T>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>(
    defaultSort
      ? [{ id: defaultSort.column, desc: defaultSort.direction === 'desc' }]
      : []
  );
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [paginationState, setPaginationState] = React.useState({
    pageIndex: 0,
    pageSize: pageSize,
  });

  // Add selection column if enabled
  const enhancedColumns = React.useMemo(() => {
    if (!enableSelection) return columns;

    const selectionColumn: ColumnDef<T> = {
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
    };

    return [selectionColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination: paginationState,
    },
    enableRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPaginationState,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Handle selection change callback
  React.useEffect(() => {
    if (onSelectionChange && enableSelection) {
      const selectedRows = table
        .getFilteredSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, enableSelection, table]);

  // Quick filter handlers
  const handleQuickFilter = (filter: QuickFilterConfig) => {
    // Implementation depends on the specific filter logic
    // This is a placeholder for the actual filter implementation
    console.warn('Quick filter applied:', filter);
  };

  // Export handlers
  const handleExport = (format: string) => {
    // Implementation for export functionality
    console.warn('Export format:', format);
  };

  return (
    <div className={cn('space-y-4', className)} data-sortable={_sortable}>
      {/* Header with search, filters, and actions */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Global search */}
          {searchable && globalSearch && (
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                  onClick={() => setGlobalFilter('')}
                >
                  <IconX className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Quick filters */}
          {quickFilters.length > 0 && (
            <div className="flex items-center space-x-2">
              {quickFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilter(filter)}
                  className={cn(
                    'h-8',
                    branded && 'border-hunks-green-200 hover:bg-hunks-green-50'
                  )}
                >
                  {filter.icon && <filter.icon className="mr-2 h-4 w-4" />}
                  {filter.label}
                  {filter.count !== undefined && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5 text-xs"
                    >
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Advanced filters */}
          {filters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconFilter className="mr-2 h-4 w-4" />
                  Filters
                  {columnFilters.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 h-5 px-1.5 text-xs"
                    >
                      {columnFilters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {filters.map((filter) => (
                  <div key={filter.key} className="p-2">
                    <Label className="text-xs font-medium">
                      {filter.label}
                    </Label>
                    {/* Filter implementation based on type */}
                    {filter.type === 'select' && filter.options && (
                      <Select>
                        <SelectTrigger className="mt-1 h-8">
                          <SelectValue placeholder={filter.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
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
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export options */}
          {exportOptions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconDownload className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {exportOptions.map((format) => (
                  <DropdownMenuItem
                    key={format}
                    onClick={() => handleExport(format)}
                  >
                    Export as {format.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconPlus className="mr-2 h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.action(data)}
                  >
                    {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {enableSelection &&
        bulkActions.length > 0 &&
        table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center space-x-2 rounded-md border border-hunks-green-200 bg-hunks-green-50 p-2">
            <span className="text-sm font-medium">
              {table.getFilteredSelectedRowModel().rows.length} selected
            </span>
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={
                  action.variant === 'destructive' ? 'destructive' : 'outline'
                }
                size="sm"
                onClick={() =>
                  action.action(
                    table
                      .getFilteredSelectedRowModel()
                      .rows.map((row) => row.original)
                  )
                }
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </Button>
            ))}
          </div>
        )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className={branded ? 'bg-hunks-green-50' : undefined}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      branded && 'text-hunks-green-800 font-semibold',
                      header.column.getCanSort() && 'cursor-pointer select-none'
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center space-x-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <IconChevronDown
                              className={cn(
                                'h-3 w-3 transition-transform',
                                header.column.getIsSorted() === 'asc' &&
                                  'rotate-180',
                                header.column.getIsSorted() === 'desc' &&
                                  'rotate-0',
                                !header.column.getIsSorted() && 'opacity-50'
                              )}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={cn(
                    branded &&
                      'hover:bg-hunks-green-50/50 data-[state=selected]:bg-hunks-green-50'
                  )}
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
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {enableSelection && (
              <>
                {table.getFilteredSelectedRowModel().rows.length} of{' '}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </>
            )}
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
                  {pageSizeOptions.map((pageSize) => (
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
      )}
    </div>
  );
}
