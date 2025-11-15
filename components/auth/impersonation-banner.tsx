'use client';

import { IconAlertTriangle, IconUserX } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';

interface ImpersonationBannerProps {
  className?: string;
}

export function ImpersonationBanner({ className }: ImpersonationBannerProps) {
  const {
    impersonation,
    stopImpersonation,
    isStoppingImpersonation,
    impersonationError,
  } = useSession();

  if (!impersonation?.isImpersonating) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-amber-300 bg-amber-100/90 px-4 py-3 text-amber-900 shadow-sm dark:border-amber-500/50 dark:bg-amber-900/30 dark:text-amber-50',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <IconAlertTriangle className="h-5 w-5 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">
              Viewing as {impersonation.targetFullName || 'another user'}
            </p>
            <p className="text-xs text-amber-900/80 dark:text-amber-100/80">
              Original session: {impersonation.originalFullName || 'Unknown'}.
              All actions are tracked under the impersonated account.
            </p>
            {impersonationError && (
              <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                {impersonationError}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={stopImpersonation}
            disabled={isStoppingImpersonation}
            className="border-amber-600 text-amber-900 hover:bg-amber-200 dark:border-amber-400 dark:text-amber-50"
          >
            <IconUserX className="mr-1 h-4 w-4" />
            {isStoppingImpersonation ? 'Restoring…' : 'Return to my account'}
          </Button>
        </div>
      </div>
    </div>
  );
}
