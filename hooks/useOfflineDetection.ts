'use client';

import * as React from 'react';

export interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
}

export function useOfflineDetection(): OfflineState {
  const [isOnline, setIsOnline] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Assume online during SSR
  });

  const [wasOffline, setWasOffline] = React.useState(false);
  const [lastOnlineAt, setLastOnlineAt] = React.useState<Date | null>(null);
  const [lastOfflineAt, setLastOfflineAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineAt(new Date());
      if (!navigator.onLine) {
        // Browser reported online but navigator.onLine is still false
        // This can happen during the transition, so we'll double-check
        setTimeout(() => {
          if (navigator.onLine) {
            setIsOnline(true);
          }
        }, 100);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setLastOfflineAt(new Date());
    };

    // Set initial state
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Additional check using fetch to a reliable endpoint
    // This helps detect when the browser thinks it's online but there's no actual connectivity
    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      try {
        // Use a small, fast request to check connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        await fetch('/api/health', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache',
        });

        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (error) {
        // If the request fails, we might be offline or have connectivity issues
        if (navigator.onLine) {
          // Browser thinks we're online but request failed
          // This could indicate poor connectivity or server issues
          // Connectivity check failed despite navigator.onLine being true
        }
        setIsOnline(false);
        setWasOffline(true);
        setLastOfflineAt(new Date());
      }
    };

    // Check connectivity on mount
    checkConnectivity();

    // Periodically check connectivity when online
    const connectivityInterval = setInterval(() => {
      if (navigator.onLine) {
        checkConnectivity();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(connectivityInterval);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    lastOnlineAt,
    lastOfflineAt,
  };
}

// Hook for components that need to react to connectivity changes
export function useConnectivityActions() {
  const offlineState = useOfflineDetection();
  const [showOfflineNotice, setShowOfflineNotice] = React.useState(false);

  React.useEffect(() => {
    if (offlineState.isOffline) {
      setShowOfflineNotice(true);
    } else if (offlineState.wasOffline && offlineState.isOnline) {
      // Just came back online
      setShowOfflineNotice(false);
      
      // Optionally trigger a data refresh
      // This could be handled by the consuming component
    }
  }, [offlineState.isOnline, offlineState.isOffline, offlineState.wasOffline]);

  const dismissOfflineNotice = React.useCallback(() => {
    setShowOfflineNotice(false);
  }, []);

  return {
    ...offlineState,
    showOfflineNotice,
    dismissOfflineNotice,
  };
}