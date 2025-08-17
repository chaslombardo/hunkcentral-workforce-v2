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
    // Conservative environment checks
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }

    // Enhanced environment detection
    const isDevelopment = process.env.NODE_ENV === 'development'
    const swEnabled = process.env.NEXT_PUBLIC_SW_ENABLED === 'true'
    
    // Conservative registration policy
    if (isDevelopment && !swEnabled) {
      return null
    }

    try {
      // Register with conservative options
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always fetch fresh service worker
      })

      // Conservative update handling - don't force updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Notify about update but don't force it
              this.notifyUpdate()
            }
          })
        }
      })

      // Graceful error handling
      navigator.serviceWorker.addEventListener('error', (error) => {
        if (isDevelopment) {
          console.warn('SW: Service Worker error:', error)
        }
        // Don't let SW errors break the application - continue normally
      })

      // Conservative controller change handling
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Don't automatically reload - let user decide
      })

      // Add message handling for SW communication
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SW_ERROR') {
          if (isDevelopment) {
            console.warn('SW: Service Worker reported error:', event.data.error)
          }
        }
      })



      return this.registration
    } catch (error) {
      // Registration failed - graceful degradation
      if (isDevelopment) {
        console.warn('SW: Registration failed:', error)
      }
      
      // Clear any existing registration that might be causing issues
      try {
        const existingRegistration = await navigator.serviceWorker.getRegistration()
        if (existingRegistration) {
          await existingRegistration.unregister()
        }
      } catch {
        // Ignore cleanup errors
      }
      
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
    // Conservative update notification - let user choose when to update
    if (typeof window !== 'undefined') {
      // Dispatch a custom event that components can listen to
      const updateEvent = new CustomEvent('sw-update-available', {
        detail: { 
          registration: this.registration,
          timestamp: Date.now()
        }
      })
      window.dispatchEvent(updateEvent)
      

    }
  }

  private async syncOfflineData(): Promise<void> {
    // Conservative sync - disabled to avoid complexity and potential conflicts
    // Applications should handle offline scenarios through UI feedback instead
    
    // Instead of background sync, just notify the app that we're back online
    // The app can then handle any pending data through normal UI flows
    return Promise.resolve()
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