/**
 * Conservative Service Worker Integration Test
 * 
 * Tests the integration between service worker registration and the conservative strategy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock environment for testing
const mockEnvironment = () => {
  // Mock navigator
  Object.defineProperty(global, 'navigator', {
    value: {
      serviceWorker: {
        register: vi.fn(),
        getRegistration: vi.fn(),
        addEventListener: vi.fn(),
      },
      onLine: true,
    },
    writable: true,
  })

  // Mock window
  Object.defineProperty(global, 'window', {
    value: {
      location: {
        hostname: 'localhost',
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    },
    writable: true,
  })

  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    key: vi.fn(),
    length: 0,
  }
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}

describe('Conservative Service Worker Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnvironment()
    // Reset environment
    process.env.NODE_ENV = 'test'
    process.env.NEXT_PUBLIC_SW_ENABLED = 'false'
  })

  it('should implement conservative registration strategy', async () => {
    // Test development environment with SW disabled
    process.env.NODE_ENV = 'development'
    process.env.NEXT_PUBLIC_SW_ENABLED = 'false'

    // Dynamic import to get fresh instance
    const { serviceWorkerManager } = await import('@/lib/serviceWorker')
    const result = await serviceWorkerManager.register()

    expect(result).toBeNull()
    expect(navigator.serviceWorker.register).not.toHaveBeenCalled()
  })

  it('should handle registration errors gracefully', async () => {
    process.env.NODE_ENV = 'production'
    const registrationError = new Error('Registration failed')
    
    // Mock registration failure
    ;(navigator.serviceWorker.register as any).mockRejectedValue(registrationError)
    ;(navigator.serviceWorker.getRegistration as any).mockResolvedValue(null)

    const { serviceWorkerManager } = await import('@/lib/serviceWorker')
    
    // Should not throw error
    const result = await serviceWorkerManager.register()
    expect(result).toBeNull()
  })

  it('should provide offline data management', async () => {
    const { serviceWorkerManager } = await import('@/lib/serviceWorker')
    
    // Test storing data
    await serviceWorkerManager.storeOfflineData('test-key', { data: 'test' })
    
    // Test retrieving data
    const result = await serviceWorkerManager.getOfflineData('test-key')
    
    // Should handle gracefully even if localStorage fails
    expect(result).toBeDefined()
  })

  it('should track online/offline status', async () => {
    const { serviceWorkerManager } = await import('@/lib/serviceWorker')
    
    // Should provide online status
    const isOnline = serviceWorkerManager.getOnlineStatus()
    expect(typeof isOnline).toBe('boolean')
    
    // Should allow callback registration
    const callback = vi.fn()
    const unsubscribe = serviceWorkerManager.onOnline(callback)
    expect(typeof unsubscribe).toBe('function')
    
    // Should allow unsubscribing
    unsubscribe()
  })

  it('should provide cache management utilities', async () => {
    // Mock caches API
    global.caches = {
      keys: vi.fn().mockResolvedValue(['cache1']),
      delete: vi.fn().mockResolvedValue(true),
    } as any

    const { serviceWorkerManager } = await import('@/lib/serviceWorker')
    
    // Should provide cache clearing
    await expect(serviceWorkerManager.clearCache()).resolves.toBeUndefined()
    
    // Should provide cache size calculation
    const size = await serviceWorkerManager.getCacheSize()
    expect(typeof size).toBe('number')
  })

  it('should handle missing APIs gracefully', async () => {
    // Remove service worker support
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true,
    })

    // Remove caches API
    delete (global as any).caches

    const { serviceWorkerManager } = await import('@/lib/serviceWorker')
    
    // Should handle missing service worker API
    const registration = await serviceWorkerManager.register()
    expect(registration).toBeNull()
    
    // Should handle missing caches API
    const cacheSize = await serviceWorkerManager.getCacheSize()
    expect(cacheSize).toBe(0)
  })
})

describe('Service Worker Registration Component Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnvironment()
  })

  it('should integrate with toast notifications', async () => {
    // Mock toast hook
    const mockToast = vi.fn()
    
    // This test verifies the component can be imported without errors
    const { ServiceWorkerRegistration } = await import('@/components/service-worker-registration')
    expect(ServiceWorkerRegistration).toBeDefined()
  })
})

describe('Conservative Service Worker File Validation', () => {
  it('should have valid service worker file', async () => {
    // Read the service worker file to validate it exists and has expected content
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const swPath = path.join(process.cwd(), 'public', 'sw.js')
    const swContent = await fs.readFile(swPath, 'utf-8')
    
    // Validate conservative strategy markers
    expect(swContent).toContain('Conservative Service Worker Strategy')
    expect(swContent).toContain('Version 3')
    expect(swContent).toContain('isDevelopment')
    expect(swContent).toContain('ESSENTIAL_ASSETS')
    expect(swContent).toContain('SAFE_API_ROUTES')
    expect(swContent).toContain('MAX_CACHE_AGE')
    
    // Validate conservative caching approach
    expect(swContent).toContain('shouldHandleRequest')
    expect(swContent).toContain('graceful degradation')
    expect(swContent).toContain('network-only to avoid navigation conflicts')
    
    // Validate error handling
    expect(swContent).toContain('try {')
    expect(swContent).toContain('catch')
    
    // Ensure no aggressive caching patterns
    expect(swContent).not.toContain('cache.addAll')
    
    // skipWaiting is only used conditionally in development for faster iteration
    if (swContent.includes('skipWaiting()')) {
      expect(swContent).toContain('if (isDevelopment)')
    }
  })
})