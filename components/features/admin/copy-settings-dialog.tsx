'use client';

import { useState, useEffect } from 'react';
import { IconCopy } from '@tabler/icons-react';
// Remove Prisma import - use number type instead

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { getUsers, copyUserSettings } from '@/lib/actions/users';

interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  rateJunkCaptain?: number | null;
  rateJunkWingman?: number | null;
  rateMoveCaptain?: number | null;
  rateMoveWingman?: number | null;
  rateZigma?: number | null;
  rateTraining?: number | null;
  rateEstimating?: number | null;
  rateWarehouse?: number | null;
  rateAdmin?: number | null;
  salaryAmount?: number | null;
  salaryFrequency?: string | null;
  salaryType?: string | null;
  commissionRate?: number | null;
  junkBonusGoal: number;
  moveBonusGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CopySettingsDialogProps {
  sourceUser: User;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function CopySettingsDialog({ 
  sourceUser, 
  trigger, 
  onSuccess 
}: CopySettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const { toast } = useToast();

  // Load available users when dialog opens
  useEffect(() => {
    if (open) {
      const loadAvailableUsers = async () => {
        const result = await getUsers({ limit: 100 });
        if (result.success && result.data) {
          // Filter out the source user
          const filteredUsers = result.data.users.filter(u => u.id !== sourceUser.id);
          setAvailableUsers(filteredUsers);
        }
      };
      loadAvailableUsers();
    }
  }, [open, sourceUser.id]);

  const handleCopySettings = async () => {
    if (!targetUserId) {
      toast({
        title: 'Error',
        description: 'Please select a target user',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await copyUserSettings(sourceUser.id, targetUserId);
      if (result.success) {
        toast({
          title: 'Settings Copied',
          description: `Settings from ${sourceUser.fullName} have been copied successfully.`,
        });
        setOpen(false);
        setTargetUserId('');
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error,
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
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <IconCopy className="h-4 w-4 mr-2" />
      Copy Settings
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Copy User Settings</DialogTitle>
          <DialogDescription>
            Copy compensation settings from {sourceUser.fullName} to another user.
            This will overwrite the target user&apos;s rates, salary, commission, and bonus settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetUser">Target User</Label>
            <Select value={targetUserId} onValueChange={setTargetUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select user to copy settings to" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.fullName}</span>
                      <span className="text-muted-foreground text-sm">({user.email})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Settings to Copy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>• All department hourly rates</div>
              <div>• Salary amount, frequency, and type</div>
              <div>• Commission rate</div>
              <div>• Bonus goal percentages</div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleCopySettings} disabled={isSubmitting || !targetUserId}>
            {isSubmitting ? 'Copying...' : 'Copy Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}