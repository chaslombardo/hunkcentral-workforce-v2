'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

export interface MobileFormProps
  extends Omit<React.ComponentProps<'form'>, 'autoSave'> {
  title?: string;
  description?: string;
  autoSave?: {
    enabled: boolean;
    interval?: number; // in milliseconds
    onSave: () => Promise<{ success: boolean; error?: string }>;
    lastSaved?: Date | null;
    status: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
    error?: string | null;
  };
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  submitButton?: {
    text: string;
    loadingText?: string;
    disabled?: boolean;
    loading?: boolean;
  };
  saveButton?: {
    text: string;
    loadingText?: string;
    onSave: () => Promise<void>;
  };
  children: React.ReactNode;
}

export function MobileForm({
  title,
  description,
  autoSave,
  onSubmit,
  submitButton,
  saveButton,
  children,
  className,
  ...props
}: MobileFormProps) {
  const { isOnline } = useOffline();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  // Auto-save timer
  React.useEffect(() => {
    if (!autoSave?.enabled || !autoSave.onSave) return;

    const interval = setInterval(async () => {
      if (autoSave.status !== 'saving') {
        await autoSave.onSave();
      }
    }, autoSave.interval || 30000); // Default 30 seconds

    return () => clearInterval(interval);
  }, [autoSave]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSave = async () => {
    if (!saveButton?.onSave || isSaving) return;

    setIsSaving(true);
    try {
      await saveButton.onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const getAutoSaveStatus = () => {
    if (!autoSave) return null;

    const { status, lastSaved } = autoSave;

    switch (status) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-sm text-hunks-green">
            <CheckCircle2 className="h-4 w-4" />
            <span>Auto-saved</span>
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                {lastSaved.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Saved offline</span>
            {lastSaved && (
              <span className="text-xs text-muted-foreground">
                {lastSaved.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Save failed</span>
          </div>
        );
      case 'idle':
        if (lastSaved) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs">
                Last saved{' '}
                {lastSaved.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <Card className={cn('mobile-form-optimization', className)}>
      {(title || description) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <CardTitle className="text-hunks-green">{title}</CardTitle>
              )}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            <div className="flex items-center gap-2">
              {/* Connection status */}
              <Badge
                variant={isOnline ? 'default' : 'secondary'}
                className="text-xs"
              >
                {isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent>
        <form
          onSubmit={handleSubmit}
          className={cn(
            'space-y-6',
            // Mobile form optimizations
            'touch-manipulation',
            // Better spacing on mobile
            'sm:space-y-4'
          )}
          {...props}
        >
          {/* Auto-save error alert */}
          {autoSave?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Auto-save failed: {autoSave.error}. Your changes may not be
                saved automatically.
              </AlertDescription>
            </Alert>
          )}

          {/* Form content */}
          <div className="space-y-4">{children}</div>

          {/* Form actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t">
            {/* Auto-save status */}
            <div className="flex-1">{getAutoSaveStatus()}</div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Manual save button */}
              {saveButton && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleManualSave}
                  disabled={isSaving || autoSave?.status === 'saving'}
                  className={cn(
                    'border-hunks-orange text-hunks-orange hover:bg-hunks-orange hover:text-white',
                    'min-h-[48px] touch-manipulation' // Mobile optimization
                  )}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {saveButton.loadingText || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {saveButton.text}
                    </>
                  )}
                </Button>
              )}

              {/* Submit button */}
              {submitButton && (
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    submitButton.disabled ||
                    autoSave?.status === 'saving'
                  }
                  className={cn(
                    'bg-hunks-green hover:bg-hunks-green/90 text-white',
                    'min-h-[48px] touch-manipulation' // Mobile optimization
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {submitButton.loadingText || 'Submitting...'}
                    </>
                  ) : (
                    submitButton.text
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Hook for managing mobile form state
export function useMobileForm() {
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<
    'idle' | 'saving' | 'saved' | 'error' | 'offline'
  >('idle');
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  const [autoSaveError, setAutoSaveError] = React.useState<string | null>(null);

  const createAutoSaveHandler = React.useCallback(
    (saveFunction: () => Promise<{ success: boolean; error?: string }>) => {
      return async () => {
        setAutoSaveStatus('saving');
        setAutoSaveError(null);

        try {
          const result = await saveFunction();

          if (result.success) {
            setAutoSaveStatus('saved');
            setLastSaved(new Date());

            // Reset to idle after 3 seconds
            setTimeout(() => {
              setAutoSaveStatus('idle');
            }, 3000);
          } else {
            setAutoSaveStatus('error');
            setAutoSaveError(result.error || 'Save failed');
          }

          return result;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Save failed';
          setAutoSaveStatus('error');
          setAutoSaveError(errorMessage);
          return { success: false, error: errorMessage };
        }
      };
    },
    []
  );

  return {
    autoSaveStatus,
    lastSaved,
    autoSaveError,
    createAutoSaveHandler,
    setAutoSaveStatus,
    setLastSaved,
    setAutoSaveError,
  };
}
