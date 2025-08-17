/**
 * Integration test for service worker registration
 * Verifies that the service worker registration handles failures gracefully
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { serviceWorkerManager } from '@/lib/serviceWorker'

// Mock navigator.serviceWorker
const mockServiceWorker = {
  register: vi.fn(),
  addEventListener: vi.fn(),
  controller: null
}

const mockRegistration = {
  addEventListener: vi.fn(),
  installing: null,
  unregister: vi.fn()
}

// Mock window and navigator
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: mockServiceWorker,
    onLine: true
  },
  writable: true
})

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    location: { reload: vi.fn() },
    confirm: vi.fn()
  },
  writable: true
})

describe('Service Worker Registration Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServiceWorker.register.mockClear()
    mockRegistration.addEventListener.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Registration Success', () => {
    it('should register service worker successfully in production', async () => {
      // Mock successful registration
      mockServiceWorker.register.mockResolvedValueOnce(mockRegistration)
      
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const registration = await serviceWorkerManager.register()

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })
      expect(registration).toBe(mockRegistration)
      expect(mockRegistration.addEventListener).toHaveBeenCalledWith('updatefound', expect.any(Function))

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })

    it('should skip registration in development by default', async () => {
      // Mock development environment
      const originalEnv = process.env.NODE_ENV
      const originalSwEnabled = process.env.NEXT_PUBLIC_SW_ENABLED
      process.env.NODE_ENV = 'development'
      delete process.env.NEXT_PUBLIC_SW_ENABLED

      const registration = await serviceWorkerManager.register()

      expect(mockServiceWorker.register).not.toHaveBeenCalled()
      expect(registration).toBeNull()

      // Restore environment
      process.env.NODE_ENV = originalEnv
      if (originalSwEnabled) {
        process.env.NEXT_PUBLIC_SW_ENABLED = originalSwEnabled
      }
    })

    it('should register in development when explicitly enabled', async () => {
      // Mock successful registration
      mockServiceWorker.register.mockResolvedValueOnce(mockRegistration)
      
      // Mock development environment with SW enabled
      const originalEnv = process.env.NODE_ENV
      const originalSwEnabled = process.env.NEXT_PUBLIC_SW_ENABLED
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_SW_ENABLED = 'true'

      const registration = await serviceWorkerManager.register()

      expect(mockServiceWorker.register).toHaveBeenCalled()
      expect(registration).toBe(mockRegistration)

      // Restore environment
      process.env.NODE_ENV = originalEnv
      if (originalSwEnabled) {
        process.env.NEXT_PUBLIC_SW_ENABLED = originalSwEnabled
      } else {
        delete process.env.NEXT_PUBLIC_SW_ENABLED
      }
    })
  })

  describe('Registration Failure', () => {
    it('should handle registration failure gracefully', async () => {
      // Mock registration failure
      const registrationError = new Error('Registration failed')
      mockServiceWorker.register.mockRejectedValueOnce(registrationError)
      
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      const registration = await serviceWorkerManager.register()

      expect(mockServiceWorker.register).toHaveBeenCalled()
      expect(registration).toBeNull()

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })

    it('should return null when service worker is not supported', async () => {
      // Mock unsupported environment
      const originalNavigator = global.navigator
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true
      })

      const registration = await serviceWorkerManager.register()

      expect(registration).toBeNull()

      // Restore navigator
      global.navigator = originalNavigator
    })

    it('should return null in server environment', async () => {
      // Mock server environment (no window)
      const originalWindow = global.window
      delete (global as any).window

      const registration = await serviceWorkerManager.register()

      expect(registration).toBeNull()

      // Restore window
      global.window = originalWindow
    })
  })

  describe('Update Handling', () => {
    it('should dispatch custom event on service worker update', async () => {
      // Mock successful registration
      mockServiceWorker.register.mockResolvedValueOnce(mockRegistration)
      
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      await serviceWorkerManager.register()

      // Get the updatefound event handler
      const updateFoundHandler = mockRegistration.addEventListener.mock.calls
        .find(call => call[0] === 'updatefound')?.[1]

      expect(updateFoundHandler).toBeDefined()

      // Mock new worker
      const mockNewWorker = {
        addEventListener: vi.fn(),
        state: 'installed'
      }
      mockRegistration.installing = mockNewWorker
      mockServiceWorker.controller = {}

      // Trigger updatefound
      updateFoundHandler?.()

      // Get the statechange handler
      const stateChangeHandler = mockNewWorker.addEventListener.mock.calls
        .find(call => call[0] === 'statechange')?.[1]

      expect(stateChangeHandler).toBeDefined()

      // Trigger statechange
      stateChangeHandler?.()

      // Should dispatch custom event
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sw-update-available'
        })
      )

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Error Event Handling', () => {
    it('should handle service worker errors without breaking the app', async () => {
      // Mock successful registration
      mockServiceWorker.register.mockResolvedValueOnce(mockRegistration)
      
      // Mock production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      await serviceWorkerManager.register()

      // Verify error event listener was added
      expect(mockServiceWorker.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))

      // Get the error handler
      const errorHandler = mockServiceWorker.addEventListener.mock.calls
        .find(call => call[0] === 'error')?.[1]

      expect(errorHandler).toBeDefined()

      // Trigger error - should not throw
      expect(() => {
        errorHandler?.(new Error('Service worker error'))
      }).not.toThrow()

      // Restore environment
      process.env.NODE_ENV = originalEnv
    })
  })
})