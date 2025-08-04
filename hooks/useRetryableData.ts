'use client';

import * as React from 'react';

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: Error) => boolean;
}

interface RetryState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  isRetrying: boolean;
  canRetry: boolean;
}

interface RetryActions {
  retry: () => Promise<void>;
  reset: () => void;
  forceRefresh: () => Promise<void>;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryCondition: () => true,
};

export function useRetryableData<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = [],
  config: RetryConfig = {}
): [RetryState<T>, RetryActions] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = React.useState<RetryState<T>>({
    data: null,
    isLoading: false,
    error: null,
    retryCount: 0,
    isRetrying: false,
    canRetry: true,
  });

  const abortControllerRef = React.useRef<AbortController | null>(null);

  const calculateDelay = React.useCallback((attempt: number): number => {
    const delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffFactor, attempt);
    return Math.min(delay, finalConfig.maxDelay);
  }, [finalConfig.baseDelay, finalConfig.backoffFactor, finalConfig.maxDelay]);

  const executeWithRetry = React.useCallback(async (isRetry = false) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      isRetrying: isRetry,
      error: null,
    }));

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Add delay for retry attempts
        if (attempt > 0) {
          const delay = calculateDelay(attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Check if request was aborted during delay
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }
        }

        const result = await fetchFn();
        
        // Success - update state and exit
        setState(prev => ({
          ...prev,
          data: result,
          isLoading: false,
          isRetrying: false,
          error: null,
          retryCount: attempt,
          canRetry: true,
        }));
        
        return;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check if we should retry this error
        if (!finalConfig.retryCondition(lastError)) {
          break;
        }
        
        // Update retry count
        setState(prev => ({
          ...prev,
          retryCount: attempt,
        }));
        
        // If this was the last attempt, break
        if (attempt === finalConfig.maxRetries) {
          break;
        }
      }
    }

    // All retries failed
    setState(prev => ({
      ...prev,
      isLoading: false,
      isRetrying: false,
      error: lastError?.message || 'Failed to load data',
      canRetry: finalConfig.retryCondition(lastError!),
    }));
  }, [fetchFn, finalConfig, calculateDelay]);

  // Initial load
  React.useEffect(() => {
    executeWithRetry();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  const retry = React.useCallback(async () => {
    if (!state.canRetry || state.isLoading) return;
    await executeWithRetry(true);
  }, [executeWithRetry, state.canRetry, state.isLoading]);

  const reset = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setState({
      data: null,
      isLoading: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
      canRetry: true,
    });
  }, []);

  const forceRefresh = React.useCallback(async () => {
    reset();
    await executeWithRetry();
  }, [reset, executeWithRetry]);

  const actions: RetryActions = {
    retry,
    reset,
    forceRefresh,
  };

  return [state, actions];
}

// Specialized hook for network-related retries
export function useNetworkRetryableData<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  return useRetryableData(
    fetchFn,
    dependencies,
    {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 8000,
      backoffFactor: 2,
      retryCondition: (error: Error) => {
        // Retry on network errors, timeouts, and 5xx server errors
        const message = error.message.toLowerCase();
        return (
          message.includes('network') ||
          message.includes('fetch') ||
          message.includes('timeout') ||
          message.includes('connection') ||
          message.includes('5') // 5xx errors
        );
      },
    }
  );
}

// Hook for handling graceful degradation
export function useGracefulDegradation<T, F>(
  primaryFn: () => Promise<T>,
  fallbackFn: () => Promise<F> | F,
  dependencies: React.DependencyList = []
) {
  const [data, setData] = React.useState<T | F | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [usingFallback, setUsingFallback] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setUsingFallback(false);

    try {
      // Try primary function first
      const result = await primaryFn();
      setData(result);
    } catch (primaryError) {
      console.warn('Primary data source failed, trying fallback:', primaryError);
      
      try {
        // Try fallback function
        const fallbackResult = await fallbackFn();
        setData(fallbackResult);
        setUsingFallback(true);
        setError(`Primary source unavailable (using fallback): ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`);
      } catch (fallbackError) {
        // Both failed
        setError(`Both primary and fallback sources failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [primaryFn, fallbackFn]);

  React.useEffect(() => {
    loadData();
  }, dependencies);

  return {
    data,
    isLoading,
    error,
    usingFallback,
    retry: loadData,
  };
}