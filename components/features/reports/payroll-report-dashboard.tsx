'use client';

import { useState, useEffect } from 'react';
import { PayrollSummaryCards } from './payroll-summary-cards';
import { PayrollChart } from './payroll-chart';
import { PayrollDataTable } from './payroll-data-table';
import { PayrollExportDialog } from './payroll-export-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { CalendarIcon, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';

import type { PayPeriod } from '@/types';
import type { PayrollCalculation } from '@/lib/payCalculator';
import type { DateRange } from 'react-day-picker';

export function PayrollReportDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PayPeriod | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [payrollData] = useState<PayrollCalculation[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Mock data for development - replace with actual API calls
  useEffect(() => {
    const loadPayrollData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock pay periods
      const mockPayPeriods: PayPeriod[] = [
        {
          id: '1',
          name: 'January 2025 - Week 1',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-07'),
          status: 'closed',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'January 2025 - Week 2',
          startDate: new Date('2025-01-08'),
          endDate: new Date('2025-01-14'),
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      setPayPeriods(mockPayPeriods);
      setSelectedPeriod(mockPayPeriods[0]);
      setIsLoading(false);
    };

    loadPayrollData();
  }, []);

  const handlePeriodChange = (periodId: string) => {
    const period = payPeriods.find(p => p.id === periodId);
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
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
          {/* Header Section - Following dashboard-01 pattern */}
          <div className="px-4 lg:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Payroll Reports</h1>
                <p className="text-muted-foreground">
                  Generate and manage payroll reports for all employees
                </p>
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Pay Period Selector */}
                <Select value={selectedPeriod?.id} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select pay period" />
                  </SelectTrigger>
                  <SelectContent>
                    {payPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        <div className="flex items-center gap-2">
                          <span>{period.name}</span>
                          <Badge 
                            variant={period.status === 'closed' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {period.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Range Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[200px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
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

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button onClick={handleExport} size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for different report views - Following dashboard-01 Tabs pattern */}
          <Tabs defaultValue="overview" className="w-full flex-col justify-start gap-6">
            <div className="flex items-center justify-between px-4 lg:px-6">
              <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">
                  Detailed <Badge variant="secondary">{payrollData.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab - Main dashboard view */}
            <TabsContent value="overview" className="flex flex-col gap-4 overflow-auto">
              {/* Summary Cards - Using dashboard-01 SectionCards pattern */}
              <PayrollSummaryCards 
                payrollData={payrollData}
                selectedPeriod={selectedPeriod}
              />

              {/* Chart Section - Using dashboard-01 ChartAreaInteractive pattern */}
              <div className="px-4 lg:px-6">
                <PayrollChart 
                  selectedPeriod={selectedPeriod}
                />
              </div>
            </TabsContent>

            {/* Detailed Tab - Data table view */}
            <TabsContent value="detailed" className="flex flex-col overflow-auto">
              <PayrollDataTable 
                payrollData={payrollData}
                selectedPeriod={selectedPeriod}
              />
            </TabsContent>

            {/* Analytics Tab - Additional charts and insights */}
            <TabsContent value="analytics" className="flex flex-col px-4 lg:px-6">
              <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg font-medium">Advanced Analytics</div>
                  <div className="text-sm">Department comparisons, trends, and insights</div>
                </div>
              </div>
            </TabsContent>

            {/* Export Tab - Export options and history */}
            <TabsContent value="export" className="flex flex-col px-4 lg:px-6">
              <div className="aspect-video w-full flex-1 rounded-lg border border-dashed flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg font-medium">Export Center</div>
                  <div className="text-sm">Export options and download history</div>
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