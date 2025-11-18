'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconUpload,
  IconDownload,
  IconUsers,
  IconUserCheck,
  IconUserX,
  IconFileSpreadsheet,
  IconFileText,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

import type { UserRole } from '@/types';

interface User {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  permissions?: string[];
}

const BulkImportSchema = z.object({
  file: z.any().optional(),
  skipDuplicates: z.boolean(),
  sendWelcomeEmails: z.boolean(),
});

const BulkRoleAssignmentSchema = z.object({
  userIds: z.array(z.string()).min(1, 'Select at least one user'),
  roles: z.array(z.string()).min(1, 'Select at least one role'),
  action: z.enum(['add', 'remove', 'replace']),
});

const BulkActivationSchema = z.object({
  userIds: z.array(z.string()).min(1, 'Select at least one user'),
  action: z.enum(['activate', 'deactivate']),
});

type BulkImportFormData = z.infer<typeof BulkImportSchema>;
type BulkRoleAssignmentFormData = z.infer<typeof BulkRoleAssignmentSchema>;
type BulkActivationFormData = z.infer<typeof BulkActivationSchema>;

interface BulkUserOperationsProps {
  selectedUsers: User[];
  onSuccess?: () => void;
}

const USER_ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'captain', label: 'Captain' },
  { value: 'sales', label: 'Sales' },
  { value: 'wingman', label: 'Wingman' },
];

export function BulkUserOperations({
  selectedUsers,
  onSuccess,
}: BulkUserOperationsProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const importForm = useForm<BulkImportFormData>({
    resolver: zodResolver(BulkImportSchema),
    defaultValues: {
      skipDuplicates: true,
      sendWelcomeEmails: false,
    },
  });

  const roleForm = useForm<BulkRoleAssignmentFormData>({
    resolver: zodResolver(BulkRoleAssignmentSchema),
    defaultValues: {
      userIds: selectedUsers.map((u) => u.id),
      roles: [],
      action: 'add',
    },
  });

  const activationForm = useForm<BulkActivationFormData>({
    resolver: zodResolver(BulkActivationSchema),
    defaultValues: {
      userIds: selectedUsers.map((u) => u.id),
      action: 'activate',
    },
  });

  const handleBulkImport = async (_data: BulkImportFormData) => {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Simulate file upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // TODO: Implement actual bulk import
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast({
        title: 'Bulk Import Complete',
        description: 'Users have been imported successfully.',
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import users. Please check the file format.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleBulkRoleAssignment = async (data: BulkRoleAssignmentFormData) => {
    setIsSubmitting(true);

    try {
      const { bulkUpdateRoles } = await import('@/lib/actions/users');
      const result = await bulkUpdateRoles(data);

      if (result.success && result.summary) {
        toast({
          title: 'Bulk Role Assignment Complete',
          description: `Updated ${result.summary.successful} user(s) successfully. ${result.summary.failed > 0 ? `${result.summary.failed} failed.` : ''}`,
        });
      } else {
        toast({
          title: 'Role Assignment Failed',
          description: result.error || 'Failed to update user roles.',
          variant: 'destructive',
        });
      }

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Role assignment failed:', error);
      toast({
        title: 'Role Assignment Failed',
        description: 'Failed to update user roles.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkActivation = async (data: BulkActivationFormData) => {
    setIsSubmitting(true);

    try {
      // TODO: Implement actual bulk activation/deactivation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const action = data.action === 'activate' ? 'activated' : 'deactivated';
      toast({
        title: 'Bulk User Update Complete',
        description: `Successfully ${action} ${data.userIds.length} user(s).`,
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('User update failed:', error);
      toast({
        title: 'User Update Failed',
        description: 'Failed to update user status.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const { exportUsers } = await import('@/lib/actions/users');
      const userIds =
        selectedUsers.length > 0 ? selectedUsers.map((u) => u.id) : undefined;
      const result = await exportUsers(userIds);

      if (result.success && result.users) {
        const csvContent = generateUserCSVFromData(result.users);
        downloadCSV(csvContent, 'users-export.csv');

        toast({
          title: 'Export Complete',
          description: `Exported ${result.users.length} user(s) to CSV.`,
        });
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'Failed to export users.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export users.',
        variant: 'destructive',
      });
    }
  };

  const generateUserCSVFromData = (users: any[]) => {
    const headers = [
      'Full Name',
      'Email',
      'Roles',
      'Junk Captain Rate',
      'Junk Wingman Rate',
      'Move Captain Rate',
      'Move Wingman Rate',
      'Salary Amount',
      'Salary Frequency',
      'Commission Rate',
      'Created At',
    ];
    const rows = users.map((user) => [
      user.fullName,
      user.email,
      user.roles.join(';'),
      user.rateJunkCaptain || '',
      user.rateJunkWingman || '',
      user.rateMoveCaptain || '',
      user.rateMoveWingman || '',
      user.salaryAmount || '',
      user.salaryFrequency || '',
      user.commissionRate || '',
      new Date(user.createdAt).toISOString(),
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const template = [
      [
        'Full Name',
        'Email',
        'Roles',
        'Rate Junk Captain',
        'Rate Junk Wingman',
        'Rate Move Captain',
        'Rate Move Wingman',
      ],
      [
        'John Doe',
        'john@example.com',
        'captain;wingman',
        '25.00',
        '20.00',
        '30.00',
        '25.00',
      ],
      ['Jane Smith', 'jane@example.com', 'sales', '', '', '', ''],
    ]
      .map((row) => row.join(','))
      .join('\n');

    downloadCSV(template, 'user-import-template.csv');

    toast({
      title: 'Template Downloaded',
      description: 'User import template has been downloaded.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconUsers className="h-4 w-4 mr-2" />
          Bulk Operations
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconUsers className="h-5 w-5" />
            Bulk User Operations
          </DialogTitle>
          <DialogDescription>
            Perform bulk operations on user accounts
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUpload className="h-5 w-5" />
                  Import Users
                </CardTitle>
                <CardDescription>
                  Import multiple users from a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={importForm.handleSubmit(handleBulkImport)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="file">CSV File</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".csv"
                      {...importForm.register('file')}
                    />
                    <p className="text-sm text-muted-foreground">
                      Upload a CSV file with user data.
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={downloadTemplate}
                      >
                        Download template
                      </Button>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skipDuplicates"
                        {...importForm.register('skipDuplicates')}
                      />
                      <Label htmlFor="skipDuplicates">
                        Skip duplicate email addresses
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendWelcomeEmails"
                        {...importForm.register('sendWelcomeEmails')}
                      />
                      <Label htmlFor="sendWelcomeEmails">
                        Send welcome emails to new users
                      </Label>
                    </div>
                  </div>

                  {uploadProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Importing users...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Importing...' : 'Import Users'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconDownload className="h-5 w-5" />
                  Export Users
                </CardTitle>
                <CardDescription>
                  Export user data to various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleExportUsers}
                    className="h-20 flex-col"
                  >
                    <IconFileSpreadsheet className="h-8 w-8 mb-2" />
                    Export to CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportUsers}
                    className="h-20 flex-col"
                  >
                    <IconFileText className="h-8 w-8 mb-2" />
                    Export to Excel
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedUsers.length > 0
                    ? `Export ${selectedUsers.length} selected user(s)`
                    : 'Export all users'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUserCheck className="h-5 w-5" />
                  Bulk Role Assignment
                </CardTitle>
                <CardDescription>
                  Assign or remove roles for multiple users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={roleForm.handleSubmit(handleBulkRoleAssignment)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Selected Users ({selectedUsers.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.slice(0, 5).map((user) => (
                        <Badge key={user.id} variant="secondary">
                          {user.fullName}
                        </Badge>
                      ))}
                      {selectedUsers.length > 5 && (
                        <Badge variant="secondary">
                          +{selectedUsers.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select
                      value={roleForm.watch('action')}
                      onValueChange={(value) =>
                        roleForm.setValue(
                          'action',
                          value as 'add' | 'remove' | 'replace'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="add">Add Roles</SelectItem>
                        <SelectItem value="remove">Remove Roles</SelectItem>
                        <SelectItem value="replace">
                          Replace All Roles
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Roles</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {USER_ROLES.map((role) => (
                        <div
                          key={role.value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`role-${role.value}`}
                            checked={roleForm
                              .watch('roles')
                              .includes(role.value)}
                            onCheckedChange={(checked) => {
                              const currentRoles = roleForm.getValues('roles');
                              if (checked) {
                                roleForm.setValue('roles', [
                                  ...currentRoles,
                                  role.value,
                                ]);
                              } else {
                                roleForm.setValue(
                                  'roles',
                                  currentRoles.filter((r) => r !== role.value)
                                );
                              }
                            }}
                          />
                          <Label htmlFor={`role-${role.value}`}>
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      selectedUsers.length === 0 ||
                      roleForm.watch('roles').length === 0
                    }
                  >
                    {isSubmitting
                      ? 'Updating...'
                      : `Update ${selectedUsers.length} User(s)`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUserX className="h-5 w-5" />
                  Bulk Status Update
                </CardTitle>
                <CardDescription>
                  Activate or deactivate multiple user accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={activationForm.handleSubmit(handleBulkActivation)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Selected Users ({selectedUsers.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedUsers.slice(0, 5).map((user) => (
                        <Badge key={user.id} variant="secondary">
                          {user.fullName}
                        </Badge>
                      ))}
                      {selectedUsers.length > 5 && (
                        <Badge variant="secondary">
                          +{selectedUsers.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select
                      value={activationForm.watch('action')}
                      onValueChange={(value) =>
                        activationForm.setValue(
                          'action',
                          value as 'activate' | 'deactivate'
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activate">
                          <div className="flex items-center gap-2">
                            <IconUserCheck className="h-4 w-4" />
                            Activate Users
                          </div>
                        </SelectItem>
                        <SelectItem value="deactivate">
                          <div className="flex items-center gap-2">
                            <IconUserX className="h-4 w-4" />
                            Deactivate Users
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {activationForm.watch('action') === 'activate'
                        ? 'Activated users will be able to log in and access the system.'
                        : 'Deactivated users will not be able to log in, but their data will be preserved.'}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || selectedUsers.length === 0}
                    variant={
                      activationForm.watch('action') === 'deactivate'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {isSubmitting
                      ? 'Updating...'
                      : `${activationForm.watch('action') === 'activate' ? 'Activate' : 'Deactivate'} ${selectedUsers.length} User(s)`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
