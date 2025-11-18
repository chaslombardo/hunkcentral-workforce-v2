'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconShield,
  IconUsers,
  IconPlus,
  IconMinus,
  IconRefresh,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

import { PERMISSION_GROUPS, type Permission } from '@/lib/permissions';
import type { UserRole } from '@/types';

interface BulkPermissionUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  permissions?: string[];
}

const BulkPermissionSchema = z.object({
  userIds: z.array(z.string()).min(1, 'Select at least one user'),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
  action: z.enum(['add', 'remove', 'replace']),
});

type BulkPermissionFormData = z.infer<typeof BulkPermissionSchema>;

interface BulkPermissionDialogProps {
  selectedUsers: BulkPermissionUser[];
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function BulkPermissionDialog({
  selectedUsers,
  trigger,
  onSuccess,
}: BulkPermissionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<BulkPermissionFormData>({
    resolver: zodResolver(BulkPermissionSchema),
    defaultValues: {
      userIds: selectedUsers.map((u) => u.id),
      permissions: [],
      action: 'add',
    },
  });

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    const currentPermissions = form.getValues('permissions');
    if (checked) {
      form.setValue('permissions', [...currentPermissions, permission]);
    } else {
      form.setValue(
        'permissions',
        currentPermissions.filter((p) => p !== permission)
      );
    }
  };

  const onSubmit = async (data: BulkPermissionFormData) => {
    setIsSubmitting(true);
    try {
      const { bulkUpdatePermissions } = await import('@/lib/actions/users');
      const result = await bulkUpdatePermissions(data);

      if (result.success && result.summary) {
        const { summary } = result;
        toast({
          title: 'Bulk Permission Update Complete',
          description: `Updated ${summary.successful} users successfully. ${summary.failed > 0 ? `${summary.failed} failed.` : ''}`,
        });

        setOpen(false);
        form.reset();
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Bulk permission update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add':
        return <IconPlus className="h-4 w-4" />;
      case 'remove':
        return <IconMinus className="h-4 w-4" />;
      case 'replace':
        return <IconRefresh className="h-4 w-4" />;
      default:
        return <IconShield className="h-4 w-4" />;
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'add':
        return 'Add selected permissions to all selected users';
      case 'remove':
        return 'Remove selected permissions from all selected users';
      case 'replace':
        return 'Replace all permissions with selected permissions for all selected users';
      default:
        return '';
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" disabled={selectedUsers.length === 0}>
      <IconShield className="h-4 w-4 mr-2" />
      Bulk Permissions
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Bulk Permission Management
            </DialogTitle>
            <DialogDescription>
              Apply permission changes to {selectedUsers.length} selected
              user(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Selected Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUsers className="h-5 w-5" />
                  Selected Users ({selectedUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary">
                      {user.fullName}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Action</CardTitle>
                <CardDescription>
                  Choose how to apply the selected permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={form.watch('action')}
                  onValueChange={(value) =>
                    form.setValue(
                      'action',
                      value as 'add' | 'remove' | 'replace'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center gap-2">
                        <IconPlus className="h-4 w-4" />
                        Add Permissions
                      </div>
                    </SelectItem>
                    <SelectItem value="remove">
                      <div className="flex items-center gap-2">
                        <IconMinus className="h-4 w-4" />
                        Remove Permissions
                      </div>
                    </SelectItem>
                    <SelectItem value="replace">
                      <div className="flex items-center gap-2">
                        <IconRefresh className="h-4 w-4" />
                        Replace All Permissions
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  {getActionDescription(form.watch('action'))}
                </p>
              </CardContent>
            </Card>

            {/* Permission Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select Permissions</h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allPermissions = Object.values(
                        PERMISSION_GROUPS
                      ).flatMap((g) => g.permissions);
                      form.setValue('permissions', allPermissions);
                    }}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('permissions', [])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                <Card key={groupKey}>
                  <CardHeader>
                    <CardTitle className="text-base">{group.name}</CardTitle>
                    <CardDescription>{group.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {group.permissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center space-x-3"
                        >
                          <Checkbox
                            id={`bulk-${permission}`}
                            checked={form
                              .watch('permissions')
                              .includes(permission)}
                            onCheckedChange={(checked) =>
                              handlePermissionChange(
                                permission,
                                checked as boolean
                              )
                            }
                            className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />
                          <Label htmlFor={`bulk-${permission}`}>
                            {permission
                              .replace(/_/g, ' ')
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {getActionIcon(form.watch('action'))}
                    <span className="font-medium">
                      {form.watch('action').charAt(0).toUpperCase() +
                        form.watch('action').slice(1)}
                    </span>
                  </div>
                  <div>
                    <strong>{form.watch('permissions').length}</strong>{' '}
                    permission(s)
                  </div>
                  <div>
                    for <strong>{selectedUsers.length}</strong> user(s)
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || form.watch('permissions').length === 0}
            >
              {isSubmitting
                ? 'Updating...'
                : `Apply to ${selectedUsers.length} User(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
