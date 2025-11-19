'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  IconSearch,
  IconTrash,
  IconEye,
  IconEdit,
  IconChevronDown,
  IconEditCircle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listLogs, deleteDraft, type ListLogsParams } from '@/lib/actions/logs';
import { toast } from 'sonner';

interface LogsViewClientProps {
  initialData: {
    total: number;
    page: number;
    pageSize: number;
    items: Array<{
      id: string;
      captainId: string;
      captainName: string;
      logDate: string | Date;
      status: 'draft' | 'submitted' | 'approved';
      revenue: number;
      tips: number;
      hours: number;
      jobCount: number;
      createdAt: string | Date;
    }>;
    stats: {
      totalRevenue: number;
      totalTips: number;
      counts: { approved: number; submitted: number; draft: number };
    };
  } | null;
}

export function LogsViewClient({ initialData }: LogsViewClientProps) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState(initialData);

  // Filters
  const [status, setStatus] = React.useState<
    'all' | 'draft' | 'submitted' | 'approved'
  >('all');
  const [search, setSearch] = React.useState('');
  const [captainId] = React.useState<string | 'all'>('all');
  const [page, setPage] = React.useState(1);
  const pageSize = 25;

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: ListLogsParams = {
        page,
        pageSize,
        search: search || undefined,
      };
      if (status !== 'all') params.status = status;
      if (captainId !== 'all') params.captainId = captainId;
      const res = await listLogs(params);
      if (res.success) {
        setData(res.data);
      } else {
        toast.error(res.error || 'Failed to load logs');
      }
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status, captainId]);

  React.useEffect(() => {
    // initialData is displayed first; reloading on filter changes
  }, []);

  const onDeleteDraft = async (id: string) => {
    if (!confirm('Delete this draft log? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await deleteDraft(id);
      if (res.success) {
        toast.success('Draft deleted');
        await reload();
      } else {
        toast.error(res.error || 'Failed to delete draft');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick Edit state
  const [quickEditOpen, setQuickEditOpen] = React.useState(false);
  const [quickEditTarget, setQuickEditTarget] = React.useState<string | null>(
    null
  );

  const openQuickEdit = (id: string) => {
    setQuickEditTarget(id);
    setQuickEditOpen(true);
  };

  const onQuickEditSave = async (payload: {
    hours?: Array<{ id: string; hours: number }>;
    jobs?: Array<{
      id: string;
      revenue?: number;
      tips?: number;
      junkOnMove?: number;
      valuation?: number;
      materials?: number;
    }>;
  }) => {
    if (!quickEditTarget) return;
    setLoading(true);
    try {
      // TODO: Implement proper hours and jobs updates
      // For now, just show a message that this feature is not yet available
      const hoursCount = payload.hours?.length ?? 0;
      const jobsCount = payload.jobs?.length ?? 0;
      toast.info(
        `Quick edit for ${hoursCount} hour item${hoursCount === 1 ? '' : 's'} and ${jobsCount} job${jobsCount === 1 ? '' : 's'} is not yet implemented`
      );
      setQuickEditOpen(false);
      // const res = await quickUpdateLog(quickEditTarget, { status: 'draft' });
      // if (res.success) {
      //   toast.success('Log updated');
      //   setQuickEditOpen(false);
      //   await reload();
      // } else {
      //   toast.error(res.error || 'Failed to update log');
      // }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-hunks-green">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-hunks-green">
            {data?.stats.counts.approved ?? 0}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-yellow-700">
            {data?.stats.counts.submitted ?? 0}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-400">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data?.stats.counts.draft ?? 0}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-hunks-orange">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Revenue / Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="text-base">
            <div className="font-semibold text-hunks-orange">
              ${(data?.stats.totalRevenue ?? 0).toLocaleString()}
            </div>
            <div className="text-muted-foreground">
              Tips: ${(data?.stats.totalTips ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job id or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[260px]"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) =>
              setStatus(v as 'all' | 'draft' | 'submitted' | 'approved')
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setPage(1);
              reload();
            }}
            disabled={loading}
          >
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Tips</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {new Date(row.logDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          row.status === 'approved'
                            ? 'default'
                            : row.status === 'submitted'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="capitalize"
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.captainName}</TableCell>
                    <TableCell className="text-right">
                      ${row.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      ${row.tips.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{row.hours}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/logs/${row.id}`}>
                          <Button size="sm" variant="ghost">
                            <IconEye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {(row.status === 'draft' ||
                          row.status === 'submitted') && (
                          <Link href={`/logs/${row.id}/edit`}>
                            <Button size="sm" variant="ghost">
                              <IconEdit className="w-4 h-4" />
                            </Button>
                          </Link>
                        )}
                        {row.status !== 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openQuickEdit(row.id)}
                          >
                            <IconEditCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {row.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDeleteDraft(row.id)}
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {(!data || data.items.length === 0) && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Page {data?.page ?? 1} of{' '}
              {data
                ? Math.max(
                    1,
                    Math.ceil(data.total / (data.pageSize || pageSize))
                  )
                : 1}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Page {page}
                    <IconChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => {
                        setPage(p);
                        reload();
                      }}
                    >
                      {p}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Quick Edit Drawer (simplified) */}
      {quickEditOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-center">
          <div className="w-full sm:max-w-2xl bg-background rounded-t-xl sm:rounded-xl p-4 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Quick Edit</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuickEditOpen(false)}
              >
                Close
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Adjust hours (rounded to nearest 5 minutes) and job
              revenue/tips/upsells.
            </p>
            <QuickEditForm onSave={onQuickEditSave} saving={loading} />
          </div>
        </div>
      )}
    </div>
  );
}

function QuickEditForm({
  onSave,
  saving,
}: {
  onSave: (payload: {
    hours?: Array<{ id: string; hours: number }>;
    jobs?: Array<{
      id: string;
      revenue?: number;
      tips?: number;
      junkOnMove?: number;
      valuation?: number;
      materials?: number;
    }>;
  }) => void;
  saving: boolean;
}) {
  const [hours, setHours] = React.useState<
    Array<{ id: string; hours: number }>
  >([]);
  const [jobs, setJobs] = React.useState<
    Array<{
      id: string;
      revenue?: number;
      tips?: number;
      junkOnMove?: number;
      valuation?: number;
      materials?: number;
    }>
  >([]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {hours.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="hourId"
                value={h.id}
                onChange={(e) => {
                  const next = [...hours];
                  next[i].id = e.target.value;
                  setHours(next);
                }}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="hours"
                value={h.hours}
                onChange={(e) => {
                  const next = [...hours];
                  next[i].hours = Number(e.target.value || 0);
                  setHours(next);
                }}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHours((arr) => [...arr, { id: '', hours: 0 }])}
          >
            Add Hour Row
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Jobs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.map((j, i) => (
            <div key={i} className="grid grid-cols-6 gap-2">
              <Input
                className="col-span-2"
                placeholder="jobId"
                value={j.id}
                onChange={(e) => {
                  const next = [...jobs];
                  next[i].id = e.target.value;
                  setJobs(next);
                }}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="revenue"
                value={j.revenue ?? ''}
                onChange={(e) => {
                  const next = [...jobs];
                  next[i].revenue =
                    e.target.value === '' ? undefined : Number(e.target.value);
                  setJobs(next);
                }}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="tips"
                value={j.tips ?? ''}
                onChange={(e) => {
                  const next = [...jobs];
                  next[i].tips =
                    e.target.value === '' ? undefined : Number(e.target.value);
                  setJobs(next);
                }}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="valuation"
                value={j.valuation ?? ''}
                onChange={(e) => {
                  const next = [...jobs];
                  next[i].valuation =
                    e.target.value === '' ? undefined : Number(e.target.value);
                  setJobs(next);
                }}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="materials"
                value={j.materials ?? ''}
                onChange={(e) => {
                  const next = [...jobs];
                  next[i].materials =
                    e.target.value === '' ? undefined : Number(e.target.value);
                  setJobs(next);
                }}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setJobs((arr) => [...arr, { id: '' }])}
          >
            Add Job Row
          </Button>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => onSave({ hours, jobs })}
          disabled={saving}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
