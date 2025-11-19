'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { isMobileDevice, isIOSDevice } from '@/lib/mobile-utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface MobileDatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showNativePickerOnMobile?: boolean;
}

export function MobileDatePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  id,
  name,
  required = false,
  minDate,
  maxDate,
  showNativePickerOnMobile = true,
}: MobileDatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const { tapFeedback, selectionFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    selectionFeedback();
    onDateChange?.(selectedDate);
    setOpen(false);
  };

  const handleTriggerClick = () => {
    tapFeedback();
    setOpen(true);
  };

  // Format date for native input
  const formatDateForNativeInput = (date: Date | undefined): string => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // Parse date from native input
  const parseDateFromNativeInput = (dateString: string): Date | undefined => {
    if (!dateString) return undefined;
    const parsed = new Date(dateString + 'T00:00:00');
    return isNaN(parsed.getTime()) ? undefined : parsed;
  };

  // Handle native input change
  const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseDateFromNativeInput(e.target.value);
    onDateChange?.(newDate);
  };

  // Use native date picker on mobile if enabled
  if (isMobile && showNativePickerOnMobile) {
    return (
      <Input
        id={id}
        name={name}
        type="date"
        value={formatDateForNativeInput(date)}
        onChange={handleNativeInputChange}
        disabled={disabled}
        required={required}
        min={minDate ? formatDateForNativeInput(minDate) : undefined}
        max={maxDate ? formatDateForNativeInput(maxDate) : undefined}
        className={cn(
          'w-full',
          // Enhanced mobile styling
          'min-h-[48px] text-base touch-manipulation',
          // iOS specific styling
          isIOSDevice() && 'appearance-none',
          className
        )}
        mobileOptimized={true}
      />
    );
  }

  // Desktop popover or mobile drawer
  const DatePickerContent = () => (
    <Calendar
      mode="single"
      selected={date}
      onSelect={handleDateSelect}
      disabled={(date) => {
        if (disabled) return true;
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
      }}
      initialFocus
      className={cn(
        // Mobile optimizations
        isMobile && [
          // Larger touch targets
          '[&_.rdp-button]:min-h-[48px] [&_.rdp-button]:min-w-[48px]',
          // Larger text
          '[&_.rdp-button]:text-base',
          // Better spacing
          '[&_.rdp-table]:gap-2',
        ]
      )}
    />
  );

  const TriggerButton = () => (
    <Button
      variant="outline"
      className={cn(
        'w-full justify-start text-left font-normal',
        !date && 'text-muted-foreground',
        // Mobile optimizations
        isMobile && [
          'min-h-[48px] text-base touch-manipulation',
          'focus-visible:ring-2 focus-visible:ring-offset-1',
        ],
        className
      )}
      disabled={disabled}
      onClick={handleTriggerClick}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, 'PPP') : <span>{placeholder}</span>}
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <TriggerButton />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Select Date</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 pb-8">
            <DatePickerContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TriggerButton />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DatePickerContent />
      </PopoverContent>
    </Popover>
  );
}

// Mobile-optimized date range picker
export interface MobileDateRangePickerProps {
  dateRange?: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange?: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

export function MobileDateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = 'Pick a date range',
  disabled = false,
  className,
  id: _id,
  name: _name,
  required: _required = false,
  minDate,
  maxDate,
}: MobileDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const { tapFeedback, selectionFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    selectionFeedback();
    onDateRangeChange?.({
      from: range?.from,
      to: range?.to,
    });

    // Close drawer when both dates are selected
    if (range?.from && range?.to) {
      setOpen(false);
    }
  };

  const handleTriggerClick = () => {
    tapFeedback();
    setOpen(true);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return placeholder;
    if (!dateRange.to) return format(dateRange.from, 'PPP');
    return `${format(dateRange.from, 'PPP')} - ${format(dateRange.to, 'PPP')}`;
  };

  const serializedRange = dateRange
    ? `${dateRange.from?.toISOString() || ''}|${dateRange.to?.toISOString() || ''}`
    : '';

  const DateRangePickerContent = () => (
    <Calendar
      mode="range"
      selected={dateRange}
      onSelect={handleDateRangeSelect}
      disabled={(date) => {
        if (disabled) return true;
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
      }}
      numberOfMonths={isMobile ? 1 : 2}
      className={cn(
        // Mobile optimizations
        isMobile && [
          // Larger touch targets
          '[&_.rdp-button]:min-h-[48px] [&_.rdp-button]:min-w-[48px]',
          // Larger text
          '[&_.rdp-button]:text-base',
          // Better spacing
          '[&_.rdp-table]:gap-2',
        ]
      )}
    />
  );

  const TriggerButton = () => (
    <Button
      variant="outline"
      className={cn(
        'w-full justify-start text-left font-normal',
        !dateRange?.from && 'text-muted-foreground',
        // Mobile optimizations
        isMobile && [
          'min-h-[48px] text-base touch-manipulation',
          'focus-visible:ring-2 focus-visible:ring-offset-1',
        ],
        className
      )}
      disabled={disabled}
      onClick={handleTriggerClick}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      <span className="truncate">{formatDateRange()}</span>
    </Button>
  );

  return (
    <>
      {(_id || _name) && (
        <input
          type="hidden"
          id={_id}
          name={_name}
          value={serializedRange}
          required={_required}
        />
      )}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <TriggerButton />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Select Date Range</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8">
              <DateRangePickerContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <TriggerButton />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DateRangePickerContent />
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
