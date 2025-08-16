import { Metadata } from 'next';
import { CaptainLogForm } from '@/components/features/logs/captain-log-form';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export const metadata: Metadata = {
  title: 'Create Daily Log - HUNKCentral',
  description: 'Create a new daily work log',
};

export default function CreateLogPage() {
  try {
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
  } catch (error) {
    console.error('Error in CreateLogPage:', error);
    
    return (
      <div className="container mx-auto py-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Form</h1>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading the log creation form. Please try refreshing or contact support.
          </p>
          <p className="text-xs font-mono p-2 bg-muted rounded">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }
}