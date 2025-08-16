"use client"

// Service Worker registration and management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private isOnline = true
  private onlineCallbacks: (() => void)[] = []
  private offlineCallbacks: (() => void)[] = []

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      this.setupOnlineOfflineListeners()
    }
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.notifyUpdate()
            }
          })
        }
      })

      return this.registration
    } catch {
      // Service Worker registration failed - silently handle in production
      return null
    }
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      return await this.registration.unregister()
    }
    return false
  }

  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.onlineCallbacks.forEach(callback => callback())
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.offlineCallbacks.forEach(callback => callback())
    })
  }

  onOnline(callback: () => void): () => void {
    this.onlineCallbacks.push(callback)
    return () => {
      const index = this.onlineCallbacks.indexOf(callback)
      if (index > -1) {
        this.onlineCallbacks.splice(index, 1)
      }
    }
  }

  onOffline(callback: () => void): () => void {
    this.offlineCallbacks.push(callback)
    return () => {
      const index = this.offlineCallbacks.indexOf(callback)
      if (index > -1) {
        this.offlineCallbacks.splice(index, 1)
      }
    }
  }

  getOnlineStatus(): boolean {
    return this.isOnline
  }

  private notifyUpdate(): void {
    // Optionally show a toast or modal to the user
    if (typeof window !== 'undefined' && 'confirm' in window) {
      if (confirm('A new version of HUNKCentral is available. Refresh now?')) {
        window.location.reload()
      }
    }
  }

  private async syncOfflineData(): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) {
      return
    }

    try {
      // Trigger background sync for different data types
      const syncManager = (this.registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync;
      await syncManager?.register('log-submission')
      await syncManager?.register('commission-submission')
    } catch {
      // Background sync registration failed - silently handle in production
    }
  }

  // Cache management
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0

    let totalSize = 0
    const cacheNames = await caches.keys()

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }

    return totalSize
  }

  // Offline data storage
  async storeOfflineData(key: string, data: unknown): Promise<void> {
    if ('localStorage' in window) {
      try {
        localStorage.setItem(`offline_${key}`, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
      } catch {
        // Failed to store offline data - silently handle in production
      }
    }
  }

  async getOfflineData(key: string): Promise<unknown> {
    if ('localStorage' in window) {
      try {
        const stored = localStorage.getItem(`offline_${key}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.data
        }
      } catch {
        // Failed to retrieve offline data - silently handle in production
      }
    }
    return null
  }

  async removeOfflineData(key: string): Promise<void> {
    if ('localStorage' in window) {
      localStorage.removeItem(`offline_${key}`)
    }
  }

  // Get all offline data keys
  async getOfflineDataKeys(): Promise<string[]> {
    if ('localStorage' in window) {
      const keys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('offline_')) {
          keys.push(key.replace('offline_', ''))
        }
      }
      return keys
    }
    return []
  }
}

// Singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance()

// Auto-register service worker
if (typeof window !== 'undefined') {
  serviceWorkerManager.register()
}