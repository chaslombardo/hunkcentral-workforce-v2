const CACHE_NAME = 'hunkcentral-v1'
const STATIC_CACHE_NAME = 'hunkcentral-static-v1'
const DYNAMIC_CACHE_NAME = 'hunkcentral-dynamic-v1'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/logs/create',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files
]

// API routes that should be cached
const CACHEABLE_ROUTES = [
  '/api/logs',
  '/api/users',
  '/api/commission',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
      .catch((error) => {
        // Service Worker: Error caching static assets
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle page requests
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handlePageRequest(request))
    return
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request))
})

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful responses for cacheable routes
    if (networkResponse.ok && CACHEABLE_ROUTES.some(route => url.pathname.startsWith(route))) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    
    // Try cache if network fails
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This request requires an internet connection' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Handle page requests with cache-first strategy for static pages
async function handlePageRequest(request) {
  try {
    // Try cache first for static pages
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Try network
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    
    // Return offline page
    const offlineResponse = await caches.match('/offline')
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Fallback offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - HUNKCentral</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 2rem; 
              background: #f8f9fa;
            }
            .container { 
              max-width: 400px; 
              margin: 0 auto; 
              background: white; 
              padding: 2rem; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .logo { 
              width: 64px; 
              height: 64px; 
              background: #026937; 
              border-radius: 8px; 
              margin: 0 auto 1rem; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-size: 24px;
            }
            h1 { color: #026937; margin-bottom: 1rem; }
            p { color: #666; margin-bottom: 1.5rem; }
            button { 
              background: #026937; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              cursor: pointer; 
              font-size: 16px;
            }
            button:hover { background: #024d2a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🏢</div>
            <h1>You're Offline</h1>
            <p>HUNKCentral requires an internet connection. Please check your connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    )
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Try network
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    
    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return 404 for missing static assets
    return new Response('Not Found', { status: 404 })
  }
}

// Handle background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'log-submission') {
    event.waitUntil(syncLogSubmissions())
  }
  
  if (event.tag === 'commission-submission') {
    event.waitUntil(syncCommissionSubmissions())
  }
})

// Sync offline log submissions
async function syncLogSubmissions() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const requests = await cache.keys()
    
    const logSubmissions = requests.filter(request => 
      request.url.includes('/api/logs') && request.method === 'POST'
    )
    
    for (const request of logSubmissions) {
      try {
        const response = await fetch(request)
        if (response.ok) {
          await cache.delete(request)
        }
      } catch (error) {
        // Service Worker: Failed to sync log submission
      }
    }
  } catch (error) {
    // Service Worker: Error syncing log submissions
  }
}

// Sync offline commission submissions
async function syncCommissionSubmissions() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const requests = await cache.keys()
    
    const commissionSubmissions = requests.filter(request => 
      request.url.includes('/api/commission') && request.method === 'POST'
    )
    
    for (const request of commissionSubmissions) {
      try {
        const response = await fetch(request)
        if (response.ok) {
          await cache.delete(request)
        }
      } catch (error) {
        // Service Worker: Failed to sync commission submission
      }
    }
  } catch (error) {
    // Service Worker: Error syncing commission submissions
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    actions: data.actions || []
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})