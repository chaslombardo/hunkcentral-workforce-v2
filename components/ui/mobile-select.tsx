'use client';

import * as React from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { isMobileDevice } from '@/lib/mobile-utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface MobileSelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  showNativeSelectOnMobile?: boolean;
  multiple?: boolean;
  maxSelections?: number;
}

export function MobileSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  className,
  id,
  name,
  required = false,
  searchable = false,
  searchPlaceholder = 'Search options...',
  emptyMessage = 'No options found.',
  showNativeSelectOnMobile = false,
  multiple = false,
  maxSelections,
}: MobileSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { tapFeedback, selectionFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Group options by group property
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, SelectOption[]> = {};

    filteredOptions.forEach((option) => {
      const groupName = option.group || 'default';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(option);
    });

    return groups;
  }, [filteredOptions]);

  // Get selected option
  const selectedOption = options.find((option) => option.value === value);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    selectionFeedback();
    onValueChange?.(optionValue);
    setOpen(false);
    setSearchQuery('');
  };

  const handleTriggerClick = () => {
    tapFeedback();
    setOpen(true);
  };

  // Use native select on mobile if enabled
  if (isMobile && showNativeSelectOnMobile && !searchable && !multiple) {
    return (
      <select
        id={id}
        name={name}
        value={value || ''}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        className={cn(
          // Base styles
          'flex w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          // Mobile optimizations
          'min-h-[48px] text-base touch-manipulation',
          'focus-visible:ring-2 focus-visible:ring-offset-1',
          // Remove default styling
          'appearance-none',
          className
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
          <optgroup
            key={groupName}
            label={groupName !== 'default' ? groupName : undefined}
          >
            {groupOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    );
  }

  // Custom select content
  const SelectContent = () => (
    <div className="w-full">
      {searchable && (
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn('pl-10', isMobile && 'min-h-[48px] text-base')}
              mobileOptimized={true}
            />
          </div>
        </div>
      )}

      <ScrollArea className={cn('max-h-[300px]', isMobile && 'max-h-[60vh]')}>
        {Object.keys(groupedOptions).length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="p-1">
            {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
              <div key={groupName}>
                {groupName !== 'default' && (
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {groupName}
                  </div>
                )}
                {groupOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="ghost"
                    className={cn(
                      'w-full justify-start font-normal',
                      value === option.value &&
                        'bg-accent text-accent-foreground',
                      option.disabled && 'opacity-50 cursor-not-allowed',
                      // Mobile optimizations
                      isMobile && [
                        'min-h-[48px] text-base touch-manipulation',
                        'focus-visible:ring-2 focus-visible:ring-offset-1',
                      ]
                    )}
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === option.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </Button>
                ))}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const TriggerButton = () => (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn(
        'w-full justify-between font-normal',
        !selectedOption && 'text-muted-foreground',
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
      <span className="truncate">
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
            <DrawerTitle>
              {searchable ? 'Search and Select' : 'Select Option'}
            </DrawerTitle>
          </DrawerHeader>
          <div className="pb-8">
            <SelectContent />
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
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <SelectContent />
      </PopoverContent>
    </Popover>
  );
}

// Multi-select component
export interface MobileMultiSelectProps
  extends Omit<MobileSelectProps, 'value' | 'onValueChange' | 'multiple'> {
  values?: string[];
  onValuesChange?: (values: string[]) => void;
  maxSelections?: number;
}

export function MobileMultiSelect({
  values = [],
  onValuesChange,
  maxSelections,
  placeholder = 'Select options',
  ...props
}: MobileMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const { selectionFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle option selection
  const handleSelect = (optionValue: string) => {
    selectionFeedback();

    const isSelected = values.includes(optionValue);
    let newValues: string[];

    if (isSelected) {
      newValues = values.filter((v) => v !== optionValue);
    } else {
      if (maxSelections && values.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      newValues = [...values, optionValue];
    }

    onValuesChange?.(newValues);
  };

  // Get selected options for display
  const selectedOptions = props.options.filter((option) =>
    values.includes(option.value)
  );

  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0].label
        : `${selectedOptions.length} selected`;

  // Custom multi-select content
  const MultiSelectContent = () => (
    <div className="w-full">
      {props.searchable && (
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={props.searchPlaceholder}
              className={cn('pl-10', isMobile && 'min-h-[48px] text-base')}
              mobileOptimized={true}
            />
          </div>
        </div>
      )}

      <ScrollArea className={cn('max-h-[300px]', isMobile && 'max-h-[60vh]')}>
        <div className="p-1">
          {props.options.map((option) => {
            const isSelected = values.includes(option.value);
            const isDisabled = Boolean(
              option.disabled ||
                (maxSelections && !isSelected && values.length >= maxSelections)
            );

            return (
              <Button
                key={option.value}
                variant="ghost"
                className={cn(
                  'w-full justify-start font-normal',
                  isSelected && 'bg-accent text-accent-foreground',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                  // Mobile optimizations
                  isMobile && [
                    'min-h-[48px] text-base touch-manipulation',
                    'focus-visible:ring-2 focus-visible:ring-offset-1',
                  ]
                )}
                disabled={isDisabled}
                onClick={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    isSelected ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {option.label}
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {maxSelections && (
        <div className="p-3 border-t text-xs text-muted-foreground text-center">
          {values.length} of {maxSelections} selected
        </div>
      )}
    </div>
  );

  const TriggerButton = () => (
    <Button
      variant="outline"
      className={cn(
        'w-full justify-between font-normal',
        selectedOptions.length === 0 && 'text-muted-foreground',
        // Mobile optimizations
        isMobile && [
          'min-h-[48px] text-base touch-manipulation',
          'focus-visible:ring-2 focus-visible:ring-offset-1',
        ],
        props.className
      )}
      disabled={props.disabled}
      onClick={() => setOpen(true)}
    >
      <span className="truncate">{displayText}</span>
      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
            <DrawerTitle>Select Options</DrawerTitle>
          </DrawerHeader>
          <div className="pb-8">
            <MultiSelectContent />
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
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <MultiSelectContent />
      </PopoverContent>
    </Popover>
  );
}
