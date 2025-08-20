import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AuditTrailViewer } from '@/components/features/audit/AuditTrailViewer';
import { AuditFilters } from '@/components/features/audit/AuditFilters';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const dynamic = 'force-dynamic';

export default function AuditTrailPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground">
          Track all system activities and changes for accountability and
          investigation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            View chronological system activities with detailed change tracking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<div>Loading filters...</div>}>
                <AuditFilters />
              </Suspense>
            </ErrorBoundary>
            <ErrorBoundary>
              <Suspense fallback={<div>Loading audit trail...</div>}>
                <AuditTrailViewer />
              </Suspense>
            </ErrorBoundary>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
