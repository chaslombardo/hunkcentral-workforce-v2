'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock,
  DollarSign,
  Award,
  Building,
  User,
  FileText,
  Printer
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { PayPeriod } from '@/types';
import type { PayrollCalculation, TipEntry } from '@/lib/payCalculator';
import type { DepartmentBreakdownData } from './payroll-breakdown/department-breakdown';
import type { DailyWorkEntry } from '@/lib/actions/daily-work';

interface PayrollPrintLayoutProps {
  payrollData: PayrollCalculation;
  payPeriod: PayPeriod;
  departmentBreakdown?: DepartmentBreakdownData[];
  dailyWorkHistory?: DailyWorkEntry[];
  tipsDetails?: TipEntry[];
  includeBreakdown?: boolean;
  includeDailyHistory?: boolean;
  includeCalculations?: boolean;
  notes?: string;
}

export function PayrollPrintLayout({
  payrollData,
  payPeriod,
  departmentBreakdown,
  dailyWorkHistory,
  tipsDetails,
  includeBreakdown = true,
  includeDailyHistory = false,
  includeCalculations = false,
  notes,
}: PayrollPrintLayoutProps) {
  const printDate = new Date();

  return (
    <div className="print:bg-white print:text-black print:shadow-none max-w-4xl mx-auto">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .print-avoid-break { page-break-inside: avoid; }
          body { font-size: 12pt; line-height: 1.4; }
          .print\\:text-xs { font-size: 10pt; }
          .print\\:text-sm { font-size: 11pt; }
          .print\\:text-base { font-size: 12pt; }
          .print\\:text-lg { font-size: 14pt; }
          .print\\:text-xl { font-size: 16pt; }
          .print\\:border { border: 1px solid #000; }
          .print\\:border-t { border-top: 1px solid #000; }
          .print\\:border-b { border-bottom: 1px solid #000; }
          .print\\:bg-gray-50 { background-color: #f9f9f9; }
          .print\\:p-2 { padding: 8pt; }
          .print\\:p-4 { padding: 16pt; }
          .print\\:mb-4 { margin-bottom: 16pt; }
          .print\\:mt-4 { margin-top: 16pt; }
        }
      `}</style>

      {/* Header */}
      <div className="print:border print:p-4 print:mb-4 print-avoid-break">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold print:text-xl" data-testid="company-name">College Hunks Hauling Junk & Moving</h1>
            <p className="text-muted-foreground print:text-black">Employee Paystub</p>
          </div>
          <div className="text-right text-sm print:text-xs">
            <div>Generated: {formatDate(printDate)}</div>
            <div>Pay Period: {payPeriod.name}</div>
            <div className="flex items-center gap-1 justify-end mt-1">
              <FileText className="h-3 w-3" />
              <span>Official Paystub</span>
            </div>
          </div>
        </div>

        <Separator className="print:border-t" />

        {/* Employee Information */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Employee Information
            </h3>
            <div className="space-y-1 text-sm print:text-xs">
              <div><strong>Name:</strong> {payrollData.employee.fullName}</div>
              <div><strong>Employee ID:</strong> {payrollData.employeeId}</div>
              <div><strong>Email:</strong> {payrollData.employee.email}</div>
              <div><strong>Roles:</strong> {payrollData.employee.roles.join(', ')}</div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Pay Period Details
            </h3>
            <div className="space-y-1 text-sm print:text-xs">
              <div><strong>Period:</strong> {payPeriod.name}</div>
              <div><strong>Start Date:</strong> {formatDate(payPeriod.startDate)}</div>
              <div><strong>End Date:</strong> {formatDate(payPeriod.endDate)}</div>
              <div><strong>Status:</strong> 
                <Badge variant={payPeriod.status === 'closed' ? 'secondary' : 'default'} className="ml-1 print:border print:bg-gray-50">
                  {payPeriod.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Summary */}
      <div className="print:border print:p-4 print:mb-4 print-avoid-break">
        <h2 className="text-xl font-bold mb-4 print:text-lg">Pay Summary</h2>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center print:border print:p-2">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Total Hours</span>
            </div>
            <div className="text-2xl font-bold print:text-lg">{payrollData.totalHours}h</div>
          </div>
          <div className="text-center print:border print:p-2">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Gross Wages</span>
            </div>
            <div className="text-2xl font-bold print:text-lg">{formatCurrency(payrollData.grossWages)}</div>
          </div>
          <div className="text-center print:border print:p-2">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium">Tips & Bonuses</span>
            </div>
            <div className="text-2xl font-bold print:text-lg">
              {formatCurrency(payrollData.tips + payrollData.bonuses)}
            </div>
          </div>
          <div className="text-center print:border print:p-2 print:bg-gray-50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Total Pay</span>
            </div>
            <div className="text-2xl font-bold print:text-lg">{formatCurrency(payrollData.totalPay)}</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between py-2 print:border-b">
            <span>Regular Wages ({payrollData.totalHours} hours)</span>
            <span className="font-mono">{formatCurrency(payrollData.grossWages)}</span>
          </div>
          <div className="flex justify-between py-2 print:border-b">
            <span>Tips Earned</span>
            <span className="font-mono">{formatCurrency(payrollData.tips)}</span>
          </div>
          <div className="flex justify-between py-2 print:border-b">
            <span data-testid="performance-bonuses-label">Performance Bonuses</span>
            <span className="font-mono">{formatCurrency(payrollData.bonuses)}</span>
          </div>
          <div className="flex justify-between py-2 print:border-b">
            <span>Commission</span>
            <span className="font-mono">{formatCurrency(payrollData.commission)}</span>
          </div>
          <div className="flex justify-between py-2 font-bold text-lg print:border-t print:bg-gray-50 print:p-2">
            <span>Total Gross Pay</span>
            <span className="font-mono">{formatCurrency(payrollData.totalPay)}</span>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      {includeBreakdown && departmentBreakdown && departmentBreakdown.length > 0 && (
        <div className="print:border print:p-4 print:mb-4 print-avoid-break">
          <h2 className="text-xl font-bold mb-4 print:text-lg flex items-center gap-2">
            <Building className="h-5 w-5" />
            Department Breakdown
          </h2>
          
          <div className="space-y-3">
            {departmentBreakdown.map((dept) => (
              <div key={dept.department} className="print:border print:p-2">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold capitalize">{dept.department}</span>
                    {dept.isPrimary && (
                      <Badge variant="outline" className="print:border">Primary</Badge>
                    )}
                  </div>
                  <span className="font-mono font-bold">{formatCurrency(dept.grossPay)}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm print:text-xs">
                  <div>
                    <span className="text-muted-foreground print:text-black">Hours:</span>
                    <span className="ml-1 font-mono">{dept.hours}h</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground print:text-black">Rate:</span>
                    <span className="ml-1 font-mono">{formatCurrency(dept.rate)}/hr</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground print:text-black">Percentage:</span>
                    <span className="ml-1 font-mono">{dept.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Work History */}
      {includeDailyHistory && dailyWorkHistory && dailyWorkHistory.length > 0 && (
        <div className="print:border print:p-4 print:mb-4 print-break">
          <h2 className="text-xl font-bold mb-4 print:text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Daily Work History
          </h2>
          
          <div className="space-y-2">
            {dailyWorkHistory.map((entry, index) => (
              <div key={index} className="print:border print:p-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">{formatDate(entry.date)}</span>
                  <div className="text-right">
                    <div className="font-mono">{formatCurrency(entry.grossPay)}</div>
                    <div className="text-sm text-muted-foreground print:text-black">
                      {entry.totalHours}h • {entry.jobsCompleted} jobs
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm print:text-xs">
                  <div>
                    <span className="text-muted-foreground print:text-black">Departments:</span>
                    <div className="ml-2">
                      {entry.departments.map((dept, deptIndex) => (
                        <div key={deptIndex} className="flex justify-between">
                          <span className="capitalize">{dept.department} ({dept.role}):</span>
                          <span className="font-mono">{dept.hours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground print:text-black">Tips:</span>
                    <span className="ml-1 font-mono">{formatCurrency(entry.tips)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips Details */}
      {tipsDetails && tipsDetails.length > 0 && (
        <div className="print:border print:p-4 print:mb-4">
          <h2 className="text-xl font-bold mb-4 print:text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Tips Details
          </h2>
          
          <div className="space-y-2">
            {tipsDetails.map((tip, index) => (
              <div key={index} className="flex justify-between items-center py-2 print:border-b">
                <div>
                  <div className="font-medium">{tip.clientName}</div>
                  <div className="text-sm text-muted-foreground print:text-black">
                    {formatDate(tip.date)} • Job #{tip.jobId} • {tip.teamMembers} team members
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">{formatCurrency(tip.myShare)}</div>
                  <div className="text-sm text-muted-foreground print:text-black">
                    of {formatCurrency(tip.totalJobTips)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculation Explanations */}
      {includeCalculations && (
        <div className="print:border print:p-4 print:mb-4">
          <h2 className="text-xl font-bold mb-4 print:text-lg">Calculation Explanations</h2>
          
          <div className="space-y-4 text-sm print:text-xs">
            <div>
              <h3 className="font-semibold mb-2" data-testid="regular-pay-calculation-section">Regular Pay Calculation</h3>
              <p>Regular pay is calculated by multiplying hours worked by your hourly rate for each department. 
              Captain rates apply when you serve as a captain or co-captain, otherwise wingman rates are used.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2" data-testid="tips-distribution-section">Tips Distribution</h3>
              <p>Tips from each job are divided equally among all team members who worked on that job, 
              regardless of role. This includes captains, co-captains, and wingmen.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2" data-testid="performance-bonuses-section">Performance Bonuses</h3>
              <p>Labor efficiency bonuses are earned when the labor cost percentage is below the target goal. 
              Bonus = (Goal% - Actual%) × Revenue. Only captains are eligible for efficiency bonuses.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2" data-testid="department-goals-section">Department Goals</h3>
              <ul className="list-disc list-inside ml-4">
                <li>Junk operations target: 14% labor cost</li>
                <li>Move operations target: 24% labor cost</li>
                <li>Lower percentages indicate higher efficiency</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="print:border print:p-4 print:mb-4">
          <h2 className="text-xl font-bold mb-4 print:text-lg">Notes</h2>
          <p className="text-sm print:text-xs whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="print:border-t print:p-4 print:mt-4 text-center text-sm print:text-xs text-muted-foreground print:text-black">
        <div className="flex justify-between items-center">
          <div>
            <div>College Hunks Hauling Junk & Moving</div>
            <div>Employee Self-Service Portal</div>
          </div>
          <div className="text-right">
            <div>Generated: {formatDate(printDate)}</div>
            <div>This is an official paystub</div>
          </div>
        </div>
      </div>

      {/* Print Button (hidden when printing) */}
      <div className="no-print mt-6 text-center">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-hunks-green text-white rounded-md hover:bg-hunks-green-700 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Paystub
        </button>
      </div>
    </div>
  );
}

// Helper component for print preview
export function PrintPreviewDialog({ 
  children, 
  ...props 
}: PayrollPrintLayoutProps & { children: React.ReactNode }) {
  const [showPreview, setShowPreview] = React.useState(false);

  return (
    <>
      <div onClick={() => setShowPreview(true)}>
        {children}
      </div>
      
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Print Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <PayrollPrintLayout {...props} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}