// Production Service Worker Strategy
// Version 6 - Simplified production caching with enhanced navigation safety

const SW_VERSION = 'v6.0.0';
const CACHE_VERSION = 'v6';
const STATIC_CACHE_NAME = `hunkcentral-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `hunkcentral-runtime-${CACHE_VERSION}`;
const OFFLINE_CACHE_NAME = `hunkcentral-offline-${CACHE_VERSION}`;

// Enhanced environment detection with comprehensive fallbacks and production safety
const isDevelopment = (() => {
  try {
    // Multiple checks for development environment with enhanced safety
    const hostname = self.location.hostname;
    const protocol = self.location.protocol;
    const port = self.location.port;

    // Localhost variations (most reliable development indicator)
    const isLocalhost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]';

    // Development domains (be more specific to avoid false positives)
    const isDevDomain =
      hostname.includes('.dev.') ||
      hostname.includes('.local.') ||
      hostname.includes('.staging.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.dev');

    // Development ports (common dev server ports)
    const isDevPort =
      port &&
      (port === '3000' ||
        port === '3001' ||
        port === '8000' ||
        port === '8080' ||
        port === '5000' ||
        port === '4000' ||
        port === '5173' ||
        port === '4173'); // Vite dev/preview ports

    // HTTP protocol check (more restrictive for production safety)
    const isHttpDev = protocol === 'http:' && (isLocalhost || isDevDomain);

    // Additional safety check - never consider production domains as development
    const isProductionDomain =
      hostname.includes('vercel.app') ||
      hostname.includes('netlify.app') ||
      hostname.includes('herokuapp.com') ||
      hostname.includes('hunkcentral.com') ||
      hostname.includes('collegehunks.com');

    if (isProductionDomain) {
      return false; // Force production mode for known production domains
    }

    return isLocalhost || isDevDomain || isDevPort || isHttpDev;
  } catch {
    // If detection fails, assume production for maximum safety
    return false;
  }
})();

// Production environment detection with additional safety checks
const isProduction = !isDevelopment;

// Production logging helper - only logs in development
const logInDevelopment = (message, ...args) => {
  if (isDevelopment) {
    console.info(`SW ${SW_VERSION}:`, message, ...args);
  }
};

// Production error logging - logs errors in both environments but with different detail levels
const logError = (message, error, ...args) => {
  if (isDevelopment) {
    console.error(`SW ${SW_VERSION} ERROR:`, message, error, ...args);
  } else {
    // In production, log minimal error info to avoid exposing sensitive data
    console.error(`SW ${SW_VERSION}:`, message);
  }
};

// Simplified caching strategy - ultra-minimal assets to avoid navigation conflicts
const ESSENTIAL_STATIC_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico',
];

// Production-optimized asset patterns for selective caching (more restrictive)
const CACHEABLE_ASSET_PATTERNS = [
  // Only cache truly static assets that never change
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /\.(woff|woff2|ttf|eot)$/,
  /\/manifest\.json$/,
  /\/favicon\.ico$/,
  // Exclude dynamic or frequently changing assets
  /^(?!.*\/(api|_next\/static\/chunks|_next\/static\/webpack)).*\.(css|js)$/,
];

// Ultra-conservative API caching - only health check and safe navigation endpoints
const SAFE_API_ROUTES = [
  '/api/health',
  // Removed other API routes for maximum production safety
  // Navigation endpoints will use network-first strategy without caching
];

// Routes that should NEVER be cached to prevent navigation conflicts
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth\//,
  /\/auth\//,
  /\/login/,
  /\/logout/,
  /\/_next\/static\/chunks\//,
  /\/_next\/static\/webpack\//,
  /\/sw\.js$/,
  /\/workbox-/,
  /\/__nextjs_original-stack-frame/,
];

// Cache configuration with environment-specific settings and production safety
const CACHE_CONFIG = {
  // Static assets cache duration (more conservative in production)
  staticMaxAge: isDevelopment ? 1 * 60 * 1000 : 12 * 60 * 60 * 1000, // 1 min dev, 12 hours prod (reduced from 24h)

  // Runtime cache duration (very short for production safety)
  runtimeMaxAge: isDevelopment ? 30 * 1000 : 2 * 60 * 1000, // 30 sec dev, 2 min prod (reduced from 5 min)

  // API cache duration (minimal for production safety)
  apiMaxAge: isDevelopment ? 10 * 1000 : 1 * 60 * 1000, // 10 sec dev, 1 min prod (reduced from 2 min)

  // Maximum cache entries to prevent unlimited growth (more restrictive)
  maxStaticEntries: isDevelopment ? 100 : 30, // Fewer entries in production
  maxRuntimeEntries: isDevelopment ? 50 : 15, // Much fewer runtime entries in production
  maxApiEntries: isDevelopment ? 30 : 5, // Minimal API caching in production

  // Cache cleanup thresholds
  cleanupThreshold: isDevelopment ? 0.8 : 0.6, // Clean up earlier in production

  // Network timeout settings
  networkTimeout: isDevelopment ? 10000 : 5000, // Shorter timeout in production

  // Retry settings
  maxRetries: isDevelopment ? 3 : 1, // Fewer retries in production
  retryDelay: isDevelopment ? 1000 : 500, // Shorter retry delay in production
};

// Install event - simplified installation with graceful degradation
self.addEventListener('install', (event) => {
  logInDevelopment(
    'Installing service worker',
    SW_VERSION,
    `(${isDevelopment ? 'development' : 'production'} mode)`
  );

  // Simplified installation strategy that never fails
  event.waitUntil(
    performInstallation()
      .then(() => {
        logInDevelopment('Installation completed successfully');

        // Environment-specific activation strategy
        if (isDevelopment) {
          // In development, skip waiting for faster iteration
          return self.skipWaiting();
        } else {
          // In production, wait for user consent to avoid disrupting active sessions
          logInDevelopment('Waiting for activation (production mode)');
        }
      })
      .catch((error) => {
        logError(
          'Installation failed, continuing with graceful degradation',
          error
        );

        // Installation failure should never prevent the service worker from being installed
        // The app will continue to work without caching - this is acceptable
        return Promise.resolve();
      })
  );
});

async function performInstallation() {
  // Simplified installation that gracefully handles all failures
  const installationTasks = [];

  // Task 1: Cache essential static assets
  installationTasks.push(cacheEssentialAssets());

  // Task 2: Initialize offline page cache
  installationTasks.push(initializeOfflineCache());

  // Execute all tasks with graceful failure handling
  const results = await Promise.allSettled(installationTasks);

  // Log results in development
  if (isDevelopment) {
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    logInDevelopment(
      `Installation tasks completed: ${successful}/${results.length} successful`
    );
  }

  // Installation always succeeds - failures are handled gracefully
  return Promise.resolve();
}

async function cacheEssentialAssets() {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);

    // Cache essential assets with individual error handling
    const cachePromises = ESSENTIAL_STATIC_ASSETS.map(async (asset) => {
      try {
        const response = await fetch(asset, {
          cache: isDevelopment ? 'no-cache' : 'default',
          credentials: 'same-origin',
          mode: 'cors',
        });

        if (response.ok) {
          // Add metadata for cache management
          const headers = new Headers(response.headers);
          headers.set('sw-cached-at', Date.now().toString());
          headers.set('sw-version', SW_VERSION);
          headers.set(
            'sw-environment',
            isDevelopment ? 'development' : 'production'
          );

          const cachedResponse = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers,
          });

          await cache.put(asset, cachedResponse);
          logInDevelopment(`✓ Cached: ${asset}`);
          return { asset, success: true };
        } else {
          logInDevelopment(
            `✗ Failed to cache ${asset}: HTTP ${response.status}`
          );
          return { asset, success: false, reason: `HTTP ${response.status}` };
        }
      } catch (error) {
        logInDevelopment(`✗ Error caching ${asset}:`, error.message);
        return { asset, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(cachePromises);
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    logInDevelopment(
      `Static assets: ${successful}/${ESSENTIAL_STATIC_ASSETS.length} cached`
    );

    // Clean up old entries if cache is getting too large
    await cleanupStaticCache(cache);
  } catch (error) {
    logError('Static asset caching failed', error);
    // Don't throw - graceful degradation
  }
}

async function initializeOfflineCache() {
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);

    // Pre-cache a minimal offline page if it doesn't exist
    const offlinePageExists = await cache.match('/offline');
    if (!offlinePageExists) {
      const offlineResponse = createMinimalOfflinePage();
      await cache.put('/offline', offlineResponse);
      logInDevelopment('✓ Initialized offline page cache');
    }
  } catch (error) {
    logError('Offline cache initialization failed', error);
    // Don't throw - graceful degradation
  }
}

async function cleanupStaticCache(cache) {
  try {
    const requests = await cache.keys();
    if (requests.length > CACHE_CONFIG.maxStaticEntries) {
      // Remove oldest entries
      const sortedRequests = await Promise.all(
        requests.map(async (request) => {
          const response = await cache.match(request);
          const cachedAt = response?.headers.get('sw-cached-at');
          return {
            request,
            timestamp: cachedAt ? parseInt(cachedAt, 10) : 0,
          };
        })
      );

      sortedRequests.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = sortedRequests.slice(
        0,
        requests.length - CACHE_CONFIG.maxStaticEntries
      );

      await Promise.all(toDelete.map(({ request }) => cache.delete(request)));

      logInDevelopment(
        `Cleaned up ${toDelete.length} old static cache entries`
      );
    }
  } catch (error) {
    logError('Static cache cleanup failed', error);
  }
}

// Activate event - simplified activation with graceful cleanup
self.addEventListener('activate', (event) => {
  logInDevelopment(
    'Activating service worker',
    SW_VERSION,
    `(${isDevelopment ? 'development' : 'production'} mode)`
  );

  event.waitUntil(
    performActivation()
      .then(() => {
        logInDevelopment('Activation completed successfully');
      })
      .catch((error) => {
        logError('Activation encountered errors, continuing anyway', error);
        // Always continue activation - errors should not prevent the SW from working
        return Promise.resolve();
      })
  );
});

async function performActivation() {
  // Simplified activation with graceful error handling
  const activationTasks = [];

  // Task 1: Clean up old caches
  activationTasks.push(cleanupOldCaches());

  // Task 2: Handle client claiming based on environment
  activationTasks.push(handleClientClaiming());

  // Task 3: Notify clients of activation
  activationTasks.push(notifyClientsOfActivation());

  // Execute all tasks with graceful failure handling
  const results = await Promise.allSettled(activationTasks);

  // Log results in development
  if (isDevelopment) {
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    logInDevelopment(
      `Activation tasks completed: ${successful}/${results.length} successful`
    );

    // Log any failures in development
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logInDevelopment(`Activation task ${index + 1} failed:`, result.reason);
      }
    });
  }

  // Activation always succeeds - individual task failures are handled gracefully
}

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = [
      STATIC_CACHE_NAME,
      RUNTIME_CACHE_NAME,
      OFFLINE_CACHE_NAME,
    ];

    // Find old caches that need cleanup
    const oldCaches = cacheNames.filter(
      (cacheName) =>
        cacheName.startsWith('hunkcentral-') &&
        !currentCaches.includes(cacheName)
    );

    if (oldCaches.length > 0) {
      logInDevelopment(`Cleaning up ${oldCaches.length} old cache(s)`);

      // Delete old caches with individual error handling
      const cleanupPromises = oldCaches.map(async (cacheName) => {
        try {
          const deleted = await caches.delete(cacheName);
          logInDevelopment(`✓ Deleted cache: ${cacheName}`);
          return { cacheName, success: true, deleted };
        } catch (error) {
          logInDevelopment(
            `✗ Failed to delete cache ${cacheName}:`,
            error.message
          );
          return { cacheName, success: false, error: error.message };
        }
      });

      const results = await Promise.allSettled(cleanupPromises);
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.success && r.value.deleted
      ).length;

      logInDevelopment(
        `Cache cleanup: ${successful}/${oldCaches.length} caches deleted`
      );
    } else {
      logInDevelopment('No old caches to clean up');
    }
  } catch (error) {
    logError('Cache cleanup failed', error);
    // Don't throw - cleanup failure shouldn't prevent activation
  }
}

async function handleClientClaiming() {
  try {
    if (isDevelopment) {
      // In development, claim clients immediately for faster iteration
      await self.clients.claim();
      logInDevelopment('✓ Claimed all clients (development mode)');
    } else {
      // In production, use conservative claiming strategy
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });

      if (clients.length === 0) {
        // No active clients - safe to claim
        await self.clients.claim();
        logInDevelopment('✓ Claimed clients (no active sessions)');
      } else {
        // Active clients exist - let them control when to update
        logInDevelopment(
          `⏸ Skipped claiming (${clients.length} active sessions)`
        );

        // Notify clients that an update is available
        clients.forEach((client) => {
          try {
            client.postMessage({
              type: 'SW_UPDATE_AVAILABLE',
              version: SW_VERSION,
              timestamp: Date.now(),
            });
          } catch (error) {
            logInDevelopment(
              'Failed to notify client of update:',
              error.message
            );
          }
        });
      }
    }
  } catch (error) {
    logError('Client claiming failed', error);
    // Don't throw - claiming failure shouldn't prevent activation
  }
}

async function notifyClientsOfActivation() {
  try {
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    });

    if (clients.length > 0) {
      // Notify all clients of successful activation
      const notifications = clients.map((client) => {
        try {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: SW_VERSION,
            environment: isDevelopment ? 'development' : 'production',
            timestamp: Date.now(),
            cacheStrategy: 'simplified-production',
          });
          return { success: true };
        } catch (error) {
          logInDevelopment('Failed to notify client:', error.message);
          return { success: false, error: error.message };
        }
      });

      const successful = notifications.filter((n) => n.success).length;
      logInDevelopment(
        `✓ Notified ${successful}/${clients.length} clients of activation`
      );
    } else {
      logInDevelopment('No clients to notify of activation');
    }
  } catch (error) {
    logError('Client notification failed', error);
    // Don't throw - notification failure shouldn't prevent activation
  }
}

// Fetch event - ultra-conservative strategy with maximum graceful degradation
self.addEventListener('fetch', (event) => {
  const { request } = event;

  try {
    const url = new URL(request.url);

    // Ultra-conservative filtering - only handle very safe requests
    if (!shouldHandleRequest(request, url)) {
      return; // Let browser handle normally
    }

    // In production, be extremely selective about what we handle
    if (isProduction) {
      // Only handle static assets and health check API in production
      if (isStaticAsset(url) && shouldCacheAsset(url)) {
        event.respondWith(
          handleStaticAsset(request, url).catch(() => {
            // If our handler fails, fall back to network
            return fetch(request);
          })
        );
      } else if (url.pathname === '/api/health') {
        event.respondWith(
          handleApiRequest(request, url).catch(() => {
            // If our handler fails, fall back to network
            return fetch(request);
          })
        );
      }
      // Let browser handle everything else in production
      return;
    }

    // In development, handle more request types but still be conservative
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(
        handleApiRequest(request, url).catch(() => {
          // If our handler fails, fall back to network
          return fetch(request);
        })
      );
    } else if (isStaticAsset(url)) {
      event.respondWith(
        handleStaticAsset(request, url).catch(() => {
          // If our handler fails, fall back to network
          return fetch(request);
        })
      );
    }
    // Never handle page requests to avoid navigation conflicts
    // Let browser handle all page requests normally
  } catch (error) {
    // URL parsing or handler setup error - let browser handle normally
    logError('Fetch event handler error', error);
    // Don't call event.respondWith() if there's an error in setup
  }
});

// Ultra-conservative request filtering with enhanced production safety
function shouldHandleRequest(request, url) {
  try {
    // Only handle GET requests to avoid interfering with mutations
    if (request.method !== 'GET') {
      return false;
    }

    // Only handle same-origin requests for security
    if (url.origin !== self.location.origin) {
      return false;
    }

    // NEVER handle navigation requests to completely avoid redirect conflicts
    if (request.mode === 'navigate' || request.destination === 'document') {
      return false;
    }

    // Skip ALL requests with any redirect mode in production for maximum safety
    if (isProduction && request.redirect !== 'follow') {
      return false;
    }

    // Skip requests with problematic redirect modes
    if (request.redirect === 'error' || request.redirect === 'manual') {
      return false;
    }

    // Skip requests with cache-control directives that indicate freshness requirements
    const cacheControl = request.headers.get('cache-control');
    if (
      cacheControl &&
      (cacheControl.includes('no-store') ||
        cacheControl.includes('no-cache') ||
        cacheControl.includes('must-revalidate'))
    ) {
      return false;
    }

    // Check against never-cache patterns
    if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
      return false;
    }

    // In development, be more permissive but still safe
    if (isDevelopment) {
      // Skip webpack HMR and dev server requests
      if (
        url.pathname.includes('/_next/') &&
        (url.pathname.includes('webpack-hmr') ||
          url.pathname.includes('hot-update') ||
          url.pathname.includes('webpack'))
      ) {
        return false;
      }

      // Skip Next.js internal requests
      if (
        url.pathname.startsWith('/_next/static/chunks/') ||
        url.pathname.startsWith('/__nextjs_original-stack-frame')
      ) {
        return false;
      }
    }

    // In production, be extra conservative
    if (isProduction) {
      // Skip any request with query parameters (often dynamic)
      if (url.search && url.search.length > 1) {
        return false;
      }

      // Skip requests with certain headers that indicate dynamic content
      const accept = request.headers.get('accept');
      if (accept && accept.includes('text/event-stream')) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logError('Request filtering error', error);
    // In case of any error, be ultra-conservative and don't handle the request
    return false;
  }
}

function isPageRequest(request) {
  try {
    const accept = request.headers.get('accept');
    return (
      (accept && accept.includes('text/html')) ||
      request.destination === 'document' ||
      request.destination === 'iframe'
    );
  } catch {
    return false;
  }
}

function isStaticAsset(url) {
  try {
    const pathname = url.pathname.toLowerCase();

    // Check against cacheable patterns
    return CACHEABLE_ASSET_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

function isCacheableAsset(url) {
  try {
    const pathname = url.pathname.toLowerCase();

    // Check against never-cache patterns first
    if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(pathname))) {
      return false;
    }

    // Essential assets are always cacheable
    if (ESSENTIAL_STATIC_ASSETS.includes(pathname)) {
      return true;
    }

    // Check against patterns
    return CACHEABLE_ASSET_PATTERNS.some((pattern) => pattern.test(pathname));
  } catch {
    return false;
  }
}

function shouldCacheAsset(url) {
  try {
    const pathname = url.pathname.toLowerCase();

    // In production, be more selective about what we cache
    if (isProduction) {
      // Only cache truly static assets that are unlikely to change
      const isStaticAsset =
        /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/.test(pathname);
      const isManifest = pathname === '/manifest.json';
      const isFavicon = pathname === '/favicon.ico';

      return isStaticAsset || isManifest || isFavicon;
    }

    // In development, cache more liberally for better DX
    return isCacheableAsset(url);
  } catch {
    return false;
  }
}

// Ultra-conservative API request handling - network-only with minimal fallback
async function handleApiRequest(request, url) {
  const isSafeRoute = SAFE_API_ROUTES.some((route) =>
    url.pathname.startsWith(route)
  );

  try {
    // Add network timeout for production reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CACHE_CONFIG.networkTimeout
    );

    // Always try network first for fresh data with timeout
    const networkResponse = await fetch(request.clone(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Only cache successful responses from safe routes and only in development
    if (networkResponse.ok && isSafeRoute && isDevelopment) {
      // Cache in background - don't wait for it, and only in development
      cacheApiResponse(request, networkResponse.clone()).catch((error) => {
        logError('Background API caching failed', error);
      });
    }

    return networkResponse;
  } catch (networkError) {
    logInDevelopment('API network request failed:', url.pathname);

    // In production, be ultra-conservative - only provide fallback for health check
    if (isSafeRoute && url.pathname === '/api/health') {
      try {
        const cachedResponse = await getCachedApiResponse(request);
        if (cachedResponse) {
          logInDevelopment('Serving cached API response:', url.pathname);
          return cachedResponse;
        }
      } catch (cacheError) {
        logError('API cache lookup failed', cacheError);
      }
    }

    // For all other API routes, let the network error propagate naturally
    // This ensures proper error handling by the application
    if (!isSafeRoute || isProduction) {
      throw networkError;
    }

    // Only provide offline response for safe routes in development
    return createOfflineApiResponse(url.pathname);
  }
}

async function cacheApiResponse(request, response) {
  try {
    const cache = await caches.open(RUNTIME_CACHE_NAME);

    // Add metadata for cache management
    const headers = new Headers(response.headers);
    headers.set('sw-cached-at', Date.now().toString());
    headers.set('sw-version', SW_VERSION);
    headers.set('sw-max-age', CACHE_CONFIG.apiMaxAge.toString());

    const cachedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });

    await cache.put(request, cachedResponse);

    // Clean up old entries
    await cleanupRuntimeCache(cache);
  } catch (error) {
    logError('API response caching failed', error);
  }
}

async function getCachedApiResponse(request) {
  try {
    const cache = await caches.open(RUNTIME_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (
      cachedResponse &&
      isCacheValid(cachedResponse, CACHE_CONFIG.apiMaxAge)
    ) {
      return cachedResponse;
    }

    // Remove expired cache entry
    if (cachedResponse) {
      await cache.delete(request);
    }

    return null;
  } catch (error) {
    logError('Cached API response lookup failed', error);
    return null;
  }
}

function createOfflineApiResponse(pathname) {
  const offlineData = {
    error: 'Network unavailable',
    message: 'Please check your internet connection and try again.',
    offline: true,
    timestamp: Date.now(),
    path: pathname,
  };

  return new Response(JSON.stringify(offlineData), {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'SW-Offline-Response': 'true',
    },
  });
}

// Check if cached response is still valid
function isCacheValid(response, maxAge = null) {
  try {
    const cachedAt = response.headers.get('sw-cached-at');
    if (!cachedAt) return false;

    const cacheAge = Date.now() - parseInt(cachedAt, 10);
    const maxCacheAge =
      maxAge ||
      parseInt(response.headers.get('sw-max-age') || '0', 10) ||
      CACHE_CONFIG.runtimeMaxAge;

    return cacheAge < maxCacheAge;
  } catch {
    return false;
  }
}

async function cleanupRuntimeCache(cache) {
  try {
    const requests = await cache.keys();
    if (requests.length > CACHE_CONFIG.maxRuntimeEntries) {
      // Remove oldest entries
      const sortedRequests = await Promise.all(
        requests.map(async (request) => {
          try {
            const response = await cache.match(request);
            const cachedAt = response?.headers.get('sw-cached-at');
            return {
              request,
              timestamp: cachedAt ? parseInt(cachedAt, 10) : 0,
            };
          } catch {
            return { request, timestamp: 0 };
          }
        })
      );

      sortedRequests.sort((a, b) => a.timestamp - b.timestamp);
      const toDelete = sortedRequests.slice(
        0,
        requests.length - CACHE_CONFIG.maxRuntimeEntries
      );

      await Promise.all(
        toDelete.map(({ request }) => cache.delete(request).catch(() => {}))
      );

      logInDevelopment(
        `Cleaned up ${toDelete.length} old runtime cache entries`
      );
    }
  } catch (error) {
    logError('Runtime cache cleanup failed', error);
  }
}

// Ultra-conservative page request handling - network-only with no caching
async function handlePageRequest(request, url) {
  // In production, we should NEVER handle page requests to avoid any navigation conflicts
  if (isProduction) {
    // Let the browser handle all page requests naturally in production
    return fetch(request);
  }

  // In development, still be very conservative
  try {
    // Add network timeout for reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CACHE_CONFIG.networkTimeout
    );

    // Always use network for page requests to ensure fresh content and proper redirects
    const networkResponse = await fetch(request.clone(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // NEVER cache page responses to prevent navigation conflicts and stale content
    // This is the safest approach for production stability

    return networkResponse;
  } catch (networkError) {
    logInDevelopment('Page network request failed:', url.pathname);

    // Only provide offline fallback in development for non-critical pages
    if (isDevelopment && shouldProvideOfflineFallback(url)) {
      return await getOfflineFallback(url);
    }

    // For all other cases, let the error propagate naturally
    throw networkError;
  }
}

function shouldProvideOfflineFallback(url) {
  const pathname = url.pathname;

  // Never provide offline fallback for authentication pages
  if (
    pathname.includes('/auth/') ||
    pathname.includes('/login') ||
    pathname.includes('/logout') ||
    pathname.startsWith('/api/auth/')
  ) {
    return false;
  }

  // Never provide offline fallback for admin pages
  if (pathname.includes('/admin/')) {
    return false;
  }

  // Provide offline fallback for general app pages
  return true;
}

async function getOfflineFallback(url) {
  try {
    // Try to get the cached offline page
    const offlineCache = await caches.open(OFFLINE_CACHE_NAME);
    const offlineResponse = await offlineCache.match('/offline');

    if (offlineResponse) {
      logInDevelopment('Serving cached offline page');
      return offlineResponse;
    }

    // Fallback to creating a minimal offline page
    logInDevelopment('Creating minimal offline page');
    return createMinimalOfflinePage();
  } catch (error) {
    logError('Offline fallback failed', error);
    return createMinimalOfflinePage();
  }
}

// Create a minimal offline page
function createMinimalOfflinePage() {
  const offlineHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Offline - HUNKCentral</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#026937">
    <style>
      * { box-sizing: border-box; }
      body { 
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
        text-align: center; 
        padding: 1rem; 
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .container { 
        max-width: 420px; 
        width: 100%;
        background: white; 
        padding: 2.5rem 2rem; 
        border-radius: 16px; 
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        border: 1px solid rgba(255,255,255,0.2);
      }
      .logo { 
        width: 72px; 
        height: 72px; 
        background: linear-gradient(135deg, #026937 0%, #024d2a 100%); 
        border-radius: 16px; 
        margin: 0 auto 2rem; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        color: white; 
        font-size: 28px;
        font-weight: 700;
        box-shadow: 0 4px 16px rgba(2, 105, 55, 0.3);
      }
      h1 { 
        color: #026937; 
        margin-bottom: 1rem; 
        font-size: 1.75rem;
        font-weight: 600;
        line-height: 1.2;
      }
      p { 
        color: #6c757d; 
        margin-bottom: 2.5rem; 
        line-height: 1.6;
        font-size: 1rem;
      }
      .button-group {
        display: flex;
        gap: 1rem;
        flex-direction: column;
      }
      button { 
        background: linear-gradient(135deg, #026937 0%, #024d2a 100%); 
        color: white; 
        border: none; 
        padding: 14px 28px; 
        border-radius: 10px; 
        cursor: pointer; 
        font-size: 16px;
        font-weight: 600;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(2, 105, 55, 0.2);
      }
      button:hover { 
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(2, 105, 55, 0.3);
      }
      button:active {
        transform: translateY(0);
      }
      .secondary-button {
        background: transparent;
        color: #026937;
        border: 2px solid #026937;
        box-shadow: none;
      }
      .secondary-button:hover {
        background: #026937;
        color: white;
      }
      .status {
        margin-top: 2rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
        font-size: 0.875rem;
        color: #6c757d;
      }
      @media (max-width: 480px) {
        .container { padding: 2rem 1.5rem; }
        h1 { font-size: 1.5rem; }
        .button-group { gap: 0.75rem; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">HC</div>
      <h1>You're Offline</h1>
      <p>HUNKCentral requires an internet connection to function properly. Please check your connection and try again.</p>
      <div class="button-group">
        <button onclick="window.location.reload()">Try Again</button>
        <button class="secondary-button" onclick="checkConnection()">Check Connection</button>
      </div>
      <div class="status" id="status">
        Service Worker: Active | Environment: ${isDevelopment ? 'Development' : 'Production'}
      </div>
    </div>
    <script>
      function checkConnection() {
        const status = document.getElementById('status');
        status.textContent = 'Checking connection...';
        
        fetch('/api/health', { cache: 'no-cache' })
          .then(response => {
            if (response.ok) {
              status.textContent = 'Connection restored! Reloading...';
              setTimeout(() => window.location.reload(), 1000);
            } else {
              status.textContent = 'Still offline. Please try again later.';
            }
          })
          .catch(() => {
            status.textContent = 'Still offline. Please check your internet connection.';
          });
      }
      
      // Auto-check connection every 30 seconds
      setInterval(() => {
        if (navigator.onLine) {
          checkConnection();
        }
      }, 30000);
      
      // Listen for online event
      window.addEventListener('online', () => {
        document.getElementById('status').textContent = 'Connection detected! Reloading...';
        setTimeout(() => window.location.reload(), 500);
      });
    </script>
  </body>
</html>`;

  return new Response(offlineHtml, {
    status: 200,
    statusText: 'OK',
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'SW-Offline-Page': 'true',
    },
  });
}

// Conservative static asset handling - cache-first for truly static assets only
async function handleStaticAsset(request, url) {
  const isCacheable = isCacheableAsset(url);

  if (!isCacheable) {
    // Let browser handle non-cacheable assets normally
    return fetch(request);
  }

  try {
    // Try cache first for cacheable assets, but with validation
    const cachedResponse = await getCachedStaticAsset(request);
    if (
      cachedResponse &&
      isCacheValid(cachedResponse, CACHE_CONFIG.staticMaxAge)
    ) {
      logInDevelopment('Serving cached asset:', url.pathname);
      return cachedResponse;
    }

    // Add network timeout for reliability
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CACHE_CONFIG.networkTimeout
    );

    // Try network with timeout
    const networkResponse = await fetch(request.clone(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Cache successful responses in background, but be more selective
    if (networkResponse.ok && shouldCacheAsset(url)) {
      cacheStaticAsset(request, networkResponse.clone()).catch((error) => {
        logError('Background static asset caching failed', error);
      });
    }

    return networkResponse;
  } catch (networkError) {
    logInDevelopment('Static asset network request failed:', url.pathname);

    // Try cache as fallback (even if expired)
    try {
      const cachedResponse = await getCachedStaticAsset(request, true);
      if (cachedResponse) {
        logInDevelopment('Serving stale cached asset:', url.pathname);
        return cachedResponse;
      }
    } catch (cacheError) {
      logError('Static asset cache lookup failed', cacheError);
    }

    // Return appropriate error response
    return createAssetNotFoundResponse(url.pathname);
  }
}

async function getCachedStaticAsset(request, allowStale = false) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      if (
        allowStale ||
        isCacheValid(cachedResponse, CACHE_CONFIG.staticMaxAge)
      ) {
        return cachedResponse;
      }

      // Remove expired cache entry
      await cache.delete(request);
    }

    return null;
  } catch (error) {
    logError('Cached static asset lookup failed', error);
    return null;
  }
}

async function cacheStaticAsset(request, response) {
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);

    // Add metadata for cache management
    const headers = new Headers(response.headers);
    headers.set('sw-cached-at', Date.now().toString());
    headers.set('sw-version', SW_VERSION);
    headers.set('sw-max-age', CACHE_CONFIG.staticMaxAge.toString());

    const cachedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });

    await cache.put(request, cachedResponse);

    // Clean up old entries
    await cleanupStaticCache(cache);
  } catch (error) {
    logError('Static asset caching failed', error);
  }
}

function createAssetNotFoundResponse(pathname) {
  const isImage = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i.test(pathname);

  if (isImage) {
    // Return a minimal 1x1 transparent PNG for missing images
    const transparentPng =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    return new Response(atob(transparentPng), {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'SW-Fallback-Image': 'true',
      },
    });
  }

  // Return 404 for other asset types
  return new Response(`Asset not found: ${pathname}`, {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
    },
  });
}

// Simplified background sync - minimal implementation
self.addEventListener('sync', (event) => {
  logInDevelopment('Background sync event:', event.tag);

  // Only handle essential sync operations
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(performCacheCleanup());
  }

  // Other sync operations are handled through normal app flow
});

// Simplified push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) {
    logInDevelopment('Push event received without data');
    return;
  }

  try {
    const data = event.data.json();

    // Simplified notification options for production stability
    const options = {
      body: data.body || 'New notification from HUNKCentral',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || `hunkcentral-${Date.now()}`,
      requireInteraction: false,
      silent: false,
      data: {
        url: data.url || '/',
        timestamp: Date.now(),
      },
    };

    event.waitUntil(
      self.registration
        .showNotification(data.title || 'HUNKCentral', options)
        .catch((error) => {
          logError('Push notification failed', error);
        })
    );
  } catch (error) {
    logError('Push notification data parsing failed', error);
  }
});

// Simplified notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(handleNotificationClick(targetUrl));
});

async function handleNotificationClick(targetUrl) {
  try {
    const clients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    });

    // Focus existing window if available
    for (const client of clients) {
      if (client.url === targetUrl && 'focus' in client) {
        return client.focus();
      }
    }

    // Focus any existing window
    if (clients.length > 0 && 'focus' in clients[0]) {
      await clients[0].focus();
      // Navigate to target URL
      clients[0].postMessage({
        type: 'NAVIGATE_TO',
        url: targetUrl,
        timestamp: Date.now(),
      });
      return;
    }

    // Open new window as fallback
    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl);
    }
  } catch (error) {
    logError('Notification click handling failed', error);
  }
}

async function performCacheCleanup() {
  try {
    logInDevelopment('Performing background cache cleanup');

    // Clean up all cache types
    const cleanupTasks = [
      cleanupExpiredCaches(STATIC_CACHE_NAME, CACHE_CONFIG.staticMaxAge),
      cleanupExpiredCaches(RUNTIME_CACHE_NAME, CACHE_CONFIG.runtimeMaxAge),
      cleanupOldCaches(),
    ];

    await Promise.allSettled(cleanupTasks);
    logInDevelopment('Background cache cleanup completed');
  } catch (error) {
    logError('Background cache cleanup failed', error);
  }
}

async function cleanupExpiredCaches(cacheName, maxAge) {
  try {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    const expiredRequests = [];

    for (const request of requests) {
      try {
        const response = await cache.match(request);
        if (response && !isCacheValid(response, maxAge)) {
          expiredRequests.push(request);
        }
      } catch {
        // If we can't check the response, consider it expired
        expiredRequests.push(request);
      }
    }

    if (expiredRequests.length > 0) {
      await Promise.all(
        expiredRequests.map((request) => cache.delete(request).catch(() => {}))
      );
      logInDevelopment(
        `Cleaned up ${expiredRequests.length} expired entries from ${cacheName}`
      );
    }
  } catch (error) {
    logError(`Cleanup of ${cacheName} failed`, error);
  }
}

// Simplified message handling for communication with the main thread
self.addEventListener('message', (event) => {
  const { data, ports, source } = event;

  logInDevelopment('Received message:', data?.type);

  try {
    switch (data?.type) {
      case 'SKIP_WAITING':
        handleSkipWaiting(ports);
        break;

      case 'CLAIM_CLIENTS':
        handleClaimClients(ports);
        break;

      case 'SW_HEALTH_CHECK':
        handleHealthCheck(ports);
        break;

      case 'CLEAR_CACHE':
        handleCacheClearRequest(ports);
        break;

      case 'GET_SW_STATUS':
        handleStatusRequest(ports);
        break;

      case 'UPDATE_READY':
        handleUpdateReady(source);
        break;

      case 'CACHE_CLEANUP':
        handleCacheCleanupRequest(ports);
        break;

      case 'GET_CACHE_INFO':
        handleCacheInfoRequest(ports);
        break;

      default:
        logInDevelopment('Unknown message type:', data?.type);
        respondToPort(ports, {
          type: 'SW_ERROR',
          error: 'Unknown message type',
          messageType: data?.type,
        });
    }
  } catch (error) {
    logError('Message handling error', error);
    respondToPort(ports, {
      type: 'SW_ERROR',
      error: error.message,
      messageType: data?.type,
    });
  }
});

function respondToPort(ports, message) {
  if (ports && ports[0]) {
    try {
      ports[0].postMessage({
        ...message,
        timestamp: Date.now(),
        version: SW_VERSION,
      });
    } catch (error) {
      logError('Failed to respond to port', error);
    }
  }
}

function handleSkipWaiting(ports) {
  logInDevelopment('Skipping waiting phase');

  try {
    self.skipWaiting();
    respondToPort(ports, {
      type: 'SKIP_WAITING_RESPONSE',
      status: 'success',
    });
  } catch (error) {
    logError('Skip waiting failed', error);
    respondToPort(ports, {
      type: 'SKIP_WAITING_RESPONSE',
      status: 'error',
      error: error.message,
    });
  }
}

function handleClaimClients(ports) {
  logInDevelopment('Claiming clients');

  self.clients
    .claim()
    .then(() => {
      respondToPort(ports, {
        type: 'CLAIM_CLIENTS_RESPONSE',
        status: 'success',
      });
    })
    .catch((error) => {
      logError('Client claiming failed', error);
      respondToPort(ports, {
        type: 'CLAIM_CLIENTS_RESPONSE',
        status: 'error',
        error: error.message,
      });
    });
}

function handleHealthCheck(ports) {
  respondToPort(ports, {
    type: 'SW_HEALTH_RESPONSE',
    status: 'ok',
    version: SW_VERSION,
    cacheVersion: CACHE_VERSION,
    environment: isDevelopment ? 'development' : 'production',
    cacheStrategy: 'simplified-production',
  });
}

function handleCacheClearRequest(ports) {
  logInDevelopment('Clearing all caches');

  handleCacheClear()
    .then(() => {
      respondToPort(ports, {
        type: 'CACHE_CLEARED',
        status: 'success',
      });
    })
    .catch((error) => {
      logError('Cache clearing failed', error);
      respondToPort(ports, {
        type: 'CACHE_CLEARED',
        status: 'error',
        error: error.message,
      });
    });
}

function handleCacheCleanupRequest(ports) {
  logInDevelopment('Performing cache cleanup');

  performCacheCleanup()
    .then(() => {
      respondToPort(ports, {
        type: 'CACHE_CLEANUP_RESPONSE',
        status: 'success',
      });
    })
    .catch((error) => {
      logError('Cache cleanup failed', error);
      respondToPort(ports, {
        type: 'CACHE_CLEANUP_RESPONSE',
        status: 'error',
        error: error.message,
      });
    });
}

function handleCacheInfoRequest(ports) {
  getCacheInfo()
    .then((info) => {
      respondToPort(ports, {
        type: 'CACHE_INFO_RESPONSE',
        status: 'success',
        cacheInfo: info,
      });
    })
    .catch((error) => {
      logError('Cache info request failed', error);
      respondToPort(ports, {
        type: 'CACHE_INFO_RESPONSE',
        status: 'error',
        error: error.message,
      });
    });
}

function handleStatusRequest(ports) {
  respondToPort(ports, {
    type: 'SW_STATUS_RESPONSE',
    status: 'active',
    version: SW_VERSION,
    cacheVersion: CACHE_VERSION,
    environment: isDevelopment ? 'development' : 'production',
    cacheStrategy: 'simplified-production',
  });
}

function handleUpdateReady(source) {
  logInDevelopment('Update ready notification received');

  if (source) {
    try {
      source.postMessage({
        type: 'SW_UPDATE_ACKNOWLEDGED',
        version: SW_VERSION,
        timestamp: Date.now(),
      });
    } catch (error) {
      logError('Failed to acknowledge update', error);
    }
  }
}

async function getCacheInfo() {
  try {
    const cacheNames = await caches.keys();
    const cacheInfo = {};

    for (const cacheName of cacheNames) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        cacheInfo[cacheName] = {
          entryCount: keys.length,
          isActive: [
            STATIC_CACHE_NAME,
            RUNTIME_CACHE_NAME,
            OFFLINE_CACHE_NAME,
          ].includes(cacheName),
        };
      } catch {
        cacheInfo[cacheName] = {
          entryCount: 0,
          error: 'Unable to access cache',
        };
      }
    }

    return {
      totalCaches: cacheNames.length,
      activeCaches: [STATIC_CACHE_NAME, RUNTIME_CACHE_NAME, OFFLINE_CACHE_NAME],
      caches: cacheInfo,
    };
  } catch (error) {
    throw new Error(`Failed to get cache info: ${error.message}`);
  }
}

// Helper function for cache clearing
async function handleCacheClear() {
  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(async (cacheName) => {
      try {
        const deleted = await caches.delete(cacheName);
        logInDevelopment(
          `Cache ${cacheName}: ${deleted ? 'deleted' : 'not found'}`
        );
        return { cacheName, deleted, success: true };
      } catch (error) {
        logError(`Failed to delete cache ${cacheName}`, error);
        return {
          cacheName,
          deleted: false,
          success: false,
          error: error.message,
        };
      }
    });

    const results = await Promise.allSettled(deletePromises);
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success && r.value.deleted
    ).length;

    logInDevelopment(
      `Cache clearing: ${successful}/${cacheNames.length} caches deleted`
    );

    if (successful === 0 && cacheNames.length > 0) {
      throw new Error('No caches were successfully deleted');
    }
  } catch (error) {
    throw new Error(`Cache clearing failed: ${error.message}`);
  }
}
