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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  MoreHorizontal,
  User as UserIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { PayPeriod, User } from '@/types';
import type { PayrollCalculation } from '@/lib/payCalculator';

interface PayrollDataTableProps {
  payrollData: PayrollCalculation[];
  selectedPeriod: PayPeriod | null;
}

// Mock data for development - replace with actual payroll data
const mockPayrollData: PayrollCalculation[] = [
  {
    employeeId: '1',
    employee: {
      id: '1',
      fullName: 'John Smith',
      email: 'john@example.com',
      roles: ['captain'],
    } as User,
    totalHours: 40,
    hoursByDepartment: { junk: 40, move: 0, zigma: 0, training: 0, estimating: 0, warehouse: 0, admin: 0 },
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
  },
  {
    employeeId: '2',
    employee: {
      id: '2',
      fullName: 'Sarah Johnson',
      email: 'sarah@example.com',
      roles: ['wingman'],
    } as User,
    totalHours: 38,
    hoursByDepartment: { junk: 0, move: 38, zigma: 0, training: 0, estimating: 0, warehouse: 0, admin: 0 },
    grossWages: 760,
    tips: 200,
    bonuses: 120,
    commission: 0,
    totalPay: 1080,
    breakdown: {
      hourlyWages: 760,
      salaryAmount: 0,
      salaryType: null,
      salaryFrequency: null,
      tips: 200,
      commission: 0,
      laborBonuses: 120,
      totalBeforeSalaryAdjustment: 1080,
      finalPay: 1080,
    },
  },
  {
    employeeId: '3',
    employee: {
      id: '3',
      fullName: 'Mike Davis',
      email: 'mike@example.com',
      roles: ['sales'],
    } as User,
    totalHours: 40,
    hoursByDepartment: { junk: 0, move: 0, zigma: 0, training: 0, estimating: 0, warehouse: 0, admin: 40 },
    grossWages: 640,
    tips: 0,
    bonuses: 0,
    commission: 450,
    totalPay: 1090,
    breakdown: {
      hourlyWages: 640,
      salaryAmount: 0,
      salaryType: null,
      salaryFrequency: null,
      tips: 0,
      commission: 450,
      laborBonuses: 0,
      totalBeforeSalaryAdjustment: 1090,
      finalPay: 1090,
    },
  },
];

const columns: ColumnDef<PayrollCalculation>[] = [
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
    accessorKey: 'employee.fullName',
    header: 'Employee',
    cell: ({ row }) => {
      const primaryDept = Object.entries(row.original.hoursByDepartment)
        .find(([, hours]) => hours > 0)?.[0] || 'admin';
      
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{row.original.employee.fullName}</div>
            <div className="text-sm text-muted-foreground capitalize">
              {primaryDept}
            </div>
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: 'totalHours',
    header: () => <div className="text-right">Hours</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {row.original.totalHours.toFixed(1)}h
      </div>
    ),
  },
  {
    accessorKey: 'grossWages',
    header: () => <div className="text-right">Gross Wages</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(row.original.grossWages)}
      </div>
    ),
  },
  {
    accessorKey: 'tips',
    header: () => <div className="text-right">Tips</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(row.original.tips)}
      </div>
    ),
  },
  {
    accessorKey: 'bonuses',
    header: () => <div className="text-right">Bonuses</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(row.original.bonuses)}
      </div>
    ),
  },
  {
    accessorKey: 'commission',
    header: () => <div className="text-right">Commission</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(row.original.commission)}
      </div>
    ),
  },
  {
    accessorKey: 'totalPay',
    header: () => <div className="text-right">Total Pay</div>,
    cell: ({ row }) => (
      <div className="text-right font-mono font-semibold">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(row.original.totalPay)}
      </div>
    ),
  },
  {
    id: 'laborPercentage',
    header: 'Labor %',
    cell: ({ row }) => {
      // Calculate approximate labor percentage based on primary department
      const primaryDept = Object.entries(row.original.hoursByDepartment)
        .find(([, hours]) => hours > 0)?.[0] || 'admin';
      
      // Mock calculation - in real app this would come from log data
      const mockPercentage = primaryDept === 'junk' ? 0.16 : primaryDept === 'move' ? 0.22 : 0;
      const isGood = mockPercentage <= 0.18;
      
      return (
        <Badge variant={isGood ? 'default' : 'destructive'}>
          {(mockPercentage * 100).toFixed(1)}%
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit Hours</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Export Individual</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export function PayrollDataTable({ payrollData, selectedPeriod }: PayrollDataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Use mock data for development
  const data = payrollData.length > 0 ? payrollData : mockPayrollData;

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
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Employee Payroll</h2>
          <p className="text-sm text-muted-foreground">
            {selectedPeriod ? selectedPeriod.name : 'Current pay period'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <Input
            placeholder="Search employees..."
            value={(table.getColumn('employee.fullName')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('employee.fullName')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          
          {/* Department Filter - Note: This would need custom filtering logic in real implementation */}
          <Select
            defaultValue="all"
            onValueChange={(value) => {
              // In real implementation, this would filter by department
              console.log('Filter by department:', value);
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depts</SelectItem>
              <SelectItem value="junk">Junk</SelectItem>
              <SelectItem value="move">Move</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
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

          {/* Export */}
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
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
                  No payroll data found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} employee(s) selected.
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
              <SelectTrigger className="w-20" id="rows-per-page">
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
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}