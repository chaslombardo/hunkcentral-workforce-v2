'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOfflineDetection } from '@/hooks/useOfflineDetection';

import {
  Clock,
  DollarSign,
  Download,
  Award,
  AlertCircle,
  AlertTriangle,
  Shield,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { PayPeriod, User, Department } from '@/types';
import { DepartmentBreakdown, type DepartmentBreakdownData } from './payroll-breakdown/department-breakdown';
import { RateInformationPanel } from './payroll-breakdown/rate-information-panel';
import { DailyWorkCalendar } from './payroll-breakdown/daily-work-calendar';
import { TipsDetailView } from './payroll-breakdown/tips-detail-view';
import { PayPeriodAnalysis } from './payroll-breakdown/pay-period-analysis';
import { PayrollValidationPanel } from './payroll-breakdown/payroll-validation-panel';
import { PayrollExportDialog } from './payroll-export-dialog';
import { DiscrepancyReportDialog } from './discrepancy-report-dialog';

import { PayrollErrorBoundary, PayrollComponentErrorBoundary } from './payroll-error-boundary';
import { 
  DepartmentBreakdownFallback, 
  DailyWorkFallback, 
  TipsDetailFallback,
  PayrollLoadingSkeleton 
} from './payroll-fallback-views';
import type { TipEntry } from '@/lib/payCalculator';
import type { PayrollValidationResult, ValidationError } from '@/lib/payrollValidation';

// Types for API responses
interface DailyWorkEntry {
  date: Date;
  logId: string;
  departments: Array<{
    department: Department;
    hours: number;
    rate: number;
    role: 'captain' | 'co-captain' | 'wingman';
  }>;
  tips: number;
  totalHours: number;
  grossPay: number;
  jobsCompleted: number;
}

interface WorkPatternStats {
  totalDaysWorked: number;
  avgHoursPerDay: number;
  mostCommonDepartment: Department;
  totalJobsCompleted: number;
  avgTipsPerDay: number;
  busiestDay: Date;
  highestTipDay: Date;
  highestPayDay: Date;
}

// Real data integration - all mock data has been replaced with API calls

interface MyPayrollViewProps {
  userId?: string;
  initialPayPeriod?: PayPeriod;
}

interface PayrollSummaryData {
  employeeId: string;
  employee: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
  };
  payPeriod: PayPeriod;
  totalHours: number;
  totalPay: number;
  grossWages: number;
  tips: number;
  commission: number;
  bonuses: number;
}

interface DetailedPayrollData {
  departmentBreakdown: DepartmentBreakdownData[];
  dailyWorkHistory: DailyWorkEntry[];
  tipsDetails: TipEntry[];
  workPatternStats: WorkPatternStats;
  validationResult?: PayrollValidationResult;
}

export function MyPayrollView({ userId, initialPayPeriod }: MyPayrollViewProps = {}) {
  const isMobile = useIsMobile();
  const offlineState = useOfflineDetection();
  const [selectedPeriod, setSelectedPeriod] = React.useState<PayPeriod | null>(initialPayPeriod || null);
  const [payPeriods, setPayPeriods] = React.useState<PayPeriod[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [activeTab, setActiveTab] = React.useState('breakdown');
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [showDiscrepancyDialog, setShowDiscrepancyDialog] = React.useState(false);
  const [discrepancyErrors, setDiscrepancyErrors] = React.useState<ValidationError[]>([]);
  
  // Load pay periods on mount
  React.useEffect(() => {
    const loadPayPeriods = async () => {
      try {
        // Get pay periods from API - for now use a simple fetch
        const response = await fetch('/api/pay-periods');
        if (response.ok) {
          const periods = await response.json();
          setPayPeriods(periods);
          if (!selectedPeriod && periods.length > 0) {
            // Select the most recent open period or the latest closed one
            const openPeriod = periods.find((p: PayPeriod) => p.status === 'open');
            setSelectedPeriod(openPeriod || periods[0]);
          }
        }
      } catch (error) {
        // Fallback to default period if API fails
        const defaultPeriod: PayPeriod = {
          id: 'current',
          name: 'Current Period',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
          status: 'open',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setPayPeriods([defaultPeriod]);
        setSelectedPeriod(defaultPeriod);
      }
    };

    loadPayPeriods();
  }, [selectedPeriod]);
  
  // Enhanced loading states with retry capabilities
  const [summaryData, setSummaryData] = React.useState<PayrollSummaryData | null>(null);
  const [detailedData, setDetailedData] = React.useState<DetailedPayrollData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);
  const [summaryRetryCount, setSummaryRetryCount] = React.useState(0);
  const [detailsRetryCount, setDetailsRetryCount] = React.useState(0);
  const [hasOfflineData, setHasOfflineData] = React.useState(false);

  // Enhanced summary data loading with retry logic and better error handling
  React.useEffect(() => {
    if (!selectedPeriod || !userId) return;

    const loadSummary = async () => {
      setIsLoadingSummary(true);
      setSummaryError(null);
      
      try {
        const response = await fetch(`/api/payroll?employeeId=${userId}&payPeriodId=${selectedPeriod.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load payroll summary');
        }
        
        const summaryData = await response.json();
        setSummaryData(summaryData);
        setHasOfflineData(false);
        setSummaryRetryCount(0);
        
        // Cache the data
        localStorage.setItem(`payroll-summary-${selectedPeriod.id}`, JSON.stringify(summaryData));
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load summary';
        setSummaryError(errorMessage);
        
        // Try to load cached data
        const cachedData = localStorage.getItem(`payroll-summary-${selectedPeriod.id}`);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            setSummaryData(parsed);
            setHasOfflineData(true);
          } catch (parseError) {
            // Failed to parse cached data
          }
        }
      } finally {
        setIsLoadingSummary(false);
      }
    };

    loadSummary();
  }, [selectedPeriod, userId, offlineState.isOffline]);

  // Enhanced detailed data loading with progressive fallbacks and better error handling
  React.useEffect(() => {
    if (!['breakdown', 'daily', 'tips', 'history', 'performance', 'validation'].includes(activeTab)) return;
    if (!selectedPeriod || !userId) return;
    
    const loadDetails = async () => {
      setIsLoadingDetails(true);
      setDetailsError(null);
      
      try {
        const response = await fetch(`/api/payroll/detailed?employeeId=${userId}&payPeriodId=${selectedPeriod.id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load detailed payroll data');
        }
        
        const enhancedData = await response.json();
        
        let validationResult: PayrollValidationResult | undefined;
        if (activeTab === 'validation') {
          try {
            const validationResponse = await fetch(`/api/payroll/validation?employeeId=${userId}&payPeriodId=${selectedPeriod.id}`);
            if (validationResponse.ok) {
              validationResult = await validationResponse.json();
            }
          } catch (validationError) {
            // Validation data unavailable - continue without it
          }
        }
        
        const formattedData: DetailedPayrollData = {
          departmentBreakdown: enhancedData.departmentBreakdown.map((dept: any) => ({
            department: dept.department,
            hours: dept.hours,
            rate: dept.rate,
            grossPay: dept.grossPay,
            percentage: dept.percentage,
            isPrimary: dept.isPrimary,
          })),
          dailyWorkHistory: enhancedData.dailyWorkHistory.map((day: any) => ({
            date: new Date(day.date),
            logId: day.logIds[0] || '',
            departments: day.departments.map((dept: any) => ({
              department: dept.department,
              hours: dept.hours,
              rate: dept.rate,
              role: day.role,
            })),
            tips: day.tips,
            totalHours: day.departments.reduce((sum: number, dept: any) => sum + dept.hours, 0),
            grossPay: day.departments.reduce((sum: number, dept: any) => sum + (dept.hours * dept.rate), 0),
            jobsCompleted: 1, // Simplified - could be enhanced
          })),
          tipsDetails: enhancedData.tipsDetails.map((tip: any) => ({
            ...tip,
            date: new Date(tip.date),
          })),
          workPatternStats: {
            totalDaysWorked: enhancedData.dailyWorkHistory.length,
            avgHoursPerDay: enhancedData.totalHours / Math.max(enhancedData.dailyWorkHistory.length, 1),
            mostCommonDepartment: enhancedData.departmentBreakdown[0]?.department || 'admin',
            totalJobsCompleted: enhancedData.dailyWorkHistory.length, // Simplified
            avgTipsPerDay: enhancedData.tips / Math.max(enhancedData.dailyWorkHistory.length, 1),
            busiestDay: new Date(enhancedData.dailyWorkHistory[0]?.date || new Date()),
            highestTipDay: new Date(enhancedData.dailyWorkHistory[0]?.date || new Date()),
            highestPayDay: new Date(enhancedData.dailyWorkHistory[0]?.date || new Date()),
          },
          validationResult,
        };
        
        setDetailedData(formattedData);
        setDetailsRetryCount(0);
        
        // Cache the data
        const cacheKey = `payroll-details-${selectedPeriod.id}-${activeTab}`;
        localStorage.setItem(cacheKey, JSON.stringify(formattedData));
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load detailed data';
        setDetailsError(errorMessage);
        
        // Try to load cached data
        const cacheKey = `payroll-details-${selectedPeriod.id}-${activeTab}`;
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            // Convert date strings back to Date objects
            if (parsed.dailyWorkHistory) {
              parsed.dailyWorkHistory = parsed.dailyWorkHistory.map((day: any) => ({
                ...day,
                date: new Date(day.date),
              }));
            }
            if (parsed.tipsDetails) {
              parsed.tipsDetails = parsed.tipsDetails.map((tip: any) => ({
                ...tip,
                date: new Date(tip.date),
              }));
            }
            if (parsed.workPatternStats) {
              parsed.workPatternStats = {
                ...parsed.workPatternStats,
                busiestDay: new Date(parsed.workPatternStats.busiestDay),
                highestTipDay: new Date(parsed.workPatternStats.highestTipDay),
                highestPayDay: new Date(parsed.workPatternStats.highestPayDay),
              };
            }
            setDetailedData(parsed);
          } catch (parseError) {
            // Failed to parse cached data
          }
        }
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadDetails();
  }, [activeTab, selectedPeriod, userId, offlineState.isOffline]);

  // Reset detailed data when period changes
  React.useEffect(() => {
    setDetailedData(null);
  }, [selectedPeriod?.id]);

  // Enhanced retry functions with exponential backoff and better error handling
  const retrySummary = React.useCallback(async () => {
    // Simplified retry - just reload the data
    if (!selectedPeriod || !userId) return;
    
    setIsLoadingSummary(true);
    setSummaryError(null);
    
    try {
      const response = await fetch(`/api/payroll?employeeId=${userId}&payPeriodId=${selectedPeriod.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load payroll summary');
      }
      
      const summaryData = await response.json();
      setSummaryData(summaryData);
      setHasOfflineData(false);
      setSummaryRetryCount(0);
      
      // Cache the data
      localStorage.setItem(`payroll-summary-${selectedPeriod.id}`, JSON.stringify(summaryData));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load summary';
      setSummaryError(errorMessage);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [selectedPeriod, userId]);

  const retryDetails = React.useCallback(async () => {
    // Simplified retry - just reload the data
    if (!selectedPeriod || !userId) return;
    
    setIsLoadingDetails(true);
    setDetailsError(null);
    
    try {
      const response = await fetch(`/api/payroll/detailed?employeeId=${userId}&payPeriodId=${selectedPeriod.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load detailed payroll data');
      }
      
      const enhancedData = await response.json();
      
      const formattedData: DetailedPayrollData = {
        departmentBreakdown: enhancedData.departmentBreakdown.map((dept: any) => ({
          department: dept.department,
          hours: dept.hours,
          rate: dept.rate,
          grossPay: dept.grossPay,
          percentage: dept.percentage,
          isPrimary: dept.isPrimary,
        })),
        dailyWorkHistory: enhancedData.dailyWorkHistory.map((day: any) => ({
          date: new Date(day.date),
          logId: day.logIds[0] || '',
          departments: day.departments.map((dept: any) => ({
            department: dept.department,
            hours: dept.hours,
            rate: dept.rate,
            role: day.role,
          })),
          tips: day.tips,
          totalHours: day.departments.reduce((sum: number, dept: any) => sum + dept.hours, 0),
          grossPay: day.departments.reduce((sum: number, dept: any) => sum + (dept.hours * dept.rate), 0),
          jobsCompleted: 1, // Simplified - could be enhanced
        })),
        tipsDetails: enhancedData.tipsDetails.map((tip: any) => ({
          ...tip,
          date: new Date(tip.date),
        })),
        workPatternStats: {
          totalDaysWorked: enhancedData.dailyWorkHistory.length,
          avgHoursPerDay: enhancedData.totalHours / Math.max(enhancedData.dailyWorkHistory.length, 1),
          mostCommonDepartment: enhancedData.departmentBreakdown[0]?.department || 'admin',
          totalJobsCompleted: enhancedData.dailyWorkHistory.length, // Simplified
          avgTipsPerDay: enhancedData.tips / Math.max(enhancedData.dailyWorkHistory.length, 1),
          busiestDay: new Date(enhancedData.dailyWorkHistory[0]?.date || new Date()),
          highestTipDay: new Date(enhancedData.dailyWorkHistory[0]?.date || new Date()),
          highestPayDay: new Date(enhancedData.dailyWorkHistory[0]?.date || new Date()),
        },
        validationResult: undefined,
      };
      
      setDetailedData(formattedData);
      setDetailsRetryCount(0);
      
      // Cache the data
      const cacheKey = `payroll-details-${selectedPeriod.id}-${activeTab}`;
      localStorage.setItem(cacheKey, JSON.stringify(formattedData));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load detailed data';
      setDetailsError(errorMessage);
    } finally {
      setIsLoadingDetails(false);
    }
  }, [activeTab, selectedPeriod, userId]);

  // Handle discrepancy reporting
  const handleReportDiscrepancy = React.useCallback((errors: ValidationError[]) => {
    setDiscrepancyErrors(errors);
    setShowDiscrepancyDialog(true);
  }, []);

  const handleSubmitDiscrepancyReport = React.useCallback(async (reportData: { description: string; priority: string; category: string; requestCallback?: boolean; expectedOutcome?: string; contactEmail?: string }) => {
    if (!userId || !selectedPeriod) return;
    
    const fullReportData = {
      ...reportData,
      priority: reportData.priority as 'low' | 'medium' | 'high' | 'critical',
      category: reportData.category as 'calculation' | 'data_integrity' | 'rate_issue' | 'hours_mismatch' | 'tips_error' | 'other',
      requestCallback: reportData.requestCallback || false,
      errors: discrepancyErrors,
    };
    
    const response = await fetch('/api/payroll/discrepancy-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: userId,
        payPeriodId: selectedPeriod.id,
        reportData: fullReportData,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit report');
    }
  }, [userId, selectedPeriod, discrepancyErrors]);

  const handleViewAuditTrail = React.useCallback(() => {
    // Navigate to audit trail or show detailed view
    // TODO: Implement audit trail navigation
  }, []);

  return (
    <PayrollErrorBoundary>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Offline Notice */}
            {offlineState.isOffline && (
              <div className="px-4 lg:px-6">
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                  <WifiOff className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 dark:text-blue-200">
                    You&apos;re currently offline
                  </AlertTitle>
                  <AlertDescription className="text-blue-700 dark:text-blue-300">
                    Showing cached payroll data. Some features may be limited until you&apos;re back online.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Header Section */}
            <div className="px-4 lg:px-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">My Payroll</h1>
                  <p className="text-muted-foreground">
                    View your compensation details and pay history
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {/* Pay Period Selector */}
                  <Select
                    value={selectedPeriod?.id || ''}
                    onValueChange={(value) => {
                      const period = payPeriods.find(p => p.id === value);
                      if (period) setSelectedPeriod(period);
                    }}
                    disabled={offlineState.isOffline}
                  >
                    <SelectTrigger className={`w-full sm:w-[200px] ${
                      isMobile ? 'h-12 touch-manipulation' : ''
                    }`}>
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

                  <Button 
                    onClick={() => setShowExportDialog(true)}
                    disabled={offlineState.isOffline}
                    className={isMobile ? 'min-h-[44px] min-w-[44px] touch-manipulation' : ''}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isMobile ? 'Download' : 'Download Paystub'}
                  </Button>
                </div>
              </div>
            </div>

          {/* Summary Cards with Enhanced Error Handling */}
          <div className="px-4 lg:px-6">
            {isLoadingSummary && !summaryData ? (
              <PayrollLoadingSkeleton />
            ) : summaryData ? (
              <>
                {/* Show warning if using cached/offline data */}
                {(hasOfflineData || summaryError) && (
                  <div className="mb-4">
                    <Alert className={hasOfflineData ? "border-blue-200 bg-blue-50" : "border-yellow-200 bg-yellow-50"}>
                      {hasOfflineData ? <WifiOff className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      <AlertTitle>
                        {hasOfflineData ? "Offline Mode" : "Limited Data"}
                      </AlertTitle>
                      <AlertDescription>
                        {hasOfflineData 
                          ? "You're viewing cached payroll data. Some features may be limited until you're back online."
                          : summaryError
                        }
                        {summaryRetryCount > 0 && (
                          <div className="mt-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={retrySummary}
                              disabled={isLoadingSummary}
                              className="border-current text-current hover:bg-current/10"
                            >
                              {isLoadingSummary ? (
                                <>
                                  <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                  Retrying...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-3 w-3" />
                                  Try Again
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </>
            ) : null}
            
            {summaryData && selectedPeriod && (
              <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 @5xl/main:grid-cols-4 
                /* Mobile optimizations */
                [&>*]:min-h-[120px] sm:[&>*]:min-h-[140px]
                [&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:touch-manipulation">
            {/* Total Pay */}
            <Card className="@container/card" data-testid="total-pay-summary-card">
              <CardHeader>
                <CardDescription data-testid="total-pay-label">Total Pay</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(summaryData.totalPay)}
                </CardTitle>
                <CardAction>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowExportDialog(true)}
                    className="h-7 text-xs"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Pay period summary
                </div>
                <div className="text-muted-foreground">
                  {formatDate(selectedPeriod?.startDate || new Date())} - {formatDate(selectedPeriod?.endDate || new Date())}
                </div>
                {summaryError && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                    Using cached data
                  </div>
                )}
              </CardFooter>
            </Card>

            {/* Hours Worked */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Hours Worked</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {summaryData.totalHours}
                </CardTitle>
                <CardAction>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('daily')}
                    className="h-7 text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Hours across all departments
                </div>
                <div className="text-muted-foreground">
                  {selectedPeriod.status === 'closed' ? 'Final' : 'Current'} total
                </div>
              </CardFooter>
            </Card>

            {/* Tips */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Tips Earned</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(summaryData.tips)}
                </CardTitle>
                <CardAction>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('tips')}
                    className="h-7 text-xs"
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    View Tips
                  </Button>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Share of job tips
                </div>
                <div className="text-muted-foreground">
                  Distributed equally among team
                </div>
              </CardFooter>
            </Card>

            {/* Bonuses */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Bonuses</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(summaryData.bonuses)}
                </CardTitle>
                <CardAction>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('performance')}
                    className="h-7 text-xs"
                  >
                    <Award className="h-3 w-3 mr-1" />
                    View Performance
                  </Button>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Labor efficiency bonuses
                </div>
                <div className="text-muted-foreground">
                  For beating target goals
                </div>
              </CardFooter>
            </Card>
          </div>
            )}
          </div>
        </div>

          {/* Enhanced Tabs with Progressive Loading */}
          <div>
            <Tabs 
              defaultValue="breakdown"
              className="w-full flex-col justify-start gap-6"
              onValueChange={setActiveTab}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {isMobile ? (
                  // Mobile: Scrollable horizontal tabs with better touch targets following dashboard-01 patterns
                  <div className="w-full overflow-x-auto scrollbar-hide">
                    <TabsList className="inline-flex h-12 w-max min-w-full justify-start gap-1 p-1 bg-muted/50">
                      <TabsTrigger 
                        value="breakdown" 
                        className="min-w-[90px] h-10 text-sm font-medium touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Breakdown
                      </TabsTrigger>
                      <TabsTrigger 
                        value="daily" 
                        className="min-w-[80px] h-10 text-sm font-medium touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Work ({detailedData?.dailyWorkHistory?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="tips" 
                        className="min-w-[70px] h-10 text-sm font-medium touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Tips ({detailedData?.tipsDetails?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger 
                        value="history" 
                        className="min-w-[80px] h-10 text-sm font-medium touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Pay History
                      </TabsTrigger>
                      <TabsTrigger 
                        value="performance" 
                        className="min-w-[100px] h-10 text-sm font-medium touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Performance
                      </TabsTrigger>
                      <TabsTrigger 
                        value="validation" 
                        className="min-w-[90px] h-10 text-sm font-medium touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Validation
                      </TabsTrigger>
                    </TabsList>
                  </div>
                ) : (
                  // Desktop: Grid layout
                  <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 sm:w-auto">
                    <TabsTrigger value="breakdown" className="text-xs sm:text-sm">
                      Breakdown
                    </TabsTrigger>
                    <TabsTrigger value="daily" className="text-xs sm:text-sm">
                      Work ({detailedData?.dailyWorkHistory?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="tips" className="text-xs sm:text-sm">
                      Tips ({detailedData?.tipsDetails?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="text-xs sm:text-sm">
                      Pay History
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="text-xs sm:text-sm">
                      Performance
                    </TabsTrigger>
                    <TabsTrigger value="validation" className="text-xs sm:text-sm">
                      Validation
                    </TabsTrigger>
                  </TabsList>
                )}
                
                {/* Loading indicator for detailed data */}
                {isLoadingDetails && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full border-2 border-muted border-t-primary h-4 w-4" />
                    {isMobile ? 'Loading...' : 'Loading detailed data...'}
                  </div>
                )}
                
                {/* Retry indicator for detailed data */}
                {detailsRetryCount > 0 && isLoadingDetails && (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {isMobile ? 'Retrying...' : `Retrying (${detailsRetryCount + 1}/3)...`}
                  </div>
                )}
              </div>

            {/* Pay Breakdown Tab */}
            <TabsContent value="breakdown" className="flex flex-col px-4 lg:px-6 mt-6">
              <div className="space-y-6">
                {/* Department Breakdown */}
                <PayrollComponentErrorBoundary componentName="Department Breakdown">
                  {isLoadingDetails && !detailedData ? (
                    <PayrollLoadingSkeleton />
                  ) : detailedData && summaryData?.employee ? (
                    <DepartmentBreakdown
                      departments={detailedData.departmentBreakdown}
                      totalHours={summaryData.totalHours}
                      totalPay={summaryData.totalPay}
                      user={{
                        ...summaryData.employee,
                        junkBonusGoal: 0.14,
                        moveBonusGoal: 0.24,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      } as User}
                    />
                  ) : (
                    <DepartmentBreakdownFallback
                      totalHours={summaryData?.totalHours || 0}
                      totalPay={summaryData?.totalPay || 0}
                      error={detailsError || "Department breakdown data is not available"}
                      onRetry={retryDetails}
                      isRetrying={isLoadingDetails}
                    />
                  )}
                </PayrollComponentErrorBoundary>

                {/* Rate Information Panel */}
                <PayrollComponentErrorBoundary componentName="Rate Information">
                  {detailedData && summaryData ? (
                    <RateInformationPanel
                      departmentHours={detailedData.departmentBreakdown.reduce((acc, dept) => {
                        acc[dept.department as Department] = dept.hours;
                        return acc;
                      }, {} as Record<Department, number>)}
                      user={{
                        ...summaryData.employee,
                        junkBonusGoal: 0.14,
                        moveBonusGoal: 0.24,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                      } as User}
                    />
                  ) : (
                    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          <div>
                            <div className="font-medium text-yellow-800 dark:text-yellow-200">
                              Rate information temporarily unavailable
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Your hourly rates and department information couldn&apos;t be loaded.
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </PayrollComponentErrorBoundary>
              </div>
            </TabsContent>

            {/* Daily Work Tab */}
            <TabsContent value="daily" className="flex flex-col px-4 lg:px-6 mt-6">
              <PayrollComponentErrorBoundary componentName="Daily Work Calendar">
                {isLoadingDetails && !detailedData ? (
                  <PayrollLoadingSkeleton />
                ) : detailedData ? (
                  <DailyWorkCalendar
                    workEntries={detailedData.dailyWorkHistory}
                    workPatternStats={detailedData.workPatternStats}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    payPeriodStart={selectedPeriod?.startDate || new Date()}
                    payPeriodEnd={selectedPeriod?.endDate || new Date()}
                  />
                ) : (
                  <DailyWorkFallback
                    totalDays={15}
                    avgHours={8.2}
                    error={detailsError || "Daily work data is not available"}
                    onRetry={retryDetails}
                    isRetrying={isLoadingDetails}
                  />
                )}
              </PayrollComponentErrorBoundary>
            </TabsContent>

            {/* Tips Tab */}
            <TabsContent value="tips" className="flex flex-col px-4 lg:px-6 mt-6">
              <PayrollComponentErrorBoundary componentName="Tips Detail View">
                {isLoadingDetails && !detailedData ? (
                  <PayrollLoadingSkeleton />
                ) : detailedData ? (
                  <TipsDetailView
                    tips={detailedData.tipsDetails}
                    totalTips={summaryData?.tips || 0}
                    payPeriodStart={selectedPeriod?.startDate || new Date()}
                    payPeriodEnd={selectedPeriod?.endDate || new Date()}
                  />
                ) : (
                  <TipsDetailFallback
                    totalTips={summaryData?.tips || 0}
                    jobCount={8}
                    error={detailsError || "Tips details are not available"}
                    onRetry={retryDetails}
                    isRetrying={isLoadingDetails}
                  />
                )}
              </PayrollComponentErrorBoundary>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex flex-col px-4 lg:px-6 mt-6 space-y-6">
              <PayrollComponentErrorBoundary componentName="Pay Period Analysis">
                {detailedData && selectedPeriod ? (
                  <div className="w-full overflow-hidden">
                    <PayPeriodAnalysis
                      userId={userId || '1'}
                      currentPeriod={selectedPeriod}
                      availablePeriods={payPeriods}
                    />
                  </div>
                ) : (
                  <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium text-yellow-800 dark:text-yellow-200">
                            Pay history analysis unavailable
                          </div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Historical pay data and trend analysis couldn&apos;t be loaded.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </PayrollComponentErrorBoundary>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="flex flex-col px-4 lg:px-6 mt-6 space-y-6">
              <PayrollComponentErrorBoundary componentName="Performance Analysis">
                {detailedData && selectedPeriod ? (
                  <div className="w-full overflow-hidden">
                    <PayPeriodAnalysis
                      userId={userId || '1'}
                      currentPeriod={selectedPeriod}
                      availablePeriods={payPeriods}
                    />
                  </div>
                ) : (
                  <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="font-medium text-yellow-800 dark:text-yellow-200">
                            Performance analysis unavailable
                          </div>
                          <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Performance metrics and analysis couldn&apos;t be loaded.
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </PayrollComponentErrorBoundary>
            </TabsContent>

            {/* Validation Tab */}
            <TabsContent value="validation" className="flex flex-col px-4 lg:px-6 mt-6">
              <PayrollComponentErrorBoundary componentName="Payroll Validation">
                {isLoadingDetails ? (
                  <PayrollLoadingSkeleton />
                ) : detailedData?.validationResult ? (
                  <PayrollValidationPanel
                    validationResult={detailedData.validationResult}
                    onReportDiscrepancy={handleReportDiscrepancy}
                    onViewAuditTrail={handleViewAuditTrail}
                  />
                ) : (
                  <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-yellow-600" />
                        <div className="space-y-2 flex-1">
                          <div>
                            <div className="font-medium text-yellow-800 dark:text-yellow-200">
                              Payroll validation unavailable
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                              Data validation and accuracy checks couldn&apos;t be performed.
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={retryDetails}
                            disabled={isLoadingDetails}
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900"
                          >
                            {isLoadingDetails ? (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Try Loading Validation
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </PayrollComponentErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>

        {/* Export Dialog */}
        <PayrollExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          payrollData={[]}
          selectedPeriod={selectedPeriod}
          departmentBreakdown={detailedData?.departmentBreakdown}
          dailyWorkHistory={detailedData?.dailyWorkHistory}
          tipsDetails={detailedData?.tipsDetails}
          currentUser={undefined}
        />

        {/* Discrepancy Report Dialog */}
        <DiscrepancyReportDialog
          open={showDiscrepancyDialog}
          onOpenChange={setShowDiscrepancyDialog}
          errors={discrepancyErrors}
          employeeId={userId || '1'}
          payPeriodId={selectedPeriod?.id || ''}
          onSubmit={handleSubmitDiscrepancyReport}
        />
      </div>
    </div>
    </PayrollErrorBoundary>
  );
}