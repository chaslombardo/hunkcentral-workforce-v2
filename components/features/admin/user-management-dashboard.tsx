'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconPlus,
  IconUsers,
  IconMail,
  IconCalendar,
  IconEdit,
  IconTrash,
  IconCopy,
} from '@tabler/icons-react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

import { CreateUserSchema, UpdateUserSchema } from '@/lib/validations';
import type { CreateUserFormData, UpdateUserFormData, UserSearchFormData } from '@/lib/validations';
import type { UserRole, SalaryFrequency, SalaryType } from '@/types';
import { getUsers, createUser, updateUser, deleteUser, copyUserSettings } from '@/lib/actions/users';

import { Decimal } from '@prisma/client/runtime/library';

interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  rateJunkCaptain?: Decimal | null;
  rateJunkWingman?: Decimal | null;
  rateMoveCaptain?: Decimal | null;
  rateMoveWingman?: Decimal | null;
  rateZigma?: Decimal | null;
  rateTraining?: Decimal | null;
  rateEstimating?: Decimal | null;
  rateWarehouse?: Decimal | null;
  rateAdmin?: Decimal | null;
  salaryAmount?: Decimal | null;
  salaryFrequency?: string | null;
  salaryType?: string | null;
  commissionRate?: Decimal | null;
  junkBonusGoal: Decimal;
  moveBonusGoal: Decimal;
  createdAt: Date;
  updatedAt: Date;
}

interface UserListData {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const USER_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  { value: 'manager', label: 'Manager', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  { value: 'captain', label: 'Captain', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'sales', label: 'Sales', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  { value: 'wingman', label: 'Wingman', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
];

const SALARY_FREQUENCIES: { value: SalaryFrequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const SALARY_TYPES: { value: SalaryType; label: string; description: string }[] = [
  { value: 'base', label: 'Base Salary', description: 'Replaces hourly wages entirely' },
  { value: 'guaranteed', label: 'Guaranteed Salary', description: 'Minimum guarantee (whichever is higher)' },
  { value: 'supplemental', label: 'Supplemental Salary', description: 'Added on top of other earnings' },
];

function UserFormDialog({ 
  mode, 
  user, 
  trigger, 
  onSuccess 
}: { 
  mode: 'create' | 'edit';
  user?: User;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(mode === 'create' ? CreateUserSchema : UpdateUserSchema),
    defaultValues: mode === 'edit' && user ? {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: (user.roles || []) as UserRole[],
      rateJunkCaptain: user.rateJunkCaptain ? Number(user.rateJunkCaptain) : undefined,
      rateJunkWingman: user.rateJunkWingman ? Number(user.rateJunkWingman) : undefined,
      rateMoveCaptain: user.rateMoveCaptain ? Number(user.rateMoveCaptain) : undefined,
      rateMoveWingman: user.rateMoveWingman ? Number(user.rateMoveWingman) : undefined,
      rateZigma: user.rateZigma ? Number(user.rateZigma) : undefined,
      rateTraining: user.rateTraining ? Number(user.rateTraining) : undefined,
      rateEstimating: user.rateEstimating ? Number(user.rateEstimating) : undefined,
      rateWarehouse: user.rateWarehouse ? Number(user.rateWarehouse) : undefined,
      rateAdmin: user.rateAdmin ? Number(user.rateAdmin) : undefined,
      salaryAmount: user.salaryAmount ? Number(user.salaryAmount) : undefined,
      salaryFrequency: user.salaryFrequency as SalaryFrequency || undefined,
      salaryType: user.salaryType as SalaryType || undefined,
      commissionRate: user.commissionRate ? Number(user.commissionRate) : undefined,
      junkBonusGoal: Number(user.junkBonusGoal) || 0.14,
      moveBonusGoal: Number(user.moveBonusGoal) || 0.24,
    } : {
      roles: [],
      junkBonusGoal: 0.14,
      moveBonusGoal: 0.24,
    },
  });

  const onSubmit = async (data: CreateUserFormData | UpdateUserFormData) => {
    setIsSubmitting(true);
    try {
      const result = mode === 'create' 
        ? await createUser(data as CreateUserFormData)
        : await updateUser(data as UpdateUserFormData);

      if (result.success) {
        toast({
          title: mode === 'create' ? 'User Created' : 'User Updated',
          description: `${result.user?.fullName} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
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

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    const currentRoles = form.getValues('roles') || [];
    if (checked) {
      form.setValue('roles', [...currentRoles, role]);
    } else {
      form.setValue('roles', currentRoles.filter(r => r !== role));
    }
  };

  const defaultTrigger = (
    <Button variant={mode === 'create' ? 'default' : 'ghost'} size={mode === 'create' ? 'default' : 'sm'}>
      {mode === 'create' ? (
        <>
          <IconPlus className="h-4 w-4 mr-2" />
          Add User
        </>
      ) : (
        <IconEdit className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Create New User' : `Edit User: ${user?.fullName}`}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Add a new employee with their compensation settings and role assignments.'
                : 'Update employee information, compensation settings, and role assignments.'
              }
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="rates">Hourly Rates</TabsTrigger>
              <TabsTrigger value="salary">Salary & Commission</TabsTrigger>
              <TabsTrigger value="bonuses">Bonus Goals</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Employee contact information and role assignments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        {...form.register('fullName')}
                        placeholder="John Doe"
                      />
                      {form.formState.errors.fullName && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.fullName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        placeholder="john@collegehunks.com"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {mode === 'create' && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        {...form.register('password')}
                        placeholder="Minimum 8 characters"
                      />
                      {form.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                  )}

                  {mode === 'edit' && (
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password (optional)</Label>
                      <Input
                        id="password"
                        type="password"
                        {...form.register('password')}
                        placeholder="Leave blank to keep current password"
                      />
                      {form.formState.errors.password && (
                        <p className="text-sm text-red-600">
                          {form.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label>Role Assignments</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {USER_ROLES.map((role) => (
                        <Label
                          key={role.value}
                          className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/5"
                        >
                          <Checkbox
                            checked={form.watch('roles')?.includes(role.value) || false}
                            onCheckedChange={(checked) => 
                              handleRoleChange(role.value, checked as boolean)
                            }
                            className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />
                          <div className="grid gap-1.5 font-normal">
                            <p className="text-sm font-medium leading-none">
                              {role.label}
                            </p>
                          </div>
                        </Label>
                      ))}
                    </div>
                    {form.formState.errors.roles && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.roles.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Department Hourly Rates</CardTitle>
                  <CardDescription>
                    Set hourly rates for different departments and roles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rateJunkCaptain">Junk Captain Rate</Label>
                      <Input
                        id="rateJunkCaptain"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateJunkCaptain', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateJunkWingman">Junk Wingman Rate</Label>
                      <Input
                        id="rateJunkWingman"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateJunkWingman', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateMoveCaptain">Move Captain Rate</Label>
                      <Input
                        id="rateMoveCaptain"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateMoveCaptain', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateMoveWingman">Move Wingman Rate</Label>
                      <Input
                        id="rateMoveWingman"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateMoveWingman', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateZigma">Zigma Rate</Label>
                      <Input
                        id="rateZigma"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateZigma', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateTraining">Training Rate</Label>
                      <Input
                        id="rateTraining"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateTraining', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateEstimating">Estimating Rate</Label>
                      <Input
                        id="rateEstimating"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateEstimating', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateWarehouse">Warehouse Rate</Label>
                      <Input
                        id="rateWarehouse"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateWarehouse', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rateAdmin">Admin Rate</Label>
                      <Input
                        id="rateAdmin"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('rateAdmin', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="salary" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Salary & Commission Settings</CardTitle>
                  <CardDescription>
                    Configure salary and commission compensation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salaryAmount">Salary Amount</Label>
                      <Input
                        id="salaryAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('salaryAmount', { valueAsNumber: true })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salaryFrequency">Salary Frequency</Label>
                      <Select
                        value={form.watch('salaryFrequency') || ''}
                        onValueChange={(value) => 
                          form.setValue('salaryFrequency', value as SalaryFrequency)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {SALARY_FREQUENCIES.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Salary Type</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {SALARY_TYPES.map((type) => (
                        <Label
                          key={type.value}
                          className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/5"
                        >
                          <Checkbox
                            checked={form.watch('salaryType') === type.value}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue('salaryType', type.value);
                              } else {
                                form.setValue('salaryType', undefined);
                              }
                            }}
                            className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />
                          <div className="grid gap-1.5 font-normal">
                            <p className="text-sm font-medium leading-none">
                              {type.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {type.description}
                            </p>
                          </div>
                        </Label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...form.register('commissionRate', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bonuses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bonus Goal Settings</CardTitle>
                  <CardDescription>
                    Set labor cost percentage goals for bonus calculations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="junkBonusGoal">Junk Bonus Goal (%)</Label>
                      <Input
                        id="junkBonusGoal"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        {...form.register('junkBonusGoal', { valueAsNumber: true })}
                        placeholder="0.14"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 14% (0.14)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="moveBonusGoal">Move Bonus Goal (%)</Label>
                      <Input
                        id="moveBonusGoal"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        {...form.register('moveBonusGoal', { valueAsNumber: true })}
                        placeholder="0.24"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 24% (0.24)
                      </p>
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
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CopySettingsDialog({ 
  sourceUser, 
  trigger, 
  onSuccess 
}: { 
  sourceUser: User;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}) {
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
    <Button variant="ghost" size="sm">
      <IconCopy className="h-4 w-4" />
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

export function UserManagementDashboard() {
  const [data, setData] = useState<UserListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const { toast } = useToast();

  const searchForm = useForm({
    defaultValues: {
      search: '',
      roles: [] as UserRole[],
      sortBy: 'fullName' as const,
      sortOrder: 'asc' as const,
      page: 1,
      limit: 10,
    },
  });

  const loadUsers = useCallback(async (params?: UserSearchFormData) => {
    setLoading(true);
    try {
      const result = await getUsers(params);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load users',
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
    loadUsers();
  }, [loadUsers]);

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        toast({
          title: 'User Deleted',
          description: `${userName} has been deleted successfully.`,
        });
        loadUsers(searchForm.getValues());
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
        description: 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedUsers = selectedRows.map(row => row.original);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const user of selectedUsers) {
      try {
        const result = await deleteUser(user.id);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${user.fullName}: ${result.error}`);
        }
      } catch {
        errorCount++;
        errors.push(`${user.fullName}: Failed to delete`);
      }
    }

    // Clear selection
    setRowSelection({});

    // Show results
    if (successCount > 0) {
      toast({
        title: 'Bulk Delete Results',
        description: `Successfully deleted ${successCount} user(s)${errorCount > 0 ? `, ${errorCount} failed` : ''}.`,
      });
    }

    if (errorCount > 0 && errors.length > 0) {
      toast({
        title: 'Delete Errors',
        description: errors.slice(0, 3).join('; ') + (errors.length > 3 ? '...' : ''),
        variant: 'destructive',
      });
    }

    // Reload users
    loadUsers(searchForm.getValues());
  };

  const getRoleColor = (role: string) => {
    return USER_ROLES.find(r => r.value === role)?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatCurrency = (amount?: Decimal | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'fullName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.fullName}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <IconMail className="h-4 w-4 text-muted-foreground" />
          {row.original.email}
        </div>
      ),
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles.map((role) => (
            <Badge
              key={role}
              variant="secondary"
              className={getRoleColor(role)}
            >
              {USER_ROLES.find(r => r.value === role)?.label || role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'compensation',
      header: 'Compensation',
      cell: ({ row }) => (
        <div className="text-sm space-y-1">
          {row.original.salaryAmount && (
            <div>Salary: {formatCurrency(row.original.salaryAmount)}</div>
          )}
          {row.original.commissionRate && (
            <div>Commission: {Number(row.original.commissionRate)}%</div>
          )}
          {!row.original.salaryAmount && !row.original.commissionRate && (
            <span className="text-muted-foreground">Hourly only</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconCalendar className="h-4 w-4" />
          {new Date(row.original.createdAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <IconDotsVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <UserFormDialog
              mode="edit"
              user={row.original}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <IconEdit className="h-4 w-4 mr-2" />
                  Edit User
                </DropdownMenuItem>
              }
              onSuccess={() => loadUsers(searchForm.getValues())}
            />
            <CopySettingsDialog
              sourceUser={row.original}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <IconCopy className="h-4 w-4 mr-2" />
                  Copy Settings
                </DropdownMenuItem>
              }
              onSuccess={() => loadUsers(searchForm.getValues())}
            />
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-red-600"
                >
                  <IconTrash className="h-4 w-4 mr-2" />
                  Delete User
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {row.original.fullName}? 
                    This action cannot be undone and will fail if the user 
                    has existing logs, hours, or commission entries.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteUser(row.original.id, row.original.fullName)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.users || [],
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const onSearch = (searchData: UserSearchFormData) => {
    loadUsers(searchData);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold md:text-2xl">User Management</h1>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <h3 className="text-2xl font-bold tracking-tight">Loading Users...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold md:text-2xl">User Management</h1>
          <p className="text-muted-foreground">
            Manage employee accounts, roles, and compensation settings
          </p>
        </div>
        <UserFormDialog mode="create" onSuccess={() => loadUsers(searchForm.getValues())} />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsers className="h-5 w-5" />
            Users ({data?.pagination.total || 0})
          </CardTitle>
          <CardDescription>
            Search and filter users by name, email, or role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={searchForm.handleSubmit(onSearch)} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or email..."
                  {...searchForm.register('search')}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Role Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Filter by Roles</Label>
              <div className="flex flex-wrap gap-2">
                {USER_ROLES.map((role) => (
                  <Label
                    key={role.value}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-accent/50 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-primary/5"
                  >
                    <Checkbox
                      checked={searchForm.watch('roles')?.includes(role.value) || false}
                      onCheckedChange={(checked) => {
                        const currentRoles = searchForm.getValues('roles') || [];
                        if (checked) {
                          searchForm.setValue('roles', [...currentRoles, role.value]);
                        } else {
                          searchForm.setValue('roles', currentRoles.filter(r => r !== role.value));
                        }
                        // Auto-submit when role filter changes
                        searchForm.handleSubmit(onSearch)();
                      }}
                      className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm">{role.label}</span>
                  </Label>
                ))}
              </div>
              
              {/* Clear Filters */}
              {(searchForm.watch('search') || (searchForm.watch('roles')?.length || 0) > 0) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    searchForm.reset({
                      search: '',
                      roles: [],
                      sortBy: 'fullName',
                      sortOrder: 'asc',
                      page: 1,
                      limit: 10,
                    });
                    loadUsers();
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {table.getFilteredSelectedRowModel().rows.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} user(s) selected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRowSelection({})}
                >
                  Clear Selection
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <IconTrash className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {table.getFilteredSelectedRowModel().rows.length} selected user(s)? 
                        This action cannot be undone and will fail for users with existing logs, hours, or commission entries.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Selected
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {data?.users.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm min-h-[400px]">
              <div className="flex flex-col items-center gap-1 text-center">
                <IconUsers className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight">No users found</h3>
                <p className="text-muted-foreground">
                  Get started by creating your first user
                </p>
                <UserFormDialog mode="create" onSuccess={() => loadUsers()} />
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.pagination.pages > 1 && (
                <div className="flex items-center justify-between p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                    {data.pagination.total} users
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(0)}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                      disabled={!table.getCanNextPage()}
                    >
                      <IconChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}