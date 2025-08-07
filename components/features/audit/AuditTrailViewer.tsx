'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { AuditLog } from '@/types';
import { getAuditLogs } from '@/lib/actions/audit';
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon } from 'lucide-react';

interface AuditTrailViewerProps {
  entityId?: string;
  entityType?: string;
  limit?: number;
}

export function AuditTrailViewer({ 
  entityId, 
  entityType, 
  limit = 50 
}: AuditTrailViewerProps) {
  const searchParams = useSearchParams();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters = {
          entityType: entityType || searchParams.get('entityType') || undefined,
          action: searchParams.get('action') || undefined,
          userId: searchParams.get('userId') || undefined,
          entityId: entityId || searchParams.get('entityId') || undefined,
          startDate: searchParams.get('startDate') || undefined,
          endDate: searchParams.get('endDate') || undefined,
        };

        const result = await getAuditLogs(filters, page, limit);
        if (result.success) {
          setAuditLogs(result.data.logs);
          setTotalPages(Math.ceil(result.data.total / limit));
        }
      } catch (error) {
        // Only log in development, show user-friendly message in production
        if (process.env.NODE_ENV === 'development') {
          // Failed to fetch audit logs
        }
        // Set error state for user feedback instead of just logging
        setError('Unable to load audit logs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [searchParams, page, limit, entityId, entityType]);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      case 'approve':
        return 'default';
      case 'submit':
        return 'secondary';
      case 'reject':
        return 'destructive';
      case 'match':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEntityTypeColor = (entityType: string) => {
    switch (entityType) {
      case 'daily_log':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'commission_entry':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'user':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'pay_period':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatEntityType = (entityType: string) => {
    return entityType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderChanges = (changes: Record<string, unknown>) => {
    if (!changes) return null;

    return (
      <div className="space-y-2 max-w-sm">
        {Object.entries(changes).map(([key, value]: [string, unknown]) => (
          <div key={key} className="text-xs">
            <div className="font-medium text-muted-foreground">{key}:</div>
            {typeof value === 'object' && value !== null && 'from' in value && 'to' in value ? (
              <div className="space-y-1">
                <div className="text-red-600 dark:text-red-400">
                  From: {String((value as { from: unknown }).from)}
                </div>
                <div className="text-green-600 dark:text-green-400">
                  To: {String((value as { to: unknown }).to)}
                </div>
              </div>
            ) : (
              <div>{String(value)}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading audit trail...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Changes</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {log.user.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{log.user.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge 
                        variant="outline" 
                        className={getEntityTypeColor(log.entityType)}
                      >
                        {formatEntityType(log.entityType)}
                      </Badge>
                      <div className="text-xs text-muted-foreground font-mono">
                        {log.entityId.slice(0, 8)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {log.changes ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Changes</h4>
                            {renderChanges(log.changes)}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <span className="text-muted-foreground text-sm">No changes</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.dailyLogId && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/logs/${log.dailyLogId}`}>
                          <EyeIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}