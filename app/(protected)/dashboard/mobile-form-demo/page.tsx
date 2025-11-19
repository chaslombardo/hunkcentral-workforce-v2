import { CaptainLogForm } from '@/components/features/logs/captain-log-form';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClipboardList, Smartphone } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function MobileFormPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Daily Logs
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
          Mobile Log Submission
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          This page renders the production log form that captains use in the
          field. Submissions flow directly into payroll, commissions, and audit
          trails just like the main logs workspace.
        </p>
      </div>

      <Alert className="bg-hunks-green/5 border-hunks-green/30">
        <ClipboardList className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-1">
          <span>
            Drafts autosave offline and sync once a connection returns. Submit a
            real log here to verify end-to-end processing.
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Smartphone className="h-3 w-3" /> Optimized for touch with large
            hit targets and background persistence.
          </span>
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-0">
          <CaptainLogForm />
        </CardContent>
      </Card>
    </div>
  );
}
