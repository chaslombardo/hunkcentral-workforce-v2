'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NavigationBadgeProps {
  count: number;
  type?: 'pending' | 'warning' | 'info';
  className?: string;
  size?: 'sm' | 'md';
}

export function NavigationBadge({
  count,
  type = 'pending',
  className,
  size = 'sm',
}: NavigationBadgeProps) {
  if (count <= 0) return null;

  const getVariantAndColors = () => {
    switch (type) {
      case 'pending':
        return {
          variant: 'default' as const,
          className: 'bg-hunks-green text-white hover:bg-hunks-green/90',
        };
      case 'warning':
        return {
          variant: 'secondary' as const,
          className: 'bg-hunks-orange text-white hover:bg-hunks-orange/90',
        };
      case 'info':
        return {
          variant: 'outline' as const,
          className:
            'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
        };
      default:
        return {
          variant: 'default' as const,
          className: '',
        };
    }
  };

  const { variant, className: variantClassName } = getVariantAndColors();

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-1.5 py-0.5 min-w-[18px] h-[18px]'
      : 'text-xs px-2 py-1 min-w-[20px] h-[20px]';

  // Format count display (show 99+ for counts over 99)
  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <Badge
      variant={variant}
      className={cn(
        'rounded-full flex items-center justify-center font-medium',
        sizeClasses,
        variantClassName,
        className
      )}
    >
      {displayCount}
    </Badge>
  );
}

// Wrapper component for navigation items with badges
interface NavigationItemWithBadgeProps {
  children: React.ReactNode;
  badgeCount?: number;
  badgeType?: 'pending' | 'warning' | 'info';
  className?: string;
}

export function NavigationItemWithBadge({
  children,
  badgeCount = 0,
  badgeType = 'pending',
  className,
}: NavigationItemWithBadgeProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      {children}
      {badgeCount > 0 && (
        <NavigationBadge
          count={badgeCount}
          type={badgeType}
          className="absolute -top-1 -right-1 z-10"
          size="sm"
        />
      )}
    </div>
  );
}
