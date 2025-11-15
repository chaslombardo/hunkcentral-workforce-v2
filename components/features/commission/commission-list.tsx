'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Edit, Trash2, Check, X } from 'lucide-react';
import { BrandButton } from '@/components/brand/brand-button';
import { StatusIndicator } from '@/components/brand/status-indicator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveTable,
  MobileTableCard,
  MobileTableItem,
  MobileTableField,
} from '@/components/ui/responsive-table';
import { CommissionTableSkeleton } from '@/components/ui/skeleton-components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  NoCommissionsEmptyState,
  NoCommissionMatchesEmptyState,
} from '@/components/features/empty-states';
import {
  getCommissionJobTypeMeta,
  normalizeCommissionJobType,
} from './job-type-options';

interface CommissionEntry {
  id: string;
  jobId: string;
  clientName: string;
  jobType: string;
  targetDate: Date;
  estimatedRevenue: number;
  actualRevenue: number | null;
  commissionAmount: number | null;
  status: string;
  createdAt: Date;
  sales: {
    id: string;
    fullName: string;
    email: string;
  };
  matchedLog?: {
    id: string;
    logDate: Date;
    captain: {
      fullName: string;
    };
  } | null;
  approvedBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  rejectedBy?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
}

interface CommissionListProps {
  entries: CommissionEntry[];
  onEdit?: (entry: CommissionEntry) => void;
  onDelete?: (entry: CommissionEntry) => void;
  onView?: (entry: CommissionEntry) => void;
  onApprove?: (entry: CommissionEntry) => void;
  onReject?: (entry: CommissionEntry) => void;
  isLoading?: boolean;
}

export function CommissionList({
  entries,
  onEdit,
  onDelete,
  onView,
  onApprove,
  onReject,
  isLoading,
}: CommissionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const componentLoading = isLoading;

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.sales.fullName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || entry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusIndicator = (status: string) => {
    return (
      <StatusIndicator
        status={status as 'pending' | 'matched' | 'approved' | 'rejected'}
      />
    );
  };

  const getBookingAccuracy = (estimated: number, actual: number | null) => {
    if (!actual) return null;
    const accuracy = Math.min(
      (Math.min(estimated, actual) / Math.max(estimated, actual)) * 100,
      100
    );
    return accuracy;
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate summary statistics
  const totalEntries = entries.length;
  const pendingEntries = entries.filter((e) => e.status === 'pending').length;
  const matchedEntries = entries.filter((e) => e.status === 'matched').length;
  const totalCommission = entries.reduce(
    (sum, entry) => sum + (entry.commissionAmount || 0),
    0
  );

  if (componentLoading) {
    return <CommissionTableSkeleton />;
  }

  // Show empty state if no entries at all
  if (entries.length === 0) {
    return <NoCommissionsEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - Ultra-smooth high-tech animations with staggered entrance */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
        <Card className="@container/card relative overflow-hidden border-l-4 border-l-hunks-orange bg-gradient-to-br from-white via-white to-hunks-orange/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-orange/20 hover:scale-[1.02] hover:border-l-hunks-orange/90 group backdrop-blur-sm animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-100">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-orange transition-all duration-300 group-hover:font-semibold">
              Total Entries
            </CardTitle>
            <div className="p-2 rounded-full bg-hunks-orange/10 group-hover:bg-hunks-orange/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <div className="w-4 h-4 bg-hunks-orange rounded-full animate-pulse group-hover:animate-spin transition-all duration-300"></div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-orange">
              {totalEntries}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-hunks-orange/70 transition-all duration-300 group-hover:translate-x-1">
              Commission bookings
            </p>
          </CardContent>
        </Card>

        <Card className="@container/card relative overflow-hidden border-l-4 border-l-yellow-400 bg-gradient-to-br from-white via-white to-yellow-50 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-400/20 hover:scale-[1.02] hover:border-l-yellow-500 group backdrop-blur-sm animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-yellow-600 transition-all duration-300 group-hover:font-semibold">
              Pending
            </CardTitle>
            <div className="p-2 rounded-full bg-yellow-100 group-hover:bg-yellow-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce group-hover:animate-pulse transition-all duration-300"></div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-yellow-600 tabular-nums @[250px]/card:text-3xl transition-all duration-500 group-hover:scale-110 group-hover:text-yellow-700">
              {pendingEntries}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-yellow-600/70 transition-all duration-300 group-hover:translate-x-1">
              Awaiting job completion
            </p>
          </CardContent>
        </Card>

        <Card className="@container/card relative overflow-hidden border-l-4 border-l-hunks-green bg-gradient-to-br from-white via-white to-hunks-green/5 transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.02] hover:border-l-hunks-green/90 group backdrop-blur-sm animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-300">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-hunks-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 animate-pulse"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-hunks-green transition-all duration-300 group-hover:font-semibold">
              Matched
            </CardTitle>
            <div className="p-2 rounded-full bg-hunks-green/10 group-hover:bg-hunks-green/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <div className="w-4 h-4 bg-hunks-green rounded-full animate-pulse group-hover:animate-ping transition-all duration-300"></div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-hunks-green tabular-nums @[250px]/card:text-3xl transition-all duration-500 group-hover:scale-110 group-hover:text-hunks-green/90">
              {matchedEntries}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-hunks-green/70 transition-all duration-300 group-hover:translate-x-1">
              Successfully matched
            </p>
          </CardContent>
        </Card>

        <Card className="@container/card relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-white via-white to-purple-50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-[1.02] hover:border-l-purple-600 group backdrop-blur-sm animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium group-hover:text-purple-600 transition-all duration-300 group-hover:font-semibold">
              Total Commission
            </CardTitle>
            <div className="p-2 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12">
              <div className="w-4 h-4 bg-purple-500 rounded-full animate-spin group-hover:animate-pulse transition-all duration-300"></div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-purple-600 tabular-nums @[250px]/card:text-3xl transition-all duration-500 group-hover:scale-110 group-hover:text-purple-700">
              {formatCurrency(totalCommission)}
            </div>
            <p className="text-xs text-muted-foreground group-hover:text-purple-600/70 transition-all duration-300 group-hover:translate-x-1">
              Earned commission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters - High-tech modern design with smooth interactions and staggered animation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-700">
        <div className="flex flex-1 gap-4">
          <div className="relative max-w-sm group">
            <Input
              placeholder="Search by job ID, client, or sales person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 transition-all duration-300 border-hunks-green/20 focus:border-hunks-green focus:ring-hunks-green/20 focus:shadow-lg focus:shadow-hunks-green/10 group-hover:border-hunks-green/40"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 group-hover:scale-110 group-hover:text-hunks-green">
              <svg
                className="w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchTerm && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in-0 slide-in-from-right-2">
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-muted-foreground hover:text-hunks-orange transition-colors duration-200 hover:scale-110"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] transition-all duration-300 border-hunks-green/20 hover:border-hunks-green/40 focus:border-hunks-green focus:ring-hunks-green/20 focus:shadow-lg focus:shadow-hunks-green/10">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="animate-in fade-in-0 slide-in-from-top-2">
              <SelectItem
                value="all"
                className="transition-colors duration-200 hover:bg-hunks-green/10"
              >
                All Status
              </SelectItem>
              <SelectItem
                value="pending"
                className="transition-colors duration-200 hover:bg-yellow-100"
              >
                Pending
              </SelectItem>
              <SelectItem
                value="matched"
                className="transition-colors duration-200 hover:bg-hunks-green/10"
              >
                Matched
              </SelectItem>
              <SelectItem
                value="approved"
                className="transition-colors duration-200 hover:bg-green-100"
              >
                Approved
              </SelectItem>
              <SelectItem
                value="rejected"
                className="transition-colors duration-200 hover:bg-red-100"
              >
                Rejected
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <ResponsiveTable branded minWidth="1200px">
          <Table variant="branded">
            <TableHeader variant="branded">
              <TableRow variant="branded">
                <TableHead variant="branded">Job ID</TableHead>
                <TableHead variant="branded">Client</TableHead>
                <TableHead variant="branded">Sales Person</TableHead>
                <TableHead variant="branded">Type</TableHead>
                <TableHead variant="branded">Target Date</TableHead>
                <TableHead variant="branded">Estimated</TableHead>
                <TableHead variant="branded">Actual</TableHead>
                <TableHead variant="branded">Commission</TableHead>
                <TableHead variant="branded">Accuracy</TableHead>
                <TableHead variant="branded">Status</TableHead>
                <TableHead variant="branded" className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow variant="branded">
                  <TableCell colSpan={11} className="p-0">
                    <div className="py-8">
                      <NoCommissionMatchesEmptyState />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => {
                  const accuracy = getBookingAccuracy(
                    entry.estimatedRevenue,
                    entry.actualRevenue
                  );
                  const normalizedJobType = normalizeCommissionJobType(
                    entry.jobType
                  );
                  const jobTypeMeta =
                    getCommissionJobTypeMeta(normalizedJobType);

                  return (
                    <TableRow
                      key={entry.id}
                      variant="branded"
                      className="transition-all duration-500 hover:bg-gradient-to-r hover:from-hunks-green/5 hover:via-hunks-green/10 hover:to-hunks-green/5 hover:shadow-lg hover:shadow-hunks-green/10 hover:scale-[1.01] animate-in fade-in-0 slide-in-from-bottom-2 group"
                    >
                      <TableCell className="font-medium transition-all duration-300 group-hover:text-hunks-green group-hover:font-semibold group-hover:translate-x-1">
                        <span className="relative">
                          {entry.jobId}
                          <div className="absolute inset-0 bg-hunks-green/10 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                        </span>
                      </TableCell>
                      <TableCell className="transition-all duration-300 group-hover:text-hunks-green group-hover:translate-x-1">
                        {entry.clientName}
                      </TableCell>
                      <TableCell className="transition-all duration-300 group-hover:text-hunks-green group-hover:translate-x-1">
                        {entry.sales.fullName}
                      </TableCell>
                      <TableCell className="capitalize transition-all duration-300 group-hover:text-hunks-green group-hover:translate-x-1">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${jobTypeMeta.indicatorClass} animate-pulse group-hover:scale-150 group-hover:shadow-lg`}
                            ></div>
                            <span className="group-hover:font-medium transition-all duration-300">
                              {jobTypeMeta.label}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {jobTypeMeta.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="transition-all duration-300 group-hover:text-hunks-green group-hover:translate-x-1">
                        {format(new Date(entry.targetDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="transition-all duration-300 group-hover:text-hunks-green group-hover:translate-x-1 group-hover:font-medium">
                        {formatCurrency(entry.estimatedRevenue)}
                      </TableCell>
                      <TableCell className="transition-all duration-300 group-hover:text-hunks-green group-hover:translate-x-1 group-hover:font-medium">
                        {formatCurrency(entry.actualRevenue)}
                      </TableCell>
                      <TableCell className="font-medium text-hunks-orange transition-all duration-300 group-hover:text-hunks-orange/90 group-hover:scale-110 group-hover:font-bold group-hover:translate-x-1">
                        <span className="relative inline-block">
                          {formatCurrency(entry.commissionAmount)}
                          <div className="absolute inset-0 bg-hunks-orange/10 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                        </span>
                      </TableCell>
                      <TableCell>
                        {accuracy !== null ? (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="cursor-pointer">
                                <Progress value={accuracy} className="w-16" />
                                <span className="text-xs text-muted-foreground">
                                  {accuracy.toFixed(0)}%
                                </span>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold">
                                  Booking Accuracy
                                </h4>
                                <div className="text-sm">
                                  <div>
                                    Estimated:{' '}
                                    {formatCurrency(entry.estimatedRevenue)}
                                  </div>
                                  <div>
                                    Actual:{' '}
                                    {formatCurrency(entry.actualRevenue)}
                                  </div>
                                  <div>Accuracy: {accuracy.toFixed(1)}%</div>
                                </div>
                                {entry.matchedLog && (
                                  <div className="text-xs text-muted-foreground border-t pt-2">
                                    Matched to log by{' '}
                                    {entry.matchedLog.captain.fullName} on{' '}
                                    {format(
                                      new Date(entry.matchedLog.logDate),
                                      'MMM d, yyyy'
                                    )}
                                  </div>
                                )}
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusIndicator(entry.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <BrandButton
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </BrandButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {onView && (
                              <DropdownMenuItem onClick={() => onView(entry)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            )}
                            {onEdit && entry.status === 'pending' && (
                              <DropdownMenuItem onClick={() => onEdit(entry)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {onApprove && entry.status === 'matched' && (
                              <DropdownMenuItem
                                onClick={() => onApprove(entry)}
                                className="text-hunks-green"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {onReject &&
                              ['matched', 'pending'].includes(entry.status) && (
                                <DropdownMenuItem
                                  onClick={() => onReject(entry)}
                                  className="text-destructive"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              )}
                            {onDelete && entry.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => onDelete(entry)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ResponsiveTable>
      </div>

      {/* Mobile Cards */}
      <MobileTableCard>
        {filteredEntries.length === 0 ? (
          <div className="py-8">
            <NoCommissionMatchesEmptyState />
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const accuracy = getBookingAccuracy(
              entry.estimatedRevenue,
              entry.actualRevenue
            );
            const normalizedJobType = normalizeCommissionJobType(entry.jobType);
            const jobTypeMeta = getCommissionJobTypeMeta(normalizedJobType);

            return (
              <MobileTableItem
                key={entry.id}
                branded
                className="transition-all duration-500 hover:shadow-2xl hover:shadow-hunks-green/20 hover:scale-[1.03] hover:bg-gradient-to-r hover:from-hunks-green/5 hover:to-hunks-orange/5 animate-in fade-in-0 slide-in-from-bottom-2 group backdrop-blur-sm border-l-4 border-l-transparent hover:border-l-hunks-green"
              >
                <MobileTableField
                  label="Job ID"
                  value={<span className="font-medium">{entry.jobId}</span>}
                />
                <MobileTableField label="Client" value={entry.clientName} />
                <MobileTableField
                  label="Sales Person"
                  value={entry.sales.fullName}
                />
                <MobileTableField
                  label="Type"
                  value={
                    <div className="space-y-1">
                      <span className="capitalize font-medium">
                        {jobTypeMeta.label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {jobTypeMeta.description}
                      </span>
                    </div>
                  }
                />
                <MobileTableField
                  label="Target Date"
                  value={format(new Date(entry.targetDate), 'MMM d, yyyy')}
                />
                <MobileTableField
                  label="Estimated"
                  value={formatCurrency(entry.estimatedRevenue)}
                />
                <MobileTableField
                  label="Actual"
                  value={formatCurrency(entry.actualRevenue)}
                />
                <MobileTableField
                  label="Commission"
                  value={
                    <span className="font-medium text-hunks-orange">
                      {formatCurrency(entry.commissionAmount)}
                    </span>
                  }
                />
                {accuracy !== null && (
                  <MobileTableField
                    label="Accuracy"
                    value={
                      <div className="flex items-center gap-2">
                        <Progress value={accuracy} className="w-16" />
                        <span className="text-xs">{accuracy.toFixed(0)}%</span>
                      </div>
                    }
                  />
                )}
                <MobileTableField
                  label="Status"
                  value={getStatusIndicator(entry.status)}
                />
                <div className="flex justify-end pt-2 border-t border-hunks-green-200">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <BrandButton variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </BrandButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(entry)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEdit && entry.status === 'pending' && (
                        <DropdownMenuItem onClick={() => onEdit(entry)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onApprove && entry.status === 'matched' && (
                        <DropdownMenuItem
                          onClick={() => onApprove(entry)}
                          className="text-hunks-green"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                      )}
                      {onReject &&
                        ['matched', 'pending'].includes(entry.status) && (
                          <DropdownMenuItem
                            onClick={() => onReject(entry)}
                            className="text-destructive"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </DropdownMenuItem>
                        )}
                      {onDelete && entry.status === 'pending' && (
                        <DropdownMenuItem
                          onClick={() => onDelete(entry)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </MobileTableItem>
            );
          })
        )}
      </MobileTableCard>
    </div>
  );
}
