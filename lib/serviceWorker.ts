"use client"

// Service Worker registration and management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private isOnline = true
  private onlineCallbacks: (() => void)[] = []
  private offlineCallbacks: (() => void)[] = []
  private expectingControllerChange = false
  private userConsentedToRefresh = false
  private healthCheckInterval: NodeJS.Timeout | null = null
  private registrationAttempts = 0
  private maxRegistrationAttempts = 3

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
    // Enhanced environment and capability checks
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }

    // Check if we're in a secure context (required for service workers)
    // Allow http only for localhost development
    if (!window.isSecureContext && 
        !(window.location.protocol === 'http:' && 
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))) {
      return null
    }

    // Enhanced environment detection with safety checks
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isProduction = process.env.NODE_ENV === 'production'
    const swEnabled = process.env.NEXT_PUBLIC_SW_ENABLED === 'true'
    const swDisabled = process.env.NEXT_PUBLIC_SW_DISABLED === 'true'
    
    // Environment-based registration logic
    if (swDisabled) {
      return null
    }
    
    if (isDevelopment && !swEnabled) {
      return null
    }
    
    if (!isProduction && !isDevelopment) {
      // Unknown environment - be conservative
      return null
    }

    // Check for existing problematic registrations
    try {
      const existingRegistration = await navigator.serviceWorker.getRegistration()
      if (existingRegistration && this.isRegistrationProblematic(existingRegistration)) {
        await existingRegistration.unregister()
      }
    } catch {
      // Ignore errors during cleanup check
    }

    try {
      // Register with enhanced safety options
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always fetch fresh service worker
        type: 'classic' // Explicit type for compatibility
      })

      // Enhanced update handling with session protection
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Check if user has active session before notifying
              this.handleUpdateWithSessionProtection()
            }
          })
        }
      })

      // Enhanced error handling with recovery
      navigator.serviceWorker.addEventListener('error', (error) => {
        this.handleServiceWorkerError(error)
      })

      // Safe controller change handling
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Only handle controller changes if they're expected
        if (this.expectingControllerChange) {
          this.expectingControllerChange = false
          // Optionally refresh if user consented
          if (this.userConsentedToRefresh) {
            window.location.reload()
          }
        }
      })

      // Enhanced message handling
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event)
      })

      // Set up periodic health checks
      this.setupHealthChecks()

      return this.registration
    } catch (error) {
      return this.handleRegistrationFailure(error)
    }
  }

  async unregister(): Promise<boolean> {
    // Clean up health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }
    
    if (this.registration) {
      try {
        const result = await this.registration.unregister()
        this.registration = null
        return result
      } catch {
        // Ignore unregistration errors - app continues to work
        return false
      }
    }
    return false
  }

  private isRegistrationProblematic(registration: ServiceWorkerRegistration): boolean {
    // Check if the registration is in a bad state
    const worker = registration.active || registration.waiting || registration.installing
    if (!worker) {
      return true
    }
    
    // Check if the worker script URL is correct
    if (!worker.scriptURL.endsWith('/sw.js')) {
      return true
    }
    
    return false
  }

  private handleUpdateWithSessionProtection(): void {
    // Check if user has active session data
    const hasActiveSession = this.checkForActiveSession()
    
    if (hasActiveSession) {
      // Delay update notification to avoid disrupting user workflow
      setTimeout(() => {
        this.notifyUpdate()
      }, 5000) // Wait 5 seconds before notifying
    } else {
      // No active session, safe to notify immediately
      this.notifyUpdate()
    }
  }

  private checkForActiveSession(): boolean {
    // Check for signs of active user session
    try {
      // Check for authentication tokens
      const hasAuthToken = localStorage.getItem('auth-token') || 
                          sessionStorage.getItem('auth-token') ||
                          document.cookie.includes('next-auth')
      
      // Check for unsaved form data
      const hasUnsavedData = localStorage.getItem('draft-log') ||
                            localStorage.getItem('unsaved-form-data')
      
      // Check if user is actively typing (recent input events)
      const lastActivity = parseInt(localStorage.getItem('last-user-activity') || '0', 10)
      const recentActivity = Date.now() - lastActivity < 30000 // 30 seconds
      
      return !!(hasAuthToken || hasUnsavedData || recentActivity)
    } catch {
      // If we can't check, assume there's an active session to be safe
      return true
    }
  }

  private handleServiceWorkerError(_error: Event): void {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      console.warn('SW: Service Worker error:', _error)
    }
    
    // Attempt recovery if this is a critical error
    this.attemptErrorRecovery()
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { data } = event
    
    if (data?.type === 'SW_ERROR') {
      this.handleServiceWorkerError(data.error)
    } else if (data?.type === 'SW_HEALTH_CHECK') {
      // Respond to health check
      event.ports[0]?.postMessage({ type: 'SW_HEALTH_RESPONSE', status: 'ok' })
    } else if (data?.type === 'SW_CACHE_ERROR') {
      // Handle cache-related errors gracefully
      this.handleCacheError(data.error)
    }
  }

  private setupHealthChecks(): void {
    // Set up periodic health checks to ensure SW is responsive
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, 60000) // Check every minute
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.registration?.active) {
      return
    }

    try {
      // Send health check message to service worker
      const channel = new MessageChannel()
      const healthCheckPromise = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Health check timeout'))
        }, 5000) // 5 second timeout

        channel.port1.onmessage = (event) => {
          clearTimeout(timeout)
          if (event.data?.type === 'SW_HEALTH_RESPONSE') {
            resolve()
          } else {
            reject(new Error('Invalid health check response'))
          }
        }
      })

      this.registration.active.postMessage(
        { type: 'SW_HEALTH_CHECK' },
        [channel.port2]
      )

      await healthCheckPromise
    } catch {
      // Health check failed - consider recovery
      this.handleHealthCheckFailure()
    }
  }

  private handleHealthCheckFailure(): void {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      console.warn('SW: Health check failed, service worker may be unresponsive')
    }
    
    // Don't automatically unregister - let the app continue working
    // The next page load will attempt to register a fresh service worker
  }

  private async attemptErrorRecovery(): Promise<void> {
    // Conservative error recovery - don't be too aggressive
    try {
      // Clear potentially corrupted caches
      await this.clearCache()
      
      // If we have too many errors, consider unregistering
      this.registrationAttempts++
      if (this.registrationAttempts > this.maxRegistrationAttempts) {
        await this.unregister()
      }
    } catch {
      // Recovery failed - continue without service worker
    }
  }

  private handleCacheError(_error: unknown): void {
    // Handle cache-related errors gracefully
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      console.warn('SW: Cache error:', _error)
    }
    
    // Clear caches if they're corrupted
    this.clearCache().catch(() => {
      // Ignore cache clearing errors
    })
  }

  private async handleRegistrationFailure(_error: unknown): Promise<ServiceWorkerRegistration | null> {
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      console.warn('SW: Registration failed:', _error)
    }
    
    // Attempt cleanup of problematic registrations
    try {
      const existingRegistration = await navigator.serviceWorker.getRegistration()
      if (existingRegistration) {
        await existingRegistration.unregister()
      }
    } catch {
      // Ignore cleanup errors
    }
    
    // Clear potentially corrupted caches
    try {
      await this.clearCache()
    } catch {
      // Ignore cache clearing errors
    }
    
    // Increment attempt counter
    this.registrationAttempts++
    
    // Don't retry registration automatically - let the next page load handle it
    return null
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

// Note: Registration is now handled by ServiceWorkerRegistration component
// for better control over timing and error handling