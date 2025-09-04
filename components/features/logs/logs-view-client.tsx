'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  IconSearch,
  IconTrash,
  IconEye,
  IconEdit,
  IconChevronDown,
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
import { toast } from 'sonner';
import { listLogs, deleteDraft, type ListLogsParams } from '@/lib/actions/logs';

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
  const [captainId, setCaptainId] = React.useState<string | 'all'>('all');
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
      if (status !== 'all') params.status = [status];
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
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
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
    </div>
  );
}
