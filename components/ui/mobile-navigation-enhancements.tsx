'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isMobileDevice, addSwipeGesture } from '@/lib/mobile-utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

// Mobile tab navigation with swipe support
export interface MobileTabNavigationProps {
  tabs: Array<{
    id: string;
    label: string;
    badge?: number;
    disabled?: boolean;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  enableSwipeNavigation?: boolean;
}

export function MobileTabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className,
  enableSwipeNavigation = true,
}: MobileTabNavigationProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const { selectionFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle swipe navigation
  React.useEffect(() => {
    if (!enableSwipeNavigation || !isMobile || !scrollRef.current) return;

    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);

    const handleSwipeLeft = () => {
      const nextIndex = Math.min(currentIndex + 1, tabs.length - 1);
      if (nextIndex !== currentIndex && !tabs[nextIndex].disabled) {
        onTabChange(tabs[nextIndex].id);
      }
    };

    const handleSwipeRight = () => {
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex && !tabs[prevIndex].disabled) {
        onTabChange(tabs[prevIndex].id);
      }
    };

    const cleanup = addSwipeGesture(
      scrollRef.current,
      handleSwipeLeft,
      handleSwipeRight,
      50
    );

    return cleanup;
  }, [activeTab, tabs, onTabChange, enableSwipeNavigation, isMobile]);

  // Scroll active tab into view
  React.useEffect(() => {
    if (!scrollRef.current) return;

    const activeButton = scrollRef.current.querySelector(
      `[data-tab="${activeTab}"]`
    );
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  const handleTabClick = (tabId: string) => {
    selectionFeedback();
    onTabChange(tabId);
  };

  return (
    <div className={cn('border-b bg-background', className)}>
      <ScrollArea className="w-full">
        <div
          ref={scrollRef}
          className="flex items-center gap-1 px-4 py-2 min-w-max"
        >
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              data-tab={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'relative whitespace-nowrap touch-manipulation',
                // Mobile optimizations
                isMobile && [
                  'min-h-[44px] min-w-[80px] text-base',
                  'focus-visible:ring-2 focus-visible:ring-offset-1',
                ],
                activeTab === tab.id && 'bg-primary text-primary-foreground'
              )}
            >
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Mobile breadcrumb navigation with collapse
export interface MobileBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  maxItems?: number;
  className?: string;
}

export function MobileBreadcrumb({
  items,
  maxItems = 3,
  className,
}: MobileBreadcrumbProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const { tapFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldCollapse = items.length > maxItems;
  const displayItems =
    shouldCollapse && !showAll ? [items[0], ...items.slice(-2)] : items;

  const handleItemClick = (item: (typeof items)[0]) => {
    tapFeedback();
    if (item.onClick) {
      item.onClick();
    }
  };

  const handleShowMore = () => {
    tapFeedback();
    setShowAll(true);
  };

  return (
    <nav className={cn('flex items-center space-x-1 text-sm', className)}>
      {displayItems.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}

          {/* Show collapse indicator */}
          {shouldCollapse &&
            !showAll &&
            index === 1 &&
            items.length > maxItems && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowMore}
                  className={cn(
                    'h-auto p-1 text-muted-foreground hover:text-foreground',
                    isMobile && 'min-h-[44px] min-w-[44px] touch-manipulation'
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Show more items</span>
                </Button>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleItemClick(item)}
            disabled={!item.href && !item.onClick}
            className={cn(
              'h-auto p-1 font-normal',
              index === displayItems.length - 1
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
              isMobile && [
                'min-h-[44px] touch-manipulation',
                'focus-visible:ring-2 focus-visible:ring-offset-1',
              ]
            )}
          >
            <span className="truncate max-w-[120px] sm:max-w-none">
              {item.label}
            </span>
          </Button>
        </React.Fragment>
      ))}
    </nav>
  );
}

// Mobile action sheet (bottom sheet with actions)
export interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
  }>;
  className?: string;
}

export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  actions,
  className,
}: MobileActionSheetProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const { tapFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleActionClick = (action: (typeof actions)[0]) => {
    tapFeedback();
    action.onClick();
    onClose();
  };

  const handleClose = () => {
    tapFeedback();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={handleClose} />

      {/* Action sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background border-t rounded-t-lg',
          'animate-in slide-in-from-bottom duration-300',
          className
        )}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="font-semibold">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className={cn(
                'h-8 w-8 p-0',
                isMobile && 'min-h-[44px] min-w-[44px] touch-manipulation'
              )}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 space-y-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={
                action.variant === 'destructive' ? 'destructive' : 'ghost'
              }
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className={cn(
                'w-full justify-start h-12 text-left font-normal',
                isMobile && [
                  'min-h-[48px] text-base touch-manipulation',
                  'focus-visible:ring-2 focus-visible:ring-offset-1',
                ]
              )}
            >
              {action.icon && <action.icon className="mr-3 h-5 w-5" />}
              {action.label}
            </Button>
          ))}
        </div>

        {/* Safe area padding for iOS */}
        <div className="pb-safe" />
      </div>
    </>
  );
}

// Mobile floating action menu
export interface MobileFloatingActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  mainAction: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  };
  actions: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    color?: string;
  }>;
  className?: string;
}

export function MobileFloatingActionMenu({
  isOpen,
  onToggle,
  mainAction,
  actions,
  className,
}: MobileFloatingActionMenuProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const { tapFeedback, impactFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMainActionClick = () => {
    impactFeedback();
    onToggle();
  };

  const handleActionClick = (action: (typeof actions)[0]) => {
    tapFeedback();
    action.onClick();
    onToggle();
  };

  return (
    <div className={cn('fixed bottom-20 right-6 z-50', className)}>
      {/* Action items */}
      {isOpen && (
        <div className="mb-4 space-y-3">
          {actions.map((action, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center justify-end',
                'animate-in slide-in-from-bottom duration-200',
                `animation-delay-${index * 50}`
              )}
            >
              {/* Label */}
              <div className="mr-3 px-3 py-1 bg-background border rounded-lg shadow-lg">
                <span className="text-sm font-medium whitespace-nowrap">
                  {action.label}
                </span>
              </div>

              {/* Action button */}
              <Button
                size="icon"
                onClick={() => handleActionClick(action)}
                className={cn(
                  'h-12 w-12 rounded-full shadow-lg',
                  action.color || 'bg-primary hover:bg-primary/90',
                  isMobile && [
                    'min-h-[48px] min-w-[48px] touch-manipulation',
                    'focus-visible:ring-2 focus-visible:ring-offset-1',
                  ]
                )}
              >
                <action.icon className="h-5 w-5" />
                <span className="sr-only">{action.label}</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="icon"
        onClick={handleMainActionClick}
        className={cn(
          'h-14 w-14 rounded-full shadow-lg',
          'bg-primary hover:bg-primary/90',
          'transition-transform duration-200',
          isOpen && 'rotate-45',
          isMobile && [
            'min-h-[56px] min-w-[56px] touch-manipulation',
            'focus-visible:ring-2 focus-visible:ring-offset-1',
          ]
        )}
      >
        <mainAction.icon className="h-6 w-6" />
        <span className="sr-only">{mainAction.label}</span>
      </Button>

      {/* Backdrop when open */}
      {isOpen && <div className="fixed inset-0 -z-10" onClick={onToggle} />}
    </div>
  );
}

// Mobile step navigation
export interface MobileStepNavigationProps {
  steps: Array<{
    id: string;
    label: string;
    completed?: boolean;
    current?: boolean;
  }>;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function MobileStepNavigation({
  steps,
  onStepClick,
  className,
}: MobileStepNavigationProps) {
  const [isMobile, setIsMobile] = React.useState(false);
  const { tapFeedback } = useHapticFeedback();

  // Check if mobile on mount and resize
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileDevice());
    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStepClick = (stepId: string) => {
    tapFeedback();
    onStepClick?.(stepId);
  };

  return (
    <div className={cn('bg-background border-b', className)}>
      <ScrollArea className="w-full">
        <div className="flex items-center px-4 py-3 space-x-4 min-w-max">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step indicator */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStepClick(step.id)}
                disabled={!onStepClick}
                className={cn(
                  'flex items-center space-x-2 whitespace-nowrap',
                  isMobile && [
                    'min-h-[44px] touch-manipulation',
                    'focus-visible:ring-2 focus-visible:ring-offset-1',
                  ]
                )}
              >
                {/* Step number/check */}
                <div
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                    step.completed && 'bg-primary text-primary-foreground',
                    step.current &&
                      !step.completed &&
                      'bg-primary/20 text-primary border-2 border-primary',
                    !step.completed &&
                      !step.current &&
                      'bg-muted text-muted-foreground'
                  )}
                >
                  {step.completed ? '✓' : index + 1}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    'text-sm',
                    step.current && 'font-medium text-foreground',
                    step.completed && 'text-foreground',
                    !step.completed && !step.current && 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </span>
              </Button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-8 h-0.5',
                    steps[index + 1].completed || step.completed
                      ? 'bg-primary'
                      : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
