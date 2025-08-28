'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconArrowLeft,
  IconEdit,
  IconCopy,
  IconTrash,
  IconMail,
  IconCalendar,
  IconUser,
  IconCurrencyDollar,
  IconPercentage,
  IconTarget,
  IconClock,
  IconBriefcase,
  IconShield,
} from '@tabler/icons-react';
// Remove Prisma import - use number type instead

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { deleteUser } from '@/lib/actions/users';
import { formatDate, formatDateDisplay } from '@/lib/formatters';
import { UserFormDialog } from './user-form-dialog';
import { CopySettingsDialog } from './copy-settings-dialog';

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

interface UserDetailViewProps {
  user: User;
}

const USER_ROLES: {
  value: string;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'admin',
    label: 'Admin',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: IconShield,
  },
  {
    value: 'manager',
    label: 'Manager',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: IconBriefcase,
  },
  {
    value: 'captain',
    label: 'Captain',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: IconUser,
  },
  {
    value: 'sales',
    label: 'Sales',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: IconCurrencyDollar,
  },
  {
    value: 'wingman',
    label: 'Wingman',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    icon: IconUser,
  },
];

const SALARY_TYPES: { [key: string]: { label: string; description: string } } =
  {
    base: {
      label: 'Base Salary',
      description: 'Replaces hourly wages entirely',
    },
    guaranteed: {
      label: 'Guaranteed Salary',
      description: 'Minimum guarantee (whichever is higher)',
    },
    supplemental: {
      label: 'Supplemental Salary',
      description: 'Added on top of other earnings',
    },
  };

const SALARY_FREQUENCIES: { [key: string]: string } = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly: 'Monthly',
};

export function UserDetailView({ user }: UserDetailViewProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const formatPercentage = (value?: number | null) => {
    if (!value) return '-';
    // Commission rates are stored as percentages (e.g., 5 for 5%)
    // So we don't need to multiply by 100
    return `${Number(value).toFixed(1)}%`;
  };

  const formatDecimalAsPercentage = (value?: number | null) => {
    if (!value) return '-';
    return `${(Number(value) * 100).toFixed(1)}%`;
  };

  const getRoleInfo = (role: string) => {
    return (
      USER_ROLES.find((r) => r.value === role) || {
        value: role,
        label: role,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        icon: IconUser,
      }
    );
  };

  const handleDeleteUser = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUser(user.id);
      if (result.success) {
        toast({
          title: 'User Deleted',
          description: `${user.fullName} has been deleted successfully.`,
        });
        router.push('/admin/users');
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
    } finally {
      setIsDeleting(false);
    }
  };

  const hourlyRates = [
    {
      label: 'Junk Captain',
      value: user.rateJunkCaptain,
      key: 'rateJunkCaptain',
    },
    {
      label: 'Junk Wingman',
      value: user.rateJunkWingman,
      key: 'rateJunkWingman',
    },
    {
      label: 'Move Captain',
      value: user.rateMoveCaptain,
      key: 'rateMoveCaptain',
    },
    {
      label: 'Move Wingman',
      value: user.rateMoveWingman,
      key: 'rateMoveWingman',
    },
    { label: 'Zigma', value: user.rateZigma, key: 'rateZigma' },
    { label: 'Training', value: user.rateTraining, key: 'rateTraining' },
    { label: 'Estimating', value: user.rateEstimating, key: 'rateEstimating' },
    { label: 'Warehouse', value: user.rateWarehouse, key: 'rateWarehouse' },
    { label: 'Admin', value: user.rateAdmin, key: 'rateAdmin' },
  ];

  const hasAnyRates = hourlyRates.some(
    (rate) => rate.value && Number(rate.value) > 0
  );
  const hasSalary = user.salaryAmount && Number(user.salaryAmount) > 0;
  const hasCommission = user.commissionRate && Number(user.commissionRate) > 0;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold md:text-2xl">
              {user.fullName}
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <IconMail className="h-4 w-4" />
              {user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserFormDialog
            mode="edit"
            user={user}
            trigger={
              <Button variant="outline" size="sm">
                <IconEdit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />
          <CopySettingsDialog
            sourceUser={user}
            trigger={
              <Button variant="outline" size="sm">
                <IconCopy className="h-4 w-4 mr-2" />
                Copy Settings
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {user.fullName}? This action
                  cannot be undone and will fail if the user has existing logs,
                  hours, or commission entries.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <IconShield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.roles.length}</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {user.roles.map((role) => {
                const roleInfo = getRoleInfo(role);
                return (
                  <Badge
                    key={role}
                    variant="secondary"
                    className={roleInfo.color}
                  >
                    {roleInfo.label}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary</CardTitle>
            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasSalary ? formatCurrency(user.salaryAmount) : 'None'}
            </div>
            {hasSalary && (
              <p className="text-xs text-muted-foreground">
                {user.salaryFrequency
                  ? SALARY_FREQUENCIES[user.salaryFrequency]
                  : ''}{' '}
                • {user.salaryType ? SALARY_TYPES[user.salaryType]?.label : ''}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission</CardTitle>
            <IconPercentage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasCommission ? formatPercentage(user.commissionRate) : 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasCommission ? 'Commission rate' : 'No commission set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(user.createdAt)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateDisplay(user.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="compensation" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="rates">Hourly Rates</TabsTrigger>
          <TabsTrigger value="bonuses">Bonus Goals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="compensation" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Salary Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCurrencyDollar className="h-5 w-5" />
                  Salary Information
                </CardTitle>
                <CardDescription>
                  Base salary and payment frequency settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasSalary ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Amount:</span>
                      <span className="text-lg font-semibold">
                        {formatCurrency(user.salaryAmount)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Frequency:</span>
                      <span>
                        {user.salaryFrequency
                          ? SALARY_FREQUENCIES[user.salaryFrequency]
                          : '-'}
                      </span>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Type:</span>
                      <div>
                        <div className="font-medium">
                          {user.salaryType
                            ? SALARY_TYPES[user.salaryType]?.label
                            : '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.salaryType
                            ? SALARY_TYPES[user.salaryType]?.description
                            : ''}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconCurrencyDollar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No salary configured</p>
                    <p className="text-sm">This user is paid hourly only</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commission Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPercentage className="h-5 w-5" />
                  Commission Settings
                </CardTitle>
                <CardDescription>
                  Sales commission rate and earnings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasCommission ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Commission Rate:
                      </span>
                      <span className="text-lg font-semibold">
                        {formatPercentage(user.commissionRate)}
                      </span>
                    </div>
                    <Separator />
                    <div className="text-sm text-muted-foreground">
                      Applied to matched job revenue when logs are approved
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <IconPercentage className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No commission configured</p>
                    <p className="text-sm">
                      This user does not earn commission
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconClock className="h-5 w-5" />
                Department Hourly Rates
              </CardTitle>
              <CardDescription>
                Hourly compensation rates for different departments and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasAnyRates ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {hourlyRates.map((rate) =>
                    rate.value && Number(rate.value) > 0 ? (
                      <div
                        key={rate.key}
                        className="flex justify-between items-center p-3 rounded-lg border"
                      >
                        <span className="font-medium">{rate.label}:</span>
                        <span className="text-lg font-semibold">
                          {formatCurrency(rate.value)}
                        </span>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <IconClock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hourly rates configured</p>
                  <p className="text-sm">
                    Set up department-specific hourly rates
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTarget className="h-5 w-5" />
                  Junk Bonus Goal
                </CardTitle>
                <CardDescription>
                  Labor cost percentage target for junk operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center py-4">
                  {formatDecimalAsPercentage(user.junkBonusGoal)}
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Target labor cost percentage for bonus eligibility
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconTarget className="h-5 w-5" />
                  Move Bonus Goal
                </CardTitle>
                <CardDescription>
                  Labor cost percentage target for move operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center py-4">
                  {formatDecimalAsPercentage(user.moveBonusGoal)}
                </div>
                <div className="text-sm text-muted-foreground text-center">
                  Target labor cost percentage for bonus eligibility
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Bonus Calculation</CardTitle>
              <CardDescription>
                How bonuses are calculated based on labor cost performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">Bonus Formula:</h4>
                <p className="text-sm text-muted-foreground">
                  Bonus = (Goal% - Actual%) × Captain Revenue
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Junk Operations:</h4>
                  <p className="text-sm text-muted-foreground">
                    If actual labor cost is below{' '}
                    {formatDecimalAsPercentage(user.junkBonusGoal)}, captain
                    earns bonus on the difference
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Move Operations:</h4>
                  <p className="text-sm text-muted-foreground">
                    If actual labor cost is below{' '}
                    {formatDecimalAsPercentage(user.moveBonusGoal)}, captain
                    earns bonus on the difference
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
              <CardDescription>
                User account creation and modification history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                <IconCalendar className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-medium">Account Created</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg border">
                <IconEdit className="h-8 w-8 text-muted-foreground" />
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(user.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
