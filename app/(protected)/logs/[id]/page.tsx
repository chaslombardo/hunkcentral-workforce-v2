import { Suspense } from 'react';
import { LogDetailView } from '@/components/features/logs/log-detail-view';
import { LogDetailSkeleton } from '@/components/features/logs/log-detail-skeleton';
import LogErrorBoundary, { ServerActionErrorFallback } from '@/components/ui/log-error-boundary';

interface LogDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function LogDetailPage({ params }: LogDetailPageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto py-6">
      <LogErrorBoundary fallback={ServerActionErrorFallback}>
        <Suspense fallback={<LogDetailSkeleton />}>
          <LogDetailView logId={id} />
        </Suspense>
      </LogErrorBoundary>
    </div>
  );
}