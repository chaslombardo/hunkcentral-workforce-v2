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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-4 border rounded-lg bg-muted/50">
      <div className="space-y-2">
        <Label htmlFor="entityType">Entity Type</Label>
        <Select value={entityType} onValueChange={setEntityType}>
          <SelectTrigger>
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
        <Label htmlFor="action">Action</Label>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger>
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
        <Label htmlFor="entityId">Entity ID</Label>
        <Input
          id="entityId"
          placeholder="Enter entity ID"
          value={entityId}
          onChange={(e) => setEntityId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          placeholder="Enter user ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Start Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
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
        <Label>End Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="col-span-full flex gap-2 justify-end">
        <Button variant="outline" onClick={clearFilters}>
          <XIcon className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <Button onClick={applyFilters}>
          <FilterIcon className="mr-2 h-4 w-4" />
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
