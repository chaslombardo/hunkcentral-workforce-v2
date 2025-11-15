'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconUsers,
  IconMail,
  IconCalendar,
  IconEdit,
  IconTrash,
  IconCopy,
  IconShield,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconUser,
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
import { BrandButton } from '@/components/brand/brand-button';
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

import type { UserSearchFormData } from '@/lib/validations';
import type { UserRole } from '@/types';
import { getUsers, deleteUser, setUserActiveStatus } from '@/lib/actions/users';
import { convertUserDecimalFields } from '@/lib/decimal-utils';
import { formatDateDisplay } from '@/lib/formatters';
import { UserFormDialog } from './user-form-dialog';
import { CopySettingsDialog } from './copy-settings-dialog';
import { PermissionManagementDialog } from './permission-management-dialog';
import { BulkPermissionDialog } from './bulk-permission-dialog';
import { BulkUserOperations } from './bulk-user-operations';
import { useSession } from '@/hooks/useSession';

// Remove Prisma import - use number type instead

interface User {
  id: string;
  username?: string | null;
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
  isActive: boolean;
  deactivatedAt?: Date | null;
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
  {
    value: 'admin',
    label: 'Admin',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  {
    value: 'manager',
    label: 'Manager',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  {
    value: 'captain',
    label: 'Captain',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  {
    value: 'sales',
    label: 'Sales',
    color:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  {
    value: 'wingman',
    label: 'Wingman',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  },
];

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
  const router = useRouter();
  const { user: sessionUser, refreshSession } = useSession();
  const [statusMutations, setStatusMutations] = useState<
    Record<string, boolean>
  >({});
  const [impersonationStates, setImpersonationStates] = useState<
    Record<string, boolean>
  >({});

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

  const loadUsers = useCallback(
    async (params?: UserSearchFormData) => {
      setLoading(true);
      try {
        const result = await getUsers(params);
        if (result.success && result.data) {
          // Convert decimal fields to numbers for TypeScript compatibility
          const convertedData = {
            ...result.data,
            users: result.data.users.map(convertUserDecimalFields),
          };
          setData(convertedData);
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
    },
    [toast]
  );

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

  const handleStatusChange = async (
    userId: string,
    fullName: string,
    nextStatus: boolean
  ) => {
    setStatusMutations((prev) => ({ ...prev, [userId]: true }));
    try {
      const result = await setUserActiveStatus(userId, nextStatus);
      if (!result.success) {
        throw new Error(result.error || 'Failed to update status');
      }
      toast({
        title: nextStatus ? 'User Activated' : 'User Deactivated',
        description: `${fullName} has been ${nextStatus ? 're-activated' : 'deactivated'}.`,
      });
      loadUsers(searchForm.getValues());
    } catch (error) {
      toast({
        title: 'Status Update Failed',
        description:
          error instanceof Error ? error.message : 'Unable to update status',
        variant: 'destructive',
      });
    } finally {
      setStatusMutations((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleViewAsUser = async (userId: string, fullName: string) => {
    setImpersonationStates((prev) => ({ ...prev, [userId]: true }));
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to start impersonation');
      }

      await refreshSession();
      toast({
        title: 'Impersonation Activated',
        description: `You are now viewing the app as ${fullName}.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Impersonation Failed',
        description:
          error instanceof Error ? error.message : 'Unable to impersonate user',
        variant: 'destructive',
      });
    } finally {
      setImpersonationStates((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleEditUser = async (userId: string) => {
    try {
      // The UserFormDialog will handle the edit, so we don't need this function
      // The edit functionality is now handled by the UserFormDialog modal
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open edit dialog',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedUsers = selectedRows.map((row) => row.original);

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
        description:
          errors.slice(0, 3).join('; ') + (errors.length > 3 ? '...' : ''),
        variant: 'destructive',
      });
    }

    // Reload users
    loadUsers(searchForm.getValues());
  };

  const getRoleColor = (role: string) => {
    return (
      USER_ROLES.find((r) => r.value === role)?.color ||
      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    );
  };

  const formatCurrency = (amount?: number | null) => {
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Name
          {column.getIsSorted() === 'asc' ? (
            <IconChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <Link
          href={`/admin/users/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.fullName}
        </Link>
      ),
    },
    {
      accessorKey: 'username',
      header: 'Username',
      cell: ({ row }) =>
        row.original.username ? (
          <span className="font-mono text-sm">@{row.original.username}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Email
          {column.getIsSorted() === 'asc' ? (
            <IconChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
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
              {USER_ROLES.find((r) => r.value === role)?.label || role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isMutating = statusMutations[row.original.id];
        const isSelf = sessionUser?.id === row.original.id;
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={row.original.isActive}
              disabled={isMutating || isSelf}
              onCheckedChange={(checked) =>
                handleStatusChange(
                  row.original.id,
                  row.original.fullName,
                  checked
                )
              }
            />
            <span
              className={`text-sm font-medium ${row.original.isActive ? 'text-green-600' : 'text-red-600'}`}
            >
              {row.original.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          Created
          {column.getIsSorted() === 'asc' ? (
            <IconChevronUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <IconChevronDown className="ml-2 h-4 w-4" />
          ) : (
            <IconChevronDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconCalendar className="h-4 w-4" />
          {formatDateDisplay(row.original.createdAt)}
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
            <PermissionManagementDialog
              user={{
                ...row.original,
                roles: row.original.roles as UserRole[],
              }}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <IconShield className="h-4 w-4 mr-2" />
                  Manage Permissions
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
                    This action cannot be undone and will fail if the user has
                    existing logs, hours, or commission entries.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      handleDeleteUser(row.original.id, row.original.fullName)
                    }
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

    {
      id: 'quick-actions',
      header: 'Quick Actions',
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={
              sessionUser?.id === row.original.id ||
              impersonationStates[row.original.id] ||
              !row.original.isActive
            }
            onClick={() =>
              handleViewAsUser(row.original.id, row.original.fullName)
            }
          >
            <IconUser className="mr-1 h-4 w-4" />
            {impersonationStates[row.original.id] ? 'Switching…' : 'View as'}
          </Button>
          <UserFormDialog
            mode="edit"
            user={row.original}
            onSuccess={() => loadUsers(searchForm.getValues())}
            trigger={
              <Button variant="secondary" size="sm">
                <IconEdit className="h-4 w-4" />
                Edit
              </Button>
            }
          />
        </div>
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
            <h3 className="text-2xl font-bold tracking-tight">
              Loading Users...
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:gap-8 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-hunks-green/5 via-background to-hunks-orange/5 rounded-lg p-6 border border-hunks-green/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-hunks-green mb-3">
              User Management
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Manage employee accounts, roles, and compensation settings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BulkUserOperations
              selectedUsers={[]}
              onSuccess={() => loadUsers(searchForm.getValues())}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <BrandButton variant="outline-primary" size="sm">
                  Columns
                  <IconChevronDown className="ml-2 h-4 w-4" />
                </BrandButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== 'undefined' &&
                      column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
            <UserFormDialog
              mode="create"
              onSuccess={() => loadUsers(searchForm.getValues())}
            />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-hunks-green/20 bg-gradient-to-br from-hunks-green/5 via-background to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl text-hunks-green">
            <IconUsers className="h-6 w-6" />
            Users ({data?.pagination.total || 0})
          </CardTitle>
          <CardDescription className="text-base">
            Search and filter users by name, email, or role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={searchForm.handleSubmit(onSearch)}
            className="space-y-6"
          >
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or role..."
                  className="pl-10 h-12 text-base focus-visible:ring-hunks-green"
                  {...searchForm.register('search')}
                  onChange={(e) => {
                    searchForm.setValue('search', e.target.value);
                    // Auto-search on input change with debounce
                    const timeoutId = setTimeout(() => {
                      searchForm.handleSubmit(onSearch)();
                    }, 300);
                    return () => clearTimeout(timeoutId);
                  }}
                />
              </div>
              <BrandButton
                variant="primary"
                type="submit"
                disabled={loading}
                className="h-12 px-8"
              >
                {loading ? 'Searching...' : 'Search'}
              </BrandButton>
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
                      checked={
                        searchForm.watch('roles')?.includes(role.value) || false
                      }
                      onCheckedChange={(checked) => {
                        const currentRoles =
                          searchForm.getValues('roles') || [];
                        if (checked) {
                          searchForm.setValue('roles', [
                            ...currentRoles,
                            role.value,
                          ]);
                        } else {
                          searchForm.setValue(
                            'roles',
                            currentRoles.filter((r) => r !== role.value)
                          );
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
              {(searchForm.watch('search') ||
                (searchForm.watch('roles')?.length || 0) > 0) && (
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
                {table.getFilteredSelectedRowModel().rows.length} user(s)
                selected
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRowSelection({})}
                >
                  Clear Selection
                </Button>
                <BulkPermissionDialog
                  selectedUsers={table
                    .getFilteredSelectedRowModel()
                    .rows.map((row) => ({
                      ...row.original,
                      roles: row.original.roles as UserRole[],
                    }))}
                  onSuccess={() => {
                    setRowSelection({});
                    loadUsers(searchForm.getValues());
                  }}
                />
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
                        Are you sure you want to delete{' '}
                        {table.getFilteredSelectedRowModel().rows.length}{' '}
                        selected user(s)? This action cannot be undone and will
                        fail for users with existing logs, hours, or commission
                        entries.
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
              <div className="flex flex-col items-center gap-4 text-center">
                <IconUsers className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight">
                    No users found
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {searchForm.watch('search') ||
                    (searchForm.watch('roles')?.length || 0) > 0
                      ? 'No users match your current filters. Try adjusting your search criteria.'
                      : 'Get started by creating your first user account.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(searchForm.watch('search') ||
                    (searchForm.watch('roles')?.length || 0) > 0) && (
                    <Button
                      variant="outline"
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
                  <UserFormDialog mode="create" onSuccess={() => loadUsers()} />
                </div>
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
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t">
                <div className="flex items-center gap-6">
                  <div className="text-sm text-muted-foreground">
                    {data ? (
                      <>
                        Showing{' '}
                        {(data.pagination.page - 1) * data.pagination.limit + 1}{' '}
                        to{' '}
                        {Math.min(
                          data.pagination.page * data.pagination.limit,
                          data.pagination.total
                        )}{' '}
                        of {data.pagination.total} users
                      </>
                    ) : (
                      'Loading...'
                    )}
                  </div>

                  {/* Rows per page selector */}
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="rows-per-page"
                      className="text-sm font-medium"
                    >
                      Rows per page
                    </Label>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        const newPageSize = Number(value);
                        table.setPageSize(newPageSize);
                        searchForm.setValue('limit', newPageSize);
                        searchForm.handleSubmit(onSearch)();
                      }}
                    >
                      <SelectTrigger className="w-20 h-8" id="rows-per-page">
                        <SelectValue
                          placeholder={table.getState().pagination.pageSize}
                        />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 25, 50, 100].map((pageSize) => (
                          <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      table.setPageIndex(0);
                      searchForm.setValue('page', 1);
                      searchForm.handleSubmit(onSearch)();
                    }}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <IconChevronsLeft className="h-4 w-4" />
                    <span className="sr-only">Go to first page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      table.previousPage();
                      const currentPage = table.getState().pagination.pageIndex;
                      searchForm.setValue('page', currentPage);
                      searchForm.handleSubmit(onSearch)();
                    }}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <IconChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Go to previous page</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">
                      Page {table.getState().pagination.pageIndex + 1} of{' '}
                      {table.getPageCount()}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      table.nextPage();
                      const currentPage =
                        table.getState().pagination.pageIndex + 2;
                      searchForm.setValue('page', currentPage);
                      searchForm.handleSubmit(onSearch)();
                    }}
                    disabled={!table.getCanNextPage()}
                  >
                    <IconChevronRight className="h-4 w-4" />
                    <span className="sr-only">Go to next page</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastPageIndex = table.getPageCount() - 1;
                      table.setPageIndex(lastPageIndex);
                      searchForm.setValue('page', lastPageIndex + 1);
                      searchForm.handleSubmit(onSearch)();
                    }}
                    disabled={!table.getCanNextPage()}
                  >
                    <IconChevronsRight className="h-4 w-4" />
                    <span className="sr-only">Go to last page</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
