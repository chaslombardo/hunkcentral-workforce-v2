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
import { ResponsiveTable, MobileTableCard, MobileTableItem, MobileTableField } from '@/components/ui/responsive-table';
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
import { NoCommissionsEmptyState, NoCommissionMatchesEmptyState } from '@/components/features/empty-states';

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

export function CommissionList({ entries, onEdit, onDelete, onView, onApprove, onReject, isLoading }: CommissionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const componentLoading = isLoading;

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.sales.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIndicator = (status: string) => {
    return <StatusIndicator status={status as 'pending' | 'matched' | 'approved' | 'rejected'} />;
  };

  const getBookingAccuracy = (estimated: number, actual: number | null) => {
    if (!actual) return null;
    const accuracy = Math.min((Math.min(estimated, actual) / Math.max(estimated, actual)) * 100, 100);
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
  const pendingEntries = entries.filter(e => e.status === 'pending').length;
  const matchedEntries = entries.filter(e => e.status === 'matched').length;
  const totalCommission = entries.reduce((sum, entry) => sum + (entry.commissionAmount || 0), 0);

  if (componentLoading) {
    return <CommissionTableSkeleton />;
  }

  // Show empty state if no entries at all
  if (entries.length === 0) {
    return <NoCommissionsEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards - Following dashboard-01 patterns */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
        <Card className="@container/card border-l-4 border-l-hunks-orange">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">Commission bookings</p>
          </CardContent>
        </Card>
        <Card className="@container/card border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 tabular-nums @[250px]/card:text-3xl">{pendingEntries}</div>
            <p className="text-xs text-muted-foreground">Awaiting job completion</p>
          </CardContent>
        </Card>
        <Card className="@container/card border-l-4 border-l-hunks-green">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-hunks-green tabular-nums @[250px]/card:text-3xl">{matchedEntries}</div>
            <p className="text-xs text-muted-foreground">Successfully matched</p>
          </CardContent>
        </Card>
        <Card className="@container/card border-l-4 border-l-hunks-orange">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-hunks-orange tabular-nums @[250px]/card:text-3xl">{formatCurrency(totalCommission)}</div>
            <p className="text-xs text-muted-foreground">Earned commission</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Following dashboard-01 patterns */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <Input
            placeholder="Search by job ID, client, or sales person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="matched">Matched</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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
                  const accuracy = getBookingAccuracy(entry.estimatedRevenue, entry.actualRevenue);
                  
                  return (
                    <TableRow key={entry.id} variant="branded">
                      <TableCell className="font-medium">{entry.jobId}</TableCell>
                      <TableCell>{entry.clientName}</TableCell>
                      <TableCell>{entry.sales.fullName}</TableCell>
                      <TableCell className="capitalize">{entry.jobType}</TableCell>
                      <TableCell>{format(new Date(entry.targetDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{formatCurrency(entry.estimatedRevenue)}</TableCell>
                      <TableCell>{formatCurrency(entry.actualRevenue)}</TableCell>
                      <TableCell className="font-medium text-hunks-orange">{formatCurrency(entry.commissionAmount)}</TableCell>
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
                                <h4 className="text-sm font-semibold">Booking Accuracy</h4>
                                <div className="text-sm">
                                  <div>Estimated: {formatCurrency(entry.estimatedRevenue)}</div>
                                  <div>Actual: {formatCurrency(entry.actualRevenue)}</div>
                                  <div>Accuracy: {accuracy.toFixed(1)}%</div>
                                </div>
                                {entry.matchedLog && (
                                  <div className="text-xs text-muted-foreground border-t pt-2">
                                    Matched to log by {entry.matchedLog.captain.fullName} on{' '}
                                    {format(new Date(entry.matchedLog.logDate), 'MMM d, yyyy')}
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
                            {onReject && ['matched', 'pending'].includes(entry.status) && (
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
            const accuracy = getBookingAccuracy(entry.estimatedRevenue, entry.actualRevenue);
            
            return (
              <MobileTableItem key={entry.id} branded>
                <MobileTableField label="Job ID" value={<span className="font-medium">{entry.jobId}</span>} />
                <MobileTableField label="Client" value={entry.clientName} />
                <MobileTableField label="Sales Person" value={entry.sales.fullName} />
                <MobileTableField label="Type" value={<span className="capitalize">{entry.jobType}</span>} />
                <MobileTableField label="Target Date" value={format(new Date(entry.targetDate), 'MMM d, yyyy')} />
                <MobileTableField label="Estimated" value={formatCurrency(entry.estimatedRevenue)} />
                <MobileTableField label="Actual" value={formatCurrency(entry.actualRevenue)} />
                <MobileTableField 
                  label="Commission" 
                  value={<span className="font-medium text-hunks-orange">{formatCurrency(entry.commissionAmount)}</span>} 
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
                <MobileTableField label="Status" value={getStatusIndicator(entry.status)} />
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
                      {onReject && ['matched', 'pending'].includes(entry.status) && (
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