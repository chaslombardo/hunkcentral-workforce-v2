'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconPlus, IconEdit } from '@tabler/icons-react';
import { Decimal } from '@prisma/client/runtime/library';

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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import { CreateUserSchema, UpdateUserSchema } from '@/lib/validations';
import type { CreateUserFormData, UpdateUserFormData } from '@/lib/validations';
import type { UserRole, SalaryFrequency, SalaryType } from '@/types';
import { createUser, updateUser } from '@/lib/actions/users';

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

interface UserFormDialogProps {
  mode: 'create' | 'edit';
  user?: User;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function UserFormDialog({ 
  mode, 
  user, 
  trigger, 
  onSuccess 
}: UserFormDialogProps) {
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