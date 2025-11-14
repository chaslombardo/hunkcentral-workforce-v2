'use client';

import { useState, useEffect } from 'react';
import { serviceWorkerManager } from '@/lib/serviceWorker';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasBeenOffline, setHasBeenOffline] = useState(false);

  useEffect(() => {
    // Initialize with current status
    setIsOnline(serviceWorkerManager.getOnlineStatus());

    // Set up listeners
    const unsubscribeOnline = serviceWorkerManager.onOnline(() => {
      setIsOnline(true);
    });

    const unsubscribeOffline = serviceWorkerManager.onOffline(() => {
      setIsOnline(false);
      setHasBeenOffline(true);
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    hasBeenOffline,
  };
}

export function useOfflineStorage() {
  const storeData = async (key: string, data: unknown) => {
    await serviceWorkerManager.storeOfflineData(key, data);
  };

  const getData = async (key: string) => {
    return await serviceWorkerManager.getOfflineData(key);
  };

  const removeData = async (key: string) => {
    await serviceWorkerManager.removeOfflineData(key);
  };

  const getAllKeys = async () => {
    return await serviceWorkerManager.getOfflineDataKeys();
  };

  return {
    storeData,
    getData,
    removeData,
    getAllKeys,
  };
}

export function useOfflineSync() {
  const [pendingSync, setPendingSync] = useState<string[]>([]);

  useEffect(() => {
    const checkPendingSync = async () => {
      const keys = await serviceWorkerManager.getOfflineDataKeys();
      setPendingSync(keys);
    };

    checkPendingSync();

    // Check periodically
    const interval = setInterval(checkPendingSync, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const syncData = async (key: string) => {
    // This would trigger a sync for specific data
    // Implementation depends on your specific sync logic
    // Sync logic would be implemented here
  };

  return {
    pendingSync,
    syncData,
    hasPendingSync: pendingSync.length > 0,
  };
}
