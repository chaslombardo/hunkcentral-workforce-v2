'use client';

import { useState, useTransition } from 'react';
import {
  SmartInput,
  type ValidationRule,
} from '@/components/forms/smart-input';
import { loadLog } from '@/lib/actions/logs';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const validationRules: ValidationRule[] = [
  {
    test: (value) => value.trim().length >= 8,
    message: 'Log IDs are at least 8 characters',
    type: 'error',
    priority: 1,
  },
  {
    test: (value) => /[0-9a-fA-F-]{8,}/.test(value.trim()),
    message: 'Use a valid UUID or log identifier',
    type: 'warning',
    priority: 2,
  },
  {
    test: (value) => value.trim().length <= 64,
    message: 'Character count',
    type: 'info',
    priority: 3,
  },
];

type LogSummary = {
  id: string;
  status: 'draft' | 'submitted' | 'approved';
  logDate: Date;
  captain: string;
  totalRevenue: number;
  totalHours: number;
  jobCount: number;
  topJob?: {
    jobId: string;
    revenue: number;
    jobType: string;
    clientName?: string;
  };
};

function parseLogSummary(data: unknown): LogSummary | null {
  if (!data || typeof data !== 'object') return null;
  const log = data as Record<string, unknown>;
  const id = typeof log.id === 'string' ? log.id : null;
  const status = log.status as LogSummary['status'] | undefined;
  const logDate =
    log.logDate instanceof Date
      ? log.logDate
      : log.logDate
        ? new Date(log.logDate as string)
        : null;
  const captain =
    typeof log.captain === 'object' &&
    log.captain &&
    typeof (log.captain as Record<string, unknown>).fullName === 'string'
      ? ((log.captain as Record<string, unknown>).fullName as string)
      : null;
  const jobs = Array.isArray(log.jobs)
    ? log.jobs.map((job) =>
        job && typeof job === 'object'
          ? {
              jobId:
                typeof (job as Record<string, unknown>).jobId === 'string'
                  ? ((job as Record<string, unknown>).jobId as string)
                  : 'N/A',
              jobType:
                typeof (job as Record<string, unknown>).jobType === 'string'
                  ? ((job as Record<string, unknown>).jobType as string)
                  : 'unknown',
              revenue: Number((job as Record<string, unknown>).revenue ?? 0),
              clientName:
                typeof (job as Record<string, unknown>).clientName === 'string'
                  ? ((job as Record<string, unknown>).clientName as string)
                  : undefined,
            }
          : null
      )
    : [];
  const hours = Array.isArray(log.hours)
    ? log.hours.map((hour) =>
        hour && typeof hour === 'object'
          ? Number((hour as Record<string, unknown>).hours ?? 0)
          : 0
      )
    : [];

  if (!id || !status || !logDate || !captain) {
    return null;
  }

  const filteredJobs = jobs.filter(Boolean) as NonNullable<(typeof jobs)[0]>[];
  const totalRevenue = filteredJobs.reduce(
    (sum, job) => sum + Number(job.revenue || 0),
    0
  );
  const totalHours = hours.reduce((sum, value) => sum + Number(value || 0), 0);
  const topJob = filteredJobs.sort((a, b) => b.revenue - a.revenue)[0];

  return {
    id,
    status,
    logDate,
    captain,
    totalRevenue,
    totalHours,
    jobCount: filteredJobs.length,
    topJob,
  };
}

export const dynamic = 'force-dynamic';

export default function SmartInputPage() {
  const [query, setQuery] = useState('');
  const [logSummary, setLogSummary] = useState<LogSummary | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const canSearch = query.trim().length >= 8 && validationErrors.length === 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSearch) return;

    startTransition(async () => {
      setSearchError(null);
      setLogSummary(null);
      const result = await loadLog(query.trim());
      if (result.success && result.data) {
        const summary = parseLogSummary(result.data);
        if (summary) {
          setLogSummary(summary);
        } else {
          setSearchError('Unexpected log format returned');
        }
      } else {
        setSearchError(result.error || 'Log not found');
      }
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Validation
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-hunks-green">
          Smart Input Search
        </h1>
        <p className="text-muted-foreground max-w-3xl">
          Type a real log ID to pull live data from the server. The smart input
          enforces formatting, surfaces warnings, and only queries the backend
          when the identifier looks valid.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <SmartInput
          label="Daily Log ID"
          placeholder="e.g. 5b1d1b7c-4d3b-4e4b-8c80-9c0e6f2e1234"
          validationRules={validationRules}
          validateOnBlur
          validateOnChange
          showValidation
          onValueChange={(value) => setQuery(value)}
          onValidationChange={(_, errors) => setValidationErrors(errors)}
          autoComplete="off"
        />
        <Button type="submit" disabled={!canSearch || isPending}>
          {isPending ? 'Searching…' : 'Lookup log'}
        </Button>
      </form>

      {searchError && (
        <Alert variant="destructive">
          <AlertTitle>Lookup failed</AlertTitle>
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}

      {logSummary && (
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardDescription>Log result</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              {format(logSummary.logDate, 'PPP')}
              <Badge
                variant={
                  logSummary.status === 'approved'
                    ? 'default'
                    : logSummary.status === 'submitted'
                      ? 'outline'
                      : 'secondary'
                }
              >
                {logSummary.status}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Captain {logSummary.captain} — {logSummary.jobCount} job
              {logSummary.jobCount === 1 ? '' : 's'} recorded
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-border/60 p-4">
              <p className="text-sm text-muted-foreground">Total revenue</p>
              <p className="text-2xl font-semibold">
                $
                {logSummary.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="rounded-md border border-border/60 p-4">
              <p className="text-sm text-muted-foreground">Total hours</p>
              <p className="text-2xl font-semibold">
                {logSummary.totalHours.toFixed(2)} hrs
              </p>
            </div>
            {logSummary.topJob && (
              <div className="rounded-md border border-border/60 p-4 sm:col-span-2">
                <p className="text-sm text-muted-foreground">Top job</p>
                <p className="text-lg font-semibold">
                  {logSummary.topJob.clientName || 'Client'} —{' '}
                  {logSummary.topJob.jobId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {logSummary.topJob.jobType.toUpperCase()} • $
                  {logSummary.topJob.revenue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
