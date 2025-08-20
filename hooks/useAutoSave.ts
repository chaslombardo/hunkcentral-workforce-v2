'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { UseFormWatch } from 'react-hook-form';
import { saveDraftLog, type LogActionResult } from '@/lib/actions/logs';
import { type DailyLogFormData } from '@/lib/validations';
import { useToast } from '@/hooks/use-toast';
import { useOffline, useOfflineStorage } from './useOffline';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

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
  isOfflineSave: boolean;
}

export function useAutoSave({
  watch,
  logId,
  interval = 30000, // 30 seconds
  enabled = false, // Disabled by default to prevent sync issues
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentLogId, setCurrentLogId] = useState<string | null>(logId);
  const [isOfflineSave, setIsOfflineSave] = useState(false);

  const { toast } = useToast();
  const { isOnline, isOffline } = useOffline();
  const { storeData, getData } = useOfflineStorage();
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

      if (isOffline) {
        // Save offline
        const offlineKey = currentLogId || `draft_${Date.now()}`;
        await storeData(offlineKey, {
          ...formData,
          savedAt: new Date().toISOString(),
          isOffline: true,
        });

        setStatus('offline');
        setLastSaved(new Date());
        setError(null);
        setIsOfflineSave(true);

        // Update the last saved data reference
        lastDataRef.current = JSON.stringify(formData);

        toast({
          title: 'Saved Offline',
          description:
            'Your changes have been saved locally and will sync when you&apos;re back online.',
        });

        return { success: true, data: { id: offlineKey } };
      }

      // Online save
      const result = await saveDraftLog(currentLogId, formData);

      if (result.success) {
        setStatus('saved');
        setLastSaved(new Date());
        setError(null);
        setIsOfflineSave(false);

        // Update logId if this was a new log
        if (result.data?.id && !currentLogId) {
          setCurrentLogId(result.data.id);
        }

        // Update the last saved data reference
        lastDataRef.current = JSON.stringify(formData);
      } else {
        // If online save fails, try offline save as fallback
        try {
          const offlineKey = currentLogId || `draft_${Date.now()}`;
          await storeData(offlineKey, {
            ...formData,
            savedAt: new Date().toISOString(),
            isOffline: true,
            failedOnlineSync: true,
          });

          setStatus('offline');
          setLastSaved(new Date());
          setError('Saved offline due to connection issues');
          setIsOfflineSave(true);

          toast({
            title: 'Saved Offline',
            description:
              'Online save failed, but your changes are saved locally.',
            variant: 'default',
          });

          return { success: true, data: { id: offlineKey } };
        } catch (offlineError) {
          setStatus('error');
          setError(result.error || 'Save failed');

          toast({
            title: 'Save Failed',
            description:
              result.error || 'Unable to save your changes. Please try again.',
            variant: 'destructive',
          });
        }
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Save failed';

      // Try offline save as fallback
      try {
        const offlineKey = currentLogId || `draft_${Date.now()}`;
        await storeData(offlineKey, {
          ...formData,
          savedAt: new Date().toISOString(),
          isOffline: true,
          failedOnlineSync: true,
        });

        setStatus('offline');
        setLastSaved(new Date());
        setError('Saved offline due to connection issues');
        setIsOfflineSave(true);

        toast({
          title: 'Saved Offline',
          description: 'Connection failed, but your changes are saved locally.',
        });

        return { success: true, data: { id: offlineKey } };
      } catch (offlineError) {
        setStatus('error');
        setError(errorMessage);
        setIsOfflineSave(false);

        toast({
          title: 'Save Failed',
          description: errorMessage,
          variant: 'destructive',
        });

        return { success: false, error: errorMessage };
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [currentLogId, formData, toast, isOffline, storeData]);

  // Auto-save effect - disabled to prevent sync issues
  useEffect(() => {
    // Auto-save is disabled by default to prevent problematic sync issues
    // Manual save via saveNow() is still available
    if (!enabled) return;

    // If auto-save is explicitly enabled, keep the original logic
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

  // Load offline data on mount if available
  useEffect(() => {
    const loadOfflineData = async () => {
      if (currentLogId) {
        try {
          const offlineData = (await getData(currentLogId)) as {
            isOffline?: boolean;
            savedAt?: string;
          } | null;
          if (offlineData?.isOffline) {
            setIsOfflineSave(true);
            setLastSaved(
              new Date(offlineData.savedAt || new Date().toISOString())
            );
            setStatus('offline');
          }
        } catch (e) {
          // Ignore load errors
        }
      }
    };

    loadOfflineData();
  }, [currentLogId, getData]);

  return {
    status,
    lastSaved,
    saveNow,
    error,
    isOfflineSave,
  };
}
