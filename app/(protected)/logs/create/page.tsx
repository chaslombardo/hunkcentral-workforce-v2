import { Metadata } from 'next';
import { CaptainLogForm } from '@/components/features/logs/captain-log-form';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const metadata: Metadata = {
  title: 'Create Daily Log - HUNKCentral',
  description: 'Create a new daily work log',
};

export default function CreateLogPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Daily Log</h1>
        <p className="text-muted-foreground">
          Record your daily work activities, jobs, and team hours.
        </p>
      </div>
      <ErrorBoundary>
        <CaptainLogForm />
      </ErrorBoundary>
    </div>
  );
}