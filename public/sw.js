// Conservative Service Worker Strategy
// Version 3 - Simplified caching to avoid navigation conflicts

const CACHE_VERSION = 'v3'
const STATIC_CACHE_NAME = `hunkcentral-static-${CACHE_VERSION}`
const RUNTIME_CACHE_NAME = `hunkcentral-runtime-${CACHE_VERSION}`

// Environment detection
const isDevelopment = self.location.hostname === 'localhost' || 
                     self.location.hostname === '127.0.0.1' ||
                     self.location.hostname.includes('dev')

// Minimal static assets - only essential files to avoid navigation conflicts
const ESSENTIAL_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
]

// Conservative API caching - only cache read-only, stable endpoints
const SAFE_API_ROUTES = [
  '/api/health'
  // Removed all other API routes to prevent stale data issues
]

// Maximum cache age for runtime cache (5 minutes)
const MAX_CACHE_AGE = 5 * 60 * 1000

// Install event - conservative asset caching with graceful failure
self.addEventListener('install', (event) => {
  // Skip waiting in development for faster iteration
  if (isDevelopment) {
    self.skipWaiting()
  }

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        // Cache essential assets individually with error isolation
        return Promise.allSettled(
          ESSENTIAL_ASSETS.map(async (asset) => {
            try {
              const response = await fetch(asset)
              if (response.ok) {
                return cache.put(asset, response)
              }
            } catch (error) {
              // Silently handle individual asset failures
              if (isDevelopment) {
                console.warn(`SW: Failed to cache ${asset}:`, error)
              }
            }
            return null
          })
        )
      })
      .then(() => {
        // Installation complete - don't force activation to avoid breaking sessions
      })
      .catch((error) => {
        // Installation failed - log in development only
        if (isDevelopment) {
          console.warn('SW: Installation error:', error)
        }
      })
  )
})

// Activate event - conservative cache cleanup with graceful degradation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.resolve()
      .then(async () => {
        try {
          // Clean up old cache versions
          const cacheNames = await caches.keys()
          const oldCaches = cacheNames.filter(cacheName => 
            cacheName.startsWith('hunkcentral-') && 
            !cacheName.includes(CACHE_VERSION)
          )

          // Delete old caches with error isolation
          await Promise.allSettled(
            oldCaches.map(async (cacheName) => {
              try {
                await caches.delete(cacheName)
              } catch (error) {
                if (isDevelopment) {
                  console.warn(`SW: Failed to delete cache ${cacheName}:`, error)
                }
              }
            })
          )

          // Claim clients only in development for faster iteration
          if (isDevelopment) {
            await self.clients.claim()
          }
        } catch (error) {
          // Activation error - log in development only
          if (isDevelopment) {
            console.warn('SW: Activation error:', error)
          }
        }
      })
  )
})

// Fetch event - conservative strategy with graceful degradation
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Conservative filtering - only handle safe requests
  if (!shouldHandleRequest(request, url)) {
    return // Let browser handle normally
  }

  // Route to appropriate handler with error boundaries
  try {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleApiRequest(request, url))
    } else if (isPageRequest(request)) {
      event.respondWith(handlePageRequest(request, url))
    } else if (isStaticAsset(url)) {
      event.respondWith(handleStaticAsset(request, url))
    }
  } catch (error) {
    // Handler error - let browser handle normally
    if (isDevelopment) {
      console.warn('SW: Fetch handler error:', error)
    }
  }
})

// Conservative request filtering
function shouldHandleRequest(request, url) {
  // Only handle GET requests
  if (request.method !== 'GET') {
    return false
  }

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return false
  }

  // Skip requests that could cause navigation issues
  if (request.mode === 'navigate' && request.destination === 'document') {
    // Let browser handle navigation requests normally to avoid redirect issues
    return false
  }

  // Skip requests with problematic redirect modes
  if (request.redirect === 'error' || request.redirect === 'manual') {
    return false
  }

  return true
}

function isPageRequest(request) {
  return request.headers.get('accept')?.includes('text/html') ||
         request.destination === 'document'
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
  return staticExtensions.some(ext => url.pathname.endsWith(ext))
}

// Conservative API request handling - network-only with minimal caching
async function handleApiRequest(request, url) {
  try {
    // Always try network first for API requests to ensure fresh data
    const networkResponse = await fetch(request)
    
    // Don't cache redirect responses or errors
    if (networkResponse.status >= 300) {
      return networkResponse
    }
    
    // Only cache very safe, read-only API responses
    if (networkResponse.ok && SAFE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
      try {
        const cache = await caches.open(RUNTIME_CACHE_NAME)
        // Add timestamp to cached response for expiration
        const responseToCache = networkResponse.clone()
        const headers = new Headers(responseToCache.headers)
        headers.set('sw-cached-at', Date.now().toString())
        
        const cachedResponse = new Response(responseToCache.body, {
          status: responseToCache.status,
          statusText: responseToCache.statusText,
          headers: headers
        })
        
        cache.put(request, cachedResponse)
      } catch (cacheError) {
        // Cache failure is non-critical - continue with network response
        if (isDevelopment) {
          console.warn('SW: API cache failed:', cacheError)
        }
      }
    }
    
    return networkResponse
  } catch (networkError) {
    // Network failed - try cache as fallback for safe routes only
    if (SAFE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
      try {
        const cachedResponse = await caches.match(request)
        if (cachedResponse && isCacheValid(cachedResponse)) {
          return cachedResponse
        }
      } catch (cacheError) {
        if (isDevelopment) {
          console.warn('SW: Cache lookup failed:', cacheError)
        }
      }
    }
    
    // Return structured offline response
    return new Response(
      JSON.stringify({ 
        error: 'Network unavailable', 
        message: 'Please check your internet connection and try again.',
        offline: true
      }),
      {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    )
  }
}

// Check if cached response is still valid
function isCacheValid(response) {
  const cachedAt = response.headers.get('sw-cached-at')
  if (!cachedAt) return false
  
  const cacheAge = Date.now() - parseInt(cachedAt, 10)
  return cacheAge < MAX_CACHE_AGE
}

// Conservative page request handling - network-only to avoid navigation conflicts
async function handlePageRequest(request, url) {
  try {
    // Always use network for page requests to avoid navigation issues
    const networkResponse = await fetch(request)
    
    // Don't cache any page responses to prevent stale content and navigation conflicts
    // This ensures users always get fresh content and proper redirects work
    
    return networkResponse
  } catch (networkError) {
    // Network failed - only provide offline fallback for non-auth pages
    if (url.pathname.includes('/auth/') || url.pathname.includes('/login')) {
      // Don't intercept auth pages - let them fail naturally
      throw networkError
    }
    
    // Try to serve offline page for other routes
    try {
      const offlineResponse = await caches.match('/offline')
      if (offlineResponse) {
        return offlineResponse
      }
    } catch (cacheError) {
      if (isDevelopment) {
        console.warn('SW: Offline page not found:', cacheError)
      }
    }
    
    // Minimal offline fallback
    return createOfflinePage()
  }
}

// Create a minimal offline page
function createOfflinePage() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Offline - HUNKCentral</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            text-align: center; 
            padding: 2rem; 
            background: #f8f9fa;
            margin: 0;
          }
          .container { 
            max-width: 400px; 
            margin: 2rem auto; 
            background: white; 
            padding: 2rem; 
            border-radius: 12px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          }
          .logo { 
            width: 64px; 
            height: 64px; 
            background: #026937; 
            border-radius: 12px; 
            margin: 0 auto 1.5rem; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            color: white; 
            font-size: 24px;
            font-weight: bold;
          }
          h1 { 
            color: #026937; 
            margin-bottom: 1rem; 
            font-size: 1.5rem;
          }
          p { 
            color: #666; 
            margin-bottom: 2rem; 
            line-height: 1.5;
          }
          button { 
            background: #026937; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px;
            font-weight: 500;
            transition: background-color 0.2s;
          }
          button:hover { 
            background: #024d2a; 
          }
          button:active {
            transform: translateY(1px);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">HC</div>
          <h1>You're Offline</h1>
          <p>HUNKCentral requires an internet connection. Please check your connection and try again.</p>
          <button onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>`,
    {
      status: 200,
      headers: { 
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    }
  )
}

// Conservative static asset handling - cache-first for essential assets only
async function handleStaticAsset(request, url) {
  // Only handle essential static assets to minimize cache conflicts
  const isEssential = ESSENTIAL_ASSETS.some(asset => url.pathname === asset) ||
                     url.pathname.endsWith('.png') ||
                     url.pathname.endsWith('.ico') ||
                     url.pathname.endsWith('.json')

  if (!isEssential) {
    // Let browser handle non-essential assets normally
    return fetch(request)
  }

  try {
    // Try cache first for essential assets
    const cachedResponse = await caches.match(request)
    if (cachedResponse && isCacheValid(cachedResponse)) {
      return cachedResponse
    }
    
    // Try network
    const networkResponse = await fetch(request)
    
    // Cache successful responses for essential assets only
    if (networkResponse.ok) {
      try {
        const cache = await caches.open(STATIC_CACHE_NAME)
        // Add timestamp for cache validation
        const headers = new Headers(networkResponse.headers)
        headers.set('sw-cached-at', Date.now().toString())
        
        const responseToCache = new Response(networkResponse.body, {
          status: networkResponse.status,
          statusText: networkResponse.statusText,
          headers: headers
        })
        
        cache.put(request, responseToCache)
      } catch (cacheError) {
        // Cache failure is non-critical
        if (isDevelopment) {
          console.warn('SW: Static asset cache failed:', cacheError)
        }
      }
    }
    
    return networkResponse
  } catch (networkError) {
    // Network failed - try cache as fallback
    try {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    } catch (cacheError) {
      if (isDevelopment) {
        console.warn('SW: Static asset cache lookup failed:', cacheError)
      }
    }
    
    // Return 404 for missing assets
    return new Response('Asset not found', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}

// Conservative background sync - disabled to avoid complexity and potential issues
self.addEventListener('sync', (event) => {
  // Background sync disabled in conservative mode to prevent conflicts
  // Applications should handle offline scenarios through UI feedback instead
})

// Conservative push notification handling - simplified for stability
self.addEventListener('push', (event) => {
  // Only handle push notifications if data is present and valid
  if (!event.data) {
    return
  }
  
  try {
    const data = event.data.json()
    
    // Basic notification options - avoid complex features that could cause issues
    const options = {
      body: data.body || 'New notification',
      icon: '/icon-192x192.png',
      tag: data.tag || 'hunkcentral-notification',
      requireInteraction: false, // Don't require interaction to avoid blocking
      silent: false
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'HUNKCentral', options)
        .catch((error) => {
          if (isDevelopment) {
            console.warn('SW: Notification failed:', error)
          }
        })
    )
  } catch (error) {
    // Invalid notification data - silently ignore
    if (isDevelopment) {
      console.warn('SW: Invalid push notification data:', error)
    }
  }
})

// Conservative notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  // Simple navigation - avoid complex URL handling
  const targetUrl = '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        if (clientList.length > 0) {
          return clientList[0].focus()
        }
        
        // Open new window as fallback
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
      .catch((error) => {
        if (isDevelopment) {
          console.warn('SW: Notification click handling failed:', error)
        }
      })
  )
})