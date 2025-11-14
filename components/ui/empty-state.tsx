'use client';

import * as React from 'react';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?:
    | {
        label: string;
        onClick: () => void;
        variant?: 'default' | 'outline' | 'secondary';
        disabled?: boolean;
      }
    | {
        label: string;
        href: string;
        variant?: 'default' | 'outline' | 'secondary';
        disabled?: boolean;
      };
  secondaryAction?:
    | {
        label: string;
        onClick: () => void;
        variant?: 'default' | 'outline' | 'secondary';
        disabled?: boolean;
      }
    | {
        label: string;
        href: string;
        variant?: 'default' | 'outline' | 'secondary';
        disabled?: boolean;
      };
  illustration?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'card';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  size = 'md',
  variant = 'default',
  className,
  ...props
}: EmptyStateProps) {
  const sizeClasses = {
    sm: 'p-6 space-y-3',
    md: 'p-8 space-y-4',
    lg: 'p-12 space-y-6',
  };

  const iconSizes = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const iconInnerSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses[size],
        className
      )}
      role="region"
      aria-label="Empty state"
      {...props}
    >
      {/* Custom illustration or icon */}
      {illustration ? (
        <div className="mb-2">{illustration}</div>
      ) : Icon ? (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-muted/50 border-2 border-dashed border-muted-foreground/20',
            iconSizes[size]
          )}
        >
          <Icon
            className={cn('text-muted-foreground', iconInnerSizes[size])}
            aria-hidden="true"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <h3
          className={cn(
            'font-semibold text-foreground',
            size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg'
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn(
              'text-muted-foreground',
              size === 'sm'
                ? 'text-xs max-w-xs'
                : size === 'lg'
                  ? 'text-base max-w-md'
                  : 'text-sm max-w-sm'
            )}
          >
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div
          className={cn(
            'flex gap-3',
            size === 'sm' ? 'pt-1' : size === 'lg' ? 'pt-4' : 'pt-2',
            secondaryAction ? 'flex-col sm:flex-row' : 'flex-col'
          )}
        >
          {action && (
            <div>
              {'onClick' in action ? (
                <Button
                  onClick={action.onClick}
                  variant={action.variant}
                  disabled={action.disabled}
                  className={cn(
                    action.variant === 'default' &&
                      'bg-[#026937] hover:bg-[#026937]/90',
                    size === 'sm' && 'h-8 px-3 text-xs'
                  )}
                >
                  {action.label}
                </Button>
              ) : (
                <Button
                  asChild
                  variant={action.variant}
                  disabled={action.disabled}
                  className={cn(
                    action.variant === 'default' &&
                      'bg-[#026937] hover:bg-[#026937]/90',
                    size === 'sm' && 'h-8 px-3 text-xs'
                  )}
                >
                  <a href={action.href}>{action.label}</a>
                </Button>
              )}
            </div>
          )}

          {secondaryAction && (
            <div>
              {'onClick' in secondaryAction ? (
                <Button
                  onClick={secondaryAction.onClick}
                  variant={secondaryAction.variant || 'outline'}
                  disabled={secondaryAction.disabled}
                  className={cn(
                    secondaryAction.variant === 'default' &&
                      'bg-[#ea7200] hover:bg-[#ea7200]/90',
                    size === 'sm' && 'h-8 px-3 text-xs'
                  )}
                >
                  {secondaryAction.label}
                </Button>
              ) : (
                <Button
                  asChild
                  variant={secondaryAction.variant || 'outline'}
                  disabled={secondaryAction.disabled}
                  className={cn(
                    secondaryAction.variant === 'default' &&
                      'bg-[#ea7200] hover:bg-[#ea7200]/90',
                    size === 'sm' && 'h-8 px-3 text-xs'
                  )}
                >
                  <a href={secondaryAction.href}>{secondaryAction.label}</a>
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'card') {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/20">
        {content}
      </Card>
    );
  }

  return content;
}
