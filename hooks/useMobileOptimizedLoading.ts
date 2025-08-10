'use client';

import * as React from 'react';
import { useIsMobile } from './use-mobile';

interface MobileOptimizedLoadingOptions {
  mobileDelay?: number;
  desktopDelay?: number;
  enableProgressiveLoading?: boolean;
}

export function useMobileOptimizedLoading(
  loadingFunction: () => Promise<any>,
  dependencies: React.DependencyList,
  options: MobileOptimizedLoadingOptions = {}
) {
  const isMobile = useIsMobile();
  const {
    mobileDelay = 100,
    desktopDelay = 0,
    enableProgressiveLoading = true,
  } = options;

  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);

  const load = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Add delay for mobile to prevent UI jank
      const delay = isMobile ? mobileDelay : desktopDelay;
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      if (enableProgressiveLoading) {
        setProgress(25);
      }

      const result = await loadingFunction();

      if (enableProgressiveLoading) {
        setProgress(75);
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setData(result);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 200);
    }
  }, [loadingFunction, isMobile, mobileDelay, desktopDelay, enableProgressiveLoading]);

  React.useEffect(() => {
    load();
  }, dependencies);

  return {
    isLoading,
    data,
    error,
    progress,
    reload: load,
    isMobile,
  };
}

export function useMobileIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const isMobile = useIsMobile();
  const targetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!targetRef.current) return;

    // On mobile, use a larger root margin for earlier loading
    const mobileOptions = {
      ...options,
      rootMargin: isMobile ? '100px' : (options.rootMargin || '0px'),
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback();
          }
        });
      },
      mobileOptions
    );

    observer.observe(targetRef.current);

    return () => observer.disconnect();
  }, [callback, isMobile, options]);

  return targetRef;
}

export function useMobileOptimizedDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const isMobile = useIsMobile();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Use longer debounce on mobile to reduce unnecessary API calls
  const mobileDelay = isMobile ? delay * 1.5 : delay;

  const debouncedCallback = React.useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, mobileDelay);
    },
    [callback, mobileDelay]
  ) as T;

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}