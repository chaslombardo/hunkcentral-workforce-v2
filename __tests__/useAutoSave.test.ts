/**
 * Unit tests for useAutoSave hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { useAutoSave } from '@/hooks/useAutoSave';
import type { DailyLogFormData } from '@/lib/validations';

// Mock the server action
vi.mock('@/lib/actions/logs', () => ({
  saveDraftLog: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const { saveDraftLog } = await import('@/lib/actions/logs');

describe('useAutoSave Hook', () => {
  const mockFormData: DailyLogFormData = {
    captainId: 'test-captain',
    logDate: new Date(),
    sections: { junk: true, move: false, otherHours: false },
    jobs: [
      {
        jobType: 'junk' as const,
        jobId: 'J123',
        clientName: 'Test Client',
        revenue: 100,
        tips: 10,
      },
    ],
    disposalCost: 0,
    hours: [],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(saveDraftLog).mockResolvedValue({
      success: true,
      data: { id: 'test-log-id', status: 'draft', updatedAt: new Date() },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should initialize with idle status', () => {
    const { result } = renderHook(() => {
      const form = useForm<DailyLogFormData>({
        defaultValues: mockFormData,
      });

      return useAutoSave({
        watch: form.watch,
        logId: null,
        interval: 1000,
        enabled: true,
      });
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.lastSaved).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should save manually when saveNow is called', async () => {
    const { result } = renderHook(() => {
      const form = useForm<DailyLogFormData>({
        defaultValues: mockFormData,
      });

      return useAutoSave({
        watch: form.watch,
        logId: null,
        interval: 1000,
        enabled: true,
      });
    });

    await act(async () => {
      const saveResult = await result.current.saveNow();
      expect(saveResult.success).toBe(true);
    });

    expect(vi.mocked(saveDraftLog)).toHaveBeenCalledWith(null, mockFormData);
    expect(result.current.status).toBe('saved');
    expect(result.current.lastSaved).toBeTruthy();
  });

  it('should handle save errors', async () => {
    vi.mocked(saveDraftLog).mockResolvedValue({
      success: false,
      error: 'Save failed',
    });

    const { result } = renderHook(() => {
      const form = useForm<DailyLogFormData>({
        defaultValues: mockFormData,
      });

      return useAutoSave({
        watch: form.watch,
        logId: null,
        interval: 1000,
        enabled: true,
      });
    });

    await act(async () => {
      const saveResult = await result.current.saveNow();
      expect(saveResult.success).toBe(false);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Save failed');
  });

  it('should have auto-save functionality available', () => {
    const { result } = renderHook(() => {
      const form = useForm<DailyLogFormData>({
        defaultValues: mockFormData,
      });

      return useAutoSave({
        watch: form.watch,
        logId: null,
        interval: 1000,
        enabled: true,
      });
    });

    // Verify the hook returns the expected interface
    expect(result.current).toHaveProperty('status');
    expect(result.current).toHaveProperty('lastSaved');
    expect(result.current).toHaveProperty('saveNow');
    expect(result.current).toHaveProperty('error');
    expect(typeof result.current.saveNow).toBe('function');
  });

  it('should not auto-save when disabled', async () => {
    const { result, rerender } = renderHook(
      ({ formData }) => {
        const form = useForm<DailyLogFormData>({
          defaultValues: formData,
        });

        return useAutoSave({
          watch: form.watch,
          logId: null,
          interval: 1000,
          enabled: false, // Disabled
        });
      },
      {
        initialProps: { formData: mockFormData },
      }
    );

    // Change form data
    const updatedFormData = {
      ...mockFormData,
      jobs: [
        ...mockFormData.jobs,
        {
          jobType: 'junk' as const,
          jobId: 'J456',
          clientName: 'Another Client',
          revenue: 200,
          tips: 20,
        },
      ],
    };

    rerender({ formData: updatedFormData });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should not have called save
    expect(vi.mocked(saveDraftLog)).not.toHaveBeenCalled();
  });

  it('should not auto-save empty forms', async () => {
    const emptyFormData: DailyLogFormData = {
      captainId: 'test-captain',
      logDate: new Date(),
      sections: { junk: true, move: false, otherHours: false },
      jobs: [], // Empty
      disposalCost: 0,
      hours: [], // Empty
    };

    const { result } = renderHook(() => {
      const form = useForm<DailyLogFormData>({
        defaultValues: emptyFormData,
      });

      return useAutoSave({
        watch: form.watch,
        logId: null,
        interval: 1000,
        enabled: true,
      });
    });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should not have called save for empty form
    expect(vi.mocked(saveDraftLog)).not.toHaveBeenCalled();
  });

  it('should prevent concurrent saves', async () => {
    const { result } = renderHook(() => {
      const form = useForm<DailyLogFormData>({
        defaultValues: mockFormData,
      });

      return useAutoSave({
        watch: form.watch,
        logId: null,
        interval: 1000,
        enabled: true,
      });
    });

    // Start first save (don't await)
    const firstSave = result.current.saveNow();

    // Try to start second save immediately
    const secondSave = await result.current.saveNow();

    expect(secondSave.success).toBe(false);
    expect(secondSave.error).toBe('Save already in progress');

    // Wait for first save to complete
    await firstSave;
    expect(vi.mocked(saveDraftLog)).toHaveBeenCalledTimes(1);
  });
});
