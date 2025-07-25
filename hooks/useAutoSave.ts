'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormWatch } from 'react-hook-form';
import { saveDraftLog, type LogActionResult } from '@/lib/actions/logs';
import { type DailyLogFormData } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  watch: UseFormWatch<DailyLogFormData>;
  logId: string | null;
  interval?: number; // Auto-save interval in milliseconds (default: 30 seconds)
  enabled?: boolean; // Whether auto-save is enabled
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  saveNow: () => Promise<LogActionResult>;
  error: string | null;
}

export function useAutoSave({
  watch,
  logId,
  interval = 30000, // 30 seconds
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentLogId, setCurrentLogId] = useState<string | null>(logId);
  
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');
  const isSavingRef = useRef(false);

  // Watch all form data
  const formData = watch();

  const saveNow = useCallback(async (): Promise<LogActionResult> => {
    if (isSavingRef.current) {
      return { success: false, error: 'Save already in progress' };
    }

    try {
      isSavingRef.current = true;
      setStatus('saving');
      setError(null);

      const result = await saveDraftLog(currentLogId, formData);

      if (result.success) {
        setStatus('saved');
        setLastSaved(new Date());
        setError(null);
        
        // Update logId if this was a new log
        if (result.data?.id && !currentLogId) {
          setCurrentLogId(result.data.id);
        }

        // Update the last saved data reference
        lastDataRef.current = JSON.stringify(formData);
      } else {
        setStatus('error');
        setError(result.error || 'Save failed');
        
        // Show error toast for manual saves
        toast({
          title: 'Save Failed',
          description: result.error || 'Unable to save your changes. Please try again.',
          variant: 'destructive',
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';
      setStatus('error');
      setError(errorMessage);
      
      toast({
        title: 'Save Failed',
        description: errorMessage,
        variant: 'destructive',
      });

      return { success: false, error: errorMessage };
    } finally {
      isSavingRef.current = false;
    }
  }, [currentLogId, formData, toast]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    const currentData = JSON.stringify(formData);
    
    // Don't save if data hasn't changed
    if (currentData === lastDataRef.current) {
      return;
    }

    // Don't save if form is empty (no jobs or hours)
    if (formData.jobs.length === 0 && formData.hours.length === 0) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      // Double-check data hasn't changed during timeout
      const latestData = JSON.stringify(watch());
      if (latestData !== lastDataRef.current && !isSavingRef.current) {
        const result = await saveNow();
        
        // Only show success toast for auto-saves if there was a previous error
        if (result.success && status === 'error') {
          toast({
            title: 'Auto-saved',
            description: 'Your changes have been automatically saved.',
          });
        }
      }
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, enabled, interval, saveNow, status, toast, watch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Reset status after a delay when saved
  useEffect(() => {
    if (status === 'saved') {
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 3000); // Show "saved" status for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [status]);

  return {
    status,
    lastSaved,
    saveNow,
    error,
  };
}