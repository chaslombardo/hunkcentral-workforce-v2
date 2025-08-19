import dynamicImport from 'next/dynamic';

// Lazy load the heavy payroll dashboard with loading state
const PayrollReportDashboard = dynamicImport(() => import('@/components/features/reports/payroll-report-dashboard').then(mod => ({ default: mod.PayrollReportDashboard })), {
  loading: () => (
    <div className="flex h-96 items-center justify-center">
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
        <span className="text-sm text-muted-foreground">Loading payroll dashboard...</span>
      </div>
    </div>
  )
});

export default function PayrollReportPage() {
  return <PayrollReportDashboard />;
}
