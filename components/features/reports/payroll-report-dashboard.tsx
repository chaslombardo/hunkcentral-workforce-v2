'use client';

import { useState, useEffect } from 'react';
import { PayrollSummaryCards } from './payroll-summary-cards';
import { PayrollChart } from './payroll-chart';
import { PayrollDataTable } from './payroll-data-table';
import { PayrollExportDialog } from './payroll-export-dialog';
import { Button } from '@/components/ui/button';
import { BrandLoading } from '@/components/brand/brand-loading';
import { StatusIndicator } from '@/components/brand/status-indicator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

import type { PayrollCalculation } from '@/lib/payCalculator';
import type { DateRange } from 'react-day-picker';
import { getPayPeriods, type PayPeriod } from '@/lib/actions/pay-periods';

export function PayrollReportDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [payrollData] = useState<PayrollCalculation[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Load pay periods and payroll data
  useEffect(() => {
    const loadPayrollData = async () => {
      setIsLoading(true);

      try {
        // Load pay periods
        const periodsResult = await getPayPeriods();
        if (periodsResult.success && periodsResult.data) {
          setPayPeriods(periodsResult.data);
          // Set the most recent period as default
          if (periodsResult.data.length > 0) {
            setSelectedPeriod(periodsResult.data[0]);
          }
        }
      } catch {
        // Error loading payroll data
      } finally {
        setIsLoading(false);
      }
    };

    loadPayrollData();
  }, []);

  const handlePeriodChange = (periodId: string) => {
    const period = payPeriods.find((p) => p.id === periodId);
    if (period) {
      setSelectedPeriod(period);
      // Load payroll data for selected period
      // This would be an API call in real implementation
    }
  };

  const handleExport = () => {
    setShowExportDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <BrandLoading variant="spinner" size="lg" />
                <div className="text-center">
                  <div className="text-lg font-medium">
                    Loading Payroll Data
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Please wait while we fetch your reports
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Enhanced Header Section - Following dashboard-01 pattern */}
          <div className="px-4 lg:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Team Payroll Reports
                </h1>
                <p className="text-muted-foreground">
                  Generate and manage payroll reports for all employees with
                  advanced filtering and export options
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Enhanced Pay Period Selector */}
                <Select
                  value={selectedPeriod?.id}
                  onValueChange={handlePeriodChange}
                >
                  <SelectTrigger className="w-full sm:w-[200px] transition-all duration-200 hover:bg-accent/50">
                    <SelectValue placeholder="Select pay period" />
                  </SelectTrigger>
                  <SelectContent>
                    {payPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        <div className="flex items-center gap-2">
                          <span>{period.name}</span>
                          <StatusIndicator
                            status={
                              period.status as 'open' | 'locked' | 'closed'
                            }
                            size="sm"
                          />
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Enhanced Date Range Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-[200px] justify-start text-left font-normal transition-all duration-200 hover:bg-accent/50 hover:scale-[1.02]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd')} -{' '}
                            {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                {/* Enhanced Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 hover:bg-accent/50"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button
                    onClick={handleExport}
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 bg-primary hover:bg-primary/90"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs for different report views - Following dashboard-01 Tabs pattern */}
          <Tabs
            defaultValue="overview"
            className="w-full flex-col justify-start gap-6"
          >
            <div className="flex items-center justify-between px-4 lg:px-6">
              <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
                <TabsTrigger
                  value="overview"
                  className="transition-all duration-200"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="detailed"
                  className="transition-all duration-200"
                >
                  Detailed{' '}
                  <Badge
                    variant="secondary"
                    className="ml-1 transition-all duration-200"
                  >
                    {payrollData.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="transition-all duration-200"
                >
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="export"
                  className="transition-all duration-200"
                >
                  Export
                </TabsTrigger>
              </TabsList>

              {/* Additional action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="transition-all duration-200 hover:scale-105"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Advanced Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Quick Export
                </Button>
              </div>
            </div>

            {/* Overview Tab - Main dashboard view */}
            <TabsContent
              value="overview"
              className="flex flex-col gap-4 overflow-auto"
            >
              {/* Summary Cards - Using dashboard-01 SectionCards pattern */}
              <PayrollSummaryCards
                payrollData={payrollData}
                selectedPeriod={selectedPeriod}
              />

              {/* Chart Section - Using dashboard-01 ChartAreaInteractive pattern */}
              <div className="px-4 lg:px-6">
                <PayrollChart selectedPeriod={selectedPeriod} />
              </div>
            </TabsContent>

            {/* Detailed Tab - Data table view */}
            <TabsContent
              value="detailed"
              className="flex flex-col overflow-auto"
            >
              <PayrollDataTable
                payrollData={payrollData}
                selectedPeriod={selectedPeriod}
              />
            </TabsContent>

            {/* Analytics Tab - Additional charts and insights */}
            <TabsContent
              value="analytics"
              className="flex flex-col px-4 lg:px-6"
            >
              <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg font-medium">Advanced Analytics</div>
                  <div className="text-sm">
                    Department comparisons, trends, and insights
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Export Tab - Export options and history */}
            <TabsContent value="export" className="flex flex-col px-4 lg:px-6">
              <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg font-medium">Export Center</div>
                  <div className="text-sm">
                    Export options and download history
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Export Dialog */}
          <PayrollExportDialog
            open={showExportDialog}
            onOpenChange={setShowExportDialog}
            payrollData={payrollData}
            selectedPeriod={selectedPeriod}
          />
        </div>
      </div>
    </div>
  );
}
