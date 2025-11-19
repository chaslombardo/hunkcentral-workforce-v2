'use client';

import * as React from 'react';
import {
  IconDownload,
  IconFileExport,
  IconFileSpreadsheet,
  IconFileText,
  IconMail,
  IconPrinter,
} from '@tabler/icons-react';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type ExportFormat = 'excel' | 'csv' | 'pdf' | 'print';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeHeaders?: boolean;
  selectedOnly?: boolean;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  columns?: string[];
  template?: string;
}

export type ExportColumn = {
  key: string;
  label: string;
  formatter?: (value: unknown) => string;
};

export interface ExportManagerProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  selectedRows?: Record<string, unknown>[];
  onExport: (options: ExportOptions) => Promise<void>;
  className?: string;
  branded?: boolean;
}

export interface BulkActionConfig {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
}

export interface BulkOperationsProps {
  selectedRows: Record<string, unknown>[];
  actions: BulkActionConfig[];
  onAction: (
    actionKey: string,
    rows: Record<string, unknown>[]
  ) => Promise<void>;
  onClearSelection: () => void;
  className?: string;
  branded?: boolean;
}

// Export format configurations
const EXPORT_FORMATS = {
  excel: {
    label: 'Excel',
    icon: IconFileSpreadsheet,
    description: 'Export as Excel spreadsheet (.xlsx)',
    extension: 'xlsx',
  },
  csv: {
    label: 'CSV',
    icon: IconFileText,
    description: 'Export as comma-separated values (.csv)',
    extension: 'csv',
  },
  pdf: {
    label: 'PDF',
    icon: IconFileExport,
    description: 'Export as PDF document (.pdf)',
    extension: 'pdf',
  },
  print: {
    label: 'Print',
    icon: IconPrinter,
    description: 'Print the data table',
    extension: null,
  },
} as const;

// Email report dialog
function EmailReportDialog({
  onSend,
  trigger,
}: {
  onSend: (options: {
    recipients: string[];
    subject: string;
    message: string;
    format: ExportFormat;
  }) => Promise<void>;
  trigger: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [recipients, setRecipients] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [format, setFormat] = React.useState<ExportFormat>('pdf');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSend = async () => {
    if (!recipients.trim()) {
      toast.error('Please enter at least one recipient email');
      return;
    }

    setIsLoading(true);
    try {
      const recipientList = recipients
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);
      await onSend({ recipients: recipientList, subject, message, format });
      toast.success('Report sent successfully');
      setIsOpen(false);
      setRecipients('');
      setSubject('');
      setMessage('');
    } catch {
      toast.error('Failed to send report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Email Report</DialogTitle>
          <DialogDescription>
            Send the data report to one or more recipients
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients</Label>
            <Input
              id="recipients"
              placeholder="email1@example.com, email2@example.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Separate multiple emails with commas
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Data Report"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">Format</Label>
            <Select
              value={format}
              onValueChange={(value: ExportFormat) => setFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Additional message to include with the report..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export dialog
function ExportDialog({
  data,
  columns,
  selectedRows,
  onExport,
  trigger,
}: {
  data: unknown[];
  columns: ExportColumn[];
  selectedRows?: unknown[];
  onExport: (options: ExportOptions) => Promise<void>;
  trigger: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [format, setFormat] = React.useState<ExportFormat>('excel');
  const [filename, setFilename] = React.useState('');
  const [includeHeaders, setIncludeHeaders] = React.useState(true);
  const [selectedOnly, setSelectedOnly] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const formatConfig = EXPORT_FORMATS[format];

  const handleExport = async () => {
    setIsLoading(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      await onExport({
        format,
        filename: filename || `export.${formatConfig.extension}`,
        includeHeaders,
        selectedOnly: selectedOnly && selectedRows && selectedRows.length > 0,
      });

      clearInterval(progressInterval);
      setProgress(100);

      toast.success(`Export completed successfully`);
      setIsOpen(false);
    } catch {
      toast.error('Export failed');
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
          <span>
            {data.length} total row{data.length === 1 ? '' : 's'}
          </span>
          <span className="mx-2">•</span>
          <span>
            {columns.length} column{columns.length === 1 ? '' : 's'}
          </span>
          {selectedRows && selectedRows.length > 0 && (
            <>
              <span className="mx-2">•</span>
              <span>{selectedRows.length} selected</span>
            </>
          )}
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Format</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(EXPORT_FORMATS).map(([key, config]) => (
                <Button
                  key={key}
                  variant={format === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFormat(key as ExportFormat)}
                  className="justify-start"
                >
                  <config.icon className="mr-2 h-4 w-4" />
                  {config.label}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatConfig.description}
            </p>
          </div>

          {format !== 'print' && (
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                placeholder={`export.${formatConfig.extension}`}
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeHeaders"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="includeHeaders" className="text-sm">
                Include column headers
              </Label>
            </div>

            {selectedRows && selectedRows.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="selectedOnly"
                  checked={selectedOnly}
                  onChange={(e) => setSelectedOnly(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="selectedOnly" className="text-sm">
                  Export selected rows only ({selectedRows.length} selected)
                </Label>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isLoading}>
            {isLoading ? 'Exporting...' : `Export ${formatConfig.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExportManager({
  data,
  columns,
  selectedRows,
  onExport,
  className,
  branded = true,
}: ExportManagerProps) {
  const handleEmailReport = async (options: {
    recipients: string[];
    subject: string;
    message: string;
    format: ExportFormat;
  }) => {
    // Implementation would integrate with email service
    console.warn('Email report:', options);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
  };

  return (
    <div
      className={cn(
        'flex items-center space-x-2',
        branded && 'text-hunks-green',
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <IconDownload className="mr-2 h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {Object.entries(EXPORT_FORMATS).map(([key, config]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onExport({ format: key as ExportFormat })}
            >
              <config.icon className="mr-2 h-4 w-4" />
              Export as {config.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <ExportDialog
            data={data}
            columns={columns}
            selectedRows={selectedRows}
            onExport={onExport}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <IconFileExport className="mr-2 h-4 w-4" />
                Advanced Export...
              </DropdownMenuItem>
            }
          />
          <EmailReportDialog
            onSend={handleEmailReport}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <IconMail className="mr-2 h-4 w-4" />
                Email Report...
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function BulkOperations({
  selectedRows,
  actions,
  onAction,
  onClearSelection,
  className,
  branded = true,
}: BulkOperationsProps) {
  const [isLoading, setIsLoading] = React.useState<string | null>(null);

  const handleAction = async (actionKey: string) => {
    setIsLoading(actionKey);
    try {
      await onAction(actionKey, selectedRows);
      toast.success('Action completed successfully');
    } catch {
      toast.error('Action failed');
    } finally {
      setIsLoading(null);
    }
  };

  if (selectedRows.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md border p-3',
        branded && 'border-hunks-green-200 bg-hunks-green-50',
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">
          {selectedRows.length} item{selectedRows.length === 1 ? '' : 's'}{' '}
          selected
        </span>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Clear selection
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            variant={
              action.variant === 'destructive' ? 'destructive' : 'outline'
            }
            size="sm"
            onClick={() => handleAction(action.key)}
            disabled={isLoading !== null}
          >
            {action.icon && <action.icon className="mr-2 h-4 w-4" />}
            {isLoading === action.key ? 'Processing...' : action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
