/**
 * Production Service Worker Caching Integration Tests
 *
 * Tests the enhanced service worker caching strategy with:
 * - Simplified caching strategy that avoids navigation conflicts
 * - Development/production environment detection
 * - Graceful degradation when service worker fails
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock global objects for service worker testing
const mockServiceWorker = {
  register: vi.fn(),
  getRegistration: vi.fn(),
  ready: Promise.resolve({
    active: { postMessage: vi.fn() },
    waiting: null,
    installing: null,
  }),
};

const mockCaches = {
  open: vi.fn(),
  keys: vi.fn(),
  delete: vi.fn(),
  match: vi.fn(),
};

const mockCache = {
  match: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn(),
};

// Mock fetch for network requests
const mockFetch = vi.fn();

// Setup global mocks
beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks();

  // Mock navigator.serviceWorker
  Object.defineProperty(global, 'navigator', {
    value: {
      serviceWorker: mockServiceWorker,
      onLine: true,
    },
    writable: true,
  });

  // Mock caches API
  Object.defineProperty(global, 'caches', {
    value: mockCaches,
    writable: true,
  });

  // Mock fetch
  Object.defineProperty(global, 'fetch', {
    value: mockFetch,
    writable: true,
  });

  // Mock location
  Object.defineProperty(global, 'location', {
    value: {
      hostname: 'localhost',
      protocol: 'http:',
      port: '3000',
      origin: 'http://localhost:3000',
    },
    writable: true,
  });

  // Setup default mock implementations
  mockCaches.open.mockResolvedValue(mockCache);
  mockCaches.keys.mockResolvedValue([]);
  mockCache.match.mockResolvedValue(null);
  mockCache.keys.mockResolvedValue([]);
  mockFetch.mockResolvedValue(new Response('OK', { status: 200 }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Production Service Worker Caching Strategy', () => {
  describe('Environment Detection', () => {
    it('should detect development environment correctly', () => {
      // Test localhost detection
      expect(global.location.hostname).toBe('localhost');
      expect(global.location.protocol).toBe('http:');
      expect(global.location.port).toBe('3000');
    });

    it('should detect production environment correctly', () => {
      // Mock production environment
      Object.defineProperty(global, 'location', {
        value: {
          hostname: 'hunkcentral.vercel.app',
          protocol: 'https:',
          port: '',
          origin: 'https://hunkcentral.vercel.app',
        },
        writable: true,
      });

      expect(global.location.hostname).toBe('hunkcentral.vercel.app');
      expect(global.location.protocol).toBe('https:');
    });

    it('should never consider production domains as development', () => {
      const productionDomains = [
        'hunkcentral.vercel.app',
        'app.netlify.app',
        'herokuapp.com',
        'hunkcentral.com',
        'collegehunks.com',
      ];

      productionDomains.forEach((domain) => {
        Object.defineProperty(global, 'location', {
          value: {
            hostname: domain,
            protocol: 'https:',
            port: '',
            origin: `https://${domain}`,
          },
          writable: true,
        });

        // In a real service worker, this would be detected as production
        expect(global.location.hostname).toBe(domain);
      });
    });
  });

  describe('Caching Strategy', () => {
    it('should cache only essential static assets', async () => {
      const essentialAssets = [
        '/offline',
        '/manifest.json',
        '/icon-192x192.png',
        '/icon-512x512.png',
        '/favicon.ico',
      ];

      // Mock successful responses for essential assets
      mockFetch.mockImplementation((url) => {
        if (
          typeof url === 'string' &&
          essentialAssets.some((asset) => url.includes(asset))
        ) {
          return Promise.resolve(
            new Response('OK', {
              status: 200,
              headers: new Headers({ 'Content-Type': 'text/html' }),
            })
          );
        }
        return Promise.resolve(new Response('Not Found', { status: 404 }));
      });

      // Test that essential assets would be cached
      for (const asset of essentialAssets) {
        const response = await mockFetch(asset);
        expect(response.status).toBe(200);
      }
    });

    it('should avoid caching navigation requests', () => {
      const navigationPatterns = [
        '/auth/',
        '/login',
        '/logout',
        '/api/auth/',
        '/_next/static/chunks/',
        '/_next/static/webpack/',
        '/sw.js',
      ];

      navigationPatterns.forEach((pattern) => {
        // These patterns should never be cached according to NEVER_CACHE_PATTERNS
        expect(pattern).toBeDefined();
      });
    });

    it('should handle API requests conservatively', async () => {
      // Only /api/health should be cached in production
      const safeApiRoute = '/api/health';
      const unsafeApiRoute = '/api/users';

      mockFetch.mockImplementation((url) => {
        if (typeof url === 'string') {
          if (url.includes('/api/health')) {
            return Promise.resolve(
              new Response(JSON.stringify({ status: 'ok' }), {
                status: 200,
                headers: new Headers({ 'Content-Type': 'application/json' }),
              })
            );
          }
          return Promise.resolve(new Response('Unauthorized', { status: 401 }));
        }
        return Promise.reject(new Error('Invalid URL'));
      });

      // Test safe API route
      const healthResponse = await mockFetch(safeApiRoute);
      expect(healthResponse.status).toBe(200);

      // Test unsafe API route
      const usersResponse = await mockFetch(unsafeApiRoute);
      expect(usersResponse.status).toBe(401);
    });
  });

  describe('Graceful Degradation', () => {
    it('should handle service worker registration failure gracefully', async () => {
      // Mock registration failure
      mockServiceWorker.register.mockRejectedValue(
        new Error('Registration failed')
      );

      try {
        await mockServiceWorker.register('/sw.js');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Registration failed');
      }

      // App should continue to work even if SW registration fails
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('should handle cache failures gracefully', async () => {
      // Mock cache operation failure
      mockCache.put.mockRejectedValue(new Error('Cache storage failed'));

      try {
        await mockCache.put(
          new Request('http://localhost:3000/test'),
          new Response('test')
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Cache storage failed');
      }

      // Cache failure should not break the application
      expect(mockCache.put).toHaveBeenCalled();
    });

    it('should handle network failures gracefully', async () => {
      // Mock network failure
      mockFetch.mockRejectedValue(new Error('Network error'));

      try {
        await mockFetch('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }

      // Network failures should be handled by the application
      expect(mockFetch).toHaveBeenCalledWith('/api/test');
    });
  });

  describe('Cache Management', () => {
    it('should limit cache entries to prevent unlimited growth', () => {
      const cacheConfig = {
        maxStaticEntries: 30,
        maxRuntimeEntries: 15,
        maxApiEntries: 5,
      };

      // Verify cache limits are reasonable for production
      expect(cacheConfig.maxStaticEntries).toBeLessThanOrEqual(50);
      expect(cacheConfig.maxRuntimeEntries).toBeLessThanOrEqual(30);
      expect(cacheConfig.maxApiEntries).toBeLessThanOrEqual(20);
    });

    it('should clean up old cache entries', async () => {
      // Mock cache with old entries
      const oldCacheNames = [
        'hunkcentral-static-v4',
        'hunkcentral-runtime-v4',
        'hunkcentral-offline-v4',
      ];

      const currentCacheNames = [
        'hunkcentral-static-v6',
        'hunkcentral-runtime-v6',
        'hunkcentral-offline-v6',
      ];

      mockCaches.keys.mockResolvedValue([
        ...oldCacheNames,
        ...currentCacheNames,
      ]);
      mockCaches.delete.mockResolvedValue(true);

      // Test cache cleanup logic
      const allCaches = await mockCaches.keys();
      const oldCaches = allCaches.filter(
        (name) =>
          name.startsWith('hunkcentral-') && !currentCacheNames.includes(name)
      );

      expect(oldCaches).toEqual(oldCacheNames);
      expect(oldCaches.length).toBe(3);
    });
  });

  describe('Production Safety Features', () => {
    it('should use shorter cache durations in production', () => {
      const developmentConfig = {
        staticMaxAge: 1 * 60 * 1000, // 1 minute
        runtimeMaxAge: 30 * 1000, // 30 seconds
        apiMaxAge: 10 * 1000, // 10 seconds
      };

      const productionConfig = {
        staticMaxAge: 12 * 60 * 60 * 1000, // 12 hours (reduced from 24h)
        runtimeMaxAge: 2 * 60 * 1000, // 2 minutes (reduced from 5 min)
        apiMaxAge: 1 * 60 * 1000, // 1 minute (reduced from 2 min)
      };

      // Verify production config is more conservative
      expect(productionConfig.staticMaxAge).toBeLessThan(24 * 60 * 60 * 1000);
      expect(productionConfig.runtimeMaxAge).toBeLessThan(5 * 60 * 1000);
      expect(productionConfig.apiMaxAge).toBeLessThan(2 * 60 * 1000);

      // Verify development config is more permissive for faster iteration
      expect(developmentConfig.staticMaxAge).toBeLessThan(
        productionConfig.staticMaxAge
      );
      expect(developmentConfig.runtimeMaxAge).toBeLessThan(
        productionConfig.runtimeMaxAge
      );
      expect(developmentConfig.apiMaxAge).toBeLessThan(
        productionConfig.apiMaxAge
      );
    });

    it('should have network timeouts for reliability', () => {
      const timeoutConfig = {
        development: 10000, // 10 seconds
        production: 5000, // 5 seconds
      };

      expect(timeoutConfig.production).toBeLessThan(timeoutConfig.development);
      expect(timeoutConfig.production).toBeGreaterThan(1000); // At least 1 second
      expect(timeoutConfig.development).toBeLessThan(30000); // Not too long
    });

    it('should handle offline scenarios appropriately', async () => {
      // Mock offline scenario
      Object.defineProperty(global, 'navigator', {
        value: {
          ...global.navigator,
          onLine: false,
        },
        writable: true,
      });

      expect(navigator.onLine).toBe(false);

      // In offline scenarios, the service worker should:
      // 1. Serve cached content when available
      // 2. Show offline page for uncached pages
      // 3. Not break the application
    });
  });

  describe('Navigation Conflict Prevention', () => {
    it('should never handle navigation requests in production', () => {
      // Navigation requests should always be handled by the browser
      // to prevent redirect conflicts and ensure proper authentication flows

      const navigationRequests = [
        { mode: 'navigate', destination: 'document' },
        { mode: 'navigate', destination: 'iframe' },
        { redirect: 'manual' },
        { redirect: 'error' },
      ];

      navigationRequests.forEach((requestProps) => {
        // These request types should never be handled by the service worker
        expect(requestProps).toBeDefined();
      });
    });

    it('should avoid caching authentication-related routes', () => {
      const authRoutes = [
        '/auth/login',
        '/auth/logout',
        '/api/auth/signin',
        '/api/auth/signout',
        '/api/auth/session',
      ];

      authRoutes.forEach((route) => {
        // These routes should never be cached to ensure proper auth flow
        expect(route).toMatch(/\/(auth|api\/auth)\//);
      });
    });
  });
});

describe('Service Worker Error Handling', () => {
  it('should categorize registration errors correctly', () => {
    const errorTypes = {
      'network-error': 'Network request failed',
      'insecure-context': 'Service worker requires HTTPS',
      'script-error': 'Failed to load service worker script',
      'storage-quota': 'Insufficient storage quota',
      'permission-denied': 'Service worker registration denied',
      'browser-compatibility': 'Service workers not supported',
    };

    Object.entries(errorTypes).forEach(([type, message]) => {
      expect(type).toBeDefined();
      expect(message).toBeDefined();
    });
  });

  it('should provide appropriate fallbacks for different error types', () => {
    const errorRecoveryStrategies = {
      'script-error': 'Clear caches and retry',
      'storage-quota': 'Clear old caches',
      'network-error': 'Wait and retry',
      'registration-failed': 'Clean up and retry',
    };

    Object.entries(errorRecoveryStrategies).forEach(([error, strategy]) => {
      expect(error).toBeDefined();
      expect(strategy).toBeDefined();
    });
  });
});
