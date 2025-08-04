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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  Printer,
  FileImage,
  Settings,
  Info,
  HelpCircle,
  Calendar,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';
import type { PayPeriod, User } from '@/types';
import type { PayrollCalculation, TipEntry } from '@/lib/payCalculator';
import type { DepartmentBreakdownData } from './payroll-breakdown/department-breakdown';
import type { DailyWorkEntry } from '@/lib/actions/daily-work';

interface PayrollExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payrollData: PayrollCalculation[];
  selectedPeriod: PayPeriod | null;
  // Enhanced data for detailed breakdown exports
  departmentBreakdown?: DepartmentBreakdownData[];
  dailyWorkHistory?: DailyWorkEntry[];
  tipsDetails?: TipEntry[];
  currentUser?: User;
}

type ExportFormat = 'csv' | 'xlsx' | 'pdf' | 'adp' | 'print';
type ExportType = 'summary' | 'detailed' | 'paystub' | 'breakdown' | 'adp-import';
type ExportScope = 'current-user' | 'all-employees' | 'department';

interface ExportOptions {
  format: ExportFormat;
  type: ExportType;
  scope: ExportScope;
  includeHours: boolean;
  includeTips: boolean;
  includeBonuses: boolean;
  includeCommission: boolean;
  includeSalary: boolean;
  includeDepartmentBreakdown: boolean;
  includeDailyHistory: boolean;
  includeRateInformation: boolean;
  includeCalculationDetails: boolean;
  includeAuditTrail: boolean;
  departmentFilter: string;
  dateRange: 'full-period' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
  notes?: string;
}

export function PayrollExportDialog({
  open,
  onOpenChange,
  payrollData,
  selectedPeriod,
  departmentBreakdown,
  dailyWorkHistory,
  tipsDetails,
  currentUser,
}: PayrollExportDialogProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [options, setOptions] = React.useState<ExportOptions>({
    format: 'pdf',
    type: 'paystub',
    scope: 'current-user',
    includeHours: true,
    includeTips: true,
    includeBonuses: true,
    includeCommission: true,
    includeSalary: true,
    includeDepartmentBreakdown: true,
    includeDailyHistory: true,
    includeRateInformation: true,
    includeCalculationDetails: true,
    includeAuditTrail: false,
    departmentFilter: 'all',
    dateRange: 'full-period',
    notes: '',
  });

  const formatOptions = [
    { value: 'pdf', label: 'PDF Document (.pdf)', icon: FileText, description: 'Professional paystub format' },
    { value: 'xlsx', label: 'Excel Spreadsheet (.xlsx)', icon: FileSpreadsheet, description: 'Detailed data analysis' },
    { value: 'csv', label: 'CSV Data (.csv)', icon: FileText, description: 'Raw data export' },
    { value: 'print', label: 'Print Preview', icon: Printer, description: 'Browser print dialog' },
    { value: 'adp', label: 'ADP Import (.csv)', icon: FileSpreadsheet, description: 'Payroll system import' },
  ] as const;

  const typeOptions = [
    { value: 'paystub', label: 'Personal Paystub', description: 'Individual employee paystub with full breakdown' },
    { value: 'breakdown', label: 'Detailed Breakdown', description: 'Department, daily, and tips analysis' },
    { value: 'summary', label: 'Summary Report', description: 'High-level payroll totals only' },
    { value: 'detailed', label: 'Complete Report', description: 'All data with calculations and audit trail' },
    { value: 'adp-import', label: 'ADP Import File', description: 'Formatted for ADP payroll system' },
  ] as const;

  const scopeOptions = [
    { value: 'current-user', label: 'My Payroll Only', description: 'Export only your payroll data' },
    { value: 'department', label: 'My Department', description: 'Export department team data' },
    { value: 'all-employees', label: 'All Employees', description: 'Complete payroll export (admin only)' },
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
          <DialogTitle className="flex items-center gap-2" data-testid="export-dialog-title">
            <Download className="h-5 w-5" />
            Export Payroll Report
          </DialogTitle>
          <DialogDescription data-testid="export-dialog-description">
            Export payroll data for {selectedPeriod?.name || 'the current pay period'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full" data-testid="export-tabs">
          <TabsList className="grid w-full grid-cols-3" data-testid="export-tabs-list">
            <TabsTrigger value="basic" data-testid="basic-options-tab">Basic Options</TabsTrigger>
            <TabsTrigger value="content" data-testid="content-data-tab">Content & Data</TabsTrigger>
            <TabsTrigger value="preview" data-testid="preview-export-tab">Preview & Export</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            {/* Export Format */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Format</Label>
              <Select
                value={options.format}
                onValueChange={(value: ExportFormat) => updateOption('format', value)}
              >
                <SelectTrigger data-testid="format-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <format.icon className="h-4 w-4" />
                          {format.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format.description}
                        </div>
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
                <SelectTrigger data-testid="type-select">
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

            {/* Export Scope */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Export Scope</Label>
              <Select
                value={options.scope}
                onValueChange={(value: ExportScope) => updateOption('scope', value)}
              >
                <SelectTrigger data-testid="scope-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {scopeOptions.map((scope) => (
                    <SelectItem key={scope.value} value={scope.value}>
                      <div className="space-y-1">
                        <div className="font-medium">{scope.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {scope.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter (only show if scope is department or all) */}
            {(options.scope === 'department' || options.scope === 'all-employees') && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Department Filter</Label>
                <Select
                  value={options.departmentFilter}
                  onValueChange={(value: string) => updateOption('departmentFilter', value)}
                >
                  <SelectTrigger data-testid="department-filter-select">
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
            )}
          </TabsContent>

          <TabsContent value="content" className="space-y-6 mt-6">
            {/* Basic Pay Components */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Pay Components</Label>
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
                    Tips Earned
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

            {/* Detailed Breakdown Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Detailed Information</Label>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDepartmentBreakdown"
                    checked={options.includeDepartmentBreakdown}
                    onCheckedChange={(checked) => updateOption('includeDepartmentBreakdown', !!checked)}
                  />
                  <Label htmlFor="includeDepartmentBreakdown" className="text-sm">
                    Department Breakdown
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDailyHistory"
                    checked={options.includeDailyHistory}
                    onCheckedChange={(checked) => updateOption('includeDailyHistory', !!checked)}
                  />
                  <Label htmlFor="includeDailyHistory" className="text-sm">
                    Daily Work History
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeRateInformation"
                    checked={options.includeRateInformation}
                    onCheckedChange={(checked) => updateOption('includeRateInformation', !!checked)}
                  />
                  <Label htmlFor="includeRateInformation" className="text-sm">
                    Rate Information
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeCalculationDetails"
                    checked={options.includeCalculationDetails}
                    onCheckedChange={(checked) => updateOption('includeCalculationDetails', !!checked)}
                  />
                  <Label htmlFor="includeCalculationDetails" className="text-sm">
                    Calculation Details & Explanations
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAuditTrail"
                    checked={options.includeAuditTrail}
                    onCheckedChange={(checked) => updateOption('includeAuditTrail', !!checked)}
                  />
                  <Label htmlFor="includeAuditTrail" className="text-sm">
                    Audit Trail & Log References
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes Section */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-sm font-medium">
                Additional Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes or comments for this export..."
                value={options.notes}
                onChange={(e) => updateOption('notes', e.target.value)}
                className="min-h-[80px]"
                data-testid="export-notes-textarea"
              />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 mt-6">
            {/* Export Preview */}
            <Card data-testid="export-preview-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="export-preview-title">
                  <FileText className="h-5 w-5" />
                  Export Preview
                </CardTitle>
                <CardDescription data-testid="export-preview-description">
                  Review your export settings before generating the file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Format:</span>
                      <Badge variant="outline">
                        {formatOptions.find(f => f.value === options.format)?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">Type:</span>
                      <Badge variant="outline">
                        {typeOptions.find(t => t.value === options.type)?.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Scope:</span>
                      <Badge variant="outline">
                        {scopeOptions.find(s => s.value === options.scope)?.label}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Period:</span>
                      <span className="text-muted-foreground">
                        {selectedPeriod?.name || 'Current Period'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium">Employees:</span>
                      <span className="text-muted-foreground">{getEmployeeCount()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">Est. Size:</span>
                      <span className="text-muted-foreground">{getEstimatedFileSize()}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Content Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Included Content:</h4>
                  <div className="flex flex-wrap gap-2">
                    {options.includeHours && <Badge variant="secondary">Hours</Badge>}
                    {options.includeTips && <Badge variant="secondary">Tips</Badge>}
                    {options.includeBonuses && <Badge variant="secondary">Bonuses</Badge>}
                    {options.includeCommission && <Badge variant="secondary">Commission</Badge>}
                    {options.includeSalary && <Badge variant="secondary">Salary</Badge>}
                    {options.includeDepartmentBreakdown && <Badge variant="secondary">Dept. Breakdown</Badge>}
                    {options.includeDailyHistory && <Badge variant="secondary">Daily History</Badge>}
                    {options.includeRateInformation && <Badge variant="secondary">Rate Info</Badge>}
                    {options.includeCalculationDetails && <Badge variant="secondary">Calculations</Badge>}
                    {options.includeAuditTrail && <Badge variant="secondary">Audit Trail</Badge>}
                  </div>
                </div>

                {options.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Notes:</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        {options.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Progress Bar (shown during export) */}
            {isExporting && (
              <Card data-testid="export-progress-card">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span data-testid="export-progress-label">Generating export...</span>
                      <span data-testid="export-progress-percentage">{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="h-2" data-testid="export-progress-bar" />
                    <p className="text-xs text-muted-foreground" data-testid="export-progress-message">
                      {exportProgress < 30 && 'Collecting payroll data...'}
                      {exportProgress >= 30 && exportProgress < 60 && 'Processing department breakdowns...'}
                      {exportProgress >= 60 && exportProgress < 90 && 'Generating document...'}
                      {exportProgress >= 90 && 'Finalizing export...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Information */}
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Export Tips:</strong> PDF format is recommended for paystubs and official records. 
                Excel format is best for data analysis. Print preview allows you to review before printing.
                {options.type === 'paystub' && ' Paystubs include all breakdown information and calculation explanations.'}
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter data-testid="export-dialog-footer">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
            data-testid="export-cancel-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="min-w-24"
            data-testid="export-submit-button"
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