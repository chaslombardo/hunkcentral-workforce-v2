'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isMobileDevice } from '@/lib/mobile-utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  separator?: boolean;
}

export interface DropdownGroup {
  label?: string;
  options: DropdownOption[];
}

export interface MobileDropdownProps {
  trigger?: React.ReactNode;
  options?: DropdownOption[];
  groups?: DropdownGroup[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  title?: string;
}

type DropdownItem =
  | { type: 'option'; data: DropdownOption }
  | { type: 'group'; data: { label: string } }
  | { type: 'separator'; data: null };

export function MobileDropdown({
  trigger,
  options = [],
  groups = [],
  value,
  onValueChange,
  placeholder = 'Select option',
  className,
  disabled = false,
  align = 'start',
  side = 'bottom',
  title,
}: MobileDropdownProps) {
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

  // Combine options and groups into a single structure
  const allItems = React.useMemo(() => {
    const items: DropdownItem[] = [];

    // Add standalone options first
    if (options.length > 0) {
      options.forEach((option) => {
        if (option.separator) {
          items.push({ type: 'separator', data: null });
        }
        items.push({ type: 'option', data: option });
      });
    }

    // Add grouped options
    groups.forEach((group, groupIndex) => {
      if (groupIndex > 0 || options.length > 0) {
        items.push({ type: 'separator', data: null });
      }

      if (group.label) {
        items.push({ type: 'group', data: { label: group.label } });
      }

      group.options.forEach((option) => {
        if (option.separator) {
          items.push({ type: 'separator', data: null });
        }
        items.push({ type: 'option', data: option });
      });
    });

    return items;
  }, [options, groups]);

  const selectedLabel = React.useMemo(() => {
    if (!value) return undefined;
    const combinedOptions = [
      ...options,
      ...groups.flatMap((group) => group.options),
    ];
    return combinedOptions.find((option) => option.value === value)?.label;
  }, [value, options, groups]);

  const TriggerContent = () => {
    if (trigger) return <>{trigger}</>;

    return (
      <Button
        variant="outline"
        className={cn(
          'w-full justify-between text-left font-normal',
          !selectedLabel && 'text-muted-foreground',
          className
        )}
        disabled={disabled}
      >
        <span>{selectedLabel ?? placeholder}</span>
        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
      </Button>
    );
  };

  const handleSelect = (optionValue: string) => {
    selectionFeedback();
    onValueChange?.(optionValue);
    setOpen(false);
  };

  const handleTriggerClick = () => {
    tapFeedback();
    setOpen(true);
  };

  // Mobile drawer content
  const MobileContent = () => (
    <div className="w-full">
      {title && (
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
      )}

      <ScrollArea className="max-h-[60vh] p-4">
        <div className="space-y-1">
          {allItems.map((item, index) => {
            if (item.type === 'separator') {
              return (
                <div key={`separator-${index}`} className="my-2">
                  <div className="h-px bg-border" />
                </div>
              );
            }

            if (item.type === 'group') {
              return (
                <div
                  key={`group-${index}`}
                  className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {item.data.label}
                </div>
              );
            }

            const option = item.data;
            const isSelected = value === option.value;

            return (
              <Button
                key={option.value}
                variant="ghost"
                onClick={() => handleSelect(option.value)}
                disabled={option.disabled}
                className={cn(
                  'w-full justify-start font-normal',
                  isSelected && 'bg-accent text-accent-foreground',
                  // Mobile optimizations
                  'min-h-[48px] text-base touch-manipulation',
                  'focus-visible:ring-2 focus-visible:ring-offset-1'
                )}
              >
                <div className="flex items-center w-full">
                  {option.icon && <option.icon className="mr-3 h-5 w-5" />}
                  <span className="flex-1 text-left">{option.label}</span>
                  {isSelected && <Check className="ml-2 h-4 w-4" />}
                </div>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  // Desktop dropdown content
  const DesktopContent = () => (
    <>
      {allItems.map((item, index) => {
        if (item.type === 'separator') {
          return <DropdownMenuSeparator key={`separator-${index}`} />;
        }

        if (item.type === 'group') {
          return (
            <DropdownMenuLabel key={`group-${index}`}>
              {item.data.label}
            </DropdownMenuLabel>
          );
        }

        const option = item.data;
        const isSelected = value === option.value;

        return (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            disabled={option.disabled}
            className={cn(
              'flex items-center',
              isSelected && 'bg-accent text-accent-foreground'
            )}
          >
            {option.icon && <option.icon className="mr-2 h-4 w-4" />}
            <span className="flex-1">{option.label}</span>
            {isSelected && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        );
      })}
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild disabled={disabled}>
          <div onClick={handleTriggerClick}>
            <TriggerContent />
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <MobileContent />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <TriggerContent />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} side={side} className={className}>
        <DesktopContent />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile context menu (long press activated)
export interface MobileContextMenuProps {
  children: React.ReactNode;
  options: DropdownOption[];
  disabled?: boolean;
  className?: string;
  onSelect?: (option: DropdownOption) => void;
}

export function MobileContextMenu({
  children,
  options,
  disabled = false,
  className,
  onSelect,
}: MobileContextMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = React.useState(false);
  const { impactFeedback, tapFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLongPress = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;

    e.preventDefault();
    impactFeedback();

    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setIsOpen(true);
  };

  const handleSelect = (option: DropdownOption) => {
    tapFeedback();
    onSelect?.(option);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div
        className={cn('touch-manipulation', className)}
        onContextMenu={handleLongPress}
        onTouchStart={(e) => {
          // Long press detection for mobile
          const timer = setTimeout(() => {
            handleLongPress(e);
          }, 500);

          const cleanup = () => {
            clearTimeout(timer);
            document.removeEventListener('touchend', cleanup);
            document.removeEventListener('touchmove', cleanup);
          };

          document.addEventListener('touchend', cleanup);
          document.addEventListener('touchmove', cleanup);
        }}
      >
        {children}
      </div>

      {/* Context menu overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-50" onClick={handleClose} />

          {/* Context menu */}
          <div
            className="fixed z-50 bg-background border rounded-lg shadow-lg p-1 min-w-[200px]"
            style={{
              left: Math.min(position.x - 100, window.innerWidth - 220),
              top: Math.min(
                position.y - 20,
                window.innerHeight - options.length * 48 - 40
              ),
            }}
          >
            {options.map((option, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={() => handleSelect(option)}
                disabled={option.disabled}
                className={cn(
                  'w-full justify-start font-normal',
                  // Mobile optimizations
                  isMobile && [
                    'min-h-[48px] text-base touch-manipulation',
                    'focus-visible:ring-2 focus-visible:ring-offset-1',
                  ]
                )}
              >
                {option.icon && <option.icon className="mr-3 h-5 w-5" />}
                {option.label}
              </Button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
