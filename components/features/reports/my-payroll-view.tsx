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
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  AlertTriangle,

  Shield,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, formatDate, calculateTrend } from '@/lib/formatters';
import type { PayPeriod, User, Department } from '@/types';
import type { PayrollCalculation } from '@/lib/payCalculator';
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
import type { DailyWorkEntry, WorkPatternStats } from '@/lib/actions/daily-work';
import type { TipEntry } from '@/lib/payCalculator';
import type { PayrollValidationResult, ValidationError } from '@/lib/payrollValidation';
import { validateEmployeePayroll, submitDiscrepancyReport } from '@/lib/actions/payroll-validation';
// import { getPayrollSummary, getCachedDetailedPayrollBreakdown } from '@/lib/actions/payroll';
// import { getDailyWorkBreakdown } from '@/lib/actions/daily-work';

// Mock data for current user - replace with actual user data
const mockUser: User = {
  id: '1',
  fullName: 'John Smith',
  email: 'john@example.com',
  roles: ['captain'],
  rateJunkCaptain: 20,
  rateJunkWingman: 16,
  rateMoveCaptain: 22,
  rateMoveWingman: 18,
  rateZigma: 19,
  rateTraining: 15,
  rateEstimating: 25,
  rateWarehouse: 17,
  rateAdmin: 14,
  junkBonusGoal: 0.14,
  moveBonusGoal: 0.24,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserPayroll: PayrollCalculation = {
  employeeId: '1',
  employee: mockUser,
  totalHours: 40,
  hoursByDepartment: { junk: 30, move: 8, zigma: 2, training: 0, estimating: 0, warehouse: 0, admin: 0 },
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
};

// Mock department breakdown data
const mockDepartmentBreakdown: DepartmentBreakdownData[] = [
  {
    department: 'junk',
    hours: 30,
    rate: 20, // Captain rate
    grossPay: 600,
    percentage: 75,
    isPrimary: true,
  },
  {
    department: 'move',
    hours: 8,
    rate: 18, // Wingman rate
    grossPay: 144,
    percentage: 20,
    isPrimary: false,
  },
  {
    department: 'zigma',
    hours: 2,
    rate: 19,
    grossPay: 38,
    percentage: 5,
    isPrimary: false,
  },
];

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
  {
    id: '3',
    name: 'December 2024 - Week 4',
    startDate: new Date('2024-12-23'),
    endDate: new Date('2024-12-29'),
    status: 'closed',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock historical data for trends
const mockHistoricalData = [
  { period: 'Dec Week 4', totalPay: 890, hours: 38, tips: 120 },
  { period: 'Jan Week 1', totalPay: 955, hours: 40, tips: 150 },
  { period: 'Jan Week 2', totalPay: 1020, hours: 42, tips: 180 },
];

// Mock daily work entries for calendar
const mockDailyWorkEntries: DailyWorkEntry[] = [
  {
    date: new Date('2025-01-02'),
    logId: 'log-1',
    departments: [
      { department: 'junk', hours: 6, rate: 20, role: 'captain' },
      { department: 'move', hours: 2, rate: 18, role: 'wingman' },
    ],
    tips: 45,
    totalHours: 8,
    grossPay: 156,
    jobsCompleted: 3,
  },
  {
    date: new Date('2025-01-03'),
    logId: 'log-2',
    departments: [
      { department: 'junk', hours: 8, rate: 20, role: 'captain' },
    ],
    tips: 60,
    totalHours: 8,
    grossPay: 160,
    jobsCompleted: 4,
  },
  {
    date: new Date('2025-01-06'),
    logId: 'log-3',
    departments: [
      { department: 'move', hours: 6, rate: 22, role: 'captain' },
      { department: 'zigma', hours: 2, rate: 19, role: 'wingman' },
    ],
    tips: 35,
    totalHours: 8,
    grossPay: 170,
    jobsCompleted: 2,
  },
];

// Mock work pattern stats
const mockWorkPatternStats: WorkPatternStats = {
  totalDaysWorked: 15,
  avgHoursPerDay: 8.2,
  mostCommonDepartment: 'junk',
  totalJobsCompleted: 45,
  avgTipsPerDay: 42.5,
  busiestDay: new Date('2025-01-03'),
  highestTipDay: new Date('2025-01-03'),
  highestPayDay: new Date('2025-01-06'),
};

// Mock tips breakdown data
const mockTipsBreakdown: TipEntry[] = [
  {
    date: new Date('2025-01-02'),
    jobId: 'J2025-001',
    clientName: 'Smith Residence',
    totalJobTips: 80,
    teamMembers: 4,
    myShare: 20,
    jobType: 'junk',
    logId: 'log-1',
  },
  {
    date: new Date('2025-01-02'),
    jobId: 'J2025-002',
    clientName: 'Downtown Office',
    totalJobTips: 60,
    teamMembers: 3,
    myShare: 20,
    jobType: 'junk',
    logId: 'log-1',
  },
  {
    date: new Date('2025-01-03'),
    jobId: 'J2025-003',
    clientName: 'Johnson Family',
    totalJobTips: 100,
    teamMembers: 4,
    myShare: 25,
    jobType: 'junk',
    logId: 'log-2',
  },
  {
    date: new Date('2025-01-03'),
    jobId: 'J2025-004',
    clientName: 'Corporate Move',
    totalJobTips: 120,
    teamMembers: 4,
    myShare: 30,
    jobType: 'junk',
    logId: 'log-2',
  },
  {
    date: new Date('2025-01-06'),
    jobId: 'M2025-001',
    clientName: 'Miller Apartment',
    totalJobTips: 40,
    teamMembers: 2,
    myShare: 20,
    jobType: 'move',
    logId: 'log-3',
  },
  {
    date: new Date('2025-01-06'),
    jobId: 'J2025-005',
    clientName: 'Wilson House',
    totalJobTips: 30,
    teamMembers: 2,
    myShare: 15,
    jobType: 'junk',
    logId: 'log-3',
  },
  {
    date: new Date('2025-01-07'),
    jobId: 'M2025-002',
    clientName: 'Davis Relocation',
    totalJobTips: 90,
    teamMembers: 3,
    myShare: 30,
    jobType: 'move',
    logId: 'log-4',
  },
];

interface MyPayrollViewProps {
  userId?: string;
  initialPayPeriod?: PayPeriod;
}

interface PayrollSummaryData {
  employeeId: string;
  employee: User;
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
  const [selectedPeriod, setSelectedPeriod] = React.useState<PayPeriod>(initialPayPeriod || mockPayPeriods[0]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const [activeTab, setActiveTab] = React.useState('breakdown');
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [showDiscrepancyDialog, setShowDiscrepancyDialog] = React.useState(false);
  const [discrepancyErrors, setDiscrepancyErrors] = React.useState<ValidationError[]>([]);
  
  // Use mock data for now - in real implementation, this would be replaced with actual API calls
  const userPayroll = mockUserPayroll;
  const trend = calculateTrend(userPayroll.totalPay, mockHistoricalData[0].totalPay);
  
  // Enhanced loading states with retry capabilities
  const [summaryData, setSummaryData] = React.useState<PayrollSummaryData | null>(() => {
    // Initialize with mock data to ensure UI renders immediately
    return {
      employeeId: userPayroll.employeeId,
      employee: userPayroll.employee,
      payPeriod: selectedPeriod,
      totalHours: userPayroll.totalHours,
      totalPay: userPayroll.totalPay,
      grossWages: userPayroll.grossWages,
      tips: userPayroll.tips,
      commission: userPayroll.commission,
      bonuses: userPayroll.bonuses,
    };
  });
  const [detailedData, setDetailedData] = React.useState<DetailedPayrollData | null>(() => {
    // Initialize with mock data to ensure tabs render immediately
    return {
      departmentBreakdown: mockDepartmentBreakdown || [],
      dailyWorkHistory: mockDailyWorkEntries || [],
      tipsDetails: mockTipsBreakdown || [],
      workPatternStats: mockWorkPatternStats,
      validationResult: undefined,
    };
  });
  const [isLoadingSummary, setIsLoadingSummary] = React.useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState<string | null>(null);
  const [detailsError, setDetailsError] = React.useState<string | null>(null);
  const [summaryRetryCount, setSummaryRetryCount] = React.useState(0);
  const [detailsRetryCount, setDetailsRetryCount] = React.useState(0);
  const [hasOfflineData, setHasOfflineData] = React.useState(false);

  // Enhanced summary data loading with retry logic and better error handling
  React.useEffect(() => {
    const loadSummary = async () => {
      setIsLoadingSummary(true);
      setSummaryError(null);
      
      try {
        // For testing, always use mock data successfully
        const summaryResult = {
          employeeId: userPayroll.employeeId,
          employee: userPayroll.employee,
          payPeriod: selectedPeriod,
          totalHours: userPayroll.totalHours,
          totalPay: userPayroll.totalPay,
          grossWages: userPayroll.grossWages,
          tips: userPayroll.tips,
          commission: userPayroll.commission,
          bonuses: userPayroll.bonuses,
        };
        
        setSummaryData(summaryResult);
        setHasOfflineData(false);
        setSummaryRetryCount(0);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load summary';
        console.error('Summary loading error:', error);
        
        // Always provide fallback data to ensure UI renders
        const fallbackSummary = {
          employeeId: userPayroll.employeeId,
          employee: userPayroll.employee,
          payPeriod: selectedPeriod,
          totalHours: userPayroll.totalHours,
          totalPay: userPayroll.totalPay,
          grossWages: userPayroll.grossWages,
          tips: userPayroll.tips,
          commission: userPayroll.commission,
          bonuses: userPayroll.bonuses,
        };
        setSummaryData(fallbackSummary);
        setSummaryError(errorMessage);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    loadSummary();
  }, [selectedPeriod, offlineState.isOffline, userPayroll.employeeId, userPayroll.employee, userPayroll.totalHours, userPayroll.totalPay, userPayroll.grossWages, userPayroll.tips, userPayroll.commission, userPayroll.bonuses]);

  // Enhanced detailed data loading with progressive fallbacks and better error handling
  React.useEffect(() => {
    if (!['breakdown', 'daily', 'tips', 'history', 'performance', 'validation'].includes(activeTab)) return;
    
    const loadDetails = async () => {
      setIsLoadingDetails(true);
      setDetailsError(null);
      
      try {
        // For testing, always use mock data successfully
        let validationResult: PayrollValidationResult | undefined;
        if (activeTab === 'validation' && userId) {
          try {
            const validationResponse = await validateEmployeePayroll(userId, selectedPeriod.id);
            if (validationResponse.success) {
              validationResult = validationResponse.data;
            }
          } catch (validationError) {
            console.warn('Validation data unavailable:', validationError);
            // Continue without validation data rather than failing entirely
          }
        }
        
        const detailsResult = {
          departmentBreakdown: mockDepartmentBreakdown || [],
          dailyWorkHistory: mockDailyWorkEntries || [],
          tipsDetails: mockTipsBreakdown || [],
          workPatternStats: mockWorkPatternStats,
          validationResult,
        };
        
        setDetailedData(detailsResult);
        setDetailsRetryCount(0);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load detailed data';
        console.error('Details loading error:', error);
        
        // Always provide fallback data to ensure UI renders
        const fallbackDetails = {
          departmentBreakdown: mockDepartmentBreakdown || [],
          dailyWorkHistory: mockDailyWorkEntries || [],
          tipsDetails: mockTipsBreakdown || [],
          workPatternStats: mockWorkPatternStats,
          validationResult: undefined,
        };
        setDetailedData(fallbackDetails);
        setDetailsError(errorMessage);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    loadDetails();
  }, [activeTab, selectedPeriod.id, userId, offlineState.isOffline]);

  // Reset detailed data when period changes
  React.useEffect(() => {
    setDetailedData(null);
  }, [selectedPeriod.id]);

  // Enhanced retry functions with exponential backoff and better error handling
  const retrySummary = React.useCallback(async () => {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      setIsLoadingSummary(true);
      setSummaryError(null);
      setSummaryRetryCount(attempt);
      
      try {
        // Exponential backoff delay with jitter to prevent thundering herd
        if (attempt > 0) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 0.1 * delay; // Add up to 10% jitter
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
        
        // Check if we're still offline before attempting
        if (offlineState.isOffline && attempt > 0) {
          throw new Error('Still offline, cannot retry');
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const summaryResult = {
          employeeId: userPayroll.employeeId,
          employee: userPayroll.employee,
          payPeriod: selectedPeriod,
          totalHours: userPayroll.totalHours,
          totalPay: userPayroll.totalPay,
          grossWages: userPayroll.grossWages,
          tips: userPayroll.tips,
          commission: userPayroll.commission,
          bonuses: userPayroll.bonuses,
        };
        
        setSummaryData(summaryResult);
        setHasOfflineData(false);
        setSummaryRetryCount(0); // Reset on success
        
        // Cache successful result with timestamp
        const cacheData = {
          ...summaryResult,
          cachedAt: Date.now(),
        };
        localStorage.setItem(`payroll-summary-${selectedPeriod.id}`, JSON.stringify(cacheData));
        setIsLoadingSummary(false);
        return; // Success, exit retry loop
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load summary';
        console.error(`Summary retry attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries - 1) {
          // Final attempt failed, try cached data
          const cachedData = localStorage.getItem(`payroll-summary-${selectedPeriod.id}`);
          if (cachedData) {
            try {
              const parsed = JSON.parse(cachedData);
              setSummaryData(parsed);
              setHasOfflineData(true);
              setSummaryError(`${errorMessage} (showing cached data after ${maxRetries} attempts)`);
            } catch (parseError) {
              console.error('Failed to parse cached summary data:', parseError);
              setSummaryError(`${errorMessage} (cached data corrupted, no fallback available)`);
              localStorage.removeItem(`payroll-summary-${selectedPeriod.id}`);
            }
          } else {
            setSummaryError(`${errorMessage} (no cached data available after ${maxRetries} attempts)`);
          }
        }
      }
    }
    
    setIsLoadingSummary(false);
  }, [selectedPeriod, userPayroll, offlineState.isOffline]);

  const retryDetails = React.useCallback(async () => {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      setIsLoadingDetails(true);
      setDetailsError(null);
      setDetailsRetryCount(attempt);
      
      try {
        // Exponential backoff delay with jitter
        if (attempt > 0) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          const jitter = Math.random() * 0.1 * delay;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
        }
        
        // Check if we're still offline before attempting
        if (offlineState.isOffline && attempt > 0) {
          throw new Error('Still offline, cannot retry');
        }
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        let validationResult: PayrollValidationResult | undefined;
        if (activeTab === 'validation' && userId) {
          try {
            const validationResponse = await validateEmployeePayroll(userId, selectedPeriod.id);
            if (validationResponse.success) {
              validationResult = validationResponse.data;
            }
          } catch (validationError) {
            console.warn('Validation data unavailable during retry:', validationError);
            // Don't fail the entire retry for validation issues
          }
        }
        
        const detailsResult = {
          departmentBreakdown: mockDepartmentBreakdown,
          dailyWorkHistory: mockDailyWorkEntries,
          tipsDetails: mockTipsBreakdown,
          workPatternStats: mockWorkPatternStats,
          validationResult,
        };
        
        setDetailedData(detailsResult);
        setDetailsRetryCount(0); // Reset on success
        
        // Cache successful result with timestamp
        const cacheKey = `payroll-details-${selectedPeriod.id}-${activeTab}`;
        const cacheData = {
          ...detailsResult,
          cachedAt: Date.now(),
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        setIsLoadingDetails(false);
        return; // Success, exit retry loop
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load detailed data';
        console.error(`Details retry attempt ${attempt + 1} failed:`, error);
        
        if (attempt === maxRetries - 1) {
          // Final attempt failed, try cached data
          const cacheKey = `payroll-details-${selectedPeriod.id}-${activeTab}`;
          const cachedData = localStorage.getItem(cacheKey);
          if (cachedData) {
            try {
              const parsed = JSON.parse(cachedData);
              setDetailedData(parsed);
              setDetailsError(`${errorMessage} (showing cached data after ${maxRetries} attempts)`);
            } catch (parseError) {
              console.error('Failed to parse cached details data:', parseError);
              setDetailsError(`${errorMessage} (cached data corrupted, no fallback available)`);
              localStorage.removeItem(cacheKey);
            }
          } else {
            setDetailsError(`${errorMessage} (no cached data available after ${maxRetries} attempts)`);
          }
        }
      }
    }
    
    setIsLoadingDetails(false);
  }, [activeTab, selectedPeriod.id, userId, offlineState.isOffline]);

  // Handle discrepancy reporting
  const handleReportDiscrepancy = React.useCallback((errors: ValidationError[]) => {
    setDiscrepancyErrors(errors);
    setShowDiscrepancyDialog(true);
  }, []);

  const handleSubmitDiscrepancyReport = React.useCallback(async (reportData: { description: string; priority: string; category: string; requestCallback?: boolean; expectedOutcome?: string; contactEmail?: string }) => {
    if (!userId) return;
    
    const fullReportData = {
      ...reportData,
      priority: reportData.priority as 'low' | 'medium' | 'high' | 'critical',
      category: reportData.category as 'calculation' | 'data_integrity' | 'rate_issue' | 'hours_mismatch' | 'tips_error' | 'other',
      requestCallback: reportData.requestCallback || false,
      errors: discrepancyErrors,
    };
    
    const result = await submitDiscrepancyReport(userId, selectedPeriod.id, fullReportData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to submit report');
    }
  }, [userId, selectedPeriod.id, discrepancyErrors]);

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
                    value={selectedPeriod.id}
                    onValueChange={(value) => {
                      const period = mockPayPeriods.find(p => p.id === value);
                      if (period) setSelectedPeriod(period);
                    }}
                    disabled={offlineState.isOffline}
                  >
                    <SelectTrigger className={`w-full sm:w-[200px] ${
                      isMobile ? 'h-12 touch-manipulation' : ''
                    }`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPayPeriods.map((period) => (
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
            
            {summaryData && (
              <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs sm:grid-cols-2 @5xl/main:grid-cols-4 
                /* Mobile optimizations */
                [&>*]:min-h-[120px] sm:[&>*]:min-h-[140px]
                [&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:touch-manipulation">
            {/* Total Pay */}
            <Card className="@container/card" data-testid="total-pay-summary-card">
              <CardHeader>
                <CardDescription data-testid="total-pay-label">Total Pay</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(summaryData?.totalPay || userPayroll.totalPay)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {trend.isPositive ? '+' : ''}{trend.percentage.toFixed(1)}%
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  {trend.isPositive ? 'Increased' : 'Decreased'} from last period
                  {trend.isPositive ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                </div>
                <div className="text-muted-foreground">
                  {formatDate(selectedPeriod.startDate)} - {formatDate(selectedPeriod.endDate)}
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
                  {summaryData?.totalHours || userPayroll.totalHours}h
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3" />
                    Regular
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Total hours worked this period
                  <Clock className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Primary department: {Object.entries(userPayroll.hoursByDepartment)
                    .find(([, hours]) => hours > 0)?.[0] || 'admin'}
                </div>
                {summaryError && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                    Using cached data
                  </div>
                )}
              </CardFooter>
            </Card>

            {/* Tips Earned */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Tips Earned</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(summaryData?.tips || userPayroll.tips)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <DollarSign className="h-3 w-3" />
                    Performance
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Great customer service!
                  <Award className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Average per job: {formatCurrency((summaryData?.tips || userPayroll.tips) / 8)}
                </div>
                {(hasOfflineData || summaryError) && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                    {hasOfflineData ? 'Using cached data' : 'Limited data'}
                  </div>
                )}
              </CardFooter>
            </Card>

            {/* Bonuses */}
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Bonuses</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {formatCurrency(summaryData?.bonuses || userPayroll.bonuses)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Award className="h-3 w-3" />
                    Labor Bonus
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="line-clamp-1 flex gap-2 font-medium">
                  Efficiency bonus earned
                  <Award className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Performance bonus earned
                </div>
                {(hasOfflineData || summaryError) && (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                    {hasOfflineData ? 'Using cached data' : 'Limited data'}
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
          )}
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
                        Work
                      </TabsTrigger>
                      <TabsTrigger 
                        value="tips" 
                        className="min-w-[70px] h-10 text-sm font-medium touch-manipulation data-[state=active]:bg-background data-[state=active]:shadow-sm"
                      >
                        Tips
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
                      Work
                    </TabsTrigger>
                    <TabsTrigger value="tips" className="text-xs sm:text-sm">
                      Tips
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
            <TabsContent value="breakdown" className="flex flex-col px-4 lg:px-6">
              <div className="space-y-6">
                {/* Department Breakdown */}
                <PayrollComponentErrorBoundary componentName="Department Breakdown">
                  {isLoadingDetails && !detailedData ? (
                    <PayrollLoadingSkeleton />
                  ) : detailedData ? (
                    <DepartmentBreakdown
                      departments={detailedData.departmentBreakdown}
                      totalHours={summaryData?.totalHours || userPayroll.totalHours}
                      totalPay={summaryData?.totalPay || userPayroll.totalPay}
                      user={mockUser}
                    />
                  ) : (
                    <DepartmentBreakdownFallback
                      totalHours={summaryData?.totalHours || userPayroll.totalHours}
                      totalPay={summaryData?.totalPay || userPayroll.totalPay}
                      error={detailsError || "Department breakdown data is not available"}
                      onRetry={retryDetails}
                      isRetrying={isLoadingDetails}
                    />
                  )}
                </PayrollComponentErrorBoundary>

                {/* Rate Information Panel */}
                <PayrollComponentErrorBoundary componentName="Rate Information">
                  {detailedData ? (
                    <RateInformationPanel
                      departmentHours={detailedData.departmentBreakdown.reduce((acc, dept) => {
                        acc[dept.department as Department] = dept.hours;
                        return acc;
                      }, {} as Record<Department, number>)}
                      user={mockUser}
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
            <TabsContent value="daily" className="flex flex-col px-4 lg:px-6">
              <PayrollComponentErrorBoundary componentName="Daily Work Calendar">
                {isLoadingDetails && !detailedData ? (
                  <PayrollLoadingSkeleton />
                ) : detailedData ? (
                  <DailyWorkCalendar
                    workEntries={detailedData.dailyWorkHistory}
                    workPatternStats={detailedData.workPatternStats}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    payPeriodStart={selectedPeriod.startDate}
                    payPeriodEnd={selectedPeriod.endDate}
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
            <TabsContent value="tips" className="flex flex-col px-4 lg:px-6">
              <PayrollComponentErrorBoundary componentName="Tips Detail View">
                {isLoadingDetails && !detailedData ? (
                  <PayrollLoadingSkeleton />
                ) : detailedData ? (
                  <TipsDetailView
                    tips={detailedData.tipsDetails}
                    totalTips={summaryData?.tips || userPayroll.tips}
                    payPeriodStart={selectedPeriod.startDate}
                    payPeriodEnd={selectedPeriod.endDate}
                  />
                ) : (
                  <TipsDetailFallback
                    totalTips={summaryData?.tips || userPayroll.tips}
                    jobCount={8}
                    error={detailsError || "Tips details are not available"}
                    onRetry={retryDetails}
                    isRetrying={isLoadingDetails}
                  />
                )}
              </PayrollComponentErrorBoundary>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="flex flex-col px-4 lg:px-6">
              <PayrollComponentErrorBoundary componentName="Pay Period Analysis">
                {detailedData ? (
                  <PayPeriodAnalysis
                    userId={userId || '1'}
                    currentPeriod={selectedPeriod}
                    availablePeriods={mockPayPeriods}
                  />
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
            <TabsContent value="performance" className="flex flex-col px-4 lg:px-6">
              <PayrollComponentErrorBoundary componentName="Performance Analysis">
                {detailedData ? (
                  <PayPeriodAnalysis
                    userId={userId || '1'}
                    currentPeriod={selectedPeriod}
                    availablePeriods={mockPayPeriods}
                  />
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
            <TabsContent value="validation" className="flex flex-col px-4 lg:px-6">
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
          payrollData={summaryData ? [userPayroll] : []}
          selectedPeriod={selectedPeriod}
          departmentBreakdown={detailedData?.departmentBreakdown}
          dailyWorkHistory={detailedData?.dailyWorkHistory}
          tipsDetails={detailedData?.tipsDetails}
          currentUser={mockUser}
        />

        {/* Discrepancy Report Dialog */}
        <DiscrepancyReportDialog
          open={showDiscrepancyDialog}
          onOpenChange={setShowDiscrepancyDialog}
          errors={discrepancyErrors}
          employeeId={userId || '1'}
          payPeriodId={selectedPeriod.id}
          onSubmit={handleSubmitDiscrepancyReport}
        />
        </div>
      </div>
    </div>
  </PayrollErrorBoundary>
  );
}