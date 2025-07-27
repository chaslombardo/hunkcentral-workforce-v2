'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { PayPeriod } from '@/types';
import type { PayrollCalculation } from '@/lib/payCalculator';

interface PayrollExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollData: PayrollCalculation[];
  selectedPeriod: PayPeriod | null;
}

type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'adp';
type ExportType = 'summary' | 'detailed' | 'adp-import';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  includeHours: boolean;
  includeTips: boolean;
  includeBonuses: boolean;
  includeCommission: boolean;
  includeSalary: boolean;
  departmentFilter: string;
}

export function PayrollExportDialog({
  open,
  onOpenChange,
  payrollData,
  selectedPeriod,
}: PayrollExportDialogProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [options, setOptions] = React.useState<ExportOptions>({
    format: 'xlsx',
    type: 'detailed',
    includeHours: true,
    includeTips: true,
    includeBonuses: true,
    includeCommission: true,
    includeSalary: true,
    departmentFilter: 'all',
  });

  const formatOptions = [
    { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
    { value: 'csv', label: 'CSV (.csv)', icon: FileText },
    { value: 'pdf', label: 'PDF (.pdf)', icon: FileText },
    { value: 'adp', label: 'ADP Import (.csv)', icon: FileSpreadsheet },
  ] as const;

  const typeOptions = [
    { value: 'summary', label: 'Summary Report', description: 'High-level payroll totals' },
    { value: 'detailed', label: 'Detailed Report', description: 'Complete breakdown by employee' },
    { value: 'adp-import', label: 'ADP Import File', description: 'Formatted for ADP payroll system' },
  ] as const;

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'junk', label: 'Junk Department' },
    { value: 'move', label: 'Move Department' },
    { value: 'sales', label: 'Sales Department' },
    { value: 'admin', label: 'Admin Department' },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate export progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate API call for export
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Complete progress
      clearInterval(progressInterval);
      setExportProgress(100);

      // Generate filename
      const periodName = selectedPeriod?.name || 'current-period';
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `payroll-${options.type}-${periodName}-${timestamp}.${options.format}`;

      // In real implementation, this would trigger actual file download
      // For now, just show success message
      toast({
        title: 'Export Complete',
        description: `${filename} has been downloaded successfully.`,
      });

      // Reset and close
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onOpenChange(false);
      }, 1000);

    } catch {
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the payroll data.',
        variant: 'destructive',
      });
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const updateOption = <K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K]
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const getEstimatedFileSize = () => {
    const baseSize = payrollData.length * 0.5; // KB per employee
    const multiplier = options.type === 'detailed' ? 2 : 1;
    return `~${Math.max(1, Math.round(baseSize * multiplier))} KB`;
  };

  const getEmployeeCount = () => {
    if (options.departmentFilter === 'all') {
      return payrollData.length;
    }
    return payrollData.filter(emp => {
      const primaryDept = Object.entries(emp.hoursByDepartment)
        .find(([, hours]) => hours > 0)?.[0] || 'admin';
      return primaryDept === options.departmentFilter;
    }).length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Payroll Report
          </DialogTitle>
          <DialogDescription>
            Export payroll data for {selectedPeriod?.name || 'the current pay period'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select
              value={options.format}
              onValueChange={(value: ExportFormat) => updateOption('format', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatOptions.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex items-center gap-2">
                      <format.icon className="h-4 w-4" />
                      {format.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Report Type</Label>
            <Select
              value={options.type}
              onValueChange={(value: ExportType) => updateOption('type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Department Filter</Label>
            <Select
              value={options.departmentFilter}
              onValueChange={(value: string) => updateOption('departmentFilter', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept.value} value={dept.value}>
                    {dept.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Include Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in Export</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHours"
                  checked={options.includeHours}
                  onCheckedChange={(checked) => updateOption('includeHours', !!checked)}
                />
                <Label htmlFor="includeHours" className="text-sm">
                  Hours Worked
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTips"
                  checked={options.includeTips}
                  onCheckedChange={(checked) => updateOption('includeTips', !!checked)}
                />
                <Label htmlFor="includeTips" className="text-sm">
                  Tips
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeBonuses"
                  checked={options.includeBonuses}
                  onCheckedChange={(checked) => updateOption('includeBonuses', !!checked)}
                />
                <Label htmlFor="includeBonuses" className="text-sm">
                  Bonuses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCommission"
                  checked={options.includeCommission}
                  onCheckedChange={(checked) => updateOption('includeCommission', !!checked)}
                />
                <Label htmlFor="includeCommission" className="text-sm">
                  Commission
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSalary"
                  checked={options.includeSalary}
                  onCheckedChange={(checked) => updateOption('includeSalary', !!checked)}
                />
                <Label htmlFor="includeSalary" className="text-sm">
                  Salary
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="text-sm font-medium">Export Summary</div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>Employees: {getEmployeeCount()}</div>
              <div>Estimated size: {getEstimatedFileSize()}</div>
              <div>Format: {formatOptions.find(f => f.value === options.format)?.label}</div>
              <div>Type: {typeOptions.find(t => t.value === options.type)?.label}</div>
            </div>
          </div>

          {/* Progress Bar (shown during export) */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-24"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}