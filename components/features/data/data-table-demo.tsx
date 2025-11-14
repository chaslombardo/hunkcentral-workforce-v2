'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  IconEdit,
  IconEye,
  IconTrash,
  IconDownload,
  IconMail,
  IconCheck,
  IconX,
} from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  UniversalDataTable,
  ExportManager,
  BulkOperations,
  type ExportOptions,
  type BulkActionConfig as UniversalBulkActionConfig,
} from '@/components/features/data';
import { type BulkActionConfig } from '@/components/features/data/export-manager';
import { FILTER_SETS, QUICK_FILTERS } from '@/lib/data-filters';
import { toast } from 'sonner';

// Sample data structure for logs
interface LogData {
  id: string;
  date: string;
  captain: string;
  status: 'pending' | 'approved' | 'rejected' | 'draft';
  totalRevenue: number;
  laborCost: number;
  laborPercent: number;
  totalTips: number;
  totalHours: number;
  jobCount: number;
  department: 'junk' | 'move' | 'other';
}

// Sample data
const sampleLogData: LogData[] = [
  {
    id: 'LOG-001',
    date: '2024-01-15',
    captain: 'John Smith',
    status: 'approved',
    totalRevenue: 2450.0,
    laborCost: 343.0,
    laborPercent: 14.0,
    totalTips: 125.0,
    totalHours: 8.5,
    jobCount: 3,
    department: 'junk',
  },
  {
    id: 'LOG-002',
    date: '2024-01-15',
    captain: 'Sarah Johnson',
    status: 'pending',
    totalRevenue: 1850.0,
    laborCost: 444.0,
    laborPercent: 24.0,
    totalTips: 95.0,
    totalHours: 12.0,
    jobCount: 2,
    department: 'move',
  },
  {
    id: 'LOG-003',
    date: '2024-01-14',
    captain: 'Mike Wilson',
    status: 'approved',
    totalRevenue: 3200.0,
    laborCost: 448.0,
    laborPercent: 14.0,
    totalTips: 180.0,
    totalHours: 10.0,
    jobCount: 4,
    department: 'junk',
  },
  {
    id: 'LOG-004',
    date: '2024-01-14',
    captain: 'Emily Davis',
    status: 'rejected',
    totalRevenue: 1200.0,
    laborCost: 360.0,
    laborPercent: 30.0,
    totalTips: 60.0,
    totalHours: 9.0,
    jobCount: 2,
    department: 'move',
  },
  {
    id: 'LOG-005',
    date: '2024-01-13',
    captain: 'David Brown',
    status: 'draft',
    totalRevenue: 2800.0,
    laborCost: 392.0,
    laborPercent: 14.0,
    totalTips: 140.0,
    totalHours: 8.0,
    jobCount: 3,
    department: 'junk',
  },
];

// Status badge component
function StatusBadge({ status }: { status: LogData['status'] }) {
  const variants = {
    approved: {
      variant: 'default' as const,
      color: 'bg-green-100 text-green-800',
    },
    pending: {
      variant: 'secondary' as const,
      color: 'bg-yellow-100 text-yellow-800',
    },
    rejected: {
      variant: 'destructive' as const,
      color: 'bg-red-100 text-red-800',
    },
    draft: { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className={config.color}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Row actions component
function RowActions({ row }: { row: LogData }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toast.info(`Viewing log ${row.id}`)}>
          <IconEye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast.info(`Editing log ${row.id}`)}>
          <IconEdit className="mr-2 h-4 w-4" />
          Edit Log
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => toast.error(`Deleting log ${row.id}`)}
          className="text-destructive"
        >
          <IconTrash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Column definitions
const columns: ColumnDef<LogData>[] = [
  {
    accessorKey: 'id',
    header: 'Log ID',
    cell: ({ row }) => <div className="font-medium">{row.getValue('id')}</div>,
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    accessorKey: 'captain',
    header: 'Captain',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('captain')}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'department',
    header: 'Department',
    cell: ({ row }) => {
      const dept = row.getValue('department') as string;
      return (
        <Badge variant="outline">
          {dept.charAt(0).toUpperCase() + dept.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'totalRevenue',
    header: 'Revenue',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalRevenue'));
      return <div className="font-medium">${amount.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: 'laborPercent',
    header: 'Labor %',
    cell: ({ row }) => {
      const percent = parseFloat(row.getValue('laborPercent'));
      const isGood = percent <= (row.original.department === 'junk' ? 14 : 24);
      return (
        <div
          className={`font-medium ${isGood ? 'text-green-600' : 'text-red-600'}`}
        >
          {percent.toFixed(1)}%
        </div>
      );
    },
  },
  {
    accessorKey: 'totalTips',
    header: 'Tips',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('totalTips'));
      return <div>${amount.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: 'totalHours',
    header: 'Hours',
    cell: ({ row }) => {
      const hours = parseFloat(row.getValue('totalHours'));
      return <div>{hours.toFixed(1)}h</div>;
    },
  },
  {
    accessorKey: 'jobCount',
    header: 'Jobs',
    cell: ({ row }) => (
      <div className="text-center">{row.getValue('jobCount')}</div>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <RowActions row={row.original} />,
  },
];

// Bulk actions configuration
const bulkActions: BulkActionConfig[] = [
  {
    key: 'approve',
    label: 'Approve Selected',
    icon: IconCheck,
    variant: 'default',
  },
  {
    key: 'reject',
    label: 'Reject Selected',
    icon: IconX,
    variant: 'destructive',
  },
  {
    key: 'export',
    label: 'Export Selected',
    icon: IconDownload,
    variant: 'default',
  },
  {
    key: 'email',
    label: 'Email Selected',
    icon: IconMail,
    variant: 'default',
  },
];

// Universal bulk actions for the data table
const universalBulkActions: UniversalBulkActionConfig[] = [
  {
    label: 'Approve Selected',
    action: async (rows) => console.log('Approve', rows),
    icon: IconCheck,
    variant: 'default',
  },
  {
    label: 'Reject Selected',
    action: async (rows) => console.log('Reject', rows),
    icon: IconX,
    variant: 'destructive',
  },
];

export function DataTableDemo() {
  const [selectedRows, setSelectedRows] = React.useState<LogData[]>([]);

  // Export handler
  const handleExport = async (options: ExportOptions) => {
    console.log('Exporting with options:', options);
    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success(
      `Exported ${options.selectedOnly ? selectedRows.length : sampleLogData.length} rows as ${options.format}`
    );
  };

  // Bulk action handler
  const handleBulkAction = async (actionKey: string, rows: LogData[]) => {
    console.log(`Bulk action ${actionKey} on ${rows.length} rows:`, rows);

    switch (actionKey) {
      case 'approve':
        toast.success(`Approved ${rows.length} logs`);
        break;
      case 'reject':
        toast.error(`Rejected ${rows.length} logs`);
        break;
      case 'export':
        toast.info(`Exporting ${rows.length} logs`);
        break;
      case 'email':
        toast.info(`Emailing ${rows.length} logs`);
        break;
      default:
        toast.info(`Action ${actionKey} completed`);
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-hunks-green-800">
            Daily Logs
          </h2>
          <p className="text-muted-foreground">
            Manage and review captain daily work logs
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <ExportManager
            data={sampleLogData}
            columns={columns}
            selectedRows={selectedRows}
            onExport={handleExport}
            branded={true}
          />
          <Button>Create New Log</Button>
        </div>
      </div>

      <UniversalDataTable
        data={sampleLogData}
        columns={columns}
        searchable={true}
        searchPlaceholder="Search logs by ID, captain, or status..."
        sortable={true}
        defaultSort={{ column: 'date', direction: 'desc' }}
        filters={FILTER_SETS.logs}
        quickFilters={QUICK_FILTERS.logs}
        enableSelection={true}
        onSelectionChange={setSelectedRows}
        bulkActions={universalBulkActions}
        exportOptions={['excel', 'csv', 'pdf']}
        pagination={true}
        pageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
        branded={true}
        emptyMessage="No logs found. Create your first log to get started."
      />

      {selectedRows.length > 0 && (
        <BulkOperations
          selectedRows={selectedRows}
          actions={bulkActions}
          onAction={handleBulkAction}
          onClearSelection={() => setSelectedRows([])}
          branded={true}
        />
      )}
    </div>
  );
}
