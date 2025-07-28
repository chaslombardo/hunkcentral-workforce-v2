'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
}

interface CommissionListProps {
  entries: CommissionEntry[];
  onEdit?: (entry: CommissionEntry) => void;
  onDelete?: (id: string) => void;
  onView?: (entry: CommissionEntry) => void;
}

export function CommissionList({ entries, onEdit, onDelete, onView }: CommissionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = 
      entry.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.sales.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'matched':
        return <Badge className="bg-[#026937] hover:bg-[#026937]/90">Matched</Badge>;
      case 'approved':
        return <Badge className="bg-[#ea7200] hover:bg-[#ea7200]/90">Approved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  return (
    <div className="space-y-6">
      {/* Summary Cards - Following dashboard-01 patterns */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums @[250px]/card:text-3xl">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">Commission bookings</p>
          </CardContent>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 tabular-nums @[250px]/card:text-3xl">{pendingEntries}</div>
            <p className="text-xs text-muted-foreground">Awaiting job completion</p>
          </CardContent>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#026937] tabular-nums @[250px]/card:text-3xl">{matchedEntries}</div>
            <p className="text-xs text-muted-foreground">Successfully matched</p>
          </CardContent>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#ea7200] tabular-nums @[250px]/card:text-3xl">{formatCurrency(totalCommission)}</div>
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Commission Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Sales Person</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Target Date</TableHead>
              <TableHead>Estimated</TableHead>
              <TableHead>Actual</TableHead>
              <TableHead>Commission</TableHead>
              <TableHead>Accuracy</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No commission entries found
                </TableCell>
              </TableRow>
            ) : (
              filteredEntries.map((entry) => {
                const accuracy = getBookingAccuracy(entry.estimatedRevenue, entry.actualRevenue);
                
                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.jobId}</TableCell>
                    <TableCell>{entry.clientName}</TableCell>
                    <TableCell>{entry.sales.fullName}</TableCell>
                    <TableCell className="capitalize">{entry.jobType}</TableCell>
                    <TableCell>{format(new Date(entry.targetDate), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{formatCurrency(entry.estimatedRevenue)}</TableCell>
                    <TableCell>{formatCurrency(entry.actualRevenue)}</TableCell>
                    <TableCell>{formatCurrency(entry.commissionAmount)}</TableCell>
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
                    <TableCell>{getStatusBadge(entry.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
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
                          {onDelete && entry.status === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => onDelete(entry.id)}
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
      </div>
    </div>
  );
}