'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { AuditLog } from '@/types';
import { getEntityAuditHistory } from '@/lib/actions/audit';
import { ClockIcon } from 'lucide-react';

interface EntityAuditHistoryProps {
  entityType: string;
  entityId: string;
  title?: string;
}

export function EntityAuditHistory({ 
  entityType, 
  entityId, 
  title = 'Change History' 
}: EntityAuditHistoryProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const result = await getEntityAuditHistory(entityType, entityId);
        if (result.success) {
          setAuditLogs(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch audit history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [entityType, entityId]);

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

  const renderChanges = (changes: Record<string, unknown>) => {
    if (!changes) return null;

    return (
      <div className="space-y-2 text-sm">
        {Object.entries(changes).map(([key, value]: [string, unknown]) => (
          <div key={key} className="space-y-1">
            <div className="font-medium text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
            </div>
            {typeof value === 'object' && value !== null && 'from' in value && 'to' in value ? (
              <div className="pl-2 space-y-1">
                <div className="text-red-600 dark:text-red-400 text-xs">
                  From: {String((value as { from: unknown }).from)}
                </div>
                <div className="text-green-600 dark:text-green-400 text-xs">
                  To: {String((value as { to: unknown }).to)}
                </div>
              </div>
            ) : typeof value === 'object' && value !== null && 'to' in value ? (
              <div className="pl-2">
                <div className="text-green-600 dark:text-green-400 text-xs">
                  Added: {String((value as { to: unknown }).to)}
                </div>
              </div>
            ) : typeof value === 'object' && value !== null && 'from' in value ? (
              <div className="pl-2">
                <div className="text-red-600 dark:text-red-400 text-xs">
                  Removed: {String((value as { from: unknown }).from)}
                </div>
              </div>
            ) : (
              <div className="pl-2 text-xs">{String(value)}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading history...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Chronological record of all changes and activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No history available
          </div>
        ) : (
          <div className="space-y-4">
            {auditLogs.map((log, index) => (
              <div key={log.id}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="text-xs">
                      {log.user.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{log.user.fullName}</span>
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>
                    
                    {log.changes && (
                      <div className="bg-muted/50 rounded-md p-3">
                        {renderChanges(log.changes)}
                      </div>
                    )}
                  </div>
                </div>
                
                {index < auditLogs.length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}