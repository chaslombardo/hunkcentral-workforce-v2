'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { AlertTriangle, Check, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getCommissionConflicts,
  resolveCommissionConflict,
} from '@/lib/commissionMatchingService';
import type { CommissionConflict } from '@/lib/commissionMatcher';

export function CommissionConflicts() {
  const [conflicts, setConflicts] = useState<CommissionConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] =
    useState<CommissionConflict | null>(null);
  const [resolving, setResolving] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

  const loadConflicts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCommissionConflicts();
      if (result.success) {
        setConflicts(result.conflicts);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load commission conflicts',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  const handleResolveConflict = async () => {
    if (!selectedConflict || !selectedEntryId) return;

    setResolving(true);
    try {
      const result = await resolveCommissionConflict(
        selectedConflict.jobId,
        selectedEntryId,
        'current-user-id' // This should come from session
      );

      if (result.success) {
        result.notifications.forEach((notification) => {
          toast({
            title: notification.title,
            description: notification.message,
            variant: notification.type === 'error' ? 'destructive' : 'default',
            className:
              notification.type === 'success'
                ? 'border-[#026937] bg-[#026937]/10'
                : undefined,
          });
        });

        // Refresh conflicts list
        await loadConflicts();
        setSelectedConflict(null);
        setSelectedEntryId('');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to resolve conflict',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setResolving(false);
      setShowConfirmDialog(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#ea7200]" />
            Commission Conflicts
          </CardTitle>
          <CardDescription>
            Loading conflicts that require manual resolution...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#026937]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-[#026937]" />
            Commission Conflicts
          </CardTitle>
          <CardDescription>
            No commission conflicts found. All entries are properly matched.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-4 text-[#026937]" />
            <p>
              All commission entries are properly matched to completed jobs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-[#ea7200]" />
            Commission Conflicts ({conflicts.length})
          </CardTitle>
          <CardDescription>
            These jobs have multiple commission entries that need manual
            resolution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Actual Revenue</TableHead>
                  <TableHead>Competing Entries</TableHead>
                  <TableHead>Log Date</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflicts.map((conflict) => (
                  <TableRow key={conflict.jobId}>
                    <TableCell className="font-medium">
                      {conflict.jobId}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(conflict.logJob.revenue))}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {conflict.commissionEntries.map((entry) => (
                          <Badge
                            key={entry.id}
                            variant="outline"
                            className="text-xs"
                          >
                            {entry.sales.fullName} (
                            {formatCurrency(entry.estimatedRevenue)})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(conflict.logJob.log.logDate),
                        'MMM d, yyyy'
                      )}
                    </TableCell>
                    <TableCell>
                      {conflict.logJob.log.captain.fullName}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedConflict(conflict)}
                        className="h-8"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolution Dialog */}
      <Dialog
        open={!!selectedConflict}
        onOpenChange={() => setSelectedConflict(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Resolve Commission Conflict</DialogTitle>
            <DialogDescription>
              Job {selectedConflict?.jobId} has multiple commission entries.
              Select the correct sales person to receive the commission.
            </DialogDescription>
          </DialogHeader>

          {selectedConflict && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Job Details</p>
                  <p className="text-sm text-muted-foreground">
                    Job ID: {selectedConflict.jobId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Actual Revenue:{' '}
                    {formatCurrency(Number(selectedConflict.logJob.revenue))}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Log Date:{' '}
                    {format(
                      new Date(selectedConflict.logJob.log.logDate),
                      'MMM d, yyyy'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Captain</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedConflict.logJob.log.captain.fullName}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-3">
                  Select the correct sales person:
                </p>
                <div className="space-y-2">
                  {selectedConflict.commissionEntries.map((entry) => {
                    const commissionRate = Number(
                      entry.sales.commissionRate || 0
                    );
                    const potentialCommission =
                      Number(selectedConflict.logJob.revenue) *
                      (commissionRate / 100);
                    const accuracy =
                      entry.estimatedRevenue > 0
                        ? Math.min(
                            (Math.min(
                              entry.estimatedRevenue,
                              Number(selectedConflict.logJob.revenue)
                            ) /
                              Math.max(
                                entry.estimatedRevenue,
                                Number(selectedConflict.logJob.revenue)
                              )) *
                              100,
                            100
                          )
                        : 0;

                    return (
                      <div
                        key={entry.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedEntryId === entry.id
                            ? 'border-[#026937] bg-[#026937]/10'
                            : 'border-border hover:border-[#026937]/50'
                        }`}
                        onClick={() => setSelectedEntryId(entry.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {entry.sales.fullName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Estimated:{' '}
                              {formatCurrency(entry.estimatedRevenue)} | Target:{' '}
                              {format(
                                new Date(entry.targetDate),
                                'MMM d, yyyy'
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Accuracy: {accuracy.toFixed(1)}% | Commission:{' '}
                              {formatCurrency(potentialCommission)} (
                              {commissionRate}%)
                            </p>
                          </div>
                          <div className="flex items-center">
                            {selectedEntryId === entry.id && (
                              <Check className="h-5 w-5 text-[#026937]" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedConflict(null);
                setSelectedEntryId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!selectedEntryId}
              className="bg-[#026937] hover:bg-[#026937]/90"
            >
              Resolve Conflict
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Resolution</AlertDialogTitle>
            <AlertDialogDescription>
              This will assign the commission for job {selectedConflict?.jobId}{' '}
              to the selected sales person and remove all other competing
              entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolveConflict}
              disabled={resolving}
              className="bg-[#026937] hover:bg-[#026937]/90"
            >
              {resolving ? 'Resolving...' : 'Confirm Resolution'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
