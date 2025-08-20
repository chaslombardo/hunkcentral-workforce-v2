'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CommissionList } from './commission-list';
import {
  deleteCommissionEntry,
  approveCommissionEntry,
  rejectCommissionEntry,
} from '@/lib/actions/commission';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BrandButton } from '@/components/brand/brand-button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface CommissionEntry {
  id: string;
  jobId: string;
  clientName: string;
  jobType: string;
  targetDate: Date;
  estimatedRevenue: number;
  actualRevenue: number | null;
  commissionAmount: number | null;
  status: string;
  createdAt: Date;
  sales: {
    id: string;
    fullName: string;
    email: string;
  };
  matchedLog?: {
    id: string;
    logDate: Date;
    captain: {
      fullName: string;
    };
  } | null;
  approvedBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  rejectedBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
}

interface CommissionListWithActionsProps {
  entries: CommissionEntry[];
}

export function CommissionListWithActions({
  entries,
}: CommissionListWithActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CommissionEntry | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (entry: CommissionEntry) => {
    // Navigate to edit page (you can implement this later)
    router.push(`/commission/edit/${entry.id}`);
  };

  const handleView = (entry: CommissionEntry) => {
    // Navigate to view page (you can implement this later)
    router.push(`/commission/view/${entry.id}`);
  };

  const handleDelete = (entry: CommissionEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const handleApprove = (entry: CommissionEntry) => {
    startTransition(async () => {
      try {
        const result = await approveCommissionEntry(entry.id);
        if (result.success) {
          toast({
            title: 'Commission Approved',
            description: `Commission entry for ${entry.jobId} has been approved.`,
          });
          router.refresh();
        } else {
          toast({
            title: 'Approval Failed',
            description: result.error || 'Failed to approve commission entry.',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Error',
          description:
            'An unexpected error occurred while approving the commission.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleReject = (entry: CommissionEntry) => {
    setSelectedEntry(entry);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedEntry) return;

    startTransition(async () => {
      try {
        const result = await deleteCommissionEntry(selectedEntry.id);
        if (result.success) {
          toast({
            title: 'Commission Deleted',
            description: `Commission entry for ${selectedEntry.jobId} has been deleted.`,
          });
          router.refresh();
        } else {
          toast({
            title: 'Delete Failed',
            description: result.error || 'Failed to delete commission entry.',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Error',
          description:
            'An unexpected error occurred while deleting the commission.',
          variant: 'destructive',
        });
      } finally {
        setDeleteDialogOpen(false);
        setSelectedEntry(null);
      }
    });
  };

  const confirmReject = () => {
    if (!selectedEntry) return;

    startTransition(async () => {
      try {
        const result = await rejectCommissionEntry(
          selectedEntry.id,
          rejectReason
        );
        if (result.success) {
          toast({
            title: 'Commission Rejected',
            description: `Commission entry for ${selectedEntry.jobId} has been rejected.`,
          });
          router.refresh();
        } else {
          toast({
            title: 'Rejection Failed',
            description: result.error || 'Failed to reject commission entry.',
            variant: 'destructive',
          });
        }
      } catch {
        toast({
          title: 'Error',
          description:
            'An unexpected error occurred while rejecting the commission.',
          variant: 'destructive',
        });
      } finally {
        setRejectDialogOpen(false);
        setSelectedEntry(null);
        setRejectReason('');
      }
    });
  };

  return (
    <>
      <CommissionList
        entries={entries}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Commission Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the commission entry for job{' '}
              {selectedEntry?.jobId}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Commission Entry</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the commission entry for job{' '}
              {selectedEntry?.jobId}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <BrandButton
              variant="ghost"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </BrandButton>
            <BrandButton
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason.trim()}
            >
              Reject
            </BrandButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
