import { Metadata } from 'next';
import { UnifiedMonitoringDashboard } from '@/components/admin/unified-monitoring-dashboard';

export const metadata: Metadata = {
  title: 'Performance Monitoring | HUNKCentral',
  description:
    'Monitor system performance, database health, and user experience metrics',
};

export default function PerformanceMonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Performance Monitoring
        </h1>
        <p className="text-muted-foreground">
          Monitor system performance, database health, and user experience
          metrics
        </p>
      </div>

      <UnifiedMonitoringDashboard />
    </div>
  );
}
