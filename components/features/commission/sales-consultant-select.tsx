'use client';

import { useMemo, useState } from 'react';
import { IconCheck, IconUser } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

interface SalesConsultantSelectProps {
  salesUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    commissionRate: number | null;
  }>;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  triggerClassName?: string;
}

export function SalesConsultantSelect({
  salesUsers,
  value,
  onChange,
  disabled,
  placeholder = 'Select sales consultant',
  triggerClassName,
}: SalesConsultantSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedUser = useMemo(
    () => salesUsers.find((user) => user.id === value),
    [salesUsers, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-12 w-full justify-between text-left font-medium',
            !selectedUser && 'text-muted-foreground',
            triggerClassName
          )}
        >
          <span className="flex items-center gap-2">
            <IconUser className="h-4 w-4 opacity-60" />
            {selectedUser ? selectedUser.fullName : placeholder}
          </span>
          <span className="text-xs text-muted-foreground">
            {selectedUser?.commissionRate
              ? `${Number(selectedUser.commissionRate).toFixed(2)}%`
              : 'Search'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search consultants..." />
          <CommandList>
            <CommandEmpty>No consultants found.</CommandEmpty>
            <CommandGroup>
              {salesUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.fullName} ${user.email}`}
                  onSelect={() => {
                    onChange(user.id);
                    setOpen(false);
                  }}
                  className="flex flex-col items-start gap-0.5 px-2 py-2"
                >
                  <div className="flex w-full items-center justify-between text-sm font-medium">
                    <span>{user.fullName}</span>
                    {selectedUser?.id === user.id && (
                      <IconCheck className="h-4 w-4 text-hunks-green" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  {user.commissionRate && (
                    <span className="text-[11px] text-hunks-green">
                      Commission {Number(user.commissionRate).toFixed(2)}%
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
