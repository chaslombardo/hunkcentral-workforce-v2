'use client';

import { toast } from '@/hooks/use-toast';
import type { MatchingNotification } from '@/lib/commissionMatchingService';

/**
 * Display toast notifications for commission matching results
 */
export function showCommissionMatchingNotifications(notifications: MatchingNotification[]) {
  notifications.forEach((notification) => {
    switch (notification.type) {
      case 'success':
        toast({
          title: notification.title,
          description: notification.message,
          variant: 'default',
          className: 'border-[#026937] bg-[#026937]/10',
        });
        break;
        
      case 'conflict':
        toast({
          title: notification.title,
          description: notification.message,
          variant: 'destructive',
          className: 'border-[#ea7200] bg-[#ea7200]/10',
        });
        break;
        
      case 'error':
        toast({
          title: notification.title,
          description: notification.message,
          variant: 'destructive',
        });
        break;
    }
  });
}

/**
 * Show a single commission match notification
 */
export function showCommissionMatchNotification(
  jobId: string,
  salesPerson: string,
  accuracy: number,
  commissionAmount: number
) {
  toast({
    title: 'Commission Matched',
    description: `Job ${jobId} matched to ${salesPerson} - $${commissionAmount.toFixed(2)} commission (${accuracy.toFixed(1)}% accuracy)`,
    variant: 'default',
    className: 'border-[#026937] bg-[#026937]/10',
  });
}

/**
 * Show commission conflict notification
 */
export function showCommissionConflictNotification(
  jobId: string,
  conflictCount: number
) {
  toast({
    title: 'Commission Conflict',
    description: `Job ${jobId} has ${conflictCount} competing commission entries. Manual resolution required.`,
    variant: 'destructive',
    className: 'border-[#ea7200] bg-[#ea7200]/10',
  });
}

/**
 * Show commission matching summary
 */
export function showCommissionMatchingSummary(
  matchCount: number,
  conflictCount: number,
  totalCommission: number
) {
  if (matchCount > 0) {
    toast({
      title: 'Commission Matching Complete',
      description: `${matchCount} commission(s) matched for $${totalCommission.toFixed(2)} total${conflictCount > 0 ? `. ${conflictCount} conflict(s) need resolution.` : '.'}`,
      variant: 'default',
      className: 'border-[#026937] bg-[#026937]/10',
    });
  }
  
  if (conflictCount > 0 && matchCount === 0) {
    toast({
      title: 'Commission Conflicts Detected',
      description: `${conflictCount} commission conflict(s) require manual resolution.`,
      variant: 'destructive',
      className: 'border-[#ea7200] bg-[#ea7200]/10',
    });
  }
}

/**
 * Show conflict resolution success notification
 */
export function showConflictResolutionNotification(
  jobId: string,
  selectedSalesPerson: string,
  commissionAmount: number,
  removedCount: number
) {
  toast({
    title: 'Conflict Resolved',
    description: `Job ${jobId} assigned to ${selectedSalesPerson} - $${commissionAmount.toFixed(2)} commission. ${removedCount} duplicate entries removed.`,
    variant: 'default',
    className: 'border-[#026937] bg-[#026937]/10',
  });
}