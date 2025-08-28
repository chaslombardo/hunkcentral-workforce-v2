'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, FilterIcon, XIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [entityType, setEntityType] = useState(
    searchParams.get('entityType') || 'all'
  );
  const [action, setAction] = useState(searchParams.get('action') || 'all');
  const [userId, setUserId] = useState(searchParams.get('userId') || '');
  const [entityId, setEntityId] = useState(searchParams.get('entityId') || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined
  );

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (entityType && entityType !== 'all')
      params.set('entityType', entityType);
    if (action && action !== 'all') params.set('action', action);
    if (userId) params.set('userId', userId);
    if (entityId) params.set('entityId', entityId);
    if (startDate) params.set('startDate', startDate.toISOString());
    if (endDate) params.set('endDate', endDate.toISOString());

    router.push(`/admin/audit?${params.toString()}`);
  };

  const clearFilters = () => {
    setEntityType('all');
    setAction('all');
    setUserId('');
    setEntityId('');
    setStartDate(undefined);
    setEndDate(undefined);
    router.push('/admin/audit');
  };

  return (
    <div className="space-y-4">
      {/* Filter Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="entityType" className="text-sm font-medium">
            Entity Type
          </Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="daily_log">Daily Log</SelectItem>
              <SelectItem value="commission_entry">Commission Entry</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="pay_period">Pay Period</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="action" className="text-sm font-medium">
            Action
          </Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="submit">Submit</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
              <SelectItem value="match">Match</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entityId" className="text-sm font-medium">
            Entity ID
          </Label>
          <Input
            id="entityId"
            className="h-10 w-full"
            placeholder="Enter entity ID"
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="userId" className="text-sm font-medium">
            User ID
          </Label>
          <Input
            id="userId"
            className="h-10 w-full"
            placeholder="Enter user ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-10 justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {startDate
                    ? format(startDate, 'MMM dd, yyyy')
                    : 'Pick a date'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-10 justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">
                  {endDate ? format(endDate, 'MMM dd, yyyy') : 'Pick a date'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-muted-foreground">
          Use filters to narrow down audit log results
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <XIcon className="mr-2 h-4 w-4" />
            Clear
          </Button>
          <Button size="sm" onClick={applyFilters}>
            <FilterIcon className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
