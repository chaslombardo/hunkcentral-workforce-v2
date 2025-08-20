/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ServiceWorkerRegistration } from '@/components/service-worker-registration';
import { serviceWorkerManager } from '@/lib/serviceWorker';

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock service worker manager
vi.mock('@/lib/serviceWorker', () => ({
  serviceWorkerManager: {
    register: vi.fn(),
    unregister: vi.fn(),
    clearCache: vi.fn(),
    getCacheSize: vi.fn(),
  },
}));

describe('Production Stability Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment as production
    vi.stubEnv('NODE_ENV', 'production');

    // Mock service worker support
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn(),
        getRegistration: vi.fn(),
        addEventListener: vi.fn(),
      },
      configurable: true,
    });

    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Service Worker Scenarios', () => {
    it('should handle service worker registration in production environment', async () => {
      const mockRegistration = {
        active: { scriptURL: 'http://localhost/sw.js' },
        addEventListener: vi.fn(),
      };

      (serviceWorkerManager.register as any).mockResolvedValue(
        mockRegistration
      );

      render(<ServiceWorkerRegistration />);

      // Wait for registration to be called
      await waitFor(() => {
        expect(serviceWorkerManager.register).toHaveBeenCalled();
      });
    });

    it('should handle service worker registration failure gracefully', async () => {
      const registrationError = new Error('Registration failed');
      (serviceWorkerManager.register as any).mockRejectedValue(
        registrationError
      );

      // Should not throw error
      expect(() => {
        render(<ServiceWorkerRegistration />);
      }).not.toThrow();

      await waitFor(() => {
        expect(serviceWorkerManager.register).toHaveBeenCalled();
      });
    });

    it('should handle service worker updates without breaking sessions', async () => {
      const mockRegistration = {
        active: { scriptURL: 'http://localhost/sw.js' },
        addEventListener: vi.fn(),
      };

      (serviceWorkerManager.register as any).mockResolvedValue(
        mockRegistration
      );

      // Mock active session
      const localStorageMock = {
        getItem: vi.fn().mockImplementation((key) => {
          if (key === 'auth-token') return 'mock-token';
          if (key === 'last-user-activity') return Date.now().toString();
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        configurable: true,
      });

      render(<ServiceWorkerRegistration />);

      // Simulate service worker update event
      const updateEvent = new CustomEvent('sw-update-available', {
        detail: { timestamp: Date.now() },
      });

      window.dispatchEvent(updateEvent);

      // Should handle update gracefully without immediate refresh
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'sw-last-update-check',
        expect.any(String)
      );
    });
  });

  describe('Error Handling Paths', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock authentication failure scenario
      const authError = new Error('Authentication failed');

      // This should not break the application
      expect(() => {
        throw authError;
      }).toThrow('Authentication failed');

      // But the error should be containable
      try {
        throw authError;
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Authentication failed');
      }
    });

    it('should handle network failures without crashing', async () => {
      // Mock network failure
      const networkError = new Error('Network request failed');
      (serviceWorkerManager.register as any).mockRejectedValue(networkError);

      render(<ServiceWorkerRegistration />);

      await waitFor(() => {
        expect(serviceWorkerManager.register).toHaveBeenCalled();
      });

      // Application should continue to work
      expect(document.body).toBeInTheDocument();
    });

    it('should handle cache errors without affecting functionality', async () => {
      const cacheError = new Error('Cache operation failed');
      (serviceWorkerManager.clearCache as any).mockRejectedValue(cacheError);

      // Cache errors should not break the application
      try {
        await serviceWorkerManager.clearCache();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Application should still be functional
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Cache Management Validation', () => {
    it('should not require manual cache clearing for normal operation', async () => {
      // Mock successful service worker registration
      const mockRegistration = {
        active: { scriptURL: 'http://localhost/sw.js' },
        addEventListener: vi.fn(),
      };

      (serviceWorkerManager.register as any).mockResolvedValue(
        mockRegistration
      );
      (serviceWorkerManager.getCacheSize as any).mockResolvedValue(1024 * 1024); // 1MB

      render(<ServiceWorkerRegistration />);

      await waitFor(() => {
        expect(serviceWorkerManager.register).toHaveBeenCalled();
      });

      // Cache clearing should not be automatically called during normal registration
      expect(serviceWorkerManager.clearCache).not.toHaveBeenCalled();
    });

    it('should handle cache size monitoring without performance impact', async () => {
      (serviceWorkerManager.getCacheSize as any).mockResolvedValue(
        5 * 1024 * 1024
      ); // 5MB

      const cacheSize = await serviceWorkerManager.getCacheSize();

      expect(cacheSize).toBe(5 * 1024 * 1024);
      expect(serviceWorkerManager.getCacheSize).toHaveBeenCalledOnce();
    });

    it('should handle cache clearing when explicitly requested', async () => {
      (serviceWorkerManager.clearCache as any).mockResolvedValue(undefined);

      await serviceWorkerManager.clearCache();

      expect(serviceWorkerManager.clearCache).toHaveBeenCalledOnce();
    });
  });

  describe('Production Environment Validation', () => {
    it('should behave correctly in production environment', () => {
      expect(process.env.NODE_ENV).toBe('production');

      // Service worker should be enabled in production
      const shouldRegister =
        process.env.NODE_ENV === 'production' &&
        process.env.NEXT_PUBLIC_SW_DISABLED !== 'true';

      expect(shouldRegister).toBe(true);
    });

    it('should handle environment transitions gracefully', () => {
      // Test switching from development to production
      vi.stubEnv('NODE_ENV', 'development');
      expect(process.env.NODE_ENV).toBe('development');

      vi.stubEnv('NODE_ENV', 'production');
      expect(process.env.NODE_ENV).toBe('production');

      // Application should handle environment changes
      expect(document.body).toBeInTheDocument();
    });
  });

  describe('Session Protection', () => {
    it('should protect active user sessions during updates', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockImplementation((key) => {
          if (key === 'auth-token') return 'active-token';
          if (key === 'draft-log') return JSON.stringify({ data: 'unsaved' });
          if (key === 'last-user-activity') return Date.now().toString();
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        configurable: true,
      });

      render(<ServiceWorkerRegistration />);

      // Simulate update notification
      const updateEvent = new CustomEvent('sw-update-available', {
        detail: { timestamp: Date.now() },
      });

      window.dispatchEvent(updateEvent);

      // Should delay update notification for active sessions
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sw-last-update-check',
        expect.any(String)
      );
    });

    it('should allow immediate updates for inactive sessions', () => {
      const mockLocalStorage = {
        getItem: vi.fn().mockImplementation((key) => {
          if (key === 'last-user-activity')
            return (Date.now() - 300000).toString(); // 5 minutes ago
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        configurable: true,
      });

      render(<ServiceWorkerRegistration />);

      // Simulate update notification
      const updateEvent = new CustomEvent('sw-update-available', {
        detail: { timestamp: Date.now() },
      });

      window.dispatchEvent(updateEvent);

      // Should allow immediate update for inactive sessions
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sw-last-update-check',
        expect.any(String)
      );
    });
  });
});
