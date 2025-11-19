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
  IconShield,
  IconUser,
  IconActivity,
  IconServer,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// TODO: Define AdminMetrics when connecting to real data
interface SystemEventData {
  id: string;
  timestamp: string;
  type:
    | 'user_activity'
    | 'system_event'
    | 'security_alert'
    | 'error'
    | 'admin_action';
  user?: string;
  action: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
}

// TODO: Define interface when component accepts props again
// Generate sample system event data - TODO: Replace with real data
const generateSampleSystemEvents = (): SystemEventData[] => {
  const eventTypes: (
    | 'user_activity'
    | 'system_event'
    | 'security_alert'
    | 'error'
    | 'admin_action'
  )[] = [
    'user_activity',
    'system_event',
    'security_alert',
    'error',
    'admin_action',
  ];
  const severities: ('low' | 'medium' | 'high' | 'critical')[] = [
    'low',
    'medium',
    'high',
    'critical',
  ];
  const users = [
    'John Smith',
    'Sarah Johnson',
    'Mike Wilson',
    'Lisa Chen',
    'David Brown',
    'Admin User',
  ];
  const actions = [
    'User login',
    'User logout',
    'Log submitted',
    'Log approved',
    'Commission created',
    'Database backup',
    'System restart',
    'Failed login attempt',
    'Password reset',
    'User created',
    'User updated',
    'Pay period closed',
    'Report generated',
  ];
  return Array.from({ length: 50 }, () => {
    const timestamp = new Date();
    timestamp.setMinutes(
      timestamp.getMinutes() - Math.floor(Math.random() * 1440)
    ); // Last 24 hours
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    let user: string | undefined;
    let details: string;
    if (type === 'user_activity' || type === 'admin_action') {
      user = users[Math.floor(Math.random() * users.length)];
      details = `${action} performed by ${user}`;
    } else if (type === 'security_alert') {
      details = `Security event: ${action}`;
    } else if (type === 'error') {
      details = `System error: ${action}`;
    } else {
      details = `System: ${action}`;
    }
    return {
      id: `EVT-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`,
      timestamp: timestamp.toISOString(),
      type,
      user,
      action,
      details,
      severity,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (compatible)',
    };
  });
};
const getEventIcon = (type: SystemEventData['type']) => {
  switch (type) {
    case 'user_activity':
      return IconUser;
    case 'system_event':
      return IconServer;
    case 'security_alert':
      return IconShield;
    case 'error':
      return IconAlertTriangle;
    case 'admin_action':
      return IconActivity;
    default:
      return IconActivity;
  }
};
const columns: ColumnDef<SystemEventData>[] = [
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
    accessorKey: 'timestamp',
    header: 'Time',
    cell: ({ row }) => {
      const timestamp = new Date(row.original.timestamp);
      const now = new Date();
      const minutesAgo = Math.floor(
        (now.getTime() - timestamp.getTime()) / (1000 * 60)
      );
      return (
        <div className="text-sm">
          <div className="font-medium">
            {minutesAgo < 1
              ? 'Just now'
              : minutesAgo < 60
                ? `${minutesAgo}m ago`
                : `${Math.floor(minutesAgo / 60)}h ago`}
          </div>
          <div className="text-muted-foreground text-xs">
            {timestamp.toLocaleTimeString('en-US', {
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type;
      const Icon = getEventIcon(type);
      return (
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <Badge
            variant="outline"
            className={
              type === 'security_alert'
                ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950'
                : type === 'error'
                  ? 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:bg-yellow-950'
                  : type === 'admin_action'
                    ? 'border-hunks-green text-hunks-green bg-hunks-green/10'
                    : type === 'user_activity'
                      ? 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-950'
                      : 'border-gray-200 text-gray-700 bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:bg-gray-950'
            }
          >
            {type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'user',
    header: 'User',
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.user || (
          <span className="text-muted-foreground">System</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ row }) => (
      <div className="max-w-48 truncate font-medium">{row.original.action}</div>
    ),
  },
  {
    accessorKey: 'details',
    header: 'Details',
    cell: ({ row }) => (
      <div className="max-w-64 truncate text-sm text-muted-foreground">
        {row.original.details}
      </div>
    ),
  },
  {
    accessorKey: 'severity',
    header: 'Severity',
    cell: ({ row }) => {
      const severity = row.original.severity;
      return (
        <Badge
          variant="outline"
          className={
            severity === 'critical'
              ? 'border-red-500 text-red-700 bg-red-100 dark:border-red-800 dark:text-red-300 dark:bg-red-950'
              : severity === 'high'
                ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-950'
                : severity === 'medium'
                  ? 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:border-yellow-800 dark:text-yellow-300 dark:bg-yellow-950'
                  : 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-950'
          }
        >
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'ipAddress',
    header: 'IP Address',
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.original.ipAddress || '-'}</div>
    ),
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
      </div>
    ),
  },
];
export function AdminDataTable() {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'timestamp', desc: true }, // Sort by newest first
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const data = React.useMemo(() => generateSampleSystemEvents(), []);
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
  // TODO: Calculate summary stats when needed
  const securityAlerts = data.filter(
    (event) => event.type === 'security_alert'
  );
  const systemErrors = data.filter((event) => event.type === 'error');
  const adminActions = data.filter((event) => event.type === 'admin_action');
  return (
    <Tabs defaultValue="all" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h3 className="text-lg font-semibold text-hunks-green">
            System Activity & Audit Log
          </h3>
          <p className="text-sm text-muted-foreground">
            Recent system events, user actions, and security alerts
          </p>
        </div>
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="all">
            All Events
            <Badge variant="secondary" className="ml-2">
              {data.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="security">
            Security
            <Badge
              variant="outline"
              className="ml-2 border-red-200 text-red-700 bg-red-50"
            >
              {securityAlerts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="errors">
            Errors
            <Badge
              variant="outline"
              className="ml-2 border-yellow-200 text-yellow-700 bg-yellow-50"
            >
              {systemErrors.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="admin">
            Admin Actions
            <Badge
              variant="outline"
              className="ml-2 border-hunks-green text-hunks-green bg-hunks-green/10"
            >
              {adminActions.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search events..."
              value={
                (table.getColumn('action')?.getFilterValue() as string) ?? ''
              }
              onChange={(event) =>
                table.getColumn('action')?.setFilterValue(event.target.value)
              }
              className="w-48"
            />
            <Select
              value={
                (table.getColumn('type')?.getFilterValue() as string) ?? 'all'
              }
              onValueChange={(value) =>
                table
                  .getColumn('type')
                  ?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user_activity">User Activity</SelectItem>
                <SelectItem value="system_event">System Event</SelectItem>
                <SelectItem value="security_alert">Security Alert</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="admin_action">Admin Action</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={
                (table.getColumn('severity')?.getFilterValue() as string) ??
                'all'
              }
              onValueChange={(value) =>
                table
                  .getColumn('severity')
                  ?.setFilterValue(value === 'all' ? '' : value)
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
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
                      row.original.severity === 'critical'
                        ? 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500'
                        : row.original.severity === 'high'
                          ? 'bg-red-50 dark:bg-red-950/10 border-l-4 border-l-red-400'
                          : row.original.type === 'security_alert'
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
                    No events found.
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
                  {[15, 25, 50, 100].map((pageSize) => (
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
      <TabsContent value="security" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-muted-foreground">
            Security alerts view - filtered table coming soon
          </p>
        </div>
      </TabsContent>
      <TabsContent value="errors" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-muted-foreground">
            System errors view - filtered table coming soon
          </p>
        </div>
      </TabsContent>
      <TabsContent value="admin" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
          <p className="text-muted-foreground">
            Admin actions view - filtered table coming soon
          </p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
