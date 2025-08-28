'use client';

import { useState, useEffect } from 'react';
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
  IconTrendingUp,
  IconTrendingDown,
  IconMinus,
  IconAward,
  IconChartBar,
  IconUsers,
  IconStar,
  IconActivity,
  IconCrown,
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
import {
  getEmployeePerformanceStats,
  type EmployeePerformanceStats,
} from '@/lib/actions/employee-stats';
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

// Employee Stats Content Component
function EmployeeStatsContent({ userId }: { userId: string }) {
  const [stats, setStats] = useState<EmployeePerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const formatPercentage = (value?: number | null) => {
    if (!value && value !== 0) return '-';
    return `${Number(value).toFixed(1)}%`;
  };

  const formatChange = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <IconTrendingUp className="h-3 w-3" />+{formatPercentage(value)}
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <IconTrendingDown className="h-3 w-3" />
          {formatPercentage(value)}
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-gray-500">
          <IconMinus className="h-3 w-3" />
          No change
        </div>
      );
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return IconAward;
      case 'performance':
        return IconTarget;
      case 'milestone':
        return IconStar;
      default:
        return IconActivity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'achievement':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'performance':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      case 'milestone':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-950';
    }
  };

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'junk':
        return 'text-green-600';
      case 'move':
        return 'text-orange-600';
      case 'zigma':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await getEmployeePerformanceStats(userId);
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          setError(result.error || 'Failed to load employee stats');
        }
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconChartBar className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Unable to Load Employee Stats
          </h3>
          <p className="text-gray-500 text-center max-w-sm">
            {error || 'Employee performance data is currently unavailable.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBriefcase className="h-5 w-5" />
              Jobs Completed
            </CardTitle>
            <CardDescription>Current pay period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-center py-2">
              {stats.currentPeriod.totalJobs}
            </div>
            <div className="text-sm text-muted-foreground text-center">
              {formatChange(stats.trends.jobsChange)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCurrencyDollar className="h-5 w-5" />
              Revenue Generated
            </CardTitle>
            <CardDescription>Current pay period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-center py-2">
              {formatCurrency(stats.currentPeriod.totalRevenue)}
            </div>
            <div className="text-sm text-muted-foreground text-center">
              {formatChange(stats.trends.revenueChange)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconTarget className="h-5 w-5" />
              Efficiency Rating
            </CardTitle>
            <CardDescription>Labor cost percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-bold text-center py-2 ${
                stats.currentPeriod.efficiency < 15
                  ? 'text-green-600'
                  : stats.currentPeriod.efficiency < 20
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {formatPercentage(stats.currentPeriod.efficiency)}
            </div>
            <div className="text-sm text-muted-foreground text-center">
              {stats.currentPeriod.efficiency < 15
                ? 'Excellent efficiency ✓'
                : stats.currentPeriod.efficiency < 20
                  ? 'Good efficiency'
                  : 'Needs improvement'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total Hours</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.currentPeriod.totalHours.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.currentPeriod.avgHoursPerDay.toFixed(1)}h/day avg
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tips Earned</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.currentPeriod.totalTips)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatCurrency(stats.workPattern.avgTipsPerDay)}/day avg
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconChartBar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Avg Job Value</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.currentPeriod.avgRevenuePerJob)}
            </div>
            <div className="text-xs text-muted-foreground">
              Per completed job
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconUsers className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Days Worked</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.workPattern.totalDaysWorked}
            </div>
            <div className="text-xs text-muted-foreground">This period</div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings and Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCrown className="h-5 w-5" />
            Performance Rankings
          </CardTitle>
          <CardDescription>
            Your performance compared to other team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-blue-600">
                #{stats.rankings.revenueRank}
              </div>
              <div className="text-sm font-medium">Revenue Rank</div>
              <div className="text-xs text-muted-foreground">
                of {stats.rankings.totalEmployees} employees
              </div>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-green-600">
                #{stats.rankings.efficiencyRank}
              </div>
              <div className="text-sm font-medium">Efficiency Rank</div>
              <div className="text-xs text-muted-foreground">
                of {stats.rankings.totalEmployees} employees
              </div>
            </div>
            <div className="text-center p-4 rounded-lg border">
              <div className="text-2xl font-bold text-purple-600">
                #{stats.rankings.jobsRank}
              </div>
              <div className="text-sm font-medium">Jobs Rank</div>
              <div className="text-xs text-muted-foreground">
                of {stats.rankings.totalEmployees} employees
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>
            Performance metrics by department type
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.departmentBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {stats.departmentBreakdown.map((dept) => (
                <div
                  key={dept.department}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div
                      className={`font-semibold capitalize ${getDepartmentColor(dept.department)}`}
                    >
                      {dept.department} Operations
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {dept.jobs} jobs • {dept.hours.toFixed(1)} hours
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(dept.revenue)}
                    </div>
                    <div
                      className={`text-sm ${
                        dept.efficiency < 15
                          ? 'text-green-600'
                          : dept.efficiency < 20
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {formatPercentage(dept.efficiency)} efficiency
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconChartBar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No department data available</p>
              <p className="text-sm">
                Complete some jobs to see department breakdown
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconActivity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Recent achievements and performance highlights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {stats.recentActivity.map((activity, index) => {
                const Icon = getActivityIcon(activity.type);
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-3 rounded-lg border-l-4 ${getActivityColor(activity.type)}`}
                  >
                    <Icon className="h-5 w-5" />
                    <div className="flex-1">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.description}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <IconActivity className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-sm">
                Activity will appear as you complete jobs and hit milestones
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Pattern Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Work Pattern Insights</CardTitle>
          <CardDescription>
            Analysis of your work patterns and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Primary Department:</span>
                <Badge variant="outline" className="capitalize">
                  {stats.workPattern.mostCommonDepartment}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Days Worked:</span>
                <span className="font-medium">
                  {stats.workPattern.totalDaysWorked}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Avg Tips Per Day:</span>
                <span className="font-medium">
                  {formatCurrency(stats.workPattern.avgTipsPerDay)}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {stats.workPattern.busiestDay && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Busiest Day:</span>
                  <span className="font-medium">
                    {new Date(
                      stats.workPattern.busiestDay
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              {stats.workPattern.highestTipDay && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Best Tip Day:</span>
                  <span className="font-medium">
                    {new Date(
                      stats.workPattern.highestTipDay
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Avg Hours/Day:</span>
                <span className="font-medium">
                  {stats.currentPeriod.avgHoursPerDay.toFixed(1)}h
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
      <Tabs defaultValue="employee-stats" className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employee-stats">Employee Stats</TabsTrigger>
          <TabsTrigger value="compensation">Compensation</TabsTrigger>
          <TabsTrigger value="bonuses">Bonus Goals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="employee-stats" className="space-y-4">
          <EmployeeStatsContent userId={user.id} />
        </TabsContent>

        <TabsContent value="compensation" className="space-y-4">
          {/* Hourly Rates Section */}
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

          {/* Salary and Commission Section */}
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
