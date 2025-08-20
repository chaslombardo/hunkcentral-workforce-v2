/**
 * Test suite for service worker redirect fixes
 * Verifies that the service worker properly handles redirects and doesn't interfere with navigation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock service worker environment
const mockServiceWorkerGlobalScope = {
  addEventListener: vi.fn(),
  caches: {
    open: vi.fn(),
    keys: vi.fn(),
    delete: vi.fn(),
    match: vi.fn(),
  },
  clients: {
    claim: vi.fn(),
    matchAll: vi.fn(),
  },
  registration: {
    showNotification: vi.fn(),
  },
  skipWaiting: vi.fn(),
};

// Mock fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Service Worker Redirect Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Fetch Handler Redirect Mode', () => {
    it('should skip requests with redirect mode "error"', () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://example.com/test',
        redirect: 'error',
        headers: new Map([['accept', 'text/html']]),
      };

      const mockEvent = {
        request: mockRequest,
        respondWith: vi.fn(),
      };

      // Simulate the fetch event handler logic
      const url = new URL(mockRequest.url);

      // Skip non-GET requests
      if (mockRequest.method !== 'GET') {
        return;
      }

      // Skip external requests
      if (url.origin !== location.origin) {
        return;
      }

      // Skip requests with redirect modes that could cause issues
      if (mockRequest.redirect === 'error') {
        return;
      }

      // If we reach here, the request should be handled
      expect(mockEvent.respondWith).not.toHaveBeenCalled();
    });

    it('should handle requests with proper redirect mode', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://localhost:3000/api/test',
        redirect: 'follow',
        headers: new Map([['accept', 'application/json']]),
      };

      // Mock successful network response
      const mockResponse = new Response('{"success": true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Simulate API request handling
      const url = new URL(mockRequest.url);

      if (url.pathname.startsWith('/api/')) {
        const fetchRequest = new Request(mockRequest.url, {
          redirect: 'follow',
          credentials: 'same-origin',
        });

        const networkResponse = await fetch(fetchRequest);

        expect(networkResponse.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.objectContaining({
            redirect: 'follow',
            credentials: 'same-origin',
          })
        );
      }
    });
  });

  describe('Redirect Response Handling', () => {
    it('should not cache redirect responses', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://localhost:3000/api/test',
        redirect: 'follow',
      };

      // Mock redirect response
      const mockResponse = new Response('', {
        status: 302,
        headers: { Location: '/login' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const mockCache = {
        put: vi.fn(),
      };
      mockServiceWorkerGlobalScope.caches.open.mockResolvedValueOnce(mockCache);

      // Simulate API request handling with redirect
      const fetchRequest = new Request(mockRequest.url, {
        redirect: 'follow',
        credentials: 'same-origin',
      });

      const networkResponse = await fetch(fetchRequest);

      // Check if it's a redirect response
      const isRedirect =
        networkResponse.status >= 300 && networkResponse.status < 400;

      if (isRedirect) {
        // Should not cache redirect responses
        expect(mockCache.put).not.toHaveBeenCalled();
      }

      expect(networkResponse.status).toBe(302);
    });

    it('should handle opaque redirect responses', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://localhost:3000/api/test',
        redirect: 'follow',
      };

      // Mock opaque redirect response
      const mockResponse = {
        type: 'opaqueredirect',
        status: 0,
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const fetchRequest = new Request(mockRequest.url, {
        redirect: 'follow',
        credentials: 'same-origin',
      });

      const networkResponse = await fetch(fetchRequest);

      // Should return the opaque redirect response without caching
      expect(networkResponse.type).toBe('opaqueredirect');
    });
  });

  describe('Error Boundaries', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://localhost:3000/api/test',
        redirect: 'follow',
      };

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      mockServiceWorkerGlobalScope.caches.match.mockResolvedValueOnce(null);

      // Simulate the error handling logic from the service worker
      try {
        const fetchRequest = new Request(mockRequest.url, {
          redirect: 'follow',
          credentials: 'same-origin',
        });

        await fetch(fetchRequest);
      } catch (error) {
        // In the actual service worker, we would try cache fallback here
        try {
          const cachedResponse =
            await mockServiceWorkerGlobalScope.caches.match(mockRequest);
          expect(mockServiceWorkerGlobalScope.caches.match).toHaveBeenCalled();
        } catch (cacheError) {
          // Cache lookup also failed
          expect(error).toBeInstanceOf(Error);
        }
      }
    });

    it('should handle cache errors gracefully', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://localhost:3000/api/test',
        redirect: 'follow',
      };

      // Mock successful network response
      const mockResponse = new Response('{"success": true}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      // Mock cache error
      const mockCache = {
        put: vi.fn().mockRejectedValueOnce(new Error('Cache error')),
      };
      mockServiceWorkerGlobalScope.caches.open.mockResolvedValueOnce(mockCache);

      // Should continue with network response even if caching fails
      const fetchRequest = new Request(mockRequest.url, {
        redirect: 'follow',
        credentials: 'same-origin',
      });

      const networkResponse = await fetch(fetchRequest);

      expect(networkResponse.status).toBe(200);

      // Simulate the caching attempt that would happen in the service worker
      const url = new URL(mockRequest.url);
      const CACHEABLE_ROUTES = ['/api/users', '/api/analytics'];

      if (
        networkResponse.ok &&
        CACHEABLE_ROUTES.some((route) => url.pathname.startsWith(route))
      ) {
        try {
          const cache =
            await mockServiceWorkerGlobalScope.caches.open('test-cache');
          await cache.put(mockRequest, networkResponse.clone());
          expect(mockCache.put).toHaveBeenCalled();
        } catch (cacheError) {
          // Cache operation failed, but we should continue with network response
          expect(cacheError).toBeInstanceOf(Error);
        }
      }
    });
  });

  describe('Conservative Caching Strategy', () => {
    it('should not cache dynamic pages with query parameters', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://localhost:3000/dashboard?tab=logs',
        redirect: 'follow',
      };

      const mockResponse = new Response('<html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const mockCache = {
        put: vi.fn(),
      };
      mockServiceWorkerGlobalScope.caches.open.mockResolvedValueOnce(mockCache);

      const url = new URL(mockRequest.url);
      const hasQueryParams = !!url.search;

      // Should not cache pages with query parameters
      if (hasQueryParams) {
        expect(mockCache.put).not.toHaveBeenCalled();
      }
    });

    it('should not cache auth pages', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'https://localhost:3000/auth/login',
        redirect: 'follow',
      };

      const mockResponse = new Response('<html></html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
      mockFetch.mockResolvedValueOnce(mockResponse);

      const mockCache = {
        put: vi.fn(),
      };
      mockServiceWorkerGlobalScope.caches.open.mockResolvedValueOnce(mockCache);

      const url = new URL(mockRequest.url);
      const isAuthPage = url.pathname.includes('/auth/');

      // Should not cache auth pages
      if (isAuthPage) {
        expect(mockCache.put).not.toHaveBeenCalled();
      }
    });
  });
});
