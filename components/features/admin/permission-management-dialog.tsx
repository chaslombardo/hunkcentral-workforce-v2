'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconShield, IconUsers, IconSettings } from '@tabler/icons-react';

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import {
  PERMISSION_GROUPS,
  PERMISSION_TEMPLATES,
  ROLE_PERMISSIONS,
  getPermissionRequiredRoles,
  type Permission,
  type PermissionTemplate,
} from '@/lib/permissions';
import type { UserRole } from '@/types';

interface PermissionUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  permissions?: string[];
}

const PermissionUpdateSchema = z.object({
  userId: z.string(),
  permissions: z.array(z.string()),
});

type PermissionUpdateFormData = z.infer<typeof PermissionUpdateSchema>;

interface PermissionManagementDialogProps {
  user: PermissionUser;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function PermissionManagementDialog({
  user,
  trigger,
  onSuccess,
}: PermissionManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    PermissionTemplate | ''
  >('');
  const { toast } = useToast();

  const form = useForm<PermissionUpdateFormData>({
    resolver: zodResolver(PermissionUpdateSchema),
    defaultValues: {
      userId: user.id,
      permissions: user.permissions || [],
    },
  });

  // Get role-based permissions for display
  const roleBasedPermissions = user.roles.flatMap(
    (role) => ROLE_PERMISSIONS[role] || []
  );
  const uniqueRolePermissions = [...new Set(roleBasedPermissions)];

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

  const handleTemplateApply = (template: PermissionTemplate) => {
    const templatePermissions = [...PERMISSION_TEMPLATES[template].permissions];
    form.setValue('permissions', templatePermissions);
    setSelectedTemplate(template);
  };

  const handleRolePermissionsSync = () => {
    form.setValue('permissions', uniqueRolePermissions);
    setSelectedTemplate('');
  };

  const onSubmit = async (data: PermissionUpdateFormData) => {
    setIsSubmitting(true);
    try {
      const { updateUserPermissions } = await import('@/lib/actions/users');
      const result = await updateUserPermissions(data);

      if (result.success) {
        toast({
          title: 'Permissions Updated',
          description: `Permissions for ${user.fullName} have been updated successfully.`,
        });

        setOpen(false);
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Permission update failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update permissions',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPermissionGranted = (permission: Permission) => {
    const explicitPermissions = form.watch('permissions');
    return (
      explicitPermissions.includes(permission) ||
      uniqueRolePermissions.includes(permission)
    );
  };

  const isPermissionFromRole = (permission: Permission) => {
    return uniqueRolePermissions.includes(permission);
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <IconShield className="h-4 w-4 mr-2" />
      Manage Permissions
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Manage Permissions - {user.fullName}
            </DialogTitle>
            <DialogDescription>
              Configure granular permissions for this user. Role-based
              permissions are automatically granted and shown in blue.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="permissions" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRolePermissionsSync}
                  >
                    Sync with Roles
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue('permissions', [])}
                  >
                    Clear All
                  </Button>
                </CardContent>
              </Card>

              {/* Permission Groups */}
              <div className="space-y-4">
                {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
                  <Card key={groupKey}>
                    <CardHeader>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <CardDescription>{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {group.permissions.map((permission) => {
                          const isGranted = isPermissionGranted(permission);
                          const isFromRole = isPermissionFromRole(permission);
                          const requiredRoles =
                            getPermissionRequiredRoles(permission);

                          return (
                            <div
                              key={permission}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  id={permission}
                                  checked={isGranted}
                                  disabled={isFromRole}
                                  onCheckedChange={(checked) =>
                                    handlePermissionChange(
                                      permission,
                                      checked as boolean
                                    )
                                  }
                                  className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                />
                                <Label
                                  htmlFor={permission}
                                  className={`${isFromRole ? 'text-blue-600 dark:text-blue-400' : ''}`}
                                >
                                  {permission
                                    .replace(/_/g, ' ')
                                    .toLowerCase()
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Label>
                              </div>
                              <div className="flex items-center gap-2">
                                {isFromRole && (
                                  <Badge
                                    variant="secondary"
                                    className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                  >
                                    Role-based
                                  </Badge>
                                )}
                                {requiredRoles.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {requiredRoles.join(', ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconUsers className="h-5 w-5" />
                    Permission Templates
                  </CardTitle>
                  <CardDescription>
                    Apply pre-configured permission sets for common roles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(PERMISSION_TEMPLATES).map(
                    ([templateKey, template]) => (
                      <Card
                        key={templateKey}
                        className="border-2 hover:border-primary/50 transition-colors"
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {template.name}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {template.description}
                              </CardDescription>
                            </div>
                            <Button
                              type="button"
                              variant={
                                selectedTemplate === templateKey
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() =>
                                handleTemplateApply(
                                  templateKey as PermissionTemplate
                                )
                              }
                            >
                              {selectedTemplate === templateKey
                                ? 'Applied'
                                : 'Apply'}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground">
                            <strong>
                              Permissions ({template.permissions.length}):
                            </strong>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {template.permissions
                                .slice(0, 5)
                                .map((permission) => (
                                  <Badge
                                    key={permission}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {permission
                                      .replace(/_/g, ' ')
                                      .toLowerCase()
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </Badge>
                                ))}
                              {template.permissions.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.permissions.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Current Roles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconUsers className="h-5 w-5" />
                      Current Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="default">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      ))}
                    </div>
                    <Separator className="my-4" />
                    <div className="text-sm text-muted-foreground">
                      <strong>
                        Role-based permissions ({uniqueRolePermissions.length}):
                      </strong>
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {uniqueRolePermissions.map((permission) => (
                          <div key={permission} className="py-1">
                            {permission
                              .replace(/_/g, ' ')
                              .toLowerCase()
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Explicit Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconSettings className="h-5 w-5" />
                      Explicit Permissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <strong>
                        Additional permissions (
                        {form.watch('permissions').length}):
                      </strong>
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {form.watch('permissions').length === 0 ? (
                          <div className="text-muted-foreground italic">
                            No additional permissions
                          </div>
                        ) : (
                          form.watch('permissions').map((permission) => (
                            <div key={permission} className="py-1">
                              {permission
                                .replace(/_/g, ' ')
                                .toLowerCase()
                                .replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Permission Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Permission Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {uniqueRolePermissions.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Role-based
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {form.watch('permissions').length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Explicit
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Permissions'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
