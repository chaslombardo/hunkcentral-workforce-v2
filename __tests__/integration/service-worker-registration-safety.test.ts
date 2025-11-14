/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ServiceWorkerManager } from '@/lib/serviceWorker';

// Mock environment variables
const mockEnv = (env: Record<string, string>) => {
  Object.keys(env).forEach((key) => {
    vi.stubEnv(key, env[key]);
  });
};

// Mock navigator.serviceWorker
const mockServiceWorker = () => {
  const mockRegistration = {
    active: { scriptURL: 'http://localhost/sw.js', postMessage: vi.fn() },
    waiting: null,
    installing: null,
    addEventListener: vi.fn(),
    unregister: vi.fn().mockResolvedValue(true),
  };

  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: vi.fn().mockResolvedValue(mockRegistration),
      getRegistration: vi.fn().mockResolvedValue(mockRegistration),
      addEventListener: vi.fn(),
    },
    configurable: true,
  });

  Object.defineProperty(window, 'isSecureContext', {
    value: true,
    configurable: true,
  });

  return mockRegistration;
};

describe('Service Worker Registration Safety', () => {
  let serviceWorkerManager: ServiceWorkerManager;
  let mockRegistration: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistration = mockServiceWorker();

    // Reset singleton instance
    (ServiceWorkerManager as any).instance = null;
    serviceWorkerManager = (ServiceWorkerManager as any).getInstance();
  });

  afterEach(() => {
    // Clean up environment
    vi.unstubAllEnvs();
  });

  describe('Environment-based registration logic', () => {
    it('should register in production by default', async () => {
      mockEnv({ NODE_ENV: 'production' });

      const registration = await serviceWorkerManager.register();

      expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
        type: 'classic',
      });
      expect(registration).toBeTruthy();
    });

    it('should not register in development by default', async () => {
      mockEnv({ NODE_ENV: 'development' });

      const registration = await serviceWorkerManager.register();

      expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
      expect(registration).toBeNull();
    });

    it('should register in development when explicitly enabled', async () => {
      mockEnv({
        NODE_ENV: 'development',
        NEXT_PUBLIC_SW_ENABLED: 'true',
      });

      const registration = await serviceWorkerManager.register();

      expect(navigator.serviceWorker.register).toHaveBeenCalled();
      expect(registration).toBeTruthy();
    });

    it('should not register when explicitly disabled', async () => {
      mockEnv({
        NODE_ENV: 'production',
        NEXT_PUBLIC_SW_DISABLED: 'true',
      });

      const registration = await serviceWorkerManager.register();

      expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
      expect(registration).toBeNull();
    });
  });

  describe('Capability checks', () => {
    it('should not register when service worker is not supported', async () => {
      mockEnv({ NODE_ENV: 'production' });

      // Remove service worker support
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true,
      });

      const registration = await serviceWorkerManager.register();

      expect(registration).toBeNull();
    });

    it('should not register in insecure context', async () => {
      mockEnv({ NODE_ENV: 'production' });

      Object.defineProperty(window, 'isSecureContext', {
        value: false,
        configurable: true,
      });

      // Mock location with http protocol on non-localhost
      delete (window as any).location;
      (window as any).location = {
        protocol: 'http:',
        hostname: 'example.com', // Not localhost
      };

      const registration = await serviceWorkerManager.register();

      expect(registration).toBeNull();
    });
  });

  describe('Error handling and recovery', () => {
    it('should handle registration failures gracefully', async () => {
      mockEnv({ NODE_ENV: 'production' });

      const registrationError = new Error('Registration failed');
      (navigator.serviceWorker.register as any).mockRejectedValue(
        registrationError
      );

      const registration = await serviceWorkerManager.register();

      expect(registration).toBeNull();
      // Should attempt cleanup
      expect(navigator.serviceWorker.getRegistration).toHaveBeenCalled();
    });

    it('should clean up problematic registrations', async () => {
      mockEnv({ NODE_ENV: 'production' });

      // Mock problematic registration
      const problematicRegistration = {
        active: { scriptURL: 'http://localhost/old-sw.js' },
        unregister: vi.fn().mockResolvedValue(true),
      };

      (navigator.serviceWorker.getRegistration as any)
        .mockResolvedValueOnce(problematicRegistration)
        .mockResolvedValueOnce(mockRegistration);

      await serviceWorkerManager.register();

      expect(problematicRegistration.unregister).toHaveBeenCalled();
    });

    it('should handle unregistration errors gracefully', async () => {
      const unregisterError = new Error('Unregister failed');
      mockRegistration.unregister.mockRejectedValue(unregisterError);

      // First register
      mockEnv({ NODE_ENV: 'production' });
      await serviceWorkerManager.register();

      // Then unregister
      const result = await serviceWorkerManager.unregister();

      expect(result).toBe(false);
    });
  });

  describe('Health checks', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should set up health checks after registration', async () => {
      mockEnv({ NODE_ENV: 'production' });

      await serviceWorkerManager.register();

      // Fast-forward to trigger health check
      vi.advanceTimersByTime(60000);

      // Should attempt to send health check message
      expect(mockRegistration.active.postMessage).toHaveBeenCalledWith(
        { type: 'SW_HEALTH_CHECK' },
        expect.any(Array)
      );
    });

    it('should clean up health checks on unregister', async () => {
      mockEnv({ NODE_ENV: 'production' });

      await serviceWorkerManager.register();
      await serviceWorkerManager.unregister();

      // Health checks should be cleaned up
      vi.advanceTimersByTime(60000);

      // Should not attempt health check after unregister
      expect(mockRegistration.active.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('Session protection', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        configurable: true,
      });
    });

    it('should detect active sessions', () => {
      // Mock active session indicators
      (localStorage.getItem as any).mockImplementation((key) => {
        if (key === 'auth-token') return 'mock-token';
        if (key === 'last-user-activity') return Date.now().toString();
        return null;
      });

      // Access private method for testing
      const hasActiveSession = (
        serviceWorkerManager as any
      ).checkForActiveSession();

      expect(hasActiveSession).toBe(true);
    });

    it('should detect inactive sessions', () => {
      // Mock inactive session
      (localStorage.getItem as any).mockImplementation((key) => {
        if (key === 'last-user-activity')
          return (Date.now() - 120000).toString(); // 2 minutes ago
        return null;
      });

      const hasActiveSession = (
        serviceWorkerManager as any
      ).checkForActiveSession();

      expect(hasActiveSession).toBe(false);
    });
  });
});
